# Data Flow Patterns

<cite>
**Referenced Files in This Document**
- [db.ts](file://WEBAPP/src/lib/db.ts)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [api.ts](file://WEBAPP/src/lib/api.ts)
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts)
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/reply/route.ts)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/like/route.ts)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts)
- [route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts)
- [app.py](file://ai-backend/app.py)
- [ai_service.py](file://ai-backend/services/ai_service.py)
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
This document explains the end-to-end data flow in the MindBridge system, covering user input, AI processing, storage, retrieval, and analytics. It details the transformation pipeline for therapy sessions, emotion analytics, and peer support posts, and outlines real-time flows for chat, session management, and analytics updates. It also documents validation, sanitization, security measures, caching strategies, persistence patterns, backup procedures, privacy compliance, encryption, and audit logging requirements.

## Project Structure
MindBridge comprises:
- Frontend (Next.js app) with API routes, hooks, and analytics engine
- AI backend (FastAPI) for therapy responses, TTS, and avatar generation
- ML backend (placeholder) for emotion/video analysis
- Database (MySQL via Prisma) storing user, chat, therapy, analytics, and peer support data

```mermaid
graph TB
subgraph "Frontend (Next.js)"
FE_API["API Routes<br/>/chat/messages, /chat/sessions,<br/>/peer-support/posts, /analytics"]
FE_HOOKS["Hooks<br/>useChat, sessionManager"]
FE_LIB["Libraries<br/>api.ts, mentalHealthAnalytics.ts"]
FE_DB["Prisma Client<br/>db.ts"]
end
subgraph "AI Backend (FastAPI)"
AI_APP["app.py"]
AI_SERVICES["ai_service.py<br/>GroqService"]
end
subgraph "ML Backend"
ML_PLACEHOLDER["Placeholder for emotion/video analysis"]
end
DB["MySQL Database<br/>schema.prisma"]
FE_API --> FE_DB
FE_HOOKS --> FE_API
FE_LIB --> FE_API
FE_API --> AI_APP
AI_APP --> AI_SERVICES
FE_API --> DB
FE_LIB --> DB
AI_APP --> DB
```

**Diagram sources**
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L1-L150)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L1-L161)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L1-L253)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)

**Section sources**
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L1-L150)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L1-L161)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L1-L253)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)

## Core Components
- Data persistence: Prisma ORM connects to MySQL and defines models for users, chats, therapy sessions, analytics, and peer support.
- Frontend API routes: Secure endpoints for chat sessions/messages, peer support posts/replies/likes, analytics computation, and therapy session management.
- AI backend: FastAPI service exposing /chat, /tts, and /avatar endpoints powered by GroqService with optional RAG.
- Analytics engine: Browser-side and server-side analyzers for keyword detection, sentiment, trends, and risk flags.
- Session management: Client-side utilities for session expiration checks and incognito detection.

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L1-L161)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L1-L253)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L1-L884)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

## Architecture Overview
The system follows a layered architecture:
- Presentation: Next.js pages and API routes
- Application: Route handlers orchestrate Prisma queries and external service calls
- AI/ML: FastAPI microservices for therapy, TTS, avatar, and emotion/video analysis
- Data: MySQL with Prisma schema and indexes

```mermaid
graph TB
Client["Client App"]
NextRoutes["Next.js API Routes"]
Prisma["Prisma Client"]
MySQL["MySQL Database"]
AIBackend["AI Backend (FastAPI)"]
Groq["GroqService (ai_service.py)"]
MLBackend["ML Backend (placeholder)"]
Client --> NextRoutes
NextRoutes --> Prisma
Prisma --> MySQL
NextRoutes --> AIBackend
AIBackend --> Groq
NextRoutes --> MLBackend
```

**Diagram sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)

## Detailed Component Analysis

