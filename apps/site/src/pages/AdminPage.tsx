import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  LogOut,
  Mail,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Inbox,
  Users,
  Newspaper,
  ImageIcon,
  CalendarDays,
  Banknote,
  Building2,
  BriefcaseBusiness,
  Library,
  GraduationCap,
  UserCog,
  Shield,
  Video,
  KeyRound,
  Handshake,
} from "lucide-react";
import { LOGO_UPG_SRC } from "@site/lib/brand";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { isEmailAllowedForAdminPortal } from "@site/config/adminAuth";
import { SITE_URL } from "@site/config/seo";
import AdminPersonnel from "@site/components/admin/AdminPersonnel";
import AdminBlog from "@site/components/admin/AdminBlog";
import AdminGallery from "@site/components/admin/AdminGallery";
import AdminCollege from "@site/components/admin/AdminCollege";
import AdminCalendar from "@site/components/admin/AdminCalendar";
import AdminFees from "@site/components/admin/AdminFees";
import AdminFaculties from "@site/components/admin/AdminFaculties";
import AdminServices from "@site/components/admin/AdminServices";
import AdminLibrary from "@site/components/admin/AdminLibrary";
import AdminVideos from "@site/components/admin/AdminVideos";
import AdminPartners from "@site/components/admin/AdminPartners";

/** Erreur serveur Supabase (SMTP / quota), pas un problème d’URL de redirection. */
function toastMagicLinkSendFailure(err: unknown) {
  console.error("[Admin OTP] signInWithOtp:", err);
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "";
  const looksLikeSmtp =
    /magic link|sending.*email|smtp|mailer|email.*send/i.test(msg) ||
    msg === "Error sending magic link email";

  if (looksLikeSmtp) {
    toast.error("Envoi d’e-mail refusé par Supabase", {
      description:
        "À configurer dans le projet Supabase : Authentication → Emails (SMTP personnalisé : Resend, SendGrid, etc.), quotas et journaux Logs → Auth. Les URL de redirection ne corrigent pas cette erreur.",
      duration: 18_000,
    });
    return;
  }
  toast.error(msg || "Impossible d’envoyer le lien de connexion.");
}

