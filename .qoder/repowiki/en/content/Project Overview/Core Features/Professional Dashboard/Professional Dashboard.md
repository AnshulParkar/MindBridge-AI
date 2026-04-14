# Professional Dashboard

<cite>
**Referenced Files in This Document**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts)
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
This document describes the therapist professional dashboard, focusing on patient management, schedule and availability control, appointment confirmation workflows, and session analytics. It also covers therapist-specific features such as patient tracking, session history review, progress monitoring tools, dashboard navigation, data visualization components, administrative controls, integration with the appointment scheduling system, Google Calendar sync, automated reminders, and therapist onboarding and verification workflows.

## Project Structure
The therapist dashboard is implemented as a Next.js app with TypeScript. The frontend pages are located under WEBAPP/src/app/therapist, while backend API routes are under WEBAPP/src/app/api/therapy. Shared utilities for Google Calendar integration live under WEBAPP/src/lib.

```mermaid
graph TB
subgraph "Frontend"
D["Dashboard Page<br/>dashboard/page.tsx"]
S["Schedule Page<br/>schedule/page.tsx"]
end
subgraph "API Routes"
APT["GET/POST Appointments<br/>api/therapy/appointments/route.ts"]
PAT["GET Patients<br/>api/therapy/patients/route.ts"]
SES["GET/POST Sessions<br/>api/therapy/sessions/route.ts"]
AV["GET/POST/DELETE Availability<br/>api/therapy/availability/route.ts"]
end
subgraph "Libraries"
GC["Google Calendar Utility<br/>lib/googleCalendar.ts"]
end
D --> PAT
D --> SES
D --> APT
S --> APT
S --> AV
APT --> GC
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L68-L171)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L74-L144)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L6-L36)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L55)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L6-L94)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L68-L171)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L74-L144)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L6-L36)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L55)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L6-L94)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

## Core Components
- Dashboard overview with statistics cards, today’s schedule, and quick actions.
- Patient management tab displaying patient profiles, session counts, last session, dominant emotion, and trend indicators.
- Session history tab showing session details, durations, message counts, dominant emotion, and status badges.
- Schedule management with appointment listing, filtering, confirmation/cancellation/completion actions, calendar view, and availability slot management.
- Availability management supporting single and bulk slot creation, toggling active/inactive, and deletion.
- Google Calendar integration for creating, updating, and deleting events with automated reminders.

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L472-L640)
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L642-L772)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L447-L625)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L627-L800)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L96-L180)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

## Architecture Overview
The dashboard integrates frontend UI components with backend API routes. Data flows from Prisma-backed API endpoints to the dashboard pages, which render statistics, lists, and interactive controls. Availability and appointment operations are protected by session checks and role validation. Google Calendar synchronization is performed after successful appointment creation.

```mermaid
sequenceDiagram
participant T as "Therapist UI"
participant D as "Dashboard Page"
participant API as "API Routes"
participant DB as "Prisma/DB"
participant GC as "Google Calendar"
T->>D : "Load dashboard"
D->>API : "GET /api/therapy/patients?therapistId=..."
API->>DB : "Fetch patients with stats"
DB-->>API : "Patient list"
API-->>D : "JSON patients"
D->>API : "GET /api/therapy/sessions?therapistId=..."
API->>DB : "Fetch sessions"
DB-->>API : "Sessions"
API-->>D : "JSON sessions"
D->>API : "GET /api/therapy/appointments?therapistId=..."
API->>DB : "Fetch appointments"
DB-->>API : "Appointments"
API-->>D : "JSON appointments"
T->>API : "POST /api/therapy/appointments"
API->>DB : "Create appointment (transaction)"
DB-->>API : "Created appointment"
API->>GC : "createCalendarEvent(...)"
GC-->>API : "Event ID"
API-->>T : "201 Created"
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L96-L111)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L19-L53)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L24-L35)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L38-L163)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

## Detailed Component Analysis

