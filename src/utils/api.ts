/**
 * Custom fetch wrapper that automatically appends the JWT authorization token
 * from localStorage to the headers of any outgoing API request.
 * This avoids monkey-patching window.fetch and bypasses browser iframe sandbox restrictions.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isApiCall = urlStr.startsWith("/api/") || urlStr.startsWith("api/") || urlStr.includes("/api/");
  
  const token = localStorage.getItem("token");
  if (token && isApiCall) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    init.headers = headers;
  }
  return fetch(input, init);
}
