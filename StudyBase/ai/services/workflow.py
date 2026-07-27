from typing import TypedDict, Dict, List, Optional, Literal, Annotated
try:
    from typing import NotRequired
except ImportError:  # Python < 3.11
    from typing_extensions import NotRequired

import uuid
from pathlib import Path

from .scraper import fetch_transcript, fetch_file
from ai.models import IndexPDFs, IndexVideos, FlashCards, ResourseQuizes, Notes
from spaces.models import Resource, Files
from .prompts import summarize_prompt, notes_generation_prompt, flashcard_generation_prompt, quiz_generation_prompt
from .schema import *

from .s3 import s3
from .dep import splitter, video_vector_store, pdf_vector_store


from tempfile import TemporaryDirectory
import fitz

from langchain_core.documents import Document
from langgraph.types import Send
from langgraph.graph import StateGraph, END
from langchain.chat_models import init_chat_model
import operator
import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4.1")

OUTPUT_TOKENS = 4000
PROMPT_OVERHEAD = 1000
MODEL = 'gpt-4.1'

MODEL_CONTEXT = {
    "gpt-4o": 128_000,
    "gpt-4.1": 1_000_000,
    "gpt-4.1-mini": 1_000_000,
    "gpt-4.1-nano": 1_000_000,
}

TARGET_INPUT = (
    MODEL_CONTEXT[MODEL]
    - OUTPUT_TOKENS
    - PROMPT_OVERHEAD
)


class State(TypedDict):
    resource: Resource
    instructions: List[instruction]
    transcript: NotRequired[list[dict]]
    text_content: NotRequired[str]
    summarise: Annotated[list[str], operator.add]   # Fix #2: Annotated, not NotRequired[..., operator.add]
    chunks: NotRequired[list[str]]
    notes: NotRequired[str]
    notes_title: NotRequired[str]
    flashcard_title: NotRequired[str]
    quiz_title: NotRequired[str]
    flashcards: NotRequired[FlashcardSet]
    quizes: NotRequired[Quiz]
    status: NotRequired[str]
    

model = init_chat_model(
    model='gpt-4.1',            # Fix #3: was 'gpt-4', now consistent with MODEL constant
    model_provider='openai',
    temperature=0

)
summary_model = init_chat_model(
    model='gpt-4.1-mini',            # Fix #3: was 'gpt-4', now consistent with MODEL constant
    model_provider='openai',
    temperature=0
)

flashcard_generation_model = model.with_structured_output(FlashcardSet)
quiz_generation_model = model.with_structured_output(Quiz)

def init(state: State):
    return {'status': 'Processing content'}

def fetch_content(state: State):
    if state["resource"].type == 'youtube':      # Fix #4 & #7: use .type, correct lowercase value
        transcript = fetch_transcript(state["resource"].youtube_video.video_id)  # Fix #4
        return {'transcript': transcript}

    with TemporaryDirectory() as temp_dir:
        file_path = fetch_file(state["resource"].pdf_file.file_id, temp_dir)    # Fix #4
        file = fitz.open(file_path)
        content = ""
        for i, page in enumerate(file):
            content += "page " + str(i + 1) + "\n" + page.get_text()
        
        if not content:
            raise ValueError("No content found in PDF")
        
        return {'text_content': content}

def process_transcript(state: State):
    content = "\n".join([str(item["text"]) for item in state["transcript"]])
    docs = splitter.split_documents([Document(page_content=content, metadata={   # Fix #5: splitter now imported
        "video_id": state["resource"].youtube_video.video_id,
        "type": "youtube",
        "content_type": "content"
    })])
    batch_size = 50

    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        video_vector_store.add_documents(batch)   # Fix #5: video_vector_store now imported
    
    IndexVideos.objects.create(
        video_id=state["resource"].youtube_video.video_id,
        collection_name="video_embeddings",
        tanscript=state["transcript"]
    )
    return {'status': 'Summarising content'}

def process_pdf(state: State):
    docs = splitter.split_documents([Document(page_content=state["text_content"], metadata={  # Fix #5
        "pdf_id": str(state["resource"].pdf_file.file_id),
        "type": "pdf",
        "content_type": "content"
    })])
    batch_size = 50

    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        pdf_vector_store.add_documents(batch)   # Fix #5: pdf_vector_store now imported
    
    file = Files.objects.get(file_id=state["resource"].pdf_file.file_id)
    IndexPDFs.objects.create(
        file=file,
        collection_name="pdf_embeddings",
    )
    return {"status": "Summarising content"}

