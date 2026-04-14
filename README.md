# MindBridge AI

**AI-Powered Mental Health Platform** - A comprehensive mental health platform integrating AI-powered therapy, peer support, professional therapist management, and secure payment processing.

---

## Overview

MindBridge AI is a privacy-first mental health platform that combines cutting-edge AI technologies with evidence-based therapeutic approaches. The platform offers:

- **AI Therapy Chat** - Emotion-aware AI responses with RAG integration
- **Peer Support Community** - Anonymous posting and community-driven support
- **Professional Dashboard** - Therapist management and patient analytics
- **Appointment Scheduling** - Integrated calendar and telehealth video consultations
- **Secure Payments** - Stripe-powered subscription management

---

## Core Features

### AI Therapy Chat System
- Emotion-aware messaging with sentiment tracking
- RAG (Retrieval-Augmented Generation) integration for evidence-based responses
- Multi-modal communication (text, speech-to-text, text-to-speech)
- Avatar generation for enhanced engagement

### Peer Support Community
- Anonymous posting and voting system
- Threaded replies and discussions
- Privacy-first design

### Professional Therapist Dashboard
- Patient management and analytics
- Session scheduling and status tracking
- Virtual session setup with Google Calendar integration

### Appointment Scheduling
- Real-time availability checking
- Automated calendar event creation
- Secure telehealth meeting links

### Subscription & Payment
- Secure Stripe checkout
- Webhook-based subscription management
- Role-based access control (Patient, Therapist, Admin)

---

## Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI_Patient["Patient Dashboard"]
        UI_Therapist["Therapist Dashboard"]
        UI_Admin["Admin Dashboard"]
        UI_Chat["Chat Interface"]
        UI_Video["Video Interface"]
    end
    
    subgraph "API Layer"
        API_Auth["Auth API"]
        API_Chat["Chat Messages"]
        API_Therapy["Therapy Management"]
        API_Analytics["Analytics"]
        API_Payments["Checkout & Webhooks"]
    end
    
    subgraph "Services"
        AIBackend["AI Backend (FastAPI)"]
        MLBackend["ML Analytics"]
        Prisma["Prisma ORM"]
    end
    
    subgraph "Data"
        MySQL["MySQL Database"]
        Pinecone["Pinecone Vector DB"]
    end
    
    UI_Patient --> API_Chat
    UI_Therapist --> API_Therapy
    UI_Admin --> API_Analytics
    UI_Chat --> API_Chat
    API_Chat --> AIBackend
    API_Chat --> Prisma
    API_Therapy --> Prisma
    AIBackend --> Pinecone
    Prisma --> MySQL
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15.5 | App Router, SSR/SSG |
| React 19 | UI Components |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Radix UI | Accessible Components |
| Recharts | Data Visualization |
| NextAuth.js | Authentication |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | AI Backend API |
| Python 3.x | Backend Services |
| Uvicorn | ASGI Server |
| Prisma | ORM |

### AI/ML
| Technology | Purpose |
|------------|---------|
| Groq SDK | AI Chat Responses |
| LangChain | RAG Pipeline |
| Pinecone | Vector Database |
| ElevenLabs | Text-to-Speech |

### Database & Services
| Technology | Purpose |
|------------|---------|
| MySQL | Primary Database |
| Stripe | Payment Processing |
| Google Calendar | Appointment Scheduling |

---

## Project Structure

```
MindBridge/
├── WEBAPP/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── api/          # API routes
│   │   │   ├── patient/      # Patient dashboard
│   │   │   ├── therapist/    # Therapist dashboard
│   │   │   └── admin/        # Admin panel
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── contexts/         # React contexts
│   ├── prisma/               # Database schema
│   └── public/               # Static assets
│
├── ai-backend/               # Python FastAPI Backend
│   ├── services/             # AI services
│   │   ├── groq_ai_service.py
│   │   ├── tts_service.py
│   │   └── avatar_service.py
│   ├── rag/                  # RAG pipeline
│   └── app.py                # FastAPI app
│
└── ml-backend/               # ML Analytics Service
    └── app.py
```

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MySQL 8.0+
- MongoDB (for emotion analytics)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MindBridge-AI.git
cd MindBridge-AI
```

### 2. Frontend Setup

```bash
cd WEBAPP

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Configure your .env file with:
# - DATABASE_URL (MySQL connection)
# - NEXTAUTH_URL and NEXTAUTH_SECRET
# - Google OAuth credentials
# - AI_BACKEND_URL and ML_BACKEND_URL (optional)
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE mindbridge;"

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# (Optional) Seed database
npx prisma db seed

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. AI Backend Setup

```bash
cd ai-backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Configure your .env with API keys:
# - GROQ_API_KEY
# - ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
# - GEMINI_API_KEY (optional)
# - MONGODB_URL
```

### 5. Start Services

**Terminal 1 - Frontend:**
```bash
cd WEBAPP
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - AI Backend:**
```bash
cd ai-backend
python app.py
# Runs on http://localhost:8001
```

### 6. Verify Installation

- Frontend: [http://localhost:3000](http://localhost:3000)
- AI Backend Health: [http://localhost:8001/health](http://localhost:8001/health)
- Sign in with Google OAuth

---

## Environment Variables

### Frontend (WEBAPP/.env)

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/mindbridge"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Backend URLs (optional)
AI_BACKEND_URL="http://localhost:8001"
ML_BACKEND_URL="http://localhost:5000"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### AI Backend (ai-backend/.env)

```env
# AI Services
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="..."          # Optional
GEMINI_MODEL="gemini-pro"     # Optional

# Text-to-Speech
ELEVENLABS_API_KEY="..."
ELEVENLABS_VOICE_ID="..."

# Database
MONGODB_URL="mongodb://localhost:27017/mindbridge"

# Server
PORT=8001
DEBUG=true
```

---

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET | Sign in page |
| `/api/auth/callback/google` | GET | Google OAuth callback |

### Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/messages` | GET | Get chat history |
| `/api/chat/messages` | POST | Send message |

### AI Backend
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/chat` | POST | AI therapy response |
| `/tts` | POST | Text-to-speech |
| `/avatar` | POST | Avatar video generation |

---

## Database Schema

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : has
    USER ||--o{ SESSION : has
    USER ||--o{ CHAT_SESSION : owns
    CHAT_SESSION ||--o{ CHAT_MESSAGE : contains
    USER ||--o{ THERAPY_SESSION : participates
    USER ||--o{ APPOINTMENT : schedules
    USER ||--o{ PATIENT_PROFILE : has
    USER ||--o{ THERAPIST_PROFILE : has
    USER ||--o{ MENTAL_HEALTH_ANALYTICS : tracks
    PEER_SUPPORT_POST ||--o{ REPLY : receives
```

---

## User Roles

| Role | Access |
|------|--------|
| **Patient** | Chat, Appointments, Analytics, Peer Support |
| **Therapist** | Patient Management, Scheduling, Virtual Sessions |
| **Admin** | User Management, Analytics, Therapist Verification |

---

## Troubleshooting

### MySQL Connection Issues
```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL format
# mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Prisma Errors
```bash
# Regenerate client
npx prisma generate

# Reset database (warning: deletes data)
npx prisma migrate reset
```

### OAuth Redirect Mismatch
- Ensure `NEXTAUTH_URL` matches your OAuth redirect URI
- Add `http://localhost:3000/api/auth/callback/google` to Google Cloud Console

### AI Backend Not Responding
- Check all API keys are set
- Verify Python environment is activated
- Check port 8001 is available

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support, please open an issue in the GitHub repository.

---

**Built with care for mental health awareness and accessibility.**
