import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/status-badge";
import {
    FileText,
    Clock,
    Bell,
    ArrowRight,
    Plus,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle2,
    LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const { user } = useAuth();

    const { data: applications, isLoading: loadingApps } = useQuery<any[]>({
        queryKey: ["/api/applications/me"],
    });

    const { data: notifications, isLoading: loadingNotes } = useQuery<any[]>({
        queryKey: ["/api/notifications"],
        enabled: !!user,
        staleTime: 0,
        refetchInterval: user ? 10000 : false,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
    });

    const recentNotifications = notifications?.slice(0, 5) || [];

    const activeApps = applications?.filter(a => !["delivered", "rejected"].includes(a.status)) || [];
    const completedApps = applications?.filter(a => ["delivered", "rejected"].includes(a.status)) || [];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Welcome Section */}
            <div className="bg-white border-b py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">
                            Bonjour, {user?.prenom}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Bienvenue dans votre espace citoyen DOCU243.
                        </p>
                    </div>
                    <Link href="/catalogue">
                        <Button size="lg" className="rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20 h-14 px-8 text-lg">
                            <Plus className="h-5 w-5" />
                            Nouvelle démarche
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content: Dossiers */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Mes dossiers en cours ({activeApps.length})
                            </h2>
                        </div>

                        {loadingApps ? (
                            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-200" /></div>
                        ) : activeApps.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <LayoutGrid className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Aucun dossier actif</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                                    Vous n'avez pas de démarches administratives en cours pour le moment.
                                </p>
                                <Link href="/catalogue">
                                    <Button variant="ghost" className="mt-4 font-bold text-primary">Explorer le catalogue</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {activeApps.map((app) => (
                                    <Link key={app.id} href={`/application/${app.id}`}>
                                        <Card className="group border-none shadow-sm hover:shadow-md transition-all hover:translate-x-1 overflow-hidden bg-white">
                                            <CardContent className="p-0">
                                                <div className="flex items-center gap-4 p-5">
                                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                                                        <FileText className="h-6 w-6" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                                            {app.procedure?.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-slate-400 font-medium">#{app.id.slice(0, 8)}</span>
                                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                            <span className="text-xs text-slate-400 font-medium italic">
                                                                {app.updatedAt
                                                                    ? formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true, locale: fr })
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <StatusBadge status={app.status} size="sm" />
                                                        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Completed Dossiers Section */}
                        {completedApps.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <h2 className="text-lg font-bold text-slate-400">Historique des dossiers</h2>
                                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                                    {completedApps.map((app, i) => (
                                        <Link key={app.id} href={`/application/${app.id}`}>
                                            <div className={cn(
                                                "p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b last:border-0",
                                                app.status === "rejected" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-emerald-500"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <CheckCircle2 className={cn("h-5 w-5", app.status === "rejected" ? "text-rose-500" : "text-emerald-500")} />
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-700">{app.procedure?.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                            {app.updatedAt
                                                                ? format(new Date(app.updatedAt), "d MMM yyyy", { locale: fr })
                                                                : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                                <StatusBadge status={app.status} size="sm" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Notifications */}
                    <div className="lg:col-span-1 space-y-8">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Notifications
                        </h2>

                        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                            <CardContent className="p-0">
                                {loadingNotes ? (
                                    <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-200" /></div>
                                ) : recentNotifications.length === 0 ? (
                                    <div className="p-12 text-center space-y-3">
                                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                            <Bell className="h-6 w-6" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium italic">Aucune nouvelle notification</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {recentNotifications.map((note) => (
                                            <button
                                                key={note.id}
                                                onClick={() => {
                                                    if (!note.readAt) {
                                                        markAsReadMutation.mutate(note.id);
                                                    }
                                                }}
                                                className={cn(
                                                "p-5 space-y-2 hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden",
                                                !note.readAt && "bg-blue-50/30"
                                            )}>
                                                {!note.readAt && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                                <div className="flex justify-between items-start gap-4">
                                                    <p className={cn("text-xs leading-relaxed", !note.readAt ? "text-slate-900 font-bold" : "text-slate-500 font-medium")}>
                                                        {note.message}
                                                    </p>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    {note.createdAt
                                                        ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: fr })
                                                        : ""}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            {recentNotifications.length > 0 && (
                                <div className="p-4 bg-slate-50 text-center border-t">
                                    <button className="text-xs font-bold text-primary hover:underline">
                                        Voir toute l'activité
                                    </button>
                                </div>
                            )}
                        </Card>

                        {/* Helpful Links / Support */}
                        <div className="p-6 bg-gradient-to-br from-primary to-primary/80 rounded-3xl text-white shadow-xl shadow-primary/20 space-y-4">
                            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold">Besoin d'aide ?</h3>
                                <p className="text-xs text-white/80 leading-relaxed font-medium">
                                    Consultez notre guide interactif ou contactez un conseiller DOCU243 en direct.
                                </p>
                            </div>
                            <Button variant="secondary" className="w-full font-bold h-10 px-4 text-xs rounded-xl text-primary bg-white hover:bg-white/90">
                                Centre d'assistance
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
