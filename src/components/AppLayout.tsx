import { type ReactNode, useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Users,
  Megaphone,
  Smartphone,
  Inbox,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Tag,
  Layers,
  Upload,
  Link2,
  Globe,
  ArrowDownToLine,
  Sparkles,
  Phone,
} from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle, useTheme } from "@/components/ThemeToggle";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/verticals", label: "Verticals", icon: Layers },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/domains", label: "Domains", icon: Globe },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/postbacks", label: "Postbacks", icon: ArrowDownToLine },
  { to: "/templates/generate", label: "AI Templates", icon: Sparkles },
  { to: "/import", label: "Import", icon: Upload },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/phone-numbers", label: "Numbers", icon: Phone },
  { to: "/whatsapp", label: "WhatsApp", icon: Smartphone },
] as const;

const sidebarSpring = { type: "spring", stiffness: 300, damping: 30 } as const;

function LogoIcon() {
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
      <MessageSquare className="w-4 h-4 text-white" />
    </div>
  );
}

function CollapsibleLabel({ isCollapsed, children }: { isCollapsed: boolean; children: string }) {
  return (
    <AnimatePresence>
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { signOut } = useAuthActions();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={sidebarSpring}
      className="fixed left-0 top-0 h-screen bg-surface-card/95 backdrop-blur-xl border-r border-border-default z-50 flex flex-col hidden md:flex"
    >
      <div className="h-16 flex items-center px-4 border-b border-border-default">
        <Link
          to="/dashboard"
          className={cn(
            "flex items-center gap-3 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <LogoIcon />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold text-text-primary whitespace-nowrap"
              >
                OfferBlast
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-pulse-dot")} />
              <CollapsibleLabel isCollapsed={isCollapsed}>{label}</CollapsibleLabel>

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated text-text-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  {label}
                </div>
              )}

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-0.5 h-6 bg-emerald-500 rounded-full"
                  transition={sidebarSpring}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-default space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
            location.pathname === "/settings"
              ? "bg-emerald-500/10 text-emerald-400"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50",
            isCollapsed && "justify-center"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <CollapsibleLabel isCollapsed={isCollapsed}>Settings</CollapsibleLabel>
        </NavLink>

        <ThemeToggle isCollapsed={isCollapsed} />

        <button
          onClick={() => void signOut()}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all group",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <CollapsibleLabel isCollapsed={isCollapsed}>Logout</CollapsibleLabel>
        </button>

        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-elevated/50 transition-all mt-2",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { signOut } = useAuthActions();
  const location = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 bg-surface-card rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border-default rounded-full" />
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-text-primary">Menu</span>
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-border-default space-y-1">
                <NavLink
                  to="/settings"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    location.pathname === "/settings"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </NavLink>
                <button
                  onClick={() => {
                    onClose();
                    void signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const toggleCommandPalette = useCallback(
    () => setCommandPaletteOpen((prev) => !prev),
    [],
  );
  const closeCommandPalette = useCallback(
    () => setCommandPaletteOpen(false),
    [],
  );

  // Global keyboard shortcuts (only when authenticated)
  useKeyboardShortcuts(
    isAuthenticated
      ? {
          onCommandPalette: toggleCommandPalette,
          onCloseModal: closeCommandPalette,
        }
      : {},
  );

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved) setSidebarCollapsed(saved === "true");
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-surface-base">
      {isAuthenticated && (
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
        />
      )}

      <div 
        className={cn(
          "transition-all duration-300",
          isAuthenticated && "md:ml-[240px]",
          isAuthenticated && sidebarCollapsed && "md:ml-[72px]"
        )}
      >
        {/* Mobile Header */}
        {isAuthenticated && (
          <header className="md:hidden sticky top-0 z-40 bg-surface-card/95 backdrop-blur-xl border-b border-border-default">
            <div className="flex items-center justify-between h-14 px-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <LogoIcon />
                <span className="font-bold text-text-primary">OfferBlast</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-text-secondary hover:text-text-primary"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>
        )}

        {/* Desktop Header (non-authenticated) */}
        {!isAuthenticated && (
          <nav className="sticky top-0 z-50 bg-surface-card/80 backdrop-blur-xl border-b border-border-default">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link
                  to="/"
                  className="flex items-center gap-3 text-xl font-bold text-text-primary hover:text-emerald-400 transition-colors"
                >
                  <LogoIcon />
                  <span>OfferBlast</span>
                </Link>
                
                <div className="flex items-center gap-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main
          className={cn(
            "min-h-[calc(100vh-56px)] md:min-h-screen",
            isAuthenticated && "px-4 py-6 sm:px-6 lg:px-8",
            !isAuthenticated && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          )}
        >
          {children}
        </main>
      </div>

      <MobileNav isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      {isAuthenticated && (
        <CommandPalette isOpen={commandPaletteOpen} onClose={closeCommandPalette} />
      )}
      <PwaInstallBanner />
      <Toaster richColors position="top-right" theme={theme} />
    </div>
  );
}
