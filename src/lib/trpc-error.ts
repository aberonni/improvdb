/** The parts of a tRPC client error the app reads (see errorFormatter in trpc.ts) */
type TrpcErrorLike = {
  message: string;
  data?: {
    /** z.treeifyError output when the input failed validation */
    zodError?: {
      errors?: string[];
      properties?: Record<string, { errors?: string[] } | undefined>;
    } | null;
  } | null;
};

/**
 * What to tell the user about a failed request: the first validation problem
 * when the input was invalid (the raw message is then a JSON dump), otherwise
 * the server's message, otherwise the caller's fallback.
 */
export function trpcErrorMessage(error: TrpcErrorLike, fallback: string) {
  const zodError = error.data?.zodError;
  if (zodError) {
    for (const [field, entry] of Object.entries(zodError.properties ?? {})) {
      const [first] = entry?.errors ?? [];
      if (first) return `${field}: ${first}`;
    }
    const [first] = zodError.errors ?? [];
    if (first) return first;
  }
  return error.message || fallback;
}
