'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WordWithCategories } from '@/types/database'

interface UseWordsOptions {
  searchQuery?: string
  categoryId?: string
}

export function useWords(options: UseWordsOptions = {}) {
  const [words, setWords] = useState<WordWithCategories[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWords = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      let query = supabase
        .from('words')
        .select(`
          *,
          source_language:languages!words_source_language_id_fkey(*),
          target_language:languages!words_target_language_id_fkey(*),
          categories:word_categories(
            category:categories(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (options.searchQuery) {
        query = query.or(`word.ilike.%${options.searchQuery}%,translation.ilike.%${options.searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else if (data) {
        // Transform the data to flatten categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedData = (data as any[]).map((word) => ({
          ...word,
          categories: (word.categories || []).map((wc: { category: unknown }) => wc.category),
        })) as WordWithCategories[]

        // Filter by category if specified
        let filteredData = transformedData
        if (options.categoryId) {
          filteredData = transformedData.filter((word) =>
            word.categories.some((cat) => cat.id === options.categoryId)
          )
        }

        setWords(filteredData)
      }
    } catch {
      setError('Failed to fetch words')
    } finally {
      setIsLoading(false)
    }
  }, [options.searchQuery, options.categoryId])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  return { words, isLoading, error, refetch: fetchWords }
}
