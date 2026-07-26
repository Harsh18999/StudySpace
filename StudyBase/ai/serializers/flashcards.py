from rest_framework import serializers
from spaces.models import Space, Module
from ai.models import FlashCards, ModuleFlashcards


class FlashCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashCards
        exclude = ['resource']


class ModuleFlashcardModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleFlashcards
        fields = ['flashcard_id', 'title', 'module', 'content', 'created_at', 'updated_at']


class ModuleFlashcardSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleFlashcards
        fields = ['flashcard_id', 'title', 'created_at']


class RetrieveModuleFlashcardSerializer(serializers.ModelSerializer):
    flashcards = ModuleFlashcardSummarySerializer(many=True, read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'name', 'flashcards']


class SpaceModuleFlashcardsModelSerializer(serializers.ModelSerializer):
    modules = RetrieveModuleFlashcardSerializer(many=True, read_only=True)
    class Meta:
        model = Space
        fields = ['id', 'name', 'description', 'modules']
