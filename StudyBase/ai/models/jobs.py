from django.db import models
from spaces.models import Files, Resource, Module
import uuid


class IndexVideos(models.Model):
    video_id = models.CharField(max_length=100)
    collection_name = models.CharField(max_length=100)
    transcript = models.JSONField()
    final_summary = models.TextField(null=True, blank=True)
    indexed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.video_id} - {self.collection_name}"


class IndexPDFs(models.Model):
    file = models.ForeignKey(Files, on_delete=models.CASCADE)
    collection_name = models.CharField(max_length=100)
    final_summary = models.TextField(null=True, blank=True)
    indexed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file.file_name} - {self.collection_name}"


class GenerationJob(models.Model):
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("running",   "Running"),
        ("completed", "Completed"),
        ("failed",    "Failed"),
    ]

    JOB_CHOICES = [
        ("notes",   "Notes"),
        ("quiz",    "Quiz"),
        ("flashcard", "Flashcard"),
    ]
    
    job_id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type       = models.CharField(max_length=20, choices=JOB_CHOICES, default="notes")
    resource   = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="jobs")
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    message    = models.TextField(blank=True, default="")
    result     = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Job {self.job_id} [{self.status}] — {self.resource}"


class ModuleGenerationJob(models.Model):
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("running",   "Running"),
        ("completed", "Completed"),
        ("failed",    "Failed"),
    ]

    JOB_CHOICES = [
        ("notes",   "Notes"),
        ("quiz",    "Quiz"),
        ("flashcard", "Flashcard"),
    ]
    
    job_id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type       = models.CharField(max_length=20, choices=JOB_CHOICES, default="notes")
    module     = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="jobs")
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    message    = models.TextField(blank=True, default="")
    result     = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Job {self.job_id} [{self.status}] — {self.module}"


class VideoChatSession(models.Model):
    resource = models.ForeignKey(Resource, primary_key=True, on_delete=models.CASCADE, related_name='video_chat_sessions')
    thread_id = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.thread_id}"
