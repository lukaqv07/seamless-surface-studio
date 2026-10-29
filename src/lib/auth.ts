import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ?? null;
  },
  staleTime: Infinity,
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    return profile;
  },
});

export function useAuth() {
  const session = useQuery(sessionQuery);
  const profile = useQuery(profileQuery);
  return {
    user: session.data,
    profile: profile.data,
    pending: session.isPending,
  };
}

/** Where to land after signing in. Only "/nova" is honoured, everything else goes home. */
export function targetPath(redirect: unknown): "/nova" | "/" {
  return redirect === "/nova" ? "/nova" : "/";
}

export function authErrorMessage(message: string | undefined): string {
  const m = message ?? "";
  if (/invalid login credentials/i.test(m)) return "E-mail ili lozinka nisu ispravni.";
  if (/email not confirmed/i.test(m))
    return "Još nisi potvrdio/la e-mail. Otvori poruku koju smo ti poslali i klikni poveznicu.";
  if (/already registered|already been registered/i.test(m))
    return "Ovaj e-mail je već registriran. Prijavi se.";
  if (/password should be at least|length/i.test(m))
    return "Lozinka mora imati barem 8 znakova.";
  if (/rate limit|too many requests/i.test(m))
    return "Previše pokušaja. Pričekaj malo pa ponovno pokušaj.";
  return "Nešto nije u redu. Pokušaj ponovno.";
}
