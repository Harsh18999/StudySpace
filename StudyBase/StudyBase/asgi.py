import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'StudyBase.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from dashboard.middleware import JWTAuthMiddleware
from dashboard.routing import websocket_urlpatterns as dashboard_ws_urlpatterns
from ai.websockets import WorkflowConsumer
from django.urls import re_path

all_websocket_urlpatterns = dashboard_ws_urlpatterns + [
    re_path(r'^ws/ai/workflow/(?P<job_id>[^/]+)/$', WorkflowConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(all_websocket_urlpatterns)
    ),
})
