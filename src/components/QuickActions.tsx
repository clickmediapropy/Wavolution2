import { Link } from "react-router-dom";
import { Send, Users, Megaphone, Upload, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const ACTIONS = [
  {
    to: "/send",
    label: "Send Message",
    description: "Send a single message",
    icon: Send,
    color: "emerald",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/40",
  },
  {
    to: "/campaigns/new",
    label: "New Campaign",
    description: "Launch bulk messaging",
    icon: Megaphone,
    color: "blue",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    hoverBorder: "group-hover:border-blue-500/40",
  },
  {
    to: "/contacts",
    label: "Manage Contacts",
    description: "View and edit contacts",
    icon: Users,
    color: "violet",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/20",
    hoverBorder: "group-hover:border-violet-500/40",
  },
  {
    to: "/contacts/upload",
    label: "Import CSV",
    description: "Bulk import contacts",
    icon: Upload,
    color: "amber",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    hoverBorder: "group-hover:border-amber-500/40",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export function QuickActions() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-h3 text-zinc-100">Quick Actions</h2>
          <p className="text-small text-zinc-500 mt-0.5">Common tasks at your fingertips</p>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.to} variants={itemVariants}>
              <Link
                to={action.to}
                className={`group block p-4 rounded-xl border ${action.borderColor} ${action.hoverBorder} bg-zinc-800/30 hover:bg-zinc-800/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${action.textColor}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                
                <h3 className={`font-semibold text-sm ${action.textColor} mb-0.5`}>
                  {action.label}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-1">
                  {action.description}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
