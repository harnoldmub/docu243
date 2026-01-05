import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  CreditCard,
  Loader2,
  FileCheck,
  Truck
} from "lucide-react";

type Status = "pending" | "payment" | "processing" | "signature" | "ready" | "delivered" | "rejected";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "default";
}

const statusConfig: Record<Status, { 
  label: string; 
  icon: typeof Clock;
  className: string;
}> = {
  pending: {
    label: "En attente",
    icon: Clock,
    className: "bg-warning text-warning-foreground",
  },
  payment: {
    label: "Paiement",
    icon: CreditCard,
    className: "bg-warning text-warning-foreground",
  },
  processing: {
    label: "En cours",
    icon: Loader2,
    className: "bg-primary text-primary-foreground",
  },
  signature: {
    label: "Signature",
    icon: FileCheck,
    className: "bg-primary text-primary-foreground",
  },
  ready: {
    label: "Prêt",
    icon: CheckCircle,
    className: "bg-success text-success-foreground",
  },
  delivered: {
    label: "Livré",
    icon: Truck,
    className: "bg-success text-success-foreground",
  },
  rejected: {
    label: "Rejeté",
    icon: XCircle,
    className: "bg-destructive text-destructive-foreground",
  },
};

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      className={`${config.className} gap-1.5 ${size === "sm" ? "text-xs" : ""}`}
      data-testid={`status-badge-${status}`}
    >
      <Icon className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${status === "processing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    unpaid: {
      label: "Non payé",
      className: "bg-muted text-muted-foreground",
      icon: Clock,
    },
    pending: {
      label: "En attente",
      className: "bg-warning text-warning-foreground",
      icon: Loader2,
    },
    paid: {
      label: "Payé",
      className: "bg-success text-success-foreground",
      icon: CheckCircle,
    },
    failed: {
      label: "Échec",
      className: "bg-destructive text-destructive-foreground",
      icon: AlertCircle,
    },
  };

  const config = configs[status] || configs.unpaid;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1.5`} data-testid={`payment-status-${status}`}>
      <Icon className={`h-3.5 w-3.5 ${status === "pending" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}