def send_content(state: State):

    batch_size = 10

    if state["resource"].type == 'youtube':         # Fix #6: use resource.type, correct lowercase
        result = video_vector_store.get(
            ids = None,
            where = {
                "video_id": state["resource"].youtube_video.video_id,
                "type": "youtube",
                "content_type": "content"
            }
        )
        docs = [Document(page_content=text) for text in result.get("documents", [])]
        return [
            Send("summarize_chunks", {
                "chunks": docs[i:i+batch_size],
                "resource": state["resource"]
            })
            for i in range(0, len(docs), batch_size)
        ]

    else:
        result = pdf_vector_store.get(
            ids = None,
            where = {
                "pdf_id": str(state["resource"].pdf_file.file_id),
                "type": "pdf",
                "content_type": "content"
            }
        )
        docs = [Document(page_content=text) for text in result.get("documents", [])]
        return [
            Send("summarize_chunks", {
                "chunks": docs[i:i+batch_size],
                "resource": state["resource"]
            })
            for i in range(0, len(docs), batch_size)
        ]

def summarize_chunks(state: State):
    summary = summary_model.invoke(
        summarize_prompt.format(content="\n".join([chunk.page_content for chunk in state['chunks']]))
    )
    return {"summarise": [summary.content]}


from accounts.models import CreditWallet
from payments.models import CreditUsage


def save_summaries(state: State):
    user = state["resource"].module.space.user
    credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
    if credit_wallet.debit(50):
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=50,
            transaction_type="debit",
            description=f"Debited 50 credits for processing & indexing content for resource '{state['resource'].id}'",
        )

    if state["resource"].type == 'youtube':        
        docs = [Document(
            page_content=summary,
            metadata={
                "video_id": state["resource"].youtube_video.video_id,
                "type": "youtube",
                "content_type": "summaries"
            }
        ) for summary in state['summarise']]
        video_vector_store.add_documents(docs)
    
    else:
        docs = [Document(
            page_content=summary,
            metadata={
                "pdf_id": str(state["resource"].pdf_file.file_id),
                "type": "pdf",
                "content_type": "summaries"
            }
        ) for summary in state['summarise']]
        pdf_vector_store.add_documents(docs)
    
    status = f"Generating {', '.join([instruction['type'] for instruction in state['instructions']])}"
    return {"status": status}

def fetch_summarise(state: State):

    if state['resource'].type == "youtube":
        result = video_vector_store.get(
            ids = None,
            where = {
                "video_id": state["resource"].youtube_video.video_id,
                "type": "youtube",
                "content_type": "summaries"
            }
        )
        status = f"Generating {', '.join([instruction['type'] for instruction in state['instructions']])}"
        return {"summarise": result.get("documents", []), "status": status}

    else:
        result = pdf_vector_store.get(
            ids = None,
            where = {
                "pdf_id": str(state["resource"].pdf_file.file_id),
                "type": "pdf",
                "content_type": "summaries"
            }
        )
        return {"summarise": result.get("documents", [])}

def generate_notes(state: State):
    merged_summaries = "\n".join(state["summarise"])
    tokens = encoding.encode(merged_summaries)
    token_count = len(tokens)

    instruction_text = ''
    instruction_title = 'Study Notes'

    for inst in state['instructions']:
        if inst['type'] == 'notes':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Study Notes')
            break

    if token_count > TARGET_INPUT:
        raise ValueError("Content is too long")
    
    response = model.invoke(
        notes_generation_prompt.format(summary=merged_summaries, instruction=instruction_text)
    )
    return {"notes": response.content, "notes_title": instruction_title}

def export_notes(state: State):
    import pypandoc

    try:
        pypandoc.get_pandoc_version()
    except OSError:
        pypandoc.download_pandoc()

    with TemporaryDirectory() as temp_dir:
        note_id = str(uuid.uuid4())
        md_path = f'{temp_dir}/{note_id}.md'
        docx_path = f'{temp_dir}/{note_id}.docx'
        
        # Write markdown to temp file
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(state["notes"])
        
        # Build pypandoc extra args
        extra_args = ["--toc", "--number-sections"]
        
        # Use reference.docx if it exists alongside this file
        reference_doc = Path(__file__).parent / "reference.docx"
        if reference_doc.exists():
            extra_args.append(f"--reference-doc={reference_doc}")
        
        # Convert markdown -> docx
        pypandoc.convert_file(
            md_path,
            'docx',
            outputfile=docx_path,
            extra_args=extra_args,
        )
        
        s3_key = f'notes/{note_id}.docx'
        s3.upload_file(docx_path, "StudyBase", s3_key)
    
    title = state.get("notes_title") or "Study Notes"
    Notes.objects.create(
        resource=state["resource"],
        title=title,
        path=s3_key
    )
    
    return {}
        
    
