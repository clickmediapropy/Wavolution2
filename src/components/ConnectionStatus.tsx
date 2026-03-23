import { Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

interface ConnectionStatusProps {
  connected: boolean;
  href?: string;
}

export function ConnectionStatus({ connected, href }: ConnectionStatusProps) {
  const card = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:border-zinc-700">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            connected ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}
        >
          {connected ? (
            <Wifi className="w-5 h-5 text-emerald-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
        </div>
        <span className="text-sm text-zinc-500">WhatsApp</span>
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        )}
        <span className="text-lg font-semibold text-zinc-100">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{card}</Link>;
  }
  return card;
}
