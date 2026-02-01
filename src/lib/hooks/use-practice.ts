'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  PracticeItem, 
  QuestionLevel, 
  QuestionConfig,
  Category,
  WordWithCategories,
  VerbWithConjugations 
} from '@/types/database'

interface UsePracticeOptions {
  categoryIds?: string[]
  includeWords?: boolean
  includeVerbs?: boolean
}

// Calculate effective score with time decay
// Score decays based on how long since last practice
function calculateEffectiveScore(
  learningScore: number,
  lastPracticed: string | null,
  practiceCount: number
): number {
  if (!lastPracticed) {
    // Never practiced - highest priority (lowest effective score)
    return -1000 + learningScore
  }

  const now = new Date()
  const lastPracticedDate = new Date(lastPracticed)
  const hoursSinceLastPractice = (now.getTime() - lastPracticedDate.getTime()) / (1000 * 60 * 60)
  
  // Decay rate: lose 1 point per 24 hours
  const decayAmount = Math.floor(hoursSinceLastPractice / 24)
  
  // Items with fewer practice counts should be prioritized more
  const countBonus = Math.min(practiceCount * 2, 20)
  
  return learningScore - decayAmount + countBonus
}

// Determine question level based on learning score
function getQuestionLevel(learningScore: number): QuestionLevel {
  if (learningScore < 5) return 0
  if (learningScore < 15) return 1
  if (learningScore < 30) return 2
  if (learningScore < 50) return 3
  return 4
}

// Generate question config based on level
function generateQuestionConfig(level: QuestionLevel, hasPlural: boolean): QuestionConfig {
  const baseConfig: QuestionConfig = {
    level,
    direction: 'target-to-source',
    showExamples: true,
    showPluralForm: true,
    audioAutoPlay: true,
    audioPlayLimit: null,
  }

  switch (level) {
    case 0:
      return baseConfig
    
    case 1:
      return {
        ...baseConfig,
        showExamples: false,
        showPluralForm: hasPlural ? Math.random() > 0.5 : false,
      }
    
    case 2:
      return {
        ...baseConfig,
        showExamples: false,
        showPluralForm: hasPlural ? Math.random() > 0.5 : false,
        direction: Math.random() > 0.5 ? 'target-to-source' : 'source-to-target',
      }
    
    case 3:
      // Either level 2 style or audio-only
      if (Math.random() > 0.5) {
        return {
          ...baseConfig,
          showExamples: false,
          showPluralForm: false,
          direction: 'source-to-target',
        }
      }
      return {
        ...baseConfig,
        showExamples: false,
        showPluralForm: false,
        direction: 'target-to-source',
        // Audio only mode is handled in the component
      }
    
    case 4:
      return {
        ...baseConfig,
        showExamples: false,
        showPluralForm: false,
        direction: Math.random() > 0.5 ? 'target-to-source' : 'source-to-target',
        audioPlayLimit: 1,
      }
  }
}

