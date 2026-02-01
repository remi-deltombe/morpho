export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          native_language_id: string | null
          target_language_id: string | null
          created_at: string
          updated_at: string
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          email: string
          native_language_id?: string | null
          target_language_id?: string | null
          created_at?: string
          updated_at?: string
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string
          native_language_id?: string | null
          target_language_id?: string | null
          created_at?: string
          updated_at?: string
          onboarding_completed?: boolean
        }
      }
      languages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          code: string
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          code: string
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          code?: string
          is_system?: boolean
          created_at?: string
        }
      }
      tenses: {
        Row: {
          id: string
          language_id: string
          name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          language_id: string
          name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          language_id?: string
          name?: string
          display_order?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          parent_id: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          parent_id?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          parent_id?: string | null
          color?: string | null
          created_at?: string
        }
      }
      words: {
        Row: {
          id: string
          user_id: string
          source_language_id: string
          target_language_id: string
          word: string
          translation: string
          plural_form: string | null
          example_sentence: string | null
          notes: string | null
          image_url: string | null
          audio_url: string | null
          learning_score: number
          last_practiced: string | null
          practice_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_language_id: string
          target_language_id: string
          word: string
          translation: string
          plural_form?: string | null
          example_sentence?: string | null
          notes?: string | null
          image_url?: string | null
          audio_url?: string | null
          learning_score?: number
          last_practiced?: string | null
          practice_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_language_id?: string
          target_language_id?: string
          word?: string
          translation?: string
          plural_form?: string | null
          example_sentence?: string | null
          notes?: string | null
          image_url?: string | null
          audio_url?: string | null
          learning_score?: number
          last_practiced?: string | null
          practice_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      word_categories: {
        Row: {
          word_id: string
          category_id: string
        }
        Insert: {
          word_id: string
          category_id: string
        }
        Update: {
          word_id?: string
          category_id?: string
        }
      }
      verbs: {
        Row: {
          id: string
          user_id: string
          source_language_id: string
          target_language_id: string
          infinitive: string
          translation: string
          is_irregular: boolean
          notes: string | null
          audio_url: string | null
          learning_score: number
          last_practiced: string | null
          practice_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_language_id: string
          target_language_id: string
          infinitive: string
          translation: string
          is_irregular?: boolean
          notes?: string | null
          audio_url?: string | null
          learning_score?: number
          last_practiced?: string | null
          practice_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_language_id?: string
          target_language_id?: string
          infinitive?: string
          translation?: string
          is_irregular?: boolean
          notes?: string | null
          audio_url?: string | null
          learning_score?: number
          last_practiced?: string | null
          practice_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      verb_categories: {
        Row: {
          verb_id: string
          category_id: string
        }
        Insert: {
          verb_id: string
          category_id: string
        }
        Update: {
          verb_id?: string
          category_id?: string
        }
      }
      conjugations: {
        Row: {
          id: string
          verb_id: string
          tense_id: string
          person: string
          conjugated_form: string
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verb_id: string
          tense_id: string
          person: string
          conjugated_form: string
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verb_id?: string
          tense_id?: string
          person?: string
          conjugated_form?: string
          audio_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Language = Database['public']['Tables']['languages']['Row']
export type Tense = Database['public']['Tables']['tenses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Word = Database['public']['Tables']['words']['Row']
export type Verb = Database['public']['Tables']['verbs']['Row']
export type Conjugation = Database['public']['Tables']['conjugations']['Row']

// Extended types with relations
export type LanguageWithTenses = Language & {
  tenses: Tense[]
}

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
}

export type WordWithCategories = Word & {
  categories: Category[]
  source_language: Language
  target_language: Language
}

export type VerbWithConjugations = Verb & {
  categories: Category[]
  conjugations: (Conjugation & { tense: Tense })[]
  source_language: Language
  target_language: Language
}

// Practice types
export type PracticeItemType = 'word' | 'verb'

export type PracticeItem = {
  id: string
  type: PracticeItemType
  targetText: string
  translationText: string
  pluralForm?: string | null
  exampleSentence?: string | null
  audioUrl?: string | null
  learningScore: number
  lastPracticed: string | null
  practiceCount: number
  targetLanguage: Language
  sourceLanguage: Language
  categories: Category[]
}

export type QuestionLevel = 0 | 1 | 2 | 3 | 4

export type QuestionDirection = 'target-to-source' | 'source-to-target'

export type QuestionConfig = {
  level: QuestionLevel
  direction: QuestionDirection
  showExamples: boolean
  showPluralForm: boolean
  audioAutoPlay: boolean
  audioPlayLimit: number | null // null means unlimited
}
