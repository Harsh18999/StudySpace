"""
URL configuration for StudyBase project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from accounts.views import LoginView, RegisterView, SendOTPView, GoogleAuthView, profile
from spaces.urls import urlpatterns as spaces_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path('api/auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('api/profile/', profile, name='profile'),
    path('api/', include(spaces_urlpatterns)),
    path('api/', include('ai.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/payments/', include('payments.urls')),
]
