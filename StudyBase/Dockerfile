FROM python:3.10-slim

# Install system dependencies: Pandoc, PostgreSQL client libraries, build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn uvicorn

# Copy application source code
COPY . .

EXPOSE 8000

# Entry command for ASGI Web Server (Supports HTTP + Django Channels WebSockets)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "StudyBase.asgi:application"]
