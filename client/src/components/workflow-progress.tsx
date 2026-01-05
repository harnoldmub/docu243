import { Check, Circle, CreditCard, FileSearch, FileSignature, Package, Truck } from "lucide-react";

type WorkflowStep = "pending" | "payment" | "processing" | "signature" | "ready" | "delivered";

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  isRejected?: boolean;
}

const steps: { key: WorkflowStep; label: string; icon: typeof Circle }[] = [
  { key: "pending", label: "Demande", icon: Circle },
  { key: "payment", label: "Paiement", icon: CreditCard },
  { key: "processing", label: "Instruction", icon: FileSearch },
  { key: "signature", label: "Signature", icon: FileSignature },
  { key: "ready", label: "Prêt", icon: Package },
  { key: "delivered", label: "Livré", icon: Truck },
];

const stepOrder: Record<WorkflowStep, number> = {
  pending: 0,
  payment: 1,
  processing: 2,
  signature: 3,
  ready: 4,
  delivered: 5,
};

export function WorkflowProgress({ currentStep, isRejected = false }: WorkflowProgressProps) {
  const currentIndex = stepOrder[currentStep];

  return (
    <div className="w-full" data-testid="workflow-progress">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isRejected && isCurrent
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : isCompleted
                      ? "border-success bg-success text-success-foreground"
                      : isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-muted text-muted-foreground"
                  }`}
                  data-testid={`step-${step.key}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isRejected && isCurrent
                      ? "text-destructive"
                      : isCompleted || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    index < currentIndex
                      ? "bg-success"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkflowProgressCompact({ currentStep, isRejected = false }: WorkflowProgressProps) {
  const currentIndex = stepOrder[currentStep];
  const totalSteps = steps.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2" data-testid="workflow-progress-compact">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {steps[currentIndex]?.label || "En attente"}
        </span>
        <span className="text-muted-foreground">
          {currentIndex + 1}/{totalSteps}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-500 ${
            isRejected ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
