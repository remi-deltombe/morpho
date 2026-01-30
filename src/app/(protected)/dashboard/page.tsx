'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, BookOpen, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWords, useCategories } from '@/lib/hooks'
import { Button, Select } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { WordCard } from '@/components/words/word-card'
import { WordForm } from '@/components/words/word-form'
import type { WordWithCategories } from '@/types/database'

export default function WordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<WordWithCategories | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<WordWithCategories | null>(null)

  const { words, isLoading, refetch } = useWords({
    searchQuery,
    categoryId: categoryFilter || undefined,
  })
  const { categories } = useCategories()

  const handleEdit = (word: WordWithCategories) => {
    setEditingWord(word)
    setIsFormOpen(true)
  }

  const handleDelete = async (word: WordWithCategories) => {
    const supabase = createClient()
    const { error } = await supabase.from('words').delete().eq('id', word.id)

    if (error) {
      toast.error('Failed to delete word')
    } else {
      toast.success('Word deleted')
      refetch()
    }
    setDeleteConfirm(null)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingWord(null)
  }

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Words"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search words..."
        />

        <div className="p-4 space-y-4">
          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
            />
            <div className="flex-1" />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Word
            </Button>
          </div>

          {/* Words List */}
          {isLoading ? (
            <div className="grid gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : words.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No words yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your vocabulary by adding your first word
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Your First Word
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {words.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Word Form Modal */}
      <WordForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        word={editingWord}
        onSuccess={refetch}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Word?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete &ldquo;{deleteConfirm.word}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
