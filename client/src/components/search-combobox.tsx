import { useId, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcedures } from "@/hooks/use-procedures";
import { availability, searchProcedures } from "@/lib/procedures";
import { cn } from "@/lib/utils";

/** Search field with suggestions taken from the live catalogue. */
export function SearchCombobox({ id, className, label = "Quelle démarche souhaitez-vous effectuer ?" }: { id?: string; className?: string; label?: string }) {
  const autoId = useId();
  const inputId = id ?? `search-${autoId}`;
  const listId = `${inputId}-list`;
  const [, setLocation] = useLocation();
  const { data: procedures = [] } = useProcedures();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<number>();

  const suggestions = useMemo(() => {
    const list = query.trim()
      ? searchProcedures(procedures, query)
      : procedures.filter((p) => p.isPriority).sort((a, b) => a.sortOrder - b.sortOrder);
    return list.slice(0, 6);
  }, [procedures, query]);

  const go = (slug?: string) => {
    setOpen(false);
    if (slug) setLocation(`/procedure/${slug}`);
    else setLocation(query.trim() ? `/catalogue?q=${encodeURIComponent(query.trim())}` : "/catalogue");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter" && open && active >= 0 && suggestions[active]) {
      e.preventDefault();
      go(suggestions[active].slug);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <label htmlFor={inputId} className="mb-2.5 block font-display text-lg font-bold text-brand-ink">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink-2" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder="Ex. numéro d'impôt, acte de naissance…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            className="field-input h-14 pl-12 pr-4 text-[1.0625rem] shadow-card"
          />
        </div>
        <Button type="submit" size="xl" className="sm:w-auto">
          Rechercher
        </Button>
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={query.trim() ? "Démarches correspondantes" : "Démarches courantes"}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(60vh,420px)] overflow-auto rounded-2xl border border-brand-line bg-white p-1.5 shadow-float"
          onMouseDown={() => window.clearTimeout(blurTimer.current)}
        >
          {!query.trim() && <li className="px-3 pb-1 pt-2 text-sm font-semibold text-brand-ink-2" role="presentation">Démarches courantes</li>}
          {suggestions.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(p.slug)}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                i === active && "bg-brand-sky",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-brand-ink">{p.title}</span>
                <span className="block truncate text-sm text-brand-ink-2">
                  {p.institution} · {availability(p).label}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-brand-royal" aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
