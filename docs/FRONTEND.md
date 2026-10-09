# FRONTEND.md

# MeetingOS — Frontend Requirements & Architecture

## 1. Document Overview

This document defines the complete frontend requirements for **MeetingOS**.

It describes:

- Frontend architecture
- Pages
- Routes
- User flows
- Components
- Page behavior
- Interactions
- Forms
- API integration
- Loading states
- Empty states
- Error states
- Validation
- Meeting processing flow
- Action management
- Dependency visualization
- Meeting history
- Search / Ask My Meetings
- Export behavior
- Responsive behavior
- Accessibility requirements
- Frontend state management
- Frontend security considerations

This document intentionally **does not define visual design choices such as colors, fonts, gradients, shadows, exact typography, or visual branding**.

Those decisions will be defined separately in:

```text
DESIGN.md
```

---

# 2. Frontend Objective

The frontend should make MeetingOS feel like a tool that converts an unstructured meeting into a structured execution workspace.

The primary user journey is:

```text
Enter Meeting Notes
        ↓
Process Meeting
        ↓
AI Extraction
        ↓
Verification
        ↓
Review Results
        ↓
Manage Actions
        ↓
View Decisions / Questions
        ↓
Understand Dependencies
        ↓
Track Action Status
```

The frontend should prioritize:

1. Clarity
2. Trust
3. Fast interaction
4. Evidence-backed AI output
5. Easy action management
6. Simple navigation
7. Responsive behavior
8. Accessibility

---

# 3. Frontend Technology Stack

## 3.1 Core

```text
React
Vite
JavaScript / JSX
```

## 3.2 Styling

```text
Tailwind CSS
```

Tailwind will be used for implementation.

Exact visual rules are intentionally excluded from this document and will be defined in `DESIGN.md`.

## 3.3 Routing

```text
React Router
```

## 3.4 API Communication

```text
Axios
```

## 3.5 Validation

```text
Zod
```

## 3.6 Graph Visualization

```text
React Flow
```

## 3.7 State Management

For the MVP, use:

```text
React Context
+
React hooks
+
Local component state
```

A large global state-management library should not be introduced unless the application complexity requires it.

---

# 4. Frontend Architecture

```text
React Application
       │
       ├── Routing
       │
       ├── Pages
       │
       ├── Layouts
       │
       ├── Reusable Components
       │
       ├── Hooks
       │
       ├── Context
       │
       ├── API Services
       │
       ├── Validation
       │
       └── Utilities
```

Recommended structure:

```text
client/
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── meetings/
│   │   ├── actions/
│   │   ├── decisions/
│   │   ├── questions/
│   │   ├── dependencies/
│   │   └── ai/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── meetings/
│   │   └── settings/
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx
│   │   └── AppLayout.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authApi.js
│   │   ├── meetingApi.js
│   │   ├── actionApi.js
│   │   └── userApi.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useMeetings.js
│   │   └── useActions.js
│   │
│   ├── validators/
│   │   ├── authValidator.js
│   │   └── meetingValidator.js
│   │
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── formatUtils.js
│   │   └── storageUtils.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

---

# 5. Application Routes

The frontend should use the following routes.

## Public Routes

```text
/login
/register
```

## Protected Routes

```text
/dashboard

/meetings

/meetings/new

/meetings/:meetingId

/meetings/:meetingId/actions

/meetings/:meetingId/graph

/meetings/:meetingId/decisions

/meetings/:meetingId/questions

/settings
```

Optional future route:

```text
/ask
```

for Ask My Meetings.

---

# 6. Application Layout

Authenticated pages should use a common application layout.

Conceptually:

```text
┌─────────────────────────────────────────────┐
│ Application Header                          │
├──────────────┬──────────────────────────────┤
│              │                              │
│ Navigation   │       Page Content           │
│              │                              │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

The exact visual structure will be defined in `DESIGN.md`.

The layout must provide:

- Navigation
- Current page context
- User account access
- Main content area
- Responsive navigation behavior

---

# 7. Navigation Requirements

Authenticated navigation should provide access to:

```text
Dashboard
Meetings
Actions
Ask My Meetings
Settings
```

The navigation should clearly indicate the current section.

On smaller screens, navigation should collapse into an appropriate mobile interaction.

---

# 8. Authentication Pages

