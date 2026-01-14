import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courts from "./pages/Courts";
import CourtDetail from "./pages/CourtDetail";
import Equipment from "./pages/Equipment";
import Bookings from "./pages/Bookings";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import TestSetup from "./pages/TestSetup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/test-setup" element={<TestSetup />} />
            
            {/* Protected Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/courts" element={
              <ProtectedRoute>
                <Courts />
              </ProtectedRoute>
            } />
            <Route path="/courts/:id" element={
              <ProtectedRoute>
                <CourtDetail />
              </ProtectedRoute>
            } />
            <Route path="/equipment" element={
              <ProtectedRoute>
                <Equipment />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Protected Admin/Faculty Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRoles={['admin', 'faculty']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute requiredRoles={['admin', 'faculty']}>
                <AdminApprovals />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/inventory" element={
              <ProtectedRoute requiredRoles={['admin', 'faculty']}>
                <AdminInventory />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredRoles={['admin', 'faculty']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
