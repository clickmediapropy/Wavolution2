import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2 } from "lucide-react";

export function WhatsAppGuard({ children }: { children: ReactNode }) {
  const instances = useQuery(api.instances.listConnected);

  if (instances === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (instances.length === 0) {
    return <Navigate to="/whatsapp" replace />;
  }

  return <>{children}</>;
}