def generate_flashcards(state: State):
    merged_summaries = "\n".join(state["summarise"])
    
    instruction_text = ''
    instruction_title = 'Flashcards'

    for inst in state['instructions']:
        if inst['type'] == 'flashcard':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Flashcards')
            break

    tokens = encoding.encode(merged_summaries)
    token_count = len(tokens)

    if token_count > TARGET_INPUT:
        raise ValueError("Content is too long")
    
    flashcards = flashcard_generation_model.invoke(
        flashcard_generation_prompt.format(summary=merged_summaries, instruction=instruction_text)    # Fix #10: prompt now imported
    )

    FlashCards.objects.create(
        resource=state["resource"],
        title=instruction_title,
        content=flashcards.model_dump().get("flashcards", [])
    )
    
    return {"flashcards": flashcards}

def generate_quizes(state: State):
    merged_summaries = "\n".join(state["summarise"])
    
    instruction_text = ''
    instruction_title = 'Quiz'

    for inst in state['instructions']:
        if inst['type'] == 'quize':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Quiz')
            break

    tokens = encoding.encode(merged_summaries)
    token_count = len(tokens)

    if token_count > TARGET_INPUT:
        raise ValueError("Content is too long")
    
    quizes = quiz_generation_model.invoke(
        quiz_generation_prompt.format(summary=merged_summaries, instruction=instruction_text)         # Fix #10: prompt now imported
    )

    ResourseQuizes.objects.create(
        resource=state["resource"],
        title=instruction_title,
        content=quizes.model_dump().get("questions", [])
    )
    
    return {"quizes": quizes}

def combine_content(state: State):
    return {"status": 'All Content Generated'}

def check_indexing(state: State):
    if state['resource'].type == 'youtube':
        if IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).exists():
            return 'fetch_summarise'
    else:
        if IndexPDFs.objects.filter(file__file_id=state["resource"].pdf_file.file_id).exists():
            return 'fetch_summarise'

    return 'fetch_content'

def check_content(state: State):
    if state['resource'].type == 'youtube':
        return 'process_transcript'
    else:
        return 'process_pdf'

def generate_content(state: State):
    opr = []

    if not state['instructions']:
        return END
        
    for instruction in state['instructions']:
        if instruction['type'] == 'quize':
            opr.append(Send("generate_quizes", {
                'summarise': state['summarise'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
        if instruction['type'] == 'notes':
            opr.append(Send("generate_notes", {
                'summarise': state['summarise'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
        if instruction['type'] == 'flashcard':
            opr.append(Send("generate_flashcards", {
                'summarise': state['summarise'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
    
    return opr

def build_state_graph():
    builder = StateGraph(State)
    builder.add_node("init", init)
    builder.add_node("fetch_content", fetch_content)
    builder.add_node("process_transcript", process_transcript)
    builder.add_node("process_pdf", process_pdf)
    builder.add_node("summarize_chunks", summarize_chunks)
    builder.add_node("save_summaries", save_summaries)
    builder.add_node("fetch_summarise", fetch_summarise)
    builder.add_node("generate_notes", generate_notes)
    builder.add_node("export_notes", export_notes)
    builder.add_node("generate_flashcards", generate_flashcards)
    builder.add_node("generate_quizes", generate_quizes)
    builder.add_node("combine_content", combine_content)    # Fix #11: node was missing from graph registration

    builder.set_entry_point('init')
    builder.add_conditional_edges(
        'init', 
        check_indexing, 
        {
            'fetch_content': 'fetch_content',
            'fetch_summarise': 'fetch_summarise'
        }
    )
    builder.add_conditional_edges(
        'fetch_content',
        check_content,
        {
            "process_transcript": "process_transcript",
            "process_pdf": "process_pdf"
        }
    )

    builder.add_conditional_edges('process_transcript', send_content)
    builder.add_conditional_edges('process_pdf', send_content)
    builder.add_edge('summarize_chunks', 'save_summaries')
    builder.add_conditional_edges('save_summaries', generate_content)
    builder.add_conditional_edges('fetch_summarise', generate_content)
    builder.add_edge('generate_notes', 'export_notes')
    builder.add_edge('export_notes', 'combine_content')
    builder.add_edge('generate_flashcards', 'combine_content')
    builder.add_edge('generate_quizes', 'combine_content')
    builder.add_edge('combine_content', END)

    return builder.compile()