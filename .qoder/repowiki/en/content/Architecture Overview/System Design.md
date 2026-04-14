# System Design

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://WEBAPP/package.json)
- [app.py](file://ai-backend/app.py)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py)
- [tts_service.py](file://ai-backend/services/tts_service.py)
- [avatar_service.py](file://ai-backend/services/avatar_service.py)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [db.ts](file://WEBAPP/src/lib/db.ts)
- [api.ts](file://WEBAPP/src/lib/api.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts)
- [email.ts](file://WEBAPP/src/lib/email.ts)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts)
- [.env](file://WEBAPP/.env)
- [.env](file://ai-backend/.env)
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
10. [Appendices](#appendices)

## Introduction
This document describes the system design of MindBridge, a mental health platform integrating a Next.js frontend, FastAPI microservices backend, and a MySQL-backed data layer via Prisma. The system separates concerns across:
- AI services: Groq integration for therapy responses, Text-to-Speech (ElevenLabs), and Avatar generation (D-ID)
- Authentication services: NextAuth with Prisma adapter and local credentials plus Google OAuth
- Data management: Prisma ORM models and utilities for database access

The microservices pattern is implemented with distinct service boundaries for AI capabilities, while the frontend communicates with AI and ML backends through typed API clients. External integrations include Groq, ElevenLabs, D-ID, Google Calendar, Stripe, and SMTP email.

## Project Structure
The repository is organized into three primary areas:
- WEBAPP: Next.js application with pages, components, API routes, Prisma schema, and environment configuration
- ai-backend: FastAPI microservice exposing endpoints for AI-driven features (therapy, TTS, avatar)
- ml-backend: Separate ML service for emotion/video analytics (referenced in frontend API configuration)

```mermaid
graph TB
subgraph "WEBAPP (Next.js)"
FE_Next["Next.js App"]
FE_API["API Routes (Next.js)"]
FE_Components["Components"]
FE_Prisma["Prisma Client"]
end
subgraph "AI Backend (FastAPI)"
AI_App["FastAPI App"]
AI_Services["AI Services<br/>Groq, TTS, Avatar"]
end
subgraph "ML Backend (External)"
ML_API["ML API (Emotion/Video)"]
end
subgraph "Database Layer"
DB_MySQL["MySQL"]
DB_Prisma["Prisma Schema"]
end
FE_Next --> FE_API
FE_API --> AI_App
FE_API --> ML_API
AI_App --> AI_Services
FE_Prisma --> DB_MySQL
DB_Prisma --> DB_MySQL
```

**Diagram sources**
- [package.json](file://WEBAPP/package.json#L1-L88)
- [app.py](file://ai-backend/app.py#L1-L154)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

**Section sources**
- [README.md](file://README.md#L1-L3)
- [package.json](file://WEBAPP/package.json#L1-L88)

## Core Components
- Frontend (Next.js):
  - Pages and components under src/app and src/components
  - API client utilities for AI and ML backends
  - Authentication via NextAuth with Prisma adapter
  - Prisma client initialization and database access
- AI Backend (FastAPI):
  - REST endpoints for chat, TTS, and avatar
  - Lazy-initialized service classes for Groq, ElevenLabs, and D-ID
- Data Management:
  - Prisma schema defines models for users, sessions, therapy, analytics, and more
  - Prisma client instantiated with environment-specific logging

Key implementation references:
- API configuration and clients: [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- Prisma client setup: [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- Prisma schema: [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- AI backend app and endpoints: [app.py](file://ai-backend/app.py#L1-L154)
- AI services: [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123), [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280), [avatar_service.py](file://ai-backend/services/avatar_service.py#L1-L237)

**Section sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L1-L237)

## Architecture Overview
MindBridge follows a layered architecture:
- Presentation Layer: Next.js app with pages and components
- API Layer: Next.js API routes and FastAPI endpoints
- Business Logic Layer: AI services (Groq, TTS, Avatar) and ML analytics
- Persistence Layer: Prisma ORM mapping to MySQL

```mermaid
graph TB
Browser["Browser"]
NextApp["Next.js App"]
NextAPI["Next.js API Routes"]
AIBackend["FastAPI AI Backend"]
Groq["Groq Service"]
TTSService["TTSService"]
AvatarService["AvatarService"]
PrismaClient["Prisma Client"]
MySQL["MySQL Database"]
Browser --> NextApp
NextApp --> NextAPI
NextAPI --> AIBackend
AIBackend --> Groq
AIBackend --> TTSService
AIBackend --> AvatarService
NextAPI --> PrismaClient
PrismaClient --> MySQL
```

**Diagram sources**
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L1-L237)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

## Detailed Component Analysis

### AI Backend (FastAPI) Endpoints and Services
The AI backend exposes three primary endpoints:
- POST /chat: Generates therapeutic responses using Groq
- POST /tts: Converts text to speech via ElevenLabs
- POST /avatar: Creates talking avatar videos via D-ID

```mermaid
sequenceDiagram
participant FE as "Next.js Frontend"
participant API as "Next.js API Client"
participant FA as "FastAPI AI Backend"
participant GS as "GroqService"
participant TS as "TTSService"
participant AS as "AvatarService"
FE->>API : "therapyApi.chat(message, emotion)"
API->>FA : "POST /chat"
FA->>GS : "generate_therapy_response()"
GS-->>FA : "response"
FA-->>API : "{response, status}"
API-->>FE : "render chat response"
FE->>API : "therapyApi.generateSpeech(text, voice)"
API->>FA : "POST /tts"
FA->>TS : "generate_speech()"
TS-->>FA : "audio_url"
FA-->>API : "{audio_url, status}"
API-->>FE : "play audio"
FE->>API : "therapyApi.generateAvatar(text, avatarId)"
API->>FA : "POST /avatar"
FA->>AS : "create_talking_avatar()"
AS-->>FA : "video_url"
FA-->>API : "{video_url, status}"
API-->>FE : "display video"
```

**Diagram sources**
- [app.py](file://ai-backend/app.py#L81-L123)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L81-L111)
- [tts_service.py](file://ai-backend/services/tts_service.py#L53-L144)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L19-L67)
- [api.ts](file://WEBAPP/src/lib/api.ts#L76-L113)

Implementation highlights:
- Lazy service initialization avoids import-time overhead
- Static file mounting serves audio/video assets
- Health checks and CORS enabled for development

**Section sources**
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L1-L237)

### Authentication Services (NextAuth + Prisma)
Authentication integrates NextAuth with:
- Prisma adapter for session and user persistence
- Credentials provider for email/password
- Google OAuth provider
- Session lifecycle management and callbacks

```mermaid
sequenceDiagram
participant User as "User Browser"
participant NextAuthRoute as "NextAuth Route"
participant Prisma as "Prisma Adapter"
participant DB as "MySQL"
User->>NextAuthRoute : "Sign in with Credentials"
NextAuthRoute->>Prisma : "Find user by email"
Prisma->>DB : "SELECT user"
DB-->>Prisma : "User record"
Prisma-->>NextAuthRoute : "User"
NextAuthRoute->>NextAuthRoute : "Compare passwords"
NextAuthRoute-->>User : "JWT session"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

Operational details:
- Session strategy uses JWT with configurable max age and update age
- Cookie settings adapt to secure/non-secure environments
- Callbacks enrich JWT and session with role and profile completion status

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

### Data Management (Prisma ORM)
Prisma models define the domain:
- Users, Accounts, Sessions, VerificationTokens
- Chat sessions/messages
- Therapy sessions, appointments, availability
- Patient and therapist profiles
- Analytics and assessments
- Peer support posts and replies

```mermaid
erDiagram
USER {
string id PK
string email UK
string name
string role
boolean isProfileComplete
boolean isBanned
datetime createdAt
}
ACCOUNT {
string id PK
string userId FK
string provider
string providerAccountId
}
SESSION {
string id PK
string sessionToken UK
datetime expires
}
CHAT_SESSION {
string id PK
string userId FK
string title
boolean isActive
}
CHAT_MESSAGE {
string id PK
string userId FK
string sessionId FK
string role
text content
json metadata
}
THERAPY_SESSION {
string id PK
string therapistId FK
string patientId FK
datetime startTime
datetime endTime
string status
}
APPOINTMENT {
string id PK
string therapistId FK
string patientId FK
string slotId FK
datetime scheduledTime
string status
}
PATIENT_PROFILE {
string id PK
string userId UK
int totalSessions
string improvementTrend
}
THERAPIST_PROFILE {
string id PK
string userId UK
string fullName
string degree
}
MENTAL_HEALTH_ANALYTICS {
string id PK
string userId FK
date date
int mentalHealthLevel
json keywordCounts
}
PEER_SUPPORT_POST {
string id PK
string content
string category
int likes
string anonymousId
}
REPLY {
string id PK
string content
string postId FK
}
USER ||--o{ ACCOUNT : "has"
USER ||--o{ SESSION : "has"
USER ||--o{ CHAT_SESSION : "hosts"
CHAT_SESSION ||--o{ CHAT_MESSAGE : "contains"
USER ||--o{ THERAPY_SESSION : "as therapist"
USER ||--o{ THERAPY_SESSION : "as patient"
APPOINTMENT }o--|| THERAPY_SESSION : "links"
USER ||--o{ MENTAL_HEALTH_ANALYTICS : "has"
USER ||--o{ PATIENT_PROFILE : "hasOne"
USER ||--o{ THERAPIST_PROFILE : "hasOne"
PEER_SUPPORT_POST ||--o{ REPLY : "has"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)

### API Clients and External Integrations
The frontend defines API clients for AI and ML backends and utility functions for emotion detection and video analysis.

```mermaid
flowchart TD
Start(["Frontend Request"]) --> ChooseAPI{"Which API?"}
ChooseAPI --> |AI Backend| AIClient["aiApi.post('/chat'|'/tts'|'/avatar')"]
ChooseAPI --> |ML Backend| MLClient["mlApi.post('/detect-emotion')<br/>fetch('/analyze-video')"]
AIClient --> AIResp["Response: {response|audio_url|video_url}"]
MLClient --> MLResp["Response: {emotion, emotions}"]
AIResp --> Render["Render UI"]
MLResp --> Render
```

**Diagram sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)

Integration points:
- AI Backend URL and ML Backend URL configured via environment variables
- Emotion detection and video analysis endpoints exposed by ML backend
- Environment variables for Stripe, Google Calendar, and SMTP configured in frontend

**Section sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [.env](file://WEBAPP/.env#L1-L31)

## Dependency Analysis
High-level dependencies:
- WEBAPP depends on Prisma client and NextAuth for authentication
- AI Backend depends on Groq, ElevenLabs, and D-ID SDKs
- Both layers depend on environment variables for secrets and URLs

```mermaid
graph LR
WEBAPP["WEBAPP (Next.js)"] --> PRISMA["Prisma Client"]
WEBAPP --> NEXTAUTH["NextAuth"]
WEBAPP --> API_CLIENTS["API Clients (aiApi, mlApi)"]
API_CLIENTS --> AI_BACKEND["AI Backend (FastAPI)"]
AI_BACKEND --> GROQ["Groq"]
AI_BACKEND --> ELEVENLABS["ElevenLabs"]
AI_BACKEND --> DID["D-ID"]
PRISMA --> MYSQL["MySQL"]
```

**Diagram sources**
- [package.json](file://WEBAPP/package.json#L1-L88)
- [app.py](file://ai-backend/app.py#L1-L154)
- [groq_ai_service.py](file://ai-backend/services/groq_ai_service.py#L1-L123)
- [tts_service.py](file://ai-backend/services/tts_service.py#L1-L280)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L1-L237)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)

**Section sources**
- [package.json](file://WEBAPP/package.json#L1-L88)
- [app.py](file://ai-backend/app.py#L1-L154)

## Performance Considerations
- AI service latency:
  - Groq chat completions and ElevenLabs TTS requests are asynchronous; ensure timeouts are tuned appropriately
  - Avatar generation involves polling for completion; consider retry/backoff strategies
- Caching and asset serving:
  - Static file mounting enables efficient audio/video delivery
  - Cleanup of temporary audio files prevents disk growth
- Database performance:
  - Indexes defined on frequently queried fields (e.g., user ID, timestamps)
  - Use Prisma pagination and filtering to reduce payload sizes
- Frontend responsiveness:
  - Debounce chat input and batch analytics updates
  - Lazy-load heavy components (e.g., video players)

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and remedies:
- Missing environment variables:
  - Verify AI backend keys (Groq, ElevenLabs, D-ID) and frontend URLs
  - Confirm database URL and NextAuth secrets
- Authentication failures:
  - Check Prisma adapter connectivity and user existence
  - Validate cookie settings for secure/non-secure contexts
- AI service errors:
  - Groq rate limits or invalid API key
  - ElevenLabs quota exceeded or unauthorized; fallback to dummy audio
  - D-ID API key missing; fallback to dummy video
- Email delivery:
  - Ensure SMTP host/port/user/pass are configured; verify sender address

**Section sources**
- [.env](file://ai-backend/.env#L1-L30)
- [.env](file://WEBAPP/.env#L1-L31)
- [tts_service.py](file://ai-backend/services/tts_service.py#L107-L144)
- [avatar_service.py](file://ai-backend/services/avatar_service.py#L24-L67)
- [email.ts](file://WEBAPP/src/lib/email.ts#L1-L201)

## Conclusion
MindBridge employs a clean separation of concerns across the frontend, AI backend, and data layer. The FastAPI microservice encapsulates AI capabilities behind simple endpoints, while NextAuth and Prisma manage identity and persistence. External integrations are modularized, enabling independent scaling and maintenance. The architecture supports scalability through horizontal deployment of services, load balancing, and robust error handling with fallbacks.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Service Boundaries and Interactions
- AI Backend:
  - /chat → GroqService
  - /tts → TTSService
  - /avatar → AvatarService
- Frontend:
  - Uses aiApi/mlApi for backend communication
  - NextAuth handles authentication and session management
  - Prisma models define data contracts

**Section sources**
- [app.py](file://ai-backend/app.py#L81-L123)
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)