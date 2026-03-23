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
        {/* Background connector line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-800 -z-10" />
        
        {/* Active connector line */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 -z-10"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <li
              key={step.label}
              className="flex flex-col items-center flex-1"
              {...(isCurrent ? { "aria-current": "step" as const } : {})}
            >
              {/* Step circle */}
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
                    <span className={isUpcoming ? "text-zinc-500" : ""}>
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {/* Pulse animation for current step */}
                {isCurrent && (
                  <>
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full bg-emerald-500"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3,
                      }}
                      className="absolute inset-0 rounded-full bg-emerald-500"
                    />
                  </>
                )}
              </div>

              {/* Step label */}
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

              {/* Step description */}
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

// Compact variant for smaller spaces
export function StepIndicatorCompact({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted || isCurrent ? "#10b981" : "#3f3f46",
                scale: isCurrent ? 1.1 : 1,
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted || isCurrent ? "text-white" : "text-zinc-500"
              }`}
            >
              {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
            </motion.div>
            {index < steps.length - 1 && (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? "#10b981" : "#3f3f46",
                }}
                className="w-8 h-0.5 mx-1"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Vertical variant for sidebars
export function StepIndicatorVertical({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Setup progress" className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={step.label}
            className="flex gap-4"
            {...(isCurrent ? { "aria-current": "step" as const } : {})}
          >
            {/* Step indicator line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isCurrent ? "#10b981" : "#3f3f46",
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted || isCurrent ? "text-white" : "text-zinc-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? "#10b981" : "#3f3f46",
                  }}
                  className="w-0.5 flex-1 my-2"
                />
              )}
            </div>

            {/* Step content */}
            <div className="pb-8">
              <span className={`text-sm font-medium ${
                isCurrent ? "text-zinc-100" : isCompleted ? "text-emerald-400" : "text-zinc-500"
              }`}>
                {step.label}
              </span>
              {step.description && (
                <p className="text-xs text-zinc-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
