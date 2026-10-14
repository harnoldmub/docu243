import { Link } from "wouter";
import { ArrowRight, CircleDashed, ExternalLink, Info, MonitorCheck } from "lucide-react";
import { availability, delayLabel, feeLabel, type AvailabilityKey, type ProcedureWithGuide } from "@/lib/procedures";
import { cn } from "@/lib/utils";

const availabilityStyle: Record<AvailabilityKey, { className: string; icon: typeof Info }> = {
  online: { className: "bg-brand-sky text-brand-deep", icon: MonitorCheck },
  external: { className: "bg-brand-yellow-soft text-[#5c4300]", icon: ExternalLink },
  info: { className: "bg-[var(--st-neutral-bg)] text-[var(--st-neutral)]", icon: Info },
  soon: { className: "border border-dashed border-[#9aa6bd] bg-white text-[var(--st-neutral)]", icon: CircleDashed },
};

export function AvailabilityBadge({ procedure, className }: { procedure: Pick<ProcedureWithGuide, "status" | "channel">; className?: string }) {
  const a = availability(procedure);
  const style = availabilityStyle[a.key];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold leading-none",
        style.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {a.label}
    </span>
  );
}

export function ProcedureCard({ procedure, headingLevel = 3 }: { procedure: ProcedureWithGuide; headingLevel?: 2 | 3 }) {
  const fee = feeLabel(procedure);
  const a = availability(procedure);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const cta = a.key === "online" ? "Voir la démarche" : a.key === "external" ? "Préparer ma démarche" : "Voir les informations";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-brand-line bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-royal/40 hover:shadow-raised focus-within:border-brand-royal sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-brand-ink-2">{procedure.category}</span>
        <AvailabilityBadge procedure={procedure} />
      </div>
      <Heading className="title-3 text-brand-ink">
        <Link
          href={`/procedure/${procedure.slug}`}
          className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline focus-visible:after:outline-[3px] focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--focus)]"
        >
          {procedure.title}
        </Link>
      </Heading>
      <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-brand-ink-2">{procedure.description}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-brand-line pt-4 text-sm">
        <div className="col-span-2">
          <dt className="text-brand-ink-2">Institution</dt>
          <dd className="font-semibold text-brand-ink">{procedure.institution}</dd>
        </div>
        <div>
          <dt className="text-brand-ink-2">Frais</dt>
          <dd className="font-semibold text-brand-ink">
            {fee.label}
            {fee.hint && <span className="block text-xs font-normal text-brand-ink-2">{fee.hint}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-brand-ink-2">Délai estimé</dt>
          <dd className="font-semibold text-brand-ink">{delayLabel(procedure)}</dd>
        </div>
      </dl>

      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-brand-royal" aria-hidden="true">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </article>
  );
}

export function ProcedureCardSkeleton() {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-6" aria-hidden="true">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-4 h-6 w-3/4" />
      <div className="skeleton mt-3 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-2/3" />
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-brand-line pt-4">
        <div className="skeleton h-9" />
        <div className="skeleton h-9" />
      </div>
    </div>
  );
}
