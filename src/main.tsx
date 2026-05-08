import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./shared/ErrorBoundary";
import { registerServiceWorker } from "./shared/registerServiceWorker";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0
    },
    queries: {
      retry: 1,
      staleTime: 60_000
    }
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

registerServiceWorker();
