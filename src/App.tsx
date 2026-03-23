import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnonymousRoute } from "./components/AnonymousRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { UploadContactsPage } from "./pages/UploadContactsPage";
import { SetupWhatsAppPage } from "./pages/SetupWhatsAppPage";
import { ConnectWhatsAppPage } from "./pages/ConnectWhatsAppPage";
import { SendMessagePage } from "./pages/SendMessagePage";
import { WhatsAppGuard } from "./components/WhatsAppGuard";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export default function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route
              path="/"
              element={
                <AnonymousRoute>
                  <LoginPage />
                </AnonymousRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AnonymousRoute>
                  <RegisterPage />
                </AnonymousRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <ContactsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts/upload"
              element={
                <ProtectedRoute>
                  <UploadContactsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/whatsapp/setup"
              element={
                <ProtectedRoute>
                  <SetupWhatsAppPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/whatsapp/connect"
              element={
                <ProtectedRoute>
                  <ConnectWhatsAppPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/send"
              element={
                <ProtectedRoute>
                  <WhatsAppGuard>
                    <SendMessagePage />
                  </WhatsAppGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ConvexAuthProvider>
  );
}
