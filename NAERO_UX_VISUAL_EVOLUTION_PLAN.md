# Naero V2 — UX Visual Evolution Plan

> A comprehensive plan to transform Naero from a functional template into a recognizable, premium product — not just another beautiful app.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Principles (Authoritative)](#2-design-principles-authoritative)
3. [Research Synthesis](#3-research-synthesis)
4. [Current State Audit](#4-current-state-audit)
5. [Recommended Direction: "Guided Compass"](#5-recommended-direction-guided-compass)
6. [Implementation Order](#6-implementation-order)
7. [Phase Details](#7-phase-details)
8. [Safe Migration Strategy](#8-safe-migration-strategy)

---

## 2. Design Principles (Authoritative)

> These principles override all other design decisions. Every screen, component, and animation must pass these filters.

### 2.1 Product Identity
Naero must become a **recognizable product**, not just a beautiful app. The visual identity must communicate:
- **Trust** — the app is reliable, professional, safe
- **Guidance** — the app knows the way, like a knowledgeable friend
- **Intelligence** — the AI is alive, aware, helpful
- **Hope** — new beginnings are possible, progress is visible
- **Simplicity** — complexity is hidden, the path is clear
- **Human warmth** — not clinical, not playful, not childish

### 2.2 Compass as Core Design Language
The compass is Naero's **core design language** — used subtly and intentionally.
- Appears in: AI thinking states, empty states, splash screen, brand moments
- Never used as: wallpaper, decoration, background pattern, repetitive motif
- Rule: **If the compass doesn't improve understanding, it doesn't belong**

### 2.3 Color Discipline
- **Emerald (`#10B981`)** is the sole primary accent — for AI, CTAs, active states
- **Amber (`#D4A040`)** is a **semantic accent** — only for saved items, progress, achievements, warm guidance
- Amber is **not** a second primary color — it appears only where the user has invested effort
- **Cyan is eliminated** — replaced entirely by emerald
- Typography + whitespace carry hierarchy, not color

### 2.4 Screen Differentiation
Each screen must have its **own purpose** while belonging to the same design system.
- No two screens should look identical
- Cards, layouts, and visual treatments vary by screen context
- The design system provides tokens and components, not rigid templates

### 2.5 AI as Living Presence
The AI must feel **alive** throughout the app:
- Contextual greetings based on time, city, user stage
- Dynamic suggestions that evolve with usage
- Journey progress visualization
- Personalized guidance based on user profile
- Meaningful empty states that guide, not stare
- Subtle AI thinking/listening/responding states

### 2.6 Typography-First Hierarchy
Typography carries the visual hierarchy:
- **No oversized cards** — cards serve content, not ego
- **No oversized icons** — icons are functional, not decorative
- **Whitespace is intentional** — every pixel of space serves a purpose
- Font weight + size replace color as primary structure

### 2.7 Purposeful Animation
Every animation must **improve understanding**:
- Entrance animations communicate "this is new"
- Press feedback communicates "this is interactive"
- Loading states communicate "this is working"
- **No decorative animations** — if it doesn't help the user understand, it doesn't play

### 2.8 Emotional Tone
The app must feel:
- **Premium** but not cold
- **Warm** but not playful
- **Friendly** but not childish
- **Professional** but not sterile

### 2.9 Screen Design Protocol
Before redesigning any screen, define:
1. **User's goal** — what is the user trying to accomplish?
2. **Emotional goal** — how should the user feel?
3. **Primary action** — the one thing the screen exists for
4. **Secondary action** — supporting action
5. **Success state** — what does "done" look like?

### 2.10 Quality Gates
- Every phase ends with: **Android build → Real device testing → QA report → APK path**
- Screens are tested **one at a time** on a real device before moving to the next
- No parallel screen redesigns
- **Stability is never sacrificed for visuals**

---

## 1. Executive Summary

### The Problem
Naero's current interface is **functional but emotionally flat**. It works reliably — no crashes, clean navigation, proper data flow — but feels like a well-structured template rather than a premium companion. The visual identity is generic dark-mode-with-teal that could belong to any app. Every screen uses identical card styling. Typography is uniform-weight and low-contrast. There is no motion language, no compass signature, no warmth, and no AI presence beyond the chat screen.

### The Opportunity
Naero serves a uniquely emotional use case: **people starting a new life in a new country**. This audience needs calm, trust, warmth, and guidance — not a cold dashboard. The app's visual design should feel like a knowledgeable friend who knows the city, not a settings screen.

### The Approach
We will evolve Naero's design through **8 phases** over the existing codebase, preserving all functionality, navigation, and backend logic. Each phase is self-contained and testable. No big-bang rewrite.

### Key Metrics
- Visual consistency across all 18 screens
- Reduced visual monotony (card differentiation)
- Added motion on 0/18 screens → 15/18 screens
- Unified token system (eliminate dual-system)
- Compass brand signature present on 8+ surfaces
- AI presence visible on Home, Discover, and Detail screens

---

## 2. Research Synthesis

### What World-Class Apps Do Differently (2024-2026)

#### A. Premium AI Apps (ChatGPT, Claude, Pi, Perplexity)
- **Phase-aware thinking**: Visible "searching → reading → writing" states, not generic spinner
- **Personality through restraint**: Pi asks clarifying questions; Claude is warm-but-professional; neither uses avatars or personas
- **Off-white text on dark**: `#FAFAFA` not `#FFFFFF` — softer for long reading
- **Thinking blocks**: Claude shows collapsible thinking with duration and word count
- **Stop-generation as primary control**: Send button morphs into Stop during stream
- **Generative UI**: Charts, cards, and forms render inline — not just text
- **Suggested follow-ups**: Pre-generated chips below responses, phrased as questions

**Naero takeaway**: AI presence should be visible throughout the app, not just in the chat screen. Thinking states should feel alive, not generic.

#### B. Fintech Apps (Revolut, Monzo, Wise, N26)
- **Single accent, ruthlessly held back**: Monzo's coral fills the *card*, not the button. Wise's lime-green is the sole accent
- **Two-mode canvas**: Full-bleed dark storytelling bands against lighter catalogue rows
- **Brand color as object**: The accent identifies the *result*, not the *action*
- **Trust through transparency**: Wise shows exact fees before commitment — "nothing to hide" rendered as interface
- **Typography confidence**: Heavy display weights (Wise 900, Monzo 800), tight letter-spacing on headlines
- **Warm dark themes**: Linear iterated from cool to warm grays in 2026 — "crisp but less saturated"

**Naero takeaway**: Emerald accent should be used surgically — for AI interactions, key CTAs, and brand moments. Cards should have varied visual treatments, not uniform styling.

#### C. Travel & Navigation (Airbnb, Google Maps, Duolingo)
- **Dual-state home**: Discovery mode vs. active-trip mode — same app, different hierarchy
- **Map-first spatial investment**: Bottom sheet with peek/half/full detents
- **Progressive disclosure**: 5-6 filters visible, full set behind "More filters"
- **Trust distributed through journey**: Badges, reviews, verification appear at relevant moments
- **Skeleton screens**: Grey shapes matching loaded layout — "loading" not "broken"
- **Date-optional search**: Browse without commitment, "from $X/night" anchoring

**Naero takeaway**: Home screen should have two modes (new arrival vs. settled). Discover should show distance and context. Trust signals should appear at journey moments.

#### D. Productivity (Linear, Notion, Things 3)
- **Typography IS hierarchy**: Font weight + size replace color as primary structure
- **Constraint-driven identity**: Linear chose keyboard-first; Notion chose block-based
- **Empty states as designed surfaces**: Title → why → CTA → keyboard hint
- **Optimistic UI**: Changes reflect instantly, sync in background
- **Warm dark themes**: Linear moved to warmer gray in 2026 refresh
- **Reduced visual noise**: "Structure should be felt not seen"

**Naero takeaway**: Typography should carry hierarchy. Empty states should guide, not stare. Loading should feel instant through optimistic UI patterns.

#### E. Newcomer Services (Welcome to the Jungle, Settle, Expatica)
- **Quiz-first onboarding shapes everything**: 5-minute quiz → AI-analyzed profile → personalized content
- **"Stop searching, start matching"**: Personal assistant framing over database
- **Task-based dashboard**: Mandatory vs. optional tasks — users feel in control
- **Emotional safety framing**: "Feel-good everyday support" not "emotional crisis"
- **Concrete language**: "Missing family," "language barriers" outperform abstract terms
- **Context before people**: Groups/activities first, not individual profiles (avoids dating-app association)

**Naero takeaway**: Onboarding should be a personalized journey, not a one-screen choice. Home should show contextual guidance based on the user's arrival stage.

#### F. Accessibility (Apple HIG, Material Design 3, BBC GEL)
- **4.5:1 minimum text contrast**, 3:1 for interactive controls
- **Typography-first hierarchy**: Works universally; color-only fails for 8% of males
- **`prefers-reduced-motion`**: All animations have static fallback
- **Three-tier border opacity**: Strong (sections), default (internal), subtle (lightest)
- **Tabular figures**: `font-variant-numeric: tabular-nums` for counts and prices
- **`text-wrap: balance`** for titles, `pretty` for prose

**Naero takeaway**: Full RTL support using `marginInlineEnd`, `paddingInlineStart`. Typography must carry hierarchy independently of color.

---

### Cross-Cutting Insights

| Principle | Source | Naero Application |
|-----------|--------|-------------------|
| Restraint over decoration | All categories | ONE accent (emerald), minimal borders, typography does hierarchy |
| Trust through transparency | Fintech, AI | Show data sources, show AI reasoning, show costs |
| Progressive disclosure | Travel, Productivity | Reveal complexity as users demonstrate readiness |
| Warm over clinical | 2025-2026 shift | Warm grays, off-white text, warm-toned accents |
| Typography as hierarchy | Productivity, Accessibility | Font weight + size replace color as primary structure |
| Empty states as surfaces | Productivity | Every empty state has title + why + CTA |
| Single accent held back | Fintech | Emerald for AI + CTAs only, never decorative |

---

## 3. Current State Audit

### Systemic Issues (App-Wide)

| Issue | Severity | Impact |
|-------|----------|--------|
| **Dual token systems** | Critical | `COLORS/FONTS` vs `colors/type` — screens use different systems, causing visual inconsistency |
| **No animation language** | High | Only 3/18 screens have real animation. No entrance, press, or transition motion |
| **Identical card styling** | High | Every card uses `COLORS.card` + `COLORS.cardBorder` — no visual differentiation |
| **No skeleton loading** | Medium | `ActivityIndicator` or nothing — no shimmer placeholders |
| **No pull-to-refresh** | Medium | Only NotificationsScreen has it. Home, Discover, Community, Jobs lack it |
| **Hardcoded strings** | Medium | "Salem" greeting, "v1.0.0", "Naero UX v2" — not from i18n |
| **Silent error swallowing** | Medium | `catch {}` in HomeScreen — errors disappear |
| **No keyboard handling** | Medium | CommunityDetailScreen comment input lacks `KeyboardAvoidingView` |
| **Dead code** | Low | AIScreen debug toggle, empty useEffect, non-functional buttons |

### Screen-by-Screen Weakness Summary

| Screen | Lines | Priority | Key Weakness |
|--------|-------|----------|-------------|
| SplashScreen | 79 | Medium | Zero brand personality — logo on black, no atmosphere |
| WelcomeScreen | 317 | High | Compat tokens, small logo, flat background, "UX v2" label |
| AuthScreen | 455 | High | Mixed tokens, invisible tab switcher, generic inputs |
| **HomeScreen** | 555 | **Critical** | Hardcoded name, identical cards, flat AI card, no skeletons |
| DiscoverScreen | 478 | High | Monotonous cards, small search, no map, basic category pills |
| **AIScreen** | 777 | **Critical** | Debug overlay in prod, generic bubbles, no markdown, tiny avatar |
| **CommunityScreen** | 133 | **Critical** | Near-placeholder, no post creation, no tabs, logo as avatar |
| ProfileScreen | 630 | High | Logo avatar, non-functional edit, wall of 8 menu items |
| NotificationsScreen | 273 | Medium | No grouping, `Math.random()` keys, no swipe actions |
| SettingsScreen | 261 | Medium | Only 4 items, broken notification handler, sparse |
| AboutScreen | 206 | Low | Hardcoded version, static, no team/story |
| PlaceDetailScreen | 366 | High | Broken image placeholder, no map preview, no reviews |
| ServiceDetailScreen | 244 | High | No images, text-heavy, no reviews, identical action bar |
| JobDetailScreen | 270 | High | No company logo, mailto apply, no similar jobs |
| CommunityDetailScreen | 284 | High | Local-only likes/comments, no keyboard handling |
| LocationPermissionScreen | 288 | Medium | Auto-skip logic, text-heavy card |
| JobsScreen | 286 | Medium | No search, broken filter button, no pull-to-refresh |
| **SafetyScreen** | 271 | **Critical** | No SOS button, no map, generic tips |

### What Works Well (Preserve)
- Navigation structure (stack + tabs) is solid
- Data flow through AppContext is clean
- i18n framework is in place
- RTL layout foundation exists
- Dark theme canvas is consistent
- AI integration (RAG toggle, source badges) is thoughtful
- Emergency contacts grid concept is good
- Expandable safety tips pattern works

---

## 4. Three Style Directions

### Direction A: "Living Atlas"

**Philosophy**: The compass is alive. Every surface subtly references navigation, exploration, and discovery. The app feels like a premium travel companion that happens to have AI.

**Visual Language**:
- **Background**: Deep navy with subtle topographic line pattern (very low opacity, ~3%)
- **Cards**: Two tiers — elevated surfaces use `#111827`, standard surfaces use `#0F172A`. Cards have 1px border at `rgba(255,255,255,0.06)` with category-specific left-border accent color
- **Typography**: Inter Tight for display (headlines), Inter for body. Display at weight 700 with -0.5px letter-spacing. Body at weight 400 with 0.2px tracking. Line-height: 1.2 for display, 1.5 for body
- **Accent**: Single emerald `#10B981` used ONLY for: AI interactions, primary CTAs, active states, and the compass needle. Never decorative
- **Surfaces**: Three depth levels — Canvas (`#070B14`), Surface (`#0F172A`), Elevated (`#1A1D33`)
- **Compass signature**: Subtle compass rose watermark at 2-3% opacity on section headers. Compass needle as the AI activity indicator
- **Motion**: Spring-based entrances (damping: 15, stiffness: 200). Cards slide up 20px with opacity fade on appear. Tab switches cross-fade. AI thinking shows compass needle rotating
- **Empty states**: Compass illustration (line art) + descriptive text + CTA
- **AI presence**: Subtle emerald glow behind AI-related elements. AI card on Home has gradient border (`emerald → transparent`). Chat thinking state shows compass needle pulse

**Emotional Goal**: "You have a guide. You are not lost."

**Pros**: Strong brand identity, compass metaphor is natural for navigation/relocation, premium feel
**Cons**: Topographic pattern may be complex to implement, compass watermark needs careful opacity tuning

---

### Direction B: "Warm Horizon"

**Philosophy**: The app feels like golden hour — warm, calm, trustworthy. Premium darkness softened by warm tonal shifts. Inspired by N26's warm canvas and Claude's warm accents.

**Visual Language**:
- **Background**: Warm dark `#0C0F1A` (slightly warm-shifted from pure navy)
- **Cards**: Warm surfaces `#141822` with very subtle warm tint. Card borders at `rgba(255,248,240,0.06)` — warm white instead of cold white
- **Typography**: Inter for everything. Display at weight 600 (not 700/800) — softer, more approachable. Body at weight 400. Both with warm off-white `#F5F0EB` instead of pure white
- **Accent**: Emerald `#10B981` + warm amber `#D4A040` as secondary accent. Amber used for: saved/bookmarked items, progress indicators, warmth cues. Emerald for: AI, CTAs, active states
- **Surfaces**: Warm-toned three levels — Canvas (`#0C0F1A`), Surface (`#141822`), Elevated (`#1C2030`)
- **Compass signature**: Minimal — compass icon only in the AI greeting and splash screen. No watermark pattern
- **Motion**: Gentle spring (damping: 18, stiffness: 120). Slower, calmer transitions. Cards fade in with 10px upward drift. AI thinking shows warm pulse
- **Empty states**: Warm illustration style + encouraging text + CTA
- **AI presence**: Warm emerald glow on AI card border. Thinking state shows gentle breathing animation. Responses feel warm through typography choices

**Emotional Goal**: "You are safe here. Take your time."

**Pros**: Warmth matches the newcomer use case, amber secondary adds emotional range, feels human
**Cons**: Two accents risks splitting attention, warm dark is harder to calibrate for all screens

---

### Direction C: "Structured Clarity"

**Philosophy**: Linear-inspired calm. Structure through typography and spacing, not color. Every pixel serves a purpose. The app feels like a premium productivity tool designed for life administration.

**Visual Language**:
- **Background**: Pure dark `#09090B` (zinc-950)
- **Cards**: Zinc surfaces `#18181B` (zinc-900) with 1px border `rgba(255,255,255,0.08)`. No shadows, no gradients — depth from border hierarchy only
- **Typography**: Inter for everything. Display at weight 600 with -1px letter-spacing. Body at weight 400. Text color: `#FAFAFA` (zinc-50) for primary, `#A1A1AA` (zinc-400) for secondary
- **Accent**: Single emerald `#10B981` — used exclusively for interactive elements and AI. Never for decoration, never for status
- **Surfaces**: Minimal three levels — Canvas (`#09090B`), Surface (`#18181B`), Elevated (`#27272A`)
- **Compass signature**: None — identity through typography and restraint, not iconography
- **Motion**: Minimal. Transform-only entrances. 150ms ease-out for interactions. No ambient animation
- **Empty states**: Text-only — title + description + CTA button. No illustrations
- **AI presence**: Subtle. Emerald dot for active AI. Thinking state is text-only ("Thinking..."). Chat is clean and functional

**Emotional Goal**: "Everything is organized. You are in control."

**Pros**: Extremely clean, fast to implement, accessible, minimal risk
**Cons**: May feel too cold/clinical for the newcomer use case, no brand personality, no compass identity

---

## 6. Implementation Order

| Phase | Scope | Screen | Device Test |
|-------|-------|--------|-------------|
| **Phase 0** | Theme & Tokens | N/A | ✅ |
| **Phase 1** | Component Library | N/A | ✅ |
| **Phase 2** | Home refinement | HomeScreen | ✅ |
| **Phase 3** | Discover | DiscoverScreen | ✅ |
| **Phase 4** | AI Chat | AIScreen | ✅ |
| **Phase 5** | Community | CommunityScreen | ✅ |
| **Phase 6** | Profile | ProfileScreen | ✅ |
| **Phase 7** | Utility screens | Settings, Notifications, Safety | ✅ |
| **Phase 8** | Final polish | All screens | ✅ |

**Rules:**
- Sequential execution — one phase at a time
- Each phase ends with Android build + real device test + QA report + APK path
- No parallel screen redesigns
- Stability never sacrificed for visuals

---

## 5. Recommended Direction: "Guided Compass"

**Hybrid of Direction A + B** — combining the compass identity and structural clarity with warm tonal shifts.

### Why This Direction

1. **Naero's identity IS navigation**: A compass metaphor is not decoration — it's the core metaphor for people finding their way in a new country
2. **Warmth matches the audience**: Newcomers need calm and trust, not just efficiency
3. **Single primary accent, warm secondary**: Emerald stays dominant; warm amber adds warmth only where it matters (saved items, progress, warmth)
4. **Typography-first hierarchy**: Following Linear's lesson, weight + size do the work
5. **Compass as functional signature**: The compass appears in AI states, empty states, and the splash — not as wallpaper but as a living, animated element

### The "Guided Compass" Design Tokens

```js
// ═══════════════════════════════════════════════════════════════════════════════
// Naero "Guided Compass" Design Tokens
// ═══════════════════════════════════════════════════════════════════════════════

export const TOKENS = {

  // ─── CANVAS (Background depth levels) ──────────────────────────────────
  canvas:     '#070B14',   // Deepest — app background
  surface:    '#0F172A',   // Cards, sheets, panels
  elevated:   '#1A1D33',   // Modals, dropdowns, active cards
  overlay:    'rgba(0,0,0,0.65)',

  // ─── ACCENT (Primary — Emerald) ────────────────────────────────────────
  accent:     '#10B981',   // AI, CTAs, active states, compass needle
  accentSoft: 'rgba(16,185,129,0.12)',  // Backgrounds behind accent content
  accentBorder: 'rgba(16,185,129,0.25)', // Borders around accent elements
  accentGlow: 'rgba(16,185,129,0.15)',  // Subtle glow behind AI elements

  // ─── WARM (Secondary — Amber) ──────────────────────────────────────────
  warm:       '#D4A040',   // Saved, bookmarked, progress, warmth
  warmSoft:   'rgba(212,160,64,0.10)',
  warmBorder: 'rgba(212,160,64,0.20)',

  // ─── TEXT ───────────────────────────────────────────────────────────────
  textPrimary:   '#F5F0EB',  // Warm off-white — softer than pure white
  textSecondary: '#94A3B8',  // Descriptions, labels
  textTertiary:  '#64748B',  // Hints, placeholders
  textMuted:     '#475569',  // Disabled, watermark
  textLink:      '#10B981',  // Links, interactive text

  // ─── BORDER ─────────────────────────────────────────────────────────────
  borderSubtle:  'rgba(255,255,255,0.06)',   // Card borders, dividers
  borderDefault: 'rgba(255,255,255,0.10)',   // Active borders, inputs
  borderStrong:  'rgba(255,255,255,0.15)',   // Section boundaries

  // ─── STATUS ─────────────────────────────────────────────────────────────
  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#3B82F6',

  // ─── SPACING (8px grid) ────────────────────────────────────────────────
  space: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
  },

  // ─── RADIUS ─────────────────────────────────────────────────────────────
  radius: {
    sm: 8,    // Small elements (badges, chips)
    md: 12,   // Cards, inputs
    lg: 16,   // Large cards, modals
    xl: 20,   // Hero elements
    full: 9999, // Pills, avatars
  },

  // ─── TYPOGRAPHY ─────────────────────────────────────────────────────────
  type: {
    // Display — headlines, hero text
    display: {
      size: 28, weight: '700', lineHeight: 34, tracking: -0.5,
    },
    // Title — section headers, card titles
    title: {
      size: 20, weight: '600', lineHeight: 26, tracking: -0.3,
    },
    // Subtitle — card subtitles, descriptions
    subtitle: {
      size: 16, weight: '500', lineHeight: 22, tracking: 0,
    },
    // Body — primary reading text
    body: {
      size: 15, weight: '400', lineHeight: 22, tracking: 0.1,
    },
    // Caption — labels, metadata
    caption: {
      size: 13, weight: '500', lineHeight: 18, tracking: 0.2,
    },
    // Small — badges, tags
    small: {
      size: 11, weight: '600', lineHeight: 14, tracking: 0.4,
    },
    // Tab — bottom navigation
    tab: {
      size: 11, weight: '600', lineHeight: 14, letterSpacing: 0.3,
    },
  },

  // ─── MOTION ─────────────────────────────────────────────────────────────
  motion: {
    // Standard transitions
    duration: 200,
    spring: { damping: 15, stiffness: 200, mass: 1 },
    // Gentle transitions (loading, breathing)
    gentle: { damping: 18, stiffness: 120, mass: 1 },
    // Quick feedback (press, toggle)
    fast: { duration: 100 },
  },

  // ─── SHADOWS (Minimal — depth from borders, not shadows) ────────────────
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  },
};
```

### The "Guided Compass" Visual Rules

1. **Emerald is for AI and CTAs only** — never decorative, never status, never background
2. **Amber is for saved/progress/warmth** — only where the user has invested effort
3. **Typography carries hierarchy** — weight + size, not color + decoration
4. **Three border strengths** — subtle (cards), default (inputs), strong (sections)
5. **Cards are differentiated** — hero cards get gradient borders, standard cards get flat borders, compact cards get no borders
6. **Compass appears functionally** — AI thinking (rotating), empty states (illustration), splash (hero). Never wallpaper
7. **Motion is purposeful** — entrance animations on appear, press feedback on touch, breathing on AI thinking. No idle animation
8. **Warm off-white for all text** — `#F5F0EB` not `#FFFFFF`. Softer on eyes, warmer in feel
9. **Empty states guide** — compass illustration + title + description + CTA. Never blank
10. **Skeleton loading** — shimmer placeholders matching layout shape. Never just a spinner

---

## 6. Design System Evolution

### Phase 0: Token Unification (Foundation)

**Goal**: Eliminate the dual token system. One source of truth.

**Changes to `src/theme/index.js`**:
- Keep existing `COLORS`, `FONTS`, `SPACING`, `RADIUS`, `SHADOWS` exports
- Update values to match "Guided Compass" tokens
- Remove `colors`, `type`, `spacing`, `radii`, `motion` compat exports
- Add new exports: `ACCENT`, `WARM`, `BORDER`, `TEXT`, `DEPTH`
- Migrate all screens to use unified tokens

**Migration strategy**:
1. Add new token exports alongside old ones
2. Update screens one-by-one to use new tokens
3. Remove old compat exports last
4. Never both in the same file

**Risk**: Import errors if screens reference removed tokens
**Mitigation**: Grep all files for old token usage before removing

### Phase 1: Component Library Expansion

**New components needed** (see Section 8 for full spec):
- `Skeleton` — shimmer loading placeholder
- `Avatar` — user image with fallback icon
- `Badge` — status/count indicators
- `Toast` — non-blocking notifications
- `BottomSheet` — modal bottom content
- `SectionHeader` — consistent section titles
- `EmptyState` — compass-themed empty state
- `CompassIcon` — animated compass for AI states
- `Card` — variant system (hero/standard/compact)

### Phase 2: Typography Upgrade

**Current issue**: Uniform weight (700/800) throughout, no visual rhythm

**New hierarchy**:
| Level | Weight | Size | Use |
|-------|--------|------|-----|
| Display | 700 | 28px | Screen titles, hero text |
| Title | 600 | 20px | Section headers, card titles |
| Subtitle | 500 | 16px | Descriptions, secondary headers |
| Body | 400 | 15px | Reading text, paragraphs |
| Caption | 500 | 13px | Labels, metadata, timestamps |
| Small | 600 | 11px | Badges, tags, tab labels |

**Key changes**:
- Headlines: 700 weight with -0.5px tracking (tight, confident)
- Body: 400 weight with 0.1px tracking (open, readable)
- All text: `#F5F0EB` (warm off-white) for primary
- Monospace for any numeric data

### Phase 3: Card Differentiation System

**Current**: Every card identical (`COLORS.card` + `COLORS.cardBorder`)

**New card variants**:
| Variant | Use | Style |
|---------|-----|-------|
| Hero | AI card, featured content | Gradient border (emerald → transparent), elevated surface, subtle glow |
| Standard | List items, results | Flat border, surface bg, 12px radius |
| Compact | Tags, chips, metadata | No border, transparent bg, 8px radius |
| Warm | Saved items, bookmarks | Amber left-border accent, warmSoft bg |
| Interactive | Tappable actions | Press feedback (scale 0.98 + opacity), border highlight |

### Phase 4: Empty/Loading/Error States

**Skeleton loading pattern**:
- Shimmer animation on gray rectangles matching layout
- Duration: 1.5s loop
- Color: `rgba(255,255,255,0.04)` → `rgba(255,255,255,0.08)` → `rgba(255,255,255,0.04)`
- Applied to: Home cards, Discover results, Job cards, Community posts

**Empty state pattern**:
- Compass line-art illustration (64px, `textTertiary` color)
- Title: Bold, 16px, `textPrimary`
- Description: Regular, 14px, `textSecondary`
- CTA: ActionButton with emerald accent
- Applied to: Every FlatList/ScrollView empty state

**Error state pattern**:
- Error icon (alert-circle, 48px, `error` color)
- Title: "Something went wrong"
- Description: Specific error when available
- CTA: "Try again" button
- Applied to: All data-fetching screens

---

## 7. Screen-by-Screen Roadmap

### Phase 1: Foundation Screens (Week 1)

#### SplashScreen (Current: 79 lines → Target: ~100 lines)
- **Current weakness**: Logo on black, zero personality
- **Emotional goal**: "Welcome to something premium and safe"
- **Changes**:
  - Larger logo (140px → 160px) with emerald glow pulse behind it
  - Background: subtle radial gradient from `canvas` to slightly lighter center
  - Brand tagline reveal: "Your compass for a new beginning" fades in below logo after 300ms
  - First launch: 100ms longer hold for brand imprint
  - `useNativeDriver: true` for all animations (already fixed)
- **Components needed**: None new
- **Risk**: Low — isolated screen, no dependencies

#### WelcomeScreen (Current: 317 lines → Target: ~350 lines)
- **Current weakness**: Compat tokens, flat background, "UX v2" label, small logo
- **Emotional goal**: "This app is alive, intelligent, and welcoming"
- **Changes**:
  - Migrate from compat tokens to unified tokens
  - Full-screen gradient background with subtle mesh/aurora effect (2-3 overlapping radial gradients at very low opacity)
  - Larger logo (140px) with emerald glow
  - Animated tagline: "Your AI companion for every new beginning" with staggered word reveal
  - Remove "Naero UX v2" → replace with "Naero" in `textMuted`
  - Better social button styling: filled dark surface with border, not plain text
  - Apple disabled state: full visual treatment with "Coming soon" badge
  - Footer: proper ToS text, remove dev labels
- **Components needed**: `AnimatedText` (staggered word reveal)
- **Risk**: Medium — navigation entry point, must not break guest/auth flows

### Phase 2: Core Screens (Week 2)

#### HomeScreen (Current: 555 lines → Target: ~650 lines)
- **Current weakness**: Hardcoded name, identical cards, flat AI card, no skeletons
- **Emotional goal**: "Your personalized command center — warm, organized, alive"
- **Changes**:
  - Replace hardcoded "Salem" with `auth?.user?.displayName || auth?.user?.email?.split('@')[0] || 'there'`
  - **AI Hero Card redesign**: Gradient border (emerald → transparent), subtle emerald glow, animated sparkle icon, "Ask Naero anything" prompt, slightly larger (88px height)
  - **Greeting enhancement**: "Good morning" with time-based context + emerald accent dot
  - **Card differentiation**: AI card = hero variant, Quick Actions = standard variant, Essentials = compact horizontal scroll, Continue section = standard with amber left-border
  - **Section animations**: Each section fades in with 20px upward drift on scroll (staggered)
  - **Skeleton loading**: Shimmer placeholders while data loads
  - **Pull-to-refresh**: Added to main scroll
  - **Today card**: Richer visual — larger image, gradient overlay, emerald accent bar
- **Components needed**: `Skeleton`, `SectionHeader`, hero card variant
- **Risk**: High — most complex screen, most user time

#### DiscoverScreen (Current: 478 lines → Target: ~550 lines)
- **Current weakness**: Monotonous cards, small search, no distance, basic categories
- **Emotional goal**: "Explore with confidence — everything is discoverable"
- **Changes**:
  - **Search bar**: Taller (48px), emerald focus ring, recent searches dropdown
  - **Category pills**: Slightly larger (14px icons), active state with filled accent background
  - **Result cards differentiated**: Places get category-colored left border, Services get icon badge
  - **Distance display**: Show distance when `userLocation` available (e.g., "0.3 km away")
  - **Featured cards**: First 2 results get hero treatment (larger, image if available)
  - **Skeleton loading**: Shimmer while data loads
  - **Pull-to-refresh**: Added
  - **Empty search state**: Compass illustration + "No results found" + "Try a different search"
- **Components needed**: `Skeleton`, `EmptyState`, distance utility
- **Risk**: Medium — data-heavy, needs null-safety

#### AIScreen (Current: 777 lines → Target: ~850 lines)
- **Current weakness**: Debug overlay in prod, generic bubbles, no markdown, tiny avatar, no follow-ups
- **Emotional goal**: "Your intelligent companion — warm, knowledgeable, responsive"
- **Changes**:
  - **Remove debug overlay** or gate behind `__DEV__` or env variable
  - **AI avatar**: Larger (36px), emerald glow ring when active, compass needle rotation when thinking
  - **Welcome state redesign**: Clean greeting "How can I help you today?" with contextual suggestions based on user's city/stage, 3 suggested prompts (not 6), RAG toggle as a clean compact pill
  - **Chat bubbles**: User bubbles slightly tinted `accentSoft`, AI bubbles on `surface` with emerald left-border accent
  - **Thinking state**: Compass needle rotation + "Thinking..." text, not generic dots
  - **Suggested follow-ups**: After each AI response, show 2-3 chips: "Tell me more", "Show on map", "Save this"
  - **Message actions**: Long-press to copy, share
  - **Input bar**: Slightly elevated surface, emerald send button (pill shape), cleaner design
  - **Source badges**: Improved visual — small pill with icon + source name
- **Components needed**: `CompassIcon` (animated), `MessageActions`, follow-up chips
- **Risk**: High — most complex screen, API integration

### Phase 3: Social & Detail Screens (Week 3)

#### CommunityScreen (Current: 133 lines → Target: ~400 lines)
- **Current weakness**: Near-placeholder, no post creation, no tabs, logo as avatar
- **Emotional goal**: "A lively community of people like you — warm, active, supportive"
- **Changes**:
  - **Tab system**: All / Tips / Reviews / Questions (4 tabs, horizontal scroll)
  - **Post creation**: Working input bar that navigates to a compose modal
  - **Post cards**: User avatar (initials circle with category color), content, timestamp ("2h ago"), reaction counts, type badge
  - **Pull-to-refresh**: Added
  - **Skeleton loading**: Post card skeletons
  - **Empty state**: Compass + "Be the first to share" + CTA
  - **Community stats**: Small bar showing "X members, Y posts this week"
- **Components needed**: `Avatar`, `Skeleton`, `EmptyState`, `Tabs`, time utility
- **Risk**: High — currently minimal, needs significant build-out

#### ProfileScreen (Current: 630 lines → Target: ~680 lines)
- **Current weakness**: Logo avatar, non-functional edit, wall of 8 menu items
- **Emotional goal**: "This is YOUR space — personalized, organized, private"
- **Changes**:
  - **Avatar**: Real initials circle with accent gradient, or user image if available
  - **Profile header**: Cover gradient (emerald → dark), name, city, member since
  - **Stats row**: Animated counters (favorites, saved places, saved jobs)
  - **Menu groups**: Grouped into "Account", "Preferences", "Support" with section headers
  - **Profile completion**: Progress bar showing profile completeness
  - **Menu items**: Icon + label + chevron, 52px height, divider between groups
- **Components needed**: `Avatar`, animated counter, `SectionHeader`
- **Risk**: Medium — functional but needs visual overhaul

#### Detail Screens (PlaceDetail, ServiceDetail, JobDetail, CommunityDetail)
- **Common changes across all detail screens**:
  - Skeleton loading for content
  - Share button in header
  - Favorite/save with animation (heart fill or bookmark)
  - Back button consistency (same style across all)
  - Timestamp formatting ("2h ago", "3 days ago")
  - Keyboard handling for comment inputs (CommunityDetail)
- **PlaceDetail specifics**: Better image placeholder (compass icon + "No photo yet"), map preview card, hours with open/closed status, reviews section placeholder
- **ServiceDetail specifics**: Service image support, pricing tiers, verification badge, reviews placeholder
- **JobDetail specifics**: Company logo placeholder, salary range display, "Similar jobs" section, benefits tags
- **CommunityDetail specifics**: Working comments, keyboard handling, share functionality, post timestamp
- **Components needed**: `Skeleton`, `ShareButton`, `FavoriteButton`, `TimeStamp`
- **Risk**: Medium — mostly additive, no structural changes

### Phase 4: Utility Screens (Week 4)

#### SafetyScreen (Current: 271 lines → Target: ~400 lines)
- **Current weakness**: No SOS, no map, generic tips
- **Emotional goal**: "You're protected — help is always one tap away"
- **Changes**:
  - **SOS floating button**: Fixed position, red, large (64px), triggers emergency call
  - **Emergency header**: More prominent — red-tinted surface, phone icon, "Emergency" title
  - **Contact cards**: Larger, with call button integrated, swipe to call
  - **Safety tips**: Better expand/collapse animation, severity color coding (already exists, enhance)
  - **Quick-dial row**: Horizontal scroll of emergency numbers with one-tap call
  - **Location-specific tips**: If city known, show city-specific emergency numbers
- **Components needed**: `SOSButton`, `EmergencyCard`, `QuickDial`
- **Risk**: Medium — critical feature, needs careful testing

#### NotificationsScreen (Current: 273 lines → Target: ~300 lines)
- **Current weakness**: No grouping, `Math.random()` keys, no time formatting
- **Changes**:
  - Fix `Math.random()` keys → use `item.id` or index
  - Group by date (Today, Yesterday, This Week, Earlier)
  - Time-relative timestamps ("2h ago", "Yesterday")
  - Swipe-to-delete or long-press actions
  - Better unread/read visual distinction (unread has emerald left dot)
- **Components needed**: `TimeStamp`, section headers
- **Risk**: Low — isolated screen

#### SettingsScreen (Current: 261 lines → Target: ~350 lines)
- **Current weakness**: Only 4 items, broken handler, sparse
- **Changes**:
  - Add more settings items: Account, Language, Notifications, Privacy, Appearance, About, Version
  - Fix notifications handler → navigate to Notifications screen
  - Grouped sections with headers
  - Version from package.json or manifest
  - Working back navigation
- **Components needed**: `SectionHeader`, settings item component
- **Risk**: Low

#### AboutScreen (Current: 206 lines → Target: ~250 lines)
- **Current weakness**: Hardcoded version, static, no story
- **Changes**:
  - Dynamic version from Constants
  - Animated logo reveal
  - Mission statement with better typography
  - Team/story section with warmth
  - Social links as cards, not just icons
- **Components needed**: None new
- **Risk**: Low

### Phase 5: Motion & Polish (Week 5)

**App-wide motion additions**:
- Page transitions: `slide_from_right` for push, `fade` for modal (already set in navigator)
- Card press feedback: `scale: 0.98` + `opacity: 0.8` on press, spring back on release
- Tab switch: Cross-fade content (300ms)
- Section entrance: Staggered fade-in + 20px upward drift (200ms intervals)
- Pull-to-refresh: Emerald spinner
- AI thinking: Compass needle rotation (continuous)
- Loading: Skeleton shimmer animation
- Toast: Slide up from bottom, auto-dismiss after 3s

**Performance rules**:
- All animations use `useNativeDriver: true`
- Transform-only (translate, scale, opacity) — no layout animations
- All animations interruptible
- `prefers-reduced-motion`: Static fallback for all animations
- Max 2 concurrent ambient animations

### Phase 6: Accessibility & RTL (Week 6)

**RTL support**:
- All `marginLeft/Right` → `marginInlineStart/End`
- All `paddingLeft/Right` → `paddingInlineStart/End`
- All `textAlign: 'left'` → `textAlign: 'start'`
- All `borderLeftWidth` → conditional based on `I18nManager.isRTL`
- All `flexDirection: 'row'` → auto-reverses in RTL (already works in RN)
- Test all screens in Arabic locale

**Accessibility**:
- All interactive elements: `accessibilityRole` + `accessibilityLabel`
- All images: `accessibilityLabel` or `accessible={false}` for decorative
- Color contrast: minimum 4.5:1 for all text
- Touch targets: minimum 44x44px
- Screen reader testing with TalkBack

### Phase 7: Onboarding & Empty States (Week 7)

**Onboarding flow improvement**:
- SplashScreen: Brand moment with tagline
- WelcomeScreen: Animated hero, warm greeting
- LocationPermissionScreen: Animated benefit reveal, illustration per benefit
- HomeScreen: First-visit tips overlay ("Tap here to explore", "Ask Naero anything")

**Empty state library**:
- Compass illustration + title + description + CTA
- Per-screen contextual messages
- Animated entrance for empty states

### Phase 8: Final Polish & Testing (Week 8)

**Cross-device testing**:
- iPhone SE (small screen)
- iPhone 15 Pro (standard)
- iPhone 15 Pro Max (large)
- Android mid-range (1080p)
- Android tablet (if applicable)

**Performance testing**:
- FlatList performance with 100+ items
- Animation frame rate (target: 60fps)
- Memory usage during long sessions
- Bundle size impact

**Visual QA**:
- Every screen in both light and dark (if applicable)
- Every screen in RTL
- Every screen with large text accessibility setting
- Every empty/loading/error state

---

## 8. Component Library Plan

### New Components

#### `Skeleton` (New)
```jsx
<Skeleton width="100%" height={200} borderRadius={12} />
<Skeleton.Text lines={3} spacing={8} />
<Skeleton.Avatar size={48} />
<Skeleton.Card variant="standard" />
```
- Shimmer animation: `rgba(255,255,255,0.04)` → `rgba(255,255,255,0.08)` → back
- Duration: 1.5s loop
- Matches layout shape of content it replaces

#### `Avatar` (New)
```jsx
<Avatar name="Salem" size={48} imageUrl={url} />
<Avatar.Group names={["Salem", "Ali"]} max={3} />
```
- Fallback: initials in colored circle (color from name hash)
- Border option for grouped display
- Online indicator dot (optional)

#### `EmptyState` (New)
```jsx
<EmptyState
  icon="compass"
  title="No results found"
  description="Try a different search or category"
  action={{ label: "Clear search", onPress: clearSearch }}
/>
```
- Compass line-art icon at 64px
- Title (16px, 600) + description (14px, 400) + CTA button
- Centered layout with generous padding

#### `CompassIcon` (New — Animated)
```jsx
<CompassIcon size={32} spinning={isThinking} color={COLORS.accent} />
```
- SVG compass with animated needle
- Used in: AI thinking state, empty states, splash
- Needle rotates continuously when `spinning={true}`

#### `SectionHeader` (New)
```jsx
<SectionHeader title="Nearby" action={{ label: "See all", onPress: seeAll }} />
```
- Title at 20px/600 weight
- Optional "See all" link on right
- Consistent 24px top margin, 12px bottom margin

#### `Toast` (New)
```jsx
<Toast type="success" message="Saved to favorites" duration={3000} />
```
- Slides up from bottom
- Auto-dismiss after duration
- Types: success (emerald), error (red), info (blue), warning (amber)

#### `Card` (New — Variant System)
```jsx
<Card variant="hero" onPress={handlePress}>...</Card>
<Card variant="standard">...</Card>
<Card variant="compact">...</Card>
<Card variant="warm">...</Card>
```
- Each variant has its own border, background, and radius treatment
- `hero`: gradient border, elevated surface, subtle glow
- `standard`: flat border, surface bg
- `compact`: no border, transparent bg
- `warm`: amber left-border, warmSoft bg

### Existing Components to Update

#### `Text` (Update)
- Add `variant` prop: `display`, `title`, `subtitle`, `body`, `caption`, `small`
- Auto-apply weight, size, tracking from tokens
- Add `color` prop with default `textPrimary`

#### `IconButton` (Update)
- Add press animation (scale 0.95, spring back)
- Consistent sizing: 40px touch target minimum

#### `ActionButton` (Update)
- Add gradient variant for hero CTAs
- Press animation (scale 0.98)
- Loading state with emerald spinner
- Size variants: sm (36px), md (44px), lg (52px)

#### `SocialAuthButton` (Update)
- Migrate to unified tokens
- Better disabled state (not just opacity)
- Consistent with new card styling

---

## 9. Motion & Micro-Interaction Language

### Principles
1. **Purposeful**: Every animation communicates something — entrance, feedback, state change
2. **Transform-only**: GPU `translate3d`, `scale`, `opacity` — never layout animations
3. **Interruptible**: Every animation reverses on interrupt
4. **Consistent**: Same animation for same type of action across all screens
5. **Accessible**: `prefers-reduced-motion` → instant transitions

### Animation Library

| Animation | Trigger | Duration | Easing | Use |
|-----------|---------|----------|--------|-----|
| `entranceFadeUp` | Element appears | 200ms | spring(15, 200) | Cards, sections, list items |
| `pressScale` | Touch down | 100ms | ease-out | All tappable elements |
| `pressRelease` | Touch up | 200ms | spring(15, 200) | All tappable elements |
| `tabSwitch` | Tab change | 200ms | ease-in-out | Tab content |
| `skeletonShimmer` | Loading | 1500ms | linear loop | Skeleton placeholders |
| `compassSpin` | AI thinking | 2000ms | linear loop | Compass needle |
| `aiGlow` | AI active | 2000ms | ease-in-out loop | Emerald glow pulse |
| `toastSlideUp` | Toast show | 200ms | spring(15, 200) | Toast entrance |
| `toastSlideDown` | Toast dismiss | 150ms | ease-in | Toast exit |
| `sectionReveal` | Scroll into view | 300ms | spring(18, 120) | Section headers |
| `counterIncrement` | Data loads | 600ms | ease-out | Stats counters |
| `favoriteFill` | Save action | 300ms | spring(12, 100) | Heart/bookmark fill |

### Stagger Pattern
When multiple elements enter simultaneously (e.g., a list of cards), stagger each by 50ms:
```
Card 1: 0ms delay
Card 2: 50ms delay
Card 3: 100ms delay
Card 4: 150ms delay
```
Maximum stagger: 300ms (stop adding delay after 6 elements)

---

## 10. Safe Migration Strategy

### Rules
1. **No big-bang rewrite** — changes are incremental and testable
2. **Every phase is shippable** — app works after each phase
3. **No navigation changes** — screen names, routes, and tab structure stay the same
4. **No backend changes** — API calls, data models, auth flows untouched
5. **No Facebook/Google auth changes** — untouched throughout
6. **Token migration is last** — update screens to new tokens before removing old ones
7. **Test after every phase** — install APK, verify all screens, check for crashes

### Phase Dependencies

```
Phase 0 (Tokens) ← Phase 1 (Components) ← Phase 2 (Core Screens)
                                                 ↓
                                          Phase 3 (Detail Screens)
                                                 ↓
                                          Phase 4 (Utility Screens)
                                                 ↓
                                          Phase 5 (Motion)
                                                 ↓
                                          Phase 6 (Accessibility)
                                                 ↓
                                          Phase 7 (Onboarding)
                                                 ↓
                                          Phase 8 (Polish)
```

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Import errors from token migration | Grep all files for old token usage; update imports before removing exports |
| Navigation breakage | Never change screen names or route params |
| Performance regression from animations | Test on low-end device after each phase; gate behind `prefers-reduced-motion` |
| RTL breakage | Test Arabic locale after every screen change |
| Auth flow breakage | Never touch Facebook/Google auth code |
| Data loading breakage | Never change API calls or data models |
| Crash regression | Install and test APK on real device after every phase |

### Testing Checklist (Per Phase)

- [ ] App launches without crash
- [ ] Splash → Welcome → LocationPermission → Home flow works
- [ ] Guest login works
- [ ] Google login works (if configured)
- [ ] All 4 bottom tabs work (Home, Discover, Community, Profile)
- [ ] AI screen opens and chat works
- [ ] All detail screens open with data
- [ ] All back navigation works
- [ ] RTL layout correct (Arabic locale)
- [ ] Large text accessibility works
- [ ] Loading states show skeletons (where added)
- [ ] Empty states show guidance (where added)
- [ ] No console errors
- [ ] PID stable (no crashes) after navigating all screens

---

## Appendix A: Color Comparison

| Element | Current | Proposed ("Guided Compass") |
|---------|---------|----------------------------|
| Canvas | `#070B14` | `#070B14` (unchanged) |
| Surface | `#0F172A` | `#0F172A` (unchanged) |
| Elevated | `#1A1D33` | `#1A1D33` (unchanged) |
| Primary text | `#F8FAFC` (cold white) | `#F5F0EB` (warm off-white) |
| Secondary text | `#94A3B8` | `#94A3B8` (unchanged) |
| Tertiary text | `#64748B` | `#64748B` (unchanged) |
| Accent | `#06B6D4` (cyan) | `#10B981` (emerald) — unify to single accent |
| Secondary accent | `#10B981` (emerald) | `#D4A040` (amber) — for saved/warmth only |
| Card border | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.06)` (subtler) |
| Active border | N/A | `rgba(255,255,255,0.10)` |
| Strong border | N/A | `rgba(255,255,255,0.15)` |

**Key change**: Cyan (`#06B6D4`) is removed as accent. Emerald (`#10B981`) becomes the sole primary accent. This unifies the visual identity — currently some screens use cyan, others use emerald.

## Appendix B: Typography Comparison

| Element | Current | Proposed |
|---------|---------|----------|
| Screen title | 28px/700 (inline) | 28px/700/`display` token |
| Section header | 20px/700 (mixed) | 20px/600/`title` token |
| Card title | 15px/600 (FONTS.bodyBold) | 15px/600/`subtitle` token |
| Body text | 15px/400 (FONTS.body) | 15px/400/`body` token |
| Caption | 13px/500 (FONTS.caption) | 13px/500/`caption` token |
| Badge/tag | 11px/600 (FONTS.smallBold) | 11px/600/`small` token |
| Tab label | 11px/600 (FONTS.tab) | 11px/600/`tab` token |

**Key change**: Reduced font weights — section headers from 700→600, less heavy overall. Added letter-spacing for display text (-0.5px) and caption text (+0.2px) for typographic personality.

## Appendix C: Screen Priority Matrix

| Priority | Screen | Effort | Impact |
|----------|--------|--------|--------|
| P0 | HomeScreen | High | Highest — most-seen screen |
| P0 | AIScreen | High | Core differentiator |
| P0 | CommunityScreen | High | Currently near-placeholder |
| P1 | WelcomeScreen | Medium | First impression |
| P1 | DiscoverScreen | Medium | Discovery engine |
| P1 | SafetyScreen | Medium | Critical for mission |
| P1 | ProfileScreen | Medium | Personal identity |
| P2 | Detail screens (4) | Medium | Data presentation |
| P2 | SplashScreen | Low | Brand moment |
| P2 | AuthScreen | Medium | Trust/reliability |
| P3 | NotificationsScreen | Low | Utility |
| P3 | SettingsScreen | Low | Utility |
| P3 | AboutScreen | Low | Brand story |
| P3 | LocationPermissionScreen | Low | Privacy trust |
| P3 | JobsScreen | Medium | Feature screen |
