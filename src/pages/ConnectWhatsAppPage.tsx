import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { QrCode, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StepIndicator } from "@/components/StepIndicator";

const SETUP_STEPS = [
  { label: "Create Instance" },
  { label: "Scan QR Code" },
  { label: "Start Messaging" },
];

export function ConnectWhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const getQrCode = useAction(api.evolution.getQrCode);
  const checkStatus = useAction(api.evolution.checkConnectionStatus);
  const navigate = useNavigate();

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [error, setError] = useState("");

  const instanceName = user?.evolutionInstanceName;

  const fetchQr = useCallback(async () => {
    if (!instanceName) return;
    setIsLoadingQr(true);
    setError("");
    try {
      const data = await getQrCode({ instanceName });
      setQrBase64(data.base64 || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load QR code");
    } finally {
      setIsLoadingQr(false);
    }
  }, [instanceName, getQrCode]);

  // Fetch QR on mount
  useEffect(() => {
    if (instanceName && !user?.whatsappConnected) {
      fetchQr();
    }
  }, [instanceName, user?.whatsappConnected, fetchQr]);

  // Poll connection status every 5 seconds
  useEffect(() => {
    if (!instanceName || user?.whatsappConnected) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkStatus({ instanceName });
        if (result.state === "open") {
          toast.success("WhatsApp connected!");
          navigate("/send");
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [instanceName, user?.whatsappConnected, checkStatus, navigate]);

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user?.instanceCreated) {
    return <Navigate to="/whatsapp/setup" replace />;
  }

  if (user.whatsappConnected) {
    return <Navigate to="/send" replace />;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Scan QR Code</h1>
      </div>

      <StepIndicator steps={SETUP_STEPS} currentStep={1} />

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 max-w-lg mx-auto text-center">
        <p className="text-zinc-400 mb-6">
          Open WhatsApp on your phone &rarr; Settings &rarr; Linked Devices
          &rarr; Link a Device &rarr; Scan the code below.
        </p>

        <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-lg p-4 flex items-center justify-center">
          {isLoadingQr ? (
            <div
              className="w-full h-full animate-pulse bg-zinc-300 rounded-lg"
              role="status"
              aria-label="Loading QR code"
            />
          ) : error ? (
            <p className="text-sm text-red-400 px-4">{error}</p>
          ) : qrBase64 ? (
            <img
              src={qrBase64}
              alt="WhatsApp QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-sm text-zinc-500">No QR code available</p>
          )}
        </div>

        <button
          onClick={fetchQr}
          disabled={isLoadingQr}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingQr ? "animate-spin" : ""}`}
          />
          Refresh QR Code
        </button>

        <p className="text-xs text-zinc-500 mt-4">
          QR code expires after ~60 seconds. Click refresh if it doesn't scan.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-dot" />
          Waiting for connection...
        </div>
      </div>
    </div>
  );
}
