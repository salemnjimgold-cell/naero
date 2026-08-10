# Trust and Provenance System

## Five classes

| Class | Label/icon | Treatment | AI rule |
|---|---|---|---|
| Official | Building/document seal icon + “Official” | Neutral high-authority outline; publisher prominent | May explain but must preserve source, jurisdiction and date; never claim to be the authority |
| Naero Verified | Shield-check + “Naero Verified” | Guidance-green outline with verification date | May use as verified evidence within declared scope; disclose verification limits |
| External Provider | External-link/database icon + provider name | Information-blue neutral surface | Treat as third-party data; preserve attribution/retrieval time |
| Community | People/speech icon + “Community” | Warm neutral surface with author/time/report action | Attribute; never elevate to fact through summarization |
| AI Guidance | Spark/compass icon + “AI Guidance” | Distinct dotted/soft guidance boundary | Must show sources, assumptions and uncertainty; no authority inheritance |

Icons and full text labels are mandatory at first occurrence; color is supplementary. Flags may provide context but never represent trust or act as the only jurisdiction label.

## Freshness states

`Current`, `Review due`, `Outdated`, `Date unknown`. Current requires class-specific evidence. Review due shows caution without erasing access. Outdated cannot drive a Next Useful Step. Unknown-date consequential content is downgraded and cannot be described as current.

## Source Summary

Compact row: trust label, publisher/provider, jurisdiction, reviewed/retrieved date. Tap opens Source Sheet.

## Source Sheet

Shows title; trust definition; publisher and authority; country/Land/municipality; original source link; published/updated/retrieved dates; Naero verification date/method/role where relevant; original and displayed languages; translation status; AI involvement; assumptions/uncertainty; superseded/outdated state; report issue.

## Composition rules

- Multi-source guidance lists each source and labels synthesis as AI Guidance or Naero editorial guidance as applicable.
- Official styling belongs to the source, not Naero’s explanation.
- Verification is scoped: identity, address, service availability and content accuracy may have different states.
- Trust labels are serialized data, not inferred in the client from URLs or names.
- Cards never combine contradictory freshness states into one badge.
