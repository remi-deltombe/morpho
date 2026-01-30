'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, BookA } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useVerbs, useCategories } from '@/lib/hooks'
import { Button, Select } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { VerbCard } from '@/components/verbs/verb-card'
import { VerbForm } from '@/components/verbs/verb-form'
import type { VerbWithConjugations } from '@/types/database'

export default function VerbsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVerb, setEditingVerb] = useState<VerbWithConjugations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<VerbWithConjugations | null>(null)

  const { verbs, isLoading, refetch } = useVerbs({
    searchQuery,
    categoryId: categoryFilter || undefined,
  })
  const { categories } = useCategories()

  const handleEdit = (verb: VerbWithConjugations) => {
    setEditingVerb(verb)
    setIsFormOpen(true)
  }

  const handleDelete = async (verb: VerbWithConjugations) => {
    const supabase = createClient()
    const { error } = await supabase.from('verbs').delete().eq('id', verb.id)

    if (error) {
      toast.error('Failed to delete verb')
    } else {
      toast.success('Verb deleted')
      refetch()
    }
    setDeleteConfirm(null)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingVerb(null)
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
          title="Verbs"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search verbs..."
        />

        <div className="p-4 space-y-4">
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
              Add Verb
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : verbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookA className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No verbs yet</h3>
              <p className="text-muted-foreground mb-4">
                Start learning conjugations by adding your first verb
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Your First Verb
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {verbs.map((verb) => (
                <VerbCard
                  key={verb.id}
                  verb={verb}
                  onEdit={handleEdit}
                  onDelete={setDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <VerbForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        verb={editingVerb}
        onSuccess={refetch}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Verb?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete &ldquo;{deleteConfirm.infinitive}&rdquo;? This will also remove all conjugations.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
