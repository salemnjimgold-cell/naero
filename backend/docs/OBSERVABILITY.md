# Backend Observability

Sprint 3 adds basic structured logging and optional monitoring hooks.

## Structured Logs

Backend logs are JSON lines with:

- `level`
- `message`
- `timestamp`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

Sensitive keys are redacted by `backend/src/observability/logger.js`.

## Request IDs

The backend accepts `x-request-id` and generates one if missing. The response includes `x-request-id`.

## Monitoring Hook

Set `MONITORING_WEBHOOK_URL` to send basic lifecycle/error events to a webhook receiver.

Do not use a webhook that stores raw request bodies. Sprint 3 monitoring events are redacted and intentionally minimal.

## Minimum Alpha Alerts

Before internal alpha, create alerts for:

- `/health` unavailable.
- Repeated 5xx responses.
- Backend restarts.
- Supabase auth/profile connection failures.

## Not Included Yet

- Distributed tracing.
- Metrics dashboard.
- Sentry or OpenTelemetry SDK.
- AI usage telemetry.

Those should be added only after the deployment provider and observability stack are chosen.
