# 0009 - Configuration and secrets management

## Status

Accepted

## Context

The app must not commit secrets and the frontend must never contain secrets.

## Decision

Use build-time public configuration only:

- `VITE_APP_VERSION`
- `VITE_APP_COMMIT`
- `VITE_APP_REPOSITORY_URL`
- `VITE_APP_PAYPAL_URL`

Commit `.env.example` with placeholders. Git hooks run `gitleaks` when installed.

## Consequences

- All frontend configuration must be safe to publish.
- User-supplied API keys, if ever added, must be stored locally and never committed.

## Alternatives Considered

- Runtime secrets in Pages: impossible and rejected.
- Encrypted frontend secrets: rejected because they are still public.
