import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Edit, FileUp, FileText } from "lucide-react";
import { useFees, useUpsertFee, useDeleteFee, uploadImage } from "@site/hooks/useSupabaseData";
import { toast } from "sonner";

const AdminFees = () => {
  const { data: fees, isLoading } = useFees();
  const upsert = useUpsertFee();
  const remove = useDeleteFee();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ faculty: "", cycle: "Licence", amount: 0, currency: "USD", description: "", pdf_url: "" });
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setForm({ faculty: "", cycle: "Licence", amount: 0, currency: "USD", description: "", pdf_url: "" });
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.faculty || !form.cycle) return;
    upsert.mutate(
      { ...form, ...(editing ? { id: editing.id } : {}) },
      { onSuccess: resetForm }
    );
  };

  const handleEdit = (fee: any) => {
    setEditing(fee);
    setForm({ faculty: fee.faculty, cycle: fee.cycle, amount: fee.amount, currency: fee.currency, description: fee.description || "", pdf_url: fee.pdf_url || "" });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, "fees-pdf");
      setForm({ ...form, pdf_url: url });
      toast.success("PDF uploadé !");
    } catch {
      toast.error("Erreur lors de l'upload du PDF");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Gestion des Frais</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input placeholder="Faculté" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
        <select
          value={form.cycle}
          onChange={(e) => setForm({ ...form, cycle: e.target.value })}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="Licence">Licence</option>
          <option value="Master">Master</option>
          <option value="Doctorat">Doctorat</option>
        </select>
        <Input type="number" placeholder="Montant" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        <Input placeholder="Devise" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer border border-border rounded-md px-3 py-2 text-sm bg-background hover:bg-secondary/50 transition-colors flex-1">
            <FileUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">
              {uploading ? "Upload..." : form.pdf_url ? "PDF ajouté ✓" : "Joindre PDF"}
            </span>
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
          </label>
          {form.pdf_url && (
            <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              <FileText className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={uploading}>
          {editing ? <Edit className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {editing ? "Modifier" : "Ajouter"}
        </Button>
        {editing && (
          <Button variant="outline" onClick={resetForm}>Annuler</Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Faculté</th>
              <th className="text-left p-3">Cycle</th>
              <th className="text-right p-3">Montant</th>
              <th className="text-center p-3">PDF</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees?.map((fee) => (
              <tr key={fee.id} className="border-t border-border hover:bg-secondary/50">
                <td className="p-3">{fee.faculty}</td>
                <td className="p-3">{fee.cycle}</td>
                <td className="p-3 text-right font-bold">{fee.amount} {fee.currency}</td>
                <td className="p-3 text-center">
                  {(fee as any).pdf_url ? (
                    <a href={(fee as any).pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Voir
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(fee)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove.mutate(fee.id)} className="text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!fees || fees.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun frais enregistré</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFees;
