# NAERO: Product Vision v2

> "The best guide is the one you forget is there — until you need them."

---

## Research Foundation

This document is built on analysis of 25+ products and design disciplines:

**Digital Products:** Apple Design Award winners (Flighty, Things 3, Halide, Procreate, Calm, Bear, Darkroom, Any Distance), AI products (ChatGPT, Perplexity, Apple Intelligence, Humane, Rabbit R1), productivity (Linear, Superhuman, Notion, Stripe Dashboard), consumer (Spotify, Duolingo, Pinterest, Nothing OS), wellness (Calm, Headspace).

**Psychology:** Don Norman's emotional design, cognitive load theory, Gestalt principles, color psychology research, motion-as-meaning, typography-as-voice, white space as luxury, progressive disclosure, peak-end rule, attachment theory.

**Non-Digital:** Tadao Ando (architecture), Kengo Kuma (materials), Japanese ma/wabi-sabi, Tesla/Rivian/Porsche (automotive), Aman/Aesop (hospitality), Kubrick/Villeneuve/Miyazaki (cinema).

---

## Part 1: The Hierarchy

### The Hero's Journey

| Role | Who | Design Principle |
|---|---|---|
| **The Hero** | The immigrant | The user's life fills every screen. They are always the protagonist. |
| **The Guide** | Naero (the AI) | Quietly supports. Disappears when the hero acts. Appears when the hero needs direction. |
| **The Compass** | The Orb | The guide's quiet presence. Not the hero. Not the focus. A pocket compass — always there, not always visible. |
| **The Quest** | Starting a new life | Every screen advances the quest. Nothing is decorative. Everything serves the journey. |

### The Fundamental Rule

**When the user's life is on screen, the AI disappears.**
**When the user needs direction, the AI appears.**

The AI is Gandalf. The user is Frodo. The screen shows Middle-earth, not Gandalf's face.

### What This Means for Design

| Before (AI-centric) | After (User-centric) |
|---|---|
| The Orb dominates the Home screen | The user's life fills the Home screen |
| "The AI knows your name" | "You are here in your journey" |
| "Talk to the AI" | "This is what's happening in your world" |
| The AI is the visual hero | The user's progress is the visual hero |
| The Orb is 120pt centered | The Orb is 40pt, top-right corner |
| The screen says "I am Naero" | The screen says "This is your life" |

---

## Part 2: What Naero Is

### The One-Line Vision

**Naero is the first digital companion that makes starting a new life feel possible.**

Not an app. Not a tool. A companion — present, personal, and quiet.

### The Emotional Contract

When someone opens Naero, they are making an unspoken agreement:

> "I am starting something new. I don't know what I'm doing. I need someone who understands."

Naero's side of this contract:

> "I see you. I know where you are. I know what comes next. You are not alone."

### The Six Questions

Every screen must answer at least one of these questions. If it doesn't, it doesn't belong on screen.

| Question | What it means | Example answer |
|---|---|---|
| **"Who am I today?"** | The user's current state and identity | "You're a mechanical engineer from Syria, 3 weeks into Budapest" |
| **"What happened since yesterday?"** | Recent progress, events, changes | "You opened a bank account. You found a SIM card." |
| **"What should I do next?"** | The single most important next step | "Apply for your work permit. Here's how." |
| **"What's around me?"** | Nearby opportunities, places, resources | "A bakery nearby. A community center. A library." |
| **"Who can help me?"** | People who understand the user's situation | "Amira arrived 2 weeks before you. She found housing." |
| **"How is my life improving?"** | Progress, growth, milestones | "You've completed 3 of 12 steps. The garden is growing." |

### The Three Feelings

1. **"I am safe."** — The warmth of the space. The calm of the interface. The sense that someone is watching over you.

2. **"Someone understands."** — Not "the AI is smart." But "this app knows where I am in my life." The intelligence is invisible. The understanding is felt.

3. **"I know what to do next."** — Not a list of options. Not a dashboard of metrics. A single, clear next step — and the confidence that you can do it.

---

## Part 3: The UX Concept

### The Home Screen: "Your Life Right Now"

The Home screen answers: "Who am I today? What happened? What's next?"

