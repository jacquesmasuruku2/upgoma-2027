import { useState, useRef } from "react";
import { useCollegePosts, useUpsertCollegePost, useDeleteCollegePost } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./ImageUpload";
import RichTextToolbar from "./RichTextToolbar";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

interface FormData {
  id?: string;
  title: string;
  content: string;
  author: string;
  image_url: string;
  published: boolean;
}

const empty: FormData = { title: "", content: "", author: "", image_url: "", published: false };

const AdminCollege = () => {
  const { data: items, isLoading } = useCollegePosts();
  const upsert = useUpsertCollegePost();
  const remove = useDeleteCollegePost();
  const [editing, setEditing] = useState<FormData | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (!editing?.title) return;
    upsert.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Publications du Collège ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <Input placeholder="Titre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Auteur" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
              Publié
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Contenu</label>
            <RichTextToolbar
              textareaRef={contentRef}
              value={editing.content}
              onChange={(content) => setEditing({ ...editing, content })}
            />
            <Textarea
              ref={contentRef}
              placeholder="Contenu… (même mise en forme que le blog)"
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Même syntaxe que les articles : **gras**, _italique_, <code className="bg-muted px-1 rounded">:::gauche</code> en première ligne pour
              aligner à gauche, sinon texte justifié sur le site.
            </p>
          </div>
          <ImageUpload value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} folder="college" />
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
          <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">{p.title}</h4>
              <p className="text-muted-foreground text-xs">{p.author} • {p.published ? "Publié" : "Brouillon"}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => setEditing({ id: p.id, title: p.title, content: p.content || "", author: p.author || "", image_url: p.image_url || "", published: p.published || false })}>
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

export default AdminCollege;
