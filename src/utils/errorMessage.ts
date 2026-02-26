interface ErrorLike {
  message?: unknown;
  error_description?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
}

const NETWORK_PATTERNS = [
  /network/i,
  /failed to fetch/i,
  /fetch failed/i,
  /timeout/i,
  /tempo esgotado/i,
];

export function getErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado",
): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const errorLike = error as ErrorLike;
    const candidates = [
      errorLike.message,
      errorLike.error_description,
      errorLike.details,
      errorLike.hint,
      errorLike.code,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return fallback;
}

export function isLikelyNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error, "").toLowerCase();
  return NETWORK_PATTERNS.some((pattern) => pattern.test(message));
}
