import { useSearchParams } from "react-router-dom";
import StudentLogin from "@/components/StudentLogin";

const AcademicSystemPage = () => {
  const [params] = useSearchParams();
  const mode = params.get("mode") ?? "student";

  // Pour le mode étudiant, utiliser le formulaire React moderne
  if (mode === "student") {
    return <StudentLogin />;
  }

  // Sécurité côté UI : on n'expose la connexion admin qu'avec une valeur explicite.
  // Par défaut, tout comportement inattendu -> page étudiant.
  const iframeSrc =
    mode === "system-admin2027"
      ? "/systeme-academique/index.html?start=/"
      : "/systeme-academique/index.html?start=/login-etudiant";

  return (
    <div className="min-h-screen bg-background">
      <iframe
        title="Systeme Academique UPG"
        src={iframeSrc}
        allow="camera"
        className="w-full h-screen bg-white border-0"
      />
    </div>
  );
};

export default AcademicSystemPage;
