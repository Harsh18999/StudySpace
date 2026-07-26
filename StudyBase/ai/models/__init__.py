from .quizzes import ResourseQuizes, ModuleQuizes, ResourceQuizAttempt, ModuleQuizAttempt
from .notes import Notes, ModuleNotes
from .flashcards import FlashCards, ModuleFlashcards
from .jobs import IndexVideos, IndexPDFs, GenerationJob, ModuleGenerationJob, VideoChatSession
from spaces.models import Resource, Module, Files

__all__ = [
    'IndexVideos',
    'IndexPDFs',
    'ResourseQuizes',
    'ModuleQuizes',
    'ModuleNotes',
    'ModuleFlashcards',
    'Notes',
    'FlashCards',
    'GenerationJob',
    'ModuleGenerationJob',
    'VideoChatSession',
    'ResourceQuizAttempt',
    'ModuleQuizAttempt',
    'Resource',
    'Module',
    'Files',
]

