# Security Policy

## Supported Versions

The current `main` branch and latest tagged release receive security fixes.

## Reporting a Vulnerability

Please report vulnerabilities privately by emailing florin@badita.ro.

Do not open public issues containing exploit details, private papers, API keys, tokens, or other secrets.

## Security Baseline

- No user papers are uploaded by the app in v1.
- The frontend must never contain committed secrets.
- Local files, embeddings, generated reports, and drafts are stored in browser storage only.
- Dependency and secret checks are run locally through git hooks.