# 8.1 Login Page

Route:

```text
/login
```

Purpose:

Allow existing users to authenticate.

Required fields:

```text
Email
Password
```

Actions:

```text
Login
Go to Register
```

Behavior:

```text
User submits form
      ↓
Frontend validation
      ↓
POST /api/auth/login
      ↓
Receive JWT
      ↓
Store authentication state
      ↓
Redirect to Dashboard
```

Error cases:

- Invalid email
- Incorrect password
- Account does not exist
- Server unavailable
- Authentication service failure

The page must display meaningful errors without exposing sensitive backend information.

---

# 8.2 Register Page

Route:

```text
/register
```

Fields:

```text
Name
Email
Password
Confirm Password
```

Frontend validation:

- Required fields
- Valid email
- Minimum password requirements
- Password confirmation match

Flow:

```text
Register
   ↓
POST /api/auth/register
   ↓
Success
   ↓
Login / Dashboard
```

---

# 9. Authentication State

Authentication should be handled centrally.

`AuthContext` should provide:

```js
{
  user,
  isAuthenticated,
  loading,
  login,
  register,
  logout
}
```

Protected routes should redirect unauthenticated users to:

```text
/login
```

If a JWT expires:

```text
API request
    ↓
401 Unauthorized
    ↓
Clear authentication state
    ↓
Redirect to login
```

---

# 10. Dashboard Page

Route:

```text
/dashboard
```

The dashboard is the user's starting point after login.

## Primary purpose

Provide a quick overview of the user's meetings and actionable work.

The dashboard should contain:

```text
Welcome / Context
        ↓
Create New Meeting
        ↓
Recent Meetings
        ↓
Action Overview
        ↓
Pending / In Progress Actions
```

The dashboard should not become a large analytics dashboard.

The product intentionally focuses on meeting understanding and execution.

---

# 11. Dashboard Components

Recommended components:

```text
DashboardHeader
CreateMeetingButton
RecentMeetings
RecentMeetingCard
ActionOverview
ActionSummary
UpcomingActions
EmptyDashboard
```

---

# 12. Dashboard Behavior

When the dashboard loads:

```text
GET /api/meetings
GET /api/actions
```

The frontend should display appropriate loading states.

If there are no meetings:

```text
Empty State
    ↓
"Create your first meeting"
    ↓
/meetings/new
```

If meetings exist:

```text
Recent Meetings
```

should be displayed.

---

# 13. Create Meeting Page

Route:

```text
/meetings/new
```

This is one of the most important pages.

The page allows users to provide meeting content.

Input methods:

```text
Paste Meeting Notes
Upload TXT
Upload PDF
Upload DOCX
```

The interface should clearly distinguish between:

```text
Text Input
```

and

```text
File Upload
```

---

# 14. Meeting Input Form

Fields:

```text
Meeting Title
Meeting Date
Meeting Notes
```

Optional metadata:

```text
Description
Tags
```

The notes field is required unless a supported file is uploaded.

---

# 15. File Upload Behavior

Supported formats:

```text
.txt
.pdf
.docx
```

The frontend should:

1. Accept supported file types.
2. Reject unsupported file types.
3. Display selected filename.
4. Display file size.
5. Allow removing the selected file.
6. Prevent oversized uploads.
7. Show upload/processing state.

Example flow:

```text
Select File
     ↓
Validate File
     ↓
Display File
     ↓
Submit
```

---

# 16. Meeting Creation Flow

```text
User enters notes
        ↓
Click Process Meeting
        ↓
Validate form
        ↓
Create meeting
        ↓
Upload file if applicable
        ↓
Backend processes meeting
        ↓
Qualcomm Cloud AI
        ↓
Verification
        ↓
Redirect to Meeting Detail
```

---

# 17. Processing State

AI processing may take time.

The frontend must never appear frozen.

Display a processing state such as:

```text
Preparing meeting...
Analyzing meeting notes...
Extracting action items...
Checking evidence...
Finalizing results...
```

The exact copy can be refined later.

The frontend should communicate that processing is active.

---

# 18. Meeting Detail Page

Route:

```text
/meetings/:meetingId
```

This is the primary MeetingOS workspace.

The page should present the processed meeting in a structured manner.

Main sections:

```text
Meeting Header
        ↓
AI Summary
        ↓
Actions
        ↓
Decisions
        ↓
Questions / Discussion
        ↓
Dependencies
        ↓
Verification Information
```

---

# 19. Meeting Header

The header should display:

```text
Meeting Title
Meeting Date
Processing Status
Action Count
Decision Count
```

Available actions:

```text
Edit
Reprocess
Export
Delete
```

The exact controls depend on permissions and implementation.

---

# 20. AI Summary Section

Display:

```text
Meeting Summary
```

The summary should be concise and readable.

The frontend should not alter the AI-generated meaning.

If no summary is available:

```text
Summary unavailable
```

should be displayed instead of inventing content.

---

# 21. Action Items Section

The action section is one of the most important UI areas.

Each action should display:

```text
Action description
Owner
Deadline
Priority
Status
Confidence
Evidence availability
```

Example:

```text
Prepare API documentation

Owner: Rahul
Deadline: Oct 10
Priority: High
Status: In Progress
Confidence: 94%
```

---

# 22. Action Item Interaction

Users should be able to:

- Change status
- Change owner
- Change deadline
- Change priority
- View supporting evidence
- Open action details

Supported statuses:

```text
Todo
In Progress
Completed
Blocked
```

---

# 23. Action Editing

When the user edits an action:

```text
Open Action
    ↓
Edit fields
    ↓
Validate
    ↓
PATCH /api/actions/:id
    ↓
Update UI
```

The frontend should optimistically update only when the behavior is safe and rollback is implemented.

For the MVP, a server-confirmed update is acceptable.

---

# 24. Action Evidence

Each AI-generated action should allow the user to understand its source.

The interface should provide an interaction such as:

```text
View Evidence
```

When opened, show:

```text
Supporting text:
"Rahul will prepare the final API documentation by Friday."
```

The frontend should not fabricate evidence.

If evidence is unavailable:

```text
No supporting evidence was found.
```

---

# 25. Confidence Display

Confidence should be visible without making it appear that confidence equals truth.

Example:

```text
Confidence: High
94%
```

The UI should make it clear that verification and evidence matter more than the numerical score alone.

---

# 26. Verification Section

The meeting detail page should provide verification status.

Possible states:

```text
Verified
Needs Review
Conflict Detected
Unsupported Information
```

The frontend should surface issues identified by the backend.

Example:

```text
Needs Review

The extracted deadline could not be fully supported
by the meeting notes.
```

---

# 27. Ambiguity Display

If the AI identifies ambiguous statements, they should be presented separately.

Example:

```text
Ambiguities

"Someone should update the documentation."

Owner was not identified.
```

The system should not automatically assign an owner.

---

# 28. Decisions Section

Display decisions separately from actions.

Each decision may contain:

```text
Decision
Confidence
Supporting Evidence
```

Example:

```text
Decision

The team will use PostgreSQL.

Confidence: 91%

View Evidence
```

A discussion or suggestion should not be presented as a confirmed decision.

---

# 29. Questions / Discussion Section

Questions identified from the meeting should be displayed separately.

Possible fields:

```text
Question
Context
Status
```

Possible status:

```text
Open
Resolved
```

The frontend should clearly distinguish questions from decisions.

---

# 30. Dependency Graph Page

Route:

```text
/meetings/:meetingId/graph
```

The page visualizes relationships between action items.

Example:

```text
Design API
    │
    ▼
Implement API
    │
    ▼
Test API
```

React Flow should be used for visualization.

---

# 31. Dependency Graph Behavior

Users should be able to:

- Pan
- Zoom
- Inspect nodes
- Select an action
- View dependency relationships

Selecting a node should reveal relevant action details.

The graph should reflect the database relationship.

The frontend must not create dependencies that do not exist in the backend data.

---

# 32. Actions Page

Route:

```text
/meetings/:meetingId/actions
```

This page provides a focused action-management view.

Display:

```text
All Actions
```

with filtering options such as:

```text
Status
Priority
Owner
Deadline
```

Sorting options:

```text
Deadline
Priority
Status
Created date
```

---

# 33. Action Filtering

Filtering should happen without losing the underlying data.

Example:

```text
Status:
[All] [Todo] [In Progress] [Completed] [Blocked]
```

Multiple filters may be combined.

Example:

```text
Owner = Rahul
Status = In Progress
```

---

# 34. Overdue Actions

The frontend should visually distinguish overdue actions.

An action is overdue when:

```text
deadline < current date/time
AND
status != Completed
```

The backend may return an explicit overdue flag, or the frontend can calculate it consistently from the returned fields.

The frontend should never mark a completed action as overdue.

---

# 35. Meeting History Page

Route:

```text
/meetings
```

Purpose:

Allow users to browse previously processed meetings.

Each meeting card/list item should contain:

```text
Title
Date
Summary preview
Action count
Decision count
Processing status
```

Actions:

```text
Open
Delete
```

---

# 36. Meeting History Behavior

The page should support:

```text
Search
Sort
Pagination / Load More
```

Search can initially operate on:

- Meeting title
- Basic metadata

More advanced semantic search can be implemented later.

---

# 37. Meeting Comparison

MeetingOS supports comparison between meetings.

Possible flow:

```text
Meetings
   ↓
Select Meeting A
   ↓
Select Meeting B
   ↓
Compare
```

The comparison can show:

```text
Actions
Decisions
Questions
Changes
```

The frontend should focus on displaying backend-provided comparison results.

---

# 38. Ask My Meetings

If implemented in the MVP, the user can ask questions about their meeting history.

Example:

```text
"What did we decide about PostgreSQL?"
```

The frontend should provide:

```text
Question Input
        ↓
Submit
        ↓
Loading
        ↓
Answer
        ↓
Supporting Meeting References
```

The answer should distinguish between:

```text
Directly supported information
```

and

```text
Uncertain / unavailable information
```

---

# 39. Export Meeting Report

Users should be able to export a processed meeting.

Route/API:

```text
GET /api/meetings/:id/export
```

The frontend should provide:

```text
Export
```

Possible output:

```text
PDF
JSON
TXT
```

The exact supported formats depend on backend implementation.

Export should contain:

```text
Meeting Information
Summary
Actions
Decisions
Questions
Dependencies
Verification
```

---

# 40. Delete Meeting

Users should be able to delete meetings.

Before deletion:

```text
Confirmation
```

should be displayed.

The confirmation should explain that associated information may also be deleted.

Flow:

```text
Delete
 ↓
Confirm
 ↓
DELETE /api/meetings/:id
 ↓
Success
 ↓
Return to Meetings
```

---

# 41. Reprocess Meeting

Users should be able to re-run AI processing when supported.

Example:

```text
Reprocess
   ↓
Confirmation
   ↓
Processing
   ↓
New AI extraction
   ↓
Verification
   ↓
Updated result
```

The original meeting notes must remain unchanged.

---

# 42. Loading States

Every asynchronous operation should have a loading state.

Examples:

```text
Loading meetings...
Loading meeting...
Processing meeting...
Updating action...
Deleting meeting...
Loading dependencies...
Generating answer...
```

Avoid blank screens while requests are in progress.

---

# 43. Skeleton States

For larger sections, skeleton loaders may be used.

Examples:

```text
Meeting list skeleton
Action list skeleton
Summary skeleton
Dashboard skeleton
```

The exact appearance belongs in `DESIGN.md`.

---

# 44. Empty States

Every collection needs an empty state.

Examples:

### No Meetings

```text
No meetings yet.
Create your first meeting to get started.
```

### No Actions

```text
No action items were identified.
```

### No Decisions

```text
No decisions were identified.
```

### No Questions

```text
No questions were identified.
```

### No Dependencies

```text
No dependencies were identified.
```

Empty states should provide a useful next action where appropriate.

---

# 45. Error States

The frontend should handle:

```text
Network Error
Authentication Error
Validation Error
Permission Error
Not Found
AI Processing Error
File Upload Error
Server Error
```

Example:

```text
We couldn't process this meeting.
Please try again.
```

Do not expose stack traces to users.

---

# 46. Toast / Notification Behavior

Short-lived notifications may be used for:

```text
Action updated
Meeting deleted
Meeting exported
Changes saved
Processing completed
```

Errors should also be communicated clearly.

The notification system should not replace inline validation for forms.

---

# 47. Form Validation

Frontend validation should happen before API requests.

Examples:

### Meeting Title

```text
Required
```

### Meeting Notes

```text
Required when no file is uploaded
```

