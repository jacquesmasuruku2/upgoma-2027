import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { usePartners, useUpsertPartner, useDeletePartner } from "@site/hooks/useSupabaseData";
import ImageUpload from "./ImageUpload";

const AdminPartners = () => {
  const { data: partners } = usePartners();
  const upsert = useUpsertPartner();
  const remove = useDeletePartner();

  const [editing, setEditing] = useState<any | null>(null);

  const startNew = () => {
    setEditing({
      name: "",
      description: "",
      website_url: "",
      logo_url: "",
      display_order: 0,
      is_active: true,
    });
  };

  const startEdit = (partner: any) => {
    setEditing({ ...partner });
  };

  const handleSave = () => {
    if (!editing.name) {
      toast.error("Veuillez remplir le nom du partenaire.");
      return;
    }
    const payload = { ...editing };
    if (!payload.id) delete payload.id;
    upsert.mutate(payload, { onSuccess: () => setEditing(null) });
  };

  const items = partners || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Gestion des Partenaires</h2>
        <Button onClick={startNew} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 mb-6 space-y-4">
          <div>
            <Label htmlFor="partner-name">Nom du partenaire *</Label>
            <Input
              id="partner-name"
              placeholder="Ex: Université de Goma"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="partner-description">Description</Label>
            <Textarea
              id="partner-description"
              placeholder="Description courte du partenaire..."
              rows={2}
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="partner-website">Site web</Label>
            <Input
              id="partner-website"
              type="url"
              placeholder="https://..."
              value={editing.website_url || ""}
              onChange={(e) => setEditing({ ...editing, website_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="partner-order">Ordre d'affichage</Label>
            <Input
              id="partner-order"
              type="number"
              placeholder="0"
              value={editing.display_order || 0}
              onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="partner-active"
              checked={editing.is_active !== false}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              className="accent-blue-600"
            />
            <Label htmlFor="partner-active" className="cursor-pointer">Partenaire actif</Label>
          </div>

          <ImageUpload
            value={editing.logo_url}
            onChange={(url) => setEditing({ ...editing, logo_url: url })}
            folder="partners"
          />

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !editing && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucun partenaire configuré.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((partner: any) => (
          <div key={partner.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {partner.logo_url && (
                <div className="w-16 h-16 rounded-lg bg-muted/40 p-2 flex items-center justify-center">
                  <img src={partner.logo_url} alt={partner.name} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-foreground">{partner.name}</h3>
                {partner.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{partner.description}</p>
                )}
                {partner.website_url && (
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    {partner.website_url}
                  </a>
                )}
                {!partner.is_active && (
                  <span className="inline-block ml-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                    Inactif
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => startEdit(partner)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(partner.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPartners;
