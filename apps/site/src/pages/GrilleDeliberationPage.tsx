import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

const STUDENT_LOGIN_URL = "https://system.upgoma.org/login-etudiant";

const GrilleDeliberationPage = () => {
  useEffect(() => {
    window.location.href = STUDENT_LOGIN_URL;
  }, []);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">
            Redirection vers la page de connexion étudiant…
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default GrilleDeliberationPage;
