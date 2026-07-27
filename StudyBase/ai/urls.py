from django.urls import path
from .views import (
    GenerateContent,
    JobStatusView,
    QuizesViewSet,
    NotesViewSet,
    FlashCardsViewSet,
    ChatVideoView,
    ModuleQuizView,
    IndexedModuleResourcesView,
    ModuleJobStatusView,
    SpaceModuleQuizViewSet,
    ModuleQuizDetailViewSet,
    SpaceModuleFlashcardViewSet,
    ModuleFlashcardDetailViewSet,
    StartModuleQuizAttemptView,
    SaveModuleQuizAttemptView,
    RetrieveModuleQuizAttemptView,
    StartResourceQuizAttemptView,
    SaveResourceQuizAttemptView,
    RetrieveResourceQuizAttemptView,
    KeepAliveView,
)
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r"quize", QuizesViewSet, basename="quize")
router.register(r"notes", NotesViewSet, basename="notes")
router.register(r"flashcards", FlashCardsViewSet, basename="flashcards")
router.register(r"space/quizes", SpaceModuleQuizViewSet, basename="space_module_quize")
router.register(r"module-quize", ModuleQuizDetailViewSet, basename="module_quize")
router.register(r"space/flashcards", SpaceModuleFlashcardViewSet, basename="space_module_flashcard")
router.register(r"module-flashcard", ModuleFlashcardDetailViewSet, basename="module_flashcard")


urlpatterns = [
    path("ai/generate/", GenerateContent.as_view(), name="generate_content"),
    path("ai/jobs/<uuid:job_id>/", JobStatusView.as_view(), name="job_status"),
    path("ai/jobs/module/<uuid:job_id>/", ModuleJobStatusView.as_view(), name="module_job_status"),
    path("ai/chat-video/", ChatVideoView.as_view(), name="chat_video"),
    # Module quiz generation & listing
    path("ai/module-quiz/", ModuleQuizView.as_view(), name="module_quiz"),
    # Indexed resources for a module (filtered to indexed videos/PDFs only)
    path("ai/module-resources/", IndexedModuleResourcesView.as_view(), name="module_indexed_resources"),
    # Quiz attempt endpoints
    path("ai/module-quiz-attempt/start/", StartModuleQuizAttemptView.as_view(), name="start_module_quiz_attempt"),
    path("ai/module-quiz-attempt/save/", SaveModuleQuizAttemptView.as_view(), name="save_module_quiz_attempt"),
    path("ai/module-quiz-attempt/<uuid:quiz_id>/", RetrieveModuleQuizAttemptView.as_view(), name="retrieve_module_quiz_attempt"),
    path("ai/resource-quiz-attempt/start/", StartResourceQuizAttemptView.as_view(), name="start_resource_quiz_attempt"),
    path("ai/resource-quiz-attempt/save/", SaveResourceQuizAttemptView.as_view(), name="save_resource_quiz_attempt"),
    path("ai/resource-quiz-attempt/<uuid:quiz_id>/", RetrieveResourceQuizAttemptView.as_view(), name="retrieve_resource_quiz_attempt"),
    path("keep_alive/", KeepAliveView.as_view(), name="keep_alive"),
    path("keep_alive/<str:name>/", KeepAliveView.as_view(), name="keep_alive_with_name"),
] + router.urls


