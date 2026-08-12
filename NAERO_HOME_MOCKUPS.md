# NAERO HOME SCREEN MOCKUPS

## High-Fidelity Specifications

### Device: Android, 1080×2340px, 360dpi

---

> *Three radically different directions for the Home screen. Each communicates a different primary emotion. Each follows the Design Language v2.0. Choose one direction to implement.*

---

# DIRECTION A: "THE HEARTH"

## Philosophy
The compass is the centerpiece. Everything gathers around it. The user approaches and feels: *I am home. I am safe. Someone is here.*

## Primary Emotion: Warmth
## Secondary Emotion: Intimacy

---

## Screen Layout (1080×2340px)

```
┌──────────────────────────────────────────────────────────┐
│ STATUS BAR (system)                    44px              │
│──────────────────────────────────────────────────────────│
│                                                          │
│                     48px (HUGE)                          │
│                                                          │
│                   ┌──────────┐                           │
│                   │          │                           │
│                   │ COMPASS  │  120px diameter           │
│                   │          │  Emerald (#10B981)         │
│                   └──────────┘  Shadow: GLOW             │
│                                                          │
│                     24px (XXL)                           │
│                                                          │
│              Good evening, Salem.                        │
│              (DISPLAY: 42px/800/-1.5)                    │
│              Color: #F5EDE4                              │
│                                                          │
│                     8px (SM)                             │
│                                                          │
│              What would you like                          │
│              to do tonight?                              │
│              (BODY: 15px/400/+0.1)                       │
│              Color: #9C9389                              │
│                                                          │
│                     48px (HUGE)                          │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ NEXT STEP                                          │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │ 🟢                                              │ │   │
│ │ │                                                 │ │   │
│ │ │  Open a bank account                           │ │   │
│ │ │  (H3: 20px/600/-0.3, #F5EDE4)                  │ │   │
│ │ │                                                 │ │   │
│ │ │  Most newcomers complete this                   │ │   │
│ │ │  in their first week.                           │ │   │
│ │ │  (BODY: 15px/400/+0.1, #9C9389)                 │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌─────────────────────────────┐               │ │   │
│ │ │  │  Start step                 │               │ │   │
│ │ │  │  (Primary Button)           │               │ │   │
│ │ │  │  BG: #10B981                │               │ │   │
│ │ │  │  Text: #F5EDE4, 15px/600    │               │ │   │
│ │ │  │  Height: 52px               │               │ │   │
│ │ │  │  Radius: 12px (MD)          │               │ │   │
│ │ │  └─────────────────────────────┘               │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ │ Background: #1A1612 (SURFACE)                      │   │
│ │ Border: 1px solid rgba(245,237,228,0.06) (SUBTLE)  │   │
│ │ Radius: 16px (LG)                                  │   │
│ │ Padding: 16px (LG)                                 │   │
│ │ Shadow: SMALL { y:2, blur:4, opacity:0.15 }        │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│                     16px (LG)                            │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ PROGRESS                                           │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │                                                 │ │   │
│ │ │  3 of 12 steps completed                       │ │   │
│ │ │  (SUBTITLE: 16px/500/0, #F5EDE4)               │ │   │
│ │ │                                                 │ │   │
│ │ │  ■■■□□□□□□□□□                                  │ │   │
│ │ │  (Amber: #C89B5C for filled, #241F1A for empty)│ │   │
│ │ │  Height: 6px, Radius: 3px                       │ │   │
│ │ │                                                 │ │   │
│ │ │  You're making real progress.                   │ │   │
│ │ │  (CAPTION: 13px/500/+0.2, #6B6359)              │ │   │
│ │ │                                                 │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ │ Background: #1A1612 (SURFACE)                      │   │
│ │ Border: 1px solid rgba(245,237,228,0.06) (SUBTLE)  │   │
│ │ Radius: 16px (LG)                                  │   │
│ │ Padding: 16px (LG)                                 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│                     32px (XXXL)                          │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ASK NAERO                                         │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │                                                 │ │   │
│ │ │  How can I help you settle in?                 │ │   │
│ │ │  (H3: 20px/600/-0.3, #F5EDE4)                  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────────────────────────────────────┐  │ │   │
│ │ │  │  Ask me anything...                      │  │ │   │
│ │ │  │  (Input Field)                           │  │ │   │
│ │ │  │  BG: #0C0A08 (CANVAS)                    │  │ │   │
│ │ │  │  Border: 1px solid rgba(245,237,228,0.06)│  │ │   │
│ │ │  │  → rgba(245,237,228,0.10) on focus       │  │ │   │
│ │ │  │  Radius: 12px (MD)                       │  │ │   │
│ │ │  │  Padding: 12px H, 16px V                 │  │ │   │
│ │ │  │  Placeholder: #6B6359 (TERTIARY)         │  │ │   │
│ │ │  │  Font: BODY 15px/400/+0.1                │  │ │   │
│ │ │  │  Breathing animation: 3s cycle           │  │ │   │
│ │ │  └──────────────────────────────────────────┘  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │   │
│ │ │  │ Housing  │ │Healthcare│ │ Language  │       │ │   │
│ │ │  │          │ │          │ │           │       │ │   │
│ │ │  │ Chip     │ │ Chip     │ │ Chip      │       │ │   │
│ │ │  │ BG:#1A1612│ │BG:#1A1612│ │BG:#1A1612│       │ │   │
│ │ │  │ Border:  │ │ Border:  │ │ Border:   │       │ │   │
│ │ │  │ SUBTLE   │ │ SUBTLE   │ │ SUBTLE    │       │ │   │
│ │ │  │ Text:    │ │ Text:    │ │ Text:     │       │ │   │
│ │ │  │ #9C9389  │ │ #9C9389  │ │ #9C9389   │       │ │   │
│ │ │  │ Font:    │ │ Font:    │ │ Font:     │       │ │   │
│ │ │  │ 13px/600 │ │ 13px/600 │ │ 13px/600  │       │ │   │
│ │ │  │ Radius:  │ │ Radius:  │ │ Radius:   │       │ │   │
│ │ │  │ 9999px   │ │ 9999px   │ │ 9999px    │       │ │   │
│ │ │  │ Padding: │ │ Padding: │ │ Padding:  │       │ │   │
│ │ │  │ 8px H,   │ │ 8px H,   │ │ 8px H,    │       │ │   │
│ │ │  │ 4px V    │ │ 4px V    │ │ 4px V     │       │ │   │
│ │ │  └──────────┘ └──────────┘ └──────────┘       │ │   │
│ │ │                                                 │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ TAB BAR                                            │   │
│ │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                       │   │
│ │ │ 🧭 │ │ 🔍 │ │ 👥 │ │ 👤 │                       │   │
│ │ │Home│ │Disc│ │Comm│ │Prof│                       │   │
│ │ │●   │ │    │ │    │ │    │                       │   │
│ │ └────┘ └────┘ └────┘ └────┘                       │   │
│ │ BG: #1A1612 (SURFACE)                              │   │
│ │ Active: #10B981 (EMERALD) + emerald dot            │   │
│ │ Inactive: #6B6359 (TERTIARY)                       │   │
│ │ Icon size: 22px                                    │   │
│ │ Label: 10px/500/+0.3                               │   │
│ │ Height: 64px                                       │   │
│ │ Border-top: 1px solid rgba(245,237,228,0.06)       │   │
│ └────────────────────────────────────────────────────┘   │
│  34px bottom safe area                                    │
└──────────────────────────────────────────────────────────┘
```

