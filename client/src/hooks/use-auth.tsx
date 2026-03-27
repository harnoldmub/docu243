import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
    id: string;
    email: string;
    role: "citizen" | "agent" | "admin" | "super_admin";
    prenom: string;
    nom: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery<User | null>({
        queryKey: ["/api/auth/me"],
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        refetchInterval: 10 * 60 * 1000, // recheck every 10 min
        queryFn: async () => {
            const res = await fetch("/api/auth/me", { credentials: "include" });
            if (res.status === 401) return null;
            if (!res.ok) throw new Error("Erreur de connexion");
            return res.json();
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/auth/login", data);
            return res.json();
        },
        onSuccess: (user: User) => {
            queryClient.setQueryData(["/api/auth/me"], user);
            toast({ title: "Bienvenue !", description: `Content de vous revoir, ${user.prenom}.` });
        },
        onError: (error: Error) => {
            toast({
                title: "Échec de connexion",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/auth/register", data);
            return res.json();
        },
        onSuccess: (user: User) => {
            queryClient.setQueryData(["/api/auth/me"], user);
            toast({ title: "Compte créé", description: "Votre compte a été créé avec succès." });
        },
        onError: (error: Error) => {
            toast({
                title: "Échec de l'inscription",
                description: error.message,
                variant: "destructive"
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => apiRequest("POST", "/api/auth/logout"),
        onSuccess: () => {
            queryClient.setQueryData(["/api/auth/me"], null);
            toast({ title: "Déconnecté", description: "À bientôt !" });
        },
    });

    return (
        <AuthContext.Provider value={{
            user: user ?? null,
            isLoading,
            login: async (data) => {
                try { await loginMutation.mutateAsync(data); } catch { /* handled by onError toast */ }
            },
            register: async (data) => {
                try { await registerMutation.mutateAsync(data); } catch { /* handled by onError toast */ }
            },
            logout: async () => {
                try { await logoutMutation.mutateAsync(); } catch { /* ignore */ }
            },
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
