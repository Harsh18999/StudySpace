from rest_framework.serializers import ModelSerializer, Serializer
from rest_framework import serializers
from .models import Space, Module, Resource, YoutubeVideo, Files
from .services import validate_youtube_video_url, validate_youtube_playlist_url
from ai.models import ResourseQuizes, FlashCards, Notes

class SpaceSerializer(ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = Space
        fields = ['id', 'name', 'description']
    
    def validate(self, attrs):
        name = attrs.get('name')
        request = self.context.get('request')
        if name and request and hasattr(request, 'user') and request.user.is_authenticated:
            qs = Space.objects.filter(user=request.user, name=name)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError({"name": "Space with this name already exists"})
        
        return attrs
        
    def create(self, validated_data):
        space = Space.objects.create(user=self.context['request'].user, **validated_data)
        return space
    
    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance

class ModuleSpaceSerializer(ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'name']
        
class SpaceRetriveSerializer(ModelSerializer):
    modules = ModuleSpaceSerializer(many=True, read_only=True)
    class Meta:
        model = Space
        fields = ['id', 'name', 'description', 'modules']
    
class ModuleSerializer(ModelSerializer):
    space = SpaceSerializer(read_only=True)
    space_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Module
        fields = ['id', 'name', 'space', 'space_id']

    def validate(self, attrs):
        name = attrs.get('name')
        space_id = attrs.get('space_id')

        if not space_id and self.instance:
            space_id = self.instance.space_id

        if space_id and name:
            queryset = Module.objects.filter(space_id=space_id, name=name)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("Module with this name already exists")
        
        return attrs
    
    def create(self, validated_data):
        try:
            space = Space.objects.get(id=validated_data.pop("space_id"))
        except Space.DoesNotExist:
            raise serializers.ValidationError("Invalid space id!")
        if space.user != self.context['request'].user:
            raise serializers.ValidationError("You are not the owner of this space")
        module = Module.objects.create(**validated_data, space=space)
        return module
        
    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        return instance

class YoutubeVideoSerializer(ModelSerializer):
    class Meta:
        model = YoutubeVideo
        exclude = ['resource']

class FileSerializer(ModelSerializer):
    class Meta:
        model = Files
        exclude = ['resource']

class ResourceQuizeSerializer(ModelSerializer):
    class Meta:
        model = ResourseQuizes
        fields=['quiz_id', 'title', 'type']
    


class ResourseNoteSerializer(ModelSerializer):
    class Meta:
        model = Notes
        fields=['note_id', 'title']

class ResourceFlashCardSerializer(ModelSerializer):
    class Meta:
        model = FlashCards
        fields=['flashcard_id', 'title']

class RetrieveResourceSerializer(ModelSerializer):
    youtube = YoutubeVideoSerializer(
        source="youtube_video",
        read_only=True
    )
    file = FileSerializer(
        source="pdf_file",
        read_only=True
    )
    quizes = ResourceQuizeSerializer(
        many=True, 
        read_only=True
    )
    notes = ResourseNoteSerializer(
        many=True, 
        read_only=True
    )
    flashcards = ResourceFlashCardSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Resource
        fields = ["id", "type", "youtube", "file", "quizes", "notes", "flashcards"]

class ModuleRetriveSerializer(ModelSerializer):
    resources = RetrieveResourceSerializer(many=True, read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'name', 'resources']

class AddYoutubeVideoSerializer(Serializer):
    url = serializers.URLField()
    module = serializers.UUIDField(write_only=True)

    def validate(self, attrs):
        attrs['id'] = validate_youtube_video_url(attrs['url'])
        return attrs


class AddYoutubePlayListSerializer(Serializer):
    url = serializers.URLField()
    module = serializers.UUIDField(write_only=True)

    def validate(self, attrs):
        attrs['id'] = validate_youtube_playlist_url(attrs['url'])
        return attrs