## Spacing Map

```
Top of screen
  │
  ├── 44px (status bar)
  ├── 48px (HUGE) ← compass breathing room
  ├── 120px (compass)
  ├── 24px (XXL) ← compass to greeting
  ├── 50px (DISPLAY typography height)
  ├── 8px (SM) ← greeting to subtitle
  ├── 20px (subtitle height)
  ├── 48px (HUGE) ← hero to content
  ├── Card 1 (Next Step): ~160px
  ├── 16px (LG) ← card gap
  ├── Card 2 (Progress): ~80px
  ├── 32px (XXXL) ← content to AI section
  ├── AI Section: ~140px
  ├── Flexible space
  ├── Tab bar: 64px
  └── 34px (bottom safe area)
```

## Color Map

```
Background:    #0C0A08 (CANVAS)
Cards:         #1A1612 (SURFACE)
Borders:       rgba(245,237,228,0.06) (SUBTLE)
Primary text:  #F5EDE4 (TEXT-PRIMARY)
Secondary:     #9C9389 (TEXT-SECONDARY)
Tertiary:      #6B6359 (TEXT-TERTIARY)
Accent:        #10B981 (EMERALD) — compass, button, active tab
Progress:      #C89B5C (AMBER) — progress bar filled
Empty:         #241F1A (ELEVATED) — progress bar empty
Tab bar BG:    #1A1612 (SURFACE)
```

