'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Folder, ChevronRight, Pencil, Trash2, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCategories } from '@/lib/hooks'
import { Button, Input, Modal, Select } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import type { Category, CategoryWithChildren } from '@/types/database'

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
]

function CategoryTree({
  categories,
  level = 0,
  onEdit,
  onDelete,
}: {
  categories: CategoryWithChildren[]
  level?: number
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const hasChildren = cat.children && cat.children.length > 0
        const isExpanded = expanded[cat.id]

        return (
          <div key={cat.id}>
            <div
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group"
              style={{ paddingLeft: `${level * 24 + 8}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => setExpanded({ ...expanded, [cat.id]: !isExpanded })}
                  className="p-1 hover:bg-muted-foreground/10 rounded"
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
              ) : (
                <div className="w-6" />
              )}

              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color || '#6366f1' }}
              />

              <span className="flex-1 font-medium">{cat.name}</span>

              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(cat)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {hasChildren && isExpanded && (
              <CategoryTree
                categories={cat.children!}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CategoriesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formParent, setFormParent] = useState('')
  const [formColor, setFormColor] = useState('#6366f1')
  const [isLoading, setIsLoading] = useState(false)

  const { categories, tree, isLoading: isFetching, refetch } = useCategories()

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormName(category.name)
      setFormParent(category.parent_id || '')
      setFormColor(category.color || '#6366f1')
    } else {
      setEditingCategory(null)
      setFormName('')
      setFormParent('')
      setFormColor('#6366f1')
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in again')
        return
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formName.trim(),
            parent_id: formParent || null,
            color: formColor,
          } as never)
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Category updated')
      } else {
        const { error } = await supabase.from('categories').insert({
          name: formName.trim(),
          parent_id: formParent || null,
          color: formColor,
          user_id: user.id,
        } as never)
        if (error) throw error
        toast.success('Category created')
      }

      setIsFormOpen(false)
      refetch()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', category.id)

    if (error) {
      toast.error('Failed to delete category')
    } else {
      toast.success('Category deleted')
      refetch()
    }
    setDeleteConfirm(null)
  }

  const parentOptions = [
    { value: '', label: 'No parent (root level)' },
    ...categories
      .filter((c) => c.id !== editingCategory?.id)
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Categories" />

        <div className="p-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openForm()}>
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          {isFetching ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Organize your words and verbs with categories
              </p>
              <Button onClick={() => openForm()}>
                <Plus className="w-4 h-4" />
                Create Your First Category
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border p-2">
              <CategoryTree
                categories={tree}
                onEdit={openForm}
                onDelete={setDeleteConfirm}
              />
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="Enter category name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <Select
            label="Parent Category"
            options={parentOptions}
            value={formParent}
            onChange={(e) => setFormParent(e.target.value)}
            hint="Optional: nest this under another category"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    formColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Category?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo;? Child categories will also be deleted.
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
