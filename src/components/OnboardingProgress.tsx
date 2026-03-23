import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import { Check, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { staggerItemVariants } from "@/lib/transitions";

interface Step {
  label: string;
  description: string;
  completed: boolean;
  href: string;
}

export function OnboardingProgress(): ReactNode {
  const instanceCounts = useQuery(api.instances.count);
  const contactCount = useQuery(api.contacts.count);
  const campaigns = useQuery(api.campaigns.listByUser);
  const instances = useQuery(api.instances.list);

  if (
    instanceCounts === undefined ||
    contactCount === undefined ||
    campaigns === undefined ||
    instances === undefined
  ) {
    return null;
  }

  const steps: Step[] = [
    {
      label: "Connect WhatsApp",
      description: "Create your first WhatsApp instance",
      completed: instanceCounts.total > 0,
      href: "/whatsapp",
    },
    {
      label: "Add a contact",
      description: "Import or create your first contact",
      completed: contactCount > 0,
      href: "/contacts",
    },
    {
      label: "Send a campaign",
      description: "Launch your first messaging campaign",
      completed: campaigns.some(
        (c) => c.status === "completed" || c.status === "running" || c.status === "paused",
      ),
      href: "/campaigns",
    },
    {
      label: "Configure a bot",
      description: "Enable auto-reply on an instance",
      completed: instances.some((i) => i.botEnabled === true),
      href: "/whatsapp",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  if (completedCount === steps.length) {
    return null;
  }

  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <motion.div
      variants={staggerItemVariants}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Rocket className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-zinc-100">Get started</h3>
          <p className="text-small text-zinc-500">
            Complete these steps to unlock the full platform
          </p>
        </div>
        <span className="text-sm font-medium text-zinc-400">
          {completedCount}/{steps.length}
        </span>
      </div>

      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => (
          <Link
            key={step.label}
            to={step.href}
            className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${
              step.completed
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-zinc-800/30 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div
              className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed
                  ? "bg-emerald-500 text-white"
                  : "border-2 border-zinc-600 text-zinc-600 group-hover:border-zinc-500"
              }`}
            >
              {step.completed && <Check className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.completed ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