## Typography Map

```
DISPLAY:  "Good evening, Salem." — 42px/800/-1.5, #F5EDE4
SUBTITLE: "What would you like to do tonight?" — 15px/400/+0.1, #9C9389
H3:       "Open a bank account" — 20px/600/-0.3, #F5EDE4
BODY:     "Most newcomers complete this..." — 15px/400/+0.1, #9C9389
BODY-BOLD:"Start step" — 15px/600/+0.1, #F5EDE4
SUBTITLE: "3 of 12 steps completed" — 16px/500/0, #F5EDE4
CAPTION:  "You're making real progress." — 13px/500/+0.2, #6B6359
H3:       "How can I help you settle in?" — 20px/600/-0.3, #F5EDE4
BODY:     "Ask me anything..." — 15px/400/+0.1, #6B6359
SMALL-BOLD:"Housing" — 11px/600/+0.3, #9C9389
```

## Motion Intentions

```
1. COMPASS APPEARANCE (0-1s):
   - Compass fades in from 0 to 1 opacity
   - Compass scales from 0.8 to 1.0
   - Emerald glow expands from center
   - Duration: 800ms, SPRING-GENTLE

2. GREETING APPEARANCE (1-2s):
   - "Good evening, Salem" fades in
   - Slight upward translation (8px → 0)
   - Duration: 300ms, SPRING-STANDARD
   - Stagger: 100ms after compass settles

3. SUBTITLE APPEARANCE (1.5-2.5s):
   - "What would you like to do tonight?" fades in
   - Duration: 300ms, SPRING-STANDARD
   - Stagger: 50ms after greeting

4. CARDS APPEARANCE (2-3s):
   - Cards fade in + translate up (12px → 0)
   - Duration: 300ms, SPRING-STANDARD
   - Stagger: 100ms between cards

5. AI SECTION APPEARANCE (3-3.5s):
   - AI section fades in
   - Input starts breathing animation (3s cycle)
   - Duration: 300ms, SPRING-STANDARD

6. COMPASS AMBIENT (continuous):
   - Rotation: 1 revolution per 60 seconds
   - Glow: subtle pulsing (6s cycle)

7. INPUT BREATHING (continuous):
   - Border opacity: 0.06 ↔ 0.10
   - Cycle: 3 seconds

8. SCROLL REVEAL (if scrolled):
   - Elements fade in from 60% opacity
   - Translate up 8px
   - Stagger: 50ms per element
```

## Emotional Arc

```
0s:    Black screen. Anticipation.
0.5s:  Compass appears. Emerald glow on warm darkness.
       → Feeling: "Something alive is here."
1s:    Greeting appears. "Good evening, Salem."
       → Feeling: "Someone knows my name."
2s:    Subtitle appears. "What would you like to do tonight?"
       → Feeling: "Someone is asking me what I need."
2.5s:  Next step card appears. "Open a bank account."
       → Feeling: "I know what to do next."
3s:    Progress card appears. "3 of 12 steps."
       → Feeling: "I'm already making progress."
3.5s:  AI input starts breathing. "Ask me anything..."
       → Feeling: "The AI is here. I can talk to it."
4s+:   User scrolls. More content reveals.
       → Feeling: "There's more here. But I'm not overwhelmed."
```

## Accessibility

```
Touch targets: All buttons 52px height, 44px minimum width
Contrast:      #F5EDE4 on #0C0A08 = 14.2:1 (AAA)
               #9C9389 on #0C0A08 = 5.8:1 (AA)
               #6B6359 on #0C0A08 = 3.2:1 (AA for large text)
               #10B981 on #0C0A08 = 6.4:1 (AA)
RTL:           All text right-aligned when RTL
Screen reader: All elements labeled
Reduce motion: All animations replaced with fades
```

---

# DIRECTION B: "THE OBSERVATORY"

## Philosophy
The home screen is a window. You see everything at once — your journey, your community, your world. The user looks out and thinks: *I understand where I am. I know what to do.*

## Primary Emotion: Clarity
## Secondary Emotion: Control

---

## Screen Layout (1080×2340px)

