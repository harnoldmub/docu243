import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  Loader2,
  FileCheck,
  Truck,
  FileText,
  Search,
  UserCheck,
  RotateCcw
} from "lucide-react";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "received"
  | "under_review"
  | "pending_user_action"
  | "pending_payment"
  | "approved"
  | "rejected"
  | "ready"
  | "delivered";

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "sm" | "default";
}

const statusConfig: Record<ApplicationStatus, {
  label: string;
  icon: any;
  className: string;
}> = {
  draft: {
    label: "Brouillon",
    icon: FileText,
    className: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  },
  submitted: {
    label: "Soumis",
    icon: Clock,
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  received: {
    label: "Reçu",
    icon: CheckCircle,
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  under_review: {
    label: "En examen",
    icon: Search,
    className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  },
  pending_user_action: {
    label: "Action requise",
    icon: AlertCircle,
    className: "bg-amber-100 text-amber-700 animate-pulse hover:bg-amber-100",
  },
  pending_payment: {
    label: "Paiement requis",
    icon: CreditCard,
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  approved: {
    label: "Approuvé",
    icon: UserCheck,
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  rejected: {
    label: "Rejeté",
    icon: XCircle,
    className: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  },
  ready: {
    label: "Prêt",
    icon: CheckCircle,
    className: "bg-emerald-500 text-white hover:bg-emerald-500",
  },
  delivered: {
    label: "Délivré",
    icon: Truck,
    className: "bg-slate-800 text-white hover:bg-slate-800",
  },
};

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, icon: Clock, className: "" };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} border-none font-medium gap-1.5 ${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5"}`}
      data-testid={`status-badge-${status}`}
    >
      <Icon className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${["under_review", "submitted"].includes(status) ? "animate-pulse" : ""}`} />
      {config.label}
    </Badge>
  );
}

export function DocumentStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: any }> = {
    submitted: {
      label: "Soumis",
      className: "bg-blue-50 text-blue-600 border-blue-100",
      icon: Clock,
    },
    approved: {
      label: "Validé",
      className: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: CheckCircle,
    },
    rejected: {
      label: "Rejeté",
      className: "bg-rose-50 text-rose-600 border-rose-100",
      icon: XCircle,
    },
    replacement_requested: {
      label: "À remplacer",
      className: "bg-amber-50 text-amber-600 border-amber-100",
      icon: RotateCcw,
    },
  };

  const config = configs[status] || configs.submitted;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} gap-1 font-normal text-[10px] px-1.5 py-0`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: any }> = {
    pending: {
      label: "En attente",
      className: "bg-amber-50 text-amber-600 border-amber-100",
      icon: Loader2,
    },
    succeeded: {
      label: "Payé",
      className: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: CheckCircle,
    },
    failed: {
      label: "Échec",
      className: "bg-rose-50 text-rose-600 border-rose-100",
      icon: AlertCircle,
    },
    refunded: {
      label: "Remboursé",
      className: "bg-slate-50 text-slate-600 border-slate-100",
      icon: RotateCcw,
    },
  };

  const config = configs[status] || { label: status, className: "", icon: Clock };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} gap-1.5 text-xs font-medium`}>
      <Icon className={`h-3.5 w-3.5 ${status === "pending" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}
