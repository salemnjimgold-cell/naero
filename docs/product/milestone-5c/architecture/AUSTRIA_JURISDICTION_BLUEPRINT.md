# Austria Jurisdiction Blueprint

## Architecture

Austria is the first content pack implementing the generic hierarchy:

`Country → First-level subdivision → Municipality/City → Authority/service area`

For Austria: country `AT`; subdivision is a Land; municipality/city is separately identified. Vienna may act as both Land and municipality, but the data model retains both levels instead of special-casing UI logic.

## Content domains to source

- National: federal service entry points, emergency foundations, healthcare/employment/transport orientation and residence authority pathways.
- Land: regional healthcare, education, social and administrative services.
- Municipality: registration/service offices, local transport, waste/utility orientation, community resources and city-specific support.
- External providers: pharmacies, clinics, groceries, connectivity and practical places, clearly separate from official guidance.

This document identifies sourcing domains; it intentionally contains no unverified legal instructions.

## Required metadata

```text
contentId, contentVersion, title, summary
countryCode, jurisdictionLevel, jurisdictionId
subdivisionId?, municipalityId?, serviceArea?
authorityName, publisherName, sourceUrl
trustClass, sourceLanguage, availableLanguages
publishedAt?, effectiveFrom?, updatedAt?, retrievedAt
naeroVerifiedAt?, verifierRole?, expiresAt?
applicabilityTags, topic, contentType
supersedesId?, status, uncertaintyNote?
```

IDs use standards where available and stable internal IDs otherwise. Display names are localized separately. Source language and translation status are always preserved.

## Governance lifecycle

Draft → source review → trust classification → jurisdiction review → translation → publish → scheduled freshness review → warn/expire/supersede. Consequential content cannot remain “current” after its review threshold without an explicit stale state.

## Austria first use and progressive profiling

Selecting Austria asks only for a city/municipality when it benefits the chosen intent. A pharmacy search needs city/location, not nationality or residence status. A residence-procedure question may ask only the qualifying facts necessary to choose the correct official pathway, one at a time, explaining why each matters and allowing “I’m not sure.”

Potential profile facts remain scoped to the flow until the user explicitly chooses to remember them. Nationality, EU/EEA relationship, family, work/study and current status are never inferred from language, name or location.

## Expansion

Hungary and future countries implement the same jurisdiction/content contracts with country-specific authority adapters and review rules. Components consume generic metadata and localized labels, not Austria-specific field names.
