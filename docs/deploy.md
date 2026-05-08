# Deployment

## Current Topology

Mode A: GitHub Pages only.

Live URL: https://baditaflorin.github.io/research-flow/

Repository: https://github.com/baditaflorin/research-flow

Pages source: `main` branch, `/docs` folder.

## Publish

```sh
npm install
make lint
make test
make build
git add docs package.json package-lock.json src public scripts tests README.md
git commit -m "feat: update research flow"
git push
```

GitHub Pages picks up the committed `docs/` artifact after the push.

## Preview Exactly As Pages

```sh
make build
make pages-preview
```

Open http://127.0.0.1:4173/research-flow/

## Rollback

Rollback is a normal git revert of the publishing commit:

```sh
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured in v1. To add one:

1. Add `docs/CNAME` containing the domain.
2. Configure DNS with a CNAME to `baditaflorin.github.io`.
3. Confirm HTTPS enforcement in GitHub Pages settings.

## Pages Gotchas

- The Vite base path is `/research-flow/`.
- `docs/404.html` mirrors `docs/index.html` for SPA fallback behavior.
- GitHub Pages does not support `_headers` or `_redirects`.
- Service worker scope is `/research-flow/`.
- Built files in `docs/` are committed intentionally.