```
┌──────────────────────────────────────────────────────────┐
│ STATUS BAR (system)                    44px              │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Good evening, Salem.                                    │
│  (H1: 32px/800/-1.0, #F5EDE4)                           │
│                                                          │
│  ┌──────────┐  You've completed 3 of 12 steps.          │
│  │          │  (SUBTITLE: 16px/500/0, #F5EDE4)           │
│  │ COMPASS  │                                            │
│  │ (64px)   │  ■■■■■■■■■■■■■■■□□□□□□□□□□               │
│  │ Ambient  │  (Amber #C89B5C / #241F1A)                 │
│  │          │  Height: 8px, Radius: 4px                  │
│  └──────────┘                                            │
│               Next: Open a bank account.                  │
│               (BODY: 15px/400/+0.1, #9C9389)             │
│                                                          │
│                     24px (XXL)                            │
│                                                          │
│  YOUR WORLD                                              │
│  (H2: 28px/700/-0.5, #F5EDE4)                           │
│                                                          │
│  ┌────────────────┐ ┌────────────────┐                   │
│  │                │ │                │                   │
│  │  🟢 NEXT STEP  │ │  👥 COMMUNITY  │                   │
│  │                │ │                │                   │
│  │  Open a bank   │ │  3 new posts   │                   │
│  │  account       │ │  near you      │                   │
│  │  (H3: 20px/600 │ │  (H3: 20px/600 │                   │
│  │  #F5EDE4)      │ │  #F5EDE4)      │                   │
│  │                │ │                │                   │
│  │  Most newcomers│ │  "How to open  │                   │
│  │  do this in    │ │  a bank account│                   │
│  │  their first   │ │  in Hungary"   │                   │
│  │  week.         │ │  — Sarah       │                   │
│  │  (BODY: 15px/  │ │  (BODY: 15px/  │                   │
│  │  400/+0.1)     │ │  400/+0.1)     │                   │
│  │  #9C9389       │ │  #9C9389       │                   │
│  │                │ │                │                   │
│  │  ┌──────────┐  │ │  ┌──────────┐  │                   │
│  │  │ Start    │  │ │  │ View all │  │                   │
│  │  └──────────┘  │ │  └──────────┘  │                   │
│  │                │ │                │                   │
│  │ BG:#1A1612     │ │ BG:#1A1612     │                   │
│  │ Border:SUBTLE  │ │ Border:SUBTLE  │                   │
│  │ Radius:16px    │ │ Radius:16px    │                   │
│  │ Padding:16px   │ │ Padding:16px   │                   │
│  │ Width: 48%     │ │ Width: 48%     │                   │
│  │ Height: 200px  │ │ Height: 200px  │                   │
│  └────────────────┘ └────────────────┘                   │
│                                                          │
│  ┌──────────────────────────────────────┐                │
│  │                                      │                │
│  │  🔍 DISCOVER                         │                │
│  │                                      │                │
│  │  Nearby essentials                   │                │
│  │  (H3: 20px/600, #F5EDE4)             │                │
│  │                                      │                │
│  │  ┌────────────────────────────────┐  │                │
│  │  │ 🏦 OTP Bank         0.3 km    │  │                │
│  │  │   Open now • Hungarian        │  │                │
│  │  │   (15px/400, #9C9389)         │  │                │
│  │  │   (13px/500, #6B6359)         │  │                │
│  │  └────────────────────────────────┘  │                │
│  │  ┌────────────────────────────────┐  │                │
│  │  │ 🏥 Semmelweis Clinic  1.2 km  │  │                │
│  │  │   Open now • Healthcare       │  │                │
│  │  └────────────────────────────────┘  │                │
│  │                                      │                │
│  │  BG:#1A1612   Border:SUBTLE         │                │
│  │  Radius:16px  Padding:16px          │                │
│  │  Width: 100%  Height: 180px         │                │
│  └──────────────────────────────────────┘                │
│                                                          │
│                     24px (XXL)                            │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ASK NAERO                                         │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │  How can I help you settle in?                 │ │   │
│ │ │  (H3: 20px/600/-0.3, #F5EDE4)                  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────────────────────────────────────┐  │ │   │
│ │ │  │  Ask me anything...                      │  │ │   │
│ │ │  │  (Input — same as Direction A)           │  │ │   │
│ │ │  └──────────────────────────────────────────┘  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │   │
│ │ │  │ Housing  │ │Healthcare│ │ Language  │       │ │   │
│ │ │  │          │ │          │ │           │       │ │   │
│ │ │  │ Chips — same as Direction A                  │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ TAB BAR (same as Direction A)                      │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Spacing Map

```
Top of screen
  │
  ├── 44px (status bar)
  ├── 20px (XL) ← screen margin
  ├── Greeting area: ~130px (compass + text + progress)
  ├── 24px (XXL) ← greeting to "Your World"
  ├── "Your World" label: ~36px
  ├── 16px (LG) ← label to cards
  ├── Cards row: 200px
  ├── 16px (LG) ← row gap
  ├── Discover card: 180px
  ├── 24px (XXL) ← discover to AI
  ├── AI section: ~140px
  ├── Flexible space
  ├── Tab bar: 64px
  └── 34px (bottom safe area)
