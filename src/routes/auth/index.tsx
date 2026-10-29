import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { authErrorMessage, sessionQuery, targetPath } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

type AuthSearch = { redirect?: string };

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Prijava — Bilježnica" },
      { name: "description", content: "Prijavi se ili napravi račun na blogu Bilježnica." },
      { property: "og:title", content: "Prijava — Bilježnica" },
      { property: "og:description", content: "Prijavi se ili napravi račun na blogu Bilježnica." },
    ],
  }),
  validateSearch: (raw: Record<string, unknown>): AuthSearch => {
    const redirect = typeof raw["redirect"] === "string" ? raw["redirect"] : undefined;
    return redirect ? { redirect } : {};
  },
  component: AuthPage,
});

const REDIRECT_KEY = "biljeznica-redirect";

function AuthPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const { data: user } = useQuery(sessionQuery);
  const target = targetPath(search.redirect);

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const goTo = () => nav({ to: target, replace: true });

  const oauth = async (provider: "google" | "lovable") => {
    setErr("");
    setInfo("");
    setBusy(true);
    if (target !== "/") sessionStorage.setItem(REDIRECT_KEY, target);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    setBusy(false);
    if (result.error) return setErr("Prijava tom uslugom nije uspjela. Pokušaj ponovno.");
    if (result.redirected) return;
    goTo();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    const mail = email.trim();
    if (!mail.includes("@") || mail.length < 6) return setErr("Upiši ispravnu e-mail adresu.");

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return setErr("Slanje poruke nije uspjelo. Pokušaj ponovno.");
      setInfo("Ako taj e-mail postoji, poslali smo poveznicu za novu lozinku. Provjeri sandučić.");
      return;
    }

    if (password.length < 8) return setErr("Lozinka mora imati barem 8 znakova.");
    if (mode === "signup" && name.trim().length < 2) return setErr("Upiši ime pod kojim želiš objavljivati.");

    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setBusy(false);
      if (error) return setErr(authErrorMessage(error.message));
      if (!data.session) {
        setInfo("Račun je napravljen. Otvori e-mail i klikni poveznicu za potvrdu, pa se prijavi.");
        return;
      }
      goTo();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error.message));
    goTo();
  };

  if (user) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-bold">Prijava nije potrebna</h1>
        <p className="mt-2 text-muted-foreground">Već si prijavljen/a.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-primary" onClick={goTo}>Nastavi</button>
          <Link to="/" className="btn-secondary">Na početnu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl font-bold">
        {mode === "signup" ? "Novi račun" : mode === "forgot" ? "Nova lozinka" : "Prijava"}
      </h1>

      {mode !== "forgot" && (
        <div className="mt-6 flex gap-2 text-sm">
          <button
            className={mode === "signin" ? "tab-on" : "tab-off"}
            onClick={() => { setMode("signin"); setErr(""); setInfo(""); }}
          >
            Prijava
          </button>
          <button
            className={mode === "signup" ? "tab-on" : "tab-off"}
            onClick={() => { setMode("signup"); setErr(""); setInfo(""); }}
          >
            Registracija
          </button>
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <input
            className="field"
            placeholder="Ime (vidljivo uz objave)"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="field"
          type="email"
          placeholder="E-mail"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "forgot" && (
          <input
            className="field"
            type="password"
            placeholder="Lozinka (min. 8 znakova)"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
        {info && <p className="rounded-md bg-secondary p-3 text-sm">{info}</p>}

        <button className="btn-primary w-full justify-center" disabled={busy}>
          {busy
            ? "Trenutak…"
            : mode === "signup"
              ? "Napravi račun"
              : mode === "forgot"
                ? "Pošalji poveznicu"
                : "Prijavi se"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        {mode === "signin" ? (
          <button className="text-primary hover:underline" onClick={() => { setMode("forgot"); setErr(""); setInfo(""); }}>
            Zaboravljena lozinka?
          </button>
        ) : mode === "forgot" ? (
          <button className="text-primary hover:underline" onClick={() => { setMode("signin"); setErr(""); setInfo(""); }}>
            Natrag na prijavu
          </button>
        ) : (
          <span className="text-muted-foreground">Lozinka se ne dijeli s nikim.</span>
        )}
        <Link to="/" className="text-muted-foreground hover:underline">Natrag na blog</Link>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">Ili nastavi s</p>
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            disabled={busy}
            onClick={() => oauth("google")}
          >
            Nastavi s Google računom
          </button>
          <button
            type="button"
            className="lovable-auth-button w-full"
            disabled={busy}
            onClick={() => oauth("lovable")}
          >
            Nastavi s Lovableom
          </button>
        </div>
      </div>
    </div>
  );
}
