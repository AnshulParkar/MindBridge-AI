# Authentication & Authorization

<cite>
**Referenced Files in This Document**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/reset-password/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts)
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
9. [HIPAA and Security Considerations](#hipaa-and-security-considerations)
10. [Conclusion](#conclusion)

## Introduction
This document explains the authentication and authorization system for the MindBridge platform. It covers NextAuth implementation with multiple providers (email/password and OAuth), role-based access control (Patients, Therapists, Admin), session and token management, and security measures. It also documents user registration, login, password reset, and profile completion flows, along with API endpoint protection and access control patterns.

## Project Structure
The authentication system spans NextAuth configuration, API routes for registration and password reset, frontend pages for sign-in, registration, and password recovery, and session utilities for client-side session handling.

```mermaid
graph TB
subgraph "NextAuth"
NA["NextAuth Config<br/>[...nextauth]/route.ts"]
end
subgraph "Auth API Routes"
REG["POST /api/auth/register<br/>route.ts"]
FP["POST /api/auth/forgot-password<br/>route.ts"]
VO["POST /api/auth/verify-otp<br/>route.ts"]
RP["POST /api/auth/reset-password<br/>route.ts"]
CP["POST /api/auth/check-profile<br/>route.ts"]
CPP["POST /api/auth/complete-profile/patient<br/>route.ts"]
CPT["POST /api/auth/complete-profile/therapist<br/>route.ts"]
end
subgraph "Frontend Pages"
SI["/auth/signin<br/>page.tsx"]
RG["/auth/register<br/>page.tsx"]
FR["/auth/forgot-password<br/>page.tsx"]
VP["/auth/verification-pending<br/>page.tsx"]
end
subgraph "Client Utilities"
SM["SessionManager<br/>sessionManager.ts"]
end
SI --> NA
RG --> REG
FR --> FP
FR --> VO
FR --> RP
SI --> CP
SI --> CPP
SI --> CPT
SI --> VP
SI --> SM
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L1-L48)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L1-L102)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts#L1-L55)
- [route.ts](file://WEBAPP/src/app/api/auth/reset-password/route.ts#L1-L42)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L1-L53)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L1-L74)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L1-L93)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L1-L257)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L1-L266)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L1-L275)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L1-L119)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L78)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L240)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L1-L257)

## Core Components
- NextAuth configuration with JWT strategy, cookie settings, providers (Google OAuth and Credentials), callbacks for JWT/session augmentation, and event logging.
- Registration API validating inputs and hashing passwords.
- Password reset workflow with OTP generation, verification, and password update.
- Profile completion APIs for Patients and Therapists, plus profile status checks.
- Frontend pages orchestrating flows for sign-in, registration, and password reset.
- Client-side session utilities for expiration checks and browser events.

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L7-L47)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L11-L101)
- [route.ts](file://WEBAPP/src/app/api/auth/reset-password/route.ts#L6-L41)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts#L5-L54)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L5-L52)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L5-L73)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L5-L92)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L9-L256)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L9-L265)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L11-L274)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L9-L118)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L3-L76)

## Architecture Overview
The system uses NextAuth with a JWT strategy and Prisma adapter. Providers include Google OAuth and email/password credentials. Role and profile completion status are stored in the JWT and session. Frontend pages integrate with NextAuth client hooks and call backend APIs for registration and password reset.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Frontend Page"
participant NA as "NextAuth Server"
participant PR as "Prisma Adapter"
participant DB as "Database"
U->>FE : "Submit sign-in (email/password)"
FE->>NA : "signIn('credentials', {email, password, role})"
NA->>PR : "Find user by email and role"
PR->>DB : "SELECT user"
DB-->>PR : "User record"
PR-->>NA : "User"
NA->>NA : "Compare password"
NA-->>FE : "Session/JWT with role and profile flags"
FE->>FE : "Redirect based on role and profile completion"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L69-L96)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L68-L89)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L20-L66)

## Detailed Component Analysis

### NextAuth Configuration and Providers
- Strategy: JWT with automatic expiration and refresh window.
- Cookies: HttpOnly, SameSite lax, path "/", secure only on HTTPS, with explicit names and options.
- Providers:
  - Google OAuth: Consent prompt, offline access, code response type.
  - Credentials: Validates email/password and role, bans banned users, adds role/id/isProfileComplete to JWT/session.
- Callbacks:
  - signIn: For Google, links or creates user, defaults to patient role, marks profile incomplete.
  - jwt: Adds role/id/isProfileComplete; validates token expiration server-side.
  - session: Augments session with role/id/profile flags.
- Events: Logs sign-in, session access (dev), and sign-out for monitoring.

```mermaid
flowchart TD
Start(["NextAuth Init"]) --> Providers["Configure Providers<br/>Google + Credentials"]
Providers --> Cookies["Set Cookie Options<br/>HttpOnly, SameSite, Path, Secure"]
Providers --> Strategy["Session Strategy: JWT<br/>MaxAge, UpdateAge"]
Strategy --> Callbacks["Callbacks:<br/>signIn -> Google linking/creation<br/>jwt -> add role/id/profile<br/>session -> attach role/id/profile"]
Callbacks --> Events["Events:<br/>signOut, session, signIn"]
Events --> End(["Ready"])
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L8-L237)

### User Registration
- Endpoint: POST /api/auth/register
- Validation: Zod schema enforces email, password length, and role enum.
- Behavior: Checks for existing user by email+role, hashes password, creates user, returns success.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Register Page"
participant API as "POST /api/auth/register"
participant DB as "Database"
U->>FE : "Fill form and submit"
FE->>API : "JSON {email, password, role}"
API->>DB : "Upsert user (unique by email+role)"
DB-->>API : "Created user"
API-->>FE : "{message : 'User registered'}"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L7-L47)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L24-L76)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L7-L47)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L24-L76)

