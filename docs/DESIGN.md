# DESIGN.md

# MeetingOS — Design System & Visual Specification

## 1. Document Overview

This document defines the complete visual design system for **MeetingOS**.

The frontend architecture and functional behavior are defined in:

```text
FRONTEND.md
```

This document defines:

- Visual identity
- Design philosophy
- Neobrutalism system
- Color palette
- Typography
- Spacing
- Borders
- Shadows
- Buttons
- Cards
- Inputs
- Tables
- Badges
- Modals
- Navigation
- Dashboard visual hierarchy
- Meeting workspace design
- AI result presentation
- Evidence presentation
- Dependency graph styling
- Responsive visual behavior
- Accessibility-related visual requirements
- Animation and interaction principles
- Iconography
- Empty/loading/error states
- Design tokens
- Tailwind implementation guidance

The design must be consistent across the entire product.

---

# 2. Design Direction

## Primary Design Style

**Neobrutalism**

MeetingOS should use a modern, polished interpretation of Neobrutalism rather than an overly playful or chaotic version.

The visual identity should communicate:

```text
Bold
+
Technical
+
Trustworthy
+
Direct
+
Structured
+
Confident
```

The product deals with AI-generated information and meeting execution, so the interface must balance the raw visual character of Neobrutalism with strong information hierarchy.

---

# 3. Design Philosophy

The interface should follow five principles:

## 3.1 Bold

Important information should be visually obvious.

## 3.2 Structured

The interface should feel organized even when the source meeting notes are messy.

## 3.3 Honest

The UI must clearly communicate uncertainty.

Examples:

```text
Unassigned
Unknown
Needs Review
Conflict Detected
```

## 3.4 Action-Oriented

The most important information is:

```text
What was decided?
What needs to be done?
Who owns it?
When is it due?
```

## 3.5 Human + Machine

The interface should make AI feel like a powerful assistant rather than an invisible black box.

---

# 4. Why Neobrutalism

Neobrutalism is particularly suitable for MeetingOS because it gives the product a distinctive identity.

Traditional AI dashboards often look:

```text
Minimal
Soft
Gradient-heavy
Generic
```

MeetingOS should instead feel:

```text
Tactile
Bold
Editorial
Confident
Memorable
```

The visual system should use:

- Strong borders
- Hard shadows
- High contrast
- Large typography
- Flat surfaces
- Intentional asymmetry
- Clear cards
- Bold labels
- Strong hierarchy

However, excessive decoration should be avoided.

The interface is a productivity application first.

---

# 5. Recommended Color Scheme

## Primary Palette

The recommended palette is:

```text
Ink Black
#111111

Warm Cream
#FFF8E7

Electric Yellow
#FFD93D

Coral Red
#FF6B6B

Electric Blue
#4D96FF

Mint Green
#6BCB77

Soft Lavender
#B8A1FF

White
#FFFFFF
```

The core visual combination should be:

```text
Warm Cream + Black + Electric Yellow
```

with:

```text
Blue
Green
Coral
Lavender
```

used as functional accents.

---

# 6. Why This Color Palette

## Warm Cream

```text
#FFF8E7
```

This should be the primary application background.

Reason:

- Less harsh than pure white
- Works naturally with Neobrutalism
- Gives the interface a paper/editorial feeling
- Makes black borders and shadows visually strong
- Creates a distinctive identity

---

## Ink Black

```text
#111111
```

Used for:

- Text
- Borders
- Primary buttons
- Icons
- Strong visual anchors
- Shadows

Black should be the strongest structural color.

---

## Electric Yellow

```text
#FFD93D
```

Primary accent.

Used for:

- Primary CTA emphasis
- AI-related highlights
- Important cards
- Selected states
- Attention without implying danger

Yellow should become a recognizable part of the MeetingOS identity.

---

## Electric Blue

```text
#4D96FF
```

Used for:

- Links
- Information
- Navigation states
- Interactive elements
- Secondary actions
- Dependency relationships

Blue communicates information rather than urgency.

---

## Mint Green

```text
#6BCB77
```

Used for:

- Completed actions
- Verified results
- Success states
- Positive confirmations

