import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Users, GraduationCap, CreditCard, BookOpen,
  ClipboardList, Bell, MessageSquare, Menu, LogOut, FileText, UserCog, CheckCircle, Globe, Settings
} from 'lucide-react';
import logoUpg from '@/assets/logo-upg.jpg';

const menuConfig: Record<string, { label: string; icon: any; path: string }[]> = {
  super_admin: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/system/dashboard' },
    { label: 'Gestion du site', icon: Globe, path: '/gestion-site/dashboard' },
    { label: 'Présences', icon: CheckCircle, path: '/system/presences' },
    { label: 'Étudiants', icon: GraduationCap, path: '/system/etudiants' },
    { label: 'Paiements', icon: CreditCard, path: '/system/paiements' },
    { label: 'Cours', icon: BookOpen, path: '/system/cours' },
    { label: 'Notes', icon: ClipboardList, path: '/system/notes' },
    { label: 'Travaux', icon: FileText, path: '/system/travaux' },
    { label: 'Utilisateurs', icon: UserCog, path: '/system/utilisateurs' },
    { label: 'Requêtes', icon: FileText, path: '/system/requetes' },
    { label: 'Valve', icon: Bell, path: '/system/valve' },
    { label: 'Chat', icon: MessageSquare, path: '/system/chat' },
    { label: 'Paramètres', icon: Settings, path: '/system/parametres' },
  ],
  appariteur: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/system/dashboard' },
    { label: 'Présences', icon: CheckCircle, path: '/system/presences' },
    { label: 'Étudiants', icon: GraduationCap, path: '/system/etudiants' },
    { label: 'Notes', icon: ClipboardList, path: '/system/notes' },
    { label: 'Requêtes', icon: FileText, path: '/system/requetes' },
    { label: 'Valve', icon: Bell, path: '/system/valve' },
    { label: 'Chat', icon: MessageSquare, path: '/system/chat' },
    { label: 'Paramètres', icon: Settings, path: '/system/parametres' },
  ],
  enseignant: [
    { label: 'Présences', icon: CheckCircle, path: '/system/presences' },
    { label: 'Cours', icon: BookOpen, path: '/system/cours' },
    { label: 'Notes', icon: ClipboardList, path: '/system/notes' },
    { label: 'Travaux', icon: FileText, path: '/system/travaux' },
    { label: 'Valve', icon: Bell, path: '/system/valve' },
    { label: 'Chat', icon: MessageSquare, path: '/system/chat' },
    { label: 'Paramètres', icon: Settings, path: '/system/parametres' },
  ],
  finance: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/system/dashboard' },
    { label: 'Paiements', icon: CreditCard, path: '/system/paiements' },
    { label: 'Chat', icon: MessageSquare, path: '/system/chat' },
    { label: 'Paramètres', icon: Settings, path: '/system/parametres' },
  ],
  etudiant: [
    { label: 'Mon Portail', icon: Users, path: '/system/portail' },
    { label: 'Mes Travaux', icon: ClipboardList, path: '/system/mes-travaux' },
    { label: 'Valve', icon: Bell, path: '/system/valve' },
    { label: 'Requêtes', icon: FileText, path: '/system/requetes' },
    { label: 'Chat', icon: MessageSquare, path: '/system/chat' },
    { label: 'Paramètres', icon: Settings, path: '/system/parametres' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadNotifications = async () => {
      const { data: allAnn } = await supabase.from('announcements').select('id');
      const { data: reads } = await supabase.from('announcement_reads').select('announcement_id').eq('user_id', user.id);
      const readSet = new Set(reads?.map((r: any) => r.announcement_id) || []);
      setUnreadAnnouncements((allAnn || []).filter(a => !readSet.has(a.id)).length);
    };
    loadNotifications();

    const ch1 = supabase.channel('layout-ann').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, () => loadNotifications()).subscribe();
    const ch2 = supabase.channel('layout-reads').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcement_reads' }, () => loadNotifications()).subscribe();
    const ch3 = supabase.channel('layout-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
      if (payload.new?.sender_id !== user.id) {
        setUnreadMessages(prev => prev + 1);
      }
    }).subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [user]);

  useEffect(() => {
    if (location.pathname === '/system/chat') setUnreadMessages(0);
  }, [location.pathname]);

  if (!user) return <Navigate to="/" replace />;

  const items = menuConfig[user.role] || [];

  const getBadge = (path: string) => {
    if (path === '/system/valve' && unreadAnnouncements > 0) return unreadAnnouncements;
    if (path === '/system/chat' && unreadMessages > 0) return unreadMessages;
    return 0;
  };

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <nav className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className={cn("p-3 border-b border-sidebar-border flex items-center gap-2", collapsed && "justify-center")}>
        <img src={logoUpg} alt="Logo UPG" className="w-8 h-8 rounded-full object-cover shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-sidebar-primary truncate">UPG</h2>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">{user.nom}</p>
          </div>
        )}
      </div>
      <div className="flex-1 py-2 overflow-y-auto">
        {items.map(item => {
          const badge = getBadge(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); setExpanded(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative",
                collapsed && "justify-center px-2",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <item.icon className="h-4 w-4" />
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5">{badge}</Badge>
              )}
            </button>
          );
        })}
      </div>
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      {!isMobile && (
        <>
          <div
            className="fixed left-0 top-0 h-full w-14 z-40 border-r border-sidebar-border bg-sidebar animate-fade-in"
            onMouseEnter={() => setExpanded(true)}
          >
            <NavContent collapsed />
          </div>
          {/* Expanded overlay with smooth animation */}
          <div
            className={cn(
              "fixed left-0 top-0 h-full z-50 shadow-xl border-r border-sidebar-border bg-sidebar transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded ? "w-56 opacity-100 translate-x-0" : "w-56 opacity-0 -translate-x-6 pointer-events-none"
            )}
            onMouseLeave={() => setExpanded(false)}
          >
            <NavContent />
          </div>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/5 transition-opacity duration-500",
              expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setExpanded(false)}
          />
          <div className="w-14 shrink-0" />
        </>
      )}

      <div className="flex-1 flex flex-col w-full min-w-0">
        <header className="h-14 border-b flex items-center px-4 bg-card sticky top-0 z-30">
          {isMobile && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-60">
                <NavContent />
              </SheetContent>
            </Sheet>
          )}
          <img src={logoUpg} alt="Logo UPG" className="w-7 h-7 rounded-full object-cover mr-2" />
          <h1 className="text-sm md:text-lg font-semibold text-primary truncate">
            Université Polytechnique de Goma
          </h1>
        </header>
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
