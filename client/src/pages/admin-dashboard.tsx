import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Inbox, Search } from "lucide-react";
import type { Application, ApplicationDocument, Procedure } from "@shared/schema";
import { RequireAuth } from "@/components/require-auth";
import { AdminHeader } from "@/components/admin-shell";
import { APPLICATION_STATUS, StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState } from "@/components/states";
import { normalize } from "@/lib/procedures";
import { relative } from "@/pages/dashboard";
import { cn } from "@/lib/utils";

type Row = Application & {
  user: { prenom?: string; nom?: string; email?: string };
  procedure?: Procedure;
  documents: ApplicationDocument[];
};

const QUEUES = [
  { id: "todo", label: "À examiner", statuses: ["submitted", "received", "under_review"] },
  { id: "citizen", label: "En attente du demandeur", statuses: ["pending_user_action", "pending_payment"] },
  { id: "done", label: "Approuvés ou prêts", statuses: ["approved", "ready"] },
  { id: "closed", label: "Clos", statuses: ["delivered", "rejected"] },
  { id: "draft", label: "Brouillons", statuses: ["draft"] },
];

export default function AdminDashboardPage() {
  return (
    <RequireAuth staff>
      <AdminDashboard />
    </RequireAuth>
  );
}

function AdminDashboard() {
  const { data = [], isLoading, isError, refetch } = useQuery<Row[]>({ queryKey: ["/api/admin/applications"], staleTime: 15_000 });
  const [q, setQ] = useState("");
  const [queue, setQueue] = useState("todo");

  const counts = useMemo(() => Object.fromEntries(QUEUES.map((x) => [x.id, data.filter((a) => x.statuses.includes(a.status)).length])), [data]);
  const rows = useMemo(() => {
    const statuses = QUEUES.find((x) => x.id === queue)?.statuses ?? [];
    const nq = normalize(q);
    return data
      .filter((a) => statuses.includes(a.status))
      .filter((a) => !nq || normalize(`${a.user?.prenom} ${a.user?.nom} ${a.user?.email} ${a.procedure?.title} ${a.reference}`).includes(nq))
      .sort((a, b) => new Date(a.submittedAt ?? a.updatedAt ?? 0).getTime() - new Date(b.submittedAt ?? b.updatedAt ?? 0).getTime());
  }, [data, q, queue]);

  return (
    <div className="bg-brand-mist pb-20">
      <AdminHeader title="Dossiers" intro="Les dossiers les plus anciens apparaissent en premier." />
      <div className="md-container pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Files de traitement" className="flex flex-wrap gap-2">
            {QUEUES.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={queue === x.id}
                onClick={() => setQueue(x.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold transition-colors",
                  queue === x.id ? "bg-brand-royal text-white" : "bg-white text-brand-ink hover:bg-brand-sky",
                )}
              >
                {x.label}
                <span className={cn("rounded-full px-2 text-sm", queue === x.id ? "bg-white/20" : "bg-brand-mist")}>{isLoading ? "–" : counts[x.id]}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <label htmlFor="admin-q" className="sr-only">Rechercher un dossier</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink-2" aria-hidden="true" />
            <input id="admin-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, référence, démarche…" className="field-input pl-12" />
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : isError ? (
            <ErrorState message="Les dossiers n'ont pas pu être chargés." onRetry={() => refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Inbox className="h-6 w-6" />} title="Aucun dossier dans cette file" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
              <table className="w-full min-w-[760px] text-left text-[0.9375rem]">
                <caption className="sr-only">{QUEUES.find((x) => x.id === queue)?.label}</caption>
                <thead className="bg-brand-mist text-sm text-brand-ink-2">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Demandeur</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Démarche</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Statut</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Pièces</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Mise à jour</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {rows.map((a) => {
                    const toCheck = a.documents.filter((d) => d.status === "submitted").length;
                    return (
                      <tr key={a.id} className="hover:bg-brand-mist/60">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-brand-ink">{a.user?.prenom} {a.user?.nom}</p>
                          <p className="text-sm text-brand-ink-2">{a.reference}</p>
                        </td>
                        <td className="px-5 py-4 text-brand-ink">{a.procedure?.title}</td>
                        <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-4 text-brand-ink-2">
                          {a.documents.length} envoyée{a.documents.length > 1 ? "s" : ""}
                          {toCheck > 0 && <span className="block text-sm font-semibold text-brand-deep">{toCheck} à contrôler</span>}
                        </td>
                        <td className="px-5 py-4 text-brand-ink-2">{relative((a.updatedAt ?? a.createdAt) as unknown as string)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/application/${a.id}`} className="link-arrow">
                            Traiter <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only"> le dossier {a.reference}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-brand-ink-2">
          Statuts possibles : {Object.values(APPLICATION_STATUS).map((s) => s.label).join(", ")}.
        </p>
      </div>
    </div>
  );
}
