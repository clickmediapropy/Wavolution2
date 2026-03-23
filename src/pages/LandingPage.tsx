import { Link } from "react-router-dom";
import { MessageSquare, Send, Users, Megaphone, ArrowRight } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: <Users className="w-6 h-6 text-blue-400" />,
    title: "Contact Management",
    description: "Import CSV files, organize contacts, and track message delivery status.",
  },
  {
    icon: <Send className="w-6 h-6 text-emerald-400" />,
    title: "Direct Messaging",
    description: "Send individual WhatsApp messages with media attachments and previews.",
  },
  {
    icon: <Megaphone className="w-6 h-6 text-violet-400" />,
    title: "Bulk Campaigns",
    description: "Create targeted campaigns with templates, delays, and live progress tracking.",
  },
];

export function LandingPage() {
  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div className="text-center py-16 sm:py-24">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4 tracking-tight">
          WhatsApp Messaging
          <br />
          <span className="text-emerald-400">at Scale</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
          Manage contacts, send personalized messages, and run bulk campaigns
          — all from one dashboard.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pb-16">
        {VALUE_PROPS.map((prop) => (
          <div
            key={prop.title}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              {prop.icon}
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">
              {prop.title}
            </h3>
            <p className="text-xs text-zinc-500">{prop.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
