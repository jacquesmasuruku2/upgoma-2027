import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Personnel
export const usePersonnel = () =>
  useQuery({
    queryKey: ["personnel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personnel")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertPersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      name: string;
      role: string;
      bio?: string;
      photo_url?: string;
      display_order?: number;
      email?: string;
      linkedin_url?: string;
    }) => {
      const { error } = item.id
        ? await supabase.from("personnel").update(item as any).eq("id", item.id)
        : await supabase.from("personnel").insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personnel"] });
      toast.success("Personnel sauvegardé !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeletePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personnel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personnel"] });
      toast.success("Personnel supprimé !");
    },
  });
};

// Blog articles
export const useBlogArticles = (publishedOnly = false) =>
  useQuery({
    queryKey: ["blog_articles", publishedOnly],
    queryFn: async () => {
      let q = supabase.from("blog_articles").select("*").order("published_at", { ascending: false });
      if (publishedOnly) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

export const useUpsertBlogArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      excerpt?: string;
      content?: string;
      category?: string;
      author?: string;
      image_url?: string;
      published?: boolean;
      published_at?: string | null;
    }) => {
      const { error } = item.id
        ? await supabase.from("blog_articles").update(item).eq("id", item.id)
        : await supabase.from("blog_articles").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_articles"] });
      toast.success("Article sauvegardé !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteBlogArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_articles"] });
      toast.success("Article supprimé !");
    },
  });
};

export const useIncrementBlogArticleViews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase.rpc("increment_blog_article_views", { p_article_id: articleId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_articles"] });
    },
  });
};

export const useIncrementBlogArticleLikes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase.rpc("increment_blog_article_likes", { p_article_id: articleId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_articles"] });
      toast.success("Merci pour votre like !");
    },
    onError: () => toast.error("Impossible d'ajouter le like"),
  });
};

// Blog comments
export const useComments = (articleId: string) =>
  useQuery({
    queryKey: ["blog_comments", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments" as any)
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { article_id: string; author_name: string; content: string; author_email?: string }) => {
      const { error } = await supabase.from("blog_comments" as any).insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog_comments"] });
      toast.success("Commentaire ajouté !");
    },
    onError: () => toast.error("Erreur lors de l'ajout du commentaire"),
  });
};

// Gallery
export const useGallery = () =>
  useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertGallery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      description?: string;
      image_url: string;
      category?: string;
      display_order?: number;
    }) => {
      const { error } = item.id
        ? await supabase.from("gallery").update(item).eq("id", item.id)
        : await supabase.from("gallery").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image sauvegardée !");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de la sauvegarde";
      console.error("[useUpsertGallery] save failed:", err);
      toast.error(msg);
    },
  });
};

export const useDeleteGallery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image supprimée !");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de la suppression";
      console.error("[useDeleteGallery] delete failed:", err);
      toast.error(msg);
    },
  });
};

// Videos
export const useVideos = (publishedOnly = true) =>
  useQuery({
    queryKey: ["videos", publishedOnly],
    queryFn: async () => {
      let q = supabase
        .from("videos")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (publishedOnly) q = q.eq("is_published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

export const useUpsertVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      description?: string;
      video_url: string;
      poster_url?: string;
      source_url?: string;
      display_order?: number;
      is_published?: boolean;
    }) => {
      const { error } = item.id
        ? await supabase.from("videos").update(item).eq("id", item.id)
        : await supabase.from("videos").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Vidéo sauvegardée !");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de la sauvegarde de la vidéo";
      console.error("[useUpsertVideo] save failed:", err);
      toast.error(msg);
    },
  });
};

export const useDeleteVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Vidéo supprimée !");
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de la suppression de la vidéo";
      console.error("[useDeleteVideo] delete failed:", err);
      toast.error(msg);
    },
  });
};

export const useIncrementVideoViews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.rpc("increment_video_views", { p_video_id: videoId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
};

// College posts
export const useCollegePosts = (publishedOnly = false) =>
  useQuery({
    queryKey: ["college_posts", publishedOnly],
    queryFn: async () => {
      let q = supabase.from("college_posts").select("*").order("created_at", { ascending: false });
      if (publishedOnly) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

export const useUpsertCollegePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      content?: string;
      author?: string;
      image_url?: string;
      published?: boolean;
    }) => {
      const { error } = item.id
        ? await supabase.from("college_posts").update(item).eq("id", item.id)
        : await supabase.from("college_posts").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college_posts"] });
      toast.success("Publication sauvegardée !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteCollegePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("college_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college_posts"] });
      toast.success("Publication supprimée !");
    },
  });
};

export const useIncrementCollegePostViews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("increment_college_post_views", { p_post_id: postId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college_posts"] });
    },
  });
};

export const useIncrementCollegePostLikes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("increment_college_post_likes", { p_post_id: postId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college_posts"] });
      toast.success("Merci pour votre like !");
    },
    onError: () => toast.error("Impossible d'ajouter le like"),
  });
};

