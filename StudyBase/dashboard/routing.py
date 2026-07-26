from django.urls import re_path
from .consumers import StudySessionConsumer

websocket_urlpatterns = [
    re_path(r'^ws/study-session/$', StudySessionConsumer.as_asgi()),
]
