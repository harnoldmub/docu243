import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** Error raised for any non-2xx API response, carrying the server's message. */
export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const NETWORK_ERROR = "Connexion impossible. Vérifiez votre accès à Internet puis réessayez.";

async function throwIfResNotOk(res: Response) {
  if (res.ok) return;
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  const message =
    (typeof data.error === "string" && data.error) ||
    (typeof data.message === "string" && data.message) ||
    (res.status >= 500 ? "Le service rencontre un problème. Réessayez dans quelques instants." : res.statusText);
  throw new ApiError(res.status, message, data);
}

async function safeFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }
}

export async function apiRequest(method: string, url: string, data?: unknown | undefined): Promise<Response> {
  const res = await safeFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await safeFetch(queryKey.join("/") as string, { credentials: "include" });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: (count, error) => error instanceof ApiError && error.status === 0 && count < 2,
    },
    mutations: {
      retry: false,
    },
  },
});
