from typing import TypedDict, Dict, List, Optional, Literal, Union
try:
    from typing import NotRequired
except ImportError:  # Python < 3.11
    from typing_extensions import NotRequired
from pydantic import BaseModel, Field, conlist
from enum import Enum
from typing import Annotated


class ResourceType(Enum):
    YOUTUBE = "youtube"
    PDF = "pdf"

class video(BaseModel):
    video_id: str
    
class pdf(BaseModel):
    file_id: str


class ContentType(Enum):
    QUIZES = "quizes"
    NOTES = "notes"
    FLASHCARDS = "flashcards"

class LearningObjective(BaseModel):
    objective: str


class ImportantTerm(BaseModel):
    term: str
    definition: str


class Formula(BaseModel):
    formula: str
    variables: str
    meaning: str
    when_to_use: Optional[str] = None


class Process(BaseModel):
    name: str
    steps: List[str]


class ComparisonTable(BaseModel):
    title: str
    headers: List[str]
    rows: List[List[str]]


class Topic(BaseModel):
    title: str
    explanation: str
    key_points: List[str] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)
    applications: List[str] = Field(default_factory=list)


class ChapterNotes(BaseModel):
    title: str
    overview: str
    learning_objectives: List[LearningObjective]
    topics: List[Topic]
    important_terms: List[ImportantTerm] = Field(default_factory=list)
    key_facts: List[str] = Field(default_factory=list)
    processes: List[Process] = Field(default_factory=list)
    formulas: List[Formula] = Field(default_factory=list)
    comparisons: List[ComparisonTable] = Field(default_factory=list)
    revision_points: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)

class Flashcard(BaseModel):
    question: str = Field(
        description="Question shown on the front of the flashcard."
    )

    answer: str = Field(
        description="Answer shown on the back."
    )

class FlashcardSet(BaseModel):
    flashcards: List[Flashcard] = Field(
        min_length=10,
        max_length=20,
        description="10-20 flashcards generated from the summary."
    )

class QuizQuestion(BaseModel):
    question: str = Field(description="The question text.")
    options: List[str] = Field(description="List of 4 option choices.")
    answer: str = Field(description="The correct option choice string.")
    explanation: Optional[str] = Field(default=None, description="Explanation of the correct answer.")

class Quiz(BaseModel):
    questions: List[QuizQuestion] = Field(description="List of quiz questions.")

class instruction(TypedDict):
    type: Literal['quize', 'flashcard', 'notes']
    title: str
    text: str

def create_quiz_model(num_questions: int):
    class Quiz(BaseModel):
        title: str = Field(description="Title of the quiz.")
        questions: conlist(
            QuizQuestion,
            min_length=num_questions,
            max_length=num_questions,
        )

    return Quiz

def create_flashcard_model(num_flashcards: int):
    class FlashcardSet(BaseModel):
        flashcards: conlist(
            Flashcard,
            min_length=num_flashcards,
            max_length=num_flashcards,
        )
    
    return FlashcardSet