### Chat Data Flow (End-to-End)
This flow covers user message submission, AI response generation, optional TTS/avatar, and persistence.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "useChat Hook"
participant FE as "Next API Route (/chat/messages)"
participant PRISMA as "Prisma Client"
participant AI as "AI Backend (/chat)"
participant GROQ as "GroqService"
U->>UI : "Send message"
UI->>FE : "POST /api/chat/messages"
FE->>PRISMA : "Create ChatMessage"
PRISMA-->>FE : "Saved message"
FE-->>UI : "201 Created"
UI->>AI : "POST /chat"
AI->>GROQ : "generate_therapy_response()"
GROQ-->>AI : "Therapy response"
AI-->>UI : "Response"
UI->>FE : "Optional : POST /tts or /avatar"
FE-->>UI : "Audio/Video URLs"
```

**Diagram sources**
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L1-L150)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [api.ts](file://WEBAPP/src/lib/api.ts#L76-L113)
- [app.py](file://ai-backend/app.py#L81-L95)
- [ai_service.py](file://ai-backend/services/ai_service.py#L131-L192)

**Section sources**
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L1-L150)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [api.ts](file://WEBAPP/src/lib/api.ts#L76-L113)
- [app.py](file://ai-backend/app.py#L81-L95)
- [ai_service.py](file://ai-backend/services/ai_service.py#L131-L192)

### Session Management Flow
User chat sessions are created, listed, updated, and deleted with ownership checks and soft-delete semantics.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Next API Route (/chat/sessions)"
participant PRISMA as "Prisma Client"
U->>FE : "POST /api/chat/sessions {title}"
FE->>PRISMA : "Create ChatSession (userId)"
PRISMA-->>FE : "Session"
FE-->>U : "201 Created"
U->>FE : "GET /api/chat/sessions"
FE->>PRISMA : "FindMany {userId, isActive=true}"
PRISMA-->>FE : "Sessions"
FE-->>U : "List"
U->>FE : "PATCH /api/chat/sessions {sessionId,title}"
FE->>PRISMA : "Update ChatSession (userId)"
PRISMA-->>FE : "Updated session"
FE-->>U : "OK"
U->>FE : "DELETE /api/chat/sessions?sessionId=..."
FE->>PRISMA : "Find session (userId)"
alt "No messages"
FE->>PRISMA : "Delete ChatSession"
else "Has messages"
FE->>PRISMA : "Update isActive=false"
end
PRISMA-->>FE : "Success"
FE-->>U : "OK"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L108-L138)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L108-L138)

### Peer Support Posts Flow
Posts are validated, rate-limited, anonymized, and stored with replies and likes.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Next API Route (/peer-support/posts)"
participant PRISMA as "Prisma Client"
U->>FE : "POST /api/peer-support/posts {content,category}"
FE->>FE : "validatePostData()"
FE->>FE : "hashIP(), generateAnonymousId()"
FE->>PRISMA : "Count recent posts (IP)"
PRISMA-->>FE : "Count"
alt "Within rate limit"
FE->>PRISMA : "Create PeerSupportPost"
PRISMA-->>FE : "Post"
FE-->>U : "201 Created"
else "Rate limit exceeded"
FE-->>U : "429 Too Many Requests"
end
U->>FE : "GET /api/peer-support/posts?page=&category=&search="
FE->>PRISMA : "findMany + count"
PRISMA-->>FE : "Posts + pagination"
FE-->>U : "List"
U->>FE : "POST /api/peer-support/posts/[id]/reply {content,isVolunteer}"
FE->>PRISMA : "Update Post.replies (nested create)"
PRISMA-->>FE : "Post with replies"
FE-->>U : "OK"
U->>FE : "POST /api/peer-support/posts/[id]/like {increment : true|false}"
FE->>PRISMA : "Update likes (+/-) with min clamp"
PRISMA-->>FE : "Post"
FE-->>U : "OK"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L1-L161)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/reply/route.ts#L1-L100)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/like/route.ts#L1-L58)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L79-L106)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L1-L161)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/reply/route.ts#L1-L100)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/like/route.ts#L1-L58)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L79-L106)

### Emotion Analytics Pipeline
The pipeline extracts keywords, computes severity levels, detects risks, and stores daily analytics.

```mermaid
flowchart TD
Start(["Start"]) --> FetchMsgs["Fetch user messages (last 7 days)"]
FetchMsgs --> HasMsgs{"Any messages?"}
HasMsgs --> |No| ReturnEmpty["Return minimal analytics"]
HasMsgs --> |Yes| Analyze["analyzeMessages(messages)"]
Analyze --> RiskFlags["Compute risk flags<br/>and level"]
RiskFlags --> Persist["Persist MentalHealthAnalytics"]
Persist --> Trend["computeTrend(history)"]
Trend --> Done(["Done"])
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L195-L252)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L1-L253)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L1-L884)

### Therapy Session Management
Endpoints support listing and creating therapy sessions with therapist/patient filters.