Green should represent successful or verified information.

---

## Coral Red

```text
#FF6B6B
```

Used for:

- Errors
- Conflicts
- Overdue actions
- Destructive actions
- Important warnings

Red must not be used merely for decoration.

---

## Soft Lavender

```text
#B8A1FF
```

Used sparingly for:

- AI-related secondary surfaces
- Advanced features
- Experimental/semantic features
- Secondary visual differentiation

---

## White

```text
#FFFFFF
```

Used for:

- Cards where needed
- Modal surfaces
- Input backgrounds
- High-priority content surfaces

---

# 7. Semantic Color System

The application should map colors to meaning.

| Meaning | Color |
|---|---|
| Primary | Electric Yellow |
| Information | Electric Blue |
| Success / Verified | Mint Green |
| Warning / Review | Electric Yellow |
| Error / Conflict | Coral Red |
| AI / Advanced | Soft Lavender |
| Neutral | Warm Cream |
| Structure / Text | Ink Black |

Never communicate meaning through color alone.

Use:

```text
Color + Icon + Text
```

for important states.

---

# 8. Color Usage Ratio

A rough visual balance:

```text
Warm Cream / Neutral surfaces: 55–65%
White surfaces: 10–15%
Ink Black: 10–15%
Yellow: 5–10%
Blue / Green / Coral / Lavender: 5–10%
```

The accent colors should remain accents.

The product should not look like a rainbow dashboard.

---

# 9. Typography

## Primary Font

Use:

```text
Space Grotesk
```

for the primary interface.

Why:

- Modern
- Technical
- Strong geometric character
- Excellent for product interfaces
- Fits Neobrutalism without becoming cartoonish

## Secondary / Utility Font

Use:

```text
Inter
```

for:

- Dense data
- Tables
- Metadata
- Supporting text
- Long-form meeting content

If reducing font complexity is preferred, Space Grotesk can be used throughout.

---

# 10. Typography Hierarchy

Recommended scale:

```text
Display:
48–64px

H1:
40–48px

H2:
32–36px

H3:
24–28px

H4:
20–22px

Body Large:
18px

Body:
16px

Body Small:
14px

Caption:
12px
```

Exact responsive values may vary.

---

# 11. Typography Rules

Headings:

```text
Bold
High contrast
Short
Direct
```

Examples:

```text
Your Meetings
Action Items
Meeting Summary
Decisions
Needs Review
```

Avoid overly long headings.

Body text should remain highly readable.

---

# 12. Font Weights

Recommended:

```text
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
Extra Bold: 800
```

Neobrutalist headings may use:

```text
700–800
```

but body text should remain comfortable to read.

---

# 13. Text Style

Use sentence case for most UI.

Prefer:

```text
Create meeting
```

instead of:

```text
CREATE MEETING
```

Uppercase can be used selectively for:

- Small labels
- Status indicators
- Category labels

---

# 14. Layout Philosophy

The layout should feel structured but not overly symmetrical.

Use:

```text
Strong grids
Clear sections
Large whitespace
Hard boundaries
Intentional offsets
```

Avoid:

```text
Overly dense dashboards
Excessive floating cards
Too many gradients
Excessive glassmorphism
```

---

# 15. Grid System

Desktop:

```text
12-column grid
```

Tablet:

```text
8-column grid
```

Mobile:

```text
4-column grid
```

Recommended content width:

```text
max-width: 1440px
```

Main content should not become excessively wide.

---

# 16. Spacing System

Use a consistent spacing scale based on multiples of 4.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
80px
96px
```

Primary layout spacing should generally use:

```text
16
24
32
48
64
```

---

# 17. Border System

Borders are a core part of the Neobrutalist identity.

Default border:

```text
2px solid #111111
```

Strong border:

```text
3px solid #111111
```

Use 2px as the default.

Use 3px for:

- Hero sections
- Important cards
- Primary CTA
- Selected components
- Major panels

Avoid thin 1px borders for primary Neobrutalist components.

---

# 18. Border Radius

Neobrutalism should use relatively sharp corners.

Recommended:

```text
Small:
4px

Default:
8px