### File

```text
Supported type
Maximum size
```

### Action Deadline

```text
Valid date
```

### Email

```text
Valid email format
```

---

# 48. API Service Layer

The frontend should not make Axios requests directly from every component.

Use dedicated API modules.

Example:

```text
services/
├── api.js
├── authApi.js
├── meetingApi.js
├── actionApi.js
└── userApi.js
```

Example:

```js
export const getMeeting = async (id) => {
  const response = await api.get(`/meetings/${id}`);
  return response.data;
};
```

Components call:

```js
getMeeting(meetingId);
```

rather than constructing raw URLs themselves.

---

# 49. Axios Configuration

A central Axios instance should contain:

```text
Base URL
Authorization handling
Common headers
Error handling
```

Example conceptual structure:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});
```

Authentication token handling should be centralized.

---

# 50. Frontend Environment Variables

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Production:

```env
VITE_API_URL=https://api.example.com/api
```

Never place:

```text
Qualcomm API key
JWT secret
Database credentials
```

inside frontend environment variables.

Anything exposed through `VITE_*` should be considered public.

---

# 51. State Management

## Authentication State

Global:

```text
AuthContext
```

Contains:

```text
User
Authentication status
Loading state
Login
Logout
Register
```

## Meeting State

Prefer page-level state for individual meeting pages.

Example:

```js
const [meeting, setMeeting] = useState(null);
const [loading, setLoading] = useState(true);
```

## UI State

Local state:

```text
Modal open
Selected action
Filters
Search text
Expanded evidence
```

---

# 52. Data Fetching Strategy

When opening:

```text
/meetings/:id
```

Fetch:

```text
Meeting
Actions
Decisions
Questions
Dependencies
Verification
```

The frontend can either:

1. Use one aggregated meeting endpoint, or
2. Request separate resources.

For the MVP, an aggregated meeting response is preferable for the main detail page if the backend supports it.

---

# 53. Optimistic Updates

Optimistic updates can be used for simple interactions such as:

```text
Changing action status
```

But only when rollback is handled.

For important AI-generated information such as:

```text
Owner
Deadline
Decision
```

server-confirmed updates are preferred.

---

# 54. Pagination

Meeting history should support pagination when the number of meetings grows.

Example:

```text
GET /api/meetings?page=1&limit=20
```

The frontend should not attempt to load an unlimited number of meetings.

---

# 55. Search

Initial search can be implemented using:

```text
Meeting title
```

and optionally:

```text
Meeting notes
```

Advanced semantic search is a separate capability.

---

# 56. Responsive Requirements

The application must work on:

```text
Desktop
Tablet
Mobile
```

Responsive behavior should include:

- Collapsible navigation
- Responsive meeting layouts
- Scrollable action tables/lists where required
- Touch-friendly controls
- Responsive dependency graph
- Mobile-friendly forms

Exact breakpoints belong in `DESIGN.md`.

---

# 57. Accessibility

The frontend should target **WCAG 2.1 AA** where practical.

Requirements include:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible form labels
- Meaningful button labels
- Alt text for meaningful images
- Sufficient contrast
- Error messages associated with inputs
- Screen-reader-friendly status messages
- Avoiding color-only communication
- Accessible modal behavior

---

# 58. Keyboard Accessibility

Users should be able to navigate major interactions using a keyboard.

Important interactions:

```text
Navigation
Forms
Buttons
Modals
Action editing
Evidence panels
Filters
```

Modal dialogs must support:

```text
Escape → Close
Tab → Navigate
```

Focus should be managed appropriately when opening and closing dialogs.

---

# 59. AI Processing Accessibility

During AI processing, the UI should expose status information programmatically where appropriate.

Example:

```text
Processing meeting...
```

should be announced to assistive technologies through an appropriate live region.

---

# 60. Security Requirements

Frontend security requirements:

- Do not expose secret API keys.
- Do not store passwords.
- Do not trust frontend authorization.
- Do not assume hidden UI means protected data.
- Handle expired JWTs.
- Sanitize or safely render user-generated content.
- Avoid unsafe HTML rendering.
- Validate uploads before submission.
- Use HTTPS in production.

Backend authorization remains authoritative.

---

# 61. User-Corrected AI Data

The frontend must support the distinction between:

```text
AI-generated value
```

and:

```text
User-corrected value
```

For example:

```text
AI Owner: Rahul

