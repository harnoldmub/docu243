import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Search,
  ArrowLeft,
  Filter,
  User as UserIcon,
  Activity,
  Eye,
  Settings,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { RequireAuth } from "@/components/require-auth";
import { AdminHeader } from "@/components/admin-shell";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ActivityLog } from "@shared/schema";

export default function ActivityLogsPage() {
  return (
    <RequireAuth staff>
      <ActivityLogs />
    </RequireAuth>
  );
}

function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/logs"],
  });

  const filteredLogs = useMemo(
    () =>
      (logs ?? []).filter((log) =>
        [log.action, log.entityType, log.entityId, log.oldValue ?? "", log.newValue ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [logs, searchTerm],
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case "document_validation":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 font-bold"><FileCheck className="h-3 w-3" /> VALIDATION</Badge>;
      case "status_update":
      case "admin_status_update":
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 gap-1 font-bold"><Settings className="h-3 w-3" /> STATUT</Badge>;
      case "procedure_update":
      case "procedure_create":
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 gap-1 font-bold"><Settings className="h-3 w-3" /> CONFIG</Badge>;
      case "user_create":
      case "user_update":
        return <Badge className="bg-violet-50 text-violet-600 border-violet-100 gap-1 font-bold"><UserIcon className="h-3 w-3" /> UTILISATEUR</Badge>;
      default:
        return <Badge variant="outline" className="gap-1 font-bold"><Activity className="h-3 w-3" /> ACTION</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-brand-mist pb-20">
      <AdminHeader title="Journal d'activité" intro="Toutes les actions enregistrées sur les dossiers, les pièces et les démarches." />

      <div className="md-container mt-8">
        <Card className="rounded-2xl shadow-card border-none overflow-hidden bg-white">
          <div className="p-8 border-b border-brand-line flex items-center justify-between bg-brand-mist">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink-2" />
              <Input
                placeholder="Rechercher par action, entité ou valeur..."
                className="pl-12 h-14 border-none bg-white rounded-2xl shadow-sm focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-brand-ink-2 border-b border-brand-line">
                  <th className="px-8 py-6 text-left text-sm font-semibold">Date & Heure</th>
                  <th className="px-8 py-6 text-left text-sm font-semibold">Acteur</th>
                  <th className="px-8 py-6 text-left text-sm font-semibold">Action</th>
                  <th className="px-8 py-6 text-left text-sm font-semibold">Détails</th>
                  <th className="px-8 py-6 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-8"><div className="h-8 bg-brand-mist rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-mist transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-ink">{format(new Date(log.createdAt ?? new Date()), "dd MMM yyyy", { locale: fr })}</span>
                        <span className="text-xs font-bold text-brand-ink-2 tracking-tight">{format(new Date(log.createdAt ?? new Date()), "HH:mm:ss")}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-brand-mist flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-brand-ink-2" />
                        </div>
                        <span className="font-bold text-brand-ink text-sm">Agent #{String(log.actorId).substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">{getActionBadge(log.action)}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-brand-ink-2">
                          {log.entityType} : <span className="text-primary tracking-tighter">{String(log.entityId).substring(0, 8)}</span>
                        </span>
                        {(log.oldValue || log.newValue) && (
                          <span className="text-sm font-semibold text-brand-ink-2">
                            {log.oldValue || "—"} → {log.newValue || "—"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-brand-mist" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-5 w-5 text-brand-ink-2" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <History className="h-12 w-12 text-slate-200" />
                        <div className="text-brand-ink-2 font-bold">Aucune activité trouvée</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Détail du log</DialogTitle>
            <DialogDescription>
              Consultez l’événement exact enregistré dans l’espace d’administration.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div><span className="font-bold text-brand-ink">Action:</span> {selectedLog.action}</div>
              <div><span className="font-bold text-brand-ink">Entité:</span> {selectedLog.entityType}</div>
              <div><span className="font-bold text-brand-ink">ID entité:</span> {selectedLog.entityId}</div>
              <div><span className="font-bold text-brand-ink">Acteur:</span> {selectedLog.actorId}</div>
              <div><span className="font-bold text-brand-ink">Ancienne valeur:</span> {selectedLog.oldValue || "—"}</div>
              <div><span className="font-bold text-brand-ink">Nouvelle valeur:</span> {selectedLog.newValue || "—"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
