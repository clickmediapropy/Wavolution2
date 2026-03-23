import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function SetupWhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const createInstance = useAction(api.evolution.createInstance);
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (user?.instanceCreated) {
    return <Navigate to="/whatsapp/connect" replace />;
  }

  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const shortId = user._id.slice(-8);
      const instanceName = `hub_${shortId}`;
      await createInstance({ instanceName });
      toast.success("WhatsApp instance created!");
      navigate("/whatsapp/connect");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create instance",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">WhatsApp Setup</h1>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          Connect Your WhatsApp
        </h2>
        <p className="text-zinc-400 mb-6">
          Create a WhatsApp instance to start sending messages. You'll scan a QR
          code with your phone in the next step.
        </p>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Create Instance"
        >
          {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
          {isCreating ? "Creating..." : "Create Instance"}
        </button>
      </div>
    </div>
  );
}
