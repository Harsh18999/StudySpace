# 🚀 StudySpace.AI — Backend API Service

The backend API service for **StudySpace.AI** built with **Django 4.2**, **Django REST Framework (DRF)**, **Django Channels (WebSockets)**, **LangChain / LangGraph AI Pipeline**, **Celery**, and **PostgreSQL (Neon DB)**.

---

## ✨ Features

- **Authentication & Security**:
  - **Email OTP Verification**: 2-step manual registration with 6-digit verification code sent via SMTP.
  - **Google OAuth 2.0 Integration**: Verifies Google ID tokens & OAuth authorization codes (`/api/auth/google/`).
  - **JWT Session Tokens**: Powered by `rest_framework_simplejwt` with automated credit wallet provisioning (500 free credits).

- **Course Workspaces & Resource Management**:
  - CRUD operations for **Spaces**, **Modules**, and **Resources** (YouTube videos, PDFs, Research Papers, Web Articles).
  - Automatic YouTube transcript extraction & semantic character chunking.

- **AI Pipeline (LangChain / LangGraph)**:
  - Vector indexing & RAG embeddings (OpenAI `text-embedding-3-small` / Pinecone / Neon PGVector).
  - Auto-generation of **Markdown Notes**, **MCQ Quizzes**, **Flashcard Decks**, and **Formatted .docx Exports**.
  - RAG-powered **AI Tutor Chat** with source citations.

- **Real-Time WebSockets**:
  - **Study Session Tracker** (`ws://localhost:8000/ws/study-session/`): Real-time study streak analytics and active session timer via Django Channels & Redis.

- **Credit Wallet & Payment Toggle**:
  - Razorpay Integration (`/api/payments/create-order/`, `/api/payments/verify/`).
  - **Configurable Payment Toggle**: Set `PAYMENTOPTION=ENABLE` or `PAYMENTOPTION=DISABLE` in `.env` to enable or disable credit purchases system-wide.

- **API Documentation**:
  - Interactive OpenAPI 3.0 Swagger UI at `/api/docs/` and Redoc at `/api/redoc/`.

---

## 🛠️ Tech Stack

- **Framework**: Python 3.9+ / Django 4.2 / DRF
- **Database**: PostgreSQL (Neon DB) / SQLite
- **WebSockets**: Django Channels / Daphne / Redis Channel Layer
- **Async Tasks**: Celery + Redis
- **AI/LLM Integration**: LangChain, LangGraph, OpenAI GPT-4o, Google Gemini 1.5 Pro
- **Email Service**: Django SMTP (`django.core.mail`)
- **Payment Gateway**: Razorpay API

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the `StudyBase/` root directory:

```env
# Database Settings
MAIN_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
REDIS_URL=redis://localhost:6379

# AI API Keys
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
YOUTUBE_API_KEY=AIzaSy...

# Google OAuth Credentials
AUTH_CLINT_ID=your_google_client_id.apps.googleusercontent.com
AUTH_CLINT_SECRET=your_google_client_secret

# SMTP Email Setup (For OTP Verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# Payment Control (ENABLE / DISABLE)
PAYMENTOPTION=DISABLE
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## 🚀 Getting Started

### 1. Activate Virtual Environment
```bash
# From project root
source .venv/bin/activate
```

### 2. Install Dependencies & Run Migrations
```bash
cd StudyBase
python manage.py migrate
```

### 3. Run Development Server
```bash
python manage.py runserver
```
*The server will run at `http://localhost:8000/`.*

### 4. Run Celery Worker (In a separate terminal)
```bash
celery -A StudyBase worker --loglevel=info --pool=solo
```

---

## 📡 API Endpoint Overview

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/send-otp/` | Send 6-digit OTP verification code |
| **Auth** | `POST` | `/api/auth/register/` | Verify OTP & register new user |
| **Auth** | `POST` | `/api/auth/token/` | Email & Password JWT Login |
| **Auth** | `POST` | `/api/auth/google/` | Google OAuth 2.0 Login |
| **Profile** | `GET` | `/api/profile/` | Fetch user profile & credit balance |
| **Spaces** | `GET / POST` | `/api/spaces/` | List and create spaces |
| **AI** | `POST` | `/api/ai/generate/` | Generate notes/quizzes/flashcards |
| **AI** | `POST` | `/api/ai/chat/` | Ask AI tutor query |
| **Payments**| `POST` | `/api/payments/create-order/` | Create Razorpay credit order |
| **Payments**| `POST` | `/api/payments/verify/` | Verify Razorpay payment signature |
| **Payments**| `GET` | `/api/payments/history/` | Fetch transaction & usage history |
| **WebSocket**| `WS` | `/ws/study-session/` | Live study session tracker |

---

## 🧪 Testing

Run Django unit tests:
```bash
python manage.py test
```
