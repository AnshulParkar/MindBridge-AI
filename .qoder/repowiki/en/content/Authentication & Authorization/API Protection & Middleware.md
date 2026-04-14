# API Protection & Middleware

<cite>
**Referenced Files in This Document**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts)
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
This document explains how API endpoints are protected and how middleware enforces authentication, authorization, and role-based access control across the backend. It covers:
- Authentication mechanisms (NextAuth.js JWT strategy, session lifecycle, and cookie configuration)
- Authorization enforcement patterns (admin-only endpoints and manual token verification)
- Request validation using schema-based validation
- Token verification and session checking
- Protected route patterns and unauthorized access handling
- Categorization of endpoints by security level and permission requirements
- Error responses for authentication failures and authorization denials
- Best practices for extending protection to new endpoints

## Project Structure
The API surface is organized under a conventional Next.js App Router pattern with per-route handlers. Authentication is centralized via NextAuth.js, while administrative endpoints implement explicit bearer token checks.

```mermaid
graph TB
subgraph "Auth Layer"
NA["NextAuth Config<br/>(JWT strategy)"]
SM["Session Manager<br/>(client-side)"]
end
subgraph "Public/Auth APIs"
REG["POST /api/auth/register"]
CPF["POST /api/auth/check-profile"]
FORGOT["POST /api/auth/forgot-password"]
CP_PAT["POST /api/auth/complete-profile/patient"]
CP_THR["POST /api/auth/complete-profile/therapist"]
end
subgraph "Admin APIs"
ANA["GET /api/admin/analytics"]
USR["GET/PUT /api/admin/users"]
THR["GET/PUT /api/admin/therapists"]
end
NA --> REG
NA --> CPF
NA --> FORGOT
NA --> CP_PAT
NA --> CP_THR
SM --> NA
NA -. "JWT secret" .-> ANA
NA -. "JWT secret" .-> USR
NA -. "JWT secret" .-> THR
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L1-L53)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L1-L102)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L1-L74)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L1-L93)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

## Core Components
- NextAuth.js configuration with JWT strategy and cookie settings
- Admin-only endpoints using manual JWT verification
- Profile completion endpoints enforcing role-specific validations
- Public registration and password reset endpoints with schema validation
- Client-side session manager for session checks and UI feedback

Key implementation patterns:
- Centralized authentication via NextAuth callbacks (JWT/session augmentation)
- Explicit authorization guards in admin endpoints (bearer token + role check)
- Zod-based request validation for all JSON endpoints
- Consistent error response shapes and HTTP status codes

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L1-L102)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L1-L74)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L1-L93)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

## Architecture Overview
The system separates concerns between:
- Authentication: NextAuth manages user sessions and tokens
- Authorization: Admin endpoints enforce roles via bearer tokens
- Validation: Zod schemas validate incoming requests
- Persistence: Prisma ORM handles database operations
- Frontend integration: Client-side session manager validates session state

```mermaid
sequenceDiagram
participant Client as "Client"
participant NextAuth as "NextAuth Config"
participant AdminAPI as "Admin Endpoint"
participant JWT as "jsonwebtoken.verify"
Client->>NextAuth : "Sign in / obtain JWT"
NextAuth-->>Client : "JWT in cookie/token"
Client->>AdminAPI : "GET /api/admin/analytics<br/>Authorization : Bearer <token>"
AdminAPI->>JWT : "verify(token, NEXTAUTH_SECRET)"
JWT-->>AdminAPI : "{ role }"
AdminAPI->>AdminAPI : "Check role === 'admin'"
AdminAPI-->>Client : "200 OK or 401 Unauthorized"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)

## Detailed Component Analysis

### Authentication and Session Management
- NextAuth configuration:
  - Uses JWT strategy with session token rotation and refresh windows
  - Cookie settings tuned for local development and secure environments
  - Callbacks augment JWT and session with user role, ID, and profile completion flag
  - Events log sign-in/out and session access for monitoring
- Client-side session manager:
  - Detects incognito mode and handles storage events
  - Validates session on focus and redirects to sign-in when expired

```mermaid
flowchart TD
Start(["Client loads"]) --> Focus["Window focus event"]
Focus --> FetchSession["GET /api/auth/session"]
FetchSession --> HasSession{"Has session.user?"}
HasSession --> |Yes| Continue["Continue browsing"]
HasSession --> |No| Redirect["Redirect to /auth/signin"]
Redirect --> End(["End"])
Continue --> End
```

**Diagram sources**
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

### Admin-Protected Endpoints
- Analytics endpoint:
  - Verifies bearer token against a shared admin secret
  - Returns aggregated metrics after authorization check
- Users endpoint:
  - GET supports filtering by role and partial name/email
  - PUT supports ban/unban/delete actions guarded by admin token
- Therapists endpoint:
  - GET lists profiles by verification status
  - PUT approves/rejects profiles with optional rejection reason

