export function userMessage(error: unknown, fallback: string) {
  if (isAbortError(error)) {
    return "Cancelled. Your previous project state is still intact.";
  }

  if (error instanceof Error && error.message.trim()) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
