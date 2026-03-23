import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

const STORAGE_KEY = "theme-preference";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "dark";
}

function applyTheme(theme: Theme, animate = false): void {
  const root = document.documentElement;
  const opposite = theme === "dark" ? "light" : "dark";

  if (animate) {
    root.classList.add("theme-transition");
  }

  root.classList.add(theme);
  root.classList.remove(opposite);

  if (animate) {
    setTimeout(() => root.classList.remove("theme-transition"), 350);
  }
}

if (typeof window !== "undefined") {
  applyTheme(getStoredTheme(), false);
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme, true);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

const iconTransition = { duration: 0.2, ease: "easeInOut" as const };

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps): ReactNode {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50 transition-all group relative",
        isCollapsed && "justify-center"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5 flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={iconTransition}
              className="absolute inset-0"
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={iconTransition}
              className="absolute inset-0"
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            {isDark ? "Dark Mode" : "Light Mode"}
          </motion.span>
        )}
      </AnimatePresence>

      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-surface-elevated text-text-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
          {isDark ? "Switch to Light" : "Switch to Dark"}
        </div>
      )}
    </button>
  );
}
