import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import SiteManagementPage from "@/pages/SiteManagementPage";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/40 text-muted-foreground">Chargement...</div>;
  }

  const destination = user
    ? user.role === 'etudiant'
      ? '/system/portail'
      : user.role === 'super_admin'
        ? '/gestion-site/dashboard'
        : '/system/dashboard'
    : '/login';

  return <Navigate to={destination} replace />;
}

function LegacySystemRedirect() {
  const location = useLocation();
  return <Navigate to={`/system${location.pathname}${location.search}${location.hash}`} replace />;
}

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login-etudiant" element={<StudentLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/inscription" element={<RegistrationRedirect />} />
            <Route path="/gestion-site/:section?" element={<SiteManagementPage />} />
            <Route path="/system" element={<Layout />}>
              <Route index element={<Navigate to="/system/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="parametres" element={<Settings />} />
              <Route path="etudiants" element={<Students />} />
              <Route path="paiements" element={<Payments />} />
              <Route path="cours" element={<Courses />} />
              <Route path="presences" element={<Attendance />} />
              <Route path="notes" element={<Grades />} />
              <Route path="utilisateurs" element={<Users />} />
              <Route path="requetes" element={<Requests />} />
              <Route path="valve" element={<Valve />} />
              <Route path="chat" element={<Chat />} />
              <Route path="portail" element={<StudentPortal />} />
              <Route path="travaux" element={<Assignments />} />
              <Route path="mes-travaux" element={<StudentAssignments />} />
            </Route>
            <Route path="/dashboard" element={<LegacySystemRedirect />} />
            <Route path="/etudiants" element={<LegacySystemRedirect />} />
            <Route path="/paiements" element={<LegacySystemRedirect />} />
            <Route path="/cours" element={<LegacySystemRedirect />} />
            <Route path="/presences" element={<LegacySystemRedirect />} />
            <Route path="/notes" element={<LegacySystemRedirect />} />
            <Route path="/utilisateurs" element={<LegacySystemRedirect />} />
            <Route path="/requetes" element={<LegacySystemRedirect />} />
            <Route path="/valve" element={<LegacySystemRedirect />} />
            <Route path="/chat" element={<LegacySystemRedirect />} />
            <Route path="/portail" element={<LegacySystemRedirect />} />
            <Route path="/travaux" element={<LegacySystemRedirect />} />
            <Route path="/mes-travaux" element={<LegacySystemRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