// Calendar events
export const useCalendarEvents = () =>
  useQuery({
    queryKey: ["calendar_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      description?: string;
      event_date: string;
      end_date?: string;
      category?: string;
    }) => {
      const { error } = item.id
        ? await supabase.from("calendar_events").update(item).eq("id", item.id)
        : await supabase.from("calendar_events").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success("Événement sauvegardé !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteCalendarEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      toast.success("Événement supprimé !");
    },
  });
};

// Fees
export const useFees = () =>
  useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      faculty: string;
      cycle: string;
      amount: number;
      currency?: string;
      description?: string;
      display_order?: number;
      pdf_url?: string;
    }) => {
      const { error } = item.id
        ? await supabase.from("fees").update(item).eq("id", item.id)
        : await supabase.from("fees").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Frais sauvegardés !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      toast.success("Frais supprimés !");
    },
  });
};

// Faculty content
export const useFacultyContent = (slug?: string) =>
  useQuery({
    queryKey: ["faculty_content", slug],
    queryFn: async () => {
      if (slug) {
        const { data, error } = await supabase
          .from("faculty_content" as any)
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("faculty_content" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useAllFacultyContent = () =>
  useQuery({
    queryKey: ["faculty_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty_content" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

export const useUpsertFacultyContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      slug: string;
      name: string;
      full_name: string;
      description?: string;
      long_description?: string;
      departments?: string[];
      image_url?: string;
    }) => {
      const payload = {
        slug: item.slug,
        name: item.name,
        full_name: item.full_name,
        description: item.description ?? null,
        long_description: item.long_description ?? null,
        departments: item.departments ?? [],
        image_url: item.image_url ?? null,
      };
      const { error } = item.id
        ? await supabase.from("faculty_content" as any).update(payload).eq("id", item.id)
        : await supabase.from("faculty_content" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty_content"] });
      toast.success("Faculté sauvegardée !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteFacultyContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faculty_content" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty_content"] });
      toast.success("Faculté supprimée !");
    },
  });
};

// Library books
export const useLibraryBooks = (publishedOnly = false) =>
  useQuery({
    queryKey: ["library_books", publishedOnly],
    queryFn: async () => {
      let q = supabase.from("library_books" as any).select("*").order("display_order", { ascending: true });
      if (publishedOnly) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

export const useUpsertLibraryBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      title: string;
      author?: string;
      description?: string;
      category?: string;
      pdf_url?: string;
      cover_url?: string;
      published?: boolean;
      display_order?: number;
    }) => {
      const { error } = item.id
        ? await supabase.from("library_books" as any).update(item).eq("id", item.id)
        : await supabase.from("library_books" as any).insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library_books"] });
      toast.success("Livre sauvegardé !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeleteLibraryBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_books" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library_books"] });
      toast.success("Livre supprimé !");
    },
  });
};

// Image upload via backend
const uploadToServer = async (file: File, type: "image" | "document", folder: string): Promise<string> => {
  const apiBase = (import.meta.env.VITE_ADMISSION_API_BASE || "http://127.0.0.1:8787").replace(/\/$/, "");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("folder", folder);

  const response = await fetch(`${apiBase}/api/uploads`, { method: "POST", body: formData });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result?.url) {
    throw new Error(result?.error || `Upload ${type} impossible.`);
  }

  return String(result.url);
};

export const uploadImage = async (file: File, folder: string): Promise<string> =>
  uploadToServer(file, "image", folder);

export const uploadVideo = async (file: File, folder: string): Promise<string> =>
  uploadToServer(file, "document", folder);

export const uploadPdf = async (file: File, folder: string): Promise<string> =>
  uploadToServer(file, "document", folder);

// Partners
export const usePartners = () =>
  useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertPartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      name: string;
      description?: string;
      website_url?: string;
      logo_url?: string;
      display_order?: number;
      is_active?: boolean;
    }) => {
      const { error } = item.id
        ? await supabase.from("partners").update(item).eq("id", item.id)
        : await supabase.from("partners").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partenaire sauvegardé !");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
};

export const useDeletePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partenaire supprimé !");
    },
  });
};

// Partnership Requests
export const usePartnershipRequests = () =>
  useQuery({
    queryKey: ["partnership_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partnership_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useUpsertPartnershipRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id?: string;
      organization_name: string;
      organization_type: string;
      organization_type_other?: string;
      headquarters?: string;
      website_url?: string;
      sector?: string;
      contact_name: string;
      contact_position?: string;
      contact_email: string;
      contact_phone?: string;
      interests: string[];
      objectives?: string;
      resources?: string;
      duration?: string;
      letter_of_intent_url?: string;
      logo_url?: string;
      status?: string;
      notes?: string;
    }) => {
      const { error } = item.id
        ? await supabase.from("partnership_requests").update(item).eq("id", item.id)
        : await supabase.from("partnership_requests").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partnership_requests"] });
      toast.success("Demande de partenariat sauvegardée !");
    },
    onError: (err: any) => {
      const msg = err?.message || err?.error_description || "Erreur lors de la sauvegarde";
      toast.error(msg);
      console.error("[useUpsertPartnershipRequest]", err);
    },
  });
};

export const useDeletePartnershipRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partnership_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partnership_requests"] });
      toast.success("Demande supprimée !");
    },
  });
};
