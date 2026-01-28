import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthContextProvider from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RateLimitProvider } from "./components/RateLimitProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Eager load only the landing page, legal pages, and not found for better UX
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Lazy load all other pages to reduce initial bundle
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLoanDetail = lazy(() => import("./pages/AdminLoanDetail"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement"));
const BorrowerPortal = lazy(() => import("./pages/BorrowerPortal"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ChangeEmail = lazy(() => import("./pages/ChangeEmail"));
const TwoFactorAuth = lazy(() => import("./pages/TwoFactorAuth"));
const MFAVerification = lazy(() => import("./pages/MFAVerification"));
const LoanApplications = lazy(() => import("./pages/LoanApplications"));
const Support = lazy(() => import("./pages/Support"));
const LoanCalculator = lazy(() => import("./pages/LoanCalculator"));
const MyDocuments = lazy(() => import("./pages/MyDocuments"));
const CreditReports = lazy(() => import("./pages/CreditReports"));
const CreditScoreSimulator = lazy(() => import("./pages/CreditScoreSimulator"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));
const ExistingLoans = lazy(() => import("./pages/ExistingLoans"));

// Lazy load admin pages
const AllApplications = lazy(() => import("./pages/admin/AllApplications"));
const ApplicationReview = lazy(() => import("./pages/admin/ApplicationReview"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const SecurityAudit = lazy(() => import("./pages/admin/SecurityAudit"));
const ExportData = lazy(() => import("./pages/admin/ExportData"));
const LoanProducts = lazy(() => import("./pages/admin/LoanProducts"));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const DatabaseManagement = lazy(() => import("./pages/admin/DatabaseManagement"));
const ApiIntegrations = lazy(() => import("./pages/admin/ApiIntegrations"));
const ExistingLoansManagement = lazy(() => import("./pages/admin/ExistingLoansManagement"));
const ApplicationAssignments = lazy(() => import("./pages/admin/ApplicationAssignments"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthContextProvider>
            <RateLimitProvider>
              <Suspense fallback={<LoadingFallback />}>
              <Routes>
              {/* Public routes without Layout */}
              <Route path="/" element={<Index />} />
              <Route path="/calculator" element={<LoanCalculator />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes with Layout */}
              <Route path="/admin" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/applications" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <AllApplications />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/review" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <ApplicationReview />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/analytics" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <Analytics />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/settings" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <SystemSettings />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/security" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <SecurityAudit />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/export" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <ExportData />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/products" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <LoanProducts />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/payments" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <PaymentManagement />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/notifications" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <AdminNotifications />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/notifications" element={
                <Layout>
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/notification-preferences" element={
                <Layout>
                  <ProtectedRoute>
                    <NotificationPreferences />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/support" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <SupportTickets />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/database" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <DatabaseManagement />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/integrations" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <ApiIntegrations />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/existing-loans" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <ExistingLoansManagement />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/assignments" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <ApplicationAssignments />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/users" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserManagement />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/admin/loans/:id" element={
                <Layout>
                  <ProtectedRoute requiredRole="admin">
                    <AdminLoanDetail />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/my-account" element={
                <Layout>
                  <ProtectedRoute>
                    <BorrowerPortal />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/change-password" element={
                <Layout>
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/change-email" element={
                <Layout>
                  <ProtectedRoute>
                    <ChangeEmail />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/two-factor-auth" element={
                <Layout>
                  <ProtectedRoute>
                    <TwoFactorAuth />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/mfa-verify" element={
                <ProtectedRoute>
                  <MFAVerification />
                </ProtectedRoute>
              } />
              <Route path="/loan-applications" element={
                <Layout>
                  <ProtectedRoute>
                    <LoanApplications />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/document-storage" element={
                <Layout>
                  <ProtectedRoute>
                    <MyDocuments />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/credit-reports" element={
                <Layout>
                  <ProtectedRoute>
                    <CreditReports />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/credit-score-simulator" element={
                <Layout>
                  <ProtectedRoute>
                    <CreditScoreSimulator />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/bank-accounts" element={
                <Layout>
                  <ProtectedRoute>
                    <BankAccounts />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/existing-loans" element={
                <Layout>
                  <ProtectedRoute>
                    <ExistingLoans />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/support" element={
                <Layout>
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RateLimitProvider>
        </AuthContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
