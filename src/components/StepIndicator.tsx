import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: { label: string }[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Setup progress" className="mb-6">
      <ol className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={step.label}
              className="flex items-center"
              {...(isCurrent ? { "aria-current": "step" as const } : {})}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" aria-label="Completed" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs whitespace-nowrap ${
                    isCurrent
                      ? "text-zinc-100 font-bold"
                      : isCompleted
                        ? "text-emerald-400 font-medium"
                        : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 mb-5 ${
                    index < currentStep ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
