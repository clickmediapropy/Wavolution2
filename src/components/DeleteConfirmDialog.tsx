import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  count,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const requiresTyping = count > 5;
  const canConfirm = !requiresTyping || confirmText === "DELETE";

  useEffect(() => {
    if (isOpen) setConfirmText("");
  }, [isOpen]);

  if (!isOpen) return null;

  const label = count === 1 ? "1 contact" : `${count} contacts`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl max-w-sm w-full mx-4 p-6 text-center animate-slideUp">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          Delete {label}?
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          This action cannot be undone. The selected {label} will be permanently
          removed.
        </p>

        {count > 5 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-400 mb-4 text-left">
            ⚠ You are about to delete {count} contacts. This is a large batch
            operation that cannot be undone.
          </div>
        )}

        {requiresTyping && (
          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-1 text-left">
              Type{" "}
              <span className="font-mono font-bold text-zinc-300">DELETE</span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none text-sm"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !canConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
