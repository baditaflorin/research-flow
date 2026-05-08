# Architecture

## Context

Research Flow is Mode A: a pure GitHub Pages application. The public surface is static; user papers and generated research maps stay inside the user's browser.

Live site: https://baditaflorin.github.io/research-flow/

Repository: https://github.com/baditaflorin/research-flow

```mermaid
C4Context
  title Research Flow system context
  Person(user, "Researcher", "Uploads papers and exports drafts")
  System_Boundary(pages, "GitHub Pages static boundary") {
    System(app, "Research Flow", "Static React app")
  }
  SystemDb(browser, "Browser storage", "IndexedDB and service worker cache")
  System_Ext(github, "GitHub", "Source repository and Pages hosting")
  Rel(user, app, "Uses locally")
  Rel(app, browser, "Stores local project")
  Rel(github, app, "Hosts static files")
```

## Container View

```mermaid
C4Container
  title Research Flow containers
  Person(user, "Researcher")
  System_Boundary(browser, "User browser") {
    Container(ui, "React UI", "TypeScript, Vite", "Workspace, map, insights, exports")
    Container(worker, "Analysis Worker", "Web Worker", "Vectorization, clustering, contradictions, gaps")
    Container(pdf, "PDF extraction", "pdfjs-dist", "Lazy PDF text extraction")
    Container(search, "Search index", "MiniSearch", "Local full-text search")
    ContainerDb(idb, "IndexedDB", "idb", "Latest local project")
    Container(sw, "Service worker", "Browser API", "Offline app shell cache")
  }
  System_Ext(pages, "GitHub Pages", "Static host")
  Rel(user, ui, "Drops papers and exports")
  Rel(ui, worker, "Posts paper text")
  Rel(ui, pdf, "Lazy-loads for PDFs")
  Rel(ui, search, "Builds local index")
  Rel(ui, idb, "Saves latest project")
  Rel(ui, sw, "Registers in production")
  Rel(pages, ui, "Serves static assets")
```

## Module Boundaries

- `src/features/library`: file ingestion, PDF/text extraction, metadata inference.
- `src/features/analysis`: vectors, clustering, contradiction detection, gap analysis, outline generation.
- `src/features/search`: MiniSearch index construction and querying.
- `src/features/export`: citations, Markdown, Word, and LaTeX exports.
- `src/features/storage`: IndexedDB persistence.
- `src/workers`: worker entrypoints for CPU-heavy analysis.
- `src/shared`: build metadata, formatting, error boundaries, service worker registration.

## Pages Boundary

GitHub Pages serves only committed static files under `docs/`. There is no runtime API, auth layer, server database, Docker image, nginx proxy, or metrics endpoint.

## Runtime Data Flow

```mermaid
flowchart LR
  A["Drop papers"] --> B["Extract text locally"]
  B --> C["Persist compact project in IndexedDB"]
  B --> D["Analyze in Web Worker"]
  D --> E["Clusters"]
  D --> F["Contradictions"]
  D --> G["Gaps"]
  D --> H["Outline"]
  H --> I["Export Markdown / Word / LaTeX"]
```
