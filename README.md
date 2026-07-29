# 🚀 StudySpace.AI — Backend API & AI Engine

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.16-red?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-121011?style=for-the-badge&logo=chainlink&logoColor=white)](https://www.langchain.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-FF4F00?style=for-the-badge&logo=graphql&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Celery](https://img.shields.io/badge/Celery-5.6-37B24D?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![WebSockets](https://img.shields.io/badge/Django_Channels-Daphne-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://channels.readthedocs.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

An enterprise-grade asynchronous backend service and agentic AI processing pipeline built for **StudySpace.AI** — a modern, AI-powered study workspace and intelligent learning assistant platform.

This backend orchestrates multi-modal content extraction (YouTube transcripts & PDF documents), vector embedding & retrieval-augmented generation (RAG), graph-based autonomous AI pipelines, real-time WebSocket study tracking, and a credit-based monetization engine with Razorpay integration.

---

## 📋 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Features](#-key-features)
  - [1. Authentication & Identity Management](#1-authentication--identity-management)
  - [2. Workspace & Resource Architecture](#2-workspace--resource-architecture)
  - [3. Agentic LangChain / LangGraph AI Engine](#3-agentic-langchain--langgraph-ai-engine)
  - [4. RAG AI Tutor Chat System](#4-rag-ai-tutor-chat-system)
  - [5. Real-Time WebSockets & Analytics](#5-real-time-websockets--analytics)
  - [6. Credit Wallet & Payment Integration](#6-credit-wallet--payment-integration)
  - [7. OpenAPI Documentation & Health Monitoring](#7-openapi-documentation--health-monitoring)
- [Tech Stack & System Dependencies](#-tech-stack--system-dependencies)
- [Database Schema](#-database-schema)
- [LangGraph AI Pipeline Workflow](#-langgraph-ai-pipeline-workflow)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Environment Configuration](#-environment-configuration)
- [Local Setup & Installation](#-local-setup--installation)
- [Docker & Containerized Deployment](#-docker--containerized-deployment)
- [Testing](#-testing)

---

## 🏗️ Architectural Overview

```mermaid
graph TD
    Client[📱 Web Client / Frontend] -->|HTTPS REST API| DjangoAPI[⚡ Django REST Framework]
    Client -->|WSS WebSockets| Daphne[🔌 Daphne ASGI / Channels Layer]
    
    subgraph "Core Backend Services"
        DjangoAPI --> Auth[🔐 Auth & Accounts Service]
        DjangoAPI --> Spaces[📚 Workspace Management]
        DjangoAPI --> Dash[📊 Analytics & Dashboard]
        DjangoAPI --> Payments[💳 Payments & Wallet Service]
        DjangoAPI --> AIViews[🤖 AI Orchestrator Gateway]
    end

    subgraph "Async & Queue Processing"
        AIViews -->|Enqueue Task| RedisBroker[(🔴 Redis Broker)]
        Daphne <-->|Channel Layer| RedisBroker
        RedisBroker --> CeleryWorker[⚙️ Celery Worker Service]
    end

    subgraph "AI & RAG Pipeline (LangGraph)"
        CeleryWorker --> Scraper[📥 YouTube / PDF Content Scraper]
        Scraper --> VectorDB[(🧠 Vector Store / Neon PGVector)]
        VectorDB --> GraphWorkflow[🔄 LangGraph StateGraph Execution]
        GraphWorkflow --> OpenAi[🤖 OpenAI GPT-4.1 / GPT-4o / Embeddings]
        GraphWorkflow --> Pandoc[📄 Pandoc DOCX Exporter]
    end

    subgraph "External Cloud Infrastructure"
        Pandoc -->|Upload DOCX| S3[☁️ AWS S3 Bucket]
        Payments -->|Payment Orders| Razorpay[💳 Razorpay Payment Gateway]
        Auth -->|Send OTP| SMTP[📧 Gmail SMTP Server]
        DjangoAPI --> PostgreSQL[(🐘 Neon PostgreSQL Database)]
    end
```

---

## ✨ Key Features

### 1. Authentication & Identity Management
- **Custom User Model**: Uses `email` as primary identifier (`USERNAME_FIELD`) backed by custom `UserManager`.
- **Two-Step Email OTP Registration**: Generates cryptographically secure 6-digit verification codes sent via Django SMTP (`django.core.mail`). OTPs expire automatically after 10 minutes.
- **Google OAuth 2.0 Integration**: Direct Google ID token verification and code exchange via `google.oauth2.id_token` (`/api/auth/google/`).
- **JWT Session Tokens**: Built with `rest_framework_simplejwt` supporting access and refresh token lifecycle.
- **Automated Wallet Provisioning**: Triggered upon registration; every new account automatically receives a pre-funded `CreditWallet` with **500 free credits**.

### 2. Workspace & Resource Architecture
- **Hierarchical Study Data Model**:
  $$\text{Space} \longrightarrow \text{Module} \longrightarrow \text{Resource}$$
- **Multi-Type Resource Handling**:
  - **YouTube Videos**: Stores video IDs, channel info, duration, title, descriptions, thumbnails, and published timestamps.
  - **PDF Documents / Files**: Manages file upload metadata, document sizes, original filenames, and S3 asset URLs.
- **Playlist Ingestion Engine**: Accepts YouTube playlist URLs, automatically fetching and creating resource items for all constituent videos in a single operation.
- **Granular Access Control**: Custom `IsOwnerPermission` ensuring users only access spaces, modules, and generated assets they own.

### 3. Agentic LangChain / LangGraph AI Engine
- **Multi-Modal Scraping**: Scrapes YouTube transcripts via `youtube_transcript_api` and extracts multi-page PDF text using PyMuPDF (`fitz`).
- **Vector Embedding & Indexing**: Performs recursive character text splitting (`RecursiveCharacterTextSplitter`) and indexes chunks with OpenAI `text-embedding-3-small` into Chroma / Neon PGVector stores.
- **StateGraph Async Workflow Execution**:
  - **Dynamic Index Checking**: Automatically checks if a resource is already indexed to reuse pre-computed summaries and save LLM token cost.
  - **Map-Reduce Summarization**: Uses parallel fan-out (`Send("summarize_chunks")`) with `gpt-4.1-mini` to summarize video/document chunk batches concurrently.
  - **Parallel Content Generation**: Simultaneously generates:
    - 📝 **Comprehensive Markdown Study Notes**
    - 🎯 **Structured Multiple-Choice Quizzes (MCQs)** with explanations
    - 🃏 **Interactive Flashcard Decks** (Front/Back cards)
  - **Automated DOCX Document Export**: Converts generated Markdown study notes into formatted Word documents (`.docx`) using **Pandoc** (`pypandoc`) with custom styling templates (`reference.docx`), uploading the result to AWS S3.
  - **Module-Level Aggregate Generation**: Cross-resource generation across entire modules combining multiple study materials into unified quiz and flashcard packages.

### 4. RAG AI Tutor Chat System
- **Interactive Conversational AI**: Dedicated RAG-powered tutor per YouTube video/PDF resource.
- **LangGraph Tool-Calling Agent**: State-driven agent equipped with:
  - `fetch_content`: Semantic similarity search across indexed vector store (`k=5`).
  - `fetch_content_timeline`: Timestamp-based transcript fetching for targeted video segments.
- **Token Window Optimization**: Dynamically trims chat message history using `trim_messages` to maintain contextual focus while operating under token limits.
- **State Checkpointing**: Leverages LangGraph `MemorySaver` / DB checkpointers for stateful, multi-turn conversational sessions.

### 5. Real-Time WebSockets & Analytics
- **Django Channels & Daphne ASGI Server**: Full asynchronous WebSocket handling powered by Redis channel layer.
- **Live Study Session Tracker (`/ws/study-session/`)**:
  - Automatically initializes or resumes active study sessions upon connection.
  - Connection multiplexing and heartbeat tracking (`USER_CONNECTIONS`, `USER_LAST_TICK`) with 25-second broadcast throttling.
  - Auto-finalizes and saves total elapsed duration (in seconds) to the database when the socket disconnects.
- **Analytics & Study Metrics (`ReportTags` & `ModuleProgress`)**:
  - Real-time updates triggered by Django Signals (`dashboard/signals.py`).
  - Tracks resource counts, flashcard counts, quiz counts, notes generated, average quiz accuracy %, current streaks, best streaks, total study hours, and module completion percentages.

### 6. Credit Wallet & Payment Integration
- **Atomic Credit Management**: `CreditWallet` with thread-safe `credit()` and `debit()` balance methods.
- **Audit Logging (`CreditUsage`)**: Records detailed debit/credit activity, timestamps, and resource references (e.g. 50 credits debited per AI generation job).
- **Razorpay Payment Gateway Integration**:
  - `/api/payments/create-order/`: Initiates Razorpay checkout orders.
  - `/api/payments/verify/`: Verifies Razorpay HMAC SHA256 payment signatures (`gateway_signature`), marking order success and topping up wallet balance.
- **Dynamic Payment Toggle (`PAYMENTOPTION`)**: Configurable `.env` flag (`ENABLE` / `DISABLE`) to allow running in open-source/free mode or commercial monetization mode.

### 7. OpenAPI Documentation & Health Monitoring
- **Automated OpenAPI 3.0 Documentation**: Fully typed and formatted interactive API docs generated via `drf-spectacular`:
  - **Swagger UI**: Accessible at `/api/docs/`
  - **Redoc UI**: Accessible at `/api/redoc/`
  - **Schema Download**: `/api/schema/`
- **Keep-Alive Service**: Ping endpoint (`/keep_alive/`) that triggers async Celery background tasks to keep server instances and database connections active on free-tier deployments.

---

## 🛠️ Tech Stack & System Dependencies

| Layer | Technology / Package | Purpose |
| :--- | :--- | :--- |
| **Language** | Python 3.9+ | Primary runtime environment |
| **Web Framework** | Django 4.2.30 & DRF 3.16 | Core web framework & REST API controllers |
| **ASGI Server & Sockets**| Daphne 4.2 & Django Channels 4.3 | Async ASGI server & WebSocket routing |
| **AI & RAG Framework** | LangChain 0.3 & LangGraph 0.6 | Autonomous agent pipelines & tool-calling state graphs |
| **LLM & Embeddings** | OpenAI GPT-4.1 / GPT-4o / text-embedding-3-small | Notes, quizzes, flashcards, chat & vector embeddings |
| **Document Processing** | PyMuPDF (fitz) & pypandoc | PDF text extraction & Markdown-to-DOCX compilation |
| **Task Queue & Broker** | Celery 5.6 & Redis 6.4 | Asynchronous background jobs & Celery task runner |
| **Databases** | PostgreSQL (Neon DB) / SQLite / PGVector | Relational database & vector embedding storage |
| **Cloud Storage** | AWS S3 via `boto3` & `s3transfer` | Document storage for generated `.docx` notes |
| **Payment Gateway** | Razorpay SDK 2.0 | Credit package order creation & signature verification |
| **API Documentation** | drf-spectacular 0.30 | Interactive Swagger UI & OpenAPI 3.0 schema generator |
| **Containerization** | Docker & Docker Compose | Production container runtime for Web & Worker containers |

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USER ||--o{ SPACE : owns
    USER ||--o1 CREDIT_WALLET : owns
    USER ||--o1 REPORT_TAGS : tracks
    USER ||--o{ STUDY_SESSION : records
    USER ||--o{ CREDIT_ORDERS : creates

    SPACE ||--o{ MODULE : contains
    MODULE ||--o{ RESOURCE : contains
    MODULE ||--o1 MODULE_PROGRESS : tracks

    RESOURCE ||--o| YOUTUBE_VIDEO : details
    RESOURCE ||--o| FILES : details
    RESOURCE ||--o{ NOTES : generates
    RESOURCE ||--o{ FLASHCARDS : generates
    RESOURCE ||--o{ RESOURCE_QUIZZES : generates

    CREDIT_WALLET ||--o{ CREDIT_USAGE : logs

    USER {
        bigint id PK
        string email UK
        string name
        string phone
    }

    CREDIT_WALLET {
        bigint id PK
        bigint user_id FK
        integer balance
    }

    SPACE {
        uuid id PK
        string name
        text description
        bigint user_id FK
        datetime created_at
    }

    MODULE {
        uuid id PK
        string name
        uuid space_id FK
        datetime created_at
    }

    RESOURCE {
        uuid id PK
        uuid module_id FK
        string type
    }

    STUDY_SESSION {
        uuid session_id PK
        bigint user_id FK
        datetime started_at
        datetime ended_at
        integer duration
    }

    REPORT_TAGS {
        bigint id PK
        bigint user_id FK
        integer resources
        integer flashcards
        integer quizzes
        integer notes
        float average_accuracy
        integer streaks
        integer best_streaks
        float total_hours
    }
```

---

## 🔄 LangGraph AI Pipeline Workflow

The resource generation pipeline uses a compiled `StateGraph` executed asynchronously within Celery worker threads:

```mermaid
flowchart TD
    Start([🚀 Task Triggered]) --> Init[node: init]
    Init --> CheckIndex{check_indexing}
    
    CheckIndex -->|Indexed| FetchSummaries[node: fetch_summarise]
    CheckIndex -->|Not Indexed| FetchContent[node: fetch_content]

    FetchContent --> CheckContentType{check_content}
    CheckContentType -->|YouTube| ProcTranscript[node: process_transcript]
    CheckContentType -->|PDF| ProcPDF[node: process_pdf]

    ProcTranscript --> SendContent[node: send_content]
    ProcPDF --> SendContent

    SendContent -->|Fan-Out Batches| SummarizeChunks[node: summarize_chunks]
    SummarizeChunks --> SaveSummaries[node: save_summaries]
    
    SaveSummaries --> GenRouter{generate_content}
    FetchSummaries --> GenRouter

    GenRouter -->|Parallel Fan-Out| GenNotes[node: generate_notes]
    GenRouter -->|Parallel Fan-Out| GenFlashcards[node: generate_flashcards]
    GenRouter -->|Parallel Fan-Out| GenQuizzes[node: generate_quizes]

    GenNotes --> ExportNotes[node: export_notes -> Pandoc -> S3]
    
    ExportNotes --> CombineContent[node: combine_content]
    GenFlashcards --> CombineContent
    GenQuizzes --> CombineContent

    CombineContent --> End([✅ Job Completed])
```

---

## 📡 API Endpoints Reference

### 🔑 Authentication (`/api/auth/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/send-otp/` | Request 6-digit email OTP code | ❌ |
| `POST` | `/api/auth/register/` | Verify OTP code & register account | ❌ |
| `POST` | `/api/auth/token/` | Obtain JWT access & refresh tokens | ❌ |
| `POST` | `/api/auth/token/refresh/` | Refresh expired JWT access token | ❌ |
| `POST` | `/api/auth/google/` | Authenticate / Register via Google OAuth 2.0 | ❌ |

### 👤 Profile (`/api/profile/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/profile/` | Fetch current user profile & wallet credit balance | 🔒 |

### 📚 Workspaces, Modules & Resources (`/api/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET / POST` | `/api/spaces/` | List all spaces or create a new study space | 🔒 |
| `GET / PUT / DELETE` | `/api/spaces/{id}/` | Retrieve, update, or delete a space | 🔒 |
| `GET / POST` | `/api/modules/` | List or create modules under a space | 🔒 |
| `GET / PUT / DELETE` | `/api/modules/{id}/` | Retrieve, update, or delete a module | 🔒 |
| `POST` | `/api/add/video/` | Add a single YouTube video resource | 🔒 |
| `POST` | `/api/add/playlist/` | Batch import a YouTube playlist into a module | 🔒 |
| `GET / DELETE` | `/api/resources/{id}/` | Retrieve or delete a resource | 🔒 |

### 🤖 AI Generation & Tutor Engine (`/api/ai/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/ai/generate/` | Dispatch async LangGraph job for resource content | 🔒 |
| `GET` | `/api/ai/jobs/{job_id}/` | Poll status & results of resource generation job | 🔒 |
| `POST` | `/api/ai/module/generate/` | Dispatch async LangGraph job for entire module | 🔒 |
| `GET` | `/api/ai/module/jobs/{job_id}/` | Poll status & results of module generation job | 🔒 |
| `GET` | `/api/ai/notes/{note_id}/` | Fetch generated study note content | 🔒 |
| `GET` | `/api/ai/flashcards/{id}/` | Fetch generated flashcard deck | 🔒 |
| `GET / POST` | `/api/ai/quizzes/{id}/` | Fetch quiz questions or submit answers | 🔒 |
| `POST` | `/api/ai/chat/` | Send message to RAG AI Tutor (YouTube/PDF) | 🔒 |

### 📊 Dashboard & Session Analytics (`/api/dashboard/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/dashboard/reports/` | Retrieve user study statistics, streaks & accuracy | 🔒 |
| `GET` | `/api/dashboard/sessions/` | Retrieve completed study session logs | 🔒 |
| `WS` | `/ws/study-session/` | Live WebSocket endpoint for real-time timer tracking | 🔒 |

### 💳 Payments & Credit Wallet (`/api/payments/`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/payments/create-order/` | Create a Razorpay payment order for credits | 🔒 |
| `POST` | `/api/payments/verify/` | Verify Razorpay payment signature & top up wallet | 🔒 |
| `GET` | `/api/payments/history/` | Fetch transaction logs & credit debit history | 🔒 |

### 📖 System & OpenAPI Docs
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/keep_alive/` | Ping health check endpoint (triggers Celery keep-alive) | ❌ |
| `GET` | `/api/docs/` | Interactive Swagger UI API documentation | ❌ |
| `GET` | `/api/redoc/` | Redoc API documentation interface | ❌ |

---

## ⚙️ Environment Configuration

Create a `.env` file in the root backend directory (`StudyBase/`):

```env
# -----------------------------------------------------------------------------
# Core Django & Security Settings
# -----------------------------------------------------------------------------
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,*

# -----------------------------------------------------------------------------
# Database Configuration (PostgreSQL / Neon DB)
# -----------------------------------------------------------------------------
MAIN_DATABASE_URL=postgresql://user:password@ep-example-host.neon.tech/dbname?sslmode=require

# -----------------------------------------------------------------------------
# Redis Configuration (Celery Broker & Django Channels Layer)
# -----------------------------------------------------------------------------
REDIS_URL=redis://localhost:6379/0

# -----------------------------------------------------------------------------
# AI Engine API Keys
# -----------------------------------------------------------------------------
OPENAI_API_KEY=sk-proj-your-openai-api-key
GEMINI_API_KEY=AIzaSy-your-gemini-api-key
YOUTUBE_API_KEY=AIzaSy-your-youtube-data-api-key

# -----------------------------------------------------------------------------
# AWS S3 Storage Settings (For Generated DOCX Notes)
# -----------------------------------------------------------------------------
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=StudyBase
AWS_S3_REGION_NAME=us-east-1

# -----------------------------------------------------------------------------
# Google OAuth Credentials
# -----------------------------------------------------------------------------
AUTH_CLINT_ID=your_google_client_id.apps.googleusercontent.com
AUTH_CLINT_SECRET=your_google_client_secret

# -----------------------------------------------------------------------------
# SMTP Email Setup (For Email OTP Verification)
# -----------------------------------------------------------------------------
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# -----------------------------------------------------------------------------
# Payment Configuration (Razorpay & Feature Flag)
# -----------------------------------------------------------------------------
PAYMENTOPTION=ENABLE   # Options: ENABLE or DISABLE
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- Python **3.9+** installed
- Redis server installed and running (`redis-server`)
- Pandoc installed on your system (e.g. `brew install pandoc` on macOS or `apt-get install pandoc` on Ubuntu)

### 1. Clone & Setup Virtual Environment
```bash
# Navigate to the backend directory
cd StudyBase

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations
```bash
python manage.py migrate
```

### 4. Start Redis Server
```bash
redis-server
```

### 5. Launch Asynchronous Celery Worker
In a separate terminal (with `.venv` activated):
```bash
celery -A StudyBase worker --loglevel=info --pool=solo
```

### 6. Start Development Server (ASGI / Daphne / Django)
```bash
python manage.py runserver
```
The backend service will be live at `http://127.0.0.1:8000/`.

---

## 🐳 Docker & Containerized Deployment

The backend includes dual production-ready Docker configurations:

### Build & Run Web API Server Container
```bash
docker build -t studyspace-backend -f Dockerfile .
docker run -p 8000:8000 --env-file .env studyspace-backend
```

### Build & Run Celery Worker Container
```bash
docker build -t studyspace-worker -f Dockerfile.worker .
docker run --env-file .env studyspace-worker
```

---

## 🧪 Testing

Execute the unit test suite covering authentication, spaces, AI tasks, and payments:

```bash
python manage.py test
```

---

<p center>
Developed as a showcase personal project highlighting Full-Stack System Architecture, Agentic AI Workflows, Asynchronous Queue Management, and Real-Time WebSockets.
</p>
