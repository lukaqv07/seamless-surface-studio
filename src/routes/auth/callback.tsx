import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Prijava — Bilježnica" },
      { name: "description", content: "Dovršavanje prijave na blog Bilježnica." },
      { property: "og:title", content: "Prijava — Bilježnica" },
      { property: "og:description", content: "Dovršavanje prijave na blog Bilježnica." },
    ],
  }),
  component: Callback,
});

const REDIRECT_KEY = "biljeznica-redirect";

function Callback() {
  const nav = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    let finished = false;

    const finish = async () => {
      const { data } = await supabase.auth.getUser();
      if (finished || !data.user) return;
      finished = true;
      const stored = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
      nav({ to: stored === "/nova" ? "/nova" : "/", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void finish();
    });
    void finish();
    const timer = setTimeout(() => {
      if (!finished) setErr("Prijava nije dovršena. Vrati se i pokušaj ponovno.");
    }, 10000);

    return () => {
      finished = true;
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [nav]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-3xl font-bold">Prijavljujem…</h1>
      {err ? (
        <p className="mt-3 text-sm text-destructive">{err}</p>
      ) : (
        <p className="mt-3 text-muted-foreground">Trenutak, dovršavamo prijavu.</p>
      )}
    </div>
  );
}
