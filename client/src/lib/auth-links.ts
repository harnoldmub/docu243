/** Only same-site paths are accepted as a return destination. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth")) return fallback;
  return next;
}

export function authHref(mode: "login" | "register", next?: string) {
  const params = new URLSearchParams({ mode });
  if (next) params.set("next", next);
  return `/auth?${params.toString()}`;
}

export function currentPath() {
  return window.location.pathname + window.location.search;
}
