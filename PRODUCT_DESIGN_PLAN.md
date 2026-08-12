# Naero — Product Design Plan

> **Author:** Lead Product Designer & Design Director
> **Status:** Draft v1 — Awaiting Approval
> **Date:** 2026-07-09

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [UX Philosophy](#2-ux-philosophy)
3. [Design Identity & Brand Personality](#3-design-identity--brand-personality)
4. [Visual Design System](#4-visual-design-system)
5. [Component Library Architecture](#5-component-library-architecture)
6. [Navigation & Information Architecture](#6-navigation--information-architecture)
7. [Screen-by-Screen Audit](#7-screen-by-screen-audit)
8. [AI Interaction Design Principles](#8-ai-interaction-design-principles)
9. [Accessibility & Internationalization](#9-accessibility--internationalization)
10. [Motion & Animation Design System](#10-motion--animation-design-system)
11. [Redesign Roadmap](#11-redesign-roadmap)
12. [Success Metrics](#12-success-metrics)

---

## 1. Product Vision

### The North Star

**Naero is an AI companion that helps immigrants and newcomers navigate their new life with confidence, clarity, and cultural belonging.**

Not a maps app. Not a chatbot. Not a social network. Not a government portal. Naero is the single, trusted companion that bridges the gap between "where you came from" and "where you're building your future."

### Core Value Propositions

| Pillar | What It Means | UX Implication |
|--------|--------------|----------------|
| **Guidance** | Step-by-step navigation of unfamiliar systems | Clear progressive disclosure, wizard patterns |
| **Belonging** | Cultural adaptation, community connection | Warm tone, human-centered copy, community woven in |
| **Clarity** | Complex info simplified by AI | Conversational UI, smart summaries, proactive tips |
| **Trust** | Reliable, private, always available | Transparent AI, clear data practices, consistent behavior |
| **Progression** | Tangible forward momentum in the user's journey | Milestones, achievements, "next step" clarity |

### Target User Personas

1. **New Arrival** — First 90 days in a new country. Needs housing, documentation, banking, language help. High anxiety, low confidence.
2. **Settling Immigrant** — 3–24 months in. Needs career, education, community, legal stability. Building a life.
3. **Established Resident** — 2+ years. Needs citizenship pathway, business setup, advanced career, giving back. Confident, looking to thrive.

---

## 2. UX Philosophy

### Principles

1. **Proactive, Not Reactive**
   - Naero anticipates needs before the user asks
   - Example: "You landed 3 days ago — want to set up your health insurance?"

2. **Conversational by Default, Structured by Choice**
   - Every task starts as a conversation
   - Complex workflows reveal structured forms only when needed
   - The AI is always visible, always accessible

3. **One Step Ahead**
   - Always show the next logical action
   - No dead ends. Every screen has a clear exit or next step
   - "What would you like to do next?" is the closing line of every flow

4. **Calm Technology**
   - No notification spam. No unnecessary interruptions.
   - Information is surfaced at the right moment, not all at once
   - Success feels quiet and satisfying, not loud and frantic

5. **Cultural Grace**
   - RTL support is first-class, not an afterthought
   - Content is culturally adaptive (holiday greetings, local customs)
   - Language switching is instant and does not reload the app

6. **Trust Through Transparency**
   - AI responses show confidence levels when relevant
   - Sources are cited for factual claims
   - "Why am I seeing this?" is always one tap away

### Emotional Design Goals

| Feeling | How We Achieve It |
|---------|------------------|
| **Welcomed** | Warm onboarding, mascot, human copy, first-name personalization |
| **Confident** | Clear next steps, progress indicators, achievement recognition |
| **Safe** | Calm colors, consistent layout, transparent AI, predictable navigation |
| **Understood** | Language matching, cultural adaptation, personalized content |
| **Empowered** | Actionable insights, skill-building, independence progression |

---

## 3. Design Identity & Brand Personality

### Brand Archetype: The Guide

Naero is a **Sage + Companion** — wise, knowledgeable, warm, never condescending. Think of a trusted older sibling who has been through this and can show you the way.

### Personality Spectrum

| Trait | Position | Opposite |
|-------|----------|----------|
| Warmth | High warmth, moderate formality | Cold, robotic |
| Authority | Knowledgeable but humble | Bossy, arrogant |
| Energy | Calm and steady | Hyper, frantic |
| Humor | Gentle, situational | Jokey, forced |
| Sophistication | Premium but accessible | Elitist, complex |

### Tone of Voice

| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Warm, encouraging | "Welcome home. Let's get you settled." |
| Error | Calm, solution-oriented | "Something went wrong. Don't worry — we'll try again." |
| Success | Quiet celebration | "Your SIN application is submitted. One step closer." |
| AI response | Clear, structured | "Here's what I found, organized by priority." |
| Notification | Gentle, minimal | "Time to renew your health card." |

### Visual Metaphor

**"A compass for your new life."**

The compass represents guidance, direction, and exploration. It appears subtly in:
- App icon / splash animation
- Empty states (compass resting, pointing to action)
- Loading indicators (compass needle oscillating)
- Achievement icons (compass variants)

---

## 4. Visual Design System

### 4.1 Color Architecture

#### Current Problem
Two separate theme files (`theme/index.js` and `theme/design-tokens.js`) with conflicting naming, values, and structure. Screens cherry-pick from both, creating visual chaos.

#### Proposal: Single Source of Truth

```js
// theme/index.js — THE ONLY theme file

palette: {
  // Core brand
  brand:        { 50: '#f0f7ff', 100: '#e0effe', ..., 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 900: '#1E3A5F' },
  accent:       { 400: '#6EE7B7', 500: '#10B981' },

  // Neutrals — dark-first (app is dark mode primary)
  neutral: {
    bg:          '#0A0A0F',    // Primary background
    surface:     '#14141F',    // Cards, sheets
    surfaceElevated: '#1C1C2E', // Modals, overlays
    border:      '#2A2A3E',    // Dividers, borders
    borderLight: '#3A3A4E',
    textPrimary: '#F8F9FA',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
  },

  // Semantic
  success:      '#10B981',
  warning:      '#F59E0B',
  error:        '#EF4444',
  info:         '#3B82F6',

  // Glass effects
  glass:        'rgba(20, 20, 31, 0.7)',
  glassBorder:  'rgba(255, 255, 255, 0.08)',
  glassHighlight: 'rgba(255, 255, 255, 0.03)',
}
```

**Key decisions:**
- Dark mode is the **default and only** theme (premium, immersive, battery-friendly)
- Light mode (future) is a separate concern — use CSS-like `light` key when needed
- No gradients anywhere unless motion-driven (scroll reveals, shimmer loading)
- Single accent color (`#10B981` emerald) — not blue, not purple. Emerald = growth, new beginnings, trust

#### Color Usage Rules

| Element | Token | Why |
|---------|-------|-----|
| Page background | `neutral.bg` | Deep dark for immersion |
| Cards | `neutral.surface` | Subtle elevation |
| Primary buttons | `brand[500]` on `neutral.bg` | Clear CTA |
| Destructive | `error` | Red only for errors/deletion |
| Success state | `success` | Green for completions |
| Links | `brand[400]` | Accessible on dark |
| AI messages | Tint of `brand[900]` | Subtle differentiation |
| User messages | `neutral.surfaceElevated` | Slight elevation |

### 4.2 Typography

#### Current Problem
Multiple font families loaded (`Inter_18pt-Regular`, `Inter_24pt-Regular`, `Inter_28pt-Regular`, `Poppins`, `ArimaMadurai`, `Tajawal`, `PlayfairDisplay`). No consistent hierarchy. AR fonts not systematically mapped.

#### Proposal: Streamlined System

```js
typography: {
  fontFamily: {
    primary:  'Inter',       // UI, body, everything
    display:  'PlayfairDisplay', // Headlines only (English)
    mono:     'JetBrainsMono', // Code, data
    arabic:   'Tajawal',     // Arabic text
  },

  sizes: {
    display:   { size: 34, lineHeight: 41, tracking: -0.5 },
    h1:        { size: 28, lineHeight: 34, tracking: -0.3 },
    h2:        { size: 22, lineHeight: 28, tracking: -0.2 },
    h3:        { size: 18, lineHeight: 24, tracking: 0 },
    body:      { size: 15, lineHeight: 22, tracking: 0 },
    bodySmall: { size: 13, lineHeight: 18, tracking: 0.1 },
    caption:   { size: 11, lineHeight: 16, tracking: 0.2 },
    label:     { size: 12, lineHeight: 16, tracking: 0.5, uppercase: true },
    legal:     { size: 10, lineHeight: 14, tracking: 0.3 },
  },
}
```

**Key decisions:**
- Inter for 95% of text — clean, legible, multi-script
- PlayfairDisplay reserved for hero moments (onboarding, empty states)
- Tajawal for Arabic (Tagalog, Urdu, etc. mapped per language)
- No font weights below 400 or above 700 in UI
- Dynamic Type / accessibility scaling supported

**RTL rules:**
- `textAlign` defaults to `left` in LTR, `right` in RTL
- Font family swaps automatically per language
- Line height adjusted for Arabic (taller ascenders)

### 4.3 Spacing & Rhythm

```js
spacing: {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
  massive: 64,
}

// Layout
layout: {
  screenPadding: 16,        // Consistent page padding
  cardPadding:   16,
  contentMaxWidth: 400,     // Readability constraint
  gutter:         12,       // Between cards in a grid
}
```

**Key decisions:**
- Base unit: 4px (consistent with iOS HIG and Material)
- Screen padding always 16px (never varies by screen)
- Card padding always 16px
- Content max-width of 400dp for readability on tablets

### 4.4 Border Radius

```js
radii: {
  none:    0,
  sm:      4,    // Inputs, small elements
  md:      8,    // Cards, buttons
  lg:      12,   // Sheets, modals
  xl:      16,   // Large cards, containers
  xxl:     24,   // Dialogs, overlays
  full:    9999, // Pill buttons, avatars
}
```

**Current problem:** Some cards use 16, some use 12, some use 24. Inconsistent.

### 4.5 Elevation & Depth

```js
elevation: {
  flat:     { shadowOpacity: 0 },
  low:      { shadowColor: '#000', shadowOffset: { y: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  medium:   { shadowColor: '#000', shadowOffset: { y: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
  high:     { shadowColor: '#000', shadowOffset: { y: 8 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 8 },
}
```

**Key decisions:**
- Flat design preferred (no shadows on cards — use borders instead)
- Shadows reserved for modals, sheets, overlays
- No excessive elevation — premium apps use subtle depth

### 4.6 Iconography

#### Current Problem
No consistent icon set. Mix of Material, custom SVGs, and emoji.

#### Proposal
- Single icon family: **Phosphor** (weight: regular for UI, fill for active states)
- Consistent 24x24dp grid
- Line weight: 1.5px for UI, 2px for navigation
- No colored icons in the tab bar (single color, active = brand)
- AI-related icons use a subtle glow ring (not a gradient)

---

## 5. Component Library Architecture

### 5.1 Design Token Consumption

Every component consumes tokens from `theme/index.js` only. No hardcoded colors, no raw values.

```jsx
// GOOD
<View style={{ backgroundColor: theme.colors.neutral.surface }} />

// BAD
<View style={{ backgroundColor: '#14141F' }} />
```

### 5.2 Component Hierarchy

```
Atoms
├── Text (wraps all typography variants, handles RTL, accessibility)
├── Icon (wraps Phosphor, handles size/color)
├── Divider (with optional label)
├── Spacer (fixed spacing)
├── Badge (count, dot, status)
└── Avatar (image, initials, fallback)

Molecules
├── Button (primary, secondary, tertiary, ghost, danger, icon, loading)
├── Input (text, search, textarea, with icon, with error, with counter)
├── Card (pressable, non-pressable, with image, action card)
├── ListItem (icon, text, chevron, subtitle)
├── Chip / Tag (filter, category, status)
├── Toggle / Switch
├── Radio / Checkbox
├── ProgressBar (linear, step indicator)
├── BottomSheet (draggable, with handle, snap points)
└── Toast (success, error, info, with action)

Organisms
├── ScreenLayout (safe area, scroll, keyboard avoid, sticky header)
├── EmptyState (icon, title, description, action, optional mascot)
├── LoadingState (skeleton, spinner, progress)
├── ErrorState (icon, message, retry, optional support link)
├── AIFloatingButton (draggable, with pulse, context-aware)
├── ChatBubble (AI vs user, with timestamp, sources)
├── SectionList (section header, item, spacing)
├── Modal (alert, confirmation, input, fullscreen)
├── Header (title, subtitle, back, action, large title mode)
└── TabBar (animated indicator, badge, custom labels)

Templates
├── AuthLayout (centered card, logo, decorative element)
├── OnboardingLayout (fullscreen, pagination, skip, next)
├── DashboardLayout (scrollable, widget grid)
├── DetailLayout (hero, content, sticky action)
└── SettingsLayout (grouped list, with icons)
```

### 5.3 ScreenLayout — The Single Screen Wrapper

Every screen MUST use `ScreenLayout` as its root. This ensures:
- Consistent safe area handling
- Consistent padding
- Keyboard avoidance
- Status bar style
- Analytics tracking

```jsx
<ScreenLayout
  title="Home"
  showHeader={false}
  scrollable={true}
  stickyHeader={true}
  bottomInset={true}
>
  {/* screen content */}
</ScreenLayout>
```

### 5.4 Empty / Loading / Error State Standard

Every data-fetching screen implements:

```jsx
if (loading) return <LoadingState type="skeleton" lines={6} />
if (error) return <ErrorState message={error} onRetry={refetch} />
if (!data || data.length === 0) return <EmptyState variant="home" action={{ label: 'Get Started', onPress }} />
return <Content data={data} />
```

**Empty state variants:**
| Variant | Icon | Title | Action |
|---------|------|-------|--------|
| `home` | Compass | "Your journey begins here" | Get started |
| `explore` | MapPin | "No places yet" | Explore nearby |
| `community` | Users | "Be the first to join" | Find groups |
| `services` | Briefcase | "No services yet" | Browse services |
| `jobs` | FileText | "No job matches yet" | Update profile |
| `notifications` | Bell | "All quiet" | — |
| `search` | MagnifyingGlass | "No results found" | Try different terms |

---

## 6. Navigation & Information Architecture

### 6.1 Current Problems

1. **5 bottom tabs** — Too many. Causes choice paralysis on a mobile screen.
2. **Tab labels are generic** — "Explore", "Services", "Community" don't convey value.
3. **No visual hierarchy** — All tabs are equal weight.
4. **Stack confusion** — Some screens push within tabs, some replace the stack.
5. **No deep linking strategy** — Can't share or return to specific content.

### 6.2 Proposed Architecture

```
Bottom Tabs (4 max)
├── Home (default) — Dashboard, AI suggestions, quick actions
├── Explore (renamed "Discover") — Places, services, content
├── Community — Groups, events, connections
└── Profile — Personal, settings, achievements

(Removed as tabs: Services → merged into Discover, Jobs → merged into Discover)
```

**Tab Bar Behavior:**
- Always visible except in modals and auth flow
- Animated active indicator (pill style, not line)
- Haptic feedback on tab switch (medium impact)
- Badge for unread notifications (merged into Profile tab)
- Support for long-press to quick-action (3+ actions per tab)

### 6.3 Screen Organization

```
Auth Stack (modal, no tabs)
├── Splash → Welcome → Onboarding → Auth
├── Auth (login / register / forgot password)

Main Stack (with tabs)
├── Home Tab
│   ├── Home (dashboard)
│   ├── AI Chat (fullscreen, from FAB)
│   ├── Notifications
│   └── Place/Service/Job Detail (modal or push)
│
├── Discover Tab
│   ├── Discover (map + list toggle)
│   ├── Category Detail
│   ├── Place Detail
│   ├── Service Detail
│   └── Job Detail
│
├── Community Tab
│   ├── Community Feed
│   ├── Group Detail
│   ├── Event Detail
│   └── Create Post (modal)
│
└── Profile Tab
    ├── Profile
    ├── Settings
    ├── About
    ├── Safety Center
    ├── Language
    └── Achievements

Standalone (no tabs, modal presentation)
├── Onboarding (first launch only)
├── Location Permission
├── Fullscreen AI Chat
├── Image Viewer
└── WebView (external links)
```

### 6.4 Deep Linking Strategy

```
naero://home
naero://discover/{category}
naero://community/{groupId}
naero://profile/settings
naero://chat
naero://place/{placeId}
naero://service/{serviceId}
```

---

## 7. Screen-by-Screen Audit

### 7.1 SplashScreen

**Issues:**
- Hardcoded text ("Naero")
- Solid background, no animation finesse
- No brand reveal moment

**Changes:**
- Animated logo reveal (compass icon drawn in, then wordmark fades)
- Subtle pulse animation
- No text other than brand
- Duration: max 1.5s

**Priority:** Low

---

### 7.2 WelcomeScreen

**Issues:**
- "Powered by AI" — tells, doesn't show
- Static illustration, no depth
- No personalization hook

**Changes:**
- Full-screen animated hero (compass illustration)
- Dynamic tagline based on language/locale
- "Continue" button at bottom — no skip, no back
- Soft entry animation for each element

**Priority:** Medium

---

### 7.3 OnboardingScreen

**Issues:**
- Uses FlatList for pagination (complex)
- No progress indicator
- Generic illustrations
- No cultural adaptation
- "Skip" is too prominent

**Changes:**
- 3 screens max (Welcome, Set Language, Permissions)
- Smooth animated transitions (not FlatList paging)
- Progress dots with brand color
- "Skip" smaller, at bottom
- "Get Started" as final CTA

**Priority:** Medium

---

### 7.4 AuthScreen

**Issues:**
- Full list of social buttons (cluttered)
- No brand differentiation
- Form feels like every other app

**Changes:**
- Centered card design (80% width max)
- Primary CTA: "Continue with Email" (or phone based on region)
- Secondary: Social options in a row (not a list)
- "Continue as Guest" at bottom (subtle)
- Animated brand element above the card
- Terms + Privacy below the fold (no blocking)

**Priority:** High

---

### 7.5 HomeScreen (Currently Redeemed)

**Status:** ✅ Acceptable as starting point. Needs evolution.

**Issues remaining:**
- AI FAB is a separate component — should feel more integrated
- Section headers could be more distinct
- No personalized greeting (uses name from profile)
- No quick actions row

**Evolution plan:**
- Add "Good morning, [Name]" dynamic header
- Add quick action pills below greeting (4 max)
- AI suggestions as horizontal cards (not vertical list)
- FAB merges into bottom of screen as a "pill" when scrolled up

**Priority:** Low (currently good)

---

### 7.6 ExploreScreen

**Issues:**
- Tab chaos (Top tab navigator inside a bottom tab)
- No map integration
- Category cards are inconsistent
- Search bar takes too much space
- "Popular Places" section has static data

**Changes:**
- Remove nested tab navigator
- Search bar: compact, expands on focus
- Category: horizontal scrollable pills (not cards)
- Map: optional toggle at top right
- List: clean cards with image, title, distance, rating
- Empty state: "Explore your new city" with compass

**Priority:** High

---

### 7.7 ServicesScreen

**Issues:**
- Duplicate of Explore pattern
- No differentiation between "places" and "services"
- Hardcoded service categories
- No booking or inquiry flow

**Changes:**
- **Merge into Discover tab** (remove as standalone tab)
- Services become a filterable category within Discover
- Service cards show provider, price range, availability
- Inquiry/booking as bottom sheet (not full screen)

**Priority:** High

---

### 7.8 CommunityScreen

**Issues:**
- Very basic list
- No groups, no events
- No sense of community
- No user-generated content

**Changes:**
- Feed-style layout (posts from groups/events)
- Top tabs: "Feed" | "Groups" | "Events"
- Group cards with member count, last active
- Event cards with date, location, RSVP
- Floating action button for "Create Post"
- Empty state: "Be the first to connect"

**Priority:** High

---

### 7.9 ProfileScreen

**Issues:**
- Dense, no hierarchy
- Settings mixed with profile info
- No achievements or progress
- No personalization

**Changes:**
- Profile header: avatar, name, member since, badge
- Stats row: places saved, communities joined, tasks completed
- Achievement section: recent unlocks
- Action list: Settings, Safety, Language, About
- Sign out: at very bottom, red but not destructive-styled
- Elegant empty avatar (initials on brand gradient)

**Priority:** Medium

---

### 7.10 AIScreen / AIFloatingButton

**Issues:**
- Separate screen for AI feels disconnected
- FAB can be intrusive
- No conversation history visible
- No personality in responses

**Changes:**
- AI is accessible from EVERY screen via a persistent FAB
- FAB design: small pill with "Ask Naero" text that collapses to icon
- FAB floats above tab bar, with snap-to-edge behavior
- Full-screen chat opens as modal from any screen
- Chat bubbles: AI = subtle brand tint, User = surfaceElevated
- AI avatar/icon consistently shows listening, thinking, responding states
- Typing indicator with compass animation
- Suggested prompts appear above input on open

**Priority:** High

---

### 7.11 SafetyScreen

**Issues:**
- Hidden in Profile stack (hard to find)
- Emergency info not prominent enough
- No quick-access feel
- Text-heavy

**Changes:**
- Accessible from Profile AND as a quick action on Home
- Emergency contacts at the top (one-tap call)
- Safety tips as expandable sections
- Local emergency numbers auto-detected
- Share location feature
- SOS button (prominent, red, with confirmation)

**Priority:** Medium

---

### 7.12 JobScreen

**Issues:**
- Basic list with no filtering
- No AI matching
- No application tracking
- No salary/requirements clarity

**Changes:**
- **Merge into Discover tab** (remove as standalone screen)
- Job cards: title, company, location, salary range, match %
- AI match score based on profile
- Filter bottom sheet: type, industry, location, experience
- Save/bookmark jobs
- Application status tracker

**Priority:** Medium

---

### 7.13 PlaceDetailScreen

**Issues:**
- Uses image background header (heavy)
- Hardcoded sample data
- No AI insight section
- No action buttons

**Changes:**
- Hero image (full-width, not background)
- Info section: name, rating, category, distance, address, hours
- AI Insight: "Why Naero recommends this" card
- Actions: Directions, Call, Website, Save, Share
- Reviews section (if available)
- Related places section

**Priority:** Medium

---

### 7.14 ServiceDetailScreen

**Issues:**
- Similar to PlaceDetail but with less polish
- No provider info
- No booking flow

**Changes:**
- Provider avatar + name + rating header
- Service description, price, duration
- Availability calendar (future)
- Book / Inquire button (sticky bottom)
- Reviews
- Related services

**Priority:** Medium

---

### 7.15 CommunityDetailScreen

**Issues:**
- Static group info
- No member list
- No activity feed

**Changes:**
- Group cover image + info header
- Member avatars row
- "About" expandable section
- Recent posts feed
- "Join Group" / "Leave Group" button
- Group rules section

**Priority:** Low

---

### 7.16 JobDetailScreen

**Issues:**
- Minimal content
- No application mechanism
- No matching insight

**Changes:**
- Job title + company + logo
- Key info: location, type, salary, posted date
- AI match percentage
- Description (formatted)
- "Apply" / "Save" buttons
- Similar jobs section

**Priority:** Low

---

### 7.17 NotificationsScreen

**Issues:**
- Hardcoded sample notifications
- No grouping
- No read/unread state
- No empty state

**Changes:**
- Grouped by date (Today, Yesterday, This Week, Earlier)
- Read/unread indicator (dot)
- Swipe to dismiss
- Tap to navigate to relevant screen
- Empty state: "All caught up" with bell icon
- "Mark all read" button

**Priority:** Medium

---

### 7.18 SettingsScreen

**Issues:**
- Basic toggles with no clarity
- No visual grouping
- Hardcoded labels

**Changes:**
- Grouped sections with headers: Account, Appearance, Privacy, Notifications, About
- Icon + label + value pattern
- Language picker with flag + name
- Dark mode toggle (irrelevant if always dark — hide)
- Clear description text
- Version at bottom

**Priority:** Low

---

### 7.19 AboutScreen

**Issues:**
- Sparse, no brand storytelling
- "About Naero" is just a phrase

**Changes:**
- Brand story section
- Version + build
- Developer / team info
- Open source licenses (expandable)
- Privacy Policy + Terms links
- "Made for newcomers, by [team]" footer

**Priority:** Low

---

### 7.20 LocationPermissionScreen

**Issues:**
- Standalone screen (breaks flow)
- No brand context
- Can feel scary (privacy)

**Changes:**
- Integrated into onboarding flow (not standalone)
- Clear why location is needed ("Find services near you")
- "Use precisely" vs "Use approximately" options
- "Skip for now" is prominent (not punished)
- Brand illustration with map pins

**Priority:** Low (depends on if standalone is removed)

---

## 8. AI Interaction Design Principles

### 8.1 The AI is Always There

- Persistent FAB on all main screens
- FAB shows contextual state: idle, listening, thinking, responding
- FAB can be dragged slightly (not full freedom — snaps to bottom-right)
- Opens as modal sheet, not a new screen (so user doesn't lose context)

### 8.2 Chat Design

```
┌─────────────────────────────────────┐
│  AI avatar + "Naero"   ● ● ●  [X]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ AI bubble                    │    │
│  │ With sources, actions       │    │
│  │ ┌─────────────────────────┐ │    │
│  │ │ Quick action: Open in…  │ │    │
│  │ └─────────────────────────┘ │    │
│  └─────────────────────────────┘    │
│                                     │
│              ┌──────────────────┐   │
│              │ User bubble      │   │
│              └──────────────────┘   │
│                                     │
│  ┌───── AI is typing ──────────┐   │
│  │ (compass pulse animation)   │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────┐      │
│  │ Suggest a question…       │ 🚀  │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

### 8.3 AI Response Design Rules

| Element | Rule |
|---------|------|
| **Length** | Max 3 paragraphs. Use bullet points for lists. |
| **Sources** | Numbered footnotes on factual claims. Tap to view. |
| **Actions** | Inline buttons for actionable responses ("Open Maps", "Send Email") |
| **Confidence** | Show confidence badge for predictions ("High confidence", "Verifying...") |
| **Personality** | First name greeting every 3rd interaction. Emoji-free except user uses them first. |
| **Error** | "I'm not sure about that. Would you like me to search the web?" |

### 8.4 Suggested Prompts

On open, show 3 contextual prompts based on current screen:

| Screen | Suggested Prompts |
|--------|-----------------|
| Home | "What should I do today?", "Help me find housing", "Translate this document" |
| Discover | "What's near me?", "Find Indian grocery stores", "Recommend a doctor" |
| Community | "Find groups near me", "How do I make friends here?" |
| Profile | "How's my progress?", "What benefits am I eligible for?" |

---

## 9. Accessibility & Internationalization

### 9.1 Accessibility Standards

- All touch targets ≥ 44x44dp
- All images have `accessibilityLabel`
- All interactive elements have `accessibilityRole`
- Screen reader announcements for dynamic content
- Sufficient color contrast (WCAG AA minimum)
- Reduced motion preference respected

### 9.2 RTL Strategy

- `I18nManager.allowRTL(true)` at app init
- All layout uses `start`/`end` not `left`/`right`
- Custom components test with Arabic content
- Tab bar reverses animation direction in RTL
- AI chat: messages align to opposite side in RTL

### 9.3 i18n Coverage Audit

**Current state:** ~60% of UI strings use i18n. 40% are hardcoded.

**Goal:** 100% i18n coverage. Every visible string goes through `t()`.

**Process:**
1. Add missing keys to all 4 locales (EN, AR, FR, HU)
2. Each screen file is audited for hardcoded strings
3. Template literal strings checked for RTL compatibility

---

## 10. Motion & Animation Design System

### 10.1 Principles

- **Purposeful** — Every animation has a reason (feedback, focus, delight)
- **Subtle** — No gratuitous motion. 200-300ms typical duration.
- **Consistent** — Same easing curves throughout (cubic-bezier(0.4, 0, 0.2, 1))
- **Performant** — `useNativeDriver: true` always. 60fps target.

### 10.2 Animation Tokens

```js
motion: {
  duration: {
    instant: 100,
    fast:    200,
    normal:  300,
    slow:    500,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decel:    'cubic-bezier(0.0, 0, 0.2, 1)',
    accel:    'cubic-bezier(0.4, 0, 1, 1)',
  },
  spring: {
    gentle:  { damping: 20, stiffness: 100 },
    snappy:  { damping: 14, stiffness: 200 },
  },
}
```

### 10.3 Component Animation Spec

| Component | Animation | Duration | Notes |
|-----------|-----------|----------|-------|
| Page transition | Slide (iOS) / Fade (Android) | 300ms | Platform-native feel |
| Card appear | Fade + translateY(20) | 400ms | Staggered by index |
| Button press | Scale to 0.97 | 100ms | Instant feedback |
| FAB appear | Scale from 0 | 200ms | Spring easing |
| Tab switch | Pill indicator slides | 250ms | Follows gesture |
| Loading | Skeleton shimmer | 1500ms | Looping, subtle |
| Toast in/out | TranslateY from top | 250ms | Auto-dismiss after 3s |
| Modal open | Slide up + backdrop fade | 300ms | Decel easing |
| AI thinking | Compass pulse | 800ms | Looping, gentle |
| Pull to refresh | Compass arc fill | 1000ms | Matches pull distance |

### 10.4 Reduced Motion

```js
const prefersReducedMotion = useAccessibilityInfo().reduceMotionEnabled;
const duration = prefersReducedMotion ? 0 : motion.duration.normal;
```

---

## 11. Redesign Roadmap

### Phase 0: Foundation (Week 1)

| Task | Owner | Dependencies |
|------|-------|-------------|
| Consolidate theme into single `theme/index.js` | Design | None |
| Create design token documentation | Design | Theme consolidation |
| Build `ScreenLayout` component | Engineering | None |
| Build `Text` component with all variants | Engineering | Theme consolidated |
| Build `Button` component system | Engineering | Theme consolidated |
| Build `EmptyState`, `LoadingState`, `ErrorState` | Engineering | Theme consolidated |
| Build `Card` base component | Engineering | Theme consolidated |
| Audit and fix all `useNativeDriver` usage | Engineering | None |

**Milestone:** Design system primitives ready. All screens use ScreenLayout.

---

### Phase 1: Core UX (Week 2)

| Task | Priority | Impact |
|------|----------|--------|
| Redesign AuthScreen | High | First impression for all users |
| Redesign ExploreScreen (Discover) | High | Core engagement screen |
| Merge Services + Jobs into Discover | High | Simplifies navigation |
| Implement AI FAB across all screens | High | Core differentiator |
| Redesign AI Chat interface | High | Core differentiator |
| Rebuild navigation (4 tabs, new IA) | High | Information architecture |

**Milestone:** New navigation live. AI FAB works globally. Auth feels premium.

---

### Phase 2: Community & Content (Week 3)

| Task | Priority | Impact |
|------|----------|--------|
| Redesign CommunityScreen (with Groups + Events) | High | Engagement driver |
| Redesign NotificationsScreen | Medium | User retention |
| Redesign Place/Service/Job Detail screens | Medium | Content consumption |
| Implement i18n coverage (fill missing strings) | Medium | International users |
| Add empty states to all screens | Medium | UX completeness |

**Milestone:** Community is functional. Detail screens are premium. i18n at 100%.

---

### Phase 3: Profile & Personalization (Week 4)

| Task | Priority | Impact |
|------|----------|--------|
| Redesign ProfileScreen (with achievements) | Medium | User identity |
| Redesign SettingsScreen | Low | Usability |
| Redesign SafetyScreen (SOS + emergency) | Medium | User safety |
| Implement suggested prompts (contextual AI) | High | AI engagement |
| Add personalized greeting on Home | Low | Delight |

**Milestone:** Profile is a destination, not a settings dump. AI is context-aware.

---

### Phase 4: Polish & Performance (Week 5)

| Task | Priority | Impact |
|------|----------|--------|
| Motion audit (all animations) | Medium | Polished feel |
| Accessibility audit (screen reader, contrast) | Medium | Inclusive design |
| RTL audit (all screens in Arabic) | High | RTL users |
| Splash/Welcome/Onboarding refresh | Low | First impression |
| Tab bar animation and haptics | Low | Delight |
| Loading states (skeleton screens everywhere) | Medium | Perceived performance |

**Milestone:** App feels premium, accessible, and performant.

---

### Phase 5: Future (Month 2+)

| Feature | Notes |
|---------|-------|
| Light mode (secondary theme) | After dark mode is stable |
| Widgets (iOS home screen, Android app widgets) | Engagement |
| In-app notifications (not just push) | Retention |
| Voice input for AI | Accessibility |
| Offline mode | Reliability |
| Tablet layout | Responsive design |

---

## 12. Success Metrics

### Qualitative (Weekly)

- User testing: "How does this app make you feel?"
- Trust score: "Would you recommend Naero to a friend?"
- Clarity score: "Do you know what to do next?"

### Quantitative (Monthly)

| Metric | Current | Target (3 months) |
|--------|---------|-------------------|
| DAU/MAU ratio | ? | >40% |
| Session duration | ? | >5 min |
| AI interaction rate | ? | >60% of sessions |
| Screen completion rate | ? | >80% |
| Crash-free rate | ? | >99.5% |
| App Store rating | ? | >4.5 |
| RTL user satisfaction | ? | >4.0 / 5.0 |

---

## Appendix A: Style Guide Examples

### Card Component Specification

```
┌─────────────────────────────────────┐
│ [image]                             │
│                                     │
│ Title                    ★ 4.5     │
│ Subtitle · 1.2 km away             │
│                                     │
│ Tag  Tag  Tag                       │
│                                     │
│ [Save]                    [Action]  │
└─────────────────────────────────────┘

Spacing: 16px padding
Radius: 12px (lg)
Background: neutral.surface
Border: 1px neutral.border (no shadow)
Image height: 160px (landscape)
Image radius: 8px top
Typography: h3 for title, bodySmall for subtitle
```

### Button Component Specification

```
Primary
┌──────────────────────┐
│   Label     →        │
└──────────────────────┘
Bg: brand[500]
Text: white
Radius: 12px (lg)
Padding: 16px h, 14px v
Height: 48px
Font: label (12px, uppercase, 0.5 tracking)

Secondary
┌──────────────────────┐
│   Label     →        │
└──────────────────────┘
Bg: neutral.surfaceElevated
Text: textPrimary
Border: 1px neutral.border
Radius: 12px (lg)

Ghost
┌──────────────────────┐
│   Label     →        │
└──────────────────────┘
Bg: transparent
Text: brand[400]
No border
Radius: 12px (lg)
```

---

## Appendix B: File Cleanup Checklist

| File | Action |
|------|--------|
| `src/theme/index.js` | ✅ Keep — consolidate all tokens here |
| `src/theme/design-tokens.js` | ❌ Delete — merge into index.js |
| `src/components/ActionButton.js` | ❌ Delete — replaced by Button |
| `src/components/BrandedButtons.js` | ❌ Delete — replaced by Button |
| `src/components/GlassCard.js` | ❌ Delete — replaced by Card |
| `src/components/CategoryGrid.js` | 🔄 Refactor — use Card + Grid |
| `src/components/ListingCard/*` | 🔄 Refactor — use Card variants |
| `src/components/ScreenHeader.js` | ❌ Delete — merged into ScreenLayout |
| `src/components/SectionHeader.js` | ❌ Delete — use Text component |
| `src/components/LoadingState.js` | 🔄 Refactor — match new design |
| `src/components/EmptyState.js` | 🔄 Refactor — match new design |
| `src/components/LogoHeader.js` | ❌ Delete — no longer needed |
| `src/components/NaeroMascot.js` | 🔄 Refactor — compass-focused |
| `src/components/SocialAuthButton.js` | ❌ Delete — replaced by Button |
| `src/components/AIFloatingButton.js` | 🔄 Refactor — new design |
| `src/components/LanguageModal.js` | 🔄 Refactor — inline picker |
| `src/hooks/*` | Review — ensure no theme duplication |

---

> **Next Step:** Review and approve this Product Design Plan. Once approved, I will begin implementation in Phase 0 order.
