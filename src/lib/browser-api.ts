/**
 * Calls made from Client Components go through Next's `/api` rewrite. This
 * keeps the session cookie on the frontend origin while Express remains the
 * source of truth for authorization and validation.
 */
export class BrowserApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: string };

export async function browserApi<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, credentials: "same-origin" });
  } catch {
    throw new BrowserApiError(503, "Cannot reach the backend. Please try again.");
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new BrowserApiError(response.status, body?.error ?? `Request failed (${response.status})`);
  }

  return body.data as T;
}
