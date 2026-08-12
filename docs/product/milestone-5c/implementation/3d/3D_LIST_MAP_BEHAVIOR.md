# 3D List and Map Behavior

The migrated experience is list-first because the repository has no embedded map implementation or map dependency. Results remain accessible without a map. When a result has real coordinates, Directions opens a validated external map URL; without coordinates the action disappears.

This preserves a single result contract and avoids building a disconnected or decorative map. A future embedded map can consume the same normalized coordinates, category, context, and selection state without changing provider architecture.
