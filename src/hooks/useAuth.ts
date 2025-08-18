import { useEffect, useState } from "react";
import { getSupabase, isConfigured } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (email: string) => {
    const supabase = getSupabase();
    return supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  return { user, loading, signInWithOtp, signOut };
}