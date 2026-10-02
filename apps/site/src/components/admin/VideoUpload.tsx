import { useRef, useState } from "react";
import { Upload, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadVideo } from "@site/hooks/useSupabaseData";
import { toast } from "sonner";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder: string;
}

const VideoUpload = ({ value, onChange, folder }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadVideo(file, folder);
      onChange(url);
      toast.success("Vidéo uploadée !");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Erreur lors de l'upload vidéo (détail dans la console).";
      console.error("[VideoUpload] Upload failed:", err);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
          <video src={value} className="h-32 w-full rounded object-cover" controls preload="metadata" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            aria-label="Retirer la vidéo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="video/*,.mp4,.webm,.ogg,.ogv,.mov,.m4v,.avi,.mkv"
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
          <Upload className="mr-1 h-4 w-4" />
          {uploading ? "Upload..." : "Uploader"}
        </Button>
        <Input
          placeholder="Ou coller un lien vidéo (URL publique)..."
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Formats courants pris en charge: MP4, WebM, OGG, MOV, AVI, MKV.
      </p>
    </div>
  );
};

export default VideoUpload;
