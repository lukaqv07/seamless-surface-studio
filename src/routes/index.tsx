import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQuery, formatDate } from "@/lib/blog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bilježnica — blog" },
      { name: "description", content: "Priče, misli i komentari. Čitaj i piši na blogu Bilježnica." },
      { property: "og:title", content: "Bilježnica — blog" },
      { property: "og:description", content: "Priče, misli i komentari. Čitaj i piši na blogu Bilježnica." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: Index,
});

function Index() {
  const { data: posts } = useSuspenseQuery(postsQuery);
  return (
    <div>
      <section className="border-b border-border pb-10">
        <p className="text-sm uppercase tracking-widest text-primary">Dnevnik misli</p>
        <h1 className="mt-2 text-5xl font-bold leading-tight md:text-6xl">
          Priče koje vrijedi <em className="text-primary">zapisati</em>.
        </h1>
      </section>
      <ul className="divide-y divide-border">
        {posts.map((p) => (
          <li key={p.id} className="py-8">
            <Link to="/objava/$id" params={{ id: p.id }} className="group block">
              <p className="text-sm text-muted-foreground">
                {formatDate(p.created_at)} · {p.author}
              </p>
              <h2 className="mt-1 text-3xl font-semibold group-hover:text-primary">{p.title}</h2>
              <p className="mt-2 line-clamp-2 text-muted-foreground">{p.content}</p>
            </Link>
          </li>
        ))}
        {posts.length === 0 && <li className="py-8 text-muted-foreground">Još nema objava.</li>}
      </ul>
    </div>
  );
}
