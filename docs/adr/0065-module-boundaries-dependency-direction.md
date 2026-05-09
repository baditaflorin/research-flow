# 0065 Module Boundaries And Dependency Direction

## Status

Accepted

## Context

Mode A keeps all code in the browser, but domain, storage, export, and UI responsibilities still need boundaries.

## Decision

Dependency direction is:

`App/UI -> storage/export/library/analysis/search -> shared primitives`.

Feature modules may import shared helpers and sibling domain types, but must not import React UI.

## Consequences

State/import/export can be tested without a browser render. UI remains the orchestration shell.

## Alternatives Considered

Introducing a full application-service layer was rejected as over-abstracted for the current app size.
