import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: {
  steps: { title: string }[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Étapes du dossier" className={className}>
      <p className="mb-2 text-sm font-semibold text-brand-ink-2 sm:hidden">
        Étape {currentStep + 1} sur {steps.length} : {steps[currentStep]?.title}
      </p>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const content = (
            <>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-colors duration-200",
                  done && "bg-brand-royal text-white",
                  active && "bg-brand-yellow text-brand-ink",
                  !done && !active && "bg-brand-mist text-brand-ink-2",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={cn("hidden text-[0.9375rem] font-semibold sm:inline", active ? "text-brand-ink" : "text-brand-ink-2")}>{s.title}</span>
              <span className="sr-only">{done ? " (terminée)" : active ? " (étape en cours)" : ""}</span>
            </>
          );
          return (
            <li key={s.title} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              {onStepClick && (done || active) ? (
                <button type="button" onClick={() => onStepClick(i)} className="flex min-h-11 items-center gap-2 rounded-lg">
                  {content}
                </button>
              ) : (
                <span className="flex min-h-11 items-center gap-2">{content}</span>
              )}
              {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full", done ? "bg-brand-royal" : "bg-brand-line")} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
