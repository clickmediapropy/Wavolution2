import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="animate-fadeIn text-center py-20">
      <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-zinc-100 mb-2">404</h1>
      <p className="text-lg text-zinc-400 mb-8">
        This page doesn&apos;t exist. It may have been moved or deleted.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
      >
        <Home className="w-4 h-4" />
        Go Home
      </Link>
    </div>
  );
}
