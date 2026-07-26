#!/bin/bash
set -e

echo "==> Running Django database migrations..."
python manage.py migrate --noinput

echo "==> Starting Celery worker in background..."
celery -A StudyBase worker --loglevel=info --pool=solo &

echo "==> Starting Daphne ASGI Web server on port ${PORT:-8000}..."
exec daphne -b 0.0.0.0 -p ${PORT:-8000} StudyBase.asgi:application
