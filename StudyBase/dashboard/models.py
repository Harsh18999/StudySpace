import uuid
from django.db import models
from accounts.models import User
from spaces.models import Module

class StudySession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # saved in seconds

    def __str__(self):
        return f"StudySession {self.session_id} - {self.user.username} ({self.duration}s)"

class ReportTags(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='report')
    resources = models.IntegerField(default=0)
    flashcards = models.IntegerField(default=0)
    quizzes = models.IntegerField(default=0)
    notes = models.IntegerField(default=0)
    average_accuracy = models.FloatField(default=100.0)
    streaks = models.IntegerField(default=0)
    best_streaks = models.IntegerField(default=0)
    total_items = models.IntegerField(default=0)
    completed_items = models.IntegerField(default=0)
    total_hours = models.FloatField(default=0.0)

    def progress(self):
        if self.total_items == 0:
            return 0
        return int((self.completed_items / self.total_items) * 100)
    
    def __str__(self):
        return f"Report for {self.user.username}"

class ModuleProgress(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='progress')
    total = models.IntegerField(default=0)
    completed = models.IntegerField(default=0)
    
    def progress(self):
        if self.total == 0:
            return 0
        return int((self.completed / self.total) * 100)
    
    def __str__(self):
        return f"Progress for {self.module.name}"