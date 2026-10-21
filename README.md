# MindBridge AI 🧠🌿

**Full-Stack AI-Powered Mental Health Platform & Telehealth Ecosystem**  
*Empathetic AI Therapy with RAG · Computer Vision Emotion Telemetry · MentalBERT Severity Triage · Telehealth Video Sessions · Stripe Monetization · Peer Support Community*

---

## ⚡ Quick Start: How to Run the Project

This section explains how to set up and run the **Frontend (Next.js)**, **AI Backend (FastAPI with Python `venv`)**, and **ML Backend (FastAPI with Python `venv`)**.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or v3.11 ([Download Python](https://www.python.org/downloads/))
- **MySQL**: 8.0 or higher ([Download MySQL](https://dev.mysql.com/downloads/installer/))
- **Git**: Installed and configured

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MindBridge-AI.git
cd MindBridge-AI
```

---

### Step 2: Set Up the MySQL Database

1. Start your local MySQL service (via MySQL Workbench, Services, or Terminal).
2. Create the database:
   ```sql
   CREATE DATABASE mindbridge;
   ```
3. Keep your MySQL credentials handy (`user`, `password`, `host: 3306`).

---

### Step 3: Run the AI Backend (FastAPI + Python `venv`)

The AI Backend handles conversational AI (Gemini 2.0 / Groq), Pinecone RAG retrieval, ElevenLabs Text-to-Speech, and D-ID avatars on **Port 8001**.

Open a new terminal:

```bash
# 1. Navigate to the AI Backend directory
cd ai-backend

# 2. Create a Python Virtual Environment
python -m venv venv

# 3. Activate the Virtual Environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# If you get an execution policy error on Windows, run first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# On Windows (Command Prompt):
.\venv\Scripts\activate.bat

# On macOS / Linux:
source venv/bin/activate

# 4. Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 5. Configure Environment Variables
# Copy the example file:
cp .env.example .env   # Linux/macOS
# or: copy .env.example .env  # Windows

# Edit ai-backend/.env with your API keys:
# GOOGLE_API_KEY="your-google-gemini-key"
# GROQ_API_KEY="your-groq-key"              # Optional fallback
# PINECONE_API_KEY="your-pinecone-key"      # For RAG
# ELEVENLABS_API_KEY="your-elevenlabs-key"  # For Voice TTS
# PORT=8001

# 6. Start the AI Backend Server
python app.py
```
> The AI Backend will start at: **`http://localhost:8001`**  
> Test health: **`http://localhost:8001/health`**

---

### Step 4: Run the ML Backend (Emotion Detection + Severity Model)

The ML Backend handles real-time facial emotion detection (OpenCV/PIL) and MentalBERT/ML severity triage on **Port 8002**.

Open a second terminal:

```bash
# 1. Navigate to the ML Backend directory
cd ml-backend

# 2. Create a separate Python Virtual Environment
python -m venv venv

# 3. Activate the Virtual Environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# On Windows (Command Prompt):
.\venv\Scripts\activate.bat

# On macOS / Linux:
source venv/bin/activate

# 4. Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 5. Start the ML Backend Server
python app.py
```
> The ML Backend will start at: **`http://localhost:8002`**  
> Test health: **`http://localhost:8002/health`**

---

### Step 5: Run the Frontend Application (`WEBAPP` Next.js)

The Frontend is built with Next.js 15, React 19, TypeScript, and Prisma ORM on **Port 3000**.

Open a third terminal:

```bash
# 1. Navigate to the frontend directory
cd WEBAPP

# 2. Install Node dependencies
npm install

# 3. Set up Frontend Environment Variables
# Copy the example file:
cp .env.example .env   # Linux/macOS
# or: copy .env.example .env  # Windows
```

Ensure your `WEBAPP/.env` contains the required keys:
```env
# Database Connection (MySQL)
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/mindbridge"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_random_32_char_string"

# Google OAuth (For Google Sign-In)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microservices URLs
NEXT_PUBLIC_AI_BACKEND_URL="http://localhost:8001"
NEXT_PUBLIC_ML_BACKEND_URL="http://localhost:8002"

# Stripe Payments (Optional for monetization testing)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

4. Push the Prisma database schema and generate the client:
```bash
npx prisma generate
npx prisma db push

# (Optional) Launch Prisma Studio GUI to inspect tables
npx prisma studio
```

5. Start the Next.js development server:
```bash
npm run dev
```
> Open your browser at: **`http://localhost:3000`**

---

### 🖥️ Quick Multi-Terminal Launch Cheat Sheet

| Terminal | Path | Command | URL / Port |
| :--- | :--- | :--- | :--- |
| **Terminal 1: AI Backend** | `cd ai-backend` | `.\venv\Scripts\activate`<br/>`python app.py` | `http://localhost:8001` |
| **Terminal 2: ML Backend** | `cd ml-backend` | `.\venv\Scripts\activate`<br/>`python app.py` | `http://localhost:8002` |
| **Terminal 3: Frontend** | `cd WEBAPP` | `npm run dev` | `http://localhost:3000` |

---

## 🏛️ System Architecture

MindBridge AI follows a modern, decoupled microservices architecture designed for low latency, patient data privacy, and real-time multi-modal streaming.

```mermaid
graph TB
    subgraph "Frontend Layer (Next.js 15.5 + React 19)"
        UI_Land["Spline 3D Landing Page"]
        UI_Patient["Patient Dashboard & Virtual Room"]
        UI_Therapist["Therapist Dashboard & Slot Manager"]
        UI_Admin["Admin Verification & Moderation"]
        UI_Peer["Anonymous Peer Support Community"]
    end

    subgraph "Application & Gateway Layer"
        NextAuth["NextAuth.js (Google OAuth, JWT, RBAC)"]
        API_Chat["Chat & Messages API"]
        API_Sched["Appointment Scheduling API"]
        API_Analytics["Clinical Analytics Engine"]
        API_Stripe["Stripe Checkout & Webhooks"]
    end

    subgraph "AI & ML Microservices"
        AI_Backend["AI Backend (FastAPI :8001)<br/>Gemini 2.0 / Groq LLaMA-3.1 + RAG"]
        ML_Backend["ML Backend (FastAPI :8002)<br/>OpenCV Emotion + MentalBERT Classifier"]
        TTS_Avatar["ElevenLabs Voice + D-ID Avatars"]
    end

    subgraph "Data & Persistence Layer"
        MySQL["MySQL Database (Prisma ORM)"]
        Pinecone["Pinecone Vector DB (Knowledge Base)"]
    end

    UI_Land --> NextAuth
    UI_Patient --> API_Chat
    UI_Patient --> API_Sched
    UI_Patient --> API_Analytics
    UI_Therapist --> API_Sched
    UI_Therapist --> API_Analytics
    UI_Admin --> NextAuth
    UI_Peer --> MySQL

    API_Chat --> AI_Backend
    UI_Patient --> ML_Backend
    AI_Backend --> Pinecone
    AI_Backend --> TTS_Avatar
    API_Chat --> MySQL
    API_Sched --> API_Stripe
    API_Stripe --> MySQL
    API_Analytics --> MySQL
```

---

## 🌟 Core Features & Modules

### 1. 🤖 Emotion-Aware AI Therapy (with RAG Grounding)
- **Conversational Care**: Empathetic, therapeutic persona tailored for youth and adult stress, anxiety, and depression.
- **RAG (Retrieval-Augmented Generation)**: Embeds validated mental health literature using HuggingFace sentence transformers stored in **Pinecone Vector Database**, injecting clinical context before response generation.
- **Dual LLM Engine**: Native support for **Google Gemini 2.0 Flash** with fast fallback to **Groq (LLaMA-3.1-8B-Instant)**.

### 2. 🎙️ Multi-Modal Voice & Avatar Therapy
- **Interactive Speech**: Integrated Speech-to-Text (`useSpeechToText`) and Text-to-Speech (`useTextToSpeech`) powered by **ElevenLabs** for human-like emotional inflection.
- **Virtual Presenters**: Synchronized talking avatar video generation via **D-ID API**.
- **Audio Waveform Telemetry**: Real-time CSS/SVG audio pulse indicators reflecting speaking, processing, and listening states.

### 3. 📹 Real-Time Computer Vision Emotion Telemetry
- **Frame-by-Frame Emotion Detection**: Streams client webcam frames via base64 to the ML service; processes images via **OpenCV** to track 7 primary emotions (*happy, sad, angry, surprised, fear, disgust, neutral*).
- **Session Emotion Aggregation**: Computes dominant emotion percentages per session, giving therapists non-verbal behavioral data.

### 4. 📊 Clinical Severity Triage (MentalBERT & PHQ-9/GAD-7)
- **MentalBERT Fine-Tuned NLP**: Fine-tuned on mental health corpus across a 5-point severity index (*Minimal, Mild, Moderate, Moderately Severe, Severe/Crisis*).
- **Standardized Questionnaires**: Built-in 10-question standardized assessment combining clinical depression (PHQ-9) and anxiety (GAD-7) rubrics.
- **Crisis Safeguards**: Automated high-weight (5.0) keyword detection for self-harm or suicidal intent, triggering safety disclaimers and emergency hotline prompts.

### 5. 📅 Telehealth Consultations & Availability Manager
- **Therapist Scheduling**: Weekly recurring slot editor and one-off session configurations.
- **Google Calendar Sync**: Generates calendar invites and telehealth consultation links automatically.
- **Collision Prevention**: Double-booking guards with real-time slot state management.

### 6. 💳 Integrated Stripe Monetization
- **Dynamic Pricing**: Tiered payment sessions based on consultation duration ($25 for 30m, $50 for 1h, $70 for 1.5h, $90 for 2h).
- **Webhook Automation**: Cryptographically verifies `checkout.session.completed` events to atomically lock slots and issue booking receipts.

### 7. 🛡️ Anonymous Peer Support Community
- **Privacy-First Design**: Users post anonymously; identity is protected with **SHA-256 IP hashing** to prevent spam while guaranteeing confidentiality.
- **Community Engagement**: Category tags (Anxiety, Depression, Loneliness, Academic), volunteer badges, threaded discussions, and upvoting.

### 8. 👨‍⚕️ Therapist Credentialing & Admin Suite
- **Verification Workflow**: Administrators verify degrees, medical licenses, hospital affiliations, and photo IDs before therapists can accept bookings.
- **Clinical Analytics Dashboard**: Visualizes patient population trends, severity distributions, and session notes via **Recharts**.

---

## 🏆 Why MindBridge AI Is Better (Key Differentiators)

| Feature | Generic Chatbots (ChatGPT / Wrappers) | Traditional Telehealth (BetterHelp, etc.) | **MindBridge AI** |
| :--- | :--- | :--- | :--- |
| **Response Reliability** | Hallucinates advice; ungrounded answers | N/A (human only) | **RAG-Grounded** via Pinecone with clinical literature |
| **Emotion Awareness** | Text prompt only | Manual patient reporting | **Multi-Modal**: Real-time OpenCV facial telemetry + voice analysis |
| **Continuous Care** | No human doctor integration | Sessions are isolated events | **Hybrid Stepped-Care**: AI support between human doctor appointments |
| **Crisis Intervention** | Unpredictable guardrails | Dependent on therapist availability | **Automated Crisis Trigger**: Immediate 5-level triage and safety escalation |
| **Patient Privacy** | Tracks conversation identities | Requires real-name profiles | **Anonymous Peer Forum** with SHA-256 IP anonymization |
| **Accessibility** | Text only | Scheduled video only | **Voice, Text, & Interactive Talking Avatars** available 24/7 |

---

## 💻 Tech Stack Summary

```
Frontend:
├── Framework: Next.js 15.5.2 (App Router)
├── Library: React 19.1.0 + TypeScript 5
├── Styling: Tailwind CSS 4 + Radix UI Primitives + Lucide Icons
├── 3D Canvas: Spline 3D Runtime (@splinetool/runtime)
├── Data Viz: Recharts 3.2
└── Authentication: NextAuth.js 4 (OAuth 2.0 & JWT)

AI & ML Backends:
├── Microservices: FastAPI (Python 3.10+) & Uvicorn ASGI
├── LLMs: Google Gemini 2.0 Flash (`google-generativeai`) & Groq (`groq-sdk`)
├── Vector DB & RAG: Pinecone & LangChain
├── Computer Vision: OpenCV (cv2) & Pillow (PIL)
├── NLP / Transformers: HuggingFace Transformers (MentalBERT) & Scikit-learn
└── Audio / Video AI: ElevenLabs API (Voice Synthesis) & D-ID (Talking Avatar)

Data & Infrastructure:
├── Database: MySQL 8.0
├── ORM: Prisma ORM 6.1
├── Payments: Stripe Node SDK & Webhooks
└── Utilities: Nodemailer (OTP Recovery), bcryptjs, Zod
```

---

## 🗄️ Database Schema Overview (Prisma ORM)

```mermaid
erDiagram
    User ||--o{ Account : "authenticates"
    User ||--o{ Session : "holds"
    User ||--o{ ChatSession : "initiates"
    ChatSession ||--o{ ChatMessage : "contains"
    User ||--o{ TherapySession : "participates (patient/therapist)"
    User ||--o{ Appointment : "schedules"
    User ||--o{ TherapistAvailability : "defines"
    User ||--o| PatientProfile : "has"
    User ||--o| TherapistProfile : "verifies"
    User ||--o{ MentalHealthAnalytics : "tracks"
    User ||--o{ AssessmentSession : "completes"
    PeerSupportPost ||--o{ Reply : "receives"
```

### Key Models:
- `User`: Central entity with RBAC roles (`patient`, `therapist`, `admin`).
- `TherapistProfile`: Stores degrees, hospital affiliation LORs, photo proof, and admin verification status (`pending`, `approved`, `rejected`).
- `TherapistAvailability`: Manages recurring weekday slots (0=Sun..6=Sat) or specific date overrides with `isBooked` flags.
- `Appointment`: Links patient, therapist, availability slot, Google Calendar event ID, status, and duration.
- `MentalHealthAnalytics`: Daily aggregated time-series telemetry (mental health level 1–5, detected keyword vectors, positive/negative ratios).
- `AssessmentSession`: Standardized PHQ-9/GAD-7 Q&A scores and clinical evaluation outcomes.
- `PeerSupportPost` & `Reply`: Anonymous community forum with IP hash tracking for privacy.

---

## 🛠️ API Reference

### Next.js API Routes (`WEBAPP`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/[...nextauth]` | OAuth & Credentials authentication |
| `GET`/`POST` | `/api/chat/messages` | Fetch chat history or save a message |
| `GET`/`POST` | `/api/analytics` | Retrieve time-series clinical analytics or trigger chat re-analysis |
| `POST` | `/api/analytics/assess` | Submit PHQ-9/GAD-7 assessment answers and compute severity |
| `POST` | `/api/checkout` | Create Stripe Checkout session for therapist appointment |
| `POST` | `/api/webhook/stripe` | Stripe signature-verified appointment fulfillment |
| `GET`/`POST` | `/api/peer-support` | Read or publish anonymous peer support discussions |

### AI Backend (`FastAPI :8001`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check and service readiness |
| `POST` | `/chat` | Generates RAG-grounded therapy responses via Gemini 2.0 / Groq |
| `POST` | `/tts` | Synthesizes therapeutic speech using ElevenLabs API |
| `POST` | `/avatar` | Generates synchronized talking avatar video via D-ID |

### ML Backend (`FastAPI :8002`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service status check |
| `POST` | `/detect_emotion` | Accepts base64 video frame; returns emotion breakdown & dominant score |
| `POST` | `/detect_emotion_file` | Accepts uploaded image file for emotion inference |
| `GET` | `/emotions` | Lists recognized emotion classes (7 states) |

---

## 🔧 Troubleshooting & FAQ

#### 1. Windows PowerShell Virtual Environment Activation Error:
If you see `execution of scripts is disabled on this system`:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Prisma Database Push Fails:
Ensure your MySQL service is running and `DATABASE_URL` in `WEBAPP/.env` has correct credentials:
```bash
# Verify connection
npx prisma db push --preview-feature
```

#### 3. AI Backend Fails on Windows Multiprocessing:
The project already includes `multiprocessing.set_start_method("spawn", force=True)` in `ai-backend/app.py` to prevent Windows-specific ASGI worker fork errors.

#### 4. Google OAuth Redirect URI Mismatch:
Make sure `http://localhost:3000/api/auth/callback/google` is added to your Authorized Redirect URIs in Google Cloud Console.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

**Built with care for accessible, ethical, and clinical-grade mental healthcare.**
