import { Link } from "react-router-dom";
import { MessageSquare, Send, Users, Megaphone, ArrowRight, Zap } from "lucide-react";

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

        <aside className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-800/50 text-sm text-zinc-300">
          <Zap className="w-4 h-4 text-emerald-400" />
          Now with WhatsApp Business API
        </aside>

        <h1
          className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
          style={{
            background: "linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          WhatsApp Messaging
          <br />
          at Scale
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

        {/* Dashboard mockup with glow */}
        <div className="relative mt-16 max-w-4xl mx-auto">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-emerald-500/20 blur-3xl rounded-full scale-75"
          />
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            {/* Fake stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-3">
                  <div className="h-2 w-12 bg-zinc-700 rounded mb-2" />
                  <div className="h-4 w-8 bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
            {/* Fake table rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2 border-t border-zinc-800">
                <div className="h-3 w-3 bg-zinc-700 rounded-full" />
                <div className="h-3 w-24 bg-zinc-700 rounded" />
                <div className="h-3 w-32 bg-zinc-700 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 mb-16">
        {[
          { icon: <Send className="w-5 h-5" />, label: "Bulk Messaging" },
          { icon: <Users className="w-5 h-5" />, label: "CSV Import" },
          { icon: <Megaphone className="w-5 h-5" />, label: "Campaign Tracking" },
          { icon: <MessageSquare className="w-5 h-5" />, label: "WhatsApp API" },
        ].map((feat) => (
          <div
            key={feat.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center"
          >
            <div className="text-emerald-400">{feat.icon}</div>
            <span className="text-xs font-medium text-zinc-400">{feat.label}</span>
          </div>
        ))}
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
