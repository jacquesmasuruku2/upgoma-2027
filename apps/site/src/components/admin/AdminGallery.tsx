import { useState } from "react";
import { useGallery, useUpsertGallery, useDeleteGallery } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUpload from "./ImageUpload";
import { Plus, Trash2, Save, X } from "lucide-react";

interface FormData {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  display_order: number;
}

const empty: FormData = { title: "", description: "", image_url: "", category: "", display_order: 0 };

const AdminGallery = () => {
  const { data: items, isLoading } = useGallery();
  const upsert = useUpsertGallery();
  const remove = useDeleteGallery();
  const [editing, setEditing] = useState<FormData | null>(null);

  const handleSave = () => {
    if (!editing?.title || !editing?.image_url) return;
    upsert.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Galerie ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Titre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Catégorie" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
          </div>
          <Input placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <ImageUpload value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} folder="gallery" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
              <Save className="w-4 h-4 mr-1" /> Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
              <X className="w-4 h-4 mr-1" /> Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items?.map((g) => (
          <div key={g.id} className="relative group rounded-lg overflow-hidden border border-border">
            <div className="w-full h-32 bg-muted/40 p-1.5 flex items-center justify-center">
              <img src={g.image_url} alt={g.title} className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-foreground truncate">{g.title}</p>
              <p className="text-xs text-muted-foreground">{g.category}</p>
            </div>
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
              onClick={() => remove.mutate(g.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery;
