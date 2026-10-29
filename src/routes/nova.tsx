import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [f, setF] = useState({ title: "", author: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = { title: f.title.trim(), author: f.author.trim(), content: f.content.trim() };
    if (v.title.length < 3 || v.author.length < 2 || v.content.length < 10)
      return setErr("Naslov min. 3 znaka, ime min. 2, tekst min. 10 znakova.");
    setBusy(true);
    const { data, error } = await supabase.from("posts").insert(v).select("id").single();
    setBusy(false);
    if (error) return setErr("Objava nije spremljena.");
    qc.invalidateQueries({ queryKey: ["posts"] });
    nav({ to: "/objava/$id", params: { id: data.id } });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-4xl font-bold">Nova objava</h1>
      <input className="field text-xl" placeholder="Naslov" maxLength={150} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <input className="field" placeholder="Tvoje ime" maxLength={60} value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
      <textarea className="field min-h-72 leading-relaxed" placeholder="Tvoja priča…" maxLength={20000} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Objavljujem…" : "Objavi"}</button>
    </form>
  );
}