Large:
12px
```

Avoid excessive:

```text
24px
32px
9999px
```

Rounded pill shapes should be reserved for badges/tags where appropriate.

---

# 19. Shadow System

Use hard-offset shadows rather than soft blurred shadows.

Primary:

```text
4px 4px 0 #111111
```

Large:

```text
6px 6px 0 #111111
```

Hero:

```text
8px 8px 0 #111111
```

Avoid large blurred shadows.

Neobrutalism should feel physical and tactile.

---

# 20. Interaction Shadow

Buttons and cards can shift when interacted with.

Default:

```text
box-shadow: 4px 4px 0 #111111;
```

Pressed:

```text
transform: translate(2px, 2px);
box-shadow: 2px 2px 0 #111111;
```

This creates tactile interaction.

---

# 21. Buttons

## Primary Button

Primary action:

```text
Background: Electric Yellow
Text: Ink Black
Border: 2px Ink Black
Hard Shadow: 4px 4px Ink Black
```

Example:

```text
+ Create Meeting
```

---

## Secondary Button

```text
Background: White
Text: Ink Black
Border: 2px Ink Black
Hard Shadow: 4px 4px Ink Black
```

---

## Destructive Button

```text
Background: Coral Red
Text: Ink Black
Border: 2px Ink Black
Hard Shadow: 4px 4px Ink Black
```

---

## Success Button

```text
Background: Mint Green
Text: Ink Black
Border: 2px Ink Black
Hard Shadow: 4px 4px Ink Black
```

---

# 22. Button Dimensions

Default:

```text
Height: 44–48px
Padding: 12px 20px
```

Large CTA:

```text
Height: 52–56px
Padding: 16px 24px
```

Small button:

```text
Height: 36–40px
Padding: 8px 14px
```

---

# 23. Button States

Every button should support:

```text
Default
Hover
Focus
Pressed
Disabled
Loading
```

Hover should not rely only on color.

Possible hover behavior:

```text
Translate -1px
Shadow remains strong
```

Pressed:

```text
Translate +2px
Reduced shadow
```

---

# 24. Inputs

Inputs should feel like physical fields.

Default:

```text
Background: White
Border: 2px Ink Black
Radius: 8px
```

Focus:

```text
Border remains strong
Visible focus ring
```

Error:

```text
Coral border / error indicator
```

Success:

```text
Mint indicator
```

---

# 25. Textarea

Meeting notes textarea is a major input.

It should:

- Have a large usable area
- Support comfortable long-form typing
- Clearly indicate focus
- Preserve whitespace
- Provide character/size guidance where appropriate

Recommended minimum desktop height:

```text
300px
```

---

# 26. File Upload

The upload zone should use:

```text
2px dashed black border
```

and a strong neutral or accent surface.

Interaction:

```text
Default
Hover / Drag over
Selected
Error
Uploading
```

The selected file should become a clearly structured card.

---

# 27. Cards

Cards are central to the design.

Default:

```text
Background: White
Border: 2px solid #111111
Shadow: 4px 4px 0 #111111
Radius: 8px
```

Cards should have enough internal spacing.

Avoid excessive card nesting.

---

# 28. Accent Cards

Important cards may use:

```text
Yellow
Blue
Green
Lavender
```

Examples:

### AI Summary

Yellow

### Verified

Green

### Decision

Blue

### AI / Advanced

Lavender

### Conflict

Coral

---

# 29. Meeting Card

A meeting card should display:

```text
Meeting title
Date
Short summary
Action count
Decision count
Processing state
```

Visual hierarchy:

```text
Title
↓
Summary
↓
Metadata
```

The entire card should be clickable when appropriate.

---

# 30. Action Card

Action cards should emphasize the action itself.

Structure:

```text
┌────────────────────────────────────┐
│ Prepare API documentation          │
│                                    │
│ Owner: Rahul                       │
│ Due: Oct 10                        │
│ Priority: High                     │
│ Status: In Progress                │
│                                    │
│ [View Evidence]                    │
└────────────────────────────────────┘
```

The action text should have the strongest hierarchy.

---

# 31. Action Status Colors

```text
Todo:
Neutral / Blue

