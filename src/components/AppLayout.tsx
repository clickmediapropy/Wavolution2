import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Users,
  Send,
  Menu,
  X,
} from "lucide-react";
import { Toaster } from "sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/send", label: "Send", icon: Send },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b-2",
    isActive
      ? "text-emerald-400 font-medium border-emerald-500"
      : "text-zinc-400 hover:text-zinc-200 border-transparent",
  );

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
    isActive
      ? "text-emerald-400 font-medium bg-emerald-500/10"
      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
  );

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <>
                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-1">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={navLinkClass}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </NavLink>
                  ))}
                  <button
                    onClick={() => void signOut()}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 ml-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Mobile hamburger toggle */}
                <button
                  data-testid="mobile-menu-toggle"
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="md:hidden p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav panel */}
        {isAuthenticated && mobileMenuOpen && (
          <div
            data-testid="mobile-nav-panel"
            className="md:hidden border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  void signOut();
                }}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
