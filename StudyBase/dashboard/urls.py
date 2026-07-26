from django.urls import path
from .views import (
    ReportTagsView,
    ModuleProgressView,
    LearningProgressView,
    HeatMapView,
    QuizePerformanceView,
)

urlpatterns = [
    path('report-tags/', ReportTagsView.as_view(), name='report-tags'),
    path('module-progress/', ModuleProgressView.as_view(), name='module-progress'),
    path('learning-progress/', LearningProgressView.as_view(), name='learning-progress'),
    path('heatmap/', HeatMapView.as_view(), name='heatmap'),
    path('quiz-performance/', QuizePerformanceView.as_view(), name='quiz-performance'),
]
