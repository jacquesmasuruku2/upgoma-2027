import { useEffect, useState } from "react";
import { Mail, RefreshCw, Search, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@site/integrations/supabase/client";
import { SITE_URL } from "@site/config/seo";
import { toast } from "sonner";

interface NewsletterSubscriber {
  id: string;
  name: string;
  email: string;
  confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

interface CampaignSource {
  id: string;
  title: string;
  excerpt?: string | null;
  content: string;
  image_url?: string | null;
}

interface NewsletterCampaign {
  id: string;
  source_type: "blog" | "communique" | "custom";
  title: string;
  subject: string;
  status: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
}

type CampaignSourceType = "blog" | "communique" | "custom";

const emptyCampaign = { title: "", subject: "", body: "", sourceUrl: "", imageUrl: "" };

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [blogs, setBlogs] = useState<CampaignSource[]>([]);
  const [announcements, setAnnouncements] = useState<CampaignSource[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [sourceType, setSourceType] = useState<CampaignSourceType>("custom");
  const [sourceId, setSourceId] = useState("");
  const [campaign, setCampaign] = useState(emptyCampaign);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/newsletter", { credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible de charger la newsletter.");
      setSubscribers(result.subscribers || []);
      setAccessError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger la newsletter.";
      setAccessError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/admin/newsletter/campaigns", { credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible de charger les campagnes.");
      setCampaigns(result.campaigns || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les campagnes.";
      setAccessError(message);
      toast.error(message);
    }
  };

  const loadSources = async () => {
    setSourcesLoading(true);
    try {
      const [blogResult, announcementResponse] = await Promise.all([
        supabase.from("blog_articles" as any).select("id,title,excerpt,content,image_url").eq("published", true).order("published_at", { ascending: false }),
        fetch("/api/admin/newsletter/sources", { credentials: "include" }),
      ]);
      if (blogResult.error) throw blogResult.error;
      const announcementResult = await announcementResponse.json().catch(() => ({}));
      if (!announcementResponse.ok) throw new Error(announcementResult.error || "Impossible de charger les communiqués.");
      setBlogs((blogResult.data || []) as CampaignSource[]);
      setAnnouncements((announcementResult.announcements || []) as CampaignSource[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger les contenus source.";
      setAccessError(message);
      toast.error(message);
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscribers();
    void loadCampaigns();
    void loadSources();
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleSubscribers = subscribers.filter((subscriber) =>
    `${subscriber.name} ${subscriber.email}`.toLocaleLowerCase().includes(normalizedSearch),
  );
  const confirmedCount = subscribers.filter((subscriber) => subscriber.confirmed).length;
  const activeCount = subscribers.filter((subscriber) => subscriber.confirmed && !subscriber.unsubscribed_at).length;

  const selectSource = (value: string) => {
    if (value === "custom") {
      setSourceType("custom");
      setSourceId("");
      setCampaign(emptyCampaign);
      return;
    }
    const [type, id] = value.split(":") as [Exclude<CampaignSourceType, "custom">, string];
    const source = type === "blog" ? blogs.find((item) => item.id === id) : announcements.find((item) => item.id === id);
    if (!source) return;

    const publicBase = (import.meta.env.VITE_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
    setSourceType(type);
    setSourceId(id);
    setCampaign({
      title: source.title,
      subject: source.title.slice(0, 180),
      body: type === "blog" ? source.excerpt || source.content : source.content,
      sourceUrl: type === "blog" ? `${publicBase}/blog?article=${encodeURIComponent(id)}` : "",
      imageUrl: source.image_url || "",
    });
  };

  const sendCampaign = async () => {
    if (!campaign.title.trim() || !campaign.subject.trim() || !campaign.body.trim()) {
      toast.error("Renseigne le titre, l’objet et le contenu de la campagne.");
      return;
    }
    if (!activeCount) {
      toast.error("Aucun abonné confirmé et actif à contacter.");
      return;
    }
    if (!window.confirm(`Envoyer cette newsletter à ${activeCount} abonné(s) confirmé(s) ?`)) return;

    setSending(true);
    try {
      const response = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId: sourceId || null,
          title: campaign.title,
          subject: campaign.subject,
          body: campaign.body,
          sourceUrl: campaign.sourceUrl,
          imageUrl: campaign.imageUrl,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "L’envoi de la newsletter a échoué.");
      toast.success(`Campagne envoyée : ${result.sent}/${result.recipientCount} message(s).${result.failed ? ` Échecs : ${result.failed}.` : ""}`);
      setCampaign(emptyCampaign);
      setSourceType("custom");
      setSourceId("");
      await Promise.all([loadCampaigns(), loadSubscribers()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L’envoi de la newsletter a échoué.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Gestion du site</p>
          <h2 className="text-2xl font-bold">Newsletter</h2>
          <p className="mt-1 text-sm text-muted-foreground">Inscrits et état de confirmation.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => { void loadSubscribers(); void loadCampaigns(); }} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </header>

      {accessError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{accessError} Les données ne sont pas affichées comme si la liste était vide.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          <Users className="h-5 w-5 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total des inscriptions</p><p className="text-xl font-semibold">{accessError ? "—" : subscribers.length}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          <Mail className="h-5 w-5 text-primary" />
          <div><p className="text-xs text-muted-foreground">Abonnés actifs confirmés</p><p className="text-xl font-semibold">{accessError ? "—" : activeCount}</p></div>
        </div>
      </div>

      <section className="space-y-4 rounded-lg border border-border bg-background p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-semibold">Nouvelle campagne</h3>
          <p className="text-sm text-muted-foreground">Choisis un contenu publié ou compose un message personnalisé.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="newsletter-source">Contenu source</Label>
            <Select value={sourceType === "custom" ? "custom" : `${sourceType}:${sourceId}`} onValueChange={selectSource}>
              <SelectTrigger id="newsletter-source"><SelectValue placeholder="Choisir un contenu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Message personnalisé</SelectItem>
                {blogs.length > 0 && <SelectItem value="blog:__group" disabled>Articles publiés</SelectItem>}
                {blogs.map((blog) => <SelectItem key={`blog:${blog.id}`} value={`blog:${blog.id}`}>{blog.title}</SelectItem>)}
                {announcements.length > 0 && <SelectItem value="communique:__group" disabled>Communiqués</SelectItem>}
                {announcements.map((announcement) => <SelectItem key={`communique:${announcement.id}`} value={`communique:${announcement.id}`}>{announcement.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {sourcesLoading && <p className="text-xs text-muted-foreground">Chargement des contenus...</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletter-title">Titre interne</Label>
            <Input id="newsletter-title" maxLength={200} value={campaign.title} onChange={(event) => setCampaign({ ...campaign, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletter-subject">Objet de l’email</Label>
            <Input id="newsletter-subject" maxLength={180} value={campaign.subject} onChange={(event) => setCampaign({ ...campaign, subject: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="newsletter-body">Message</Label>
            <Textarea id="newsletter-body" maxLength={50000} rows={9} value={campaign.body} onChange={(event) => setCampaign({ ...campaign, body: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletter-image">URL de l’image (facultatif)</Label>
            <Input id="newsletter-image" type="url" value={campaign.imageUrl} onChange={(event) => setCampaign({ ...campaign, imageUrl: event.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newsletter-link">Lien du contenu (facultatif)</Label>
            <Input id="newsletter-link" type="url" value={campaign.sourceUrl} onChange={(event) => setCampaign({ ...campaign, sourceUrl: event.target.value })} placeholder="https://..." />
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Aperçu</p>
          <h4 className="mt-2 text-lg font-semibold">{campaign.title || "Titre de la newsletter"}</h4>
          {campaign.imageUrl && <img src={campaign.imageUrl} alt="" className="mt-3 max-h-64 w-full object-cover" />}
          <p className="mt-3 whitespace-pre-wrap text-sm">{campaign.body || "Le contenu du message apparaîtra ici."}</p>
          {campaign.sourceUrl && <p className="mt-3 break-all text-xs text-primary">{campaign.sourceUrl}</p>}
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Chaque message inclura un lien de désabonnement personnel.</p>
        </div>
        <Button type="button" onClick={() => void sendCampaign()} disabled={Boolean(accessError) || sending || !activeCount || !campaign.title.trim() || !campaign.subject.trim() || !campaign.body.trim()}>
          <Send className="mr-2 h-4 w-4" />{sending ? "Envoi en cours..." : `Envoyer à ${activeCount} abonné(s)`}
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Historique des campagnes</h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Campagne</th><th className="px-4 py-3 font-medium">Objet</th><th className="px-4 py-3 font-medium">État</th><th className="px-4 py-3 font-medium">Envoyés</th><th className="px-4 py-3 font-medium">Date</th></tr></thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.title}</td><td className="px-4 py-3">{item.subject}</td><td className="px-4 py-3"><Badge variant={item.status === "sent" ? "default" : item.status === "failed" ? "destructive" : "secondary"}>{item.status === "sent" ? "Envoyée" : item.status === "partial" ? "Partielle" : item.status === "failed" ? "Échec" : "En cours"}</Badge></td><td className="px-4 py-3">{item.sent_count}/{item.recipient_count}{item.failed_count ? ` · ${item.failed_count} échec(s)` : ""}</td><td className="px-4 py-3">{formatDate(item.created_at)}</td></tr>)}
              {!accessError && campaigns.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucune campagne envoyée.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un nom ou un email" className="pl-9" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr><th className="px-4 py-3 font-medium">Nom</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">État</th><th className="px-4 py-3 font-medium">Inscription</th><th className="px-4 py-3 font-medium">Confirmation</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleSubscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="px-4 py-3 font-medium">{subscriber.name}</td>
                <td className="px-4 py-3">{subscriber.email}</td>
                <td className="px-4 py-3"><Badge variant={subscriber.unsubscribed_at ? "destructive" : subscriber.confirmed ? "default" : "secondary"}>{subscriber.unsubscribed_at ? "Désabonné" : subscriber.confirmed ? "Confirmé" : "En attente"}</Badge></td>
                <td className="px-4 py-3">{formatDate(subscriber.created_at)}</td>
                <td className="px-4 py-3">{formatDate(subscriber.confirmed_at)}</td>
              </tr>
            ))}
            {!loading && !accessError && visibleSubscribers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{search ? "Aucun résultat." : "Aucune inscription pour le moment."}</td></tr>
            )}
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Chargement...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}