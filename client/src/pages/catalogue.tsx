import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, Search, X, FileSearch } from "lucide-react";
import { useProcedures } from "@/hooks/use-procedures";
import { ProcedureCard, ProcedureCardSkeleton } from "@/components/procedure-card";
import { ErrorState, EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  AVAILABILITY_FILTERS,
  availability,
  searchProcedures,
  sortCategories,
  type AvailabilityKey,
  type ProcedureWithGuide,
} from "@/lib/procedures";
import { cn } from "@/lib/utils";

type Filters = { q: string; categorie: string; institution: string; dispo: AvailabilityKey[] };

function readFilters(): Filters {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") ?? "",
    categorie: p.get("categorie") ?? p.get("category") ?? "",
    institution: p.get("institution") ?? "",
    dispo: (p.get("dispo")?.split(",").filter(Boolean) ?? []) as AvailabilityKey[],
  };
}

function writeFilters(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categorie) p.set("categorie", f.categorie);
  if (f.institution) p.set("institution", f.institution);
  if (f.dispo.length) p.set("dispo", f.dispo.join(","));
  const qs = p.toString();
  window.history.replaceState(window.history.state, "", `/catalogue${qs ? `?${qs}` : ""}`);
}

function applyFilters(list: ProcedureWithGuide[], f: Filters, skip?: keyof Filters) {
  let out = skip === "q" ? list : searchProcedures(list, f.q);
  if (f.categorie && skip !== "categorie") out = out.filter((p) => p.category === f.categorie);
  if (f.institution && skip !== "institution") out = out.filter((p) => p.institution === f.institution);
  if (f.dispo.length && skip !== "dispo") out = out.filter((p) => f.dispo.includes(availability(p).key));
  return out;
}

