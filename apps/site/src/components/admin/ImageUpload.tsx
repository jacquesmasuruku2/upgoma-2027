import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@site/hooks/useSupabaseData";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder: string;
}

const ImageUpload = ({ value, onChange, folder }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("Image uploadée !");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de l'upload (détail dans la console).";
      console.error("[ImageUpload] Upload failed:", err);
      if (msg.includes("migration hors Supabase") || msg.includes("désactivé pendant")) {
        toast.warning("Le stockage d'image est temporairement désactivé pendant la migration hors Supabase. Pour continuer, collez simplement l'URL de l'image dans le champ ci-dessous.");
      } else {
        toast.error(msg);
      }
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted/40 p-1 flex items-center justify-center">
          <img src={value} alt="" className="max-w-full max-h-full object-contain" />
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-1" />
          {uploading ? "Upload..." : "Uploader"}
        </Button>
        <Input
          placeholder="Ou coller un lien d'image..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm h-9"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
