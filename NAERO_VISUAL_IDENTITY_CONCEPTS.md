# Naero — Visual Identity Concepts

> Three radically different directions for Naero's visual language.
> Each direction is a complete product identity, not a skin.
> The goal: an app people recognize from one screenshot.

---

## Research Synthesis

### What Makes Products Iconic (2024-2026)

| Product | Signature Move | Why It Works |
|---------|---------------|--------------|
| **Airbnb** | The Bélo + warm photography + Cereal type | "Belonging" is the product. The symbol IS the brand. |
| **Linear** | Speed-as-design + purple-on-near-black | Every interaction feels instant. The dark IS the identity. |
| **Apple** | Clarity / Deference / Depth + Liquid Glass | Interface disappears. Content breathes. Hardware-software harmony. |
| **Revolut** | Two-mode canvas (black storytelling + white product) + famous brand color that barely appears | Cobalt is reserved for 2 moments. White-on-black CTA carries more voltage. |
| **Arc Browser** | Aurora gradients + Pip mascot + sidebar-as-paradigm | Browser as personal companion. Motion IS the marketing. |
| **Notion** | Warm brown-black (#37352F) + content-first + hand-drawn illustrations | Interface behaves like infrastructure, not decoration. |
| **grug** (2026 ADA) | Hand-drawn simplicity + "smart developer do good" | A tiny idea, perfectly executed. Clever simplicity wins. |

### Cross-Cutting Truths

1. **Iconic products have ONE signature** — not five. Airbnb has the Bélo. Linear has speed. Revolut has the pill.
2. **Color restraint creates memorability** — Revolut's cobalt appears in 2 places. Linear's purple appears in 1.
3. **Warm text outperforms pure white** — Notion (#37352F), Linear (#D0D6E0), Apple (SF Pro warm gray).
4. **Typography IS the hierarchy** — Linear, Revolut, and Notion all use weight+size, never color+decoration.
5. **Dark mode is a brand decision, not a preference** — Linear signals "for builders." Revolut signals "premium finance."
6. **Motion must be purposeful** — Arc's motion communicates personality. Linear's communicates speed.
7. **Empty states are brand moments** — Arc's Pip, Notion's illustrations, grug's affirmations.

### What Naero Must Solve That Others Don't

Naero serves **people starting a new life in a new country**. No other app category carries this emotional weight:
- Every screen must reduce anxiety, not increase it
- The AI must feel like a guide, not a tool
- Trust is not optional — it is the product
- Hope must be visible, not implied
- The compass must mean something, not just look nice

---

## Direction A: "Precision Compass"

> "You are in capable hands."

### Philosophy
Ultra-premium precision. The compass is a geometric mark — a compass rose rendered in clean lines, appearing sparingly. The app feels like Linear's calm precision applied to life guidance. Every pixel serves a purpose. Intelligence through restraint.

### Moodboard References
- Linear's near-black canvas with single purple accent
- Revolut's two-mode canvas and pill-everything confidence
- Apple's Liquid Glass depth and clarity
- A compass rose on a nautical chart — precise, geometric, functional

### Color System

| Token | Value | Usage |
|-------|-------|-------|
| **Canvas** | `#050810` | Deep space black — the void you navigate through |
| **Surface** | `#0E1218` | Card surfaces — barely lifted from canvas |
| **Elevated** | `#161C26` | Active cards, modals — subtle lift |
| **Text Primary** | `#E8EAED` | Near-white with cool undertone — crisp, precise |
| **Text Secondary** | `#6B7280` | Muted — recedes, lets primary breathe |
| **Accent** | `#10B981` | Emerald — appears ONLY for AI, active states, compass needle |
| **Accent Glow** | `rgba(16,185,129,0.08)` | Ambient glow behind AI elements — barely visible |
| **Border** | `rgba(255,255,255,0.06)` | Whisper-thin structural lines |
| **Border Active** | `rgba(255,255,255,0.12)` | Focused state — slightly visible |
| **Error** | `#EF4444` | Danger — only when something is wrong |
| **Success** | `#10B981` | Shares accent — emerald means "positive" |

**Key rules:**
- Emerald appears in ≤3 places per screen
- No gradients on cards — depth from border hierarchy only
- Text never pure white — always slightly softened
- Background never pure black — always slightly warm

### Typography

| Level | Font | Weight | Size | Tracking | Use |
|-------|------|--------|------|----------|-----|
| **Display** | Inter | 700 | 28px | -0.5px | Screen titles — confident, tight |
| **Title** | Inter | 600 | 20px | -0.3px | Section headers |
| **Body** | Inter | 400 | 15px | +0.1px | Reading text — open, breathable |
| **Caption** | Inter | 500 | 13px | +0.2px | Labels, metadata |
| **Small** | Inter | 600 | 11px | +0.4px | Badges, tags |

**Signature:** Headlines at weight 600-700 with negative tracking. Body at weight 400 with positive tracking. The contrast between tight headlines and open body creates rhythm.

### Compass Signature
- **The compass rose** — a geometric 8-pointed star, rendered in 1px strokes
- Appears ONLY in: splash screen (hero), AI thinking state (rotating needle), empty states (static)
- Never used as: icon, wallpaper, decoration, background pattern
- Color: emerald at 60% opacity — subtle, not screaming
- Size: 32-64px — present but not dominating

### Navigation
- **Bottom tab bar**: 4 icons only — Home, Discover, AI, Profile
- Icons: SF Symbols-style line icons, 24px, `textSecondary` color, emerald when active
- Tab bar: transparent background with top border `rgba(255,255,255,0.06)`
- No labels by default — icons only. Labels appear on long-press (tooltip)
- Active state: emerald icon + subtle emerald dot below

### Card Concepts

**Card A: Standard**
- `Surface` background, 12px radius
- 1px border `rgba(255,255,255,0.06)`
- Content: typography-led hierarchy, no decorative elements
- Press: border brightens to `0.12`, scale 0.98, 100ms

**Card B: AI Hero**
- `Elevated` background, 16px radius
- Left border: 2px emerald — the ONLY decorative color
- Subtle emerald glow behind: `rgba(16,185,129,0.05)`
- Content: "Ask Naero" + contextual suggestion
- Press: glow intensifies briefly, scale 0.98

**Card C: Journey Progress**
- `Surface` background, 12px radius
- Horizontal progress bar: emerald fill on `rgba(255,255,255,0.06)` track
- Content: "Your Journey" + step count + next action
- The progress bar IS the visual interest — no icons, no decoration

**Card D: Saved/Bookmarked**
- `Surface` background, 12px radius
- Right border: 2px amber `#D4A040` — amber means "you invested effort here"
- Amber dot in corner — saved indicator
- Content: standard typography

### AI Interaction Concepts

**Thinking State:**
- Compass needle rotates slowly (2s loop, linear)
- "Thinking..." text fades in/out
- Emerald dot pulses gently
- No spinner, no dots — the compass IS the thinking indicator

**Response State:**
- Message appears with 200ms fade-up
- Source badges: small pills with icon + name, emerald border
- Follow-up suggestions: 2 chips below response, border-only, emerald text
- "Tell me more" / "Show on map" / "Save this"

**Greeting:**
- "Good morning, [Name]." — plain text, no emoji
- Below: "What can I help you navigate today?" — secondary text
- Below: 3 context chips — "Nearby services" / "Learn about [city]" / "Your checklist"

### Home Screen Concept

```
┌─────────────────────────────────────┐
│  [greeting]                         │
│  Good morning, Salem.               │
│  What can I help you navigate?      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▎ Ask Naero anything        │    │
│  │ ▎ [compass icon]            │    │
│  └─────────────────────────────┘    │
│                                     │
│  YOUR JOURNEY                       │
│  ┌─────────────────────────────┐    │
│  │ Step 3 of 7                 │    │
│  │ ████████░░░░░░░  43%        │    │
│  │ Next: Register for health   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ESSENTIALS                         │
│  ┌──────────┐ ┌──────────┐         │
│  │ Services │ │ Places   │         │
│  └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐         │
│  │ Jobs     │ │ Safety   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  [tab: Home | Discover | AI | Me]   │
└─────────────────────────────────────┘
```

**Key decisions:**
- Greeting is the hero — large, confident, personal
- AI card is compact, left-bordered emerald, compass icon
- Journey progress is a progress bar — data, not decoration
- Essentials are a 2x2 grid — minimal, no icons, text only
- No hero image, no gradient header — typography IS the hierarchy

### Discover Screen Concept

```
┌─────────────────────────────────────┐
│  Discover                    [map]  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Search services...       │    │
│  └─────────────────────────────┘    │
│                                     │
│  [All] [Services] [Places] [Jobs]   │
│                                     │
│  Nearby (3)                         │
│  ┌─────────────────────────────┐    │
│  │ Community Health Center     │    │
│  │ 0.3 km · Open now          │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Settlement Services         │    │
│  │ 1.2 km · Opens at 9am      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [tab: Home | Discover | AI | Me]   │
└─────────────────────────────────────┘
```

**Key decisions:**
- Search is prominent, 48px tall
- Category pills: text-only, emerald background when active
- Results: typography-led, distance shown, open/closed status
- Map toggle in header — optional, not forced
- No images in results — text and data, not photos

### Emotional Profile
- **Trust**: through precision, consistency, no visual noise
- **Guidance**: through journey progress, clear next steps
- **Intelligence**: through restraint, data-first, no decoration
- **Hope**: through visible progress, "you're getting there"
- **Simplicity**: through elimination, every element earns its place
- **Warmth**: through personal greeting, contextual awareness

### Strengths
- Extremely clean, fast to scan
- Premium feel — Linear/Revolut tier
- Typography-first hierarchy works at all sizes
- Minimal color = maximal memorability
- Easy to maintain — rigid system

### Risks
- May feel cold for the newcomer use case
- Compass appears so sparingly it might not register as brand
- Text-only cards may feel bare to some users
- Emerald-only accent limits emotional range

---

## Direction B: "Warm Compass"

> "You are safe here. Take your time."

### Philosophy
Warmth-first design. The compass is a living companion — a hand-drawn mark that appears in moments of guidance, not as decoration. Inspired by Airbnb's "belonging" philosophy and Notion's gentle minimalism. The app feels like a knowledgeable friend who knows the city.

### Moodboard References
- Airbnb's warm photography + Bélo symbol + Cereal type
- Notion's warm brown-black text + content-first + hand-drawn illustrations
- Apple's "Purpose, Agency, Responsibility" principles
- A warm candle in a window — guidance, safety, home
- Golden hour light — warm, calm, trustworthy

### Color System

| Token | Value | Usage |
|-------|-------|-------|
| **Canvas** | `#0C0A08` | Warm black — not cold, not blue |
| **Surface** | `#1A1612` | Warm charcoal — like aged wood |
| **Elevated** | `#241F1A` | Warm lift — like paper under lamplight |
| **Text Primary** | `#F5EDE4` | Warm cream — soft, human, never harsh |
| **Text Secondary** | `#9C9389` | Warm gray — like pencil on paper |
| **Text Tertiary** | `#6B6359` | Warm muted — recedes naturally |
| **Accent** | `#10B981` | Emerald — the compass color, appears for guidance and AI |
| **Accent Warm** | `rgba(16,185,129,0.10)` | Emerald tint — backgrounds behind AI elements |
| **Warm** | `#C89B5C` | Amber-gold — saved items, progress, warmth |
| **Warm Soft** | `rgba(200,155,92,0.08)` | Amber tint — saved card backgrounds |
| **Border** | `rgba(245,237,228,0.08)` | Warm white border — not cold white |
| **Border Active** | `rgba(245,237,228,0.15)` | Visible warm border |
| **Error** | `#E8604C` | Warm red — not clinical |
| **Success** | `#10B981` | Emerald — guidance confirmed |

**Key rules:**
- Every color is warm-shifted — no cold whites, no blue-grays
- Emerald appears for guidance/AI. Amber appears for saved/progress.
- Never both on the same element
- Background is warm black, not navy — like a room lit by warm light
- Text is cream, not white — like ink on aged paper

### Typography

| Level | Font | Weight | Size | Line Height | Use |
|-------|------|--------|------|-------------|-----|
| **Display** | Inter | 700 | 30px | 36px | Screen titles — warm, confident |
| **Title** | Inter | 600 | 20px | 26px | Section headers |
| **Subtitle** | Inter | 500 | 16px | 22px | Card titles, descriptions |
| **Body** | Inter | 400 | 15px | 23px | Reading text — generous line height |
| **Caption** | Inter | 500 | 13px | 18px | Labels, timestamps |
| **Small** | Inter | 600 | 11px | 14px | Badges, tags |

**Signature:** Generous line height (1.53 for body). Warm text color. Headlines at 700 weight but large size — not aggressive, just confident.

### Compass Signature
- **The hand-drawn compass** — a simple circle with a needle, slightly imperfect
- Like a sketch in a traveler's journal — personal, human
- Appears in: splash (hero animation), AI greeting (companion), empty states (friend), saved items (bookmark)
- Color: emerald for active/guiding, amber for saved/completed
- Size: 24-64px — visible, present, friendly
- Animation: gentle pulse when AI is active (2s ease-in-out)

### Navigation
- **Bottom tab bar**: 4 items — Home, Explore, Ask, Profile
- Icons: rounded line icons with hand-drawn quality (slightly imperfect curves)
- Active state: emerald fill with warm glow
- Tab bar: warm surface background, warm border top
- Labels always visible — clarity over minimalism

### Card Concepts

**Card A: Standard**
- `Surface` background, 16px radius — generous, soft
- No border — depth from background difference only
- Content: subtitle + body text + caption timestamp
- Press: warm glow intensifies, scale 0.97, spring animation

**Card B: AI Hero**
- Gradient: `rgba(16,185,129,0.06)` → `transparent` — emerald mist
- 16px radius, no border
- Left accent: 3px emerald rounded
- Content: compass icon (small, 20px) + "Ask Naero" + contextual suggestion
- Ambient animation: compass needle gentle sway (4s ease-in-out)

**Card C: Journey Card**
- `Surface` background, 16px radius
- Content: hand-drawn progress illustration (simple line art)
- Progress: amber dots connected by warm line — like a constellation
- Each dot = completed step. Current step = emerald glow.
- "You've completed 3 steps. 4 more to go."

**Card D: Saved**
- `Warm Soft` background, 16px radius
- Left accent: 3px amber
- Content: standard typography + amber bookmark icon
- Amber dot in corner — "saved by you"

### AI Interaction Concepts

**Thinking State:**
- Compass icon gently pulses (emerald glow)
- "Let me think about that..." text
- Small loading dots in emerald — warm, not clinical
- The compass feels like it's consulting its knowledge

**Response State:**
- Message appears with gentle fade-up (300ms, spring)
- AI avatar: small compass icon in emerald circle
- Source badges: warm pills with icon + name
- Follow-up suggestions: "Would you like to know more?" + chips

**Greeting:**
- "Good morning, Salem ☀️" — warm, personal
- Below: "How can I help you today?" — secondary text
- Below: 3 contextual suggestions based on journey stage
  - New arrival: "Find nearby services" / "Learn about your rights" / "Your first steps"
  - Settled: "Explore your neighborhood" / "Upcoming tasks" / "Community events"

### Home Screen Concept

```
┌─────────────────────────────────────┐
│                                     │
│  Good morning, Salem ☀️             │
│  How can I help you today?          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧭 Ask Naero anything       │    │
│  │ Find services, learn about  │    │
│  │ your city, or plan next     │    │
│  │ steps.                      │    │
│  └─────────────────────────────┘    │
│                                     │
│  Your Journey                       │
│  ○───○───◉───○───○───○───○         │
│  3 of 7 steps complete              │
│  Next: Register for health care     │
│                                     │
│  Explore                            │
│  ┌──────────┐ ┌──────────┐         │
│  │ 🏥       │ │ 📍       │         │
│  │ Services │ │ Places   │         │
│  └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐         │
│  │ 💼       │ │ 🛡️       │         │
│  │ Jobs     │ │ Safety   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  [Home | Explore | Ask | Profile]   │
└─────────────────────────────────────┘
```

**Key decisions:**
- Warm greeting with emoji — human, not clinical
- AI card has compass icon + description — inviting
- Journey is a visual path — dots connected by lines
- Essentials have icons — warmth through familiarity
- Labels always visible — clarity for newcomers

### Discover Screen Concept

```
┌─────────────────────────────────────┐
│  Explore your city                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 What are you looking for?│    │
│  └─────────────────────────────┘    │
│                                     │
│  [All] [Health] [Housing] [Jobs]    │
│                                     │
│  Nearby you                         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏥 Community Health Center  │    │
│  │ Open now · 0.3 km away      │    │
│  │ ✓ Verified                  │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🏠 Settlement Services      │    │
│  │ Opens at 9am · 1.2 km       │    │
│  │ ✓ Verified                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Home | Explore | Ask | Profile]   │
└─────────────────────────────────────┘
```

**Key decisions:**
- Warm, inviting header text
- Search bar is friendly ("What are you looking for?")
- Categories have icons + labels — warm, accessible
- Results have verification badges — trust
- Distance shown — practical, helpful

### Emotional Profile
- **Trust**: through warmth, verification badges, personal greeting
- **Guidance**: through journey path, compass companion, contextual suggestions
- **Intelligence**: through AI presence, contextual awareness
- **Hope**: through journey progress, "you're not alone"
- **Simplicity**: through generous spacing, clear hierarchy
- **Warmth**: through color temperature, personal tone, hand-drawn elements

### Strengths
- Immediately warm and welcoming — perfect for newcomers
- Compass as companion creates emotional connection
- Journey visualization makes progress tangible
- Warm palette reduces anxiety
- Human tone differentiates from cold tech products

### Risks
- Warm colors on dark can feel muddy on low-quality screens
- Emoji in headers may feel informal to some users
- Hand-drawn elements need careful execution to avoid looking amateur
- Two accent colors (emerald + amber) need strict discipline

---

## Direction C: "Living Compass"

> "The world is moving. So are you."

### Philosophy
Dynamic and alive. The compass is not a static mark — it's the core interaction metaphor. The app's visual language shifts with context: time of day, user journey stage, activity. Inspired by Arc Browser's aurora gradients, Airbnb's 2026 dynamic visual system, and Apple's Liquid Glass. The app feels like it breathes.

### Moodboard References
- Arc Browser's aurora gradients + Pip mascot + sidebar-as-paradigm
- Apple's Liquid Glass (2025) — translucent, adaptive, alive
- Airbnb's 2026 "dynamic visual system" — three interconnected layers
- A compass on a ship's bridge — always moving, always guiding
- Northern lights — ambient, alive, beautiful but functional

### Color System

**Base Palette (shifting):**

| Token | Dawn (6am-12pm) | Day (12pm-6pm) | Evening (6pm-10pm) | Night (10pm-6am) |
|-------|-----------------|-----------------|--------------------|--------------------|
| **Canvas** | `#0E0C14` | `#0C0E14` | `#100C0A` | `#080A12` |
| **Surface** | `#1A1620` | `#141822` | `#1C1612` | `#10141C` |
| **Text** | `#F0E8F4` | `#F5F0EB` | `#F4EDE4` | `#E8ECF0` |
| **Accent** | `#10B981` | `#10B981` | `#10B981` | `#10B981` |
| **Glow** | `rgba(16,185,129,0.12)` | `rgba(16,185,129,0.08)` | `rgba(16,185,129,0.10)` | `rgba(16,185,129,0.15)` |

**Static Tokens (never shift):**

| Token | Value | Usage |
|-------|-------|-------|
| **Accent** | `#10B981` | Emerald — always, everywhere |
| **Warm** | `#D4A040` | Saved, progress, achievements |
| **Error** | `#EF4444` | Danger |
| **Success** | `#10B981` | Positive |

**Key rules:**
- The time-shift is SUBTLE — never jarring, never more than 5% shift
- Emerald stays constant — it's the one stable color
- The shift communicates "this app is alive, aware of your world"
- Users can disable the shift (always use "Day" palette)

### Typography

| Level | Font | Weight | Size | Use |
|-------|------|--------|------|-----|
| **Display** | Inter | 700 | 32px | Screen titles — dramatic |
| **Title** | Inter | 600 | 20px | Section headers |
| **Body** | Inter | 400 | 15px | Reading text |
| **Caption** | Inter | 500 | 13px | Labels |
| **Small** | Inter | 600 | 11px | Badges |

**Signature:** Display at 32px with -1px tracking — dramatic but readable. Body generous at 1.5 line-height.

### Compass Signature
- **The living compass** — a compass that is always present, always subtle
- In the status bar area: a tiny compass needle that points to the user's "next step" direction
- On AI: the compass is the AI's avatar — a circle with a needle
- In empty states: the compass is a large illustration with a personalized message
- The compass needle rotates based on context:
  - AI thinking: fast rotation
  - AI responding: slow rotation
  - Idle: still
  - New content available: gentle wobble

### Navigation
- **Bottom tab bar**: 4 items — Home, Explore, AI, Profile
- Icons: clean line icons, 24px
- Active state: emerald fill + compass needle appears above icon
- Tab bar: translucent surface (glass effect) with backdrop blur
- Labels visible on active tab only — inactive are icon-only

### Card Concepts

**Card A: Standard**
- `Surface` background, 14px radius
- 1px border `rgba(255,255,255,0.04)` — barely visible
- Content: typography-led, clean hierarchy
- Press: border brightens, subtle glow appears, scale 0.98

**Card B: AI Hero (The Compass Card)**
- Gradient background: emerald glow → surface — the card breathes
- 16px radius, 1px emerald border at 20% opacity
- Content: compass icon (animated) + "Ask Naero" + contextual suggestion
- The compass needle gently rotates when the card is visible
- This card is the BRAND MOMENT — every user sees it on Home

**Card C: Journey Timeline**
- `Surface` background, 14px radius
- Vertical timeline: dots connected by lines
- Completed steps: emerald dots with check marks
- Current step: emerald glow pulse
- Future steps: muted dots
- Each step has a label and optional description

**Card D: Saved**
- `Surface` background, 14px radius
- Right border: 2px amber — "you saved this"
- Amber bookmark icon
- Content: standard typography

### AI Interaction Concepts

**Thinking State:**
- Compass icon in AI bubble rotates continuously
- "Thinking..." text with emerald dots
- Subtle emerald glow behind the message area
- The entire AI section breathes — slight opacity pulse

**Response State:**
- Message fades in with 200ms + 10px upward drift
- AI avatar: compass icon in emerald circle, needle still
- Source badges: emerald-bordered pills
- Follow-up chips: 2-3 suggestions, border-only

**Greeting (time-aware):**
- Dawn: "Good morning, Salem. The day is yours."
- Day: "Good afternoon, Salem. What do you need?"
- Evening: "Good evening, Salem. How was your day?"
- Night: "Good night, Salem. Anything before you rest?"

### Home Screen Concept

```
┌─────────────────────────────────────┐
│  ○ Naero                            │ ← compass status indicator
│                                     │
│  Good morning, Salem.               │
│  The day is yours.                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🧭 ↻ Ask Naero anything    │    │ ← compass rotates subtly
│  │ Find services, explore your │    │
│  │ city, or plan next steps.   │    │
│  └─────────────────────────────┘    │
│                                     │
│  YOUR JOURNEY                       │
│  ┌─────────────────────────────┐    │
│  │ ● Step 1 ✓                  │    │
│  │ │                            │    │
│  │ ● Step 2 ✓                  │    │
│  │ │                            │    │
│  │ ◉ Step 3 ← you are here     │    │
│  │ │                            │    │
│  │ ○ Step 4                     │    │
│  │ ○ Step 5                     │    │
│  └─────────────────────────────┘    │
│                                     │
│  EXPLORE                            │
│  ┌──────────┐ ┌──────────┐         │
│  │ Services │ │ Places   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  [Home | Explore | AI | Profile]    │
└─────────────────────────────────────┘
```

**Key decisions:**
- Time-aware greeting — feels alive
- AI card has rotating compass — brand signature
- Journey is a vertical timeline — visual, scannable
- Status bar has compass indicator — "Naero is here"
- Explore section is compact — AI and Journey are the heroes

### Discover Screen Concept

```
┌─────────────────────────────────────┐
│  Explore your city                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Search anything...       │    │
│  └─────────────────────────────┘    │
│                                     │
│  [All] [Health] [Housing] [Jobs]    │
│                                     │
│  Featured                           │
│  ┌─────────────────────────────┐    │
│  │ 🏥 Community Health Center  │    │
│  │ Open now · 0.3 km           │    │
│  │ ✓ Verified · ⭐ 4.8         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Recently viewed                    │
│  ┌──────────┐ ┌──────────┐         │
│  │ Service  │ │ Place    │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  [Home | Explore | AI | Profile]    │
└─────────────────────────────────────┘
```

**Key decisions:**
- Featured results get hero treatment — larger, more detail
- Ratings appear — social proof
- Recently viewed section — context-aware
- AI can suggest discoveries: "Based on your journey, you might need..."

### Emotional Profile
- **Trust**: through verification, consistency, always-available compass
- **Guidance**: through journey timeline, compass pointing to next step
- **Intelligence**: through time-awareness, contextual suggestions, living interface
- **Hope**: through visible journey progress, "the day is yours"
- **Simplicity**: through clean cards, minimal decoration
- **Warmth**: through time-aware greetings, ambient color shifts

### Strengths
- Most distinctive — no app does time-aware palettes
- Compass as living element creates deep brand connection
- Journey timeline is the most visual progress system
- AI feels truly alive with compass avatar and rotation states
- Screen-by-screen differentiation through context

### Risks
- Time-shift complexity — implementation overhead, potential bugs
- Color consistency issues across devices
- May feel over-designed if shifts are too aggressive
- Compass rotation could be distracting if not calibrated
- More components to build and maintain

---

## Comparison Matrix

| Criterion | A: Precision | B: Warm | C: Living |
|-----------|-------------|---------|-----------|
| **Instant recognition** | Medium — clean but generic dark | High — warmth stands out | Very High — time-aware is unique |
| **Emotional warmth** | Low — precise, clinical | Very High — designed for warmth | Medium — alive but not warm |
| **Trust** | Very High — precision = competence | High — warmth = safety | High — consistency = reliability |
| **AI presence** | Subtle — compass as indicator | Present — compass as companion | Dominant — compass as living avatar |
| **Brand signature** | Weak — compass too sparse | Medium — compass as friend | Strong — compass everywhere, alive |
| **Implementation complexity** | Low | Medium | High |
| **Differentiation** | Medium — looks like Linear | High — looks like nobody else | Very High — looks like the future |
| **Award potential** | Low — safe, expected | Medium — warm, human | High — innovative, memorable |

---

## Recommendation

**Direction C: "Living Compass"** is the strongest for Naero because:

1. **Naero's use case is unique** — no other app serves newcomers with AI guidance. The visual identity must be equally unique.
2. **The compass becomes the brand** — not as decoration, but as a living, breathing element that users associate with guidance.
3. **Time-awareness communicates intelligence** — the app feels alive, aware, and responsive to the user's world.
4. **The journey timeline makes progress visible** — hope is not implied, it's shown.
5. **Award potential** — Apple Design Awards reward innovation and thoughtful use of technology. A time-aware, context-shifting compass is exactly that.

**If Direction C is too risky**, Direction B ("Warm Compass") is the safe-but-distinctive choice — warmth, humanity, and a companion compass create strong brand identity without implementation complexity.

**Direction A** is the "don't screw up" option — clean, premium, and safe. But safe doesn't win awards.

---

## Next Steps

After direction selection:
1. Define the exact compass mark (SVG specification)
2. Define the time-shift algorithm (dawn/day/evening/night transitions)
3. Define the typography scale with exact values
4. Create the component library (Skeleton, Avatar, EmptyState, CompassIcon, Card variants)
5. Define the motion language (compass rotation speeds, entrance animations, press feedback)
6. Begin screen-by-screen implementation with device testing after each
