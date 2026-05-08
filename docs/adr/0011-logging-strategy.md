# 0011 - Logging strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console output should help development without leaking private document content.

## Decision

In production, avoid routine console logging. User-facing errors go through visible UI states and toasts. Development-only diagnostics must not print paper contents, extracted text, or generated drafts.

## Consequences

- Debugging relies on explicit UI state and local reproduction.
- Sensitive paper text is not casually exposed through console history.

## Alternatives Considered

- Verbose client logging: rejected due to privacy risk.