### Password Reset Workflow (OTP-based)
- Step 1: POST /api/auth/forgot-password generates a 6-digit OTP, marks previous OTPs as used, stores new OTP with expiry, sends email.
- Step 2: POST /api/auth/verify-otp validates OTP by userId, otp, not used, and not expired.
- Step 3: POST /api/auth/reset-password hashes new password and updates user.
- Frontend: Multi-step wizard guiding user through email → OTP → reset → auto sign-in.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Forgot Password Page"
participant API1 as "POST /api/auth/forgot-password"
participant API2 as "POST /api/auth/verify-otp"
participant API3 as "POST /api/auth/reset-password"
U->>FE : "Enter email + role"
FE->>API1 : "Request OTP"
API1-->>FE : "{userId, message}"
U->>FE : "Enter 6-digit OTP"
FE->>API2 : "Verify OTP"
API2-->>FE : "{verified : true}"
U->>FE : "New password + confirm"
FE->>API3 : "Reset password"
API3-->>FE : "{message : 'Password reset successfully'}"
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L11-L101)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts#L5-L54)
- [route.ts](file://WEBAPP/src/app/api/auth/reset-password/route.ts#L6-L41)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L25-L120)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L11-L101)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts#L5-L54)
- [route.ts](file://WEBAPP/src/app/api/auth/reset-password/route.ts#L6-L41)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L25-L120)

### Profile Completion and Verification
- Patient profile completion: Upserts patient details and sets user name and isProfileComplete.
- Therapist profile completion: Upserts therapist profile with verification fields; sets user name and image, marks profile incomplete until admin approval.
- Profile status check: Returns isProfileComplete, role, ban status, and therapist verification fields.

```mermaid
flowchart TD
A["POST /api/auth/check-profile"] --> B{"User exists?"}
B --> |No| E["Return 404"]
B --> |Yes| C["Return {isProfileComplete, role, isBanned,<br/>therapistVerification}"]
D1["POST /api/auth/complete-profile/patient"] --> F{"User is patient?"}
F --> |No| G["Return 404"]
F --> |Yes| H["Upsert patient details<br/>Update user name + isProfileComplete"]
D2["POST /api/auth/complete-profile/therapist"] --> I{"User is therapist?"}
I --> |No| J["Return 404"]
I --> |Yes| K["Upsert therapist profile<br/>Update user name + image + isProfileComplete"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L5-L52)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L5-L73)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L5-L92)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L5-L52)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/patient/route.ts#L5-L73)
- [route.ts](file://WEBAPP/src/app/api/auth/complete-profile/therapist/route.ts#L5-L92)

### Frontend Authentication Pages
- Sign-in page: Collects email, password, role; triggers NextAuth credentials sign-in; checks profile completion and redirects to appropriate dashboard or verification page.
- Registration page: Validates passwords, calls registration API, auto-signs in, and redirects to profile completion.
- Forgot password page: Multi-step wizard for OTP-based reset; auto-signs in after reset.
- Verification pending page: Polls profile status and handles approval/rejection.

```mermaid
sequenceDiagram
participant U as "User"
participant SI as "Sign-in Page"
participant NA as "NextAuth"
participant API as "Check Profile API"
U->>SI : "Submit credentials"
SI->>NA : "signIn('credentials')"
NA-->>SI : "Session/JWT"
SI->>API : "POST check-profile"
API-->>SI : "{isProfileComplete, role, isBanned, therapistVerification}"
SI-->>U : "Redirect to dashboard or verification"
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L20-L66)
- [route.ts](file://WEBAPP/src/app/api/auth/check-profile/route.ts#L5-L52)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L20-L66)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L24-L76)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L25-L120)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L15-L52)

### Session Management and Token Handling
- Session strategy: JWT with 30-day max age and 24-hour update window.
- Cookie configuration: HttpOnly, SameSite lax, path "/", secure only on HTTPS.
- Client utilities:
  - Detects impending expiration and displays remaining time.
  - Incognito mode detection via storage estimate.
  - Event listeners for storage changes, beforeunload, and focus to validate session.

```mermaid
flowchart TD
S(["Client SessionManager"]) --> T1["isSessionExpiringSoon()"]
S --> T2["getSessionTimeRemaining()"]
S --> T3["isIncognitoMode()"]
S --> L1["setupSessionHandlers()<br/>storage, beforeunload, focus"]
L1 --> V["GET /api/auth/session<br/>validate on focus"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L10-L48)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L3-L76)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L10-L48)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L3-L76)

### Role-Based Access Control
- Roles: patient, therapist.
- Role propagation: Added to JWT and session via callbacks; frontend pages redirect based on role.
- Verification gating: Therapists are redirected to a verification-pending page until admin approval.

```mermaid
flowchart TD
R["Role in JWT/Session"] --> P1["Patient Dashboard"]
R --> P2["Therapist Dashboard"]
R --> V["Verification Pending Page"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L174-L213)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L59-L65)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L33-L44)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L174-L213)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L59-L65)
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L33-L44)

