from django.db import models
import uuid
from accounts.models import User

# Create your models here.
class Space(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="spaces")
    created_at = models.DateTimeField(auto_now_add=True)

class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name="modules")
    created_at = models.DateTimeField(auto_now_add=True)

class Resource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="resources")
    type = models.CharField(
        max_length=20,
        choices=[
            ('youtube', 'Youtube'),
            ('file', 'File')
        ],
        default='youtube'
    )
class YoutubeVideo(models.Model):
    resource = models.OneToOneField(Resource, on_delete=models.CASCADE, related_name='youtube_video')
    title = models.CharField(max_length=100)
    video_id = models.CharField(max_length=20)
    channel_name = models.CharField(max_length=100)
    channel_id = models.CharField(max_length=50)
    duration = models.DurationField()
    description = models.TextField(blank=True, null=True)
    published_at = models.DateTimeField()
    thumbnail_url = models.URLField()

    def __str__(self):
        return f"{self.title} by {self.channel_name}"

class Files(models.Model):
    resource = models.OneToOneField(Resource, on_delete=models.CASCADE, related_name='pdf_file')
    file_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_name = models.CharField(max_length=100)
    file_url = models.URLField()
    file_size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name
