from rest_framework import serializers
from spaces.models import Resource
from ai.models import GenerationJob, ModuleGenerationJob
import uuid
from langchain_core.messages import HumanMessage, AIMessage


class GenerateContentSerializer(serializers.Serializer):
    job_id = serializers.UUIDField(required=False, default=uuid.uuid4)
    resource_id = serializers.UUIDField(required=True)
    instructions = serializers.ListField(required=True)

    def validate_resource_id(self, value):
        if not Resource.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Resource not found.")
        return value

    def validate_instructions(self, value):
        for instruction in value:
            if not isinstance(instruction, dict) or instruction.get("type") not in {"notes", "flashcard", "quize"}:
                raise serializers.ValidationError("Invalid instruction format: 'type' must be one of notes, flashcard, quize.")
            if not instruction.get("title") or not isinstance(instruction["title"], str):
                raise serializers.ValidationError("Each instruction must include a non-empty 'title' string.")
        return value


class GenerationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationJob
        fields = ["job_id", "resource_id", "status", "message", "result", "created_at", "updated_at"]


class ModuleGenerationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleGenerationJob
        fields = ["job_id", "module", "status", "message", "result", "created_at", "updated_at"]


class FetchPendingJobsSerializer(serializers.Serializer):
    type = serializers.CharField(max_length=20, required=True)
    resource_id = serializers.UUIDField(required=True)

    def validate_type(self, value):
        if value not in {"notes", "flashcard", "quize"}:
            raise serializers.ValidationError("Invalid type.")
        return value
    
    def validate_resource_id(self, value):
        if not Resource.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Resource not found.")
        return value


class ResourceIdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id']


class MessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant", "human", "ai"])
    content = serializers.CharField()


class ChatVideoSerializer(serializers.Serializer):
    resource_id = serializers.UUIDField(required=True)
    thread_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    messages = MessageSerializer(many=True, required=False, default=list)
    video_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_resource_id(self, value):
        if not Resource.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Resource not found.")
        resource = Resource.objects.get(pk=value)
        if resource.type != 'youtube':
            raise serializers.ValidationError("Resource is not a video.")
        return value

    def validate_messages(self, value):
        return [
            HumanMessage(message['content']) if message['role'] in ("user", "human") else AIMessage(message['content'])
            for message in value
        ]
