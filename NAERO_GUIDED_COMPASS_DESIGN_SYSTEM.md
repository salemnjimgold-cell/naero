# Naero — "Guided Compass" Design System

> The visual identity of Naero.
> 80% Warm Compass. 20% Living Compass.
> Users remember how Naero made them feel.

---

## 1. Brand Essence

### What Naero Is
A calm, intelligent guide for people starting a new life. Not a dashboard. Not a chatbot. A companion that knows the way.

### What Naero Is Not
- Not a banking app (no cold precision, no financial UI)
- Not a social media app (no engagement metrics, no infinite scroll)
- Not a productivity tool (no checkboxes, no Kanban)
- Not a futuristic sci-fi app (no holograms, no glass morphism)
- Not playful (no confetti, no emoji-heavy, no cartoons)

### The Feeling
When someone closes Naero, they should think:
> "I know what to do next. I'm not alone."

### The Six Words
**Calm. Premium. Warm. Intelligent. Trustworthy. Human.**

---

## 2. Color System

### Philosophy
Warm-shifted darkness. Not cold navy. Not clinical black. A room lit by warm light. Text is cream, not white. Borders are warm, not blue-gray. Emerald is the compass color — it appears only where guidance lives.

### Palette

```
CANVAS (background depth)
─────────────────────────────────
canvas         #0C0A08    warm black — the room
surface        #1A1612    warm charcoal — furniture
elevated       #241F1A    warm lift — paper under lamplight
overlay        rgba(0,0,0,0.65)

TEXT (typography hierarchy)
─────────────────────────────────
textPrimary    #F5EDE4    warm cream — ink on aged paper
textSecondary  #9C9389    warm gray — pencil marks
textTertiary   #6B6359    warm muted — whispers
textMuted      #4A4440    disabled — barely there
textLink       #10B981    emerald — interactive text

ACCENT (compass color — guidance and AI)
─────────────────────────────────
accent         #10B981    emerald — the compass needle
accentSoft     rgba(16,185,129,0.10)   backgrounds behind AI
accentBorder   rgba(16,185,129,0.20)   borders around AI elements
accentGlow     rgba(16,185,129,0.08)   ambient glow — barely visible
accentDark     #059669    emerald dark — pressed state

WARM (saved, progress, achievements — user investment)
─────────────────────────────────
warm           #C89B5C    amber-gold — "you chose this"
warmSoft       rgba(200,155,92,0.08)   saved card backgrounds
warmBorder     rgba(200,155,92,0.15)   saved card borders

BORDER (structural — three tiers)
─────────────────────────────────
borderSubtle   rgba(245,237,228,0.06)   cards, dividers
borderDefault  rgba(245,237,228,0.10)   inputs, active states
borderStrong   rgba(245,237,228,0.15)   sections, groups

STATUS (functional — never decorative)
─────────────────────────────────
success        #10B981    shares accent — positive
warning        #E8A838    warm amber — caution
error          #E8604C    warm red — not clinical
info           #5B8DEF    warm blue — informational
```

### Rules
1. **Emerald appears ≤3 places per screen** — it is the compass, not decoration
2. **Amber appears only for saved/progress** — "you invested effort here"
3. **Text is never pure white** — always warm cream
4. **Background is never pure black** — always warm-shifted
5. **No gradients on cards** — depth from background difference only
6. **One gradient per screen maximum** — only for hero moments (AI card, splash)

---

## 3. Typography

### Font: Inter
Clean, readable, warm at all sizes. One family, five weights.

### Scale

| Level | Weight | Size | Line Height | Letter Spacing | Use |
|-------|--------|------|-------------|----------------|-----|
| Display | 700 | 28px | 34px | -0.5px | Screen titles — confident, tight |
| Title | 600 | 20px | 26px | -0.3px | Section headers |
| Subtitle | 500 | 16px | 22px | 0px | Card titles, descriptions |
| Body | 400 | 15px | 23px | +0.1px | Reading text — generous, breathable |
| Caption | 500 | 13px | 18px | +0.2px | Labels, timestamps |
| Small | 600 | 11px | 14px | +0.3px | Badges, tags, tab labels |

### Hierarchy Rules
- **Headlines are tight** — negative tracking, weight 600-700
- **Body is open** — weight 400, generous line height (1.53)
- **Color carries secondary hierarchy** — primary > secondary > tertiary
- **Never use color alone for hierarchy** — weight + size always support it
- **Bold is rare** — only for screen titles and card titles. Body is never bold.

---

## 4. Spacing & Layout

### Spacing Scale (4px base)
```
4   8   12   16   20   24   32   40   48   64
xs  sm  md   lg   xl   xxl  xxxl 4xl  5xl  6xl
```

### Layout
- Screen padding: 20px horizontal
- Card padding: 16px
- Section gap: 24px
- Card gap: 12px
- Tab bar height: 64px (48px content + 16px safe area)

### Whitespace Rules
- **Between sections**: 24px — clear separation
- **Between cards**: 12px — related but distinct
- **Inside cards**: 16px — comfortable, not cramped
- **Around screen titles**: 8px top, 20px bottom — breathing room
- **After section headers**: 12px — connects header to content

