# NextAuth Configuration

<cite>
**Referenced Files in This Document**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [.env](file://WEBAPP/.env)
- [.env.example](file://WEBAPP/.env.example)
- [db.ts](file://WEBAPP/src/lib/db.ts)
- [next.config.ts](file://WEBAPP/next.config.ts)
- [GOOGLE_OAUTH_SETUP.md](file://WEBAPP/GOOGLE_OAUTH_SETUP.md)
- [MY_SQL_INFO.md](file://WEBAPP/MY_SQL_INFO.md)
- [package.json](file://WEBAPP/package.json)
- [next-auth.d.ts](file://WEBAPP/src/types/next-auth.d.ts)
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
This document provides comprehensive guidance for configuring and operating NextAuth in the MindBridge web application. It covers provider configuration (Google OAuth and Credentials), JWT-based session strategy with secure cookie settings across environments, Prisma adapter integration for database persistence, callback transformations for signIn, jwt, and session, cookie configuration for ngrok compatibility, provider-specific settings such as consent prompts and offline access, and troubleshooting for common NextAuth issues.

## Project Structure
The NextAuth configuration is centralized in a Next.js app route handler under the API surface. Supporting components include:
- NextAuth route handler with providers, callbacks, and cookie/session settings
- Prisma schema modeling NextAuth tables and application user profiles
- Environment variables for secrets, providers, and database connectivity
- Prisma client initialization and Next.js configuration for ngrok compatibility

```mermaid
graph TB
subgraph "Next.js App"
NA["NextAuth Route Handler<br/>src/app/api/auth/[...nextauth]/route.ts"]
NC["Next Config<br/>next.config.ts"]
end
subgraph "Authentication Layer"
ProvG["Google Provider"]
ProvC["Credentials Provider"]
CB["Callbacks<br/>signIn / jwt / session"]
Cookie["Cookie Settings<br/>sessionToken / callbackUrl / csrfToken"]
Session["Session Strategy<br/>JWT with maxAge/updateAge"]
end
subgraph "Persistence"
PRISMA["Prisma Adapter"]
SCHEMA["Prisma Schema<br/>User / Account / Session"]
DB["MySQL Database"]
end
subgraph "Environment"
ENV[".env / .env.example"]
TYPES["Type Declarations<br/>next-auth.d.ts"]
end
NA --> ProvG
NA --> ProvC
NA --> CB
NA --> Cookie
NA --> Session
NA --> PRISMA
PRISMA --> SCHEMA
SCHEMA --> DB
ENV --> NA
TYPES --> NA
NC --> NA
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L11-L77)
- [.env](file://WEBAPP/.env#L1-L31)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)
- [next-auth.d.ts](file://WEBAPP/src/types/next-auth.d.ts#L1-L28)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L1-L330)
- [.env](file://WEBAPP/.env#L1-L31)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)
- [next-auth.d.ts](file://WEBAPP/src/types/next-auth.d.ts#L1-L28)

## Core Components
- Providers
  - Google OAuth provider configured with consent prompt and offline access for refresh tokens
  - Credentials provider validating user credentials against the database
- Session Strategy
  - JWT strategy with configurable maxAge and updateAge for automatic expiration and refresh
- Cookies
  - Custom cookie names and options; secure flag dynamically controlled by NEXTAUTH_URL scheme
- Adapter
  - Prisma adapter integrated with a MySQL datasource
- Callbacks
  - signIn: handles Google user linking/creation and bans
  - jwt: enriches token with user role, id, and profile completion status
  - session: propagates role/id/isProfileComplete to session.user
- Events
  - Logging for signOut, session access, and signIn events
- Pages
  - Custom sign-in page mapped to /auth/signin

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L11-L77)
- [.env](file://WEBAPP/.env#L1-L31)
- [next-auth.d.ts](file://WEBAPP/src/types/next-auth.d.ts#L1-L28)

## Architecture Overview
The authentication flow integrates NextAuth with Prisma-backed storage and environment-aware cookie security. The diagram below maps the actual implementation components.

```mermaid
sequenceDiagram
participant Client as "Browser"
participant NextAuth as "NextAuth Route Handler"
participant Google as "Google Provider"
participant Prisma as "Prisma Adapter"
participant DB as "MySQL"
Client->>NextAuth : "GET /api/auth/signin"
NextAuth-->>Client : "Redirect to Google"
Client->>Google : "Authorize"
Google-->>NextAuth : "Callback with tokens"
NextAuth->>Prisma : "Find/Create User / Link Account"
Prisma->>DB : "Read/Write User/Account"
DB-->>Prisma : "Result"
Prisma-->>NextAuth : "User record"
NextAuth->>NextAuth : "Callbacks : signIn / jwt / session"
NextAuth-->>Client : "Set cookies (JWT in sessionToken)"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L49-L98)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L99-L214)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L11-L77)

## Detailed Component Analysis

### Provider Configuration: Google OAuth
- Client credentials loaded from environment variables
- Authorization parameters include consent prompt and offline access to obtain refresh tokens
- Redirect URI aligns with NextAuth callback endpoint

Implementation highlights:
- Provider definition and authorization parameters
- Environment variables for client ID and secret
- Setup guide for consent screen, scopes, and redirect URIs

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L50-L61)
- [.env](file://WEBAPP/.env#L25-L28)
- [GOOGLE_OAUTH_SETUP.md](file://WEBAPP/GOOGLE_OAUTH_SETUP.md#L1-L74)

### Provider Configuration: Credentials Provider
- Accepts email, password, and role credentials
- Validates against database user records
- Prevents banned users from authenticating

```mermaid
flowchart TD
Start(["authorize(credentials)"]) --> CheckCreds["Check email and password present"]
CheckCreds --> |Missing| ReturnNull1["Return null"]
CheckCreds --> |Present| FindUser["Find user by email and role"]
FindUser --> Found{"User found?"}
Found --> |No| ReturnNull2["Return null"]
Found --> |Yes| CheckBan{"isBanned?"}
CheckBan --> |Yes| ReturnNull3["Return null"]
CheckBan --> |No| ComparePwd["Compare password hash"]
ComparePwd --> Valid{"Valid?"}
Valid --> |No| ReturnNull4["Return null"]
Valid --> |Yes| ReturnUser["Return user payload"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L62-L97)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L62-L97)

### Session Strategy: JWT with Secure Cookies
- Strategy: JWT
- Max session lifetime: 30 days
- Refresh window: 24 hours
- Cookie settings:
  - Names customized for clarity
  - httpOnly and sameSite lax
  - Path restricted to root
  - secure flag toggled based on NEXTAUTH_URL scheme
  - Max age aligned with session length

```mermaid
flowchart TD
S0(["Session Start"]) --> S1["Initialize JWT with maxAge"]
S1 --> S2["On activity within updateAge window"]
S2 --> S3["Extend token expiring at"]
S3 --> S4["Persist via cookies (sessionToken)"]
S4 --> S5{"secure flag?"}
S5 --> |HTTPS| S6["Allow secure cookies"]
S5 --> |HTTP| S7["Allow non-secure cookies (ngrok/dev)"]
S6 --> S8(["Active Session"])
S7 --> S8
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L10-L14)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L16-L46)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L47-L48)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L10-L14)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L16-L48)

### Adapter Implementation: Prisma for Database Integration
- Prisma adapter connects NextAuth to MySQL
- Prisma client initialized with environment-aware logging
- NextAuth tables (User, Account, Session, VerificationToken) defined in schema
- Additional application models (PatientDetails, TherapistProfile, etc.) coexist

```mermaid
erDiagram
USER {
string id PK
string email UK
string name
string password
string role
boolean isProfileComplete
boolean isBanned
}
ACCOUNT {
string id PK
string userId FK
string type
string provider
string providerAccountId
int expires_at
}
SESSION {
string id PK
string sessionToken UK
string userId FK
datetime expires
}
VERIFICATIONTOKEN {
string identifier
string token UK
datetime expires
}
USER ||--o{ ACCOUNT : "has"
USER ||--o{ SESSION : "has"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L11-L77)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L9)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L11-L77)
- [db.ts](file://WEBAPP/src/lib/db.ts#L1-L15)

### Callback Functions: signIn, jwt, session Transformations
- signIn
  - For Google: link existing user accounts or create a new patient user with a temporary password and link the Google account
  - Enforce bans by returning false
- jwt
  - Attach role, id, and isProfileComplete to token on sign-in
  - On subsequent requests, resolve role/id/name/isProfileComplete from database using token email
  - Log expired tokens server-side
- session
  - Populate session.user with role, id, and isProfileComplete derived from token

```mermaid
sequenceDiagram
participant NA as "NextAuth"
participant CB as "Callbacks"
participant DB as "Prisma/User"
participant TOK as "JWT Token"
participant SESS as "Session"
NA->>CB : "signIn({user, account})"
alt Google
CB->>DB : "Find user by email"
DB-->>CB : "Existing or null"
CB->>DB : "Link/create account"
CB-->>NA : "true (point to existing user)"
else Credentials
CB-->>NA : "true/false"
end
NA->>CB : "jwt({token,user,account})"
alt user present
CB->>TOK : "Add role/id/isProfileComplete"
end
alt account provider is google
CB->>DB : "Resolve user by email"
DB-->>CB : "User record"
CB->>TOK : "Update role/id/name/isProfileComplete"
end
CB-->>NA : "Updated token"
NA->>CB : "session({session,token})"
CB->>SESS : "Attach role/id/isProfileComplete"
CB-->>NA : "Updated session"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L99-L214)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L99-L214)

