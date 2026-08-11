# 3D Provider and Trust Mapping

- Approved Naero provider records with `verified=true`: `naero_verified`.
- OpenStreetMap, Google Places, unknown providers, and unverified Naero records: `external_provider`.
- Ordinary OSM/Google records are never promoted to Official or Naero Verified.

Provider attribution is retained. Retrieval and verification dates appear only when supplied; otherwise freshness is `date_unknown`. SourceSheet exposes available publisher, jurisdiction, dates, verification scope, uncertainty, and validated original link.

Existing neutral gateway ranking remains: distance, completeness, verified status, confidence, reliable open state, then provider priority. The UI labels these simply as Results.
