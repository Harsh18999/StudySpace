from django.urls import path
from django.urls import include
from rest_framework.routers import DefaultRouter
from .views import SpaceViewSet, ModuleViewSet, VideoResource, PlayListResource, ResourceRetriveViewSet

router = DefaultRouter()
router.register(r'spaces', SpaceViewSet, basename='space')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'resources', ResourceRetriveViewSet, basename='resource')

urlpatterns = [
    path('add/video/', VideoResource.as_view()),
    path('add/playlist/', PlayListResource.as_view()),
    path('', include(router.urls)),
]