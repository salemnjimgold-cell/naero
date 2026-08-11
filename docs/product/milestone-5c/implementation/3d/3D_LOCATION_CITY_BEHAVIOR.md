# 3D Location and City Behavior

Device mode uses real snapshot coordinates, labels the context Current location, and may display calculated distance. Manual mode prioritizes the selected onboarding context, labels it Selected city, uses a governed city anchor only to bound the provider query, and never displays anchor-relative distance.

Anchors cover Vienna, St. Pölten, Graz, Győr, Budapest, Paris, and Berlin. Unknown or unsupported context produces a location state and context-change action. Changing context reuses the approved 3C location flow; it does not request GPS automatically.
