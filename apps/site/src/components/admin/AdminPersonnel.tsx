import { useState } from "react";
import { usePersonnel, usePublishedServiceOptions, useUpsertPersonnel, useDeletePersonnel } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./ImageUpload";
import { Plus, Pencil, Trash2, Save, X, Linkedin, Mail } from "lucide-react";

interface FormData {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  display_order: number;
  email: string;
  linkedin_url: string;
  service_slug: string;
}

const empty: FormData = { name: "", role: "", bio: "", photo_url: "", display_order: 0, email: "", linkedin_url: "", service_slug: "" };

const AdminPersonnel = () => {
  const { data: items, isLoading } = usePersonnel();
  const { data: services = [] } = usePublishedServiceOptions();
  const upsert = useUpsertPersonnel();
  const remove = useDeletePersonnel();
  const [editing, setEditing] = useState<FormData | null>(null);

  const handleSave = () => {
    if (!editing?.name || !editing?.role) return;
    upsert.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Personnel ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Nom complet *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Fonction/Rôle *" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="pl-10" />
            </div>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Lien LinkedIn" value={editing.linkedin_url} onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })} className="pl-10" />
            </div>
          </div>
          <Textarea placeholder="Biographie..." value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} rows={3} />
          <label className="block space-y-1 text-sm font-medium text-foreground">
            Service associé
            <select
              value={editing.service_slug}
              onChange={(e) => setEditing({ ...editing, service_slug: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
            >
              <option value="">Aucun service associé</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>{service.name}</option>
              ))}
            </select>
          </label>
          <ImageUpload value={editing.photo_url} onChange={(url) => setEditing({ ...editing, photo_url: url })} folder="personnel" />
          <Input type="number" placeholder="Ordre d'affichage" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className="w-32" />
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

      <div className="space-y-3">
        {items?.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            {p.photo_url ? (
              <div className="w-12 h-12 rounded-full bg-muted/40 p-1 flex items-center justify-center overflow-hidden">
                <img src={p.photo_url} alt={p.name} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-upg-sky-light flex items-center justify-center text-primary font-bold">
                {p.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
              <p className="text-muted-foreground text-xs">{p.role}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing({
                id: p.id, name: p.name, role: p.role, bio: p.bio || "", photo_url: p.photo_url || "",
                display_order: p.display_order || 0, email: (p as any).email || "", linkedin_url: (p as any).linkedin_url || "",
                service_slug: (p as any).service_slug || ""
              })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove.mutate(p.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPersonnel;
