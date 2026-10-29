import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { postQuery, formatDate } from "@/lib/blog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/objava/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(postQuery(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.post ? `${loaderData.post.title} — Bilježnica` : "Objava — Bilježnica" },
      { name: "description", content: loaderData?.post?.content.slice(0, 150) ?? "Objava na blogu." },
      { property: "og:title", content: loaderData?.post?.title ?? "Objava" },
      { property: "og:description", content: loaderData?.post?.content.slice(0, 150) ?? "Objava na blogu." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(id));
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const [typedName, setTypedName] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!data.post) return <p>Objava nije pronađena. <Link to="/" className="text-primary">Natrag</Link></p>;
  const post = data.post;

  const signedInName = profile?.display_name ?? fallbackName(user?.email);
  const name = user ? signedInName : (typedName ?? profile?.display_name ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const who = name.trim();
    if (who.length < 2 || !content.trim())
      return setErr(user ? "Napiši komentar." : "Upiši ime (min. 2 znaka) i komentar.");
    setBusy(true);
    setErr("");
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: id, author: who, content: content.trim() });
    setBusy(false);
    if (error) return setErr("Spremanje nije uspjelo.");
    setContent("");
    qc.invalidateQueries({ queryKey: ["post", id] });
  };

  return (
    <article>
      <Link to="/" className="text-sm text-primary">← Sve objave</Link>
      <p className="mt-6 text-sm text-muted-foreground">{formatDate(post.created_at)} · {post.author}</p>
      <h1 className="mt-2 text-5xl font-bold leading-tight">{post.title}</h1>
      <div className="mt-8 whitespace-pre-wrap text-lg leading-relaxed">{post.content}</div>

      <section className="mt-16 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold">Komentari ({data.comments.length})</h2>
        <ul className="mt-4 space-y-4">
          {data.comments.map((c) => (
            <li key={c.id} className="rounded-md bg-card p-4">
              <p className="text-sm font-semibold">{c.author} <span className="font-normal text-muted-foreground">· {formatDate(c.created_at)}</span></p>
              <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {user ? (
            <p className="text-sm text-muted-foreground">
              Komentiraš kao <strong className="text-foreground">{signedInName}</strong>.
            </p>
          ) : (
            <input
              className="field"
              placeholder="Tvoje ime"
              value={name}
              maxLength={60}
              onChange={(e) => setTypedName(e.target.value)}
            />
          )}
          <textarea className="field min-h-24" placeholder="Napiši komentar…" value={content} maxLength={2000} onChange={(e) => setContent(e.target.value)} />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "Šaljem…" : "Komentiraj"}</button>
        </form>
      </section>
    </article>
  );
}
