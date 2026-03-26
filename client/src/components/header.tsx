import React from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  User as UserIcon,
  Bell,
  LogOut,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  ChevronDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt?: string | null;
};

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const isHome = location === "/";
  const initials = `${user?.prenom?.[0] ?? ""}${user?.nom?.[0] ?? ""}` || "U";
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur";
  const isAgent = ["agent", "admin", "super_admin"].includes(user?.role ?? "");
  const roleLabel = user?.role === "super_admin" ? "Super Admin" : user?.role === "admin" ? "Admin" : user?.role === "agent" ? "Agent" : "Citoyen";
  const { data: notifications = [] } = useQuery<HeaderNotification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    staleTime: 0,
    refetchInterval: user ? 10000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const unreadNotifications = notifications.filter((note) => !note.readAt);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isHome ? "bg-slate-900/80 backdrop-blur-lg border-b border-white/10" : "bg-white/80 backdrop-blur-lg border-b border-slate-200"
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between h-20 px-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center group min-w-0">
            <div className={cn(
              "flex items-center justify-center transition-all duration-300 group-hover:scale-[1.02]"
            )}>
              <img
                src="/logo.png"
                alt="DOCU243"
                className="h-16 w-auto sm:h-[4.5rem] object-contain drop-shadow-[0_6px_18px_rgba(15,23,42,0.18)]"
              />
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {isAgent ? (
              <>
                <Link href="/admin">
                  <button className={cn(
                    "px-4 py-2 text-sm font-bold transition-colors rounded-lg",
                    isHome ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-primary hover:bg-primary/5"
                  )}>
                    Espace Agent
                  </button>
                </Link>
                <Link href="/admin/procedures">
                  <button className={cn(
                    "px-4 py-2 text-sm font-bold transition-colors rounded-lg",
                    isHome ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-primary hover:bg-primary/5"
                  )}>
                    Procédures
                  </button>
                </Link>
                <Link href="/admin/users">
                  <button className={cn(
                    "px-4 py-2 text-sm font-bold transition-colors rounded-lg",
                    isHome ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-primary hover:bg-primary/5"
                  )}>
                    Utilisateurs
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/catalogue">
                  <button className={cn(
                    "px-4 py-2 text-sm font-bold transition-colors rounded-lg",
                    isHome ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-primary hover:bg-primary/5"
                  )}>
                    Catalogue
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className={cn(
                    "px-4 py-2 text-sm font-bold transition-colors rounded-lg",
                    isHome ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-primary hover:bg-primary/5"
                  )}>
                    Mes Dossiers
                  </button>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("relative", isHome ? "text-white hover:bg-white/10" : "text-slate-600")}>
                      <Bell className="h-5 w-5" />
                      {unreadNotifications.length > 0 && (
                        <>
                          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
                          <span className="sr-only">{unreadNotifications.length} notifications non lues</span>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-96 p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-slate-900">Notifications</div>
                          <div className="text-xs font-bold text-slate-400">
                            {unreadNotifications.length > 0 ? `${unreadNotifications.length} non lue(s)` : "Tout est à jour"}
                          </div>
                        </div>
                        <Link href="/dashboard">
                          <button className="text-xs font-bold text-primary hover:underline">Voir tout</button>
                        </Link>
                      </div>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-sm text-slate-400 font-medium text-center">Aucune notification pour le moment.</div>
                      ) : (
                        notifications.slice(0, 6).map((note) => (
                          <button
                            key={note.id}
                            className={cn(
                              "w-full text-left px-4 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                              !note.readAt && "bg-blue-50/40"
                            )}
                            onClick={() => {
                              if (!note.readAt) {
                                markAsReadMutation.mutate(note.id);
                              }
                              window.location.href = "/dashboard";
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {!note.readAt && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-900">{note.title}</div>
                                <div className="text-xs text-slate-500 leading-relaxed mt-1">{note.message}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 h-11 rounded-xl transition-all",
                      isHome ? "text-white hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {initials}
                    </div>
                    <div className="hidden sm:flex flex-col items-start -space-y-1">
                      <span className="text-xs font-black">{fullName}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-tighter", isAgent ? "text-primary" : "text-slate-400")}>{roleLabel}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 mt-2">
                  <DropdownMenuLabel className="px-3 pb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mon Espace</div>
                    <div className="text-sm font-black text-slate-900">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAgent ? (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-primary/5 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="font-bold text-sm">Tableau de bord agent</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/procedures">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-sm">Gestion procédures</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/logs">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-sm">Logs d'activité</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-sm">Tableau de bord</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/catalogue">
                        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-sm">Nouveau dossier</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50"
                    onClick={() => logout()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-bold text-sm">Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className={cn(
                    "font-bold h-11 px-6 rounded-xl",
                    isHome ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Connexion
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                  S'inscrire
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
