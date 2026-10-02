import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@site/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ImageUpload from "./ImageUpload";
import RichTextEditor from "./RichTextEditor";

const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services" as any)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });

const AdminServices = () => {
  const queryClient = useQueryClient();
  const { data: services } = useServices();
  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: async (item: any) => {
      const { id, ...rest } = item;
      if (id) {
        const { error } = await supabase.from("services" as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services" as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const startNew = () =>
    setEditing({ name: "", slug: "", description: "", long_description: "", image_url: "", contact_email: "", display_order: 0, published: true });

  const startEdit = (s: any) => setEditing({ ...s });

  const handleSave = () => {
    if (!editing.name || !editing.slug) return;
    upsert.mutate(editing);
  };

  const items = services || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Gestion des Services</h2>
        <Button onClick={startNew} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Nom du service" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Slug (ex: rectorat)" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
          </div>
          <Textarea placeholder="Description courte" rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <RichTextEditor placeholder="Description détaillée (supporte **gras**, - puces, ## titres)" value={editing.long_description || ""} onChange={(v) => setEditing({ ...editing, long_description: v })} rows={10} />
          <Input type="number" placeholder="Ordre d'affichage" value={editing.display_order || 0} onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} />
          <ImageUpload value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} folder="services" />
          <Input placeholder="Email de contact du service" type="email" value={editing.contact_email || ""} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </div>
      )}

      {items.length === 0 && !editing && (
        <p className="text-center text-muted-foreground py-8">Aucun service configuré.</p>
      )}

      <div className="space-y-3">
        {items.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {s.image_url && (
                <div className="w-12 h-12 rounded-lg bg-muted/40 p-1 flex items-center justify-center">
                  <img src={s.image_url} alt={s.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-foreground">{s.name}</h3>
                <p className="text-muted-foreground text-sm">/{s.slug} • Ordre: {s.display_order}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(s.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminServices;
