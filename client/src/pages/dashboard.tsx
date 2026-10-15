import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Bell, Files, FolderOpen, HelpCircle, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/require-auth";
import { StatusBadge, statusInfo } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/states";
import { cn } from "@/lib/utils";

export type MyApplication = {
  id: string;
  reference: string;
  status: string;
  updatedAt: string | null;
  createdAt: string | null;
  submittedAt: string | null;
  procedure?: { title: string; institution: string; slug: string };
};

type Note = { id: string; title: string; message: string; readAt: string | null; createdAt: string | null; metadata?: { applicationId?: string } | null };

export { relative } from "@/lib/dates";
import { relative } from "@/lib/dates";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const apps = useQuery<MyApplication[]>({ queryKey: ["/api/applications/me"], staleTime: 30_000 });
  const notes = useQuery<Note[]>({ queryKey: ["/api/notifications"], staleTime: 30_000 });

  const list = apps.data ?? [];
  const groups = {
    action: list.filter((a) => statusInfo(a.status).group === "action"),
    progress: list.filter((a) => statusInfo(a.status).group === "progress"),
    done: list.filter((a) => statusInfo(a.status).group === "done"),
  };
  const unread = (notes.data ?? []).filter((n) => !n.readAt);

  return (
    <div className="bg-brand-mist pb-20">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between lg:py-14">
          <div>
            <h1 className="display-1 text-brand-ink">Bonjour {user?.prenom}</h1>
            <p className="lead mt-3 text-brand-ink-2">
              {groups.action.length
                ? `${groups.action.length} dossier${groups.action.length > 1 ? "s demandent" : " demande"} votre attention.`
                : "Retrouvez ici tous vos dossiers et leur avancement."}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/catalogue">
              <Plus aria-hidden="true" /> Nouvelle démarche
            </Link>
          </Button>
        </div>
        <div className="md-container pb-6">
          <ul className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { id: "a-faire", label: "À faire", count: groups.action.length, cls: "bg-brand-yellow text-brand-ink" },
              { id: "en-cours", label: "En cours", count: groups.progress.length, cls: "bg-brand-royal text-white" },
              { id: "termines", label: "Terminés", count: groups.done.length, cls: "bg-brand-mist text-brand-ink" },
            ].map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={cn("block rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5", t.cls)}>
                  <span className="block font-display text-3xl font-extrabold sm:text-4xl">{apps.isLoading ? "–" : t.count}</span>
                  <span className="mt-1 block text-sm font-semibold sm:text-base">{t.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="md-container grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {apps.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-28" />
              ))}
            </div>
          ) : apps.isError ? (
            <ErrorState message="Vos dossiers n'ont pas pu être chargés." onRetry={() => apps.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6" />}
              title="Vous n'avez pas encore de dossier"
              action={
                <>
                  <Button asChild>
                    <Link href="/catalogue">Trouver ma démarche</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/parcours">Partir de mon projet</Link>
                  </Button>
                </>
              }
            >
              Choisissez une démarche ouverte en ligne pour constituer votre premier dossier.
            </EmptyState>
          ) : (
            <>
              <DossierGroup id="a-faire" title="À faire" empty="Aucun dossier n'attend d'action de votre part." apps={groups.action} highlight />
              <DossierGroup id="en-cours" title="En cours" empty="Aucun dossier en cours de traitement." apps={groups.progress} />
              <DossierGroup id="termines" title="Terminés" empty="Aucun dossier terminé." apps={groups.done} />
            </>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-card" aria-labelledby="notes-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="notes-title" className="flex items-center gap-2 font-display text-lg font-bold text-brand-ink">
                <Bell className="h-5 w-5 text-brand-royal" aria-hidden="true" /> Notifications
              </h2>
              {unread.length > 0 && <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs font-bold text-white">{unread.length} non lue{unread.length > 1 ? "s" : ""}</span>}
            </div>
            {notes.isLoading ? (
              <div className="skeleton mt-4 h-20" />
            ) : notes.isError ? (
              <p className="mt-4 text-sm text-brand-ink-2">Les notifications n'ont pas pu être chargées.</p>
            ) : (notes.data ?? []).length === 0 ? (
              <p className="mt-4 text-[0.9375rem] text-brand-ink-2">Aucune notification pour le moment.</p>
            ) : (
              <ul className="mt-3 divide-y divide-brand-line">
                {(notes.data ?? []).slice(0, 4).map((n) => (
                  <li key={n.id} className="py-3">
                    <p className={cn("text-[0.9375rem]", n.readAt ? "text-brand-ink-2" : "font-semibold text-brand-ink")}>{n.message}</p>
                    <p className="mt-1 text-xs text-brand-ink-2">{relative(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/notifications" className="link-arrow mt-3 text-[0.9375rem]">
              Toutes les notifications <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <Link href="/mes-documents" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-raised">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-sky text-brand-royal">
              <Files className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-brand-ink">Mes documents</span>
              <span className="block text-sm text-brand-ink-2">Toutes les pièces envoyées</span>
            </span>
            <ArrowRight className="h-5 w-5 text-brand-royal" aria-hidden="true" />
          </Link>

          <Link href="/aide" className="flex items-center gap-4 rounded-2xl bg-brand-deep p-5 text-white transition-colors hover:bg-brand-night">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-yellow">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Besoin d'aide ?</span>
              <span className="block text-sm text-white/75">Questions fréquentes et assistance</span>
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function DossierGroup({ id, title, empty, apps, highlight }: { id: string; title: string; empty: string; apps: MyApplication[]; highlight?: boolean }) {
  return (
    <section id={id} className="scroll-mt-28" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="display-2 text-[1.75rem] text-brand-ink">
        {title} <span className="text-brand-ink-2">({apps.length})</span>
      </h2>
      {apps.length === 0 ? (
        <p className="mt-3 text-brand-ink-2">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {apps.map((a) => (
            <li key={a.id}>
              <DossierRow app={a} highlight={highlight} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DossierRow({ app, highlight }: { app: MyApplication; highlight?: boolean }) {
  const info = statusInfo(app.status);
  return (
    <article
      className={cn(
        "group relative rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:shadow-raised focus-within:border-brand-royal",
        highlight ? "border-brand-yellow" : "border-brand-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-brand-ink">
            <Link href={`/application/${app.id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-[3px] focus-visible:after:outline-[var(--focus)]">
              {app.procedure?.title ?? "Démarche"}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-brand-ink-2">
            Référence {app.reference} · mis à jour {relative(app.updatedAt)}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>
      <p className="mt-3 text-[0.9375rem]">
        <span className="text-brand-ink-2">Prochaine étape : </span>
        <span className="font-semibold text-brand-ink">{info.next}</span>
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-brand-royal" aria-hidden="true">
        {info.group === "action" && app.status === "draft" ? "Continuer le dossier" : "Voir le dossier"}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </article>
  );
}
