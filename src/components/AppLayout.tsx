import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { MessageSquare, LogOut } from "lucide-react";
import { Toaster } from "sonner";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 text-xl font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span>Message Hub</span>
            </Link>

            {isAuthenticated && (
              <div className="flex items-center gap-1">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors",
                      isActive
                        ? "text-emerald-400 font-medium bg-emerald-500/10"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
                    )
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/contacts"
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors",
                      isActive
                        ? "text-emerald-400 font-medium bg-emerald-500/10"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
                    )
                  }
                >
                  Contacts
                </NavLink>
                <NavLink
                  to="/send"
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-sm rounded-lg transition-colors",
                      isActive
                        ? "text-emerald-400 font-medium bg-emerald-500/10"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
                    )
                  }
                >
                  Send
                </NavLink>
                <button
                  onClick={() => void signOut()}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 ml-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
