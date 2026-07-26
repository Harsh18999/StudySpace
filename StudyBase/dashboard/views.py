from datetime import timedelta
from django.db.models import Sum, Avg, Max
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai.models import ResourceQuizAttempt, ModuleQuizAttempt
from .models import ReportTags, ModuleProgress, StudySession
from .pagination import ModuleProgressPagination, QuizePerformancePagination
from .serializers import ReportTagsSerializer, ModuleProgressSerializer


class ReportTagsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_tags, _ = ReportTags.objects.get_or_create(user=request.user)
        serializer = ReportTagsSerializer(report_tags)
        return Response(serializer.data)


class ModuleProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = ModuleProgress.objects.filter(
            module__space__user=request.user
        ).order_by('-total')
        
        paginator = ModuleProgressPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            return paginator.get_paginated_response(
                ModuleProgressSerializer(page, many=True).data
            )
        
        serializer = ModuleProgressSerializer(queryset, many=True)
        return Response(serializer.data)


class LearningProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            days = int(request.query_params.get('days', 90))
        except (ValueError, TypeError):
            days = 90

        if days not in [7, 30, 90]:
            days = 90

        start_date = timezone.now() - timedelta(days=days)

        data = (
            StudySession.objects
            .filter(
                user=request.user,
                started_at__gte=start_date
            )
            .annotate(date=TruncDate("started_at"))
            .values("date")
            .annotate(total_duration=Sum("duration"))
            .order_by("date")
        )

        response = [
            {
                "date": item["date"].strftime("%Y-%m-%d") if item["date"] else "",
                "hours": round((item["total_duration"] or 0) / 3600.0, 2),
                "seconds": item["total_duration"] or 0
            }
            for item in data
        ]

        return Response(response)


class HeatMapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except (ValueError, TypeError):
            month = now.month
            year = now.year

        if month < 1 or month > 12:
            month = now.month

        start_date = timezone.datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end_date = timezone.datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = timezone.datetime(year, month + 1, 1, tzinfo=timezone.utc)

        data = (
            StudySession.objects
            .filter(
                user=request.user,
                started_at__gte=start_date,
                started_at__lt=end_date
            )
            .annotate(date=TruncDate("started_at"))
            .values("date")
            .annotate(total_duration=Sum("duration"))
            .order_by("date")
        )

        response = [
            {
                "date": item["date"].strftime("%Y-%m-%d") if item["date"] else "",
                "hours": round((item["total_duration"] or 0) / 3600.0, 2),
                "seconds": item["total_duration"] or 0
            }
            for item in data
        ]

        return Response(response)


class QuizePerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resource_stats = (
            ResourceQuizAttempt.objects
            .filter(
                status="SUBMITTED",
                quiz__resource__module__space__user=request.user
            )
            .values(
                "quiz__resource__module__id",
                "quiz__resource__module__name"
            )
            .annotate(
                resource_avg=Avg("score"),
                resource_max=Max("score")
            )
        )

        module_stats = (
            ModuleQuizAttempt.objects
            .filter(
                status="SUBMITTED",
                quiz__module__space__user=request.user
            )
            .values(
                "quiz__module__id",
                "quiz__module__name"
            )
            .annotate(
                module_avg=Avg("score"),
                module_max=Max("score")
            )
        )

        report = {}

        for item in resource_stats:
            module_id = str(item["quiz__resource__module__id"])
            report[module_id] = {
                "module_id": module_id,
                "module": item["quiz__resource__module__name"],
                "avg": round(item["resource_avg"] or 0, 2),
                "max": round(item["resource_max"] or 0, 2),
            }

        for item in module_stats:
            module_id = str(item["quiz__module__id"])
            if module_id not in report:
                report[module_id] = {
                    "module_id": module_id,
                    "module": item["quiz__module__name"],
                    "avg": round(item["module_avg"] or 0, 2),
                    "max": round(item["module_max"] or 0, 2),
                }
            else:
                report[module_id]["avg"] = round(((item["module_avg"] or 0) + report[module_id]["avg"]) / 2.0, 2)
                report[module_id]["max"] = round(max(item["module_max"] or 0, report[module_id]["max"]), 2)

        report_list = list(report.values())
        paginator = QuizePerformancePagination()
        page = paginator.paginate_queryset(report_list, request)
        if page is not None:
            return paginator.get_paginated_response(page)

        return Response({"results": report_list, "count": len(report_list)})
