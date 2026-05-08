# 0015 - Deployment topology

## Status

Accepted

## Context

Mode C topology requirements apply only when a runtime API exists.

## Decision

Use GitHub Pages only:

- Source: `main` branch `/docs`
- URL: `https://baditaflorin.github.io/research-flow/`
- No Docker Compose, nginx, TLS certbot, Prometheus, or backend server.

## Consequences

- Rollback is a git revert of the publishing commit.
- GitHub provides TLS and static hosting.

## Alternatives Considered

- Docker backend on port `25342`: rejected by ADR 0001.
