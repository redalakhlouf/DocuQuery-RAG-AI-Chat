"use client";

import { createClient } from "@/app/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useUser(redirectTo = null) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user && redirectTo) {
        router.push(redirectTo);
        return;
      }
      setUser(user);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router, redirectTo]);

  return { user, loading };
}
