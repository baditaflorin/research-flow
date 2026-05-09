# 0066 Error Handling Convention

## Status

Accepted

## Context

Generic messages like "Analysis failed" do not help users recover.

## Decision

UI-facing errors must include what happened, why it likely happened, and the next action. Low-level thrown errors stay technical, but app catch sites translate them before showing toasts.

## Consequences

The same helper handles import, URL, clipboard, extraction, analysis, export, and storage errors.

## Alternatives Considered

Surfacing raw exception messages was rejected because browser/API errors often expose implementation detail but not recovery guidance.
