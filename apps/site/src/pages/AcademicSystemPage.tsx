import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const STUDENT_LOGIN_URL = "https://system.upgoma.org/login-etudiant";

const AcademicSystemPage = () => {
  const [params] = useSearchParams();
  const mode = params.get("mode") ?? "student";

  useEffect(() => {
    if (mode === "student") {
      window.location.href = STUDENT_LOGIN_URL;
      return;
    }

    if (mode === "system-admin2027") {
      window.location.href = "/systeme-academique/index.html?start=/";
      return;
    }

    window.location.href = STUDENT_LOGIN_URL;
  }, [mode]);

  return null;
};

export default AcademicSystemPage;
