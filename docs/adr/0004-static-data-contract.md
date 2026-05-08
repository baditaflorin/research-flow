# 0004 - Static data contract

## Status

Accepted

## Context

Mode A does not ship private research data or use a runtime API. Static data is limited to app metadata, examples, and build information.

## Decision

Use these static contracts:

- Build metadata is compiled into the app from environment variables and git state: `version`, `commit`, `repositoryUrl`, and `paypalUrl`.
- Optional example documents may live under `public/examples/` in future releases.
- User projects are not committed, fetched, or uploaded; they are represented by IndexedDB records using schema version `1`.

## Consequences

- There are no freshness guarantees for external datasets because v1 has none.
- A future public demo corpus can be added under `/data/v1/` with sibling `*.meta.json` files without changing the local project schema.

## Alternatives Considered

- Commit generated research maps: rejected because user papers are private and runtime-provided.
- Release-hosted data artifacts: not needed until a public corpus or benchmark dataset exists.
