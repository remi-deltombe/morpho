'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Languages, ChevronDown, ChevronUp, Pencil, Trash2, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguages } from '@/lib/hooks'
import { Button, Input, Modal, Card } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import languageTemplates from '@/data/language-templates.json'
import type { LanguageWithTenses, Tense } from '@/types/database'

export default function LanguagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<LanguageWithTenses | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<LanguageWithTenses | null>(null)
  const [expandedLang, setExpandedLang] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formTenses, setFormTenses] = useState<{ name: string; display_order: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Tense form
  const [isTenseFormOpen, setIsTenseFormOpen] = useState(false)
  const [editingTense, setEditingTense] = useState<Tense | null>(null)
  const [tenseName, setTenseName] = useState('')
  const [tenseLanguageId, setTenseLanguageId] = useState('')

  const { languages, isLoading: isFetching, refetch } = useLanguages()

  const openLanguageForm = (lang?: LanguageWithTenses) => {
    if (lang) {
      setEditingLanguage(lang)
      setFormName(lang.name)
      setFormCode(lang.code)
      setFormTenses(lang.tenses.map((t) => ({ name: t.name, display_order: t.display_order })))
    } else {
      setEditingLanguage(null)
      setFormName('')
      setFormCode('')
      setFormTenses([])
    }
    setIsFormOpen(true)
  }

  const applyTemplate = (templateCode: string) => {
    const template = languageTemplates.languages.find((l) => l.code === templateCode)
    if (template) {
      setFormName(template.name)
      setFormCode(template.code)
      setFormTenses(template.tenses)
    }
  }

  const handleLanguageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Name and code are required')
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

      if (editingLanguage) {
        // Update language
        const { error } = await supabase
          .from('languages')
          .update({ name: formName.trim(), code: formCode.trim() } as never)
          .eq('id', editingLanguage.id)

        if (error) throw error
        toast.success('Language updated')
      } else {
        // Create language with tenses
        const { data: newLang, error } = await supabase
          .from('languages')
          .insert({ name: formName.trim(), code: formCode.trim(), user_id: user.id } as never)
          .select('id')
          .single()

        if (error) throw error

        const langId = (newLang as { id: string }).id

        // Add tenses
        if (formTenses.length > 0) {
          await supabase.from('tenses').insert(
            formTenses.map((t) => ({
              language_id: langId,
              name: t.name,
              display_order: t.display_order,
            })) as never
          )
        }

        toast.success('Language created')
      }

      setIsFormOpen(false)
      refetch()
    } catch {
      toast.error('Failed to save language')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLanguage = async (lang: LanguageWithTenses) => {
    const supabase = createClient()
    const { error } = await supabase.from('languages').delete().eq('id', lang.id)

    if (error) {
      toast.error('Failed to delete language. It may be in use.')
    } else {
      toast.success('Language deleted')
      refetch()
    }
    setDeleteConfirm(null)
  }

  // Tense handlers
  const openTenseForm = (languageId: string, tense?: Tense) => {
    setTenseLanguageId(languageId)
    if (tense) {
      setEditingTense(tense)
      setTenseName(tense.name)
    } else {
      setEditingTense(null)
      setTenseName('')
    }
    setIsTenseFormOpen(true)
  }

  const handleTenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenseName.trim()) {
      toast.error('Tense name is required')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const lang = languages.find((l) => l.id === tenseLanguageId)
      const maxOrder = lang?.tenses.reduce((max, t) => Math.max(max, t.display_order), 0) || 0

      if (editingTense) {
        const { error } = await supabase
          .from('tenses')
          .update({ name: tenseName.trim() } as never)
          .eq('id', editingTense.id)

        if (error) throw error
        toast.success('Tense updated')
      } else {
        const { error } = await supabase.from('tenses').insert({
          language_id: tenseLanguageId,
          name: tenseName.trim(),
          display_order: maxOrder + 1,
        } as never)

        if (error) throw error
        toast.success('Tense added')
      }

      setIsTenseFormOpen(false)
      refetch()
    } catch {
      toast.error('Failed to save tense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTense = async (tense: Tense) => {
    const supabase = createClient()
    const { error } = await supabase.from('tenses').delete().eq('id', tense.id)

    if (error) {
      toast.error('Failed to delete tense')
    } else {
      toast.success('Tense deleted')
      refetch()
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Languages" />

        <div className="p-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openLanguageForm()}>
              <Plus className="w-4 h-4" />
              Add Language
            </Button>
          </div>

          {isFetching ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : languages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Languages className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No languages yet</h3>
              <p className="text-muted-foreground mb-4">
                Add languages to start learning vocabulary
              </p>
              <Button onClick={() => openLanguageForm()}>
                <Plus className="w-4 h-4" />
                Add Your First Language
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {languages.map((lang) => (
                <Card key={lang.id} className="overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedLang(expandedLang === lang.id ? null : lang.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lang.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {lang.code}
                        </span>
                        {lang.is_system && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lang.tenses.length} tenses
                      </p>
                    </div>

                    {!lang.is_system && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openLanguageForm(lang)}
                          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(lang)}
                          className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {expandedLang === lang.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {expandedLang === lang.id && (
                    <div className="border-t bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Tenses</h4>
                        {!lang.is_system && (
                          <Button size="sm" variant="outline" onClick={() => openTenseForm(lang.id)}>
                            <Plus className="w-3 h-3" />
                            Add Tense
                          </Button>
                        )}
                      </div>
                      {lang.tenses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tenses defined
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {lang.tenses.map((tense, idx) => (
                            <div
                              key={tense.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted group"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                              <span className="flex-1">{tense.name}</span>
                              {!lang.is_system && (
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                  <button
                                    onClick={() => openTenseForm(lang.id, tense)}
                                    className="p-1 rounded hover:bg-muted-foreground/10"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTense(tense)}
                                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Language Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingLanguage ? 'Edit Language' : 'Add Language'}
      >
        <form onSubmit={handleLanguageSubmit} className="space-y-4">
          {!editingLanguage && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Use Template</label>
              <div className="flex gap-2">
                {languageTemplates.languages.map((t) => (
                  <Button
                    key={t.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(t.code)}
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Language Name"
            placeholder="e.g., Spanish"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <Input
            label="Language Code"
            placeholder="e.g., es"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            hint="ISO 639-1 code (used for text-to-speech)"
          />

          {!editingLanguage && formTenses.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Tenses ({formTenses.length})
              </label>
              <div className="max-h-32 overflow-y-auto bg-muted rounded-lg p-2 text-sm">
                {formTenses.map((t, i) => (
                  <div key={i} className="py-0.5">{t.name}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editingLanguage ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tense Form Modal */}
      <Modal
        isOpen={isTenseFormOpen}
        onClose={() => setIsTenseFormOpen(false)}
        title={editingTense ? 'Edit Tense' : 'Add Tense'}
        size="sm"
      >
        <form onSubmit={handleTenseSubmit} className="space-y-4">
          <Input
            label="Tense Name"
            placeholder="e.g., Present Perfect"
            value={tenseName}
            onChange={(e) => setTenseName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTenseFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editingTense ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Language?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo;? This will also delete all tenses.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteLanguage(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
