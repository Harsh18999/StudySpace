import os
from pathlib import Path
import dotenv
from celery import Celery

# Load .env before anything else so LangSmith tracing vars are set
# before LangChain/LangGraph libraries are imported.
_ENV_FILE = Path(__file__).resolve().parent / ".env"
dotenv.load_dotenv(_ENV_FILE, override=True)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "StudyBase.settings")

app = Celery("StudyBase")

# Read configuration from Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto discover tasks.py files
app.autodiscover_tasks()