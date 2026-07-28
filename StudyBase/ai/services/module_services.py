from typing import TypedDict, Dict, List, Optional, Literal, Annotated, Tuple
import uuid
import operator

from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langgraph.types import Send
from langchain_core.documents import Document

from ai.models import ModuleQuizes, ModuleNotes, ModuleFlashcards, IndexVideos, IndexPDFs
from spaces.models import Module, Resource
from ai.services.schema import create_flashcard_model, create_quiz_model, Quiz, FlashcardSet
from ai.services.dep import video_vector_store
from ai.services.workflow import generation_model
from ai.services.prompts import quiz_generation_prompt, flashcard_generation_prompt

from payments.utils import calculate_module_credit_cost


class Instruction(BaseModel):
    type: Literal['quize', 'flashcard']
    title: str
    text: str
    item_count: int


class State(TypedDict):
    module: Module
    resources: List[Resource]
    instruction: Instruction
    quizes: Annotated[List[Quiz], operator.add]
    flashcards: Annotated[List[FlashcardSet], operator.add]
    status: str


def init(state: State):
    return {"status": "Processing content"}


def start_process(state: State):
    """Fan-out: send one process_node per resource."""
    resources = state['resources']
    instruction = state['instruction']
    item_count = instruction.item_count  # Pydantic model attribute access

    if not resources:
        return []

    if len(resources) == 1:
        return [
            Send('process_node', {
                'resource': resources[0],
                'instruction': instruction,
                'avg_count': max(1, item_count),
            })
        ]

    avg_count = max(1, item_count // len(resources))
    
    oprs = [
        Send('process_node', {
            'resource': resources[i],
            'instruction': instruction,
            'avg_count': avg_count,
        })
        for i in range(len(resources) - 1)
    ]
    oprs.append(Send('process_node', {
        'resource': resources[-1],
        'instruction': instruction,
        'avg_count': avg_count + (item_count % len(resources)),
    }))
    return oprs


def process_node(state: dict):
    resource = state['resource']
    instruction = state['instruction']
    avg_count = state['avg_count']

    # Fetch summaries from vector store

    if resource.type == 'youtube' and hasattr(resource, 'youtube_video'):
        summary = IndexVideos.objects.get(video_id = resource.youtube_video.video_id).final_summary
    elif resource.type == 'file':
        summary = IndexPDFs.objects.get(file = resource.pdf_file).final_summary

    if instruction.type == 'quize':
        response = model.with_structured_output(create_quiz_model(int(avg_count))).invoke(
            quiz_generation_prompt.format(summary=summary, instruction=instruction.text)
        )
        return {"quizes": [response]}
    else:
        response = model.with_structured_output(create_flashcard_model(int(avg_count))).invoke(
            flashcard_generation_prompt.format(summary=summary, instruction=instruction.text)
        )
        return {"flashcards": [response]}


def collect_save_node(state: State):
    instruction = state['instruction']

    if instruction.type == 'quize':
        quiz = Quiz.model_construct(questions=[])
        for quiz_model in state.get('quizes', []):
            quiz.questions.extend(quiz_model.questions)

        ModuleQuizes.objects.create(
            title=instruction.title,
            module=state['module'],
            content=quiz.model_dump().get("questions", []),
            credit_cost=calculate_module_credit_cost(len(state['resources']), len(quiz.questions))
        )

    else:
        flashcard = FlashcardSet.model_construct(flashcards=[])
        for flashcard_model in state.get('flashcards', []):
            flashcard.flashcards.extend(flashcard_model.flashcards)

        ModuleFlashcards.objects.create(
            title=instruction.title,
            module=state['module'],
            content=flashcard.model_dump().get("flashcards", []),
            credit_cost=calculate_module_credit_cost(len(state['resources']), len(flashcard.flashcards))
        )

    return {"status": "content added successfully!"}


def build_graph():
    builder = StateGraph(State)
    builder.add_node("init", init)
    builder.add_node("process_node", process_node)
    builder.add_node("collect_save_node", collect_save_node)

    builder.set_entry_point("init")
    builder.add_conditional_edges("init", start_process, ["process_node"])
    builder.add_edge("process_node", "collect_save_node")
    builder.add_edge("collect_save_node", END)
    return builder.compile()
