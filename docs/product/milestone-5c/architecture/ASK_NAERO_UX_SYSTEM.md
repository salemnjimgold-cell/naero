# Ask Naero UX System

## Entry forms

| Form | Use |
|---|---|
| Persistent action | Start a new broad question from any primary tab |
| Contextual button | “Ask about this” on a place, source, Plan item or guide |
| Compact sheet | One scoped question, quick explanation, translate or requirements check |
| Full conversation | Multi-turn ambiguity, comparison or plan-building |
| Inline explanation | Explain selected content without leaving the task |
| Structured actions | Explain, Compare, Translate, Turn into steps, What do I need? |

AI is never the only route to emergency information, permissions, sources, settings or external actions.

## Visible context control

Before sending, an `AIContext` row summarizes inputs: Austria; Vienna; Arabic; current item; Settlement Basics; location mode. Tapping it opens a sheet where each optional context input can be excluded. Precise coordinates are off by default for general questions and included only for explicit nearby intent.

Allowed inherited context: selected country/city, language, current content, user-selected Plan and permission/location mode. Nationality, legal status, employment, family or health context is included only after the user provides it for the current need and sees it in context controls.

## Answer anatomy

1. Direct answer in plain language.
2. Applicable jurisdiction and assumptions.
3. Structured steps/options when useful.
4. Trust-labelled source summaries.
5. Uncertainty block where needed.
6. Supported actions: open official source, view place, save, add user-selected step, compare.

## Safety rules

AI does not infer eligibility, create legal deadlines, claim official authority, combine community advice with official facts, or state unreliable opening hours. It says when it cannot verify an answer and offers a safer source/action. Sensitive actions always transition to confirmable normal UI.

## States/accessibility

Streaming announces meaningful segments without repeatedly stealing focus. Cancel is available. Offline offers local reviewed/cached content where supported and never fabricates a model response. Errors preserve the prompt and context. Full conversation supports 200% text, keyboard navigation, screen-reader speaker labels and RTL/mixed-script content.
