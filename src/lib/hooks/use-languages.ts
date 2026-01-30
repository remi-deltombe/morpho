'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageWithTenses } from '@/types/database'

export function useLanguages() {
  const [languages, setLanguages] = useState<LanguageWithTenses[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLanguages = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('languages')
        .select(`
          *,
          tenses(*)
        `)
        .order('name')

      if (error) {
        setError(error.message)
      } else if (data) {
        // Sort tenses by display_order
        const sorted = (data as LanguageWithTenses[]).map((lang) => ({
          ...lang,
          tenses: (lang.tenses || []).sort((a, b) => a.display_order - b.display_order),
        }))
        
        setLanguages(sorted)
      }
    } catch {
      setError('Failed to fetch languages')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLanguages()
  }, [fetchLanguages])

  return { languages, isLoading, error, refetch: fetchLanguages }
}
