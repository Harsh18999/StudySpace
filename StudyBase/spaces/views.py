import uuid
from isodate import parse_duration
from django.utils import timezone
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.views import APIView
from rest_framework import mixins, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema

from .permissions import IsSpaceOwner
from .models import Space, Module, Resource, YoutubeVideo
from .serializers import (
    SpaceSerializer, 
    SpaceRetriveSerializer,
    ModuleSerializer, 
    AddYoutubeVideoSerializer, 
    ModuleRetriveSerializer,
    AddYoutubePlayListSerializer,
    RetrieveResourceSerializer
)
from .services import get_video_details, get_playlist_details
from dashboard.models import ReportTags


class SpaceViewSet(ModelViewSet):
    permission_classes = [IsSpaceOwner]
    serializer_class = SpaceSerializer

    def get_queryset(self):
        return self.request.user.spaces
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SpaceRetriveSerializer
        return SpaceSerializer


class ModuleViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet
):
    queryset = Module.objects.all()
    permission_classes = [IsSpaceOwner]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ModuleRetriveSerializer
        return ModuleSerializer
    

class VideoResource(APIView):
    @extend_schema(request=AddYoutubeVideoSerializer)
    def post(self, request):
        serializer = AddYoutubeVideoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            module = Module.objects.get(id=serializer.validated_data['module'])
        except Module.DoesNotExist:
            raise ValidationError("Invalid module id!")
        
        if module.space.user != self.request.user:
            raise ValidationError("You are not the owner of this space")
        
        try:
            details = get_video_details(serializer.validated_data['id'])
        except Exception as e:
            raise ValidationError(f"{e}")
        
        if not details:
            raise ValidationError("Didn't find any video with this id!")

        duration = parse_duration(details["contentDetails"]["duration"])
        total_seconds = duration.total_seconds() if hasattr(duration, 'total_seconds') else getattr(duration, 'seconds', 0)
        if total_seconds > 7200:
            raise ValidationError("Video duration exceeds the maximum limit of 2 hours (50 credits limit). Only videos up to 2 hours are allowed.")

        resource = Resource.objects.create(
            id=uuid.uuid4(),
            module=module
        )

        YoutubeVideo.objects.create(
            resource=resource,
            video_id=details['id'],
            title=details['snippet']['title'],
            channel_name=details['snippet']['channelTitle'],
            channel_id=details['snippet']['channelId'],
            duration=duration,
            description=details['snippet']['description'],
            published_at=details['snippet']['publishedAt'],
            thumbnail_url=details['snippet']['thumbnails']['high']['url']
        )
        return Response({"data": {"id": module.id}}, status=status.HTTP_201_CREATED)


class PlayListResource(APIView):
    @extend_schema(request=AddYoutubePlayListSerializer)
    def post(self, request):
        serializer = AddYoutubePlayListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            module = Module.objects.get(id=serializer.validated_data['module'])
        except Module.DoesNotExist:
            raise ValidationError("Invalid module id!")
        
        if module.space.user != self.request.user:
            raise ValidationError("You are not the owner of this space")
        
        try:
            content = get_playlist_details(serializer.validated_data['id'])
        except Exception as e:
            raise ValidationError(f"{e}")
        
        if not content:
            raise ValidationError("Didn't find any videos in this playlist!")
        
        valid_items = []
        for item in content:
            content_details = item.get('contentDetails', {})
            snippet = item.get('snippet', {})
            video_id = content_details.get('videoId') or snippet.get('resourceId', {}).get('videoId')
            if not video_id:
                continue

            duration_raw = content_details.get('duration')
            duration = parse_duration(duration_raw) if duration_raw else parse_duration("PT0S")
            total_seconds = duration.total_seconds() if hasattr(duration, 'total_seconds') else getattr(duration, 'seconds', 0)

            # Restrict videos over 2 hours (7200 seconds)
            if total_seconds > 7200:
                continue

            valid_items.append((item, video_id, duration))

        if not valid_items:
            raise ValidationError("No videos in this playlist are under the maximum duration limit of 2 hours.")

        resources = [Resource(id=uuid.uuid4(), module=module) for _ in valid_items]
        Resource.objects.bulk_create(resources, batch_size=1000)
        
        videos = []
        for i, (item, video_id, duration) in enumerate(valid_items):
            snippet = item.get('snippet', {})
            thumbnails = snippet.get('thumbnails', {})
            thumb = thumbnails.get('high') or thumbnails.get('medium') or thumbnails.get('default') or {}

            videos.append(
                YoutubeVideo(
                    resource=resources[i],
                    video_id=video_id,
                    title=snippet.get('title', 'Untitled Lesson'),
                    channel_name=snippet.get('channelTitle', 'YouTube'),
                    channel_id=snippet.get('channelId', ''),
                    duration=duration,
                    description=snippet.get('description', ''),
                    published_at=snippet.get('publishedAt') or timezone.now(),
                    thumbnail_url=thumb.get('url', '')
                )
            )

        YoutubeVideo.objects.bulk_create(videos, batch_size=1000, ignore_conflicts=True)

        # Update ReportTags for saved resources because bulk_create bypasses post_save signals
        report_tags, _ = ReportTags.objects.get_or_create(user=request.user)
        report_tags.resources += len(resources)
        report_tags.total_items += len(resources)
        report_tags.save()

        return Response({"data": {"id": module.id}}, status=status.HTTP_201_CREATED)


class ResourceRetriveViewSet(
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet
):
    permission_classes = [IsSpaceOwner]
    serializer_class = RetrieveResourceSerializer

    def get_queryset(self):
        return Resource.objects.filter(
            module__space__user=self.request.user,
        ).select_related('youtube_video', 'pdf_file').prefetch_related(
            'quizes', 'notes', 'flashcards'
        )
