# Appointment Scheduling System

<cite>
**Referenced Files in This Document**
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts)
- [email.ts](file://WEBAPP/src/lib/email.ts)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx)
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
This document describes the appointment scheduling system for MindBridge, focusing on therapist availability management, patient booking workflows, calendar integration with Google Calendar, confirmation and cancellation processes, automated email notifications, and reminder systems. It also covers availability slot creation, conflict detection, resource management, integration patterns with external calendar services, timezone handling, recurring appointment support, scheduling policies, waitlist management, and rescheduling procedures.

## Project Structure
The scheduling system spans frontend React components, backend API routes (not shown here but referenced), and a Prisma schema that defines the data model. Key areas include:
- Frontend patient booking UI and state management
- Backend API endpoints for appointments and availability
- Prisma models for appointments, availability, and users
- Utilities for Google Calendar integration and email notifications

```mermaid
graph TB
subgraph "Frontend"
UI["Patient Appointments UI<br/>page.tsx"]
end
subgraph "Backend"
API_Avail["/api/therapy/availability"]
API_App["/api/therapy/appointments"]
API_Checkout["/api/checkout"]
API_Verify["/api/checkout/verify"]
end
subgraph "Data Layer"
Prisma["Prisma Schema<br/>schema.prisma"]
end
subgraph "External Services"
GC["Google Calendar API"]
Email["SMTP Email Service"]
end
UI --> API_Avail
UI --> API_App
UI --> API_Checkout
UI --> API_Verify
API_App --> Prisma
API_Avail --> Prisma
API_Checkout --> Prisma
API_Verify --> Prisma
Prisma --> GC
Prisma --> Email
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L135-L177)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)
- [email.ts](file://WEBAPP/src/lib/email.ts#L27-L48)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L1-L120)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)

## Core Components
- Availability model: Defines therapist weekly or one-off availability slots with recurrence and active flags.
- Appointment model: Links patients and therapists to availability slots, tracks status, type, duration, and calendar event IDs.
- Google Calendar integration: Creates, updates, and deletes events with reminders and Meet links.
- Email notifications: Generates booking confirmation and reminder emails with localized date/time formatting.
- Frontend booking flow: Multi-step UI for selecting therapist, date, available slots, and payment.

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)
- [email.ts](file://WEBAPP/src/lib/email.ts#L136-L200)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L507-L800)

## Architecture Overview
The system follows a layered architecture:
- Presentation: Patient UI handles selection and booking.
- Application: API routes orchestrate persistence and external integrations.
- Persistence: Prisma models define entities and relationships.
- Integration: Google Calendar and SMTP services for calendar sync and email.

```mermaid
sequenceDiagram
participant P as "Patient UI"
participant A as "Checkout API"
participant C as "Stripe"
participant V as "Verify API"
participant DB as "Prisma"
P->>A : "Create Checkout Session"
A->>C : "Create Stripe Checkout Session"
C-->>A : "Checkout URL"
A-->>P : "Redirect URL"
P->>C : "Complete Payment"
P->>V : "Verify Payment"
V->>DB : "Update Appointment Status"
DB-->>V : "Persisted"
V-->>P : "Success"
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L90-L126)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L224-L258)

## Detailed Component Analysis

### Availability Management
- Data model: Weekly recurring slots with day-of-week and time range; optional specificDate for exceptions; isBooked and isActive flags.
- Recurrence: isRecurring toggles weekly repetition; specificDate supports one-off exceptions.
- Conflict detection: The UI filters out isBooked=true slots; backend should enforce uniqueness and overlap checks during creation.
- Active management: isActive allows therapists to temporarily disable slots.

```mermaid
erDiagram
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
boolean reminderSent
string calendarEventId
}
THERAPIST_AVAILABILITY ||--o{ APPOINTMENT : "references"
```

**Diagram sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)

**Section sources**
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L184)

### Patient Booking Workflow
- Multi-step UI:
  - Step 1: Select therapist, date, session type, and duration.
  - Step 2: Pick an available slot; slots auto-refresh every 15 seconds.
  - Step 3: Confirm details and pay via Stripe; payment success triggers verification and appointment confirmation.
- Real-time updates: Polling every 30 seconds for appointment lists; immediate refresh on slot selection.
- Payment flow: Creates a Stripe Checkout session and redirects; verifies after payment completion.

