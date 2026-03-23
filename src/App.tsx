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
import { CampaignHistoryPage } from "./pages/CampaignHistoryPage";
import { CampaignAnalyticsPage } from "./pages/CampaignAnalyticsPage";
import { InboxPage } from "./pages/InboxPage";
import { BotConfigPage } from "./pages/BotConfigPage";
import { BotGoalsPage } from "./pages/BotGoalsPage";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { PipelinePage } from "./pages/PipelinePage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import { ContactSegmentsPage } from "./pages/ContactSegmentsPage";
import { QuickRepliesPage } from "./pages/QuickRepliesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ExportPage } from "./pages/ExportPage";
import { ActivityLogPage } from "./pages/ActivityLogPage";
import { SchedulePage } from "./pages/SchedulePage";
import { WhatsAppStatusPage } from "./pages/WhatsAppStatusPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { WebhookLogPage } from "./pages/WebhookLogPage";
import { AutoFollowupPage } from "./pages/AutoFollowupPage";
import { APIDocsPage } from "./pages/APIDocsPage";
import { ContactMergePage } from "./pages/ContactMergePage";
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
                path="/inbox"
                element={
                  <ProtectedRoute>
                    <InboxPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox/:conversationId"
                element={
                  <ProtectedRoute>
                    <InboxPage />
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
                path="/contacts/segments"
                element={
                  <ProtectedRoute>
                    <ContactSegmentsPage />
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
                path="/contacts/duplicates"
                element={
                  <ProtectedRoute>
                    <ContactMergePage />
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
                path="/whatsapp/status"
                element={
                  <ProtectedRoute>
                    <WhatsAppStatusPage />
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
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <CampaignHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/analytics"
                element={
                  <ProtectedRoute>
                    <CampaignAnalyticsPage />
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
                path="/campaigns/schedule"
                element={
                  <ProtectedRoute>
                    <SchedulePage />
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
              <Route
                path="/pipeline"
                element={
                  <ProtectedRoute>
                    <PipelinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bots"
                element={
                  <ProtectedRoute>
                    <BotConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  <ProtectedRoute>
                    <KnowledgeBasePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bot-goals"
                element={
                  <ProtectedRoute>
                    <BotGoalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quick-replies"
                element={
                  <ProtectedRoute>
                    <QuickRepliesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/followups"
                element={
                  <ProtectedRoute>
                    <AutoFollowupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <TemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <ProtectedRoute>
                    <ExportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <ActivityLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/webhooks"
                element={
                  <ProtectedRoute>
                    <WebhookLogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-docs"
                element={
                  <ProtectedRoute>
                    <APIDocsPage />
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
