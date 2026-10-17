import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, ChevronDown, Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusInfo } from "@/components/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { authHref } from "@/lib/auth-links";
import { relative } from "@/lib/dates";
import { ApiError } from "@/lib/queryClient";

type TrackResult = {
  id?: string;
  reference: string;
  procedureTitle: string;
  status: string;
  stage: number;
  stages: number;
  updatedAt: string | null;
  owner: boolean;
};

const STAGE_LABELS = ["Brouillon", "Payé", "En cours", "Déposé", "Validé", "Prêt", "Terminé"];

export default function TrackPage() {
  const { user } = useAuth();
  const initial = new URLSearchParams(window.location.search).get("n") ?? "";
  const [input, setInput] = useState(initial);
  const [reference, setReference] = useState(initial.trim());
  const [lostOpen, setLostOpen] = useState(false);

  const { data, isFetching, error } = useQuery<TrackResult>({
    queryKey: [`/api/track/${encodeURIComponent(reference)}`],
    enabled: !!reference,
    staleTime: 30_000,
  });

  // Keep the number in the address so that "back" shows the same result.
  useEffect(() => {
    const url = reference ? `/suivi?n=${encodeURIComponent(reference)}` : "/suivi";
    window.history.replaceState(window.history.state, "", url);
  }, [reference]);

  const errorMessage = error instanceof ApiError ? error.message : error ? "La recherche a échoué. Vérifiez votre connexion puis réessayez." : null;
  const info = data ? statusInfo(data.status) : null;

  return (
    <div className="bg-brand-mist pb-16">
      <section className="border-b border-brand-line bg-white">
        <div className="md-container max-w-2xl py-8 lg:py-12">
          <h1 className="display-2 text-brand-ink">Suivre mon dossier</h1>
          <p className="mt-2 text-brand-ink-2">Sans compte : saisissez le numéro indiqué sur votre confirmation ou votre reçu.</p>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setReference(input.trim());
            }}
          >
            <label htmlFor="track-ref" className="block font-semibold text-brand-ink">
              Numéro de dossier
            </label>
            <input
              id="track-ref"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="DOCU_1A2B3C"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="search"
              aria-invalid={errorMessage ? true : undefined}
              aria-describedby={errorMessage ? "track-error" : undefined}
              className="field-input h-14 text-lg uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal"
            />
            {errorMessage && (
              <p id="track-error" role="alert" className="flex items-start gap-2 text-[0.9375rem] font-semibold text-[var(--st-danger)]">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {errorMessage}
              </p>
            )}
            <Button type="submit" size="xl" className="w-full" loading={isFetching} disabled={!input.trim()}>
              {!isFetching && <Search aria-hidden="true" />} Suivre mon dossier
            </Button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setLostOpen((v) => !v)}
              aria-expanded={lostOpen}
              aria-controls="lost-help"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-royal"
            >
              J'ai perdu mon numéro
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${lostOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {lostOpen && (
              <div id="lost-help" className="mt-2 space-y-2 rounded-xl bg-brand-mist p-4 text-[0.9375rem] text-brand-ink">
                <p>Le numéro commence par DOCU_. Vous le retrouvez :</p>
                <ul className="list-disc space-y-1 pl-5 text-brand-ink-2">
                  <li>sur votre reçu de paiement MesDémarches ;</li>
                  <li>dans votre espace, où tous vos dossiers sont listés.</li>
                </ul>
                <Button asChild variant="outline" className="mt-2 w-full sm:w-auto">
                  <Link href={user ? "/dashboard" : authHref("login", "/dashboard")}>{user ? "Voir mes dossiers" : "Me connecter pour voir mes dossiers"}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {data && info && (
        <section className="md-container max-w-2xl pt-6" aria-labelledby="track-result" aria-live="polite">
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="p-5 sm:p-6">
              <p className="text-sm text-brand-ink-2">Dossier {data.reference}</p>
              <h2 id="track-result" className="title-3 mt-1 text-brand-ink">{data.procedureTitle}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={data.status} />
                {data.updatedAt && <span className="text-sm text-brand-ink-2">Mis à jour {relative(data.updatedAt)}</span>}
              </div>

              <ol className="mt-5 flex gap-1" aria-label={`Étape ${data.stage + 1} sur ${data.stages} : ${STAGE_LABELS[data.stage]}`}>
                {STAGE_LABELS.map((label, i) => (
                  <li key={label} className={`h-2 flex-1 rounded-full ${i <= data.stage ? "bg-brand-royal" : "bg-brand-line"}`} title={label} />
                ))}
              </ol>
              <p className="mt-2 text-sm font-semibold text-brand-ink">
                Étape {data.stage + 1} sur {data.stages} : {STAGE_LABELS[data.stage]}
              </p>
              <p className="mt-3 text-[0.9375rem] text-brand-ink-2">{info.next}</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-line bg-brand-mist p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <p className="flex items-start gap-2 text-sm text-brand-ink-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Pièces, messages et modifications sont réservés au titulaire du dossier, après connexion.
              </p>
              {data.owner ? (
                <Button asChild className="shrink-0">
                  <Link href={data.id ? `/application/${data.id}` : "/dashboard"}>
                    Ouvrir mon dossier <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="shrink-0">
                  <Link href={authHref("login", "/dashboard")}>Me connecter</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