export function usePractice(options: UsePracticeOptions = {}) {
  const { 
    categoryIds = [], 
    includeWords = true, 
    includeVerbs = true 
  } = options

  const [items, setItems] = useState<PracticeItem[]>([])
  const [currentItem, setCurrentItem] = useState<PracticeItem | null>(null)
  const [questionConfig, setQuestionConfig] = useState<QuestionConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalPracticed: 0,
  })

  // Fetch practice items
  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const allItems: PracticeItem[] = []

    try {
      if (includeWords) {
        const { data: words } = await supabase
          .from('words')
          .select(`
            *,
            categories:word_categories(category:categories(*)),
            source_language:languages!words_source_language_id_fkey(*),
            target_language:languages!words_target_language_id_fkey(*)
          `)

        if (words) {
          const filteredWords = categoryIds.length > 0
            ? words.filter((w: WordWithCategories & { categories: { category: Category }[] }) => 
                w.categories?.some((c: { category: Category }) => categoryIds.includes(c.category.id))
              )
            : words

          filteredWords.forEach((word: WordWithCategories & { categories: { category: Category }[] }) => {
            allItems.push({
              id: word.id,
              type: 'word',
              targetText: word.word,
              translationText: word.translation,
              pluralForm: word.plural_form,
              exampleSentence: word.example_sentence,
              audioUrl: word.audio_url,
              learningScore: word.learning_score,
              lastPracticed: word.last_practiced,
              practiceCount: word.practice_count,
              targetLanguage: word.target_language,
              sourceLanguage: word.source_language,
              categories: word.categories?.map((c: { category: Category }) => c.category) || [],
            })
          })
        }
      }

      if (includeVerbs) {
        const { data: verbs } = await supabase
          .from('verbs')
          .select(`
            *,
            categories:verb_categories(category:categories(*)),
            source_language:languages!verbs_source_language_id_fkey(*),
            target_language:languages!verbs_target_language_id_fkey(*)
          `)

        if (verbs) {
          const filteredVerbs = categoryIds.length > 0
            ? verbs.filter((v: VerbWithConjugations & { categories: { category: Category }[] }) => 
                v.categories?.some((c: { category: Category }) => categoryIds.includes(c.category.id))
              )
            : verbs

          filteredVerbs.forEach((verb: VerbWithConjugations & { categories: { category: Category }[] }) => {
            allItems.push({
              id: verb.id,
              type: 'verb',
              targetText: verb.infinitive,
              translationText: verb.translation,
              pluralForm: null,
              exampleSentence: null,
              audioUrl: verb.audio_url,
              learningScore: verb.learning_score,
              lastPracticed: verb.last_practiced,
              practiceCount: verb.practice_count,
              targetLanguage: verb.target_language,
              sourceLanguage: verb.source_language,
              categories: verb.categories?.map((c: { category: Category }) => c.category) || [],
            })
          })
        }
      }

      // Sort by effective score (lowest first for spaced repetition)
      allItems.sort((a, b) => {
        const scoreA = calculateEffectiveScore(a.learningScore, a.lastPracticed, a.practiceCount)
        const scoreB = calculateEffectiveScore(b.learningScore, b.lastPracticed, b.practiceCount)
        return scoreA - scoreB
      })

      setItems(allItems)
    } catch (error) {
      console.error('Failed to fetch practice items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [categoryIds, includeWords, includeVerbs])

  // Select next item based on spaced repetition
  const selectNextItem = useCallback(() => {
    if (items.length === 0) {
      setCurrentItem(null)
      setQuestionConfig(null)
      return
    }

    // Take from the top (lowest effective score)
    // Add some randomness among the top items for variety
    const poolSize = Math.min(5, items.length)
    const randomIndex = Math.floor(Math.random() * poolSize)
    const selected = items[randomIndex]

    const level = getQuestionLevel(selected.learningScore)
    const config = generateQuestionConfig(level, !!selected.pluralForm)

    setCurrentItem(selected)
    setQuestionConfig(config)
  }, [items])

  // Update score after answer
  const submitAnswer = useCallback(async (isCorrect: boolean) => {
    if (!currentItem) return

    const supabase = createClient()
    const scoreChange = isCorrect ? 5 : -3
    const newScore = Math.max(0, currentItem.learningScore + scoreChange)

    const updateData = {
      learning_score: newScore,
      last_practiced: new Date().toISOString(),
      practice_count: currentItem.practiceCount + 1,
    }

    if (currentItem.type === 'word') {
      await (supabase.from('words') as ReturnType<typeof supabase.from>)
        .update(updateData as Record<string, unknown>)
        .eq('id', currentItem.id)
    } else {
      await (supabase.from('verbs') as ReturnType<typeof supabase.from>)
        .update(updateData as Record<string, unknown>)
        .eq('id', currentItem.id)
    }

    // Update local state
    setItems(prev => prev.map(item => 
      item.id === currentItem.id
        ? {
            ...item,
            learningScore: newScore,
            lastPracticed: new Date().toISOString(),
            practiceCount: item.practiceCount + 1,
          }
        : item
    ).sort((a, b) => {
      const scoreA = calculateEffectiveScore(a.learningScore, a.lastPracticed, a.practiceCount)
      const scoreB = calculateEffectiveScore(b.learningScore, b.lastPracticed, b.practiceCount)
      return scoreA - scoreB
    }))

    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      totalPracticed: prev.totalPracticed + 1,
    }))

    // Select next item
    selectNextItem()
  }, [currentItem, selectNextItem])

  // Initial fetch
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Select first item when items are loaded
  useEffect(() => {
    if (items.length > 0 && !currentItem) {
      selectNextItem()
    }
  }, [items, currentItem, selectNextItem])

  return {
    currentItem,
    questionConfig,
    isLoading,
    sessionStats,
    totalItems: items.length,
    submitAnswer,
    skipItem: selectNextItem,
    refetch: fetchItems,
  }
}
