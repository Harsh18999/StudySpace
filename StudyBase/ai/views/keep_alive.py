import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from ai.tasks import dummy_task

logger = logging.getLogger(__name__)


class KeepAliveView(APIView):
    """
    Dummy keep alive endpoint that triggers a dummy Celery task.
    Uses AllowAny permission to allow unauthenticated access and accepts any name parameter.
    """
    permission_classes = [AllowAny]

    def get(self, request, name=None):
        name_val = name or request.query_params.get("name") or "keep_alive"
        task_result = dummy_task.delay(name=name_val)
        return Response(
            {
                "status": "ok",
                "message": f"Dummy celery task triggered for '{name_val}'",
                "name": name_val,
                "task_id": task_result.id,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, name=None):
        name_val = (
            name
            or (request.data.get("name") if isinstance(request.data, dict) else None)
            or request.query_params.get("name")
            or "keep_alive"
        )
        task_result = dummy_task.delay(name=name_val)
        return Response(
            {
                "status": "ok",
                "message": f"Dummy celery task triggered for '{name_val}'",
                "name": name_val,
                "task_id": task_result.id,
            },
            status=status.HTTP_200_OK,
        )