Current Owner: Priya
```

If the user changes an AI-generated field, the interface should not imply that the new value was generated by AI.

---

# 62. Evidence UX Principle

Evidence should be easy to access but should not overwhelm the primary interface.

Recommended behavior:

```text
Action
  ↓
View Evidence
  ↓
Evidence panel / expandable section
```

The main action list remains concise.

---

# 63. Trust UX Principle

The frontend should clearly communicate uncertainty.

Examples:

```text
Unassigned
Unknown deadline
Needs review
Conflict detected
No evidence found
```

Never replace uncertainty with a guessed value merely to make the UI look complete.

---

# 64. AI Status Model

The frontend may receive processing states such as:

```text
UPLOADED
PROCESSING
PROCESSED
VERIFIED
FAILED
```

The UI should map these states to understandable user-facing messages.

Example:

```text
PROCESSING → Analyzing meeting
PROCESSED  → Ready for review
VERIFIED   → Verified
FAILED     → Processing failed
```

---

# 65. Meeting Detail Information Hierarchy

The frontend should prioritize information in this order:

```text
1. Summary
2. Action Items
3. Decisions
4. Questions
5. Dependencies
6. Verification / Trust Information
7. Source / Evidence
```

The user should be able to understand the meeting quickly without opening every detail.

---

# 66. Component Architecture

Reusable components should include:

## Common

```text
Button
Input
Textarea
Select
Modal
Dropdown
Badge
Tooltip
Tabs
Spinner
Skeleton
EmptyState
ErrorState
Pagination
```

## Meeting

```text
MeetingCard
MeetingHeader
MeetingSummary
MeetingStatus
MeetingActions
MeetingDecisions
MeetingQuestions
MeetingVerification
```

## Actions

```text
ActionCard
ActionList
ActionStatus
ActionPriority
ActionOwner
ActionDeadline
ActionEvidence
ActionEditor
ActionFilters
```

## AI

```text
AIProcessingState
ConfidenceIndicator
VerificationBadge
EvidenceViewer
AmbiguityNotice
ConflictNotice
```

## Dependency

```text
DependencyGraph
DependencyNode
DependencyEdge
```

---

# 67. Reusable Component Principle

Components should be reusable and focused.

Bad:

```text
MeetingPage.jsx
```

containing every piece of UI and business logic.

Prefer:

```text
MeetingPage
 ├── MeetingHeader
 ├── MeetingSummary
 ├── ActionList
 ├── DecisionList
 ├── QuestionList
 └── VerificationPanel
```

---

# 68. Page-Level Responsibilities

Pages should primarily:

- Fetch required data
- Manage page-level state
- Compose components
- Handle navigation

Pages should not contain large amounts of API implementation logic.

---

# 69. Component-Level Responsibilities

Components should:

- Display data
- Handle local UI interactions
- Emit events
- Perform local validation when appropriate

Business logic should remain in hooks/services when possible.

---

# 70. Error Boundary

The React application should use an error boundary to prevent one unexpected component error from crashing the entire application.

Example:

```text
Unexpected UI Error
       ↓
Error Boundary
       ↓
Friendly fallback
       ↓
Reload / Return to Dashboard
```

---

# 71. Performance Requirements

The frontend should:

- Lazy-load major routes where useful.
- Avoid unnecessary API requests.
- Avoid rendering very large lists at once.
- Memoize expensive components where justified.
- Keep dependency graph rendering efficient.
- Avoid storing unnecessarily large meeting content in global state.

---

# 72. Route Protection

Protected routes:

```text
/dashboard
/meetings
/meetings/new
/meetings/:id
/settings
```

should require authentication.

Conceptually:

```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

Unauthenticated users:

```text
→ /login
```

---

# 73. 404 Page

Unknown routes should display a useful page.

Example:

```text
Page not found.

Return to Dashboard
```

---

# 74. Network Failure Behavior

If the API becomes unavailable:

```text
Request
  ↓
Network Failure
  ↓
Friendly error
  ↓
Retry
```

The application should not permanently lose unsaved user input.

For forms, entered text should remain available when possible.

---

# 75. Unsaved Changes

If the user is editing a meeting or action and attempts to navigate away with unsaved changes, the frontend should warn them when appropriate.