---

## 5. Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 8px | Badges, chips, tags |
| md | 12px | Cards, inputs |
| lg | 16px | Hero cards, modals |
| xl | 20px | Special elements |
| full | 9999px | Pill buttons, avatars |

---

## 6. Border

Three tiers, never decorative:
- **Subtle** (0.06 opacity): Card borders, dividers
- **Default** (0.10 opacity): Inputs, focused states
- **Strong** (0.15 opacity): Section boundaries, groups

---

## 7. The Compass

### What It Is
Naero's signature. A simple circle with a needle. Not a complex rose. Not a geometric pattern. A compass — the most ancient symbol of guidance.

### When It Appears
| Context | State | Size | Color |
|---------|-------|------|-------|
| Splash screen | Hero, animates in | 80px | Emerald |
| AI thinking | Needle rotates (3s loop) | 24px | Emerald |
| AI idle | Needle still, points up | 24px | Emerald |
| AI greeting | Small, next to greeting | 20px | Emerald |
| Empty states | Static illustration | 48px | textTertiary |
| Saved items | Bookmark variant | 16px | Warm |
| Journey step | Current step indicator | 12px | Emerald glow |

### When It Does NOT Appear
- Not as tab icon (use a standard icon)
- Not as background pattern
- Not as watermark
- Not as decorative element on cards
- Not in headers (except splash and AI)
- Not multiplied — one compass per screen maximum

### Animation Rules
- **Rotation**: 3s linear loop, only during AI thinking
- **Gentle sway**: 4s ease-in-out, only on AI hero card
- **Pulse**: 2s ease-in-out, only on active journey step
- **No rotation on idle** — compass is still when not guiding

---

## 8. Motion Language

### Principle
Every animation improves understanding. No decorative motion.

### Allowed Animations

| Animation | Duration | Trigger | Purpose |
|-----------|----------|---------|---------|
| Fade up | 200ms, 10px drift | Element appears | "This is new" |
| Press scale | 100ms to 0.97 | Touch down | "This is tappable" |
| Release scale | 200ms spring back | Touch up | "Action complete" |
| Section reveal | 300ms, 20px drift | Scroll into view | "This section matters" |
| Compass rotate | 3000ms linear | AI thinking | "I'm working on it" |
| Compass sway | 4000ms ease-in-out | AI card visible | "I'm here" |
| Skeleton shimmer | 1500ms linear loop | Data loading | "Content is coming" |

### Forbidden Animations
- No idle animations (nothing moves without user context)
- No bounce effects (not playful)
- No parallax (not a landing page)
- No particle effects (not futuristic)
- No confetti (not a game)
- No continuous rotation (compass rotates ONLY during AI thinking)

### Reduced Motion
- All animations have `prefers-reduced-motion` fallback
- Fallback: instant appearance (no transition)

---

## 9. Component Specifications

### Card: Standard
```
Background:   surface (#1A1612)
Radius:       12px
Padding:      16px
Border:       1px borderSubtle
Shadow:       none
Press:        borderDefault, scale 0.97, 100ms
```

### Card: AI Hero
```
Background:   surface → accentSoft gradient (left to right, subtle)
Radius:       16px
Padding:      16px
Border:       1px accentBorder
Left accent:  2px emerald, 12px radius
Shadow:       none (glow is ambient, not shadow)
Content:      Compass icon (20px) + "Ask Naero" + suggestion
Animation:    Compass gentle sway when visible
```

### Card: Journey
```
Background:   surface
Radius:       12px
Padding:      16px
Border:       1px borderSubtle
Content:      Vertical timeline — dots + lines + labels
Current step: accent glow pulse
Completed:    accent + check
Future:       textTertiary dots
```

### Card: Saved
```
Background:   surface
Radius:       12px
Padding:      16px
Border:       1px borderSubtle
Right accent: 2px warm
Corner badge: warm dot (8px)
```

### Button: Primary
```
Background:   accent (#10B981)
Text:         #FFFFFF
Radius:       full (pill)
Padding:      14px 28px
Font:         15px/600
Press:        accentDark, scale 0.97
```

### Button: Secondary
```
Background:   transparent
Border:       1px borderDefault
Text:         textPrimary
Radius:       full (pill)
Padding:      14px 28px
Font:         15px/500
Press:        borderStrong, scale 0.97
```

### Button: Ghost
```
Background:   transparent
Text:         accent
Radius:       full
Padding:      8px 16px
Font:         14px/500
Press:        accentSoft background
```

### Input
```
Background:   surface
Border:       1px borderDefault
Radius:       12px
Padding:      14px 16px
Font:         16px/400, textPrimary
Placeholder:  textTertiary
Focus:        border accent
```

### Tab Bar
```
Background:   surface (opaque)
Top border:   1px borderSubtle
Height:       64px
Icons:        24px, line style
Active:       accent fill + accent label
Inactive:     textTertiary icon + label
Font:         11px/600
```