In Progress:
Blue

Completed:
Mint Green

Blocked:
Coral Red
```

Status should include both:

```text
Color + Label
```

---

# 32. Priority Colors

```text
Low:
Neutral

Medium:
Yellow

High:
Coral
```

Priority should not overpower the action itself.

---

# 33. Badges

Badges should use:

```text
2px border
Small radius
Bold label
Compact padding
```

Example:

```text
VERIFIED
HIGH
IN PROGRESS
UNASSIGNED
NEEDS REVIEW
```

Avoid excessive pill styling.

---

# 34. AI Confidence Indicator

Confidence should be presented as a secondary visual signal.

Example:

```text
Confidence
94%
High
```

Possible visual treatment:

```text
High → Green
Medium → Yellow
Low → Coral
```

But always include text.

---

# 35. Verification Badge

Possible states:

```text
✓ Verified
! Needs Review
× Conflict Detected
? Unsupported
```

Use:

```text
Icon + Text
```

rather than color alone.

---

# 36. Evidence Viewer

Evidence should appear as a quote-like source panel.

Example:

```text
Supporting Evidence

"Rahul will prepare the final API
documentation by Friday."

Source: Meeting notes
```

Visual style:

```text
White / neutral surface
2px black border
Left accent bar
```

The evidence should feel clearly connected to the AI result.

---

# 37. Ambiguity Notice

Example:

```text
┌─────────────────────────────────────┐
│ ⚠ Needs clarification               │
│                                     │
│ The owner of this action was not    │
│ identified in the meeting.          │
│                                     │
│ Owner: Unassigned                   │
└─────────────────────────────────────┘
```

Use yellow as the primary visual signal.

---

# 38. Conflict Notice

Example:

```text
┌─────────────────────────────────────┐
│ ✕ Conflict detected                 │
│                                     │
│ Two different deadlines were found. │
└─────────────────────────────────────┘
```

Use coral.

---

# 39. AI Processing UI

The AI processing screen should feel active but not distracting.

Possible visual structure:

```text
┌────────────────────────────────────┐
│                                    │
│        Processing Meeting          │
│                                    │
│  ✓ Reading notes                   │
│  ✓ Extracting actions              │
│  ● Verifying evidence              │
│  ○ Preparing results               │
│                                    │
└────────────────────────────────────┘
```

Use progressive status indicators.

Avoid excessive animations.

---

# 40. Dashboard Design

The dashboard should prioritize:

```text
Create Meeting
        ↓
Recent Meetings
        ↓
Current Actions
```

The dashboard should not feel like a corporate analytics product.

Avoid:

```text
10+ KPI cards
Large graphs
Unnecessary percentages
```

MeetingOS is an execution workspace, not an analytics dashboard.

---

# 41. Dashboard Hero

The dashboard can have a strong Neobrutalist introductory section.

Example:

```text
TURN MEETINGS
INTO ACTION.

Your conversations are messy.
Your execution doesn't have to be.

[ + Create Meeting ]
```

The exact copy can be finalized during implementation.

---

# 42. Navigation Design

Navigation should be visually strong but compact.

Possible structure:

```text
MEETINGOS

Dashboard
Meetings
Actions
Ask My Meetings

────────────

Settings

User
```

Use clear active states.

Active navigation may use:

```text
Yellow background
Black border
Small offset
```

---

# 43. Header

The application header should contain:

```text
Current page / context
Optional search
User menu
```

The header should not consume excessive vertical space.

---

# 44. Meeting Workspace

The Meeting Detail page should feel like the central workspace.

Visual hierarchy:

```text
Meeting title
        ↓
Summary
        ↓
Action items
        ↓
Decisions
        ↓
Questions
        ↓
