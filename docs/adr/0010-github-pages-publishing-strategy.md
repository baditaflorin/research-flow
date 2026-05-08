# 0010 - GitHub Pages publishing strategy

## Status

Accepted

## Context

The live Pages URL is a first-class deliverable from commit one. The repository also needs `docs/adr/` for project documentation.

## Decision

Publish GitHub Pages from `main` branch `/docs`.

Vite writes the application build to `docs/` with `emptyOutDir: false`, preserving ADRs and documentation files. The app base path is `/research-flow/`. A generated `docs/404.html` mirrors `docs/index.html` for SPA fallback behavior. `docs/` is intentionally not ignored by git.

## Consequences

- Built frontend artifacts are committed to the repository.
- Documentation markdown files are visible in the published directory as static files.
- Old hashed assets must be cleaned manually if they become noisy.

## Alternatives Considered

- `gh-pages` branch: rejected because it separates source and published artifacts.
- Root publishing: rejected because it would mix source files directly into the public site root.