```mermaid
sequenceDiagram
participant U as "User/Admin"
participant FE as "Next API Route (/therapy/sessions)"
participant PRISMA as "Prisma Client"
U->>FE : "GET /api/therapy/sessions?therapistId=&patientId="
FE->>PRISMA : "findMany with filters"
PRISMA-->>FE : "Sessions"
FE-->>U : "List"
U->>FE : "POST /api/therapy/sessions {therapistId,patientId,startTime,...}"
FE->>PRISMA : "create TherapySession"
PRISMA-->>FE : "Session"
FE-->>U : "201 Created"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L1-L80)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L140-L161)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L1-L80)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L140-L161)

### Real-Time Data Flows
- Chat: Client sends messages via useChat hook to API routes, receives AI responses, and optionally TTS/avatar URLs. The UI updates immediately with new messages.
- Sessions: Listing and updating chat sessions occurs on demand; deletion applies soft-delete semantics when messages exist.
- Analytics: On-demand refresh triggers a recalculation over recent messages and persists the result.

**Section sources**
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L1-L150)
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L1-L91)
- [route.ts](file://WEBAPP/src/app/api/chat/sessions/route.ts#L1-L187)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L166-L190)

### Data Validation, Sanitization, and Security
- Chat messages: Required content validation, trimming, and metadata storage; unauthorized access blocked by session checks.
- Peer support posts: Content and category validation, rate limiting (per IP), hashing for spam prevention, anonymous IDs, and nested reply creation.
- Authentication: NextAuth session-based protection across API routes; unauthorized requests return 401.
- AI backend: CORS enabled; bearer security placeholder; lazy service initialization.
- Privacy: Anonymous identifiers and IP hashing for posts; sensitive fields are stored with appropriate indexing; no PII leakage in public views.

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L22-L45)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L80-L129)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/reply/route.ts#L20-L72)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/[id]/like/route.ts#L4-L58)
- [app.py](file://ai-backend/app.py#L23-L30)

### Caching Strategies, Persistence, and Backups
- Caching: No explicit caching layer observed in the frontend or backend code; analytics recomputation is triggered on demand.
- Persistence: Prisma manages MySQL persistence with indexes on frequently queried fields (e.g., timestamps, statuses).
- Backups: No dedicated backup procedure documented in the code; rely on Prisma-managed migrations and database backups outside this repository.

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L34-L37)

### Data Privacy Compliance, Encryption, and Audit Logging
- Encryption at rest: Database credentials and environment variables are loaded via .env; no explicit encryption-at-rest code observed in the repository.
- Encryption in transit: AI/ML backend endpoints are configured with CORS; secure transport depends on deployment configuration (not shown here).
- Audit logging: No explicit audit logs in the code; consider adding structured logs for sensitive operations (e.g., analytics writes, post creations).

**Section sources**
- [app.py](file://ai-backend/app.py#L23-L30)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L195-L252)

## Dependency Analysis
The frontend depends on Prisma for data access and FastAPI services for AI/ML capabilities. The AI backend encapsulates GroqService and optional RAG.

```mermaid
graph LR
FE_API["Frontend API Routes"] --> PRISMA["Prisma Client"]
FE_API --> AI_APP["AI Backend App"]
AI_APP --> GROQ["GroqService"]
PRISMA --> MYSQL["MySQL"]
```

**Diagram sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)

**Section sources**
- [api.ts](file://WEBAPP/src/lib/api.ts#L1-L142)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)
- [app.py](file://ai-backend/app.py#L1-L154)
- [ai_service.py](file://ai-backend/services/ai_service.py#L1-L293)

## Performance Considerations
- Indexes: Prisma schema includes indexes on frequently filtered/sorted fields (timestamps, statuses, categories) to optimize reads.
- Asynchronous processing: AI backend uses asynchronous calls and executor threads for Groq and optional RAG retrieval.
- Pagination: Peer support posts and chat messages use pagination to limit payload sizes.
- Recommendations: Consider implementing Redis caching for analytics endpoints, batching analytics writes, and adding circuit breakers for AI service calls.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Unauthorized access: Ensure NextAuth session is present; API routes return 401 for missing sessions.
- Rate limits: Peer support posts enforce rate limiting per IP; excessive posts return 429.
- AI service failures: GroqService wraps exceptions and returns fallback responses; check environment variables and connectivity.
- Analytics gaps: If no recent messages are found, analytics returns minimal defaults; trigger refresh to re-analyze.

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/chat/messages/route.ts#L8-L20)
- [route.ts](file://WEBAPP/src/app/api/peer-support/posts/route.ts#L96-L107)
- [ai_service.py](file://ai-backend/services/ai_service.py#L188-L191)
- [route.ts](file://WEBAPP/src/app/api/analytics/route.ts#L195-L216)

## Conclusion
MindBridge implements a clear separation of concerns across frontend, AI/ML backends, and persistent storage. The data flows are secure, validated, and designed for incremental analytics and peer support. Enhancements in caching, encryption, and audit logging would further strengthen the system’s robustness and compliance posture.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Data Models Overview
```mermaid
erDiagram
USER {
string id PK
string email UK
string role
boolean isProfileComplete
boolean isBanned
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
PEER_SUPPORT_POST {
string id PK
string content
string category
int likes
string anonymousId
string ipHash
boolean isActive
}
REPLY {
string id PK
string content
datetime timestamp
boolean isVolunteer
string anonymousId
string postId FK
}
MENTAL_HEALTH_ANALYTICS {
string id PK
string userId FK
date date
int mentalHealthLevel
string levelLabel
json keywordCounts
json riskFlags
string source
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
}
USER ||--o{ CHAT_SESSION : "owns"
USER ||--o{ CHAT_MESSAGE : "writes"
CHAT_SESSION ||--o{ CHAT_MESSAGE : "contains"
USER ||--o{ MENTAL_HEALTH_ANALYTICS : "analyzed_by"
PEER_SUPPORT_POST ||--o{ REPLY : "replies"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)