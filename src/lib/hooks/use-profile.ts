"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchProfile = useCallback(async () => {
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
          native_language:languages!fk_native_language(*),
          target_language:languages!fk_target_language(*)
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
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
}
