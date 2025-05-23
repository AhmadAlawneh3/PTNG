
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/user";

// Auth pages
import Login from "@/pages/Login";
import Contact from "@/pages/Contact";
import ForgotPassword from "@/pages/ForgotPassword";
// Removed the AdminSetup import

// Dashboard pages
import TesterDashboard from "@/pages/tester/TesterDashboard";
import TesterChat from "@/pages/tester/TesterChat";
import TesterVirtualDesktop from "@/pages/tester/TesterVirtualDesktop";
import TesterProjects from "@/pages/tester/TesterProjects";
import TesterAIChat from "@/pages/tester/TesterAIChat";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import ManagerProjects from "@/pages/manager/ManagerProjects";
import ManagerTeam from "@/pages/manager/ManagerTeam";
import ManagerChat from "@/pages/manager/ManagerChat";
import ManagerAIChat from "@/pages/manager/ManagerAIChat";
import ManagerVirtualDesktop from "@/pages/manager/ManagerVirtualDesktop";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UsersPage from "@/pages/admin/UsersPage";
import VirtualDesktopPage from "@/pages/admin/VirtualDesktopPage";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminChats from "@/pages/admin/AdminChats";
import AdminAIChat from "@/pages/admin/AdminAIChat";

// Error page
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Removed the /admin-setup route */}
            
            {/* Tester Routes */}
            <Route 
              path="/dashboard/tester" 
              element={
                <ProtectedRoute allowedRoles={['Tester']}>
                  <TesterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tester/chat" 
              element={
                <ProtectedRoute allowedRoles={['Tester']}>
                  <TesterChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tester/projects" 
              element={
                <ProtectedRoute allowedRoles={['Tester']}>
                  <TesterProjects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tester/desktop" 
              element={
                <ProtectedRoute allowedRoles={['Tester']}>
                  <TesterVirtualDesktop />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tester/ai-chat" 
              element={
                <ProtectedRoute allowedRoles={['Tester']}>
                  <TesterAIChat />
                </ProtectedRoute>
              } 
            />
            
            {/* Manager Routes */}
            <Route 
              path="/dashboard/manager" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manager/projects" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerProjects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manager/team" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerTeam />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manager/chat" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manager/desktop" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerVirtualDesktop />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manager/ai-chat" 
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerAIChat />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin/vm" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <VirtualDesktopPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin/projects" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminProjects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin/chats" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminChats />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin/ai-chat" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminAIChat />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