export default function Catalogue() {
  const { data: procedures = [], isLoading, isError, refetch } = useProcedures();
  const [filters, setFilters] = useState<Filters>(readFilters);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => writeFilters(filters), [filters]);

  const results = useMemo(() => applyFilters(procedures, filters), [procedures, filters]);
  const categories = useMemo(() => sortCategories(Array.from(new Set(procedures.map((p) => p.category)))), [procedures]);
  const institutions = useMemo(
    () => Array.from(new Set(procedures.map((p) => p.institution))).sort((a, b) => a.localeCompare(b, "fr")),
    [procedures],
  );
  const activeCount = (filters.categorie ? 1 : 0) + (filters.institution ? 1 : 0) + filters.dispo.length;
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const clearAll = () => setFilters({ q: "", categorie: "", institution: "", dispo: [] });

  // Counts shown next to each option, given the other active filters.
  const withoutCategory = useMemo(() => applyFilters(procedures, filters, "categorie"), [procedures, filters]);
  const withoutDispo = useMemo(() => applyFilters(procedures, filters, "dispo"), [procedures, filters]);

  const renderFilters = (prefix: string) => (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold text-brand-ink">Catégorie</legend>
        <div className="space-y-1">
          {[{ value: "", label: "Toutes les catégories" }, ...categories.map((c) => ({ value: c, label: c }))].map((c) => {
            const count = c.value ? withoutCategory.filter((p) => p.category === c.value).length : withoutCategory.length;
            const checked = filters.categorie === c.value;
            return (
              <label
                key={c.label}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 transition-colors duration-150 hover:bg-brand-mist",
                  checked && "bg-brand-sky font-semibold text-brand-deep hover:bg-brand-sky",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`${prefix}-categorie`}
                    value={c.value}
                    checked={checked}
                    onChange={() => update({ categorie: c.value })}
                    className="h-4 w-4 accent-[var(--md-royal)]"
                  />
                  {c.label}
                </span>
                <span className="text-sm text-brand-ink-2">{count}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${prefix}-institution`} className="mb-3 block font-display text-lg font-bold text-brand-ink">
          Institution
        </label>
        <select
          id={`${prefix}-institution`}
          className="field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23526079%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10"
          value={filters.institution}
          onChange={(e) => update({ institution: e.target.value })}
        >
          <option value="">Toutes les institutions</option>
          {institutions.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {procedures.some((p) => availability(p).key !== "online") && (
      <fieldset>
        <legend className="mb-3 font-display text-lg font-bold text-brand-ink">Disponibilité</legend>
        <div className="space-y-1">
          {AVAILABILITY_FILTERS.map((a) => {
            const checked = filters.dispo.includes(a.value);
            return (
              <label key={a.value} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 hover:bg-brand-mist">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      update({ dispo: checked ? filters.dispo.filter((d) => d !== a.value) : [...filters.dispo, a.value] })
                    }
                    className="h-4 w-4 rounded accent-[var(--md-royal)]"
                  />
                  {a.label}
                </span>
                <span className="text-sm text-brand-ink-2">{withoutDispo.filter((p) => availability(p).key === a.value).length}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      )}
    </div>
  );

  const chips: Array<{ label: string; onRemove: () => void }> = [
    ...(filters.q ? [{ label: `« ${filters.q} »`, onRemove: () => update({ q: "" }) }] : []),
    ...(filters.categorie ? [{ label: filters.categorie, onRemove: () => update({ categorie: "" }) }] : []),
    ...(filters.institution ? [{ label: filters.institution, onRemove: () => update({ institution: "" }) }] : []),
    ...filters.dispo.map((d) => ({
      label: AVAILABILITY_FILTERS.find((a) => a.value === d)?.label ?? d,
      onRemove: () => update({ dispo: filters.dispo.filter((x) => x !== d) }),
    })),
  ];

  return (
    <>
      <section className="on-blue bg-brand-deep text-white">
        <div className="md-container pb-12 pt-12 lg:pb-16 lg:pt-16">
          <h1 className="display-1">Toutes les démarches</h1>
          <p className="lead mt-4 max-w-2xl text-white/80">
            Cherchez par nom, par mot-clé ou par administration. Les démarches à venir restent visibles pour vous informer.
          </p>
          <form role="search" className="relative mt-8 max-w-3xl" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="catalogue-q" className="sr-only">
              Rechercher une démarche
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink-2" aria-hidden="true" />
            <input
              id="catalogue-q"
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Ex. impot, naissance, casier, société…"
              className="field-input h-14 border-transparent pl-12 text-[1.0625rem]"
              autoComplete="off"
            />
          </form>
        </div>
        <div className="tricolor" style={{ ["--tricolor-h" as string]: "8px" }} aria-hidden="true" />
      </section>

      <section className="bg-brand-mist py-10 lg:py-14">
        <div className="md-container grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="hidden lg:block" aria-label="Filtres">
            <div className="sticky top-28 rounded-2xl border border-brand-line bg-white p-5">
              <h2 className="sr-only">Filtres</h2>
              {renderFilters("desktop")}
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-brand-ink" aria-live="polite" role="status">
                {isLoading ? "Chargement…" : `${results.length} démarche${results.length > 1 ? "s" : ""}`}
              </p>
              <Dialog.Root open={panelOpen} onOpenChange={setPanelOpen}>
                <Dialog.Trigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal aria-hidden="true" />
                    Filtres
                    {activeCount > 0 && (
                      <span className="ml-1 rounded-full bg-brand-royal px-2 py-0.5 text-xs font-bold text-white">{activeCount}</span>
                    )}
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                  <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col rounded-t-[24px] bg-white data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom">
                    <div className="flex items-center justify-between border-b border-brand-line px-5 py-3">
                      <Dialog.Title className="font-display text-xl font-bold text-brand-ink">Filtres</Dialog.Title>
                      <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-mist" aria-label="Fermer les filtres">
                        <X className="h-5 w-5" aria-hidden="true" />
                      </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">Affinez la liste des démarches.</Dialog.Description>
                    <div className="flex-1 overflow-y-auto px-5 py-5">{renderFilters("mobile")}</div>
                    <div className="flex gap-3 border-t border-brand-line p-4">
                      <Button variant="outline" className="flex-1" onClick={clearAll} disabled={!activeCount && !filters.q}>
                        Effacer
                      </Button>
                      <Button className="flex-[2]" onClick={() => setPanelOpen(false)}>
                        Afficher {results.length} résultat{results.length > 1 ? "s" : ""}
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="sr-only">Filtres actifs :</span>
                {chips.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={c.onRemove}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-line bg-white pl-3 pr-2 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-ink"
                  >
                    {c.label}
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Retirer ce filtre</span>
                  </button>
                ))}
                <Button variant="tertiary" size="sm" onClick={clearAll}>
                  Effacer les filtres
                </Button>
              </div>
            )}

            <h2 className="sr-only">Résultats</h2>
            <div className="mt-6">
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProcedureCardSkeleton key={i} />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState message="Le catalogue n'a pas pu être chargé." onRetry={() => refetch()} />
              ) : results.length === 0 ? (
                <EmptyState
                  icon={<FileSearch className="h-6 w-6" />}
                  title="Aucune démarche ne correspond"
                  action={
                    <>
                      <Button onClick={clearAll}>Effacer les filtres</Button>
                      <Button asChild variant="outline">
                        <Link href="/parcours">Partir de mon projet</Link>
                      </Button>
                    </>
                  }
                >
                  Essayez un autre mot, par exemple « naissance », « impôt » ou « entreprise », ou retirez un filtre.
                </EmptyState>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {results.map((p) => (
                    <li key={p.id} className="animate-in fade-in-0 duration-200">
                      <ProcedureCard procedure={p} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
