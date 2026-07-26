"""
Manual workflow test — run with:
    python test_workflow.py
"""
import os
import django
import traceback
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "StudyBase.settings")
django.setup()

if __name__ == "__main__":
    RESOURCE_ID = "f800197f-f17f-4ec1-87f3-3da7662c32e5"  # Stanford Diffusion Lecture 1
    INSTRUCTIONS = [
        {"type": "notes",     "text": ""},
        # {"type": "flashcard", "text": ""},  # uncomment to test flashcards
        # {"type": "quize",     "text": ""},  # uncomment to test quizes
    ]

    print("=" * 60)
    print("STUDYBASE — MANUAL WORKFLOW TEST")
    print("=" * 60)

    # ── 1. Load resource ────────────────────────────────────────────
    from spaces.models import Resource
    try:
        resource = Resource.objects.select_related("youtube_video", "pdf_file").get(pk=RESOURCE_ID)
        print(f"\n✅ Resource loaded: {resource.pk}")
        print(f"   type : {resource.type}")
        if resource.type == "youtube":
            print(f"   video: {resource.youtube_video.video_id} — {resource.youtube_video.title}")
        else:
            print(f"   file : {resource.pdf_file.file_name}")
    except Exception:
        print("❌ Failed to load resource:")
        traceback.print_exc()
        raise SystemExit(1)

    # ── 2. Build workflow graph ─────────────────────────────────────
    print("\n⚙️  Building workflow graph …")
    try:
        from ai.services.workflow import build_state_graph
        workflow = build_state_graph()
        print("✅ Graph compiled successfully")
    except Exception:
        print("❌ Graph compilation failed:")
        traceback.print_exc()
        raise SystemExit(1)

    # ── 3. Execute workflow ─────────────────────────────────────────
    inputs = {
        "resource_id": str(resource.id),
        "resource_type": resource.type,
        "instructions": INSTRUCTIONS,
    }

    print("\n🚀 Executing graph … (streaming nodes)\n")
    try:
        for chunk in workflow.stream(inputs, stream_mode="updates"):
            for node_name, node_output in chunk.items():
                print(f"  ──▶ [{node_name}] completed")
                if "notes_markdown" in node_output and node_output["notes_markdown"]:
                    preview = node_output["notes_markdown"][:120].replace("\n", " ")
                    print(f"      notes len={len(node_output['notes_markdown'])} preview: {preview}…")
                if "flashcards" in node_output and node_output["flashcards"]:
                    print(f"      flashcards count={len(node_output['flashcards'])}")
                if "quizzes" in node_output and node_output["quizzes"]:
                    print(f"      quizzes count={len(node_output['quizzes'])}")
        print("\n✅ Workflow stream finished with 0 errors!")
    except Exception:
        print("\n❌ Workflow execution error:")
        traceback.print_exc()
        raise SystemExit(1)
