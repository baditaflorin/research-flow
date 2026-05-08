import React from "react";

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Research Flow stopped rendering
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Something broke in the local workspace.</h1>
          <p className="mt-3 text-slate-700">
            Reload the page to recover. Your last saved project is kept in this browser when
            IndexedDB is available.
          </p>
          <pre className="mt-4 overflow-auto rounded bg-slate-950 p-4 text-sm text-white">
            {this.state.error.message}
          </pre>
        </section>
      </main>
    );
  }
}