Dependencies
```

Verification and evidence should be accessible throughout.

---

# 45. Meeting Header Visual Treatment

Use a strong hero-style block.

Possible:

```text
Warm Cream background
Black border
Hard shadow
Yellow accent
```

The meeting title should be prominent.

Metadata should be visually secondary.

---

# 46. Summary Design

The summary should be presented in a visually distinct card.

Recommended:

```text
Yellow accent surface
Black border
Hard shadow
```

The summary should not look like raw AI text.

It should feel like the key takeaway.

---

# 47. Action Board

Actions can be displayed as cards or a structured list.

Recommended hierarchy:

```text
Action
Owner
Deadline
Priority
Status
```

Avoid making every metadata field visually equal.

---

# 48. Action Table

For desktop-heavy workflows, a table may be used.

Columns:

```text
Action
Owner
Deadline
Priority
Status
Confidence
```

The action column should have the largest width.

On mobile, transform rows into cards.

---

# 49. Decisions Design

Decisions should have a distinct visual identity.

Recommended:

```text
Blue accent
Black border
Strong decision label
Evidence access
```

Example:

```text
DECISION

Use PostgreSQL as the primary database.

[View Evidence]
```

---

# 50. Questions Design

Questions should appear less visually dominant than decisions.

Use neutral or blue-accent surfaces.

Example:

```text
QUESTION

Do we need authentication before beta?

Status: Open
```

---

# 51. Dependency Graph Design

The dependency graph should follow the Neobrutalist visual language.

Nodes:

```text
White or accent background
2px black border
Hard shadow
```

Edges:

```text
Black
2px
```

Selected node:

```text
Yellow accent
```

Blocked relationship:

```text
Coral
```

Completed relationship:

```text
Green
```

The graph should remain readable when many actions exist.

---

# 52. Graph Controls

React Flow controls should be visually customized to match the design system.

Controls should include:

```text
Zoom In
Zoom Out
Fit View
```

Avoid default browser-looking controls if they visually conflict with the system.

---

# 53. Modals

Modals should use:

```text
White background
2–3px black border
Hard shadow
8–12px radius
```

They should feel like physical panels.

Examples:

```text
Delete confirmation
Edit action
Evidence
Meeting comparison
```

---

# 54. Modal Backdrop

Use a strong but simple backdrop.

Avoid excessive blur.

The content should remain visually dominant.

---

# 55. Dropdowns

Dropdown menus should use:

```text
White background
2px black border
Hard shadow
```

Menu items should have clear hover/focus states.

---

# 56. Tabs

Tabs should be bold and clearly separated.

Active tab:

```text
Yellow
Black border
```

Inactive:

```text
Neutral
```

Tabs should not rely only on subtle underline changes.

---

# 57. Tooltips

Tooltips should be used sparingly.

They are useful for:

- Icon-only buttons
- Technical terminology
- Graph controls

Do not hide essential information inside tooltips.

---

# 58. Icons

Use a consistent icon library.

Recommended:

```text
Lucide React
```

Icons should be:

```text
Simple
Geometric
Consistent stroke width
```

Avoid mixing multiple icon styles.

---

# 59. Icon Rules

Icons should support text rather than replace it.

Prefer:

```text
✓ Verified
```

over:

```text
✓
```

for important statuses.

Icon-only controls are acceptable for:

```text
Close
More
Zoom
Back
```

when accessible labels are provided.

---

# 60. Illustration Style

If illustrations are used, they should follow:

```text
Flat
Bold outlines
Simple geometry
Limited colors
Editorial
```

Avoid:

```text
Generic AI robot illustrations
Stock illustrations
3D corporate imagery
Excessive gradients
```

---

# 61. Empty States

Empty states should use simple visual compositions.

Example:

```text
No meetings yet.

Turn your first conversation
into structured action.

[Create Meeting]
```

The visual should remain consistent with Neobrutalism.

---

# 62. Error States

Errors should be direct.

Example:

```text
Something went wrong.

We couldn't process this meeting.

[Try Again]
```

Use Coral carefully.

Do not make the entire screen red.

---

# 63. Loading States

Use:

```text
Skeletons
Progress indicators
Status steps
```

Avoid generic infinite spinners everywhere.

For AI processing, step-based progress is preferred.

---

# 64. Hover Behavior

Hover should be noticeable but controlled.

Possible behavior:

```text
Card:
translate(-1px, -1px)

