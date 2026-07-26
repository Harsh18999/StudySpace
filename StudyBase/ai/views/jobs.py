from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from spaces.models import Resource
from ai.models import GenerationJob, ModuleGenerationJob
from ai.serializers import (
    GenerateContentSerializer,
    GenerationJobSerializer,
    ModuleGenerationJobSerializer,
    FetchPendingJobsSerializer,
)
from ai.tasks import run_workflow


from payments.utils import calculate_resource_credit_cost, check_user_has_credits


class GenerateContent(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=GenerateContentSerializer,
    )
    def post(self, request):
        serializer = GenerateContentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instructions = serializer.validated_data["instructions"]
        required_credits = calculate_resource_credit_cost(instructions)
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
            resource = Resource.objects.select_related("module__space").get(
                pk=serializer.validated_data["resource_id"],
                module__space__user=request.user,
            )
        except Resource.DoesNotExist:
            return Response(
                {"detail": "Resource not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        job_id = str(serializer.validated_data["job_id"])

        GenerationJob.objects.create(
            job_id=job_id,
            resource=resource,
            status="pending",
            message="Queued",
        )

        run_workflow.delay(
            job_id=job_id,
            resource_id=str(resource.pk),
            instructions=serializer.validated_data["instructions"],
        )

        return Response(
            {
                "job_id": job_id,
                "poll_url": f"/api/ai/jobs/{job_id}/",
                "detail": (
                    "Workflow started. Poll poll_url every few seconds "
                    "to track status and retrieve the final result."
                ),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class JobStatusView(APIView):
    """Return the current status of a generation job."""

    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = GenerationJob.objects.select_related("resource").get(
                pk=job_id,
                resource__module__space__user=request.user,
            )
        except GenerationJob.DoesNotExist:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(GenerationJobSerializer(job).data)


class ModuleJobStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = ModuleGenerationJob.objects.select_related("module").get(
                pk=job_id,
                module__space__user=request.user,
            )
        except ModuleGenerationJob.DoesNotExist:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(ModuleGenerationJobSerializer(job).data)


class FetchPendingJobsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FetchPendingJobsSerializer

    @extend_schema(
        request=FetchPendingJobsSerializer,
    )
    def post(self, request):
        serializer = FetchPendingJobsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        type = serializer.validated_data['type']
        resource_id = serializer.validated_data['resource_id']
        jobs = GenerationJob.objects.filter(
            type=type,
            resource_id=resource_id,
            status='pending',
            resource__module__space__user=request.user
        ).values_list('id', flat=True)

        return Response(
            jobs,
            status=status.HTTP_200_OK,
        )
