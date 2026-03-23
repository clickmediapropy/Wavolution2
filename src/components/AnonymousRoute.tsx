import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";

export function AnonymousRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div role="status" className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
