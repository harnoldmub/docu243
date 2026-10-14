import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle, FilePlus2, FileText, RotateCcw, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { statusInfo } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  action: string;
  actorId?: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string | Date;
}

const DOC_LABEL: Record<string, string> = {
  approved: "validée",
  rejected: "refusée",
  replacement_requested: "à remplacer",
  submitted: "envoyée",
};

const config: Record<string, { label: string; icon: LucideIcon; describe: (e: TimelineEvent) => string }> = {
  creation: { label: "Dossier créé", icon: FilePlus2, describe: () => "Le dossier a été enregistré comme brouillon." },
  submission: { label: "Dossier transmis", icon: Send, describe: () => "Le dossier a été envoyé pour traitement." },
  retraction: { label: "Dossier retiré", icon: RotateCcw, describe: () => "Le dossier est repassé en brouillon pour être modifié." },
  status_update: {
    label: "Statut mis à jour",
    icon: CheckCircle2,
    describe: (e) => `Nouveau statut : ${statusInfo(e.newValue ?? "").label}.`,
  },
  admin_status_update: {
    label: "Décision d'un agent",
    icon: ShieldCheck,
    describe: (e) => `Nouveau statut : ${statusInfo(e.newValue ?? "").label}.`,
  },
  document_upload: { label: "Pièce envoyée", icon: FileText, describe: (e) => `Fichier « ${e.newValue ?? "document"} » ajouté au dossier.` },
  document_validation: {
    label: "Contrôle d'une pièce",
    icon: ShieldCheck,
    describe: (e) => `Pièce ${DOC_LABEL[e.newValue ?? ""] ?? "traitée"}.`,
  },
};

export function Timeline({ events, citizenId, currentUserId, className }: { events: TimelineEvent[]; citizenId?: string; currentUserId?: string; className?: string }) {
  const sorted = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (!sorted.length) return <p className="text-[0.9375rem] text-brand-ink-2">Aucun événement pour le moment.</p>;

  return (
    <ol className={cn("relative space-y-6 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-0.5 before:bg-brand-line", className)}>
      {sorted.map((e, i) => {
        const c = config[e.action] ?? { label: "Mise à jour", icon: Circle, describe: () => "" };
        const actor = !e.actorId ? null : e.actorId === currentUserId ? "Par vous" : e.actorId === citizenId ? "Par le demandeur" : "Par un agent";
        return (
          <li key={e.id} className="relative pl-11">
            <span
              className={cn(
                "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white",
                i === 0 ? "bg-brand-royal text-white" : "bg-brand-sky text-brand-royal",
              )}
              aria-hidden="true"
            >
              <c.icon className="h-4 w-4" />
            </span>
            <p className="font-semibold text-brand-ink">{c.label}</p>
            <p className="text-[0.9375rem] text-brand-ink-2">{c.describe(e)}</p>
            <p className="mt-1 text-sm text-brand-ink-2">
              <time dateTime={new Date(e.createdAt).toISOString()}>{format(new Date(e.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</time>
              {actor && ` · ${actor}`}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
