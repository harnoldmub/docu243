import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, CheckCheck } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/states";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { relative } from "@/pages/dashboard";
import { cn } from "@/lib/utils";

type Note = { id: string; title: string; message: string; readAt: string | null; createdAt: string | null; metadata?: { applicationId?: string } | null };

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Notifications />
    </RequireAuth>
  );
}

function Notifications() {
  const { data = [], isLoading, isError, refetch } = useQuery<Note[]>({ queryKey: ["/api/notifications"], staleTime: 0 });
  const unread = data.filter((n) => !n.readAt).length;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  const markOne = useMutation({ mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: () => apiRequest("POST", "/api/notifications/read-all"), onSuccess: invalidate });

  return (
    <div className="bg-brand-mist pb-20">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container flex flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display-1 text-brand-ink">Notifications</h1>
            <p className="mt-2 text-brand-ink-2" role="status">
              {unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu."}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" onClick={() => markAll.mutate()} loading={markAll.isPending}>
              <CheckCheck aria-hidden="true" /> Tout marquer comme lu
            </Button>
          )}
        </div>
      </section>
      <div className="md-container max-w-3xl pt-8">
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
        ) : isError ? (
          <ErrorState message="Les notifications n'ont pas pu être chargées." onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title="Aucune notification">
            Vous serez prévenu ici à chaque étape de vos dossiers.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {data.map((n) => (
              <li key={n.id} className={cn("rounded-2xl border bg-white p-5", n.readAt ? "border-brand-line" : "border-brand-royal/40 border-l-[6px] border-l-brand-royal")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-ink">
                      {!n.readAt && <span className="sr-only">Non lue : </span>}
                      {n.title}
                    </p>
                    <p className="mt-1 text-[0.9375rem] text-brand-ink-2">{n.message}</p>
                    <p className="mt-2 text-sm text-brand-ink-2">{relative(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {n.metadata?.applicationId && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/application/${n.metadata.applicationId}`} onClick={() => !n.readAt && markOne.mutate(n.id)}>
                          Voir le dossier
                        </Link>
                      </Button>
                    )}
                    {!n.readAt && (
                      <Button variant="ghost" size="sm" onClick={() => markOne.mutate(n.id)}>
                        Marquer comme lue
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
