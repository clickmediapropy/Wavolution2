import { LayoutDashboard } from "lucide-react";

export function DashboardPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Welcome to Message Hub. Your dashboard will appear here.</p>
      </div>
    </div>
  );
}