Example:

```text
You have unsaved changes.
Leave without saving?
```

---

# 76. File Upload UX

The upload component should provide:

```text
Drag and drop
Browse files
Selected file
Remove file
Upload progress where applicable
Validation errors
```

If drag-and-drop is implemented, it must have an equivalent keyboard-accessible file picker.

---

# 77. Meeting Processing UX

The processing experience should follow:

```text
Submit
  ↓
Uploading
  ↓
Processing
  ↓
AI Extraction
  ↓
Verification
  ↓
Completed
  ↓
Meeting Detail
```

The user should not need to manually refresh the page.

If asynchronous processing is used, the frontend should poll or use a suitable real-time mechanism for status updates.

---

# 78. Data Refresh

After updating an action:

```text
PATCH /api/actions/:id
      ↓
Successful response
      ↓
Update local UI state
```

After deleting a meeting:

```text
DELETE
  ↓
Remove from local list
  ↓
Navigate if necessary
```

After reprocessing:

```text
Reprocess
  ↓
Refresh meeting data
```

---

# 79. API Error Mapping

The frontend should map backend errors into user-friendly messages.

Example:

```text
401
→ "Your session has expired. Please log in again."

403
→ "You do not have permission to access this meeting."

404
→ "Meeting not found."

422
→ "Please check the information you entered."

500
→ "Something went wrong. Please try again."

502
→ "The AI service is temporarily unavailable."
```

---

# 80. Date Handling

The frontend should consistently handle dates.

Requirements:

- Store backend timestamps in a standard format.
- Convert timestamps for display.
- Avoid browser-dependent date parsing.
- Clearly display dates to the user.
- Handle missing deadlines as `Unknown` or equivalent.

---

# 81. Action Priority

Supported priorities:

```text
Low
Medium
High
```

The frontend should display priority consistently.

If priority is unknown:

```text
Not specified
```

It must not infer priority based solely on wording.

---

# 82. Action Owner

Owner states:

```text
Named person
Unassigned
```

If the AI cannot identify an owner:

```text
Unassigned
```

The frontend should allow the user to assign an owner manually.

---

# 83. Action Deadline

Possible states:

```text
Specific date
Unknown
No deadline
```

The UI should not convert vague language into a false exact date.

For example:

```text
"soon"
```

should not automatically become:

```text
October 10
```

unless the backend explicitly determines and supports that date.

---

# 84. Meeting Source Information

The frontend may display source information such as:

```text
Source:
Meeting Notes
Uploaded PDF
Uploaded DOCX
Uploaded TXT
```

The original source should remain identifiable.

---

# 85. Mobile Meeting View

On mobile:

```text
Meeting Header
    ↓
Summary
    ↓
Actions
    ↓
Decisions
    ↓
Questions
    ↓
Dependencies
```

Large horizontal structures should become vertically scrollable or stack appropriately.

The dependency graph may provide a simplified mobile interaction.

---

# 86. Desktop Meeting View

Desktop can make better use of horizontal space.

Potential conceptual structure:

```text
┌───────────────────────────────────────────────┐
│ Meeting Header                                │
├──────────────────────┬────────────────────────┤
│ Summary              │ Verification           │
├──────────────────────┴────────────────────────┤
│ Actions                                       │
├───────────────────────────────────────────────┤
│ Decisions / Questions                         │
├───────────────────────────────────────────────┤
│ Dependencies                                  │
└───────────────────────────────────────────────┘
```

Exact layout belongs in `DESIGN.md`.

---

# 87. Browser Compatibility

The frontend should target modern browsers:

```text
Chrome
Edge
Firefox
Safari
```

The MVP does not need to support obsolete browsers.

---

# 88. Frontend Build and Deployment

Development:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

The frontend should be deployed separately from the backend when appropriate.

---

# 89. Frontend Environment Configuration

Example:

```text
.env
.env.example
```

Only public configuration belongs in frontend environment variables.

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 90. Frontend Testing

Testing should cover:

## Component Tests

- Forms
- Action cards
- Meeting cards
- Modals
- Filters
- Evidence viewer

## Page Tests

- Login
- Register
- Dashboard
- Meeting creation
- Meeting detail
- Meeting history

## Integration Tests

