'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VerbWithConjugations } from '@/types/database'

interface UseVerbsOptions {
  searchQuery?: string
  categoryId?: string
}

export function useVerbs(options: UseVerbsOptions = {}) {
  const [verbs, setVerbs] = useState<VerbWithConjugations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVerbs = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      let query = supabase
        .from('verbs')
        .select(`
          *,
          source_language:languages!verbs_source_language_id_fkey(*),
          target_language:languages!verbs_target_language_id_fkey(*),
          categories:verb_categories(
            category:categories(*)
          ),
          conjugations(
            *,
            tense:tenses(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (options.searchQuery) {
        query = query.or(`infinitive.ilike.%${options.searchQuery}%,translation.ilike.%${options.searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else if (data) {
        // Transform the data to flatten categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedData = (data as any[]).map((verb) => ({
          ...verb,
          categories: (verb.categories || []).map((vc: { category: unknown }) => vc.category),
        })) as VerbWithConjugations[]

        // Filter by category if specified
        let filteredData = transformedData
        if (options.categoryId) {
          filteredData = transformedData.filter((verb) =>
            verb.categories.some((cat) => cat.id === options.categoryId)
          )
        }

        setVerbs(filteredData)
      }
    } catch {
      setError('Failed to fetch verbs')
    } finally {
      setIsLoading(false)
    }
  }, [options.searchQuery, options.categoryId])

  useEffect(() => {
    fetchVerbs()
  }, [fetchVerbs])

  return { verbs, isLoading, error, refetch: fetchVerbs }
}
