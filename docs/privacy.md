# Privacy

Research Flow v1 is local-first.

## What Is Collected

Nothing is collected by the app. There is no analytics script, no backend API, no account system, and no telemetry endpoint.

## Where Papers Go

Uploaded papers are processed in the browser. Extracted text and generated analysis are saved only in the browser's IndexedDB storage for the current origin:

https://baditaflorin.github.io/research-flow/

## External Requests

The app loads its static assets from GitHub Pages. If the user enables lazy Transformers.js embeddings, the browser may request model/runtime assets needed by that library. The default local TF-IDF analysis does not require model downloads.

## Deleting Local Data

Use the in-app `Clear Local Project` button, or clear site data for:

https://baditaflorin.github.io/research-flow/

## Analytics

No analytics are enabled in v1.
