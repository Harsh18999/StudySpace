from rest_framework import serializers
from dashboard.models import ReportTags, ModuleProgress, StudySession


class ReportTagsSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ReportTags
        exclude = ['user']

    def get_progress_percentage(self, obj):
        return obj.progress()


class ModuleProgressSerializer(serializers.ModelSerializer):
    module_name = serializers.CharField(source='module.name', read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ModuleProgress
        fields = ['id', 'module', 'module_name', 'total', 'completed', 'progress_percentage']

    def get_progress_percentage(self, obj):
        return obj.progress()


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = ['session_id', 'user', 'started_at', 'ended_at', 'duration']
