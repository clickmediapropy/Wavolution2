import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Link } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, Wifi, Send, Upload } from "lucide-react";

export function DashboardPage() {
  const user = useQuery(api.users.currentUser);
  const contactCount = useQuery(api.contacts.count);
  const messageCount = useQuery(api.messages.count);
  const connected = user?.whatsappConnected ?? false;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* WhatsApp Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-zinc-500">WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500 animate-pulse-dot"}`}
            />
            <span className="text-lg font-semibold text-zinc-100">
              {connected ? "Connected" : "Not Connected"}
            </span>
          </div>
        </div>

        {/* Total Contacts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-zinc-500">Total Contacts</span>
          </div>
          <span className="text-3xl font-bold text-zinc-100">
            {contactCount ?? "..."}
          </span>
        </div>

        {/* Messages Sent */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm text-zinc-500">Messages Sent</span>
          </div>
          <span className="text-3xl font-bold text-zinc-100">
            {messageCount ?? "..."}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-zinc-500">Quick Actions</span>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/send"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              Send Message
            </Link>
            <Link
              to="/contacts/upload"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Contacts
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-400">
          Welcome to Message Hub. Manage contacts, send messages, and track
          campaigns from your dashboard.
        </p>
      </div>
    </div>
  );
}
