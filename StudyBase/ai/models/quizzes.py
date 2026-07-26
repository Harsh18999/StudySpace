from django.db import models
from django.utils import timezone
from spaces.models import Resource, Module
import uuid


class ResourseQuizes(models.Model):
    title = models.CharField(max_length=100)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='quizes')
    content = models.JSONField()
    type = models.CharField(max_length=20, choices=[('easy', 'EASY  '), ('medium', 'MEDIUM'), ('hard', 'HARD')], default='easy')
    quiz_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.resource.name} - {self.title} - {self.type} Quiz"


class ModuleQuizes(models.Model):
    title = models.CharField(max_length=100)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='quizes')
    content = models.JSONField()
    type = models.CharField(max_length=20, choices=[('easy', 'EASY  '), ('medium', 'MEDIUM'), ('hard', 'HARD')], default='easy')
    quiz_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    credit_cost = models.IntegerField(default=10)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.module.name} - {self.title} - {self.type} Quiz"


class ResourceQuizAttempt(models.Model):
    STATUS = (
        ("IN_PROGRESS", "In Progress"),
        ("SUBMITTED", "Submitted"),
        ("EXPIRED", "Expired"),
    )
    quiz = models.OneToOneField(
        ResourseQuizes,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="attempt"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(default=0)
    total_questions = models.IntegerField(default=0)
    user_answers = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="IN_PROGRESS"
    )

    def __str__(self):
        return f"{self.quiz}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class ModuleQuizAttempt(models.Model):
    STATUS = (
        ("IN_PROGRESS", "In Progress"),
        ("SUBMITTED", "Submitted"),
        ("EXPIRED", "Expired"),
    )
    quiz = models.OneToOneField(
        ModuleQuizes,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="attempt"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(default=0)
    total_questions = models.IntegerField(default=0)
    user_answers = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="IN_PROGRESS"
    )

    def __str__(self):
        return f"{self.quiz}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
