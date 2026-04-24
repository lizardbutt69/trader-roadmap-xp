import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in...");

  useEffect(() => {
    const finishAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (errorDescription) {
        navigate(`/login?error=${encodeURIComponent(errorDescription)}`, { replace: true });
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          navigate(`/login?error=${encodeURIComponent(error.message)}`, { replace: true });
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          navigate(`/login?error=${encodeURIComponent(error.message)}`, { replace: true });
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app", { replace: true });
        return;
      }

      setMessage("Could not finish sign in. Sending you back...");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    };

    finishAuth();
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b0d13",
      color: "#e2e8f0",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 14,
      fontWeight: 700,
    }}>
      {message}
    </div>
  );
}
