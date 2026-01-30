'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, CategoryWithChildren } from '@/types/database'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<CategoryWithChildren[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildTree = useCallback((flatCategories: Category[]): CategoryWithChildren[] => {
    const map = new Map<string, CategoryWithChildren>()
    const roots: CategoryWithChildren[] = []

    // First pass: create all nodes
    flatCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build the tree
    flatCategories.forEach((cat) => {
      const node = map.get(cat.id)!
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children!.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }, [])

  const fetchCategories = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        setError(error.message)
      } else {
        setCategories(data || [])
        setTree(buildTree(data || []))
      }
    } catch {
      setError('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [buildTree])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, tree, isLoading, error, refetch: fetchCategories }
}