### Dashboard Overview and Navigation
- Role gating ensures only therapists can access the dashboard.
- Real-time data is fetched from three API endpoints: patients, sessions, and appointments.
- Statistics computed client-side include total patients, total sessions, average session duration, weekly appointments, and active patients.
- Navigation includes desktop and mobile menus linking to analytics, schedule, peer support, and sign out.

```mermaid
flowchart TD
Start(["Dashboard Load"]) --> CheckRole["Verify session and role"]
CheckRole --> |Invalid| Redirect["Redirect to sign-in"]
CheckRole --> |Valid| FetchData["Fetch patients/sessions/appointments"]
FetchData --> ComputeStats["Compute dashboard stats"]
ComputeStats --> RenderUI["Render overview, schedule, quick actions"]
RenderUI --> End(["Ready"])
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L69-L77)
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L96-L171)

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L68-L171)
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L414-L456)

### Patient Management
- Lists all patients associated with the therapist, including total sessions, last session, dominant emotion, and improvement trend.
- Provides quick actions to view analytics and schedule sessions.
- Emotion and trend indicators are rendered with emoji and icons.

```mermaid
flowchart TD
PMStart(["Patients Tab"]) --> FetchPatients["GET /api/therapy/patients"]
FetchPatients --> MapStats["Map to UI model"]
MapStats --> RenderList["Render patient cards"]
RenderList --> Actions["View analytics / Schedule session"]
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L642-L695)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L19-L53)

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L642-L695)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L60)

### Session History Review
- Displays therapy sessions with patient name, start time, duration, message count, dominant emotion, and status.
- Supports downloading session reports and viewing details.

