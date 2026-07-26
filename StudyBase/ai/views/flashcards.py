from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin
from spaces.permissions import IsSpaceOwner

from spaces.models import Space
from ai.models import FlashCards as FlashCardsModel, ModuleFlashcards
from ai.serializers import (
    FlashCardSerializer,
    SpaceModuleFlashcardsModelSerializer,
    ModuleFlashcardModelSerializer,
)


class FlashCardsViewSet(DestroyModelMixin, UpdateModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsSpaceOwner]
    serializer_class = FlashCardSerializer

    def get_queryset(self):
        return FlashCardsModel.objects.filter(
            resource__module__space__user=self.request.user,
        )


class SpaceModuleFlashcardViewSet(RetrieveModelMixin, GenericViewSet):
    """Read-only viewset for retrieving all module flashcards grouped by modules for a space."""
    permission_classes = [IsSpaceOwner]
    serializer_class = SpaceModuleFlashcardsModelSerializer

    def get_queryset(self):
        return Space.objects.filter(
            user=self.request.user
        )


class ModuleFlashcardDetailViewSet(RetrieveModelMixin, GenericViewSet):
    """Read-only viewset for individual module flashcard detail retrieval by flashcard_id."""
    permission_classes = [IsSpaceOwner]
    serializer_class = ModuleFlashcardModelSerializer

    def get_queryset(self):
        return ModuleFlashcards.objects.filter(
            module__space__user=self.request.user
        )
