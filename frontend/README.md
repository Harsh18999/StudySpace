# 🎨 StudySpace.AI — Frontend Web Application

The modern, high-performance web frontend for **StudySpace.AI** built with **Next.js 16 (Turbopack)**, **Tailwind CSS**, **Framer Motion**, and **TypeScript**.

---

## ✨ Features

- **Modern SaaS Aesthetics**:
  - Linear, Notion, Raycast, and Vercel-inspired UI design.
  - Creamy Warm color system (`#FAF7F2` background, `#FFFDF9` surface cards, `#0D9488` primary teal buttons).
  - Smooth glassmorphism, floating glowing elements, micro-animations, and fluid transitions.

- **Landing Page**:
  - Interactive Header Navigation, Hero Section with Live Workspace Mockup, Interactive Architecture Pipeline (`InteractiveWorkflow`), 4-Step Process (`HowItWorks`), Pricing with Credit System Breakdown (`Pricing`), Testimonials, FAQ Accordion, and Interactive Demo Modal (`DemoModal`).

- **Authentication & Onboarding**:
  - 2-Step OTP Verification Form for manual email registration.
  - Google OAuth 2.0 Popup Flow via `@react-oauth/google`.
  - Prominent "Back to Home" navigation and auto-redirect to `/dashboard` for signed-in users.

- **Workspace & Analytics Dashboard**:
  - **Dual-Sidebar Layout**: Space Navigation sidebar, Module Tree, and Resource Tabs.
  - **Analytics Dashboard**: Study heatmap grid, Streak counters, Subject mastery progress, Quiz performance charts (Recharts), and Live Session Timer hook (`useStudySessionTracker`).
  - **Settings & Billing**: Credit balance wallet, transaction history, and system-controlled Payment Toggle (`NEXT_PUBLIC_PAYMENTOPTION`).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack) / React 19
- **Styling**: Tailwind CSS + Vanilla CSS utilities
- **Animations**: Framer Motion
- **State & Query**: Zustand + TanStack Query (React Query)
- **Icons & Charts**: Lucide Icons + Recharts
- **Authentication**: `@react-oauth/google` + SimpleJWT Axios Interceptor

---

## ⚙️ Environment Variables Setup

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Payment Control (ENABLE / DISABLE)
NEXT_PUBLIC_PAYMENTOPTION=DISABLE
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

### 3. Check TypeScript & Linting
```bash
npx tsc --noEmit
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 📁 Directory Structure

```text
frontend/
├── app/
│   ├── auth/                # Sign In / Sign Up Page (/auth)
│   ├── dashboard/           # Main Workspace Dashboard (/dashboard)
│   │   ├── analytics/       # Analytics & Heatmap (/dashboard/analytics)
│   │   ├── flashcards/      # Spaced Repetition Decks
│   │   ├── notes/           # AI Notes View
│   │   ├── quizzes/         # MCQ Quiz Bank
│   │   ├── settings/        # Credit Wallet & Settings
│   │   └── space/[spaceId]/ # Course Workspace Space Route
│   ├── onboarding/          # Onboarding Flow (/onboarding)
│   ├── layout.tsx           # Root Layout & Metadata
│   └── page.tsx             # Landing Page Main Entry
├── components/
│   ├── auth/                # AuthPage, SignInForm, SignUpForm (OTP), ForgotPasswordForm
│   ├── landing/             # Navbar, Hero, Pricing, FAQ, DemoModal, Workflow
│   └── ui/                  # Toast & UI Primitives
├── hooks/
│   └── useStudySessionTracker.tsx # WebSocket Study Tracker Hook
├── lib/
│   └── api.ts               # Axios API Client & JWT Interceptors
└── store/
    └── useStore.ts          # Zustand Auth & UI Store
```