### Avatar
```
Fallback:     Initials circle, accent background, white text
Size:         40px (list), 48px (profile), 32px (comment)
Radius:       full
```

### Badge
```
Background:   accentSoft
Text:         accent, 11px/600
Radius:       full
Padding:      2px 8px
```

### Skeleton
```
Background:   rgba(245,237,228,0.04) → rgba(245,237,228,0.08) → back
Radius:       match content shape
Animation:    1500ms linear loop
```

### Empty State
```
Icon:         Compass (48px, textTertiary)
Title:        16px/600, textPrimary
Description:  14px/400, textSecondary
CTA:          Primary button
Layout:       Centered, 48px gaps
```

### Toast
```
Background:   elevated
Border:       1px borderDefault
Radius:       12px
Padding:      12px 16px
Animation:    Slide up from bottom, 200ms
Auto-dismiss: 3s
Types:        success (accent), error (error), info (info)
```

---

## 10. Navigation Structure

### Bottom Tabs (4)
| Tab | Icon | Label | Badge |
|-----|------|-------|-------|
| Home | Home icon | Home | — |
| Explore | Compass icon | Explore | — |
| AI | Message icon | Ask | Emerald dot when active |
| Profile | User icon | Profile | — |

### Tab Bar Rules
- Always visible (no hide-on-scroll)
- Opaque background (no translucency — warmth, not glass)
- Labels always visible (clarity for newcomers)
- Active tab: emerald icon + emerald label
- AI tab: emerald dot appears when AI has a suggestion

### Stack Navigation
- Push: slide from right (300ms)
- Modal: slide from bottom (300ms)
- Back: swipe or back button
- No gesture-based tab switching (predictable for newcomers)

---

## 11. Screen Design Protocol

Before redesigning any screen, write:

```
SCREEN: [Name]
─────────────────────────────
User goal:      What is the user trying to achieve?
Emotional goal: How should they feel?
Primary action: The one thing this screen exists for.
Secondary action: Supporting action.
Success state:  What does "done" look like?
Compass role:   Does the compass appear here? How?
```

### Example: Home Screen
```
SCREEN: Home
─────────────────────────────
User goal:      Know what to do next, feel oriented
Emotional goal: "I know where I am and what comes next"
Primary action: Tap AI card to ask a question
Secondary action: Tap a category to explore
Success state:  User taps something and moves forward
Compass role:   Small, in AI card — "I'm here to guide you"
```

---

## 12. Screen-by-Screen Emotional Map

| Screen | Feeling | Compass | Accent Use |
|--------|---------|---------|------------|
| Splash | Anticipation → Calm | Hero (80px, animate in) | Full glow |
| Welcome | Warmth → Trust | Small, below logo | Emerald links |
| Home | Orientation → Confidence | In AI card (20px, sway) | AI card border |
| Explore | Curiosity → Discovery | In search placeholder | Active category |
| AI | Companionship → Relief | Avatar (24px, rotate when thinking) | Chat elements |
| Community | Belonging → Connection | None | Minimal |
| Profile | Ownership → Pride | None | Stats accent |
| Detail | Clarity → Action | None | Action button |
| Safety | Security → Protection | None | Emergency red |
| Settings | Control → Calm | None | Minimal |

---

## 13. What We坚决不做 (What We Explicitly Reject)

1. **No glassmorphism** — warmth, not cold transparency
2. **No aurora gradients** — calm, not psychedelic
3. **No time-shifting palettes** — warm black is enough
4. **No hand-drawn illustrations** — clean, not sketchy
5. **No emoji in headers** — human tone, not informal
6. **No confetti or celebrations** — progress is its own reward
7. **No infinite scroll** — content has boundaries
8. **No engagement metrics** — this is not social media
9. **No playful bouncing** — motion reinforces guidance
10. **No oversized icons** — typography carries hierarchy
11. **No cards that all look the same** — variant system
12. **No generic empty states** — every empty state guides
13. **No cyan, purple, or blue accents** — emerald only
14. **No white text** — warm cream only
15. **No pure black backgrounds** — warm black only

---

## 14. The Test

After building every screen, ask:

1. **Does the user know what to do?** If not, the hierarchy is wrong.
2. **Does the user feel guided?** If not, the compass is missing.
3. **Does the user feel alone?** If not, the warmth is working.
4. **Would the user screenshot this?** If not, it's not distinctive enough.
5. **Does this pass the "one screenshot" test?** Can someone recognize Naero from this screen alone?

---

## 15. Implementation Priority

```
1. Define tokens (colors, type, spacing, radius)        ← DONE in Phase 0
2. Build component library (Card, Button, Input, etc.)   ← Phase 1
3. Home screen (the signature screen)                    ← Phase 2
4. AI Chat (the core product)                            ← Phase 3
5. Explore/Discover                                      ← Phase 4
6. Community                                             ← Phase 5
7. Profile                                               ← Phase 6
8. Utility screens (Settings, Notifications, Safety)     ← Phase 7
9. Polish, motion, accessibility, RTL                    ← Phase 8
```

Each phase ends with: build → device test → QA report → APK path.
