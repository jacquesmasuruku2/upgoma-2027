import { useState, useRef } from "react";
import { useBlogArticles, useUpsertBlogArticle, useDeleteBlogArticle } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./ImageUpload";
import RichTextToolbar from "./RichTextToolbar";
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff } from "lucide-react";

interface FormData {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image_url: string;
  published: boolean;
  published_at: string;
}

const empty: FormData = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  author: "",
  image_url: "",
  published: false,
  published_at: "",
};

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : "");
const toDateLabel = (value?: string | null) => {
  if (!value) return "Date non définie";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleDateString("fr-FR");
};

const AdminBlog = () => {
  const { data: items, isLoading } = useBlogArticles();
  const upsert = useUpsertBlogArticle();
  const remove = useDeleteBlogArticle();
  const [editing, setEditing] = useState<FormData | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (!editing?.title) return;
    upsert.mutate(
      {
        ...editing,
        published_at: editing.published_at ? editing.published_at : null,
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Articles ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <Input placeholder="Titre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Catégorie" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <Input placeholder="Auteur" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            <Input
              type="date"
              value={editing.published_at}
              onChange={(e) => setEditing({ ...editing, published_at: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
              Publié
            </label>
          </div>
          <Textarea placeholder="Résumé..." value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} />
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Contenu de l&apos;article</label>
            <RichTextToolbar
              textareaRef={contentRef}
              value={editing.content}
              onChange={(content) => setEditing({ ...editing, content })}
            />
            <Textarea
              ref={contentRef}
              placeholder="Contenu complet… Utilisez les boutons ci-dessus ou la syntaxe directement."
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              <strong className="text-foreground">Syntaxe :</strong> **gras** ·{" "}
              <code className="bg-muted px-1 rounded">_italique_</code> · [texte](https://…) ·{" "}
              <code className="bg-muted px-1 rounded">- </code> puce · <code className="bg-muted px-1 rounded">1. </code> liste ·{" "}
              <code className="bg-muted px-1 rounded">## Titre</code> · par défaut le texte est{" "}
              <strong className="text-foreground">justifié</strong> sur le site ; boutons alignement ou première ligne{" "}
              <code className="bg-muted px-1 rounded">:::gauche</code> pour aligner à gauche.
            </p>
          </div>
          <ImageUpload value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} folder="blog" />
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
        {items?.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
            {a.image_url && (
              <div className="w-16 h-16 rounded bg-muted/40 p-1 shrink-0 flex items-center justify-center">
                <img src={a.image_url} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-foreground text-sm truncate">{a.title}</h4>
                {a.published ? <Eye className="w-3 h-3 text-green-600 shrink-0" /> : <EyeOff className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
              <p className="text-muted-foreground text-xs">{a.category} • {a.author}</p>
              <p className="text-muted-foreground text-xs">Publication : {toDateLabel(a.published_at)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => setEditing({ id: a.id, title: a.title, excerpt: a.excerpt || "", content: a.content || "", category: a.category || "", author: a.author || "", image_url: a.image_url || "", published: a.published || false, published_at: toDateInputValue(a.published_at) })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove.mutate(a.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBlog;
