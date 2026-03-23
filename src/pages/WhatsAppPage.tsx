import { useState, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Loader2,
  Wifi,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "@convex/_generated/dataModel";

// Instance card for a single WhatsApp instance
function InstanceCard({
  instance,
  onDelete,
}: {
  instance: Doc<"instances">;
  onDelete: (instance: Doc<"instances">) => void;
}) {
  const getQrCode = useAction(api.evolution.getQrCode);
  const checkStatus = useAction(api.evolution.checkConnectionStatus);

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState("");

  // Fetch QR code
  const fetchQr = useCallback(async () => {
    setIsLoadingQr(true);
    setQrError("");
    try {
      const data = await getQrCode({ instanceName: instance.name });
      setQrBase64(data.base64 || null);
    } catch (err) {
      setQrError(
        err instanceof Error ? err.message : "Failed to load QR code",
      );
    } finally {
      setIsLoadingQr(false);
    }
  }, [instance.name, getQrCode]);

  // Auto-fetch QR when not connected
  useEffect(() => {
    if (!instance.whatsappConnected) {
      fetchQr();
    }
  }, [instance.whatsappConnected, fetchQr]);

  // Poll connection status when not connected
  useEffect(() => {
    if (instance.whatsappConnected) return;
    const interval = setInterval(async () => {
      try {
        const result = await checkStatus({
          instanceName: instance.name,
          instanceId: instance._id,
        });
        if (result.state === "open") {
          toast.success(`${instance.name} connected!`);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instance.whatsappConnected, instance.name, instance._id, checkStatus]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {instance.whatsappConnected ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          ) : (
            <span className="inline-flex rounded-full h-3 w-3 bg-amber-500 animate-pulse" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              {instance.name}
            </h3>
            {instance.whatsappNumber && (
              <p className="text-xs font-mono text-zinc-500">
                {instance.whatsappNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              instance.whatsappConnected
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {instance.whatsappConnected ? "Connected" : "Pending"}
          </span>
          <button
            onClick={() => onDelete(instance)}
            className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
            aria-label={`Delete ${instance.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR code for unconnected instances */}
      {!instance.whatsappConnected && (
        <div>
          <div className="w-48 h-48 mx-auto mb-3 bg-white rounded-lg p-3 flex items-center justify-center">
            {isLoadingQr ? (
              <div
                className="w-full h-full animate-pulse bg-zinc-300 rounded-lg"
                role="status"
                aria-label="Loading QR code"
              />
            ) : qrError ? (
              <p className="text-xs text-red-400 px-2 text-center">
                {qrError}
              </p>
            ) : qrBase64 ? (
              <img
                src={qrBase64}
                alt={`QR Code for ${instance.name}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-xs text-zinc-500">No QR code</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchQr}
              disabled={isLoadingQr}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingQr ? "animate-spin" : ""}`}
              />
              Refresh QR
            </button>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2">
            Scan with WhatsApp &rarr; Linked Devices
          </p>
        </div>
      )}

      {/* Connected instance details */}
      {instance.whatsappConnected && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Wifi className="w-4 h-4 text-emerald-500" />
          Ready to send messages
        </div>
      )}
    </div>
  );
}

export function WhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const instances = useQuery(api.instances.list);
  const createInstance = useAction(api.evolution.createInstance);
  const deleteInstanceAction = useAction(api.evolution.deleteInstance);

  const [isCreating, setIsCreating] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Handle create instance
  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const name =
        customName.trim() ||
        `hub_${user._id.slice(-6)}_${Date.now().toString(36)}`;
      await createInstance({ instanceName: name });
      toast.success(`Instance "${name}" created!`);
      setCustomName("");
      setShowCreateForm(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create instance",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete instance
  const handleDelete = async (instance: Doc<"instances">) => {
    try {
      await deleteInstanceAction({
        instanceName: instance.name,
        instanceId: instance._id,
      });
      toast.success(`Instance "${instance.name}" deleted`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete instance",
      );
    }
  };

  if (user === undefined || instances === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const connectedCount = instances.filter((i) => i.whatsappConnected).length;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-7 h-7 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              WhatsApp Instances
            </h1>
            <p className="text-sm text-zinc-500">
              {instances.length} instance{instances.length !== 1 ? "s" : ""} ·{" "}
              {connectedCount} connected
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Instance
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            New WhatsApp Instance
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="instance-name"
                className="block text-xs text-zinc-500 mb-1"
              >
                Instance Name (optional — auto-generated if empty)
              </label>
              <input
                id="instance-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. sales_team"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCustomName("");
              }}
              className="px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Instance grid */}
      {instances.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">
            No instances yet
          </h2>
          <p className="text-zinc-400 mb-6">
            Create a WhatsApp instance to start sending messages.
            <br />
            Each instance connects to one WhatsApp number.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Instance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <InstanceCard
              key={instance._id}
              instance={instance}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
