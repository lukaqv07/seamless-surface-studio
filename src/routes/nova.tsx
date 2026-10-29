import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/nova")({
  head: () => ({
    meta: [
      { title: "Nova objava — Bilježnica" },
      { name: "description", content: "Napiši i objavi svoju priču na blogu Bilježnica." },
      { property: "og:title", content: "Nova objava — Bilježnica" },
      { property: "og:description", content: "Napiši i objavi svoju priču na blogu Bilježnica." },
    ],
  }),
  component: NewPost,
});

function NewPost() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, profile, pending } = useAuth();
  const [f, setF] = useState({ title: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (pending) return <p className="text-muted-foreground">Trenutak…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-bold">Prijavi se da bi pisao/la</h1>
        <p className="mt-2 text-muted-foreground">
          Objavljati mogu samo registrirani čitatelji. Komentirati možeš i bez prijave.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/auth" search={{ redirect: "/nova" }} className="btn-primary">
            Prijava
          </Link>
          <Link to="/" className="btn-secondary">
            Natrag na blog
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name ?? fallbackName(user.email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = { title: f.title.trim(), content: f.content.trim() };
    if (v.title.length < 3 || v.content.length < 10)
      return setErr("Naslov min. 3 znaka, tekst min. 10 znakova.");
    setBusy(true);
    setErr("");
    const { data, error } = await supabase
      .from("posts")
      .insert({ ...v, author: displayName, author_id: user.id })
      .select("id")
      .single();
    setBusy(false);
    if (error) return setErr("Objava nije spremljena.");
    qc.invalidateQueries({ queryKey: ["posts"] });
    nav({ to: "/objava/$id", params: { id: data.id } });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-4xl font-bold">Nova objava</h1>
      <p className="text-sm text-muted-foreground">
        Objavljuješ kao <strong className="text-foreground">{displayName}</strong>.
      </p>
      <input
        className="field text-xl"
        placeholder="Naslov"
        maxLength={150}
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
      />
      <textarea
        className="field min-h-72 leading-relaxed"
        placeholder="Tvoja priča…"
        maxLength={20000}
        value={f.content}
        onChange={(e) => setF({ ...f, content: e.target.value })}
      />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Objavljujem…" : "Objavi"}
      </button>
    </form>
  );
}
