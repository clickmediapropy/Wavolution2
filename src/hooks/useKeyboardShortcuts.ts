import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcutHandlers {
  onCommandPalette?: () => void;
  onCloseModal?: () => void;
}

/**
 * Global keyboard shortcut system.
 *
 * Shortcuts:
 *  - Cmd+K / Ctrl+K  — open command palette
 *  - Cmd+I / Ctrl+I  — go to inbox
 *  - Cmd+D / Ctrl+D  — go to dashboard
 *  - Cmd+N / Ctrl+N  — new campaign
 *  - Escape           — close any modal
 */
export function useKeyboardShortcuts({
  onCommandPalette,
  onCloseModal,
}: KeyboardShortcutHandlers = {}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Ignore shortcuts when typing in an input, textarea, or contentEditable
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "Escape") {
        onCloseModal?.();
        return;
      }

      // All other shortcuts require Cmd/Ctrl and should not fire inside editable fields
      if (!meta) return;
      if (isEditable && e.key !== "k") return; // allow Cmd+K even in inputs

      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          onCommandPalette?.();
          break;
        case "i":
          e.preventDefault();
          navigate("/inbox");
          break;
        case "d":
          e.preventDefault();
          navigate("/dashboard");
          break;
        case "n":
          e.preventDefault();
          navigate("/campaigns?new=1");
          break;
      }
    },
    [navigate, onCommandPalette, onCloseModal],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
