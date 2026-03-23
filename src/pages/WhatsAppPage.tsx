import { useState, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Smartphone, QrCode, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { StepIndicator } from "@/components/StepIndicator";

const SETUP_STEPS = [
  { label: "Create Instance" },
  { label: "Scan QR Code" },
  { label: "Connected" },
];

export function WhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const createInstance = useAction(api.evolution.createInstance);
  const getQrCode = useAction(api.evolution.getQrCode);
  const checkStatus = useAction(api.evolution.checkConnectionStatus);
  const deleteInstance = useAction(api.evolution.deleteInstance);

  const [isCreating, setIsCreating] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState("");

  const instanceName = user?.evolutionInstanceName;
  const instanceCreated = user?.instanceCreated ?? false;
  const connected = user?.whatsappConnected ?? false;

  // Determine current step
  const currentStep = connected ? 2 : instanceCreated ? 1 : 0;

  // Fetch QR code
  const fetchQr = useCallback(async () => {
    if (!instanceName) return;
    setIsLoadingQr(true);
    setQrError("");
    try {
      const data = await getQrCode({ instanceName });
      setQrBase64(data.base64 || null);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to load QR code");
    } finally {
      setIsLoadingQr(false);
    }
  }, [instanceName, getQrCode]);

  // Auto-fetch QR when in step 1
  useEffect(() => {
    if (instanceCreated && !connected && instanceName) {
      fetchQr();
    }
  }, [instanceCreated, connected, instanceName, fetchQr]);

  // Poll connection status when in step 1
  useEffect(() => {
    if (!instanceName || connected || !instanceCreated) return;
    const interval = setInterval(async () => {
      try {
        const result = await checkStatus({ instanceName });
        if (result.state === "open") {
          toast.success("WhatsApp connected!");
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instanceName, connected, instanceCreated, checkStatus]);

  // Handle create instance
  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const shortId = user._id.slice(-8);
      const instanceNameNew = `hub_${shortId}`;
      await createInstance({ instanceName: instanceNameNew });
      toast.success("WhatsApp instance created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create instance");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!instanceName) return;
    try {
      await deleteInstance({ instanceName });
      toast.success("WhatsApp instance disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">WhatsApp</h1>
      </div>

      <StepIndicator steps={SETUP_STEPS} currentStep={currentStep} />

      <div className="max-w-lg mx-auto">
        {/* Step 0: Create instance */}
        {!instanceCreated && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              Connect Your WhatsApp
            </h2>
            <p className="text-zinc-400 mb-6">
              Create a WhatsApp instance to start sending messages.
              You&apos;ll scan a QR code with your phone in the next step.
            </p>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? "Creating..." : "Create Instance"}
            </button>
          </div>
        )}

        {/* Step 1: Scan QR code */}
        {instanceCreated && !connected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              Scan QR Code
            </h2>
            <p className="text-zinc-400 mb-6">
              Open WhatsApp on your phone &rarr; Settings &rarr; Linked Devices
              &rarr; Link a Device &rarr; Scan the code below.
            </p>
            <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-lg p-4 flex items-center justify-center">
              {isLoadingQr ? (
                <div className="w-full h-full animate-pulse bg-zinc-300 rounded-lg" role="status" aria-label="Loading QR code" />
              ) : qrError ? (
                <p className="text-sm text-red-400 px-4">{qrError}</p>
              ) : qrBase64 ? (
                <img src={qrBase64} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              ) : (
                <p className="text-sm text-zinc-500">No QR code available</p>
              )}
            </div>
            <button
              onClick={fetchQr}
              disabled={isLoadingQr}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQr ? "animate-spin" : ""}`} />
              Refresh QR Code
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Waiting for connection...
            </div>
          </div>
        )}

        {/* Step 2: Connected — management */}
        {connected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Wifi className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Connected</h2>
                <p className="text-sm text-zinc-500">Your WhatsApp is linked and ready</p>
              </div>
              <span className="ml-auto relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {instanceName && (
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-500">Instance</span>
                  <span className="text-sm font-mono text-zinc-300">{instanceName}</span>
                </div>
              )}
              {user?.whatsappNumber && (
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-500">Phone</span>
                  <span className="text-sm font-mono text-zinc-300">{user.whatsappNumber}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect
              </button>
              <button
                onClick={async () => {
                  await handleDisconnect();
                  // After disconnect, component re-renders to step 0/1
                  // and the user can reconnect from there
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
