import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova lozinka — Bilježnica" },
      { name: "description", content: "Postavi novu lozinku za svoj račun na blogu Bilježnica." },
      { property: "og:title", content: "Nova lozinka — Bilježnica" },
      { property: "og:description", content: "Postavi novu lozinku za svoj račun na blogu Bilježnica." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Lozinka mora imati barem 8 znakova.");
    if (password !== repeat) return setErr("Lozinke se ne podudaraju.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr("Lozinka nije promijenjena. Otvori novu poveznicu iz e-maila.");
    setDone(true);
    setTimeout(() => nav({ to: "/", replace: true }), 1500);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl font-bold">Lozinka je promijenjena</h1>
        <p className="mt-3 text-muted-foreground">Vodimo te na početnu stranicu.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl font-bold">Nova lozinka</h1>
        <p className="mt-3 text-muted-foreground">
          Otvori poveznicu iz e-maila koji smo ti poslali — ona nas vodi do ove stranice.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl font-bold">Nova lozinka</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          className="field"
          type="password"
          placeholder="Nova lozinka (min. 8 znakova)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="field"
          type="password"
          placeholder="Ponovi novu lozinku"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className="btn-primary w-full justify-center" disabled={busy}>
          {busy ? "Spremamo…" : "Spremi lozinku"}
        </button>
      </form>
    </div>
  );
}
