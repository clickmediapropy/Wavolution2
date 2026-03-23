import { type FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ContactFormContact {
  _id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

interface ContactFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string; phone: string; firstName: string; lastName: string }) => void;
  error: string;
  isSubmitting: boolean;
  contact?: ContactFormContact | null;
}

export function ContactFormDialog({
  isOpen,
  onClose,
  onSubmit,
  error,
  isSubmitting,
  contact,
}: ContactFormDialogProps) {
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const isEditMode = !!contact;

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setPhone(contact.phone);
        setFirstName(contact.firstName ?? "");
        setLastName(contact.lastName ?? "");
      } else {
        setPhone("");
        setFirstName("");
        setLastName("");
      }
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEditMode) {
      onSubmit({ id: contact!._id, phone, firstName, lastName });
    } else {
      onSubmit({ phone, firstName, lastName });
    }
  }

  const title = isEditMode ? "Edit Contact" : "Add Contact";
  const fieldPrefix = isEditMode ? "edit" : "add";

  let submitLabel: string;
  if (isEditMode) {
    submitLabel = isSubmitting ? "Saving..." : "Save Changes";
  } else {
    submitLabel = isSubmitting ? "Adding..." : "Add Contact";
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl max-w-md w-full mx-4 p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {isEditMode
                ? "Update contact details"
                : "Add a new contact to your list"}
            </p>
          </div>
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
              htmlFor={`${fieldPrefix}-phone`}
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Phone *
            </label>
            <input
              id={`${fieldPrefix}-phone`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
              placeholder="+1234567890"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Format: +country code + number
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`${fieldPrefix}-firstName`}
                className="block text-sm font-medium text-zinc-300 mb-1"
              >
                Name
              </label>
              <input
                id={`${fieldPrefix}-firstName`}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                placeholder="First name"
              />
            </div>
            <div>
              <label
                htmlFor={`${fieldPrefix}-lastName`}
                className="block text-sm font-medium text-zinc-300 mb-1"
              >
                Last Name
              </label>
              <input
                id={`${fieldPrefix}-lastName`}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                placeholder="Last name"
              />
            </div>
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
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
