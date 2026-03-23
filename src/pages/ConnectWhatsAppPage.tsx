import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-6">
          Open WhatsApp on your phone &rarr; Settings &rarr; Linked Devices
          &rarr; Link a Device &rarr; Scan the code below.
        </p>

        <div className="w-64 h-64 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          {isLoadingQr ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : error ? (
            <p className="text-sm text-red-500 px-4">{error}</p>
          ) : qrBase64 ? (
            <img
              src={qrBase64}
              alt="WhatsApp QR Code"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <p className="text-sm text-gray-400">No QR code available</p>
          )}
        </div>

        <button
          onClick={fetchQr}
          disabled={isLoadingQr}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingQr ? "animate-spin" : ""}`}
          />
          Refresh QR Code
        </button>

        <p className="text-xs text-gray-400 mt-4">
          QR code expires after ~60 seconds. Click refresh if it doesn't scan.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Waiting for connection...
        </div>
      </div>
    </div>
  );
}
