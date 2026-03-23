import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function PwaInstallBanner(): ReactNode {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const show = deferredPrompt !== null && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Install Message Hub
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Add to your home screen for quick access and offline support.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
