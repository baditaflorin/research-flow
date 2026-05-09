.PHONY: help install-hooks dev build data test test-realdata test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge hooks-post-checkout

help:
	@printf "%s\n" \
		"make install-hooks     wire .githooks into this repository" \
		"make dev               run the Vite dev server" \
		"make build             build the Pages-ready app into docs/" \
		"make data              Mode A no-op; no static data pipeline" \
		"make test              run unit tests with coverage" \
		"make test-realdata     run Phase 2/3 real-data fixture regression" \
		"make test-integration  run Playwright e2e tests against an existing server" \
		"make smoke             build, serve docs/, and run Playwright happy path" \
		"make lint              run eslint, prettier check, and TypeScript" \
		"make fmt               autoformat source files" \
		"make pages-preview     serve docs/ exactly as Pages would" \
		"make release           tag the current commit with VERSION=vX.Y.Z" \
		"make clean             remove local build/test output"

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build
	node scripts/check-pages-output.mjs

data:
	@printf "%s\n" "Mode A has no data-generation pipeline. User papers are processed locally in the browser."

test:
	npm test

test-realdata:
	npm run test:realdata

test-integration:
	npx playwright test

smoke:
	npm run smoke

lint:
	npm run lint

fmt:
	npm run fmt

pages-preview:
	npm run preview:pages

release:
	@test -n "$(VERSION)" || (echo "Usage: make release VERSION=v0.1.0" && exit 1)
	git tag "$(VERSION)"
	git push origin "$(VERSION)"

clean:
	rm -rf coverage playwright-report test-results dist dist-data docs/assets docs/404.html docs/index.html docs/sw.js docs/manifest.webmanifest docs/research-flow-icon.svg
