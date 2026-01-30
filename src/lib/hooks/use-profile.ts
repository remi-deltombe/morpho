"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Language } from "@/types/database";

interface ProfileWithLanguages extends Profile {
  native_language?: Language | null;
  target_language?: Language | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileWithLanguages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Not authenticated");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
            *,
            native_language:languages!profiles_native_language_id_fkey(*),
            target_language:languages!profiles_target_language_id_fkey(*)
          `,
          )
          .eq("id", user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setProfile(data);
        }
      } catch {
        setError("Failed to fetch profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { profile, isLoading, error };
}
