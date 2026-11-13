export async function api<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch("/api" + path, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "x-studio-request": "1",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({ error: "request_failed" }));
  if (!r.ok) throw Error(data.error || "request_failed");
  return data as T;
}
