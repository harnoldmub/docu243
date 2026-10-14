import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  role: "citizen" | "agent" | "admin" | "super_admin";
  prenom: string;
  nom: string;
}

export type LoginInput = { email: string; password: string };
export type RegisterInput = { prenom: string; nom: string; email: string; phone: string; password: string };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** Resolves with the user, or rejects with an ApiError carrying the server message. */
  login: (data: LoginInput) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const isStaffRole = (role?: string) => ["agent", "admin", "super_admin"].includes(role ?? "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new ApiError(res.status, "Session indisponible");
        return res.json();
      } catch (e) {
        if (e instanceof ApiError) throw e;
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => (await apiRequest("POST", "/api/auth/login", data)).json() as Promise<User>,
    onSuccess: (u) => queryClient.setQueryData(["/api/auth/me"], u),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => (await apiRequest("POST", "/api/auth/register", data)).json() as Promise<User>,
    onSuccess: (u) => queryClient.setQueryData(["/api/auth/me"], u),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSettled: () => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "/api/procedures" });
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: (data) => loginMutation.mutateAsync(data),
        register: (data) => registerMutation.mutateAsync(data),
        logout: async () => {
          try {
            await logoutMutation.mutateAsync();
          } catch {
            /* session is cleared locally anyway */
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
