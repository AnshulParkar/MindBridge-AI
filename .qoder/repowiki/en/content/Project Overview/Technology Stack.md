# Technology Stack

<cite>
**Referenced Files in This Document**
- [package.json](file://WEBAPP/package.json)
- [next.config.ts](file://WEBAPP/next.config.ts)
- [tsconfig.json](file://WEBAPP/tsconfig.json)
- [postcss.config.mjs](file://WEBAPP/postcss.config.mjs)
- [layout.tsx](file://WEBAPP/src/app/layout.tsx)
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx)
- [db.ts](file://WEBAPP/src/lib/db.ts)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [app.py](file://ai-backend/app.py)
- [config.py](file://ai-backend/config.py)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py)
- [tts_service.py](file://ai-backend/services/tts_service.py)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive technology stack overview for the MindBridge AI platform. It covers the frontend (Next.js, React, TypeScript, Radix UI, Tailwind CSS, Recharts), backend (FastAPI, Python 3.x), AI/ML integrations (Groq SDK, ElevenLabs API, Pinecone vector database, LangChain), databases (Prisma ORM with MySQL), development/build tools, and deployment considerations. It also includes version compatibility notes, upgrade paths, and rationale for technology choices.

## Project Structure
The repository is organized into three primary areas:
- WEBAPP: Next.js 15.5.2 frontend with React 19.1.0, TypeScript, Radix UI, Tailwind CSS, and Recharts.
- ai-backend: FastAPI Python backend integrating Groq, ElevenLabs, and Pinecone via LangChain.
- ml-backend: Separate machine learning backend (not covered in detail here).

```mermaid
graph TB
subgraph "Frontend (WEBAPP)"
N["Next.js App"]
R["React 19.1.0"]
TS["TypeScript"]
RU["Radix UI"]
TW["Tailwind CSS"]
RC["Recharts"]
PR["Prisma Client"]
DB["MySQL"]
end
subgraph "AI Backend"
FA["FastAPI"]
GQ["Groq SDK"]
EL["ElevenLabs API"]
PC["Pinecone Vector DB"]
LC["LangChain"]
end
N --> PR
PR --> DB
N --> FA
FA --> GQ
FA --> EL
FA --> PC
PC --> LC
```

**Diagram sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

**Section sources**
- [package.json](file://WEBAPP/package.json#L1-L88)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)
- [tsconfig.json](file://WEBAPP/tsconfig.json#L1-L42)
- [postcss.config.mjs](file://WEBAPP/postcss.config.mjs#L1-L7)
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [app.py](file://ai-backend/app.py#L1-L154)
- [config.py](file://ai-backend/config.py#L1-L49)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

## Core Components
- Frontend framework and runtime: Next.js 15.5.2, React 19.1.0, TypeScript 5.x.
- UI primitives and design system: Radix UI for accessible, headless components; Tailwind CSS for utility-first styling; Recharts for data visualization.
- State and theming: Next-themes for theme switching; ThemeProvider wrapping the app.
- Authentication and persistence: NextAuth.js with Prisma adapter; Prisma Client for MySQL.
- Build and tooling: PostCSS with Tailwind plugin; ESLint; Tailwind v4 plugin; ts-node for seeding.

**Section sources**
- [package.json](file://WEBAPP/package.json#L15-L86)
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [postcss.config.mjs](file://WEBAPP/postcss.config.mjs#L1-L7)
- [tsconfig.json](file://WEBAPP/tsconfig.json#L1-L42)

## Architecture Overview
The system follows a modern full-stack architecture:
- Web frontend built with Next.js App Router, TypeScript, and a component library based on Radix UI and Tailwind.
- Backend APIs implemented with FastAPI in Python, exposing endpoints for chat, text-to-speech, and avatar generation.
- AI/ML services integrated via Groq for conversational responses, ElevenLabs for TTS, and Pinecone with LangChain for retrieval-augmented generation (RAG).
- Data persistence handled by Prisma ORM targeting MySQL.

```mermaid
graph TB
subgraph "Client"
UI["Next.js App Router<br/>React 19.1.0<br/>TypeScript"]
end
subgraph "Frontend Services"
AUTH["NextAuth.js"]
THEME["next-themes + ThemeProvider"]
PRISMA["Prisma Client"]
end
subgraph "Backend Services"
API["FastAPI App"]
GROQ["Groq AI Service"]
TTS["ElevenLabs TTS Service"]
AV["Avatar Service"]
PINE["Pinecone Vector DB"]
LANG["LangChain"]
end
subgraph "Data"
MYSQL["MySQL"]
end
UI --> AUTH
UI --> THEME
UI --> PRISMA
PRISMA --> MYSQL
UI --> API
API --> GROQ
API --> TTS
API --> AV
API --> PINE
PINE --> LANG
LANG --> GROQ
```

**Diagram sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

## Detailed Component Analysis

### Frontend Stack (Next.js, React, TypeScript, Radix UI, Tailwind CSS, Recharts)
- Next.js 15.5.2: App Router-based pages with API routes, static exports, and optimized builds.
- React 19.1.0 and React DOM 19.1.0: Concurrent features and improved rendering.
- TypeScript 5.x: Strict compiler options, ESNext module resolution, and bundler-aware path mapping.
- Radix UI: Accessible, headless UI primitives (buttons, dialogs, tooltips, etc.) used across components.
- Tailwind CSS 4.x plugin: Utility-first styling with PostCSS pipeline.
- Recharts: Charting library for analytics dashboards.
- Theming and fonts: next-themes and Geist fonts integrated in the root layout.
- Prisma Client: Database access abstraction with environment-aware logging.

Key implementation references:
- Next.js configuration and headers for CORS and optimization.
- TypeScript compiler options and path aliases.
- Tailwind PostCSS configuration.
- Root layout composition and theme provider.
- Radix UI button component with variant sizing system.
- Prisma client initialization and environment logging.

**Section sources**
- [package.json](file://WEBAPP/package.json#L15-L86)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)
- [tsconfig.json](file://WEBAPP/tsconfig.json#L1-L42)
- [postcss.config.mjs](file://WEBAPP/postcss.config.mjs#L1-L7)
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L1-L60)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

### Backend Stack (FastAPI, Python 3.x, AI/ML Integrations)
- FastAPI: Asynchronous web framework with automatic OpenAPI docs and dependency injection.
- Python 3.x: Runtime for AI/ML services and backend logic.
- Groq SDK: Used for therapeutic chat responses with a persistent conversation history.
- ElevenLabs API: Text-to-speech with fallback to dummy audio when API key is unavailable.
- Pinecone vector database: Vector store for RAG with LangChain integrations.
- LangChain: Retrieval and chain orchestration for question answering.

Core backend references:
- FastAPI app definition, CORS, static file mounting, and health endpoints.
- Configuration class for environment-driven settings.
- Groq service with system prompts and conversation history.
- TTS service with account checks, request retries, and fallback audio generation.
- RAG app using Flask and LangChain with Pinecone retriever and Groq LLM.

**Section sources**
- [app.py](file://ai-backend/app.py#L1-L154)
- [config.py](file://ai-backend/config.py#L1-L49)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

### Database Technologies (Prisma ORM and MySQL)
- Prisma Client: Generated client for type-safe database operations.
- MySQL: Provider configured in Prisma schema with comprehensive domain models for users, sessions, chats, therapy sessions, appointments, analytics, and profiles.
- Environment configuration: DATABASE_URL sourced from environment variables.

```mermaid
erDiagram
USER {
string id PK
string name
string email UK
datetime emailVerified
string password
string role
longtext image
boolean isProfileComplete
boolean isBanned
datetime createdAt
}
ACCOUNT {
string id PK
string userId FK
string type
string provider
string providerAccountId
text refresh_token
text access_token
number expires_at
string token_type
string scope
text id_token
string session_state
}
SESSION {
string id PK
string sessionToken UK
string userId FK
datetime expires
}
PATIENT_PROFILE {
string id PK
string userId UK
int totalSessions
datetime lastSessionDate
string dominantEmotion
string improvementTrend
text notes
datetime createdAt
datetime updatedAt
}
THERAPIST_PROFILE {
string id PK
string userId UK
string fullName
datetime dateOfBirth
string gender
int age
string degree
string experience
longtext hospitalAffiliation
longtext photoUrl
boolean isVerified
string verificationStatus
text rejectionReason
datetime createdAt
datetime updatedAt
}
MENTAL_HEALTH_ANALYTICS {
string id PK
string userId FK
datetime date
int mentalHealthLevel
string levelLabel
json keywordsDetected
json keywordCounts
int totalMessages
int positiveCount
int negativeCount
json riskFlags
string source
datetime createdAt
}
ASSESSMENT_SESSION {
string id PK
string userId FK
int totalScore
int maxScore
int mentalHealthLevel
string levelLabel
json answers
datetime completedAt
datetime createdAt
}
CHAT_SESSION {
string id PK
string userId FK
string title
datetime createdAt
datetime updatedAt
boolean isActive
}
CHAT_MESSAGE {
string id PK
string userId FK
string sessionId FK
string role
longtext content
datetime timestamp
json metadata
}
THERAPY_SESSION {
string id PK
string therapistId FK
string patientId FK
datetime startTime
datetime endTime
int duration
json emotionsSummary
int messageCount
string status
longtext notes
datetime createdAt
datetime updatedAt
}
APPOINTMENT {
string id PK
string therapistId FK
string patientId FK
string slotId FK
datetime scheduledTime
int duration
string status
string type
longtext notes
boolean reminderSent
string calendarEventId
datetime createdAt
datetime updatedAt
}
THERAPIST_AVAILABILITY {
string id PK
string therapistId FK
int dayOfWeek
string startTime
string endTime
boolean isRecurring
datetime specificDate
boolean isBooked
boolean isActive
datetime createdAt
datetime updatedAt
}
PEER_SUPPORT_POST {
string id PK
longtext content
string category
int likes
string anonymousId
string ipHash
boolean isActive
datetime createdAt
datetime updatedAt
}
REPLY {
string id PK
longtext content
datetime timestamp
boolean isVolunteer
string anonymousId
string postId FK
}
ADMIN_USER {
string id PK
string adminId UK
string password
datetime createdAt
}
USER ||--o{ ACCOUNT : "has"
USER ||--o{ SESSION : "has"
USER ||--o{ CHAT_SESSION : "owns"
USER ||--o{ CHAT_MESSAGE : "writes"
USER ||--o{ MENTAL_HEALTH_ANALYTICS : "has"
USER ||--o{ ASSESSMENT_SESSION : "completes"
USER ||--o{ PATIENT_PROFILE : "has"
USER ||--o{ THERAPIST_PROFILE : "has"
USER ||--o{ APPOINTMENT : "bookedAs"
USER ||--o{ APPOINTMENT : "provides"
USER ||--o{ THERAPIST_AVAILABILITY : "defines"
CHAT_SESSION ||--o{ CHAT_MESSAGE : "contains"
APPOINTMENT }o--|| THERAPIST_AVAILABILITY : "uses"
PEER_SUPPORT_POST ||--o{ REPLY : "receives"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)

### AI/ML Integration (Groq, ElevenLabs, Pinecone, LangChain)
- Groq: Chat completions for therapeutic responses with a system prompt and maintained conversation history.
- ElevenLabs: TTS with account validation, request handling, and robust fallback audio generation when API limits or keys are unavailable.
- Pinecone: Vector store for RAG with LangChain retriever and Groq LLM for question answering.
- LangChain: Prompt templates, retrieval chains, and document combination chains.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant API as "FastAPI"
participant Groq as "GroqService"
participant TTS as "TTSService"
Client->>API : POST /chat {message, emotion}
API->>Groq : generate_therapy_response(user_message, emotion)
Groq-->>API : therapeutic response
API-->>Client : {response, status}
Client->>API : POST /tts {text, voice}
API->>TTS : generate_speech(text, voice)
TTS-->>API : audio_url
API-->>Client : {audio_url, status}
```

**Diagram sources**
- [app.py](file://ai-backend/app.py#L81-L108)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L81-L111)
- [tts_service.py](file://ai-backend/services/tts_service.py#L53-L144)

**Section sources**
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

### Development Tools, Build Tools, and Deployment Technologies
- Build and linting: Next build/start/develop scripts; ESLint 9; TypeScript 5; PostCSS with Tailwind plugin.
- Prisma: Client generation and seeding via ts-node; seed script configured in package.json.
- Environment configuration: .env files for both frontend and backend; FastAPI settings class loads from .env.
- Deployment considerations: Next.js static export option; FastAPI runs via Uvicorn; CORS configured for external access.

**Section sources**
- [package.json](file://WEBAPP/package.json#L5-L14)
- [tsconfig.json](file://WEBAPP/tsconfig.json#L1-L42)
- [postcss.config.mjs](file://WEBAPP/postcss.config.mjs#L1-L7)
- [app.py](file://ai-backend/app.py#L1-L154)
- [config.py](file://ai-backend/config.py#L1-L49)

## Dependency Analysis
- Frontend dependencies: Next.js, React, Radix UI primitives, Tailwind CSS, Recharts, Prisma Client, NextAuth.js, Stripe, Zod, and related types.
- Backend dependencies: FastAPI, Uvicorn, Pydantic, LangChain ecosystem (OpenAI, Pinecone), Groq SDK, httpx, python-dotenv, sentence-transformers, pypdf, flask (for RAG demo), and more.
- Coupling: Frontend communicates with backend via REST endpoints; backend integrates AI services and vector database; Prisma connects frontend/backend to MySQL.

```mermaid
graph LR
subgraph "Frontend"
RN["Next.js Runtime"]
RR["React Runtime"]
RU["Radix UI"]
TW["Tailwind CSS"]
RC["Recharts"]
PR["Prisma Client"]
end
subgraph "Backend"
FA["FastAPI"]
GQ["Groq SDK"]
EL["ElevenLabs API"]
PC["Pinecone"]
LC["LangChain"]
end
RN --> PR
RR --> RU
PR --> FA
FA --> GQ
FA --> EL
FA --> PC
PC --> LC
```

**Diagram sources**
- [package.json](file://WEBAPP/package.json#L15-L86)
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [genAI_rag.py](file://ai-backend/rag/genAI_rag.py#L1-L76)

**Section sources**
- [package.json](file://WEBAPP/package.json#L15-L86)
- [app.py](file://ai-backend/app.py#L1-L154)

## Performance Considerations
- Frontend: Next.js build optimizations, image optimization toggles, compression, and header configurations improve load times and cross-origin flexibility.
- Backend: Lazy initialization of services reduces cold-start overhead; static file serving for audio/video minimizes latency; timeouts and fallbacks in TTS ensure resilience under network errors.
- Database: Prisma client logs are scoped to development to reduce noise; indexes exist on frequently queried fields (e.g., user, session, timestamps) to optimize reads.

**Section sources**
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)
- [app.py](file://ai-backend/app.py#L42-L71)
- [tts_service.py](file://ai-backend/services/tts_service.py#L53-L144)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

## Troubleshooting Guide
- Missing environment variables:
  - Frontend: Ensure DATABASE_URL and other secrets are present in .env/.env.local.
  - Backend: Verify OPENAI_API_KEY, ELEVENLABS_API_KEY, GROQ_API_KEY, PINECONE_API_KEY, and others in .env.
- CORS and external access: Next.js headers allow broad origins; adjust for production deployments.
- TTS fallback: When ElevenLabs API key is missing or quota is exceeded, the system generates dummy audio; confirm temp directory permissions and cleanup policies.
- Prisma client: Development logs include queries; ensure database connectivity and migrations are applied.

**Section sources**
- [config.py](file://ai-backend/config.py#L1-L49)
- [next.config.ts](file://WEBAPP/next.config.ts#L21-L41)
- [tts_service.py](file://ai-backend/services/tts_service.py#L53-L144)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)

## Conclusion
MindBridge leverages a cohesive stack combining Next.js 15.5.2 and React 19.1.0 for a modern, type-safe frontend; FastAPI for scalable Python backend services; and AI/ML integrations via Groq, ElevenLabs, Pinecone, and LangChain. Prisma ORM with MySQL provides robust data modeling and type safety. The architecture balances developer productivity, accessibility, and extensibility, with clear separation of concerns between frontend, backend, and AI services.