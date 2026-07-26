FROM python:3.10-slim

# Install system dependencies: Pandoc, PostgreSQL client libraries, build tools, bash
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn uvicorn

# Copy application source code
COPY . .

# Grant execution permissions to start.sh script
RUN chmod +x start.sh

EXPOSE 8000

# Run migrations, background Celery worker, and Daphne Web server together
CMD ["./start.sh"]
