from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

from django.conf import settings
from spaces.permissions import IsSpaceOwner
from ai.models import Notes as NotesModel
from ai.serializers import NoteSerializer
from ai.services.s3 import s3


class NotesViewSet(DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsSpaceOwner]
    serializer_class = NoteSerializer

    def get_queryset(self):
        return NotesModel.objects.filter(
            resource__module__space__user=self.request.user,
        )

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        note_data = response.data
        try:
            note_data['download_url'] = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.BUCKET_NAME,
                    "Key": note_data['path'],
                },
                ExpiresIn=3600
            )

        except Exception as e:
            raise ValidationError(str(e))
        return Response(note_data, status=status.HTTP_202_ACCEPTED)
