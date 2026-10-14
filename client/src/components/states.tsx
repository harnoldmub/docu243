import type { ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Le chargement a échoué",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("rounded-2xl border border-[var(--st-danger)]/25 bg-[var(--st-danger-bg)] p-6", className)}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--st-danger)]" aria-hidden="true" />
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-brand-ink">{title}</p>
            {message && <p className="mt-1 text-[0.9375rem] text-brand-ink-2">{message}</p>}
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw aria-hidden="true" /> Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-[#b9c3d6] bg-white px-6 py-12 text-center", className)}>
      {icon && <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mist text-brand-royal">{icon}</div>}
      <p className="title-3 text-brand-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-[0.9375rem] text-brand-ink-2">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  icon,
  className,
}: {
  tone?: "info" | "warning" | "success" | "danger" | "neutral";
  title?: string;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-[var(--st-info-bg)] border-[var(--st-info)]/20",
    warning: "bg-[var(--st-warning-bg)] border-[var(--st-warning)]/25",
    success: "bg-[var(--st-success-bg)] border-[var(--st-success)]/25",
    danger: "bg-[var(--st-danger-bg)] border-[var(--st-danger)]/25",
    neutral: "bg-brand-mist border-brand-line",
  };
  const iconColor = {
    info: "text-[var(--st-info)]",
    warning: "text-[var(--st-warning)]",
    success: "text-[var(--st-success)]",
    danger: "text-[var(--st-danger)]",
    neutral: "text-brand-ink-2",
  };
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", tones[tone], className)}>
      {icon && <span className={cn("mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5", iconColor[tone])} aria-hidden="true">{icon}</span>}
      <div className="min-w-0 text-[0.9375rem] leading-relaxed text-brand-ink">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1", "text-brand-ink/85")}>{children}</div>}
      </div>
    </div>
  );
}
