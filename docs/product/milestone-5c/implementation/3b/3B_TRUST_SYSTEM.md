# 3B Trust System

Trust communicates origin/authority only; freshness is a separate component.

| Class | Icon/structure | Hierarchy |
|---|---|---|
| Official | institutional building, 2 px strong solid border | Highest institutional authority; neutral rather than Naero-branded |
| Naero Verified | shield-check, 1 px guidance border | Reviewed within a declared scope; never visually equal to Official |
| External Provider | external-link icon, information treatment | Clearly third-party and attributable |
| Community | people icon, warm user-investment treatment | Human-originated, reportable information |
| AI Guidance | sparkles icon, dashed neutral boundary | Interpretation; cannot inherit authority from cited sources |

`TrustBadge` supports compact/normal variants, mode-aware semantic colors, icon+localized text, dynamic wrapping, RTL ordering and a screen-reader label. Invalid classes render nothing rather than an invented label.

Visual meaning never depends on color. Icon, label, border weight/style and provenance detail establish the hierarchy.