Button:
translate(-1px, -1px)
```

Do not make components jump significantly.

---

# 65. Animation

Animation should be purposeful.

Use:

```text
150–250ms
```

for common transitions.

Examples:

- Button press
- Modal appearance
- Card hover
- Navigation changes
- Expand/collapse

Avoid:

- Excessive bouncing
- Constant motion
- Large page transitions
- Distracting AI animations

---

# 66. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

When enabled:

- Remove unnecessary transitions
- Reduce animation
- Keep functional feedback

---

# 67. Responsive Design

## Desktop

Use:

```text
12-column grid
```

Large information panels can sit side-by-side.

## Tablet

Reduce:

```text
Columns
Card density
Navigation width
```

## Mobile

Use:

```text
Single-column layout
Stacked cards
Compact navigation
Full-width primary actions
```

---

# 68. Mobile Navigation

Mobile navigation should not permanently consume large screen space.

Possible pattern:

```text
Header
  ↓
Menu button
  ↓
Navigation drawer
```

The exact interaction can be decided during implementation.

---

# 69. Mobile Cards

Cards should become full-width.

Avoid horizontal scrolling unless the content genuinely requires it.

Action tables should transform into cards.

---

# 70. Accessibility Visual Rules

The design must target:

```text
WCAG 2.1 AA
```

Important requirements:

- Minimum contrast requirements
- Visible focus states
- Do not use color alone
- Readable font sizes
- Clear error states
- Accessible interactive elements

Neobrutalism must not compromise usability.

---

# 71. Focus State

Focus should be highly visible.

Recommended:

```text
3px solid Electric Blue
```

with an offset.

Keyboard users must always know where focus is.

---

# 72. Color Contrast

Important text should use:

```text
Ink Black on Warm Cream
Ink Black on Yellow
Ink Black on Green
Ink Black on Coral
White only when necessary
```

Avoid low-contrast combinations such as:

```text
Light gray on cream
Yellow text on white
Lavender text on white
```

---

# 73. Design Tokens

The design system should expose tokens.

## Colors

```css
--color-ink: #111111;
--color-cream: #FFF8E7;
--color-white: #FFFFFF;

--color-yellow: #FFD93D;
--color-blue: #4D96FF;
--color-green: #6BCB77;
--color-coral: #FF6B6B;
--color-lavender: #B8A1FF;
```

## Borders

```css
--border-default: 2px solid #111111;
--border-strong: 3px solid #111111;
```

## Shadows

```css
--shadow-sm: 3px 3px 0 #111111;
--shadow-md: 4px 4px 0 #111111;
--shadow-lg: 6px 6px 0 #111111;
--shadow-xl: 8px 8px 0 #111111;
```

## Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

---

# 74. Tailwind Theme Mapping

The Tailwind configuration should map the design tokens.

Conceptually:

```js
colors: {
  ink: "#111111",
  cream: "#FFF8E7",
  white: "#FFFFFF",
  yellow: "#FFD93D",
  blue: "#4D96FF",
  green: "#6BCB77",
  coral: "#FF6B6B",
  lavender: "#B8A1FF"
}
```

The project should prefer semantic names over arbitrary colors.

---

# 75. Surface Hierarchy

Use a small number of surface levels.

```text
Level 0:
Warm Cream page

Level 1:
White cards

Level 2:
Accent cards

Level 3:
Modal / focused surface
```

Do not create many subtle gray surface variations.

---

# 76. Visual Hierarchy

The user should immediately understand:

```text
What page am I on?
        ↓
What meeting am I viewing?
        ↓
What actions exist?
        ↓
Who owns them?
        ↓
What is due?
        ↓
What was decided?
        ↓
What needs review?
```

Visual weight should follow this hierarchy.

---

# 77. Trust Hierarchy

MeetingOS has a special information hierarchy:

```text
Original Evidence
       ↓
Verified Information
       ↓
AI Extraction
       ↓
