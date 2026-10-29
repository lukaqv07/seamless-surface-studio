import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const postQuery = (id: string) =>
  queryOptions({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      const { data: comments, error: e2 } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", id)
        .order("created_at");
      if (e2) throw e2;
      return { post: data, comments: comments ?? [] };
    },
  });

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("hr-HR", { day: "numeric", month: "long", year: "numeric" });
