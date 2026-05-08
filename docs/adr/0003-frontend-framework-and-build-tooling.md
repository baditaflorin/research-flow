# 0003 - Frontend framework and build tooling

## Status

Accepted

## Context

The UI is an interactive research workspace with drag/drop ingestion, long-running local jobs, editable drafts, charts, and export actions. It must build to GitHub Pages.

## Decision

Use React 19, TypeScript strict mode, Vite, Tailwind CSS, Vitest, and Playwright. Use `lucide-react` for icons, `@tanstack/react-query` for cache orchestration, `zod` for runtime validation, and `comlink` for worker calls if worker APIs grow beyond message passing.

Vite builds to `docs/` with base path `/research-flow/`.

## Consequences

- The public app is a static artifact committed to the repository.
- TypeScript and Vitest cover core logic without needing a backend test stack.
- Heavy libraries must be lazy-loaded to protect the initial bundle.

## Alternatives Considered

- SvelteKit: attractive for small bundles, but React has broader ecosystem support for the expected export and worker libraries.
- Next.js static export: unnecessary routing/runtime complexity for a pure Pages app.