```mermaid
flowchart TD
Start(["Open Booking"]) --> Step1["Select Therapist + Date"]
Step1 --> Step2["Pick Available Slot"]
Step2 --> Step3["Confirm & Pay via Stripe"]
Step3 --> Verify["Verify Payment"]
Verify --> Update["Update Appointment Status"]
Update --> End(["Done"])
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L507-L800)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L90-L126)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L179-L208)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L210-L258)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L135-L177)

### Calendar Integration with Google Calendar
- Event creation: Builds event with start/end time and timezone, adds Meet link, sets reminders, and posts to primary calendar.
- Event deletion: Removes calendar events by ID.
- Event updates: Patches summary/description/timezone-aware start/end.
- Timezone handling: Uses local browser timezone for calendar events.

```mermaid
sequenceDiagram
participant App as "App"
participant GC as "Google Calendar API"
App->>GC : "POST /events with reminders and conferenceData"
GC-->>App : "Event ID"
App->>GC : "PATCH /events/{id} (optional)"
GC-->>App : "OK"
App->>GC : "DELETE /events/{id}"
GC-->>App : "OK"
```

**Diagram sources**
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L183-L225)

**Section sources**
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L54-L66)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L183-L225)

### Appointment Confirmation and Cancellation
- Confirmation: Email template for booking confirmation with date/time and duration.
- Cancellation: UI triggers PATCH to set status to cancelled; updates UI state immediately.
- Calendar sync: On confirmation/cancellation, create/update/delete calendar events via Google Calendar integration.

```mermaid
sequenceDiagram
participant UI as "Patient UI"
participant API as "Appointments API"
participant Mail as "Email Service"
participant Cal as "Google Calendar"
UI->>API : "PATCH {status : 'cancelled'}"
API->>Cal : "DELETE calendar event"
API->>Mail : "Send cancellation notice"
API-->>UI : "Updated status"
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L260-L279)
- [email.ts](file://WEBAPP/src/lib/email.ts#L136-L200)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L163-L181)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L260-L279)
- [email.ts](file://WEBAPP/src/lib/email.ts#L136-L200)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L163-L181)

### Automated Email Notifications and Reminders
- Templates: Booking confirmation and reminder emails with localized date/time and dynamic content.
- Triggering: Send confirmation upon payment verification; reminders can be scheduled prior to the session.
- Delivery: Nodemailer transport configured via environment variables.

```mermaid
flowchart TD
Conf["Payment Verified"] --> EmailConf["Generate Confirmation Email"]
EmailConf --> SendConf["Send via SMTP"]
Rem["Reminders Due"] --> GenRem["Generate Reminder Email"]
GenRem --> SendRem["Send via SMTP"]
```

**Diagram sources**
- [email.ts](file://WEBAPP/src/lib/email.ts#L136-L200)
- [email.ts](file://WEBAPP/src/lib/email.ts#L50-L134)

**Section sources**
- [email.ts](file://WEBAPP/src/lib/email.ts#L10-L18)
- [email.ts](file://WEBAPP/src/lib/email.ts#L136-L200)
- [email.ts](file://WEBAPP/src/lib/email.ts#L50-L134)

### Resource Management and Business Rules
- Scheduling policies:
  - Minimum booking horizon: UI enforces minimum date selection.
  - Session types: initial, followup, emergency with distinct handling.
  - Durations: predefined options mapped to pricing.
- Waitlist management: Not present in current schema; can be modeled by extending availability or adding a queue table.
- Rescheduling: Implemented via cancellation and rebooking; future enhancements could include direct reschedule with policy checks.

```mermaid
flowchart TD
Policy["Policy Check"] --> MinDate{"Meets Min Date?"}
MinDate --> |No| Block["Block Booking"]
MinDate --> |Yes| Type{"Valid Type?"}
Type --> |No| Block
Type --> |Yes| Duration{"Valid Duration?"}
Duration --> |No| Block
Duration --> |Yes| Proceed["Proceed to Payment"]
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L284-L288)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L601-L626)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L284-L288)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L601-L626)

## Dependency Analysis
- Frontend depends on:
  - API endpoints for availability and appointments
  - Stripe for payment
  - Prisma models for data
- Backend integrates with:
  - Prisma for persistence
  - Google Calendar for external sync
  - SMTP for email delivery
- Data model relationships:
  - Availability to Appointment via slotId
  - User to Appointment via patientId/therapistId

```mermaid
graph LR
UI["page.tsx"] --> API_Avail["/api/therapy/availability"]
UI --> API_App["/api/therapy/appointments"]
UI --> API_Checkout["/api/checkout"]
API_App --> PRISMA["schema.prisma"]
API_Avail --> PRISMA
API_Checkout --> PRISMA
PRISMA --> GC["googleCalendar.ts"]
PRISMA --> EMAIL["email.ts"]
```

**Diagram sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L135-L177)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L102-L161)
- [email.ts](file://WEBAPP/src/lib/email.ts#L27-L48)

**Section sources**
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L135-L177)
- [schema.prisma](file://WEBAPP/prisma/schema.prisma#L163-L211)

## Performance Considerations
- Real-time updates: Polling intervals balance freshness and load; adjust based on traffic.
- Slot refresh: Auto-refresh every 15 seconds reduces race conditions while minimizing requests.
- Calendar operations: Batch or debounce create/update/delete calls to avoid rate limits.
- Email throughput: Use a dedicated SMTP provider and queue asynchronous sends.

## Troubleshooting Guide
- Google Calendar integration:
  - Missing credentials cause token retrieval failures; ensure environment variables are set.
  - Refresh token errors indicate misconfiguration; follow OAuth setup steps.
  - Timezone mismatches can be resolved by ensuring consistent timezone usage.
- Email delivery:
  - Missing SMTP credentials prevent sending; configure EMAIL_USER and EMAIL_PASS.
  - Transport errors require checking host/port/security settings.
- Frontend booking:
  - Payment verification failures: check Stripe session ID and endpoint responses.
  - Slot availability stale: ensure auto-refresh is enabled and network is stable.

**Section sources**
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L68-L100)
- [googleCalendar.ts](file://WEBAPP/src/lib/googleCalendar.ts#L163-L181)
- [email.ts](file://WEBAPP/src/lib/email.ts#L27-L48)
- [page.tsx](file://WEBAPP/src/app/patient/appointments/page.tsx#L90-L126)

## Conclusion
The MindBridge appointment scheduling system combines a robust data model with a responsive frontend and integrations to Google Calendar and SMTP. It supports therapist availability management, patient booking workflows, confirmation and cancellation, and automated notifications. Enhancements such as waitlist management, stricter conflict detection, and centralized rescheduling policies would further strengthen the system.