### Logout Mechanisms
- Frontend logout: Uses NextAuth client signOut with optional callbackUrl to root.
- Backend events: NextAuth logs sign-out events for monitoring.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Verification Pending Page"
participant NA as "NextAuth Client"
U->>FE : "Click Sign Out"
FE->>NA : "signOut({callbackUrl : '/'})"
NA-->>FE : "Redirect to home"
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L107-L112)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L215-L233)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/auth/verification-pending/page.tsx#L107-L112)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L215-L233)

## Dependency Analysis
- NextAuth depends on Prisma adapter and bcrypt for password comparison.
- Frontend pages depend on NextAuth client hooks and local API routes.
- Client session utilities depend on browser APIs for storage and visibility.

```mermaid
graph LR
NA["NextAuth Config"] --> PR["Prisma Adapter"]
NA --> BC["bcryptjs"]
SI["Sign-in Page"] --> NA
RG["Register Page"] --> REG["Register API"]
FR["Forgot Password Page"] --> FP["Forgot Password API"]
FR --> VO["Verify OTP API"]
FR --> RP["Reset Password API"]
SI --> CP["Check Profile API"]
SI --> CPP["Complete Profile (Patient) API"]
SI --> CPT["Complete Profile (Therapist) API"]
SI --> VP["Verification Pending Page"]
SI --> SM["SessionManager"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L6)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L1-L14)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L1-L15)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L1-L18)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L4)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L1-L6)
- [page.tsx](file://WEBAPP/src/app/auth/signin/page.tsx#L1-L14)
- [page.tsx](file://WEBAPP/src/app/auth/register/page.tsx#L1-L15)
- [page.tsx](file://WEBAPP/src/app/auth/forgot-password/page.tsx#L1-L18)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L1-L4)

## Performance Considerations
- JWT strategy reduces database reads for protected routes; ensure token size remains minimal by avoiding large claims.
- Session cookie options balance security and cross-origin compatibility; adjust secure flag per deployment environment.
- OTP expiry is short-lived to reduce risk; ensure email delivery latency does not exceed 10 minutes.
- Client-side session polling on focus is lightweight; avoid excessive polling intervals.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- NextAuth callbacks:
  - signIn: Ensure Google linking handles existing users and banned users correctly.
  - jwt/session: Verify role/id/profile flags are present; check token expiration server-side.
- Registration:
  - Validate Zod schema failures and conflict responses.
- Password reset:
  - Confirm OTP invalidation and uniqueness; verify email delivery and OTP expiry.
- Profile completion:
  - Check role-specific validations and upsert behavior.
- Session handling:
  - Use SessionManager helpers to detect incognito mode and handle storage events.

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L99-L233)
- [route.ts](file://WEBAPP/src/app/api/auth/register/route.ts#L15-L18)
- [route.ts](file://WEBAPP/src/app/api/auth/forgot-password/route.ts#L19-L25)
- [route.ts](file://WEBAPP/src/app/api/auth/verify-otp/route.ts#L13-L19)
- [sessionManager.ts](file://WEBAPP/src/lib/sessionManager.ts#L29-L76)

## HIPAA and Security Considerations
- Protected health information (PHI) handling:
  - Limit collection to what is necessary for therapy sessions and scheduling.
  - Ensure encryption at rest and in transit; enforce HTTPS in production.
  - Implement audit logging for access and modifications (NextAuth events can be extended).
- Authentication security:
  - Enforce strong password policies and rate limiting at the network level.
  - Use short-lived tokens with refresh windows; invalidate sessions on logout.
  - Sanitize and validate all inputs; use schema validation libraries.
- Privacy controls:
  - Provide users with access to their data and deletion requests.
  - Minimize data retention; implement automated cleanup policies.
- Compliance readiness:
  - Document data flows and security measures.
  - Regularly review provider configurations and cookie settings for secure defaults.

[No sources needed since this section provides general guidance]

## Conclusion
The MindBridge authentication system integrates NextAuth with JWT, supports multiple providers, and implements robust role-based access control. It provides secure registration, password reset via OTP, and profile completion flows tailored for Patients and Therapists. Client-side session utilities enhance user experience while maintaining security. For healthcare environments, additional safeguards and documentation should be implemented to meet regulatory requirements.