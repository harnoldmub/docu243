import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
    steps: {
        title: string;
        description?: string;
    }[];
    currentStep: number;
    className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="flex justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center flex-1 relative">
                            {/* Line between steps */}
                            {index !== 0 && (
                                <div
                                    className={cn(
                                        "absolute top-5 -left-1/2 w-full h-[2px] -translate-y-1/2 transition-colors duration-500",
                                        isCompleted ? "bg-primary" : "bg-slate-200"
                                    )}
                                />
                            )}

                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 text-sm font-bold",
                                    isCompleted
                                        ? "bg-primary border-primary text-white"
                                        : isActive
                                            ? "bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)]"
                                            : "bg-white border-slate-200 text-slate-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5 stroke-[3]" />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>

                            {/* Labels */}
                            <div className="mt-3 text-center px-2">
                                <div
                                    className={cn(
                                        "text-xs font-bold uppercase tracking-wider transition-colors duration-500",
                                        isActive ? "text-slate-900" : isCompleted ? "text-primary" : "text-slate-400"
                                    )}
                                >
                                    {step.title}
                                </div>
                                {step.description && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 hidden md:block">
                                        {step.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
