import uuid
from rest_framework import serializers
from spaces.models import Resource, Space, Module
from ai.models import ResourseQuizes, ModuleQuizes, ResourceQuizAttempt, ModuleQuizAttempt


class QuizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourseQuizes
        exclude = ['resource']


class ModuleInstructionSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True, default="")
    title = serializers.CharField()
    type = serializers.ChoiceField(choices=['flashcard', 'quize', 'notes'], required=True)
    number_of_items = serializers.IntegerField(default=10)


class ModuleQuizeSerializer(serializers.Serializer):
    resources = serializers.ListField(child=serializers.UUIDField(), required=True)
    instruction = ModuleInstructionSerializer()
    module = serializers.UUIDField(required=True)
    job_id = serializers.UUIDField(required=False, default=uuid.uuid4)

    def validate_module(self, value):
        if not Module.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Module not found.")
        return value

    def validate_resources(self, value):
        for resource_id in value:
            if not Resource.objects.filter(pk=resource_id).exists():
                raise serializers.ValidationError("Resource not found.")
        return value


class ModuleQuizModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleQuizes
        fields = ['quiz_id', 'title', 'module', 'content', 'type', 'created_at', 'updated_at']


class ModuleQuizAttemptSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    class Meta:
        model = ModuleQuizAttempt
        fields = ['started_at', 'expires_at', 'submitted_at', 'score', 'total_questions', 'user_answers', 'status', 'is_expired']


class ResourceQuizAttemptSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    class Meta:
        model = ResourceQuizAttempt
        fields = ['started_at', 'expires_at', 'submitted_at', 'score', 'total_questions', 'user_answers', 'status', 'is_expired']


class ModuleQuizSummarySerializer(serializers.ModelSerializer):
    attempt = ModuleQuizAttemptSerializer(read_only=True)
    class Meta:
        model = ModuleQuizes
        fields = ['quiz_id', 'title', 'attempt']


class RetriveModuleQuizSerializer(serializers.ModelSerializer):
    quizzes = ModuleQuizSummarySerializer(source='quizes', many=True, read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'name', 'quizzes']


class SpaceModuleQuizesModelSerializer(serializers.ModelSerializer):
    modules = RetriveModuleQuizSerializer(many=True, read_only=True)
    class Meta:
        model = Space
        fields = ['id', 'name', 'description', 'modules']


class StartQuizAttemptSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField(required=True)
    duration_minutes = serializers.IntegerField(required=False, default=15, min_value=1, max_value=180)


class SaveQuizAttemptSerializer(serializers.Serializer):
    quiz_id = serializers.UUIDField(required=True)
    user_answers = serializers.DictField(required=False, default=dict)
    submit = serializers.BooleanField(required=False, default=False)
