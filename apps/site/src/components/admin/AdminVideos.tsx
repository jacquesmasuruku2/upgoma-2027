import { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";
import { useDeleteVideo, useUpsertVideo, useVideos } from "@site/hooks/useSupabaseData";

interface FormData {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  poster_url: string;
  source_url: string;
  display_order: number;
  is_published: boolean;
}

const empty: FormData = {
  title: "",
  description: "",
  video_url: "",
  poster_url: "",
  source_url: "",
  display_order: 0,
  is_published: true,
};

const AdminVideos = () => {
  const { data: items, isLoading } = useVideos(false);
  const upsert = useUpsertVideo();
  const remove = useDeleteVideo();
  const [editing, setEditing] = useState<FormData | null>(null);

  const handleSave = () => {
    if (!editing?.title || !editing.video_url) return;
    upsert.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Vidéos ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {editing ? (
        <div className="space-y-3 rounded-lg border border-border bg-secondary p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              placeholder="Titre *"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Ordre d'affichage"
              value={editing.display_order}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  display_order: Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value),
                })
              }
            />
          </div>

          <Input
            placeholder="Description"
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
          <Input
            placeholder="Lien source (YouTube/Facebook) - optionnel"
            value={editing.source_url}
            onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
          />

          <VideoUpload
            value={editing.video_url}
            onChange={(url) => setEditing({ ...editing, video_url: url })}
            folder="videos"
          />

          <ImageUpload
            value={editing.poster_url}
            onChange={(url) => setEditing({ ...editing, poster_url: url })}
            folder="videos-posters"
          />

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
            />
            Publier sur le site
          </label>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
              <Save className="mr-1 h-4 w-4" /> Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
              <X className="mr-1 h-4 w-4" /> Annuler
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items?.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-lg border border-border">
            <div className="aspect-video w-full bg-black">
              <video
                src={v.video_url}
                poster={v.poster_url || undefined}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-medium text-foreground">{v.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{v.description || "Sans description"}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {v.is_published ? "Publié" : "Brouillon"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Vues: {v.views_count ?? 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({
                    id: v.id,
                    title: v.title,
                    description: v.description || "",
                    video_url: v.video_url,
                    poster_url: v.poster_url || "",
                    source_url: v.source_url || "",
                    display_order: v.display_order || 0,
                    is_published: v.is_published ?? true,
                  })}>
                    Modifier
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => remove.mutate(v.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminVideos;
