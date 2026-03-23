import { FormEvent, useState, useEffect } from "react";
import { X } from "lucide-react";

interface AddContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { phone: string; name: string }) => void;
  error: string;
  isSubmitting: boolean;
}

export function AddContactDialog({
  isOpen,
  onClose,
  onSubmit,
  error,
  isSubmitting,
}: AddContactDialogProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ phone, name });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl max-w-md w-full mx-4 p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Add Contact</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-3 text-sm"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="add-phone"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Phone *
            </label>
            <input
              id="add-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label
              htmlFor="add-name"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Name
            </label>
            <input
              id="add-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              placeholder="Contact name (optional)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
