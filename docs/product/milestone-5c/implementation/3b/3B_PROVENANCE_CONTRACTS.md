# 3B Provenance Contracts

`createSource` and `createProvenance` validate UI/domain data without changing backend schemas. Supported fields include ID/title, trust class, publisher, authority, generic jurisdiction, safe source URL, source language, published/effective/updated/verified/retrieved dates, freshness, verification scope/role, AI involvement, assumptions, uncertainty and supporting sources.

Missing optional values remain null and are omitted by UI. Missing/invalid dates never become Today. Invalid trust classes invalidate the contract. URLs accept only HTTP(S); JavaScript, file, mail and malformed schemes are rejected.

`createAIProvenance` always fixes the response class to `ai_guidance`, even when supporting sources are Official or Naero Verified. Supporting-source authority remains visible but does not transfer to the generated interpretation.

Dates normalize to ISO only when valid and format through `Intl.DateTimeFormat(locale)` for English, Arabic, French, Hungarian and German/Austrian content compatibility.
