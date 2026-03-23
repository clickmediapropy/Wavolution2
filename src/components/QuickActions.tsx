import { Link } from "react-router-dom";
import { Send, Users, Megaphone, Upload } from "lucide-react";

const ACTIONS = [
  {
    to: "/send",
    label: "Send Message",
    icon: <Send className="w-4 h-4" />,
    color: "text-emerald-400 hover:text-emerald-300",
  },
  {
    to: "/campaigns/new",
    label: "New Campaign",
    icon: <Megaphone className="w-4 h-4" />,
    color: "text-blue-400 hover:text-blue-300",
  },
  {
    to: "/contacts",
    label: "Manage Contacts",
    icon: <Users className="w-4 h-4" />,
    color: "text-violet-400 hover:text-violet-300",
  },
  {
    to: "/contacts/upload",
    label: "Import CSV",
    icon: <Upload className="w-4 h-4" />,
    color: "text-amber-400 hover:text-amber-300",
  },
];

export function QuickActions() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-sm font-medium text-zinc-300 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-medium transition-colors hover:border-zinc-600 ${action.color}`}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
