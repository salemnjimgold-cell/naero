# 3A Jurisdiction, Trust and Freshness Models

## Jurisdiction

Canonical levels are `country`, `region`, `municipality`, `service_area`. A country uses an uppercase two-letter code; optional nodes require stable ID and display name.

Austria/Vienna:

```js
createJurisdiction({
  countryCode: 'AT',
  region: { id: 'AT-9', name: 'Vienna' },
  municipality: { id: 'vie', name: 'Vienna' },
});
```

The same function represents France/Île-de-France/Paris in tests, proving no Austria-specific schema dependency.

## Trust

Canonical values: `official`, `naero_verified`, `external_provider`, `community`, `ai_guidance`. Invalid values normalize to null and cannot acquire an ad-hoc trust label.

## Freshness

Canonical values: `current`, `review_due`, `outdated`, `date_unknown`. Missing or invalid dates produce `date_unknown`; trust and freshness are separate. The small derivation helper uses explicit review dates and a 30-day review-due window. Full UI belongs to 3B.
