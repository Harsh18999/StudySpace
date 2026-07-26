import logging
import traceback
from celery import shared_task

from spaces.models import Resource, Module
from ai.models import (
    Notes,
    FlashCards,
    ResourseQuizes,
    GenerationJob,
    ModuleGenerationJob,
    ModuleFlashcards,
    ModuleQuizes,
)
from ai.services.module_services import Instruction

logger = logging.getLogger(__name__)


def _update_job(job_id: str, **fields):
    """
    Helper: update the GenerationJob row identified by job_id.
    Swallows DB errors so a failed update never kills the workflow.
    """
    try:
        GenerationJob.objects.filter(pk=job_id).update(**fields)
    except Exception as exc:
        logger.warning("[%s] Failed to update GenerationJob: %s", job_id, exc)

def _update_module_job(job_id: str, **fields):
    try:
        ModuleGenerationJob.objects.filter(pk=job_id).update(**fields)
    except Exception as exc:
        logger.warning("[%s] Failed to update ModuleGenerationJob: %s", job_id, exc)

@shared_task(bind=True)
def run_workflow(self, job_id: str, resource_id: str, instructions: list):
    """
    Run the LangGraph generation workflow for a resource.

    Writes status updates into the GenerationJob table so the frontend
    can poll ``GET /api/ai/jobs/<job_id>/`` for progress.

    Args:
        job_id:       UUID string (PK of the GenerationJob row).
        resource_id:  PK of the spaces.Resource to process.
        instructions: List of instruction dicts e.g.
                      [{"type": "notes", "text": ""}, ...]
    """
    logger.info("[%s] Task started — resource_id=%s instructions=%s", job_id, resource_id, instructions)

    _update_job(job_id, status="running", message="Starting workflow…")

    try:
        from ai.services.workflow import build_state_graph
        workflow = build_state_graph()
    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("[%s] Failed to build workflow graph:\n%s", job_id, tb)
        _update_job(job_id, status="failed", message=str(exc))
        return

    try:
        resource = Resource.objects.select_related(
            "youtube_video", "pdf_file"
        ).get(pk=resource_id)
    except Resource.DoesNotExist:
        msg = f"Resource {resource_id} not found."
        logger.error("[%s] %s", job_id, msg)
        _update_job(job_id, status="failed", message=msg)
        return
    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("[%s] Unexpected error loading resource:\n%s", job_id, tb)
        _update_job(job_id, status="failed", message=str(exc))
        return

    initial_state = {
        "resource": resource,
        "instructions": instructions,
        "summarise": [],
    }

    last_status = None

    try:
        for chunk in workflow.stream(
            initial_state,
            stream_mode="updates",
        ):
            for node_name, state in chunk.items():
                if state is not None and hasattr(state, "keys"):
                    logger.info("[%s] Node finished: %s — state keys: %s", job_id, node_name, list(state.keys()))
                else:
                    logger.info("[%s] Node finished: %s — state: %s", job_id, node_name, state)

                if state is not None and hasattr(state, "get"):
                    current_status = state.get("status")
                    if current_status and current_status != last_status:
                        last_status = current_status
                        _update_job(job_id, message=current_status)

    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("[%s] Workflow execution error:\n%s", job_id, tb)
        _update_job(job_id, status="failed", message=str(exc))
        raise

    logger.info("[%s] Workflow completed successfully.", job_id)

    result: dict = {}
    requested_types = {i["type"] for i in instructions}

    if "notes" in requested_types:
        note = Notes.objects.filter(resource=resource).order_by("-created_at").first()
        if note:
            result["notes"] = {
                "note_id": str(note.note_id),
                "title": note.title,
                "path": note.path,
                "created_at": note.created_at.isoformat(),
            }

    if "flashcard" in requested_types:
        fc = FlashCards.objects.filter(resource=resource).order_by("-created_at").first()
        if fc:
            result["flashcards"] = {
                "flashcard_id": str(fc.flashcard_id),
                "title": fc.title,
                "created_at": fc.created_at.isoformat(),
            }

    if "quize" in requested_types:
        quiz = ResourseQuizes.objects.filter(resource=resource).order_by("-created_at").first()
        if quiz:
            result["quizes"] = {
                "quiz_id": str(quiz.quiz_id),
                "title": quiz.title,
                "created_at": quiz.created_at.isoformat(),
            }

    logger.info("[%s] Pushing result to DB: %s", job_id, list(result.keys()))
    _update_job(job_id, status="completed", message="All content generated", result=result)


@shared_task(bind=True)
def run_module_workflow(self, job_id: str, module_id: str, resource_ids: list, instruction_data: dict):
    """
    Run the module-level LangGraph workflow.

    Args:
        job_id:          UUID string (PK of the ModuleGenerationJob row).
        module_id:       PK of the spaces.Module.
        resource_ids:    List of PK strings for spaces.Resource instances.
        instruction_data: Dict matching Instruction fields.
    """
    logger.info("[%s] Task started — module_id=%s instruction=%s", job_id, module_id, instruction_data)

    _update_module_job(job_id, status="running", message="Starting workflow…")

    # Load module
    try:
        module = Module.objects.get(pk=module_id)
    except Module.DoesNotExist:
        msg = f"Module {module_id} not found."
        logger.error("[%s] %s", job_id, msg)
        _update_module_job(job_id, status="failed", message=msg)
        return

    # Load resources
    resources = list(
        Resource.objects.select_related("youtube_video", "pdf_file").filter(pk__in=resource_ids)
    )

    # Rebuild Instruction pydantic model
    instruction = Instruction(**instruction_data)

    try:
        from ai.services.module_services import build_graph
        workflow = build_graph()
    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("[%s] Failed to build workflow graph:\n%s", job_id, tb)
        _update_module_job(job_id, status="failed", message=str(exc))
        return

    initial_state = {
        "module": module,
        "resources": resources,
        "instruction": instruction,
        "quizes": [],
        "flashcards": [],
        "status": "",
    }

    last_status = None

    try:
        for chunk in workflow.stream(
            initial_state,
            stream_mode="updates",
        ):
            for node_name, state in chunk.items():
                if state is not None and hasattr(state, "keys"):
                    logger.info("[%s] Node finished: %s — state keys: %s", job_id, node_name, list(state.keys()))
                else:
                    logger.info("[%s] Node finished: %s — state: %s", job_id, node_name, state)

                if state is not None and hasattr(state, "get"):
                    current_status = state.get("status")
                    if current_status and current_status != last_status:
                        last_status = current_status
                        _update_module_job(job_id, message=current_status)

    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("[%s] Workflow execution error:\n%s", job_id, tb)
        _update_module_job(job_id, status="failed", message=str(exc))
        raise

    logger.info("[%s] Workflow completed successfully.", job_id)
    result: dict = {}

    if instruction.type == "flashcard":
        fc = ModuleFlashcards.objects.filter(module=module).order_by("-created_at").first()
        if fc:
            result["flashcards"] = {
                "flashcard_id": str(fc.flashcard_id),
                "title": fc.title,
                "created_at": fc.created_at.isoformat(),
            }

    if instruction.type == "quize":
        quiz = ModuleQuizes.objects.filter(module=module).order_by("-created_at").first()
        if quiz:
            result["quizes"] = {
                "quiz_id": str(quiz.quiz_id),
                "title": quiz.title,
                "created_at": quiz.created_at.isoformat(),
            }

    logger.info("[%s] Pushing result to DB: %s", job_id, list(result.keys()))
    _update_module_job(job_id, status="completed", message="All content generated", result=result)
