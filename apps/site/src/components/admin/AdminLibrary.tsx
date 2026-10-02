import { useState } from "react";
import { useLibraryBooks, useUpsertLibraryBook, useDeleteLibraryBook, uploadImage } from "@site/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "./ImageUpload";
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

interface FormData {
  id?: string;
  title: string;
  author: string;
  description: string;
  category: string;
  pdf_url: string;
  cover_url: string;
  published: boolean;
  display_order: number;
}

const empty: FormData = { title: "", author: "", description: "", category: "", pdf_url: "", cover_url: "", published: false, display_order: 0 };

const AdminLibrary = () => {
  const { data: items, isLoading } = useLibraryBooks();
  const upsert = useUpsertLibraryBook();
  const remove = useDeleteLibraryBook();
  const [editing, setEditing] = useState<FormData | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handleSave = () => {
    if (!editing?.title) return;
    upsert.mutate(editing, { onSuccess: () => setEditing(null) });
  };

  const handlePdfUpload = async (file: File) => {
    if (!editing) return;
    setUploadingPdf(true);
    try {
      const url = await uploadImage(file, "library");
      setEditing({ ...editing, pdf_url: url });
      toast.success("PDF uploadé !");
    } catch {
      toast.error("Erreur lors de l'upload du PDF");
    } finally {
      setUploadingPdf(false);
    }
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Bibliothèque ({items?.length || 0})</h3>
        <Button size="sm" onClick={() => setEditing(empty)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter un livre
        </Button>
      </div>

      {editing && (
        <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
          <Input placeholder="Titre du livre *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Auteur" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
            <Input placeholder="Catégorie" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
              Publié
            </label>
          </div>
          <Textarea placeholder="Description..." value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
          
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Image de couverture</p>
            <ImageUpload value={editing.cover_url} onChange={(url) => setEditing({ ...editing, cover_url: url })} folder="library-covers" />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Fichier PDF</p>
            <div className="flex gap-2 items-center">
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
              <Button type="button" variant="outline" size="sm" onClick={() => pdfRef.current?.click()} disabled={uploadingPdf}>
                <Upload className="w-4 h-4 mr-1" />
                {uploadingPdf ? "Upload..." : "Uploader PDF"}
              </Button>
              <Input placeholder="Ou coller un lien PDF..." value={editing.pdf_url} onChange={(e) => setEditing({ ...editing, pdf_url: e.target.value })} className="text-sm h-9" />
            </div>
            {editing.pdf_url && (
              <a href={editing.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs mt-1 block hover:underline">
                Voir le PDF ↗
              </a>
            )}
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
        {items?.map((b: any) => (
          <div key={b.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
            {b.cover_url && (
              <div className="w-12 h-16 rounded bg-muted/40 p-1 shrink-0 flex items-center justify-center">
                <img src={b.cover_url} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-foreground text-sm truncate">{b.title}</h4>
                {b.published ? <Eye className="w-3 h-3 text-green-600 shrink-0" /> : <EyeOff className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
              <p className="text-muted-foreground text-xs">{b.author} • {b.category}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => setEditing({ id: b.id, title: b.title, author: b.author || "", description: b.description || "", category: b.category || "", pdf_url: b.pdf_url || "", cover_url: b.cover_url || "", published: b.published || false, display_order: b.display_order || 0 })}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove.mutate(b.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLibrary;