### Cookie Configuration for ngrok Compatibility and Secure Cookies
- Custom cookie names for sessionToken, callbackUrl, and csrfToken
- httpOnly and sameSite lax recommended defaults
- secure flag dynamically enabled when NEXTAUTH_URL uses HTTPS
- useSecureCookies toggled accordingly for cookie signing/validation
- Next.js headers configuration allows external access for ngrok testing

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L15-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L47-L48)
- [next.config.ts](file://WEBAPP/next.config.ts#L21-L41)

### Provider-Specific Settings: Consent Prompt and Offline Access
- Google provider configured with:
  - prompt: consent
  - access_type: offline
  - response_type: code
- This enables long-lived refresh tokens for extended access scenarios

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L54-L60)

### Type Declarations for Enhanced Type Safety
- Extends NextAuth session and JWT types to include role, id, and isProfileComplete fields
- Ensures type-safe access to user data in callbacks and downstream components

**Section sources**
- [next-auth.d.ts](file://WEBAPP/src/types/next-auth.d.ts#L1-L28)

## Dependency Analysis
Key dependencies and integrations:
- NextAuth runtime and providers
- Prisma adapter and client
- MySQL datasource
- Environment variables for secrets and URLs
- Next.js configuration for headers and ngrok compatibility

```mermaid
graph LR
Pkg["package.json"]
NA["NextAuth"]
ProvG["Google Provider"]
ProvC["Credentials Provider"]
Adpt["@next-auth/prisma-adapter"]
PC["@prisma/client"]
ENV[".env"]
NC["next.config.ts"]
Pkg --> NA
Pkg --> Adpt
Pkg --> PC
NA --> ProvG
NA --> ProvC
NA --> Adpt
Adpt --> PC
ENV --> NA
ENV --> PC
NC --> NA
```

**Diagram sources**
- [package.json](file://WEBAPP/package.json#L15-L72)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L6)
- [.env](file://WEBAPP/.env#L1-L31)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)

**Section sources**
- [package.json](file://WEBAPP/package.json#L15-L72)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L6)
- [.env](file://WEBAPP/.env#L1-L31)
- [next.config.ts](file://WEBAPP/next.config.ts#L1-L45)

## Performance Considerations
- JWT strategy reduces database load for session validation; ensure token size remains reasonable by limiting claims
- Prisma client logging is reduced in production to minimize overhead
- Cookie secure flag disabled in non-HTTPS environments to avoid browser blocking; enable HTTPS in production for optimal security
- Consider rate-limiting for authentication endpoints and caching token resolution results if scaling

## Troubleshooting Guide
Common issues and resolutions:
- Google OAuth redirect mismatch
  - Ensure redirect URI matches the configured origin and callback path
  - Verify authorized JavaScript origins and redirect URIs in Google Cloud Console
- Access blocked during testing
  - Add test users in the OAuth consent screen
- Google sign-in button not visible
  - Confirm GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set and server restarted
- Database connectivity
  - Verify DATABASE_URL correctness and MySQL service availability
  - Re-run Prisma client generation and schema push if TypeScript errors occur
- ngrok HTTPS and cookies
  - NEXTAUTH_URL should use HTTPS for secure cookies; otherwise, cookies may be rejected by modern browsers
  - Confirm useSecureCookies alignment with NEXTAUTH_URL scheme
- Session not persisting
  - Check cookie domain/path settings and secure flag
  - Validate JWT token expiry and server-side token refresh logic

**Section sources**
- [GOOGLE_OAUTH_SETUP.md](file://WEBAPP/GOOGLE_OAUTH_SETUP.md#L70-L74)
- [MY_SQL_INFO.md](file://WEBAPP/MY_SQL_INFO.md#L97-L114)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L16-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L47-L48)

## Conclusion
The NextAuth configuration in MindBridge leverages a robust JWT-based session strategy, Prisma-backed persistence, and provider-specific settings for Google OAuth. The setup includes environment-aware cookie security, comprehensive callback transformations, and practical guidance for ngrok compatibility and production hardening. Following the troubleshooting steps and maintaining proper environment variable hygiene ensures reliable authentication across development and production.

## Appendices

### Environment Variables Reference
- NEXTAUTH_URL: Base URL for NextAuth (use HTTPS in production)
- NEXTAUTH_SECRET: Cryptographic secret for signing tokens
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: Google OAuth credentials
- DATABASE_URL: MySQL connection string for Prisma

**Section sources**
- [.env](file://WEBAPP/.env#L1-L31)
- [.env.example](file://WEBAPP/.env.example#L1-L16)

### Prisma Initialization Checklist
- Copy .env.example to .env and update values
- Create MySQL database and update DATABASE_URL
- Generate Prisma client and push schema
- Start the application

**Section sources**
- [MY_SQL_INFO.md](file://WEBAPP/MY_SQL_INFO.md#L10-L75)