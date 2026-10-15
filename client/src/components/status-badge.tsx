import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileCheck2,
  FilePen,
  Inbox,
  PackageCheck,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-[var(--st-neutral-bg)] text-[var(--st-neutral)]",
  info: "bg-[var(--st-info-bg)] text-[var(--st-info)]",
  warning: "bg-[var(--st-warning-bg)] text-[var(--st-warning)]",
  success: "bg-[var(--st-success-bg)] text-[var(--st-success)]",
  danger: "bg-[var(--st-danger-bg)] text-[var(--st-danger)]",
};

type StatusInfo = { label: string; icon: LucideIcon; tone: Tone; next: string; group: "action" | "progress" | "done" };

export const APPLICATION_STATUS: Record<string, StatusInfo> = {
  draft: {
    label: "Brouillon",
    icon: FilePen,
    tone: "neutral",
    group: "action",
    next: "Complétez les informations et les pièces, puis réglez en ligne pour transmettre votre dossier.",
  },
  submitted: {
    label: "Transmis",
    icon: Inbox,
    tone: "info",
    group: "progress",
    next: "Paiement reçu. Votre dossier attend la prise en charge par notre équipe ; vous pouvez encore le retirer pour le modifier.",
  },
  received: {
    label: "Déposé à l'administration",
    icon: Inbox,
    tone: "info",
    group: "progress",
    next: "Notre équipe a déposé votre dossier auprès de l'administration. Aucune action de votre part pour le moment.",
  },
  under_review: {
    label: "En cours de traitement",
    icon: Search,
    tone: "info",
    group: "progress",
    next: "Notre équipe effectue la démarche auprès de l'administration. Aucune action de votre part pour le moment.",
  },
  pending_user_action: {
    label: "Correction demandée",
    icon: AlertTriangle,
    tone: "warning",
    group: "action",
    next: "Corrigez les éléments demandés par notre équipe, puis transmettez de nouveau votre dossier. Aucun nouveau paiement n'est demandé.",
  },
  pending_payment: {
    label: "Paiement requis",
    icon: Wallet,
    tone: "warning",
    group: "action",
    next: "Un paiement complémentaire est nécessaire. Suivez les instructions de notre équipe dans le message ci-dessous.",
  },
  approved: {
    label: "Approuvé",
    icon: FileCheck2,
    tone: "success",
    group: "progress",
    next: "L'administration a validé votre demande. Le document est en préparation.",
  },
  rejected: {
    label: "Refusé",
    icon: XCircle,
    tone: "danger",
    group: "done",
    next: "La demande a été refusée. Consultez le message de notre équipe ci-dessous.",
  },
  ready: {
    label: "Prêt à retirer",
    icon: PackageCheck,
    tone: "success",
    group: "action",
    next: "Votre document est prêt. Notre équipe vous indique comment le récupérer.",
  },
  delivered: {
    label: "Délivré",
    icon: CheckCircle2,
    tone: "success",
    group: "done",
    next: "Le document vous a été remis. Ce dossier est terminé.",
  },
};

export function statusInfo(status: string): StatusInfo {
  return APPLICATION_STATUS[status] ?? { label: status, icon: CircleDashed, tone: "neutral", group: "progress", next: "" };
}

export function Pill({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold leading-none",
        toneClass[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; size?: "sm" | "default"; className?: string }) {
  const info = statusInfo(status);
  return (
    <Pill tone={info.tone} icon={info.icon} className={className}>
      <span data-testid={`status-badge-${status}`}>{info.label}</span>
    </Pill>
  );
}

const DOC_STATUS: Record<string, { label: string; tone: Tone; icon: LucideIcon }> = {
  submitted: { label: "Envoyée", tone: "info", icon: Clock3 },
  approved: { label: "Validée", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Refusée", tone: "danger", icon: XCircle },
  replacement_requested: { label: "À remplacer", tone: "warning", icon: RotateCcw },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const c = DOC_STATUS[status] ?? DOC_STATUS.submitted;
  return (
    <Pill tone={c.tone} icon={c.icon}>
      {c.label}
    </Pill>
  );
}
