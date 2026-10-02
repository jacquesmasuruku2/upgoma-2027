import { useState } from "react";
import { useCalendarEvents, useUpsertCalendarEvent, useDeleteCalendarEvent } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Save, X, CalendarDays } from "lucide-react";

interface FormData {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  category: string;
}

const empty: FormData = { title: "", description: "", event_date: "", end_date: "", category: "" };

const AdminCalendar = () => {
  const { data: items, isLoading } = useCalendarEvents();
  const upsert = useUpsertCalendarEvent();
  const remove = useDeleteCalendarEvent();
  const [editing, setEditing] = useState<FormData | null>(null);

  const handleSave = () => {
    if (!editing?.title || !editing?.event_date) return;
    upsert.mutate(
      { ...editing, end_date: editing.end_date || undefined },
      { onSuccess: () => setEditing(null) }
    );
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Calendrier ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <Input placeholder="Titre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input type="date" value={editing.event_date} onChange={(e) => setEditing({ ...editing, event_date: e.target.value })} />
            <Input type="date" placeholder="Date fin (optionnel)" value={editing.end_date} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} />
            <Input placeholder="Catégorie" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Détails de l'événement
            </label>
            <Textarea
              placeholder="Ajoutez les détails complets qui seront visibles quand on clique l'événement sur le site..."
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={5}
            />
          </div>
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
        {items?.map((e) => (
          <div key={e.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-upg-sky-light flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">{e.title}</h4>
              <p className="text-muted-foreground text-xs">{e.event_date}{e.end_date ? ` → ${e.end_date}` : ""} • {e.category}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => setEditing({ id: e.id, title: e.title, description: e.description || "", event_date: e.event_date, end_date: e.end_date || "", category: e.category || "" })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove.mutate(e.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCalendar;
