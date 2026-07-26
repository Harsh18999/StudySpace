from django.db import models
from spaces.models import Resource, Module
import uuid


class Notes(models.Model):
    title = models.CharField(max_length=100)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='notes')
    note_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    path = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.resource.name} - {self.title} Note"


class ModuleNotes(models.Model):
    title = models.CharField(max_length=100)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='notes')
    note_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    path = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.module.name} - {self.title} Note"