**Layout:**

```
┌──────────────────────────────────────┐
│                              [●] 40pt│  ← Orb: quiet, top-right, 40pt
│                                      │    Guide's compass. Always present.
│  Good evening, Salem.                │    Not the hero.
│                                      │
│  You've been in Budapest for         │  ← The user's story (Display/Body)
│  21 days. A lot has happened.        │    AI-crafted, personalized
│                                      │
│  ┌────────────────────────────────┐  │
│  │  YOUR NEXT STEP               │  │  ← The single most important action
│  │                               │  │    Not a card. Not a button.
│  │  Apply for your work permit.  │  │    A clear, actionable sentence.
│  │  Most newcomers do this in    │  │    The AI curated this.
│  │  their 3rd week.             │  │
│  │                               │  │
│  │  [ Start → ]                  │  │  ← Warm emerald, quiet CTA
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  SINCE LAST TIME              │  │  ← What happened (progress)
│  │                               │  │    Checkmarks, not progress bars
│  │  ✓  SIM card                   │  │    Warm amber for completed
│  │  ✓  Bank account               │  │
│  │  ✓  Address registration       │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  NEARBY                       │  │  ← What's around (context)
│  │                               │  │    AI-curated places
│  │  A bakery that speaks your    │  │    Story format, not list
│  │  language. 0.3 km.            │  │
│  │                               │  │
│  │  Community center. Thursday   │  │
│  │  gatherings. 1.2 km.          │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  PEOPLE LIKE YOU              │  │  ← Community (connection)
│  │                               │  │    Stories, not profiles
│  │  Amira arrived 2 weeks before │  │
│  │  you. She found housing.      │  │
│  └────────────────────────────────┘  │
│                                      │
│  ╭────────────────────────────────╮  │
│  │  ✦  Ask Naero anything...     │  │  ← Input: invitation to dialogue
│  ╰────────────────────────────────╯  │    The AI is always available
│                                      │    But never forced.
│  ┌────┐ ┌────┐ ┌────┐              │  ← 3 tabs (not 5)
│  │ 🏠 │ │ 🧭 │ │ 👥 │              │    Home, World, People
│  └────┘ └────┘ └────┘              │
└──────────────────────────────────────┘
```

**Key Design Decisions:**

1. **The Orb is 40pt, top-right.** It's the guide's compass — present, but not the focus. You know it's there. You can tap it anytime. But the screen isn't about the Orb. It's about YOUR life.

2. **The user's story opens the screen.** "You've been in Budapest for 21 days. A lot has happened." This is the AI speaking — but it's speaking about YOU, not about itself.

3. **The next step is prominent.** Not buried in a list. Not hidden behind navigation. The single most important thing you can do right now, front and center.

4. **Progress is personal.** "Since last time" — not "Your progress." The framing implies the app was watching over you while you were away. It noticed what you did.

5. **Nearby is contextual.** Not a list of categories. The AI curated these based on YOUR situation. "A bakery that speaks YOUR language." Not just "Bakery, 0.3km."

6. **Community is human.** Not profiles. Not avatars. Stories. "Amira arrived 2 weeks before you." Connection through shared experience.

7. **The input is an invitation, not a command.** "Ask Naero anything..." — the AI is always available, but never forced. You can engage when you need to.

8. **3 tabs, not 5.** Home (your life), World (what's around), People (who's here). The AI handles everything else through dialogue.

### The Conversation: "Walking Beside You"

The Conversation answers: "I need help with something specific."

**Layout:**

```
┌──────────────────────────────────────┐
│                                      │
│  You: I need help with my work       │  ← User's message (not in a bubble)
│  permit application.                 │    Just text, flowing naturally
│                                      │
│  ─────────────────────────────────── │  ← Subtle separator
│                                      │
│  The work permit application is      │  ← AI's response (same flow)
│  straightforward but has a few       │    No chat bubbles. No left/right.
│  steps. Here's what you need:        │    Just a conversation.
│                                      │
│  1. Gather your documents            │
│     (passport, proof of address,     │
│     employment contract)             │
│                                      │
│  2. Visit the immigration office     │
│     on Rákóczi út. I can show you    │
│     the exact location.              │
│                                      │
│  3. Bring €60 for the fee.           │
│                                      │
│  Want me to walk you through         │  ← AI offers to guide
│  step 1 right now?                   │    Not pushy. Invitational.
│                                      │
│  ╭────────────────────────────────╮  │
│  │  ✦  Speak or type...          │  │
│  ╰────────────────────────────────╯  │
└──────────────────────────────────────┘
```

