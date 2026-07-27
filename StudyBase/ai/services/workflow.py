from typing import TypedDict, Dict, List, Optional, Literal, Annotated
try:
    from typing import NotRequired
except ImportError:  # Python < 3.11
    from typing_extensions import NotRequired

import uuid
from pathlib import Path

from .scraper import fetch_transcript as fetch_transcript_from_scraper, fetch_file
from ai.models import IndexPDFs, IndexVideos, FlashCards, ResourseQuizes, Notes
from spaces.models import Resource, Files
from .prompts import summarize_prompt, final_summary_prompt, notes_generation_prompt, flashcard_generation_prompt, quiz_generation_prompt
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
    final_summary: NotRequired[str]
    chunks: NotRequired[list[str]]
    notes: NotRequired[str]
    notes_title: NotRequired[str]
    flashcard_title: NotRequired[str]
    quiz_title: NotRequired[str]
    flashcards: NotRequired[FlashcardSet]
    quizes: NotRequired[Quiz]
    status: NotRequired[str]
    

summary_model = init_chat_model(
    model='gpt-5.4-nano',
    model_provider='openai',
    temperature=0
)

final_summary_model = init_chat_model(
    model='gpt-5.4-mini',            
    model_provider='openai',
    temperature=0
)

generation_model = init_chat_model(
    model='gpt-5.4-mini',            
    model_provider='openai',
    temperature=0
)

flashcard_generation_model = generation_model.with_structured_output(FlashcardSet)
quiz_generation_model = generation_model.with_structured_output(Quiz)

def init(state: State):
    return {'status': 'Processing content'}

def fetch_content(state: State):
    if state["resource"].type == 'youtube':      # Fix #4 & #7: use .type, correct lowercase value
        transcript = fetch_transcript_from_scraper(state["resource"].youtube_video.video_id)  # Fix #4
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

def fetch_transcript(state: State):
    indexed = IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).first()
    transcript = (getattr(indexed, 'transcript', None) if indexed else None) or (getattr(indexed, 'transcript', None) if indexed else None)
    if not transcript:
        transcript = fetch_transcript_from_scraper(state["resource"].youtube_video.video_id)
    return {'transcript': transcript}
    
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
    
    indexed = IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).first()
    if indexed:
        indexed.collection_name = "video_embeddings"
        indexed.transcript = state["transcript"]
        indexed.save()
    else:
        IndexVideos.objects.create(
            video_id=state["resource"].youtube_video.video_id,
            collection_name="video_embeddings",
            transcript=state["transcript"]
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
    indexed = IndexPDFs.objects.filter(file=file).first()
    if indexed:
        indexed.collection_name = "pdf_embeddings"
        indexed.save()
    else:
        IndexPDFs.objects.create(
            file=file,
            collection_name="pdf_embeddings",
        )
    return {"status": "Summarising content"}

def send_content(state: State):

    batch_size = 15

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
        summarize_prompt.format(content="\n".join([chunk.page_content for chunk in state['chunks']])), 
        max_tokens=1000
    )
    return {"summarise": [summary.content]}


from accounts.models import CreditWallet
from payments.models import CreditUsage

def final_summary(state: State):
    summary = final_summary_model.invoke(final_summary_prompt.format(content="\n".join(state['summarise'])), max_tokens=3000)
    
    if state["resource"].type == 'youtube':
        indexed = IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).first()
        if indexed:
            indexed.final_summary = summary.content
            indexed.save()
    else:
        indexed = IndexPDFs.objects.filter(file__file_id=state["resource"].pdf_file.file_id).first()
        if indexed:
            indexed.final_summary = summary.content
            indexed.save()

    user = state["resource"].module.space.user
    credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
    if credit_wallet.debit(50):
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=50,
            transaction_type="debit",
            description=f"Debited 50 credits for processing & indexing content for resource '{state['resource'].id}'",
        )

    return {"final_summary": summary.content, "status": "Processing complete"}
    
def fetch_final_summary(state: State):
    if state["resource"].type == 'youtube':
        indexed = IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).first()
    else:
        indexed = IndexPDFs.objects.filter(file__file_id=state["resource"].pdf_file.file_id).first()
    
    final_summary_text = indexed.final_summary if (indexed and indexed.final_summary) else ""
    return {"final_summary": final_summary_text}

def generate_notes(state: State):
    instruction_text = ''
    instruction_title = 'Study Notes'

    for inst in state['instructions']:
        if inst['type'] == 'notes':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Study Notes')
            break

    response = generation_model.invoke(
        notes_generation_prompt.format(summary=state['final_summary'], instruction=instruction_text)
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

    instruction_text = ''
    instruction_title = 'Flashcards'

    for inst in state['instructions']:
        if inst['type'] == 'flashcard':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Flashcards')
            break

    flashcards = flashcard_generation_model.invoke(
        flashcard_generation_prompt.format(summary=state['final_summary'], instruction=instruction_text)    # Fix #10: prompt now imported
    )

    FlashCards.objects.create(
        resource=state["resource"],
        title=instruction_title,
        content=flashcards.model_dump().get("flashcards", [])
    )
    
    return {"flashcards": flashcards}

def generate_quizes(state: State):
    instruction_text = ''
    instruction_title = 'Quiz'

    for inst in state['instructions']:
        if inst['type'] == 'quize':
            instruction_text = inst.get('text', '')
            instruction_title = inst.get('title', 'Quiz')
            break
    
    quizes = quiz_generation_model.invoke(
        quiz_generation_prompt.format(summary=state['final_summary'], instruction=instruction_text)         # Fix #10: prompt now imported
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
        indexed = IndexVideos.objects.filter(video_id=state["resource"].youtube_video.video_id).first()
        if indexed:
            if not indexed.transcript:
                return 'fetch_transcript'
            return 'fetch_final_summary'
    else:
        indexed = IndexPDFs.objects.filter(file__file_id=state["resource"].pdf_file.file_id).first()
        if indexed:
            return 'fetch_final_summary'

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
                'final_summary': state['final_summary'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
        if instruction['type'] == 'notes':
            opr.append(Send("generate_notes", {
                'final_summary': state['final_summary'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
        if instruction['type'] == 'flashcard':
            opr.append(Send("generate_flashcards", {
                'final_summary': state['final_summary'],
                'resource': state['resource'],
                'instructions': state['instructions']
            }))
    
    return opr

def build_state_graph():
    builder = StateGraph(State)
    builder.add_node("init", init)
    builder.add_node("fetch_content", fetch_content)
    builder.add_node("fetch_transcript", fetch_transcript)
    builder.add_node("process_transcript", process_transcript)
    builder.add_node("process_pdf", process_pdf)
    builder.add_node("summarize_chunks", summarize_chunks)
    builder.add_node("final_summary", final_summary)
    builder.add_node("fetch_final_summary", fetch_final_summary)
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
            'fetch_final_summary': 'fetch_final_summary',
            'fetch_transcript': 'fetch_transcript'
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
    
    builder.add_edge('fetch_transcript', 'process_transcript')
    builder.add_conditional_edges('process_transcript', send_content)
    builder.add_conditional_edges('process_pdf', send_content)
    builder.add_edge('summarize_chunks', 'final_summary')
    builder.add_conditional_edges('final_summary', generate_content)
    builder.add_conditional_edges('fetch_final_summary', generate_content)
    builder.add_edge('generate_notes', 'export_notes')
    builder.add_edge('export_notes', 'combine_content')
    builder.add_edge('generate_flashcards', 'combine_content')
    builder.add_edge('generate_quizes', 'combine_content')
    builder.add_edge('combine_content', END)

    return builder.compile()