```mermaid
sequenceDiagram
participant Client as "Client"
participant AdminAPI as "Admin Endpoint"
participant JWT as "jsonwebtoken.verify"
participant DB as "Prisma"
Client->>AdminAPI : "GET /api/admin/users?role=patient&search=john"
AdminAPI->>AdminAPI : "verifyAdmin(req)"
AdminAPI->>JWT : "verify(token, NEXTAUTH_SECRET)"
JWT-->>AdminAPI : "role === 'admin'? true/false"
AdminAPI->>DB : "findMany(users)"
DB-->>AdminAPI : "users[]"
AdminAPI-->>Client : "200 OK { users }"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)

### Registration and Profile Completion
- Registration:
  - Validates email, password length, and role
  - Prevents duplicates and hashes passwords
- Check profile:
  - Returns user’s profile completion state, role, ban status, and therapist verification metadata
- Patient profile completion:
  - Validates patient-specific fields and upserts patient details
  - Marks profile complete upon success
- Therapist profile completion:
  - Validates therapist-specific fields and creates profile with pending verification
  - Updates user name and profile completion flag

```mermaid
flowchart TD
A["POST /api/auth/register"] --> V1["Zod validate {email, password, role}"]
V1 --> Dup{"Duplicate user?"}
Dup --> |Yes| R409["409 Conflict"]
Dup --> |No| Hash["Hash password"]
Hash --> Create["Prisma user.create"]
Create --> R201["201 Created"]
B["POST /api/auth/complete-profile/patient"] --> V2["Zod validate patient fields"]
V2 --> Exists{"User exists and role=patient?"}
Exists --> |No| R404["404 Not Found"]
Exists --> |Yes| UpsertP["Upsert patient details"]
UpsertP --> UpdateU["Update user name + isProfileComplete"]
UpdateU --> R200["200 OK"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L1-L74)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L1-L53)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L1-L53)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L1-L74)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L1-L93)

### Password Reset Workflow
- Generates a short-lived OTP, stores it, and emails it to the user
- Enforces role-aware lookup and invalidates stale OTPs

```mermaid
sequenceDiagram
participant Client as "Client"
participant Reset as "POST /api/auth/forgot-password"
participant DB as "Prisma"
participant Email as "Email Service"
Client->>Reset : "{ email, role }"
Reset->>DB : "findFirst(user)"
DB-->>Reset : "user or null"
Reset->>DB : "invalidate unused OTPs"
Reset->>Reset : "generateOTP()"
Reset->>DB : "create otpToken"
Reset->>Email : "sendOTP(email, otp)"
Reset-->>Client : "200 OK { userId }"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L1-L102)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L1-L102)

## Dependency Analysis
- Authentication depends on:
  - NextAuth configuration for JWT/session management
  - Prisma for user and account lookups
  - bcrypt for password hashing/verification
- Admin endpoints depend on:
  - jsonwebtoken for bearer token verification
  - Shared admin secret (NEXTAUTH_SECRET fallback)
  - Prisma for reporting and user/profile updates
- Client-side session manager depends on:
  - Browser storage and focus events
  - NextAuth session endpoint for validation

```mermaid
graph LR
NA["NextAuth Config"] --> JWT["JWT Token"]
NA --> COOKIES["Cookie Settings"]
NA --> PRISMA["Prisma Adapter"]
JWT --> ADMINS["Admin Endpoints"]
ADMINS --> SECRET["NEXTAUTH_SECRET"]
ADMINS --> PRISMA
CLIENT["Client Session Manager"] --> NA
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L1-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L1-L93)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

## Performance Considerations
- Prefer batched queries for analytics to reduce round-trips
- Cache frequently accessed admin metrics where appropriate
- Keep Zod schemas minimal and reuse common field definitions
- Avoid heavy computations in middleware; defer to database-level aggregations
- Use pagination for admin listings when datasets grow

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized 401 on admin endpoints:
  - Ensure Authorization header includes a valid bearer token
  - Confirm token was issued by the same secret used by the server
- JWT expiration:
  - NextAuth performs server-side expiration checks in callbacks
  - Client should refresh or re-authenticate when encountering expired sessions
- Duplicate registration:
  - Registration prevents duplicates for the same email+role combination
- Schema validation errors:
  - Review request payload against Zod schemas for missing or invalid fields
- Session drift:
  - Client-side focus event triggers session validation; ensure endpoint availability

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L1-L109)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

## Conclusion
The backend employs a layered protection model:
- NextAuth secures general user flows with JWT and session management
- Admin endpoints enforce role-based access via bearer tokens
- Zod schemas ensure robust request validation
- Client-side session manager improves UX and security posture

Adhering to these patterns ensures consistent protection across new endpoints.

## Appendices

### Endpoint Security Matrix
- Public/Auth:
  - Registration: validated input, duplicate prevention, password hashing
  - Check profile: safe lookup with structured response
  - Forgot password: OTP generation and email delivery
  - Profile completion: role-specific validation and persistence
- Admin:
  - Analytics: bearer token + role check
  - Users: bearer token + role check, filtering, and actions
  - Therapists: bearer token + role check, verification workflows

### Error Responses
Typical error responses include:
- 400 Bad Request: invalid input or malformed request
- 401 Unauthorized: missing/invalid bearer token or insufficient privileges
- 404 Not Found: resource not found
- 409 Conflict: duplicate resource
- 500 Internal Server Error: unexpected server error

### Best Practices for Extending Protection
- Use bearer token verification for any endpoint requiring elevated privileges
- Centralize validation with Zod schemas and return structured error objects
- Reuse NextAuth callbacks for consistent JWT/session augmentation
- Add client-side session checks for improved UX and timely redirects
- Log security-relevant events (sign-in/out, session access, admin actions)
- Keep secrets and configurations environment-driven and secure