```

## Color Map

```
Background:    #0C0A08 (CANVAS)
Cards:         #1A1612 (SURFACE)
Borders:       rgba(245,237,228,0.06) (SUBTLE)
Primary text:  #F5EDE4 (TEXT-PRIMARY)
Secondary:     #9C9389 (TEXT-SECONDARY)
Tertiary:      #6B6359 (TEXT-TERTIARY)
Accent:        #10B981 (EMERALD) — compass, active tab, "Start" button
Progress:      #C89B5C (AMBER) — progress bar filled
Empty:         #241F1A (ELEVATED) — progress bar empty
Tab bar BG:    #1A1612 (SURFACE)
```

## Typography Map

```
H1:       "Good evening, Salem." — 32px/800/-1.0, #F5EDE4
SUBTITLE: "You've completed 3 of 12 steps." — 16px/500/0, #F5EDE4
BODY:     "Next: Open a bank account." — 15px/400/+0.1, #9C9389
H2:       "YOUR WORLD" — 28px/700/-0.5, #F5EDE4
H3:       "Open a bank account" — 20px/600/-0.3, #F5EDE4
BODY:     "Most newcomers do this..." — 15px/400/+0.1, #9C9389
BODY-BOLD:"Start" — 15px/600/+0.1, #F5EDE4
H3:       "3 new posts near you" — 20px/600/-0.3, #F5EDE4
BODY:     '"How to open a bank account..." — 15px/400/+0.1, #9C9389
CAPTION:  "— Sarah" — 13px/500/+0.2, #6B6359
H3:       "Nearby essentials" — 20px/600/-0.3, #F5EDE4
BODY:     "OTP Bank" — 15px/600/+0.1, #F5EDE4
CAPTION:  "0.3 km" — 13px/500/+0.2, #9C9389
CAPTION:  "Open now • Hungarian" — 13px/500/+0.2, #6B6359
H3:       "How can I help you settle in?" — 20px/600/-0.3, #F5EDE4
```

## Motion Intentions

```
1. GREETING APPEARANCE (0-0.5s):
   - "Good evening, Salem" fades in
   - Duration: 200ms, SPRING-STANDARD

2. COMPASS APPEARANCE (0-1s):
   - Compass fades in at 64px
   - Duration: 300ms, SPRING-GENTLE

3. PROGRESS BAR (0.5-1.5s):
   - Bar fills from 0% to 25% (3/12)
   - Amber color brightens during animation
   - Duration: 800ms, SPRING-GENTLE

4. "YOUR WORLD" LABEL (1-1.3s):
   - Fades in
   - Duration: 200ms

5. WORLD CARDS (1.3-2s):
   - Two cards fade in + translate up (16px → 0)
   - Duration: 300ms, SPRING-STANDARD
   - Stagger: 100ms between cards

6. DISCOVER CARD (2-2.5s):
   - Fades in + translate up (16px → 0)
   - Duration: 300ms, SPRING-STANDARD

7. AI SECTION (2.5-3s):
   - Fades in
   - Input starts breathing

8. SCROLL REVEAL:
   - Elements fade in from 60% opacity
   - Translate up 8px
   - Stagger: 50ms per element
```

## Emotional Arc

```
0s:    Black screen.
0.5s:  Greeting + compass appear.
       → Feeling: "I'm oriented. I know where I am."
1s:    Progress bar fills.
       → Feeling: "I can see my progress at a glance."
1.5s:  "YOUR WORLD" appears.
       → Feeling: "There's more here."
2s:    World cards appear (Next Step, Community).
       → Feeling: "I can see everything at once."
2.5s:  Discover card appears.
       → Feeling: "The world is right here."
3s:    AI input starts breathing.
       → Feeling: "I can ask for help anytime."
