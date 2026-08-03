const DEFAULT_BACKEND_API_URL = "http://15.206.73.249/api";

export function getBackendApiUrl() {
  const configured =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    DEFAULT_BACKEND_API_URL;

  return configured.replace(/\/+$/, "");
}

export async function backendFetch(path: string, init?: RequestInit) {
  const url = `${getBackendApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  return { response, data };
}