**Key Design Decisions:**

1. **No chat bubbles.** The conversation flows like a letter. Your words and the AI's words exist in the same space. No visual hierarchy between speakers — just flowing text.

2. **The AI is practical.** Not philosophical. Not emotional. Practical. "Here's what you need. Here's where to go. Here's how much it costs." The guide gives direction, not feelings.

3. **The AI offers to walk beside you.** "Want me to walk you through step 1 right now?" — the guide asks permission before acting. It doesn't assume.

4. **The Orb is not visible.** In conversation, the Orb disappears. The hero is acting. The guide steps back. The screen is about the conversation, not the guide's face.

### The World: "What's Around You"

The World answers: "What opportunities are near me?"

**Layout:**

```
┌──────────────────────────────────────┐
│                                      │
│  The World                           │  ← Heading
│                                      │
│  Based on where you are right now:   │  ← Context: the AI knows your location
│                                      │
│  ┌────────────────────────────────┐  │
│  │  FOR YOUR JOURNEY              │  │  ← Curated for the user's specific needs
│  │                               │  │
│  │  Immigration office            │  │  ← Directly relevant to next step
│  │  Rákóczi út 40. 2.1 km.       │  │    Not "Government, 2.1 km"
│  │  Opens 8:00 AM.               │  │    The AI adds useful context
│  │  Bring: passport, address      │  │
│  │  proof, €60.                   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  FOR COMFORT                  │  │  ← Curated for emotional wellbeing
│  │                               │  │
│  │  A bakery that speaks your     │  │  ← Story format
│  │  language. The owner is kind.  │  │    Not a list. A recommendation
│  │  0.3 km.                      │  │    from someone who cares
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  FOR CONNECTION                │  │  ← Curated for community
│  │                               │  │
│  │  Community center. Thursday    │  │
│  │  gatherings. 1.2 km.          │  │
│  │  People like you go there.     │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Key Design Decisions:**

1. **Contextual, not categorical.** The places are grouped by what they mean to YOU, not by what they ARE. "For your journey" (work permit office). "For comfort" (bakery). "For connection" (community center).

2. **The AI adds intelligence.** "Opens 8:00 AM. Bring: passport, address proof, €60." The AI doesn't just show you the place — it prepares you.

3. **Stories, not cards.** Each place is a sentence, not a label with an icon. "A bakery that speaks your language. The owner is kind." Not "Bakery 🍞 0.3km."

### The Community: "People Like You"

The Community answers: "Who can help me?"

**Layout:**

```
┌──────────────────────────────────────┐
│                                      │
│  People                              │  ← Heading
│                                      │
│  There are 7 people nearby who       │  ← The AI's curation
│  understand what you're going        │    "People like you"
│  through.                            │    Not "users in your area"
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ○  Amira                      │  │  ← Story, not profile
│  │     Arrived 2 weeks before you.│  │    Shared experience
│  │     Found housing on Maple St. │  │    Useful information
│  │     Speaks Arabic and English. │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ○  Carlos                     │  │
│  │     Was a chef back home.      │  │
│  │     Looking for work.          │  │    Potential connection
│  │     Speaks Spanish.            │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ○  Yuki                       │  │
│  │     Speaks Japanese and English│  │
│  │     Helps with translation.    │  │    Offer of help
│  │     Arrived 1 month ago.       │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Key Design Decisions:**

1. **Stories, not profiles.** Each person is described through their journey, not their stats. Connection comes from shared experience, not shared demographics.

2. **The green dot (○) is subtle.** Not "online now." Just "this person is real and nearby." A quiet signal of presence.

3. **Useful information is included.** "Found housing on Maple St." — this helps the user. Community isn't just social — it's practical.

