# Naero Backlog

Last updated: 2026-06-28

Purpose: living CTO backlog for architecture, security, performance, scalability, UX, AI intelligence, and production-readiness improvements.

Every proposal should include:

- Why this matters
- Benefits
- Risks
- Estimated effort: S, M, L, XL
- Recommendation: do now or postpone
- Impact on product vision

## Critical

### Remove client-side secrets and signing exposure

Why this matters: Hardcoded AI keys and committed Android signing credentials can compromise production releases, cost control, and user trust.

Status: Code remediation complete in Sprint 1. External key/signing rotation remains required.

Benefits: Prevents key theft, protects release integrity, and establishes secure deployment practices.

Risks: Requires credential rotation and may temporarily disrupt AI/release workflows.

Estimated effort: M

Recommendation: Complete external rotation now.

Impact on product vision: Required foundation for a trustworthy global platform.

### Fix known Services tab crash risk

Why this matters: `ServicesScreen.js` uses `useApp()` without importing it, which can crash a core app tab.

Status: Complete in Sprint 1.

Benefits: Improves stability and restores confidence in the core services flow.

Risks: Minimal.

Estimated effort: S

Recommendation: Done.

Impact on product vision: Services are central to "Not a stranger anymore"; this must be stable.

### Remove sensitive AI and location logging

Why this matters: Logs currently risk exposing migration context, messages, profile data, and location context.

Status: Complete in Sprint 1 for AI modules.

Benefits: Reduces privacy risk and prepares the app for production diagnostics.

Risks: Less debug visibility unless replaced with safe structured logging.

Estimated effort: S

Recommendation: Done; add safe diagnostics utility in Sprint 2.

Impact on product vision: Protects vulnerable users and supports privacy-first AI.

## High Priority

### Move AI calls behind a backend proxy

Why this matters: The client currently owns AI requests and secret handling.

Benefits: Enables key protection, rate limiting, abuse prevention, redaction, model routing, and analytics without exposing sensitive internals.

Risks: Requires backend setup and temporary fallback behavior.

Estimated effort: L

Recommendation: Sprint 4. Do not start until Sprint 3 backend deployment, Supabase configuration, HTTPS, health checks, secrets, and monitoring are verified.

Impact on product vision: Creates the foundation for world-class AI intelligence at scale.

### Define real auth and profile architecture

Why this matters: Current auth/Firebase modules are stubs, while the product will eventually need safe identity, profile, saved items, and community features.

Status: Architecture and initial foundation complete in Sprint 2. Live Supabase deployment and mobile email/OAuth wiring remain.

Benefits: Prevents rework, clarifies guest vs account flows, and supports secure user data ownership.

Risks: Wrong auth choice can slow onboarding or harm trust.

Estimated effort: M

Recommendation: Do soon, before community write features.

Impact on product vision: Required for personalized help, community safety, and long-term retention.

### Deploy backend foundation and Supabase project

Why this matters: Sprint 2 added the platform boundary, but it is not useful for real alpha users until deployed and connected to a real Supabase project.

Status: Repository-side Sprint 3 implementation complete. Real staging deployment still requires hosting provider, Supabase, DNS, and secret-manager access.

Benefits: Enables real auth/profile persistence, environment isolation, smoke testing, HTTPS, monitoring, and a secure place to add the AI gateway later.

Risks: Misconfigured secrets, RLS mistakes, and environment drift can create security or reliability issues.

Estimated effort: M

Recommendation: Complete external staging deployment now, before AI gateway implementation.

Impact on product vision: Turns Naero from a local prototype into a platform with a trustworthy production boundary.

### Clean Android permissions and backup policy

Why this matters: The manifest asks for permissions that are broader than current functionality.

Status: Complete in Sprint 1.

Benefits: Reduces store review risk, user distrust, and sensitive data exposure.

Risks: Removing a permission could break an undiscovered feature if one depends on it.

Estimated effort: S

Recommendation: Done.

Impact on product vision: Helps Naero feel safe and lightweight.

## Medium Priority

### Split AppContext when feature pressure increases

Why this matters: `AppContext` currently owns too many responsibilities.

Benefits: Improves maintainability, testing, and feature isolation.

Risks: Premature splitting could add complexity if done before boundaries are clear.

Estimated effort: M

Recommendation: Postpone until after P0 stabilization.

Impact on product vision: Supports scaling the codebase without a rewrite.

### Add CI validation pipeline

Why this matters: Manual validation does not scale as development accelerates.

Benefits: Catches lint/build/test regressions before release.

Risks: Initial setup may expose many existing warnings that need triage.

Estimated effort: M

Recommendation: Do soon after critical fixes.

Impact on product vision: Supports reliable delivery at professional scale.

### Fix sync engine semantics

Why this matters: Current "background sync" is not true background sync and likely fails timestamp persistence.

Benefits: More accurate behavior, fewer silent failures, better battery expectations.

Risks: Could reveal assumptions in screens that depend on sync flags.

Estimated effort: S

Recommendation: Do after crash/security fixes.

Impact on product vision: Prevents misleading realtime claims and improves reliability.

## Low Priority

### Normalize encoding and localization QA

Why this matters: Some strings/test output show encoding issues.

Benefits: Improves trust for multilingual users.

Risks: Requires careful review by native/fluent speakers later.

Estimated effort: M

Recommendation: Postpone until stability/security pass is complete.

Impact on product vision: Important for inclusive global expansion.

### Clean unused imports and hook warnings

Why this matters: Lint warnings hide real defects over time.

Benefits: Cleaner code and easier reviews.

Risks: Mechanical cleanup can accidentally touch many files.

Estimated effort: M

Recommendation: Batch after P0 fixes.

Impact on product vision: Improves maintainability.

## Nice to Have

### Country and city content pack architecture

Why this matters: Current knowledge is Hungary/Budapest-heavy.

Benefits: Enables scalable global expansion.

Risks: Requires editorial/data governance.

Estimated effort: XL

Recommendation: Postpone until production foundation is ready.

Impact on product vision: Essential for becoming a global integration platform.

### Privacy-preserving nearby users concept

Why this matters: Nearby people/community features can be powerful but risky for vulnerable users.

Benefits: Could create strong belonging and practical local help.

Risks: Stalking, harassment, unwanted exposure, moderation burden, location privacy risk.

Estimated effort: XL

Recommendation: Postpone until after a formal threat model.

Impact on product vision: High upside only if implemented with exceptional safety.

## Next Highest-Value Task

Complete the external staging deployment: create/configure Supabase staging, deploy the backend with provider-managed HTTPS, set secrets, apply migrations, connect monitoring, and run deployed smoke tests. AI Gateway work remains postponed to Sprint 4.
