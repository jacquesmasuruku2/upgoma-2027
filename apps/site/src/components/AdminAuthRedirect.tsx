import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Les liens de connexion admin doivent aboutir dans le système local, pas sur une route publique du site.
 */
export default function AdminAuthRedirect() {
  const location = useLocation();
  const lastRedirectUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const wantsAdminRedirect =
      location.hash.includes("access_token=") ||
      location.hash.includes("provider_token=") ||
      location.search.includes("access_token=") ||
      location.search.includes("provider_token=");

    if (!wantsAdminRedirect) return;

    let isCancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;

      // Evite les boucles si React refresh / navigation.
      if (lastRedirectUserIdRef.current === userId) return;

      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (isCancelled) return;

      if (!error && isAdmin === true) {
        lastRedirectUserIdRef.current = userId;
        // On évite la route publique /admin et on redirige vers le système local.
        if (!location.pathname.startsWith("/admin")) {
          window.location.href = "http://localhost:5174/gestion-site";
        }
      }
    })().catch(() => {
      // On ne casse pas l'app si la vérification RPC échoue.
    });

    return () => {
      isCancelled = true;
    };
  }, [location.hash, location.search, location.pathname]);

  return null;
}

