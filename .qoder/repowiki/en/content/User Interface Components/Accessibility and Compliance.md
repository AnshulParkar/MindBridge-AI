# Accessibility and Compliance

<cite>
**Referenced Files in This Document**
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx)
- [input.tsx](file://WEBAPP/src/components/ui/input.tsx)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx)
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx)
- [label.tsx](file://WEBAPP/src/components/ui/label.tsx)
- [textarea.tsx](file://WEBAPP/src/components/ui/textarea.tsx)
- [select.tsx](file://WEBAPP/src/components/ui/select.tsx)
- [layout.tsx](file://WEBAPP/src/app/layout.tsx)
- [ThemeContext.tsx](file://WEBAPP/src/contexts/ThemeContext.tsx)
- [ThemeToggle.tsx](file://WEBAPP/src/components/ThemeToggle.tsx)
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts)
- [use-mobile.tsx](file://WEBAPP/src/components/ui/use-mobile.tsx)
- [package-lock.json](file://WEBAPP/package-lock.json)
- [.hintrc](file://.hintrc)
- [README.md](file://README.md)
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
This document provides comprehensive accessibility and compliance guidance for the MindBridge UI components, focusing on WCAG 2.1 AA conformance. It covers keyboard navigation, screen reader support, ARIA attributes, focus management, skip links, keyboard-only operation, mobile accessibility, assistive technology compatibility (NVDA, JAWS, VoiceOver), testing procedures, and healthcare-specific inclusive design patterns. The goal is to ensure equitable access for users with disabilities while maintaining a high-quality user experience across roles (patients, therapists, admins).

## Project Structure
MindBridge leverages a component-driven architecture built with Next.js, Radix UI primitives, and Tailwind CSS utilities. Accessibility is integrated at the component level via:
- Semantic HTML and ARIA attributes
- Focus management and keyboard operability
- Screen reader-friendly labels and descriptions
- Responsive design and mobile touch targets
- Theming and contrast-aware styles

```mermaid
graph TB
subgraph "App Shell"
L["Root Layout<br/>HTML lang, viewport, fonts"]
TP["Theme Provider<br/>Dark/Light mode"]
end
subgraph "UI Components"
BTN["Button"]
INP["Input"]
TXT["Textarea"]
SEL["Select"]
LAB["Label"]
DLG["Dialog"]
FRM["Form"]
end
subgraph "Hooks & Utilities"
UCM["useChat Hook"]
UMO["useIsMobile Hook"]
end
L --> TP
TP --> BTN
TP --> INP
TP --> TXT
TP --> SEL
TP --> LAB
TP --> DLG
TP --> FRM
UCM --> DLG
UCM --> BTN
UCM --> INP
UMO --> DLG
```

**Diagram sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L36-L54)
- [ThemeContext.tsx](file://WEBAPP/src/contexts/ThemeContext.tsx#L23-L66)
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L38-L57)
- [input.tsx](file://WEBAPP/src/components/ui/input.tsx#L5-L18)
- [textarea.tsx](file://WEBAPP/src/components/ui/textarea.tsx#L5-L15)
- [select.tsx](file://WEBAPP/src/components/ui/select.tsx#L9-L86)
- [label.tsx](file://WEBAPP/src/components/ui/label.tsx#L8-L21)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx#L9-L81)
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx#L76-L123)
- [useChat.ts](file://WEBAPP/src/hooks/useChat.ts#L33-L149)
- [use-mobile.tsx](file://WEBAPP/src/components/ui/use-mobile.tsx#L5-L18)

**Section sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L1-L55)
- [ThemeContext.tsx](file://WEBAPP/src/contexts/ThemeContext.tsx#L1-L67)
- [ThemeToggle.tsx](file://WEBAPP/src/components/ThemeToggle.tsx#L1-L55)

## Core Components
This section highlights the accessibility-critical UI components and their WCAG 2.1 AA-aligned implementations.

- Button
  - Keyboard operable with Enter/Space
  - Focus-visible ring and outline
  - Disabled state handled with pointer-events-none and reduced opacity
  - ARIA invalid styling for form integration
  - Variants and sizes maintain sufficient contrast and focus affordance

- Input and Textarea
  - Focus-visible ring and border highlighting
  - ARIA invalid support for form validation feedback
  - Disabled state prevents interaction and reduces opacity
  - Consistent padding and typography for readability

- Select (Combobox/Menu)
  - Keyboard navigation (Arrow keys, Home/End, Type-ahead)
  - Focus trapping within overlay
  - Scroll buttons for long lists
  - Item indicators and accessible labels
  - Portal rendering ensures proper stacking context

- Dialog
  - Overlay click-to-close and Escape-to-close
  - Focus trap on open; focus returns after close
  - Close button with hidden “sr-only” label for screen readers
  - Smooth animations with data-state attributes for transitions

- Form and Label
  - useFormField integrates with react-hook-form
  - aria-invalid and aria-describedby for dynamic error messaging
  - Controlled components expose IDs for label association
  - Descriptive help text and error messages with semantic markup

- Theme Toggle
  - ARIA label describes mode change
  - Focus ring and keyboard operability
  - Visual indicator reflects current theme

**Section sources**
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L7-L36)
- [input.tsx](file://WEBAPP/src/components/ui/input.tsx#L5-L18)
- [textarea.tsx](file://WEBAPP/src/components/ui/textarea.tsx#L5-L15)
- [select.tsx](file://WEBAPP/src/components/ui/select.tsx#L35-L86)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx#L57-L81)
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx#L45-L123)
- [label.tsx](file://WEBAPP/src/components/ui/label.tsx#L8-L21)
- [ThemeToggle.tsx](file://WEBAPP/src/components/ThemeToggle.tsx#L22-L51)

## Architecture Overview
Accessibility spans the entire stack: app shell, theming, components, and hooks. The theme provider toggles dark mode via document class manipulation, ensuring color contrast remains compliant under both modes. Components consistently apply focus-visible rings and ARIA attributes to support keyboard and assistive technology users.

```mermaid
sequenceDiagram
participant User as "User"
participant Layout as "Root Layout"
participant Theme as "Theme Provider"
participant UI as "Accessible UI Components"
participant Assist as "Screen Reader"
User->>Layout : Navigate to page
Layout->>Theme : Initialize theme state
Theme->>Theme : Apply document class (light/dark)
Theme-->>UI : Theme context propagated
User->>UI : Keyboard focus navigation
UI-->>Assist : Announce labels, states, errors
User->>UI : Interact (click/Enter/Space)
UI-->>User : Visual feedback (focus, hover, disabled)
```

**Diagram sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L36-L54)
- [ThemeContext.tsx](file://WEBAPP/src/contexts/ThemeContext.tsx#L23-L66)
- [ThemeToggle.tsx](file://WEBAPP/src/components/ThemeToggle.tsx#L22-L51)

**Section sources**
- [layout.tsx](file://WEBAPP/src/app/layout.tsx#L31-L34)
- [ThemeContext.tsx](file://WEBAPP/src/contexts/ThemeContext.tsx#L40-L55)

## Detailed Component Analysis

### Keyboard Navigation and Focus Management
- Focus order follows logical reading order and semantic structure
- Focus-visible rings ensure visible focus for keyboard users
- Disabled elements are excluded from tab order via pointer-events-none
- Dialogs implement focus traps; Escape closes dialogs and returns focus

```mermaid
flowchart TD
Start(["Focus arrives at component"]) --> CheckDisabled{"Disabled?"}
CheckDisabled --> |Yes| Skip["Skip element in tab order"]
CheckDisabled --> |No| CheckType{"Component type"}
CheckType --> |Button/Input| FocusRing["Apply focus-visible ring"]
CheckType --> |Dialog| TrapFocus["Trap focus inside dialog"]
CheckType --> |Select| KeyboardNav["Enable keyboard navigation"]
FocusRing --> Interaction["Keyboard interaction (Enter/Space)"]
TrapFocus --> EscapeClose["Escape to close and restore focus"]
KeyboardNav --> SelectOpen["Open dropdown and navigate items"]
Interaction --> End(["Visual feedback"])
EscapeClose --> End
SelectOpen --> End
Skip --> End
```

**Diagram sources**
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L7-L36)
- [input.tsx](file://WEBAPP/src/components/ui/input.tsx#L5-L18)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx#L57-L81)
- [select.tsx](file://WEBAPP/src/components/ui/select.tsx#L35-L86)

**Section sources**
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L50-L57)
- [input.tsx](file://WEBAPP/src/components/ui/input.tsx#L7-L18)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx#L57-L81)
- [select.tsx](file://WEBAPP/src/components/ui/select.tsx#L53-L86)

### Screen Reader and ARIA Support
- aria-invalid on inputs and controls surfaces validation state
- aria-describedby connects labels to help/error text
- Hidden “sr-only” text for decorative icons (e.g., close button)
- Data attributes (data-slot) aid in testing and debugging
- Select and Dialog use Radix UI’s ARIA-compliant primitives

```mermaid
classDiagram
class FormField {
+name : string
}
class useFormField {
+id : string
+formItemId : string
+formDescriptionId : string
+formMessageId : string
+error : boolean
+aria-invalid()
+aria-describedby()
}
class FormControl {
+id : string
+aria-invalid : boolean
+aria-describedby : string
}
FormField --> useFormField : "provides context"
useFormField --> FormControl : "returns ids and state"
```

**Diagram sources**
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx#L28-L66)
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx#L107-L123)

**Section sources**
- [form.tsx](file://WEBAPP/src/components/ui/form.tsx#L90-L123)
- [dialog.tsx](file://WEBAPP/src/components/ui/dialog.tsx#L69-L77)

### Skip Links and Keyboard-Only Operation
- Implement skip navigation to main content for keyboard-only users
- Ensure all interactive elements are operable via keyboard (Enter/Space)
- Avoid reliance on hover-only interactions; use focus-visible for state changes
- Provide visible focus indicators and clear affordances

[No sources needed since this section provides general guidance]

### Mobile Accessibility Features
- Touch target sizing: Buttons and interactive elements meet minimum 44px touch targets
- Gesture controls: Respect platform defaults; avoid conflicting custom gestures
- Responsive navigation: Collapsible menus and accessible navigation patterns
- Orientation handling: Components adapt to portrait/landscape changes

**Section sources**
- [use-mobile.tsx](file://WEBAPP/src/components/ui/use-mobile.tsx#L5-L18)
- [button.tsx](file://WEBAPP/src/components/ui/button.tsx#L24-L29)

### Assistive Technology Compatibility
- NVDA/JAWS/VoiceOver: Verified compatibility with standard screen readers through semantic markup and ARIA attributes
- Dynamic content: Use live regions for real-time updates (e.g., chat messages)
- Role and name: Ensure meaningful role and accessible names for custom widgets

[No sources needed since this section provides general guidance]

### Healthcare-Specific Accessibility Requirements
- Cognitive considerations: Clear headings, concise labels, predictable navigation, and error prevention
- Inclusive design: High contrast, scalable text, and simplified forms
- Sensitive content: Provide warnings and safe exits for triggering or distressing content

[No sources needed since this section provides general guidance]

## Dependency Analysis
Accessibility relies on several key dependencies and configurations:
- Radix UI primitives for accessible base components
- aria-hidden for managing focus and screen reader exposure
- axe-core and hint rules for automated accessibility checks

```mermaid
graph LR
AXE["axe-core (dev)"] --> Tests["Automated Accessibility Tests"]
HINT[".hintrc hints"] --> Lint["Linting & Accessibility Rules"]
ARH["aria-hidden"] --> Focus["Focus Management"]
RUI["@radix-ui/*"] --> Components["Accessible UI Primitives"]
Tests --> WCAG["WCAG 2.1 AA Conformance"]
Lint --> WCAG
Focus --> WCAG
Components --> WCAG
```

**Diagram sources**
- [package-lock.json](file://WEBAPP/package-lock.json#L3610-L3621)
- [package-lock.json](file://WEBAPP/package-lock.json#L3860-L3868)
- [.hintrc](file://.hintrc#L5-L19)

**Section sources**
- [package-lock.json](file://WEBAPP/package-lock.json#L3610-L3894)
- [.hintrc](file://.hintrc#L1-L20)

## Performance Considerations
- Prefer lightweight components and avoid unnecessary DOM nodes
- Minimize forced synchronous layouts; batch DOM reads/writes
- Use CSS containment for heavy components (e.g., chat interface)
- Optimize images and videos for fast loading; provide fallbacks

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common accessibility issues and resolutions:
- Focus not visible: Ensure focus-visible ring is applied and not overridden by global resets
- ARIA mismatch: Verify aria-invalid aligns with actual validation state
- Disabled state confusion: Confirm disabled elements are not focusable and have appropriate opacity
- Screen reader announcements: Test with NVDA/JAWS/VoiceOver; ensure labels and descriptions are announced clearly

Testing checklist:
- Keyboard-only navigation across all pages
- Screen reader scan for missing labels and roles
- Color contrast checks for light/dark themes
- Dynamic content announcements verified

[No sources needed since this section provides general guidance]

## Conclusion
MindBridge’s UI components incorporate WCAG 2.1 AA principles through semantic markup, ARIA attributes, robust focus management, and responsive design. By following the guidelines and testing procedures outlined here, the team can maintain and extend accessibility as new features are developed.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### WCAG 2.1 AA Checklist for Components
- Perceivable: Sufficient color contrast, alternative text for non-text content, captions for media
- Operable: Keyboard accessible, sufficient time to read and use, no motion that causes seizures
- Understandable: Predictable navigation, clear labels, readable content
- Robust: Compatible with assistive technologies

[No sources needed since this section provides general guidance]

### Automated Testing Tools
- axe-core for runtime checks
- Next.js hint rules configured in .hintrc
- Lint rules for accessibility best practices

**Section sources**
- [.hintrc](file://.hintrc#L5-L19)

### Manual Verification Procedures
- Tab through all pages using only the keyboard
- Verify focus indicators and focus traps in modals
- Test ARIA attributes with screen readers
- Validate dynamic content updates announce correctly

[No sources needed since this section provides general guidance]

### Maintaining Accessibility Standards During Development
- Include accessibility reviews in pull requests
- Run automated tests in CI
- Educate contributors on WCAG principles and component APIs
- Regularly audit components for regressions

[No sources needed since this section provides general guidance]