```

---

# DIRECTION C: "THE RIVER"

## Philosophy
The home screen is a river. Content flows from top to bottom. The compass is the source. Journey steps, community, discover — all connected in a single stream. The user feels: *Everything flows. I am moving forward.*

## Primary Emotion: Flow
## Secondary Emotion: Momentum

---

## Screen Layout (1080×2340px)

```
┌──────────────────────────────────────────────────────────┐
│ STATUS BAR (system)                    44px              │
│──────────────────────────────────────────────────────────│
│                                                          │
│                     48px (HUGE)                          │
│                                                          │
│                   ┌──────────┐                           │
│                   │          │                           │
│                   │ COMPASS  │  80px diameter            │
│                   │          │  Emerald                  │
│                   └──────────┘  Glow: subtle             │
│                                                          │
│                     16px (LG)                            │
│                                                          │
│              Good evening, Salem.                        │
│              (H1: 32px/800/-1.0, #F5EDE4)                │
│              Center aligned                              │
│                                                          │
│                     32px (XXXL)                          │
│                                                          │
│                     ┌───┐                                │
│                     │ ● │  Node marker                   │
│                     └─┬─┘  (Emerald circle, 12px)        │
│                       │                                  │
│                       │  Vertical line                   │
│                       │  (1px, rgba(16,185,129,0.20))    │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │                 │                         │
│              │  NEXT STEP      │                         │
│              │                 │                         │
│              │  Open a bank    │                         │
│              │  account        │                         │
│              │  (H3: 20px/600  │                         │
│              │  #F5EDE4)       │                         │
│              │                 │                         │
│              │  Most newcomers │                         │
│              │  do this in     │                         │
│              │  their first    │                         │
│              │  week.          │                         │
│              │  (BODY: 15px/   │                         │
│              │  400, #9C9389)  │                         │
│              │                 │                         │
│              │  ┌──────────┐   │                         │
│              │  │ Start    │   │                         │
│              │  └──────────┘   │                         │
│              │                 │                         │
│              │ BG:#1A1612      │                         │
│              │ Border: none    │                         │
│              │ Radius: 16px    │                         │
│              │ Padding: 16px   │                         │
│              │ Left margin:40px│                         │
│              └─────────────────┘                         │
│                       │                                  │
│                       │  Vertical line continues         │
│                       │                                  │
│                     ┌───┐                                │
│                     │ ● │  Node marker                   │
│                     └─┬─┘  (Amber circle, 12px)          │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │                 │                         │
│              │  COMMUNITY      │                         │
│              │                 │                         │
│              │  Sarah in       │                         │
│              │  Budapest:      │                         │
│              │  "Just opened   │                         │
│              │  my account at  │                         │
│              │  OTP. The       │                         │
│              │  process was    │                         │
│              │  simpler than   │                         │
│              │  I expected."   │                         │
│              │  (BODY: 15px/   │                         │
│              │  400, #F5EDE4)  │                         │
│              │                 │                         │
│              │  — 2 hours ago  │                         │
│              │  (CAPTION: 13px │                         │
│              │  #6B6359)       │                         │
│              │                 │                         │
│              │ BG:#1A1612      │                         │
│              │ Border: none    │                         │
│              │ Radius: 16px    │                         │
│              │ Padding: 16px   │                         │
│              │ Left margin:40px│                         │
│              └─────────────────┘                         │
│                       │                                  │
│                       │  Vertical line continues         │
│                       │                                  │
│                     ┌───┐                                │
│                     │ ● │  Node marker                   │
│                     └─┬─┘  (Emerald circle, 12px)        │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │                 │                         │
│              │  DISCOVER       │                         │
│              │                 │                         │
│              │  OTP Bank       │                         │
│              │  (BODY-BOLD:    │                         │
│              │  15px/600,      │                         │
│              │  #F5EDE4)       │                         │
│              │                 │                         │
│              │  0.3 km away    │                         │
│              │  Open now       │                         │
│              │  (BODY: 15px/   │                         │
│              │  400, #9C9389)  │                         │
│              │                 │                         │
│              │ BG:#1A1612      │                         │
│              │ Border: none    │                         │
│              │ Radius: 16px    │                         │
│              │ Padding: 16px   │                         │
│              │ Left margin:40px│                         │
│              └─────────────────┘                         │
│                       │                                  │
│                       │  Vertical line continues         │
│                       │                                  │
│                     ┌───┐                                │
│                     │ ● │  Node marker                   │
│                     └─┬─┘  (Amber circle, 12px)          │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │                 │                         │
│              │  PROGRESS       │                         │
│              │                 │                         │
│              │  You completed  │                         │
│              │  3 steps.       │                         │
│              │  (SUBTITLE:     │                         │
│              │  16px/500,      │                         │
│              │  #F5EDE4)       │                         │
│              │                 │                         │
│              │  You're making  │                         │
│              │  real progress. │                         │
│              │  (BODY: 15px/   │                         │
│              │  400, #9C9389)  │                         │
│              │                 │                         │
│              │ BG:#1A1612      │                         │
│              │ Border: none    │                         │
│              │ Radius: 16px    │                         │
│              │ Padding: 16px   │                         │
│              │ Left margin:40px│                         │
│              └─────────────────┘                         │
│                       │                                  │
│                       │  Vertical line continues         │
│                       │  (fades out at bottom)           │
│                                                          │
│                     24px (XXL)                            │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ASK NAERO                                         │   │
│ │ ┌────────────────────────────────────────────────┐ │   │
│ │ │  How can I help you settle in?                 │ │   │
│ │ │  (H3: 20px/600/-0.3, #F5EDE4)                  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────────────────────────────────────┐  │ │   │
│ │ │  │  Ask me anything...                      │  │ │   │
│ │ │  │  (Input — same as Direction A)           │  │ │   │
│ │ │  └──────────────────────────────────────────┘  │ │   │
│ │ │                                                 │ │   │
│ │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │   │
│ │ │  │ Housing  │ │Healthcare│ │ Language  │       │ │   │
│ │ │  │ Chips — same as Direction A                  │ │   │
│ │ └────────────────────────────────────────────────┘ │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ TAB BAR (same as Direction A)                      │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Spacing Map

```
Top of screen
  │
  ├── 44px (status bar)
  ├── 48px (HUGE) ← compass breathing room
  ├── 80px (compass)
  ├── 16px (LG) ← compass to greeting
  ├── 40px (H1 height)
  ├── 32px (XXXL) ← greeting to river
  ├── Node 1 (Next Step): ~180px
  ├── 24px (gap between nodes)
  ├── Node 2 (Community): ~140px
  ├── 24px (gap between nodes)
  ├── Node 3 (Discover): ~100px
  ├── 24px (gap between nodes)
  ├── Node 4 (Progress): ~100px
  ├── 24px (XXL) ← river to AI
  ├── AI section: ~140px
  ├── Tab bar: 64px
  └── 34px (bottom safe area)
```

## Color Map

```
Background:    #0C0A08 (CANVAS)
Nodes:         #1A1612 (SURFACE) — no border, just surface
Node markers:  #10B981 (EMERALD) for action nodes
               #C89B5C (AMBER) for reflection nodes
Vertical line: rgba(16,185,129,0.20) — emerald at 20% opacity
Primary text:  #F5EDE4 (TEXT-PRIMARY)
Secondary:     #9C9389 (TEXT-SECONDARY)
Tertiary:      #6B6359 (TEXT-TERTIARY)
Accent:        #10B981 (EMERALD) — compass, node markers, active tab
Tab bar BG:    #1A1612 (SURFACE)
```

## Typography Map

```
H1:       "Good evening, Salem." — 32px/800/-1.0, #F5EDE4
H3:       "Open a bank account" — 20px/600/-0.3, #F5EDE4
BODY:     "Most newcomers do this..." — 15px/400/+0.1, #9C9389
BODY-BOLD:"Start" — 15px/600/+0.1, #F5EDE4
BODY:     "Sarah in Budapest:" — 15px/600/+0.1, #F5EDE4
BODY:     '"Just opened my account..." — 15px/400/+0.1, #F5EDE4
CAPTION:  "— 2 hours ago" — 13px/500/+0.2, #6B6359
BODY-BOLD:"OTP Bank" — 15px/600/+0.1, #F5EDE4
BODY:     "0.3 km away • Open now" — 15px/400/+0.1, #9C9389
SUBTITLE: "You completed 3 steps." — 16px/500/0, #F5EDE4
BODY:     "You're making real progress." — 15px/400/+0.1, #9C9389
H3:       "How can I help you settle in?" — 20px/600/-0.3, #F5EDE4
```

## Motion Intentions

```
1. COMPASS APPEARANCE (0-1s):
   - Compass fades in + scales from 0.8 to 1.0
   - Emerald glow expands
   - Duration: 800ms, SPRING-GENTLE

2. GREETING (0.5-1s):
   - "Good evening, Salem" fades in
   - Duration: 300ms, SPRING-STANDARD

3. RIVER APPEARANCE (1-2.5s):
   - Vertical line draws downward (like water flowing)
   - Duration: 1.5s, SPRING-GENTLE
   - Each node appears as the line reaches it
   - Node fade-in: 200ms, SPRING-STANDARD
   - Stagger: 300ms between nodes

4. NODE 1 (Next Step) (1.2-1.5s):
   - Emerald marker pulses once
   - Card fades in + slides from left (20px → 0)
   - Duration: 300ms, SPRING-STANDARD

5. NODE 2 (Community) (1.5-1.8s):
   - Amber marker pulses once
   - Card fades in + slides from left (20px → 0)
   - Duration: 300ms, SPRING-STANDARD

6. NODE 3 (Discover) (1.8-2.1s):
   - Emerald marker pulses once
   - Card fades in + slides from left (20px → 0)
   - Duration: 300ms, SPRING-STANDARD

7. NODE 4 (Progress) (2.1-2.4s):
   - Amber marker pulses once
   - Card fades in + slides from left (20px → 0)
   - Duration: 300ms, SPRING-STANDARD

8. AI SECTION (2.5-3s):
   - Fades in
   - Input starts breathing

9. COMPASS AMBIENT (continuous):
   - Rotation: 1 revolution per 60 seconds
   - Glow: subtle pulsing (6s cycle)

10. VERTICAL LINE (continuous):
    - Subtle shimmer effect (opacity 0.15 ↔ 0.25)
    - Cycle: 4 seconds
```

## Emotional Arc

```
0s:    Black screen.
0.5s:  Compass appears, centered, glowing.
       → Feeling: "The source. The guide."
1s:    Greeting appears.
       → Feeling: "Someone knows me."
1.2s:  The river begins to flow. First node appears.
       → Feeling: "I'm moving."
1.5s:  Community node appears.
       → Feeling: "Others are on this path too."
1.8s:  Discover node appears.
       → Feeling: "The world is connected to my journey."
2.1s:  Progress node appears.
       → Feeling: "I've already come this far."
2.5s:  AI input starts breathing.
       → Feeling: "I can talk to the guide anytime."
3s+:   User scrolls down the river.
       → Feeling: "I'm flowing through my life here."
```

---

# COMPARISON MATRIX

| Criterion | The Hearth | The Observatory | The River |
|-----------|-----------|----------------|-----------|
| **Primary emotion** | Warmth | Clarity | Flow |
| **Compass size** | 120px (hero) | 64px (ambient) | 80px (source) |
| **Compass position** | Center, top | Left, compact | Center, top |
| **Content layout** | Vertical stack | Grid (2-col + full) | Vertical flow (nodes) |
| **Cards** | 2 cards | 4 cards (2 small, 1 medium, 1 AI) | 4 nodes |
| **Borders** | SUBTLE on cards | SUBTLE on cards | No borders (surface only) |
| **Vertical structure** | Spacing-based | Grid-based | Line-based |
| **Typography hero** | DISPLAY (42px) | H1 (32px) | H1 (32px) |
| **Information density** | Low | High | Medium |
| **Uniqueness** | High | Medium | Very high |
| **Emotional resonance** | Very high | Medium | High |
| **Scannability** | Low | Very high | Low |
| **Scroll depth** | Short | Medium | Long |
| **First impression** | "This is different" | "This is organized" | "This is alive" |
| **Best for** | Anxious newcomers | Power users | Users who want momentum |

---

## Which Direction to Choose?

**Choose "The Hearth" if:**
- The primary goal is emotional connection
- The target user is anxious, overwhelmed, or uncertain
- The product should feel like a safe space
- The compass should be the hero
- Warmth is the most important emotion

**Choose "The Observatory" if:**
- The primary goal is orientation and clarity
- The target user wants to understand their situation quickly
- The product should feel like a personal command center
- Information at a glance is the priority
- Control is the most important emotion

**Choose "The River" if:**
- The primary goal is momentum and progress
- The target user wants to feel like they're moving forward
- The product should feel like a journey
- Narrative and flow are the priorities
- Movement is the most important emotion

---

*All three directions follow Design Language v2.0.*
*All three use the same tokens, components, and principles.*
*The choice is which emotion should be Naero's primary signature.*