interface AdminPageProps {
  authorized?: boolean;
  logoSrc?: string;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const AdminPage = ({
  authorized = false,
  logoSrc = LOGO_UPG_SRC,
  activeSection,
  onSectionChange,
}: AdminPageProps) => {
  type UserRole = Tables<"user_roles">;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** Mot de passe : préféré tant que le SMTP / lien magique est indisponible. */
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [authStep, setAuthStep] = useState<"email" | "sent">("email");
  const [loggingIn, setLoggingIn] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState("personnel");
  const activeTab = activeSection ?? localActiveTab;
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesBusy, setRolesBusy] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "user">("moderator");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        checkAdminRole(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    if (authorized) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      if (error) throw error;
      setIsAdmin(data === true);
    } catch (err) {
      console.error("Role check failed:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const normalizedEmail = email.trim().toLowerCase();
  /** Toujours l’origine réelle du navigateur : le lien magique doit renvoyer sur le même domaine que la page (ex. .org vs .online), sinon Supabase rejette ou redirige vers une URL hors allowlist. */
  const adminRedirectBase =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : SITE_URL;

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedEmail) {
      toast.error("Indiquez votre adresse email.");
      return;
    }
    if (!password) {
      toast.error("Indiquez votre mot de passe.");
      return;
    }
    if (!isEmailAllowedForAdminPortal(normalizedEmail)) {
      toast.error("Cette adresse n'est pas autorisée pour l'espace administrateur.");
      return;
    }
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) throw error;
      toast.success("Connexion réussie.");
      setPassword("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Identifiants incorrects ou compte introuvable.";
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedEmail) {
      toast.error("Indiquez votre adresse email.");
      return;
    }
    if (!isEmailAllowedForAdminPortal(normalizedEmail)) {
      toast.error("Cette adresse n'est pas autorisée pour l'espace administrateur.");
      return;
    }
    setLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          // Force la redirection vers ton domaine (évite un lien "lovable" venant d’une config Supabase ancienne).
          emailRedirectTo: `${adminRedirectBase}/gestion-site`,
        },
      });
      if (error) throw error;
      toast.success("Vérifiez votre boîte de réception.");
      setAuthStep("sent");
    } catch (err: unknown) {
      toastMagicLinkSendFailure(err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(null);
    toast.success("Déconnexion réussie");
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("user_id", { ascending: true });
      if (error) throw error;
      setRoles(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible de charger les rôles.";
      toast.error(msg);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (!session || isAdmin !== true || activeTab !== "utilisateurs") return;
    void loadRoles();
  }, [session, isAdmin, activeTab]);

  const adminCount = useMemo(
    () => roles.filter((r) => String(r.role) === "admin").length,
    [roles],
  );

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    );

  const looksLikeEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleAddRole = async () => {
    const userRef = newUserId.trim();
    if (!userRef) {
      toast.error("Indiquez un ID ou un email.");
      return;
    }

    const alreadyExists = roles.some(
      (r) =>
        (r.user_id === userRef || String(r.user_id).toLowerCase() === userRef.toLowerCase()) &&
        String(r.role) === newRole,
    );
    if (alreadyExists) {
      toast.error("Ce rôle est déjà attribué à cet utilisateur.");
      return;
    }

    setRolesBusy(true);
    try {
      if (looksLikeEmail(userRef)) {
        const { error } = await supabase.rpc("assign_user_role_by_email", {
          p_email: userRef,
          p_role: newRole,
        });
        if (error) throw error;
      } else if (isUuid(userRef)) {
        // 1) Tentative directe: auth.users.id
        const { error: directError } = await supabase
          .from("user_roles")
          .insert({ user_id: userRef, role: newRole } as UserRole);

        if (!directError) {
          toast.success("Rôle attribué avec succès.");
          setNewUserId("");
          setNewRole("moderator");
          await loadRoles();
          return;
        }

        // 2) Fallback: ID de personnel -> résolution via email -> auth.users
        const { error: personnelError } = await supabase.rpc(
          "assign_user_role_by_personnel_id",
          {
            p_personnel_id: userRef,
            p_role: newRole,
          },
        );
        if (personnelError) {
          throw personnelError;
        }
      } else {
        toast.error("Format invalide: utilisez un email, un ID auth.users ou un ID personnel.");
        return;
      }

      toast.success("Rôle attribué avec succès.");
      setNewUserId("");
      setNewRole("moderator");
      await loadRoles();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.includes("violates foreign key constraint")
            ? "ID inconnu dans auth.users. Utilisez un email lié à un compte, ou un ID de personnel avec email."
            : err.message
          : "Erreur lors de l'attribution du rôle.";
      toast.error(msg);
    } finally {
      setRolesBusy(false);
    }
  };

  const handleDeleteRole = async (row: UserRole) => {
    if (String(row.role) === "admin" && row.user_id === session?.user?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre rôle admin.");
      return;
    }
    if (String(row.role) === "admin" && adminCount <= 1) {
      toast.error("Action refusée : il doit rester au moins un Super Admin.");
      return;
    }

    setRolesBusy(true);
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", row.id);
      if (error) throw error;
      toast.success("Rôle supprimé.");
      await loadRoles();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la suppression.";
      toast.error(msg);
    } finally {
      setRolesBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!session && !authorized) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[hsl(215,30%,8%)]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[hsl(25,90%,55%,0.08)] blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[hsl(210,70%,35%,0.08)] blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(210,50%,20%,0.05)] blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
          {/* Shield badge */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-[hsl(25,90%,55%,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src={logoSrc} alt="Logo UPG" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(145,60%,45%)] border-4 border-[hsl(215,30%,8%)] flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Espace <span className="bg-gradient-to-r from-[hsl(25,90%,55%)] to-[hsl(35,95%,60%)] bg-clip-text text-transparent">Administrateur</span>
            </h1>
            <p className="text-[hsl(210,15%,50%)] text-sm">
              {authStep === "email"
                ? loginMode === "password"
                  ? "Connexion avec email et mot de passe (défini dans Supabase Auth)"
                  : "Connexion par lien magique envoyé par email"
                : `Lien envoyé à ${normalizedEmail}`}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[hsl(215,25%,13%)] border border-[hsl(215,20%,20%)] rounded-3xl p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
            {authStep === "email" ? (
              <div className="space-y-5">
                <div className="flex rounded-xl bg-[hsl(215,20%,10%)] p-1 border border-[hsl(215,20%,22%)]">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("password");
                      setAuthStep("email");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      loginMode === "password"
                        ? "bg-[hsl(25,90%,55%)] text-white shadow-md"
                        : "text-[hsl(210,15%,55%)] hover:text-white"
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Mot de passe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("magic");
                      setAuthStep("email");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      loginMode === "magic"
                        ? "bg-[hsl(25,90%,55%)] text-white shadow-md"
                        : "text-[hsl(210,15%,55%)] hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Lien magique
                  </button>
                </div>

                {loginMode === "password" ? (
                  <form onSubmit={handlePasswordSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[hsl(210,15%,65%)] text-xs font-semibold uppercase tracking-wider pl-1 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </label>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[hsl(215,20%,10%)] border-[hsl(215,20%,22%)] text-white placeholder:text-[hsl(215,15%,35%)] h-12 rounded-xl pl-4 pr-4 text-sm focus:border-[hsl(25,90%,55%)] focus:ring-2 focus:ring-[hsl(25,90%,55%,0.15)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[hsl(210,15%,65%)] text-xs font-semibold uppercase tracking-wider pl-1 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        Mot de passe
                      </label>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[hsl(215,20%,10%)] border-[hsl(215,20%,22%)] text-white placeholder:text-[hsl(215,15%,35%)] h-12 rounded-xl pl-4 pr-4 text-sm focus:border-[hsl(25,90%,55%)] focus:ring-2 focus:ring-[hsl(25,90%,55%,0.15)]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/30"
                      disabled={loggingIn}
                    >
                      {loggingIn ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Connexion…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Se connecter
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                ) : (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[hsl(210,15%,65%)] text-xs font-semibold uppercase tracking-wider pl-1 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Adresse email autorisée
                  </label>
                  <div className="relative group">
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Ex. admin@upgoma.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[hsl(215,20%,10%)] border-[hsl(215,20%,22%)] text-white placeholder:text-[hsl(215,15%,35%)] h-12 rounded-xl pl-4 pr-4 text-sm focus:border-[hsl(25,90%,55%)] focus:ring-2 focus:ring-[hsl(25,90%,55%,0.15)] transition-all duration-300 hover:border-[hsl(215,20%,30%)]"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(25,90%,55%,0.1)] to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group text-sm tracking-wide"
                  disabled={loggingIn}
                >
                  {loggingIn ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Recevoir le lien de connexion
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  )}
                </Button>
              </form>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-[hsl(215,20%,10%)] border border-[hsl(215,20%,22%)] p-5 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <Inbox className="w-6 h-6 text-[hsl(25,90%,55%)]" />
                    </div>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    Vérifiez votre boîte de réception pour vous connecter : ouvrez le message et cliquez sur le lien magique
                    pour accéder au panneau d’administration.
                  </p>
                  <p className="text-[hsl(210,15%,55%)] text-xs leading-relaxed">
                    Si vous ne trouvez pas le message, vérifiez aussi vos courriers indésirables (spam).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthStep("email")}
                  className="w-full flex items-center justify-center gap-2 text-[hsl(210,15%,55%)] text-sm hover:text-white transition-colors py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Autre adresse email
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-[hsl(215,20%,18%)]">
              <div className="flex items-center justify-center gap-2 text-[hsl(210,15%,40%)] text-xs">
                <Lock className="w-3 h-3" />
                <span>Connexion sécurisée · Accès restreint</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[hsl(210,15%,30%)] text-xs mt-6 font-medium">
            © {new Date().getFullYear()} Université Polytechnique de Goma
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated but NOT admin
  if (isAdmin === false && !authorized) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[hsl(215,30%,8%)]">
        <div className="w-full max-w-[420px] text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Accès refusé</h1>
          <p className="text-[hsl(210,15%,50%)] text-sm mb-8">
            Votre compte n'a pas les permissions nécessaires pour accéder au panneau d'administration.
          </p>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="px-8"
          >
            <LogOut className="w-4 h-4 mr-2" /> Se déconnecter
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "blog", label: "Blog", icon: Newspaper },
    { id: "college", label: "Collège Étudiants", icon: GraduationCap },
    { id: "galerie", label: "Galerie", icon: ImageIcon },
    { id: "videos", label: "Vidéos", icon: Video },
    { id: "calendrier", label: "Calendrier", icon: CalendarDays },
    { id: "frais", label: "Frais", icon: Banknote },
    { id: "facultes", label: "Facultés", icon: Building2 },
    { id: "services", label: "Services", icon: BriefcaseBusiness },
    { id: "bibliotheque", label: "Bibliothèque", icon: Library },
    { id: "partenaires", label: "Partenaires", icon: Handshake },
    ...(!authorized ? [{ id: "utilisateurs", label: "Utilisateurs & Rôles", icon: UserCog }] : []),
  ];

  const changeTab = (section: string) => {
    setLocalActiveTab(section);
    onSectionChange?.(section);
  };

  return (
    <div className="min-h-screen bg-[#edf2ed] flex flex-col text-[#20352d]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#153d33] text-white px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-3 shadow-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={logoSrc} alt="Logo UPG" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover shrink-0" />
          <h1 className="text-base sm:text-xl font-bold tracking-wide truncate">
            <span className="text-[#f0c46b]">UPG</span> Administration
          </h1>
        </div>
        {!authorized && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 sm:px-5 py-2 shadow-md shrink-0"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        )}
      </header>

      <main className="mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 lg:pb-6 max-w-full w-full flex-1">
        {/* Sidebar-style tabs */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <nav
            className={`hidden lg:block shrink-0 transition-all duration-300 ${isSidebarExpanded ? "lg:w-64" : "lg:w-[84px]"}`}
            onMouseEnter={() => setIsSidebarExpanded(true)}
            onMouseLeave={() => setIsSidebarExpanded(false)}
          >
            <div className="bg-[#1d4b3e]/95 backdrop-blur rounded-xl p-2 flex flex-row lg:flex-col gap-1.5 shadow-md border border-[#12372e]/15 overflow-x-auto lg:overflow-visible no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`w-auto lg:w-full min-w-fit px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 lg:gap-3 ${
                    activeTab === tab.id
                      ? "bg-[#f0c46b] text-[#20352d] shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  title={tab.label}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span
                    className={`overflow-hidden transition-all duration-300 ${
                      isSidebarExpanded ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0 lg:opacity-0"
                    } lg:block hidden text-left`}
                  >
                    {tab.label}
                  </span>
                  <span className="lg:hidden text-xs sm:text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-3 sm:p-6 shadow-md min-h-[60vh]">
            {activeTab === "personnel" && <AdminPersonnel />}
            {activeTab === "blog" && <AdminBlog />}
            {activeTab === "college" && <AdminCollege />}
            {activeTab === "galerie" && <AdminGallery />}
            {activeTab === "videos" && <AdminVideos />}
            {activeTab === "calendrier" && <AdminCalendar />}
            {activeTab === "frais" && <AdminFees />}
            {activeTab === "facultes" && <AdminFaculties />}
            {activeTab === "services" && <AdminServices />}
            {activeTab === "bibliotheque" && <AdminLibrary />}
            {activeTab === "partenaires" && <AdminPartners />}
            {!authorized && activeTab === "utilisateurs" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Utilisateurs & Rôles</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gestion des comptes, droits d’accès et profils.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Attribuer un rôle (email, ID `auth.users.id` ou ID `personnel`)
                  </p>
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                    <Input
                      placeholder="Email ou UUID (auth.users / personnel)"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={newRole}
                      onChange={(e) =>
                        setNewRole(e.target.value as "admin" | "moderator" | "user")
                      }
                    >
                      <option value="admin">Super Admin</option>
                      <option value="moderator">Rédacteur</option>
                      <option value="user">Utilisateur</option>
                    </select>
                    <Button onClick={handleAddRole} disabled={rolesBusy}>
                      Ajouter
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Protections actives : anti-doublon, fallback ID personnel, pas de suppression
                    du dernier admin.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 text-sm font-medium flex items-center justify-between">
                    <span>Rôles actifs</span>
                    <span className="text-xs text-muted-foreground">
                      Super Admin: {adminCount}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {rolesLoading ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Chargement des rôles...
                      </div>
                    ) : roles.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Aucun rôle trouvé.
                      </div>
                    ) : (
                      roles.map((row) => {
                        const roleName =
                          String(row.role) === "admin"
                            ? "Super Admin"
                            : String(row.role) === "moderator"
                              ? "Rédacteur"
                              : "Utilisateur";
                        const rowIsProtected =
                          (String(row.role) === "admin" &&
                            row.user_id === session?.user?.id) ||
                          (String(row.role) === "admin" && adminCount <= 1);
                        return (
                          <div
                            key={row.id}
                            className="px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {row.user_id}
                              </p>
                              <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                                <Shield className="w-3.5 h-3.5 text-primary" />
                                {roleName}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={rolesBusy || rowIsProtected}
                              onClick={() => void handleDeleteRole(row)}
                            >
                              Retirer
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/15 bg-[#153d33] shadow-[0_-8px_24px_rgba(18,55,46,0.14)]">
        <div className="px-2 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => (
              <button
                key={`mobile-${tab.id}`}
                onClick={() => changeTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#f0c46b] text-[#20352d]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
                title={tab.label}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      <footer className="text-center text-xs text-[#c1d2ca] py-4 border-t border-white/10 bg-[#102e27]">
        © {new Date().getFullYear()} Université Polytechnique de Goma || All rights reserved — Jacques MASURUKU
      </footer>
    </div>
  );
};

export default AdminPage;
