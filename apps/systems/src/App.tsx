import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import StudentLogin from "@/pages/StudentLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Payments from "@/pages/Payments";
import Courses from "@/pages/Courses";
import Grades from "@/pages/Grades";
import Attendance from "@/pages/Attendance";
import Users from "@/pages/Users";
import Requests from "@/pages/Requests";
import Valve from "@/pages/Valve";
import Chat from "@/pages/Chat";
import StudentPortal from "@/pages/StudentPortal";
import Assignments from "@/pages/Assignments";
import StudentAssignments from "@/pages/StudentAssignments";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SystemHome from "@/pages/SystemHome";
import SiteManagementPage from "@/pages/SiteManagementPage";

const queryClient = new QueryClient();

// Redirect component for /inscription to main site admission page
function RegistrationRedirect() {
  useEffect(() => {
    window.location.href = "http://localhost:8080/admission";
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirection vers le formulaire d'admission...</p>
      </div>
    </div>
  );
}

// Setup initial admin on first load
function AdminSetup() {
  useEffect(() => {
    const setup = async () => {
      // Check if already set up
      const { data: existing } = await supabase.from('profiles').select('id').limit(1);
      if (existing && existing.length > 0) return;

      // Create admin without affecting current session
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: 'jacquesmasuruku2@gmail.com', password: '678900', nom: 'Super Admin UPG', role: 'super_admin' }
      });
      if (error) console.log('Admin setup:', error.message);
    };
    setup();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminSetup />
          <Routes>
            <Route path="/" element={<SystemHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login-etudiant" element={<StudentLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/inscription" element={<RegistrationRedirect />} />
            <Route path="/gestion-site/:section?" element={<SiteManagementPage />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/etudiants" element={<Students />} />
              <Route path="/paiements" element={<Payments />} />
              <Route path="/cours" element={<Courses />} />
              <Route path="/presences" element={<Attendance />} />
              <Route path="/notes" element={<Grades />} />
              <Route path="/utilisateurs" element={<Users />} />
              <Route path="/requetes" element={<Requests />} />
              <Route path="/valve" element={<Valve />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/portail" element={<StudentPortal />} />
              <Route path="/travaux" element={<Assignments />} />
              <Route path="/mes-travaux" element={<StudentAssignments />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