---

## Part 4: The Visual Language

### Design Principles (Ranked by Priority)

1. **User-first, always.** Every screen starts with the user's life, not the AI's presence.
2. **Warmth over coldness.** Every element must feel warm. Cold is for tools. Warmth is for companions.
3. **Restraint over decoration.** Remove everything that doesn't serve the user's journey.
4. **Context over categories.** Group by meaning to the user, not by system classification.
5. **Stories over data.** People and places are described as narratives, not database entries.

### Color System: "Warm Darkness"

**The Canvas:**

| Token | Hex | Usage |
|---|---|---|
| Canvas | #0C0A08 | Background. Warm darkness, like a room at dusk. |
| Surface | #1A1612 | Cards, containers. Warm charcoal. |
| Elevated | #241F1A | Active states. Warm lift. |

**The Accent (restrained):**

| Token | Hex | Usage |
|---|---|---|
| Primary | #10B981 | Interactive elements, the AI's signature. Used sparingly. |
| Soft | rgba(16,185,129,0.10) | Subtle highlights. |
| Glow | rgba(16,185,129,0.08) | Ambient light around interactive elements. |

**The Warmth (for user's progress):**

| Token | Hex | Usage |
|---|---|---|
| Primary | #C89B5C | Checkmarks, completed steps, personal milestones. |

**The Text:**

| Token | Hex | Usage |
|---|---|---|
| Primary | #F5EDE4 | Headlines, body text. Warm cream. |
| Secondary | #9C9389 | Supporting text. Pencil marks. |
| Tertiary | #6B6359 | Labels, captions. Whispers. |
| Muted | #4A4440 | Placeholders. Barely there. |

**Color Restraint Rule:**

- Emerald appears ONLY for interactive elements and the AI's quiet presence.
- Amber appears ONLY for the user's completed milestones.
- The interface is 95% warm neutrals.
- The restraint makes these colors meaningful when they appear.

### Typography System

**Type Scale (4 levels, not 7):**

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | 44px | 800 | The user's name. The one big personal moment. |
| Heading | 20px | 600 | Section titles. |
| Body | 15px | 400 | Content. Conversations. Descriptions. |
| Caption | 13px | 500 | Timestamps. Labels. Distances. |

**Why 4 sizes:** Working memory holds 4±1 chunks. Four levels = instant categorization.

### Spatial System: "Ma"

The spacing system uses generous whitespace to create calm. The biggest spacing (48px) is used between major content sections — creating the feeling that each section has room to breathe.

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Tight internal padding |
| sm | 8px | Element separation |
| md | 12px | Standard gaps |
| lg | 16px | Section separation |
| xl | 20px | Screen margins |
| xxl | 24px | Major gaps |
| xxxl | 32px | Between distinct areas |
| huge | 48px | Hero breathing room |

### Material System: "Light in Darkness"

Elements don't have borders. They emerge from darkness through luminance.

- A card is slightly lighter than the canvas.
- An active element is slightly brighter than its resting state.
- No shadows. No borders. Just light.

### Motion System: "Breathing"

All motion follows organic breathing rhythm. The interface feels alive.

**Breathing Cycle:**
- Inhale: 1.8 seconds
- Pause: 0.3 seconds
- Exhale: 2.2 seconds
- Pause: 0.7 seconds
- Total: 5 seconds (12 breaths/min — calm alert state)

**When the user acts, the AI breathes.** When the user is still, the AI is still. The motion follows the user's rhythm, not the other way around.

---

## Part 5: The Orb's New Role

### From Hero to Compass

| Property | Before | After |
|---|---|---|
| Size | 120pt, centered | 40pt, top-right |
| Opacity | Dominant | Quiet presence |
| Role | The AI's face | The guide's compass |
| Screen time | Always visible | Visible when idle, hidden when acting |
| Animation | Breathing, rotating | Subtle pulse only |

### The Orb's Behavior

| State | Orb | Screen |
|---|---|---|
| User opens app | Gentle pulse (40pt, top-right) | User's life fills the screen |
| User scrolls | Fades slightly | Content is the focus |
| User taps Orb | Expands to 80pt, centers | Conversation opens |
| User in conversation | Hidden | Conversation flows |
| User returns Home | Returns to 40pt, top-right | User's life returns |

### The Orb as Threshold

When the user taps the Orb, it expands and the screen transitions to conversation. This is the moment the hero turns to the guide. The Orb's expansion is the visual threshold between "my life" and "talking to my guide."

When the conversation ends, the Orb contracts and the user's life returns. The guide steps back. The hero continues.

---

## Part 6: Design Decision Explanations

### Why the Orb shrinks

**Research basis:** Miyazaki's landscapes — the environment is the hero, not the characters. Tadao Ando's cruciform — the light is the hero, not the cross. Porsche's cockpit — the driver is the hero, not the steering wheel.

The Orb was 120pt centered because I made the AI the hero. But the AI is not the hero. The immigrant is the hero. The Orb becomes 40pt in the corner — always present, never dominant. Like a compass in your pocket.

### Why the home screen is about the user's life

**Research basis:** Spotify Wrapped — the user's data is the hero. Duolingo's streaks — the user's progress is the hero. Apple Intelligence — the user's content is the hero.

Every screen answers the six questions: Who am I? What happened? What's next? What's around me? Who can help? How am I improving? The AI provides the answers, but the user's life is the content.

### Why contextual grouping instead of categories

**Research basis:** Pinterest's "Taste Graph" — content grouped by meaning, not category. Spotify's "Made for You" — recommendations grouped by moment, not genre. Flighty's context-aware states — information grouped by phase of travel.

"For your journey" (immigration office) is more useful than "Government" (category). "For comfort" (bakery) is more meaningful than "Food" (category). The grouping is about the user's life, not the system's taxonomy.

### Why stories instead of profiles

**Research basis:** Duolingo's anthropomorphism — stories create emotional stakes. Attachment theory — naming creates bonds. The research that shared experience creates stronger connections than shared demographics.

"Amira arrived 2 weeks before you" creates connection through shared experience. "Amira, 28, Engineer" creates judgment through demographics. Stories invite empathy. Profiles invite comparison.

### Why 3 tabs instead of 5

**Research basis:** Rabbit R1's radical simplicity. Apple's "deference" principle. Cognitive load theory (4±1 chunks).

Home (your life), World (what's around), People (who's here). That's it. The AI handles everything else through dialogue. No Profile tab. No Settings tab. No Community tab. These are accessed through the AI when needed.

### Why the AI speaks practically, not emotionally

**Research basis:** The best guides (Gandalf, Yoda, Obi-Wan) give direction, not feelings. They say "go here, do this" not "I understand your pain." Emotional support comes from the user's own journey, not from the guide's words.

The AI says: "The work permit application is straightforward. Here's what you need." Not: "I understand this must be overwhelming for you." The user knows it's overwhelming. They don't need the AI to tell them. They need the AI to help them through it.

### Why the input is an invitation, not a command

**Research basis:** Google's search page — one input, infinite possibility. The research that "the best interface is the one you forget."

"Ask Naero anything..." is invitational. It doesn't demand action. It offers presence. The user can engage when they need to, ignore when they don't. The AI is always there, never forced.

---

## Part 7: Implementation Priority

### Phase 1: The Home Screen
- Warm dark canvas
- The Orb (40pt, top-right, subtle pulse)
- The user's story (personalized greeting)
- The next step (prominent, actionable)
- Progress checkmarks (warm amber)
- Nearby places (contextual, story format)
- Community introductions (stories, not profiles)
- The breathing input
- 3-tab navigation

### Phase 2: The Conversation
- Flowing text (no chat bubbles)
- AI speaks practically
- Orb expands on entry, contracts on exit
- Contextual awareness (the AI knows what the user was just doing)

### Phase 3: The World
- Contextual grouping ("For your journey," "For comfort," "For connection")
- AI-curated places with useful details
- Story format, not list format

### Phase 4: The Community
- Story-based people cards
- AI-curated introductions
- Shared experience, not demographics

---

*This document is the single source of truth for Naero's product vision v2. The user is the hero. The AI is the guide. The Orb is the compass.*
