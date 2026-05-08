# Contributing

Thanks for helping improve Research Flow.

## Local Setup

```sh
npm install
make install-hooks
make dev
```

## Development Rules

- Use Conventional Commits, for example `feat: add outline export`.
- Run `make fmt`, `make lint`, `make test`, and `make smoke` before pushing.
- Do not commit secrets, real `.env` files, API keys, private keys, or private documents.
- Keep browser-only features local-first unless an ADR justifies a different mode.

## Pull Requests

Open a pull request with:

- A concise problem statement.
- Screenshots or a short screen recording for UI changes.
- Notes about tests run locally.
