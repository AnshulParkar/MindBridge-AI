# Admin Panel

<cite>
**Referenced Files in This Document**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts)
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [db.ts](file://WEBAPP/src/lib/db.ts)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts)
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts)
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
This document describes the administrative panel system for MindBridge. It covers the admin dashboard, analytics, user and therapist management, administrative workflows, system monitoring, and security considerations. The admin panel provides:
- A dashboard with system overview and key metrics
- Therapist verification workflows
- User management (banning, unbanning, deletion)
- Analytics reporting and system health monitoring
- Security controls for admin access and audit logging

## Project Structure
The admin functionality spans frontend pages, backend API routes, and the Prisma data model:
- Admin UI: Next.js app pages under admin/
- Admin APIs: Next.js API routes under api/admin/*
- Data model: Prisma schema defines AdminUser, User, TherapistProfile, and related entities
- Analytics: Shared mental health analytics utilities and components

```mermaid
graph TB
subgraph "Admin Frontend"
AUI["Admin Dashboard Page<br/>page.tsx"]
ALP["Admin Login Page<br/>page.tsx"]
end
subgraph "Admin Backend"
ALogin["Login API<br/>api/admin/login/route.ts"]
AAnalytics["Analytics API<br/>api/admin/analytics/route.ts"]
ATherapists["Therapists API<br/>api/admin/therapists/route.ts"]
AUsers["Users API<br/>api/admin/users/route.ts"]
end
subgraph "Data Layer"
PRISMA["Prisma Schema<br/>schema.prisma"]
DB["Database Client<br/>db.ts"]
end
subgraph "Analytics"
MHComp["Mental Health Dashboard Component<br/>MentalHealthDashboard.tsx"]
MHLib["Analytics Library<br/>mentalHealthAnalytics.ts"]
end
AUI --> AAnalytics
AUI --> ATherapists
AUI --> AUsers
ALP --> ALogin
ALogin --> DB
AAnalytics --> DB
ATherapists --> DB
AUsers --> DB
DB --> PRISMA
MHComp --> MHLib
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L61-L176)
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx#L5-L83)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts#L9-L74)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L21-L92)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L20-L107)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx#L47-L541)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L61-L176)
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx#L5-L83)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts#L9-L74)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L21-L92)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L20-L107)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx#L47-L541)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

## Core Components
- Admin Dashboard (page.tsx): Renders overview statistics, manages therapist verification, and manages users. Handles admin auth via local storage and Bearer tokens.
- Admin Login (page.tsx + route.ts): Provides admin login UI and validates credentials against AdminUser records, issuing a JWT.
- Analytics API (route.ts): Computes system-wide metrics, including totals, activity, verification status, and daily registrations.
- Therapists API (route.ts): Lists therapists filtered by verification status and updates approval/rejection with optional rejection reason.
- Users API (route.ts): Lists users by role and search term, and performs ban/unban/delete operations.
- Data Model (schema.prisma): Defines AdminUser, User, TherapistProfile, and related entities.
- Analytics Utilities (MentalHealthDashboard.tsx + mentalHealthAnalytics.ts): Provides advanced analytics dashboards and analysis functions used elsewhere in the platform.

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L61-L176)
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx#L5-L83)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L21-L92)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L20-L107)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx#L47-L541)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

## Architecture Overview
The admin panel follows a client-server pattern:
- Client: Next.js app pages manage UI state, fetch data, and submit actions.
- Server: Next.js API routes validate admin JWT, query Prisma, and return structured data.
- Data: Prisma ORM connects to MySQL and exposes typed queries.

```mermaid
sequenceDiagram
participant Browser as "Admin Browser"
participant UI as "Admin Dashboard UI<br/>page.tsx"
participant API as "Admin API Routes"
participant Auth as "JWT Validation"
participant DB as "Prisma Client<br/>db.ts"
Browser->>UI : Load /admin/dashboard
UI->>UI : Read admin_token from localStorage
UI->>API : GET /api/admin/analytics (Authorization : Bearer)
API->>Auth : verify(token)
Auth-->>API : {role : "admin"}
API->>DB : Query counts, groupBy, etc.
DB-->>API : Metrics data
API-->>UI : {overview, appointmentStats, dailyRegistrations}
Browser->>UI : Click "Verify Therapists"
UI->>API : GET /api/admin/therapists?status=pending (Authorization)
API->>DB : Find therapist profiles by status
DB-->>API : Therapist list
API-->>UI : {therapists}
Browser->>UI : Approve/Reject therapist
UI->>API : PUT /api/admin/therapists (Authorization, {action, reason})
API->>DB : Update verificationStatus/isVerified/rejectionReason
DB-->>API : OK
API-->>UI : Success response
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L92-L131)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L52-L92)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

## Detailed Component Analysis

### Admin Dashboard
Responsibilities:
- Render overview statistics and appointment status breakdown
- Filter and approve/reject therapists
- Search and manage users (ban/unban/delete)
- Logout and token lifecycle

Key behaviors:
- On mount, reads admin_token from localStorage; redirects to login if missing
- Fetches analytics, therapists, and users concurrently
- Submits actions with Authorization header containing Bearer token
- Supports rejection reason capture for rejected therapists

```mermaid
flowchart TD
Start(["Load Dashboard"]) --> CheckToken["Check admin_token in localStorage"]
CheckToken --> HasToken{"Token present?"}
HasToken --> |No| Redirect["Redirect to /admin login"]
HasToken --> |Yes| FetchAll["Fetch analytics + therapists + users"]
FetchAll --> Render["Render Overview + Tabs"]
Render --> Tab{"Selected Tab"}
Tab --> |Overview| Overview["Show stats grid + appointment status"]
Tab --> |Verify Therapists| Therapists["Filter by status + approve/reject"]
Tab --> |Manage Users| Users["Filter by role + search + ban/unban/delete"]
Therapists --> Action{"Approve/Reject?"}
Action --> |Approve| PutApprove["PUT /api/admin/therapists {action:'approve'}"]
Action --> |Reject| Reason["Open rejection modal"] --> PutReject["PUT /api/admin/therapists {action:'reject', reason}"]
Users --> UserAction{"Ban/Unban/Delete?"}
UserAction --> PutUser["PUT /api/admin/users {action}"]
PutApprove --> Refresh["Refetch therapists + analytics"]
PutReject --> Refresh
PutUser --> Refresh
Refresh --> Render
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L76-L168)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L61-L176)
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L133-L168)

### Admin Login
Responsibilities:
- Validate adminId and password against AdminUser
- Seed default admin credentials if applicable
- Issue JWT with role=admin and expiration

```mermaid
sequenceDiagram
participant Browser as "Admin Browser"
participant LoginPage as "Admin Login Page<br/>page.tsx"
participant API as "Login API<br/>api/admin/login/route.ts"
participant DB as "Prisma Client<br/>db.ts"
Browser->>LoginPage : Submit adminId + password
LoginPage->>API : POST /api/admin/login
API->>DB : Find AdminUser by adminId
DB-->>API : AdminUser or null
API->>API : Hash compare (seed default if needed)
API-->>LoginPage : {token} or error
LoginPage->>Browser : Store admin_token + redirect
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx#L15-L37)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts#L9-L74)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/page.tsx#L5-L83)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts#L9-L74)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)

### Analytics Reporting
Responsibilities:
- Aggregate system metrics: totals, active users, pending verifications, banned users, recent registrations
- Group appointment statuses and compute daily registrations for charts

```mermaid
sequenceDiagram
participant UI as "Admin Dashboard<br/>page.tsx"
participant API as "Analytics API<br/>api/admin/analytics/route.ts"
participant DB as "Prisma Client<br/>db.ts"
UI->>API : GET /api/admin/analytics (Authorization)
API->>DB : Count users (patient/therapist), sessions, appointments
API->>DB : Count active users (chat sessions updated within 7 days)
API->>DB : Count pending verifications
API->>DB : Count banned users
API->>DB : Count new registrations (last 30 days)
API->>DB : Group appointments by status
API->>DB : Group daily registrations by createdAt
DB-->>API : Aggregated metrics
API-->>UI : {overview, appointmentStats, dailyRegistrations}
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)

### Therapist Oversight Tools
Responsibilities:
- List therapists filtered by verification status
- Approve or reject with optional rejection reason
- Persist verification status and rejection reason

```mermaid
sequenceDiagram
participant UI as "Admin Dashboard<br/>page.tsx"
participant API as "Therapists API<br/>api/admin/therapists/route.ts"
participant DB as "Prisma Client<br/>db.ts"
UI->>API : GET /api/admin/therapists?status={pending|approved|rejected}
API->>DB : FindMany TherapistProfile with include user
DB-->>API : Therapists[]
API-->>UI : {therapists}
UI->>API : PUT /api/admin/therapists {action, therapistProfileId, rejectionReason?}
API->>DB : Update verificationStatus/isVerified/rejectionReason
DB-->>API : OK
API-->>UI : Success
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L21-L92)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L21-L92)

### User Management
Responsibilities:
- Filter users by role and search by name/email
- Ban/unban or delete users
- Reflect changes in analytics

```mermaid
sequenceDiagram
participant UI as "Admin Dashboard<br/>page.tsx"
participant API as "Users API<br/>api/admin/users/route.ts"
participant DB as "Prisma Client<br/>db.ts"
UI->>API : GET /api/admin/users?role=&search=
API->>DB : FindMany User with select + where clause
DB-->>API : Users[]
API-->>UI : {users}
UI->>API : PUT /api/admin/users {action : ban|unban|delete, userId}
API->>DB : Update or Delete User
DB-->>API : OK
API-->>UI : Success
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L19-L107)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L19-L107)

### System Monitoring and Audit Trail
- NextAuth events log sign-in, sign-out, and session access (development) for monitoring.
- Admin analytics endpoint returns counts and groupings suitable for dashboards and alerts.

```mermaid
flowchart TD
Events["NextAuth Events"] --> SignIn["signIn logs user email + timestamp"]
Events --> SignOut["signOut logs session end + user"]
Events --> Session["session logs access + timestamp (dev)"]
UI["Admin Dashboard"] --> Analytics["GET /api/admin/analytics"]
Analytics --> Counts["Totals, active users, verifications, bans, registrations"]
Counts --> Dash["Overview Cards + Charts"]
```

**Diagram sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L215-L233)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)

**Section sources**
- [route.ts](file://WEBAPP/src/app/api/auth/[...nextauth]/route.ts#L215-L233)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L20-L108)

## Dependency Analysis
- Admin UI depends on:
  - Admin API routes for data and actions
  - Local storage for admin_token
- Admin API routes depend on:
  - JWT verification for admin role
  - Prisma client for database queries
- Prisma schema defines AdminUser and related entities used by APIs
- Mental health analytics components and libraries are shared across the platform and complement admin reporting

```mermaid
graph LR
UI["Admin UI<br/>page.tsx"] --> APIA["Analytics API<br/>route.ts"]
UI --> APIT["Therapists API<br/>route.ts"]
UI --> APIU["Users API<br/>route.ts"]
APIA --> AUTH["JWT Verify"]
APIT --> AUTH
APIU --> AUTH
AUTH --> DB["Prisma Client<br/>db.ts"]
DB --> SCHEMA["Prisma Schema<br/>schema.prisma"]
MHComp["MentalHealthDashboard.tsx"] --> MHLib["mentalHealthAnalytics.ts"]
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L86-L131)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L7-L17)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L8-L18)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L7-L17)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx#L47-L541)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L86-L131)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L7-L17)
- [route.ts](file://WEBAPP/src/app/api/admin/therapists/route.ts#L8-L18)
- [route.ts](file://WEBAPP/src/app/api/admin/users/route.ts#L7-L17)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [MentalHealthDashboard.tsx](file://WEBAPP/src/components/analytics/MentalHealthDashboard.tsx#L47-L541)
- [mentalHealthAnalytics.ts](file://WEBAPP/src/lib/mentalHealthAnalytics.ts#L199-L289)

## Performance Considerations
- Concurrent data fetching: The dashboard fetches analytics, therapists, and users in parallel to reduce load time.
- Efficient database queries: GroupBy and count operations minimize payload sizes.
- Client-side caching: admin_token is reused across requests; consider adding request deduplication if needed.
- Recommendations:
  - Paginate user and therapist lists for large datasets.
  - Add server-side filtering and sorting for analytics exports.
  - Implement rate limiting on admin endpoints to prevent abuse.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Unauthorized access:
  - Symptom: 401 responses from admin APIs
  - Cause: Missing or invalid admin_token
  - Resolution: Re-login via admin panel; ensure token is stored in localStorage
- Token expiration:
  - Symptom: Subsequent requests fail after token expiry
  - Cause: JWT has 8-hour TTL
  - Resolution: Re-authenticate to obtain a new token
- Database connectivity:
  - Symptom: 500 errors from admin APIs
  - Cause: Prisma client or database unreachable
  - Resolution: Check DATABASE_URL and service health
- Missing admin credentials:
  - Symptom: Login fails for default adminId
  - Cause: Admin account seeded only for adminId "123456"
  - Resolution: Use seeded credentials or contact system administrator

**Section sources**
- [page.tsx](file://WEBAPP/src/app/admin/dashboard/page.tsx#L92-L100)
- [route.ts](file://WEBAPP/src/app/api/admin/analytics/route.ts#L21-L23)
- [route.ts](file://WEBAPP/src/app/api/admin/login/route.ts#L43-L57)
- [db.ts](file://WEBAPP/src/lib/db.ts#L6-L12)

## Conclusion
The admin panel provides a secure, efficient interface for monitoring and managing the MindBridge platform. It leverages JWT-based admin authentication, robust API endpoints, and a clear separation of concerns between UI, API, and data layers. Extending the system with pagination, export capabilities, and enhanced audit logs will further strengthen operational oversight.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Data Model Overview (Admin and Related Entities)
```mermaid
erDiagram
ADMINUSER {
string id PK
string adminId UK
string password
datetime createdAt
}
USER {
string id PK
string name
string email UK
string role
boolean isBanned
boolean isProfileComplete
datetime createdAt
}
THERAPISTPROFILE {
string id PK
string userId FK
string fullName
string verificationStatus
boolean isVerified
string rejectionReason
datetime createdAt
}
ADMINUSER ||--o{ USER : "manages"
USER ||--|| THERAPISTPROFILE : "has profile"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L323-L330)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L39-L69)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L299-L321)