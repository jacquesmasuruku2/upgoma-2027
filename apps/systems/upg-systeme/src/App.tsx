import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import StudentLogin from "@/pages/StudentLogin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ChangePassword from "@/pages/ChangePassword";
import Registration from "@/pages/Registration";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Payments from "@/pages/Payments";
import Courses from "@/pages/Courses";
import Grades from "@/pages/Grades";
import Users from "@/pages/Users";
import Requests from "@/pages/Requests";
import Valve from "@/pages/Valve";
import Chat from "@/pages/Chat";
import StudentPortal from "@/pages/StudentPortal";
import DocumentVerification from "@/pages/DocumentVerification";
import Assignments from "@/pages/Assignments";
import StudentAssignments from "@/pages/StudentAssignments";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function StartRouteHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Si une route hash est deja active, on ne force pas la route "start".
    if (window.location.hash.startsWith("#/")) return;

    const sp = new URLSearchParams(window.location.search);
    const start = sp.get("start");
    if (!start) return;

    const normalized = start.startsWith("/") ? start : `/${start}`;
    // Se limite a un chemin interne pour eviter tout comportement inattendu.
    if (!normalized.startsWith("/")) return;

    navigate(normalized, { replace: true });
  }, [navigate]);

  return null;
}

// Setup initial admin on first load
function AdminSetup() {
  useEffect(() => {
    const setup = async () => {
      const { data: existing } = await supabase.from('profiles').select('id').limit(1);
      if (existing && existing.length > 0) return;

      const email = 'jacquesmasuruku2@gmail.com';
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: '678900',
        options: { data: { nom: 'Super Admin UPG' } },
      });

      if (signUpError) {
        console.warn('Admin setup skipped:', signUpError.message);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) return;

      await supabase.from('user_roles').upsert({ user_id: userId, role: 'super_admin' });
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        nom: 'Super Admin UPG',
        role: 'super_admin',
      } as any);
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
      <HashRouter>
        <AuthProvider>
          <StartRouteHandler />
          <AdminSetup />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login-etudiant" element={<StudentLogin />} />
            <Route path="/outils" element={<DocumentVerification />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
            <Route path="/inscription" element={<Registration />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/etudiants" element={<Students />} />
              <Route path="/paiements" element={<Payments />} />
              <Route path="/cours" element={<Courses />} />
              <Route path="/notes" element={<Grades />} />
              <Route path="/utilisateurs" element={<Users />} />
              <Route path="/requetes" element={<Requests />} />
              <Route path="/valve" element={<Valve />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/portail" element={<StudentPortal />} />
              <Route path="/verification-document" element={<DocumentVerification />} />
              <Route path="/travaux" element={<Assignments />} />
              <Route path="/mes-travaux" element={<StudentAssignments />} />
              <Route path="/changer-mot-de-passe" element={<ChangePassword />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
