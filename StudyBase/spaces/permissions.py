from rest_framework import permissions
from .models import *
from ai.models import ResourseQuizes, Notes, FlashCards, Resource, VideoChatSession, ModuleQuizes, ModuleFlashcards

class IsSpaceOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Space):
            return obj.user == request.user

        if isinstance(obj, Module):
            return obj.space.user == request.user

        if isinstance(obj, ModuleQuizes):
            return obj.module.space.user == request.user

        if isinstance(obj, ModuleFlashcards):
            return obj.module.space.user == request.user

        if isinstance(obj, ResourseQuizes):
            return obj.resource.module.space.user == request.user

        if isinstance(obj, Notes):
            return obj.resource.module.space.user == request.user

        if isinstance(obj, FlashCards):
            return obj.resource.module.space.user == request.user

        if isinstance(obj, Resource):
            return obj.module.space.user == request.user

        if isinstance(obj, VideoChatSession):
            return obj.resource.module.space.user == request.user

        return getattr(obj, 'user', None) == request.user
