import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

type UnsubscribeStatus = "loading" | "success" | "error";

export default function UnsubscribeNewsletter() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => setStatus(response.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <Layout>
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="max-w-md space-y-4 text-center">
          {status === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
          {status === "success" && <CheckCircle className="mx-auto h-14 w-14 text-green-600" />}
          {status === "error" && <XCircle className="mx-auto h-14 w-14 text-destructive" />}
          <h1 className="text-2xl font-bold">
            {status === "loading" ? "Traitement en cours..." : status === "success" ? "Désabonnement confirmé" : "Lien invalide"}
          </h1>
          {status !== "loading" && (
            <p className="text-muted-foreground">
              {status === "success"
                ? "Cette adresse ne recevra plus les newsletters de l’UPG."
                : "Ce lien de désabonnement est invalide. Contactez-nous si vous avez besoin d’aide."}
            </p>
          )}
          {status !== "loading" && <Button asChild variant="outline"><Link to="/">Retour à l’accueil</Link></Button>}
        </div>
      </section>
    </Layout>
  );
}