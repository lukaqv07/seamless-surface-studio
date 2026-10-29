<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- Publishing a post requires a signed-in member whose `author_id` matches the session; comments stay open to anonymous visitors. Keeps authored content attributable and spam out of the post list.
- After sign-in, honour only same-origin paths from the `redirect` search param, never an external URL. Stops the login page being used to bounce visitors off-site.
- Auth-dependent UI renders a neutral placeholder until the page has hydrated in the browser. The session lives in browser storage the server cannot read, so a server-rendered branch causes a hydration mismatch.