```mermaid
sequenceDiagram
participant U as "User"
participant D as "Dashboard"
participant API as "Sessions API"
participant DB as "Prisma"
U->>D : "Open Sessions tab"
D->>API : "GET /api/therapy/sessions?therapistId=..."
API->>DB : "Find sessions"
DB-->>API : "Sessions"
API-->>D : "JSON sessions"
D-->>U : "Render session list"
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L697-L772)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L697-L772)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)

### Schedule and Availability Control
- Appointment listing with filtering by search term and status, plus confirmation/cancellation/completion actions.
- Calendar view allows selecting a date to see appointments.
- Availability management supports adding single or bulk slots, toggling activation, and deleting slots.

```mermaid
flowchart TD
SMStart(["Schedule Page"]) --> FetchApps["GET /api/therapy/appointments"]
SMStart --> FetchAvails["GET /api/therapy/availability"]
FetchApps --> RenderApps["Render appointments"]
FetchAvails --> RenderAvails["Render availability"]
RenderApps --> Actions["Confirm/Cancel/Complete"]
RenderAvails --> ManageSlots["Add/Edit/Delete slots"]
```

**Diagram sources**
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L105-L144)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L119-L133)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L185-L191)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L96-L180)

**Section sources**
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L74-L144)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L185-L242)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L322-L350)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L96-L180)

### Appointment Confirmation Workflows
- Pending appointments can be confirmed or cancelled; confirmed appointments can be marked completed.
- Updates are applied client-side immediately upon success, ensuring responsive UI feedback.

```mermaid
sequenceDiagram
participant U as "User"
participant S as "Schedule Page"
participant API as "Appointments API"
participant DB as "Prisma"
U->>S : "Click Confirm/Cancel/Complete"
S->>API : "PATCH /api/therapy/appointments/ : id"
API->>DB : "Update status"
DB-->>API : "Updated appointment"
API-->>S : "JSON status"
S-->>U : "UI reflects new status"
```

**Diagram sources**
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L193-L242)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L38-L180)

**Section sources**
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L193-L242)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L38-L180)

### Google Calendar Sync and Automated Reminders
- On successful appointment creation, the system attempts to create a Google Calendar event with reminders and a Meet link.
- Events can be updated or deleted as needed.

```mermaid
sequenceDiagram
participant A as "Appointments API"
participant C as "Google Calendar Utility"
participant G as "Google Calendar API"
A->>C : "createCalendarEvent(params)"
C->>G : "POST /events with reminders"
G-->>C : "Event created"
C-->>A : "Event ID"
A-->>A : "Attach calendarEventId to appointment"
```

**Diagram sources**
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L144-L161)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

**Section sources**
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L144-L161)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

### Progress Monitoring Tools
- Patient analytics are derived from aggregated session data and stored in patient profiles.
- The dashboard surfaces dominant emotion and improvement trend per patient.

```mermaid
flowchart TD
PStart(["Patients API"]) --> GetSessions["Get therapy sessions for therapist"]
GetSessions --> DistinctPatients["Distinct patient IDs"]
DistinctPatients --> ProfileStats["Compute totals, last session, dominant emotion, trend"]
ProfileStats --> Return["Return enriched patient list"]
```

**Diagram sources**
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L19-L53)

**Section sources**
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L60)

### Administrative Controls Available to Therapists
- Role-based access control ensures only therapists can manage availability and create appointments.
- Bulk availability creation streamlines setting up standard business hours.
- Slot deactivation via soft delete maintains auditability.

**Section sources**
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L96-L180)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L182-L216)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L96-L120)

## Dependency Analysis
The dashboard components depend on:
- API routes for data retrieval and mutations.
- Google Calendar utility for external calendar synchronization.
- Prisma for database operations.

```mermaid
graph LR
D["Dashboard Page"] --> PAT_API["Patients API"]
D --> SES_API["Sessions API"]
D --> APT_API["Appointments API"]
S["Schedule Page"] --> APT_API
S --> AV_API["Availability API"]
APT_API --> GC["Google Calendar Utility"]
PAT_API --> PRISMA["Prisma"]
SES_API --> PRISMA
APT_API --> PRISMA
AV_API --> PRISMA
```

**Diagram sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L96-L111)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L105-L133)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L55)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L6-L36)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L6-L94)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L96-L111)
- [schedule/page.tsx](file://WEBAPP/src/app/therapist/schedule/page.tsx#L105-L133)
- [patients/route.ts](file://WEBAPP/src/app/api/therapy/patients/route.ts#L5-L55)
- [sessions/route.ts](file://WEBAPP/src/app/api/therapy/sessions/route.ts#L5-L42)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L6-L36)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L6-L94)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)

## Performance Considerations
- Client-side polling for appointments is implemented with a 30-second interval; consider debouncing or reducing frequency if traffic increases.
- Filtering and sorting on the client reduce server load but may impact responsiveness with very large datasets—consider server-side pagination and filtering.
- Batch operations for availability (bulk creation) improve UX and reduce API round trips.

## Troubleshooting Guide
- Unauthorized access: Ensure the session includes a valid therapist role; otherwise, the UI redirects to sign-in.
- Appointment conflicts: Creation fails if time overlaps with existing appointments; adjust timing or cancel conflicting bookings.
- Slot not found or already booked: When booking via a slot, ensure the slot exists, is active, and not already reserved for the selected date.
- Google Calendar sync failures: Verify environment variables and token refresh; errors are logged and do not block appointment creation.

**Section sources**
- [dashboard/page.tsx](file://WEBAPP/src/app/therapist/dashboard/page.tsx#L69-L77)
- [appointments/route.ts](file://WEBAPP/src/app/api/therapy/appointments/route.ts#L164-L179)
- [availability/route.ts](file://WEBAPP/src/app/api/therapy/availability/route.ts#L142-L161)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L68-L100)

## Conclusion
The therapist professional dashboard provides a comprehensive toolkit for managing patients, sessions, and schedules, with integrated analytics and Google Calendar synchronization. Its modular design leverages Next.js app routing and API handlers to deliver a responsive, role-aware experience suitable for clinical workflows.