Confidence
```

The design should never imply:

```text
Confidence = Truth
```

Evidence and verification should have stronger trust semantics.

---

# 78. Visual Language for AI

Avoid the generic pattern:

```text
Everything purple = AI
```

Instead:

```text
Yellow = primary product identity
Lavender = AI/advanced accent
Green = verified
Blue = information
Coral = issue
```

This makes the product more mature and less stereotypically "AI".

---

# 79. Visual Language for Uncertainty

Use:

```text
Yellow + warning icon + explanatory text
```

for:

```text
Needs Review
Ambiguous
Unknown
```

Use:

```text
Coral + issue icon + explanatory text
```

for:

```text
Conflict
Error
Overdue
```

---

# 80. Visual Language for Success

Use:

```text
Green + check icon + label
```

for:

```text
Completed
Verified
Saved
Processed
```

---

# 81. Visual Language for Information

Use:

```text
Blue + information icon
```

for:

```text
Information
Question
Dependency information
Helpful context
```

---

# 82. Design Do's

## Do

- Use strong black borders.
- Use hard shadows.
- Use warm cream as the main background.
- Use yellow as the signature accent.
- Use color semantically.
- Keep cards structured.
- Make actions visually prominent.
- Make uncertainty obvious.
- Use bold typography.
- Maintain generous spacing.
- Keep the UI functional.

---

# 83. Design Don'ts

## Don't

- Use excessive gradients.
- Use glassmorphism.
- Use giant rounded cards.
- Use excessive blur.
- Use soft shadows everywhere.
- Use too many accent colors simultaneously.
- Turn every component into a card.
- Make the UI look like a toy.
- Hide important information behind hover.
- Use color as the only status indicator.
- Over-animate the interface.

---

# 84. Landing Page Visual Direction

If a marketing/landing page is included, it should introduce MeetingOS through a bold statement.

Possible visual hierarchy:

```text
MEETINGOS

TURN CONVERSATIONS
INTO EXECUTION.

[Create Your First Meeting]

        ↓

Messy Notes → AI → Verified Actions
```

The hero should strongly establish the Neobrutalist identity.

---

# 85. Landing Page Sections

Potential sections:

```text
Hero
↓
Problem
↓
How It Works
↓
AI Extraction
↓
Evidence & Verification
↓
Action Workspace
↓
Dependency Graph
↓
Call to Action
```

The landing page should remain focused.

---

# 86. How It Works Visual

Use a simple 4-step visual:

```text
01
Capture

02
Understand

03
Verify

04
Execute
```

Each step can use a distinct semantic accent.

---

# 87. Brand Personality

MeetingOS should feel:

```text
Smart
Bold
Direct
Technical
Reliable
Human
```

It should not feel:

```text
Corporate
Overly formal
Generic AI
Childish
Chaotic
```

---

# 88. Overall Visual Personality

The final visual identity should feel like:

```text
A modern productivity tool
+
An editorial design system
+
A developer-focused product
+
Neobrutalist physical UI
```

The product should be memorable without sacrificing usability.

---

# 89. Recommended Primary Visual Combination

The strongest default combination is:

```text
Background:
Warm Cream #FFF8E7

Text:
Ink Black #111111

Primary CTA:
Electric Yellow #FFD93D

Information:
Electric Blue #4D96FF

Success:
Mint Green #6BCB77

Warning:
Electric Yellow #FFD93D

Error:
Coral Red #FF6B6B

AI / Advanced:
Soft Lavender #B8A1FF
```

This combination should be considered the canonical MeetingOS palette unless future testing shows a usability problem.

---

# 90. Final Design System

```text
                    MEETINGOS
                       │
              NEOBRUTALIST SYSTEM
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
   Bold Type      Black Borders     Hard Shadows
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                 Warm Cream Base
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Yellow         Blue        Green
       Primary        Info        Success
          │
          ├────────── Coral → Error
          │
          └──────── Lavender → AI
```

---

# 91. Final Design Principle

MeetingOS should look **bold without being chaotic**.

The design should make the user feel:

> "I can immediately see what happened in this meeting, what needs to happen next, and whether I can trust the information."

The visual system should therefore reinforce:

```text
CLARITY
   +
TRUST
   +
ACTION
   +
IDENTITY
```

The signature MeetingOS design language is:

```text
Warm Cream
+
Ink Black
+
Electric Yellow
+
Neobrutalist Borders
+
Hard Shadows
+
Bold Typography
+
Evidence-First UI
```

This is the canonical visual direction for the product.
