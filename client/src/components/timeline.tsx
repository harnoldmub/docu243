import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    FileText,
    User,
    CreditCard,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
    id: string;
    action: string;
    actorId?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string | Date;
}

interface TimelineProps {
    events: TimelineEvent[];
    citizenId?: string;
    currentUserId?: string;
    className?: string;
}

const actionConfig: Record<string, {
    label: string;
    icon: any;
    color: string;
    description: (oldV?: string, newV?: string) => string;
}> = {
    creation: {
        label: "Dossier créé",
        icon: FileText,
        color: "bg-slate-100 text-slate-600",
        description: () => "Le dossier a été initialisé en tant que brouillon.",
    },
    status_update: {
        label: "Changement de statut",
        icon: CheckCircle2,
        color: "bg-primary/10 text-primary",
        description: (oldV, newV) => `Passage du statut ${oldV || "inconnu"} à ${newV || "inconnu"}.`,
    },
    submission: {
        label: "Dossier soumis",
        icon: Send,
        color: "bg-blue-100 text-blue-600",
        description: () => "Le dossier a été envoyé pour examen aux autorités.",
    },
    payment: {
        label: "Paiement reçu",
        icon: CreditCard,
        color: "bg-emerald-100 text-emerald-600",
        description: () => "Les frais administratifs ont été acquittés avec succès.",
    },
    correction_requested: {
        label: "Correction demandée",
        icon: AlertCircle,
        color: "bg-amber-100 text-amber-600",
        description: () => "Un agent a demandé des corrections sur certains documents.",
    },
    admin_status_update: {
        label: "Décision agent",
        icon: CheckCircle2,
        color: "bg-indigo-100 text-indigo-700",
        description: (_oldV, newV) => `Le gestionnaire a fait passer le dossier au statut ${newV || "inconnu"}.`,
    },
    document_validation: {
        label: "Contrôle de pièce",
        icon: FileText,
        color: "bg-emerald-100 text-emerald-700",
        description: (_oldV, newV) => `Une pièce justificative a été traitée avec le statut ${newV || "inconnu"}.`,
    },
    document_upload: {
        label: "Document transmis",
        icon: FileText,
        color: "bg-blue-100 text-blue-600",
        description: (_oldV, newV) => `Le document ${newV || "joint"} a été ajouté au dossier.`,
    },
};

const adminActions = new Set(["admin_status_update", "document_validation", "correction_requested"]);

function getActorLabel(event: TimelineEvent, citizenId?: string, currentUserId?: string) {
    if (!event.actorId) {
        return null;
    }

    if (event.actorId === currentUserId) {
        return "Par vous";
    }

    if (citizenId && event.actorId === citizenId) {
        return "Par le citoyen";
    }

    if (adminActions.has(event.action)) {
        return "Par un agent administratif";
    }

    return "Par un utilisateur";
}

export function Timeline({ events, citizenId, currentUserId, className }: TimelineProps) {
    // Sort events by date descending
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className={cn("space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200", className)}>
            {sortedEvents.map((event, index) => {
                const config = actionConfig[event.action] || {
                    label: event.action,
                    icon: Circle,
                    color: "bg-slate-50 text-slate-400",
                    description: () => `Action : ${event.action}`,
                };
                const Icon = config.icon;
                const actorLabel = getActorLabel(event, citizenId, currentUserId);

                return (
                    <div key={event.id} className="relative pl-10 group">
                        {/* Dot */}
                        <div
                            className={cn(
                                "absolute left-0 top-1 z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110",
                                config.color
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-bold text-slate-900">{config.label}</span>
                                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                    {format(new Date(event.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {config.description(event.oldValue, event.newValue)}
                            </p>
                            {actorLabel && (
                                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 font-medium">
                                    <User className="h-3 w-3" /> {actorLabel}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {sortedEvents.length === 0 && (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Aucun historique disponible</p>
                </div>
            )}
        </div>
    );
}
