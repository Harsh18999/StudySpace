from django.db import models
from spaces.models import Resource, Module
import uuid


class FlashCards(models.Model):
    title = models.CharField(max_length=100)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='flashcards')
    flashcard_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.resource.name} - {self.title} FlashCard"


class ModuleFlashcards(models.Model):
    title = models.CharField(max_length=100)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='flashcards')
    flashcard_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    credit_cost = models.IntegerField(default=10)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.module.name} - {self.title} FlashCard"
