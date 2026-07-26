from rest_framework import serializers
from ai.models import Notes


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notes
        exclude = ['resource']
