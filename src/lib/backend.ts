/** Used by Server Components. Browser code should call the relative `/api/...` path (proxied by next.config.ts). */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

export class BackendError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Params = Record<string, string | number | boolean | undefined | null>;

export async function backendGet<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(`/api${path}`, BACKEND_URL);
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new BackendError(503, `Cannot reach the backend at ${BACKEND_URL}. Is it running?`);
  }
  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: string } | null;
  if (!res.ok || !json?.success) throw new BackendError(res.status, json?.error ?? `Backend request failed (${res.status})`);
  return json.data as T;
}
