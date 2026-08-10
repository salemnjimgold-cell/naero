# Prototype Flows

These are concept prototypes outside production source. Each includes normal, error and back paths.

## Flow A — New user in Austria

Install → Welcome → Language (`العربية`) → Guest → Location choice → Choose city → Austria → Vienna → Intent “Find” → Discover Essentials → select service. Validate no immigration profiling, Arabic RTL, German names, guest utility and trust labels.

## Flow B — Location enabled

Home Context (`Device location`) → Useful Around You → Pharmacies → Detail → inspect source/hours state → Directions or Save. Validate permission rationale, distance, provider attribution, missing-hours behavior and local guest save.

## Flow C — Settlement

Home fallback “Start Settlement Basics” → explain limits → select Healthcare access → item detail → Explain → Source Sheet → supported action → Mark complete. Validate explicit plan start, real progress, reversibility and jurisdiction/freshness.

## Flow D — AI

Place/service/guidance → Ask about this → visible AI context → contextual explanation → uncertainty/source → structured action. Validate excluded context, no authority inheritance and transition back to normal UI.

## Flow E — Privacy

Location rationale → Why location? → Manual city instead → Austria/Vienna → Home/Discover retains useful experience → My Naero location controls. Validate no repeated prompt and easy clearing/switching.

## Flow F — Full RTL

Arabic Welcome (`افهم مدينتك الجديدة`) → Language (`العربية`) → Guest (`الاستمرار كضيف`) → manual Austria/Vienna → Arabic Home (`فيينا، النمسا`) → Discover pharmacy (`صيدلية`) → mixed Arabic/German detail/address → Arabic Source Sheet (`المصدر والتحديث`) → Save (`حفظ`) → My Naero (`Naero الخاص بي`). Validate reading/focus order, mirrored navigation, unmirrored trust/location icons, wrapping, numerals and 200% text. Copy is prototype-only and requires native-language review before production.

Prototype review measures task completion, source comprehension, context awareness, perceived dignity, and whether users can explain what AI/location data was used.
