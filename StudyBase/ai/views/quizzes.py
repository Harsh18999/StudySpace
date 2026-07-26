from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from spaces.permissions import IsSpaceOwner
from rest_framework.exceptions import ValidationError
import uuid
import datetime
from django.utils import timezone

from spaces.models import Module, Space
from ai.models import (
    ResourseQuizes as ResourseQuizesModel,
    ModuleQuizes,
    ResourseQuizes,
    ResourceQuizAttempt,
    ModuleQuizAttempt,
    ModuleGenerationJob,
)
from ai.serializers import (
    QuizeSerializer,
    ModuleQuizeSerializer,
    ModuleQuizModelSerializer,
    SpaceModuleQuizesModelSerializer,
    StartQuizAttemptSerializer,
    SaveQuizAttemptSerializer,
    ModuleQuizAttemptSerializer,
    ResourceQuizAttemptSerializer,
)
from ai.tasks import run_module_workflow


class QuizesViewSet(DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsSpaceOwner]
    serializer_class = QuizeSerializer

    def get_queryset(self):
        return ResourseQuizesModel.objects.filter(
            resource__module__space__user=self.request.user,
        )


from payments.utils import calculate_module_credit_cost, check_user_has_credits


class ModuleQuizView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ModuleQuizeSerializer)
    def post(self, request):
        serializer = ModuleQuizeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instruction_data = serializer.validated_data["instruction"]
        resource_ids = [str(r) for r in serializer.validated_data["resources"]]
        module_id = str(serializer.validated_data["module"])
        job_id = str(serializer.validated_data.get("job_id") or uuid.uuid4())

        if instruction_data['type'] == 'notes':
            raise ValidationError("Notes type is not allowed for module quizzes.")

        resource_count = len(resource_ids)
        item_count = instruction_data.get("number_of_items", 10)
        required_credits = calculate_module_credit_cost(resource_count, item_count)
        has_credits, balance = check_user_has_credits(request.user, required_credits)

        if not has_credits:
            return Response(
                {
                    "message": "Insufficient credits",
                    "detail": f"Insufficient credits. This request requires {required_credits} credits, but your current balance is {balance} credits.",
                    "required_credits": required_credits,
                    "current_balance": balance,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            module = Module.objects.select_related("space").get(
                pk=module_id,
                space__user=request.user,
            )
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        ModuleGenerationJob.objects.create(
            job_id=job_id,
            module=module,
            status="pending",
            message="Queued",
        )

        run_module_workflow.delay(
            job_id=job_id,
            module_id=module_id,
            resource_ids=resource_ids,
            instruction_data={
                "type": instruction_data["type"],
                "title": instruction_data["title"],
                "text": instruction_data["text"],
                "item_count": instruction_data.get("number_of_items", 10),
            },
        )

        return Response(
            {
                "job_id": job_id,
                "poll_url": f"/api/ai/jobs/module/{job_id}/",
                "detail": (
                    "Workflow started. Poll poll_url every few seconds "
                    "to track status and retrieve the final result."
                ),
            },
            status=status.HTTP_202_ACCEPTED,
        )

    def get(self, request):
        module_id = request.query_params.get("module_id")
        if not module_id:
            raise ValidationError("Module ID is required.")
        try:
            module = Module.objects.select_related("space").get(
                pk=module_id,
                space__user=request.user,
            )
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)

        quizzes = ModuleQuizes.objects.filter(module=module).order_by("-created_at")
        return Response(ModuleQuizModelSerializer(quizzes, many=True).data, status=status.HTTP_200_OK)


class SpaceModuleQuizViewSet(RetrieveModelMixin, GenericViewSet):
    """Read-only viewset for retrieving all module quizzes grouped by modules for a space."""
    permission_classes = [IsSpaceOwner]
    serializer_class = SpaceModuleQuizesModelSerializer

    def get_queryset(self):
        return Space.objects.filter(
            user=self.request.user
        )


class ModuleQuizDetailViewSet(RetrieveModelMixin, GenericViewSet):
    """Read-only viewset for individual module quiz detail retrieval by quiz_id."""
    permission_classes = [IsSpaceOwner]
    serializer_class = ModuleQuizModelSerializer

    def get_queryset(self):
        return ModuleQuizes.objects.filter(
            module__space__user=self.request.user
        )


def calculate_quiz_score(questions: list, user_answers: dict) -> tuple[float, int]:
    total = len(questions) if isinstance(questions, list) else 0
    if total == 0:
        return 0.0, 0
    correct = 0
    for idx, q in enumerate(questions):
        ans = user_answers.get(str(idx)) or user_answers.get(idx)
        expected = q.get("answer", "") if isinstance(q, dict) else ""
        if ans and str(ans).strip().lower() == str(expected).strip().lower():
            correct += 1
    return float(correct), total


class StartModuleQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartQuizAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz_id = serializer.validated_data["quiz_id"]
        duration_minutes = serializer.validated_data["duration_minutes"]

        try:
            quiz = ModuleQuizes.objects.select_related("module__space").get(
                pk=quiz_id,
                module__space__user=request.user
            )
        except ModuleQuizes.DoesNotExist:
            return Response({"detail": "Quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        attempt, created = ModuleQuizAttempt.objects.get_or_create(
            quiz=quiz,
            defaults={
                "expires_at": timezone.now() + datetime.timedelta(minutes=duration_minutes),
                "total_questions": len(quiz.content) if isinstance(quiz.content, list) else 0,
                "status": "IN_PROGRESS",
            }
        )

        if not created:
            if attempt.status in ["SUBMITTED", "EXPIRED"]:
                return Response(
                    {
                        "detail": "Quiz has already been attempted.",
                        "attempt": ModuleQuizAttemptSerializer(attempt).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if timezone.now() >= attempt.expires_at:
                attempt.status = "EXPIRED"
                attempt.submitted_at = attempt.expires_at
                score, total = calculate_quiz_score(quiz.content, attempt.user_answers)
                attempt.score = score
                attempt.total_questions = total
                attempt.save()
                return Response(
                    {
                        "detail": "Quiz time limit has expired.",
                        "attempt": ModuleQuizAttemptSerializer(attempt).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(ModuleQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class SaveModuleQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaveQuizAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz_id = serializer.validated_data["quiz_id"]
        user_answers = serializer.validated_data.get("user_answers", {})
        submit = serializer.validated_data.get("submit", False)

        try:
            attempt = ModuleQuizAttempt.objects.select_related("quiz__module__space").get(
                quiz_id=quiz_id,
                quiz__module__space__user=request.user
            )
        except ModuleQuizAttempt.DoesNotExist:
            return Response({"detail": "No active attempt found for this quiz."}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status in ["SUBMITTED", "EXPIRED"]:
            return Response(ModuleQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)

        if user_answers:
            attempt.user_answers = {**attempt.user_answers, **user_answers}

        if timezone.now() >= attempt.expires_at:
            attempt.status = "EXPIRED"
            attempt.submitted_at = attempt.expires_at
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.save()
            return Response(ModuleQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)

        if submit:
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.status = "SUBMITTED"
            attempt.submitted_at = timezone.now()
            attempt.save()
        else:
            attempt.save()

        return Response(ModuleQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class RetrieveModuleQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            attempt = ModuleQuizAttempt.objects.select_related("quiz__module__space").get(
                quiz_id=quiz_id,
                quiz__module__space__user=request.user
            )
        except ModuleQuizAttempt.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

        if attempt.status == "IN_PROGRESS" and timezone.now() >= attempt.expires_at:
            attempt.status = "EXPIRED"
            attempt.submitted_at = attempt.expires_at
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.save()

        return Response(ModuleQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class StartResourceQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartQuizAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz_id = serializer.validated_data["quiz_id"]
        duration_minutes = serializer.validated_data["duration_minutes"]

        try:
            quiz = ResourseQuizes.objects.select_related("resource__module__space").get(
                pk=quiz_id,
                resource__module__space__user=request.user
            )
        except ResourseQuizes.DoesNotExist:
            return Response({"detail": "Resource quiz not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        attempt, created = ResourceQuizAttempt.objects.get_or_create(
            quiz=quiz,
            defaults={
                "expires_at": timezone.now() + datetime.timedelta(minutes=duration_minutes),
                "total_questions": len(quiz.content) if isinstance(quiz.content, list) else 0,
                "status": "IN_PROGRESS",
            }
        )

        if not created:
            if attempt.status in ["SUBMITTED", "EXPIRED"]:
                return Response(
                    {
                        "detail": "Quiz has already been attempted.",
                        "attempt": ResourceQuizAttemptSerializer(attempt).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if timezone.now() >= attempt.expires_at:
                attempt.status = "EXPIRED"
                attempt.submitted_at = attempt.expires_at
                score, total = calculate_quiz_score(quiz.content, attempt.user_answers)
                attempt.score = score
                attempt.total_questions = total
                attempt.save()
                return Response(
                    {
                        "detail": "Quiz time limit has expired.",
                        "attempt": ResourceQuizAttemptSerializer(attempt).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(ResourceQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class SaveResourceQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaveQuizAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz_id = serializer.validated_data["quiz_id"]
        user_answers = serializer.validated_data.get("user_answers", {})
        submit = serializer.validated_data.get("submit", False)

        try:
            attempt = ResourceQuizAttempt.objects.select_related("quiz__resource__module__space").get(
                quiz_id=quiz_id,
                quiz__resource__module__space__user=request.user
            )
        except ResourceQuizAttempt.DoesNotExist:
            return Response({"detail": "No active attempt found for this quiz."}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status in ["SUBMITTED", "EXPIRED"]:
            return Response(ResourceQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)

        if user_answers:
            attempt.user_answers = {**attempt.user_answers, **user_answers}

        if timezone.now() >= attempt.expires_at:
            attempt.status = "EXPIRED"
            attempt.submitted_at = attempt.expires_at
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.save()
            return Response(ResourceQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)

        if submit:
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.status = "SUBMITTED"
            attempt.submitted_at = timezone.now()
            attempt.save()
        else:
            attempt.save()

        return Response(ResourceQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class RetrieveResourceQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            attempt = ResourceQuizAttempt.objects.select_related("quiz__resource__module__space").get(
                quiz_id=quiz_id,
                quiz__resource__module__space__user=request.user
            )
        except ResourceQuizAttempt.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

        if attempt.status == "IN_PROGRESS" and timezone.now() >= attempt.expires_at:
            attempt.status = "EXPIRED"
            attempt.submitted_at = attempt.expires_at
            score, total = calculate_quiz_score(attempt.quiz.content, attempt.user_answers)
            attempt.score = score
            attempt.total_questions = total
            attempt.save()

        return Response(ResourceQuizAttemptSerializer(attempt).data, status=status.HTTP_200_OK)
