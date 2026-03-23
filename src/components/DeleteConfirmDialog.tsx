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
          This action cannot be undone. The selected {label} will be
          permanently removed.
        </p>

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
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
