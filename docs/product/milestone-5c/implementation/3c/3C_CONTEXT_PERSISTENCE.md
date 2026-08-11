# 3C Context Persistence

The versioned device key is `@naero_contextual_onboarding_v1`. It stores only completion, language, country code/name, region, municipality, context origin, location mode, and selected intent identifiers.

Parsing is allow-listed and fail-closed. Invalid JSON and unknown versions return no context. A place is known only when a valid two-letter country code, country, municipality, and non-unknown origin are all present. Partial input is normalized to unknown rather than supplemented.