```text
UI
 ↓
API
 ↓
Response
 ↓
UI update
```

## Accessibility Tests

Test:

- Keyboard navigation
- Form labels
- Focus behavior
- ARIA where necessary
- Screen reader compatibility

---

# 91. Critical User Flows

## Flow 1 — Register

```text
Register
 ↓
Validation
 ↓
API
 ↓
Authenticated
 ↓
Dashboard
```

## Flow 2 — Login

```text
Login
 ↓
JWT
 ↓
Dashboard
```

## Flow 3 — Process Meeting

```text
Create Meeting
 ↓
Enter Notes / Upload File
 ↓
Process
 ↓
AI
 ↓
Verification
 ↓
Meeting Detail
```

## Flow 4 — Review Action

```text
Meeting
 ↓
Action
 ↓
View Evidence
 ↓
Review Confidence
 ↓
Edit if necessary
```

## Flow 5 — Complete Action

```text
Action
 ↓
Change Status
 ↓
In Progress
 ↓
Completed
```

## Flow 6 — Explore Dependencies

```text
Meeting
 ↓
Dependency Graph
 ↓
Select Action
 ↓
Inspect Related Actions
```

---

# 92. Frontend Requirements Checklist

## Authentication

- [ ] Login
- [ ] Register
- [ ] Logout
- [ ] Protected routes
- [ ] Expired session handling

## Dashboard

- [ ] Recent meetings
- [ ] Action overview
- [ ] Create meeting CTA
- [ ] Empty state

## Meeting Input

- [ ] Title
- [ ] Date
- [ ] Notes
- [ ] TXT upload
- [ ] PDF upload
- [ ] DOCX upload
- [ ] Validation
- [ ] Processing state

## Meeting Results

- [ ] Summary
- [ ] Actions
- [ ] Decisions
- [ ] Questions
- [ ] Dependencies
- [ ] Verification
- [ ] Evidence
- [ ] Confidence
- [ ] Ambiguities
- [ ] Conflicts

## Actions

- [ ] Status update
- [ ] Owner update
- [ ] Deadline update
- [ ] Priority update
- [ ] Evidence
- [ ] Filtering
- [ ] Sorting
- [ ] Overdue state

## History

- [ ] Meeting list
- [ ] Search
- [ ] Pagination
- [ ] Open meeting
- [ ] Delete meeting

## Advanced

- [ ] Meeting comparison
- [ ] Ask My Meetings
- [ ] Export
- [ ] Dependency graph
- [ ] Reprocessing

## Quality

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Responsive behavior
- [ ] Accessibility
- [ ] Error boundary

---

# 93. What Is Explicitly NOT Defined Here

The following belong in `DESIGN.md`:

- Color palette
- Primary/secondary colors
- Typography
- Font families
- Font sizes
- Font weights
- Border radius
- Shadows
- Gradients
- Exact spacing scale
- Button visual styles
- Card visual styles
- Icon style
- Illustration style
- Logo
- Brand identity
- Animation style
- Exact responsive breakpoints
- Visual theme
- Dark/light theme details

`FRONTEND.md` defines **what the frontend does**.

`DESIGN.md` will define **how the frontend looks**.

---

# 94. Final Frontend Architecture

```text
                         React Application
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
          Pages             Components          Layouts
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                                ▼
                         Hooks / Context
                                │
                                ▼
                         API Service Layer
                                │
                                ▼
                              Axios
                                │
                                ▼
                       Express.js Backend
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
            PostgreSQL                  Qualcomm Cloud AI
```

---

# 95. Final Frontend Principle

MeetingOS frontend should make AI-generated meeting intelligence:

```text
Easy to understand
        +
Easy to verify
        +
Easy to correct
        +
Easy to act upon
```

The interface should never hide uncertainty simply to make the product look intelligent.

The frontend must clearly distinguish:

```text
What the meeting said
        ↓
What the AI extracted
        ↓
What was verified
        ↓
What the user changed
```

The core frontend experience is therefore:

```text
MESSY NOTES
     ↓
AI PROCESSING
     ↓
STRUCTURED MEETING
     ↓
VERIFIED ACTIONS
     ↓
EXECUTION WORKSPACE
```

This document defines the complete functional frontend contract.

Visual and branding decisions should be specified separately in:

```text
DESIGN.md
```
