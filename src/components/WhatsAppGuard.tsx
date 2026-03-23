import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2 } from "lucide-react";

export function WhatsAppGuard({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.currentUser);

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user || !user.instanceCreated) {
    return <Navigate to="/whatsapp/setup" replace />;
  }

  if (!user.whatsappConnected) {
    return <Navigate to="/whatsapp/connect" replace />;
  }

  return <>{children}</>;
}
