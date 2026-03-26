import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Calendar,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Application, User as AppUser, Procedure, ApplicationDocument } from "@shared/schema";

type EnrichedApplication = Application & {
  user: AppUser;
  procedure: Procedure;
  documents: ApplicationDocument[];
};

export default function AdminDashboard() {
  const { user: agent } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications, isLoading } = useQuery<EnrichedApplication[]>({
    queryKey: ["/api/admin/applications"],
  });

  if (!agent || agent.role === "citizen") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Accès Refusé</h2>
        <p className="text-slate-500 max-w-sm mb-8">Cet espace est réservé au personnel administratif autorisé. Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
        <Button onClick={() => window.location.href = "/"}>Retour à l'accueil</Button>
      </div>
    );
  }

  const filteredApps = applications?.filter(app => {
    const matchesSearch =
      app.user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.procedure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: applications?.filter(a => ["submitted", "under_review"].includes(a.status)).length || 0,
    urgent: applications?.filter(a => a.status === "pending_user_action").length || 0,
    total: applications?.length || 0,
    completed: applications?.filter(a => ["ready", "delivered", "approved"].includes(a.status)).length || 0
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Metrics Header */}
      <div className="bg-white border-b border-slate-200 pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-1">
                <ShieldCheck className="h-4 w-4" />
                Administration Centrale
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Espace Gestionnaire</h1>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <Link href="/admin">
                <Button variant="ghost" className="rounded-xl font-bold bg-white shadow-sm">Dossiers</Button>
              </Link>
              <Link href="/admin/procedures">
                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-900">Procédures</Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-900">Utilisateurs</Button>
              </Link>
              <Link href="/admin/logs">
                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-900">Logs</Button>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 w-full md:w-[240px] bg-slate-50 border-none rounded-xl h-12 focus-visible:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumis</option>
                <option value="under_review">En examen</option>
                <option value="pending_user_action">Action requise</option>
                <option value="approved">Approuvé</option>
                <option value="ready">Prêt</option>
                <option value="delivered">Délivré</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="À réviser"
              value={stats.pending}
              icon={<Clock className="h-5 w-5" />}
              color="blue"
              description="Nouveaux dossiers soumis"
            />
            <MetricCard
              label="Urgents"
              value={stats.urgent}
              icon={<AlertCircle className="h-5 w-5" />}
              color="rose"
              description="Action citoyenne requise"
            />
            <MetricCard
              label="Finalisés"
              value={stats.completed}
              icon={<CheckCircle className="h-5 w-5" />}
              color="emerald"
              description="Approuvés aujourd'hui"
            />
            <MetricCard
              label="Total"
              value={stats.total}
              icon={<FileText className="h-5 w-5" />}
              color="slate"
              description="Total dossiers gérés"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <Card className="rounded-3xl shadow-xl shadow-slate-200/50 border-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 text-white border-none">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest opacity-60">Citoyen</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest opacity-60">Procédure</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest opacity-60">Statut</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest opacity-60">Dernière Mise à jour</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest opacity-60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8"><div className="h-8 bg-slate-100 rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : filteredApps?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <FileText className="h-12 w-12 mb-4" />
                        <p className="font-bold">Aucun dossier trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApps?.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-black text-slate-900 leading-none mb-1">{app.user.prenom} {app.user.nom}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{app.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span className="font-bold text-slate-700">{app.procedure.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={app.status as any} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(app.updatedAt ?? app.createdAt ?? Date.now()), "dd MMM yyyy", { locale: fr })}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/application/${app.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl font-bold h-10 px-4 group/btn"
                          >
                            Traiter
                            <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, description }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  };

  return (
    <Card className={`rounded-3xl border ${colors[color]} shadow-none`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div className="text-3xl font-black tracking-tighter">{value}</div>
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest opacity-80">{label}</div>
          <div className="text-[10px] font-bold opacity-60 tracking-tight">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
