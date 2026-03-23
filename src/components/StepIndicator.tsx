import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Setup progress" className="w-full mb-8">
      <ol className="flex items-start justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-800 -z-10" />

        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 -z-10"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={step.label}
              className="flex flex-col items-center flex-1"
              {...(isCurrent ? { "aria-current": "step" as const } : {})}
            >
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted || isCurrent ? "#10b981" : "#3f3f46",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shadow-lg ${
                    isCompleted || isCurrent
                      ? "text-white shadow-emerald-500/25"
                      : "text-zinc-400 shadow-black/20"
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-4 h-4" aria-label="Completed" />
                    </motion.div>
                  ) : (
                    <span className={!isCompleted && !isCurrent ? "text-zinc-500" : ""}>
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {isCurrent && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-emerald-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-emerald-500"
                    />
                  </>
                )}
              </div>

              <motion.span
                initial={false}
                animate={{
                  color: isCurrent ? "#f4f4f5" : isCompleted ? "#34d399" : "#71717a",
                }}
                className={`mt-3 text-xs font-medium whitespace-nowrap ${
                  isCurrent ? "font-semibold" : ""
                }`}
              >
                {step.label}
              </motion.span>

              {step.description && (
                <span className="mt-1 text-[10px] text-zinc-500 whitespace-nowrap hidden sm:block">
                  {step.description}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
