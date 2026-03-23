import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnonymousRoute } from "./components/AnonymousRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { UploadContactsPage } from "./pages/UploadContactsPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";
import { SendMessagePage } from "./pages/SendMessagePage";
import { BulkCampaignPage } from "./pages/BulkCampaignPage";
import { CampaignStatusPage } from "./pages/CampaignStatusPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { WhatsAppGuard } from "./components/WhatsAppGuard";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export default function App() {
  return (
    <ErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route
                path="/"
                element={
                  <AnonymousRoute>
                    <LandingPage />
                  </AnonymousRoute>
                }
              />
              <Route
                path="/login"
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
                path="/whatsapp"
                element={
                  <ProtectedRoute>
                    <WhatsAppPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/whatsapp/setup" element={<Navigate to="/whatsapp" replace />} />
              <Route path="/whatsapp/connect" element={<Navigate to="/whatsapp" replace />} />
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
              <Route
                path="/campaigns/new"
                element={
                  <ProtectedRoute>
                    <BulkCampaignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/:id"
                element={
                  <ProtectedRoute>
                    <CampaignStatusPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </ConvexAuthProvider>
    </ErrorBoundary>
  );
}
