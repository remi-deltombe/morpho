'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Volume2, Upload, Link as LinkIcon, X, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCategories, useLanguages, useProfile } from '@/lib/hooks'
import { Button, Input, Textarea, Select, Modal, Checkbox } from '@/components/ui'
import type { VerbWithConjugations, Tense } from '@/types/database'

const verbSchema = z.object({
  infinitive: z.string().min(1, 'Infinitive is required'),
  translation: z.string().min(1, 'Translation is required'),
  is_irregular: z.boolean().optional(),
  notes: z.string().optional(),
  source_language_id: z.string().min(1, 'Source language is required'),
  target_language_id: z.string().min(1, 'Target language is required'),
})

type VerbFormData = z.infer<typeof verbSchema>

interface Conjugation {
  tense_id: string
  person: string
  conjugated_form: string
}

interface VerbFormProps {
  isOpen: boolean
  onClose: () => void
  verb?: VerbWithConjugations | null
  onSuccess: () => void
}

export function VerbForm({ isOpen, onClose, verb, onSuccess }: VerbFormProps) {
  const { profile } = useProfile()
  const { languages } = useLanguages()
  const { categories } = useCategories()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioMode, setAudioMode] = useState<'url' | 'upload' | 'tts'>('tts')
  const [conjugations, setConjugations] = useState<Conjugation[]>([])
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerbFormData>({
    resolver: zodResolver(verbSchema),
    defaultValues: {
      source_language_id: profile?.native_language_id || '',
      target_language_id: profile?.target_language_id || '',
      is_irregular: false,
    },
  })

  const targetLanguageId = watch('target_language_id')

  useEffect(() => {
    setSelectedTargetLanguage(targetLanguageId)
  }, [targetLanguageId])

  useEffect(() => {
    if (!isOpen) return
    
    if (verb) {
      // Editing existing verb
      setValue('infinitive', verb.infinitive)
      setValue('translation', verb.translation)
      setValue('is_irregular', verb.is_irregular)
      setValue('notes', verb.notes || '')
      setValue('source_language_id', verb.source_language_id)
      setValue('target_language_id', verb.target_language_id)
      setSelectedCategories(verb.categories.map((c) => c.id))
      setAudioUrl(verb.audio_url || '')
      setConjugations(
        verb.conjugations.map((c) => ({
          tense_id: c.tense_id,
          person: c.person,
          conjugated_form: c.conjugated_form,
        }))
      )
    } else {
      // Reset form fields for new verb, then set language defaults
      reset({
        infinitive: '',
        translation: '',
        notes: '',
        is_irregular: false,
        source_language_id: profile?.native_language_id || '',
        target_language_id: profile?.target_language_id || '',
      })
      setSelectedCategories([])
      setAudioUrl('')
      setAudioFile(null)
      setConjugations([])
    }
  }, [isOpen, verb, profile, reset])

  // Get tenses for selected target language
  const targetLanguage = languages.find((l) => l.id === selectedTargetLanguage)
  const availableTenses = targetLanguage?.tenses || []

  const addConjugation = (tense: Tense) => {
    const persons = getPersonsForLanguage(targetLanguage?.code || 'en')
    const newConjugations = persons.map((person) => ({
      tense_id: tense.id,
      person,
      conjugated_form: '',
    }))
    setConjugations([...conjugations, ...newConjugations])
  }

  const getPersonsForLanguage = (code: string): string[] => {
    switch (code) {
      case 'fr':
        return ['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles']
      case 'fi':
        return ['minä', 'sinä', 'hän', 'me', 'te', 'he']
      default:
        return ['I', 'you', 'he/she/it', 'we', 'you (plural)', 'they']
    }
  }

  const removeConjugationsForTense = (tenseId: string) => {
    setConjugations(conjugations.filter((c) => c.tense_id !== tenseId))
  }

  const updateConjugation = (index: number, form: string) => {
    const updated = [...conjugations]
    updated[index].conjugated_form = form
    setConjugations(updated)
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from(bucket).upload(fileName, file)

    if (error) {
      toast.error('Failed to upload audio')
      return null
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const onSubmit = async (data: VerbFormData) => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in again')
        return
      }

      let finalAudioUrl = audioUrl

      if (audioFile) {
        const url = await uploadFile(audioFile, 'audio')
        if (url) finalAudioUrl = url
      }

      const verbData = {
        infinitive: data.infinitive,
        translation: data.translation,
        is_irregular: data.is_irregular || false,
        notes: data.notes || null,
        source_language_id: data.source_language_id,
        target_language_id: data.target_language_id,
        user_id: user.id,
        audio_url: finalAudioUrl || null,
      }

      if (verb) {
        // Update
        const { error } = await supabase.from('verbs').update(verbData as never).eq('id', verb.id)
        if (error) throw error

        // Update categories
        await supabase.from('verb_categories').delete().eq('verb_id', verb.id)
        if (selectedCategories.length > 0) {
          await supabase.from('verb_categories').insert(
            selectedCategories.map((catId) => ({ verb_id: verb.id, category_id: catId })) as never
          )
        }

        // Update conjugations
        await supabase.from('conjugations').delete().eq('verb_id', verb.id)
        if (conjugations.length > 0) {
          await supabase.from('conjugations').insert(
            conjugations.filter((c) => c.conjugated_form).map((c) => ({
              verb_id: verb.id,
              tense_id: c.tense_id,
              person: c.person,
              conjugated_form: c.conjugated_form,
            })) as never
          )
        }

        toast.success('Verb updated successfully')
      } else {
        // Create
        const { data: newVerb, error } = await supabase.from('verbs').insert(verbData as never).select('id').single()
        if (error) throw error

        const verbId = (newVerb as { id: string }).id

        // Add categories
        if (selectedCategories.length > 0) {
          await supabase.from('verb_categories').insert(
            selectedCategories.map((catId) => ({ verb_id: verbId, category_id: catId })) as never
          )
        }

        // Add conjugations
        if (conjugations.length > 0) {
          await supabase.from('conjugations').insert(
            conjugations.filter((c) => c.conjugated_form).map((c) => ({
              verb_id: verbId,
              tense_id: c.tense_id,
              person: c.person,
              conjugated_form: c.conjugated_form,
            })) as never
          )
        }

        toast.success('Verb added successfully')
      }

      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to save verb')
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique tenses that have conjugations
  const tensesWithConjugations = [...new Set(conjugations.map((c) => c.tense_id))]
  const unusedTenses = availableTenses.filter((t) => !tensesWithConjugations.includes(t.id))

  const languageOptions = languages.map((lang) => ({
    value: lang.id,
    label: lang.name,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={verb ? 'Edit Verb' : 'Add New Verb'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Source Language"
            options={languageOptions}
            error={errors.source_language_id?.message}
            {...register('source_language_id')}
          />
          <Select
            label="Target Language"
            options={languageOptions}
            error={errors.target_language_id?.message}
            {...register('target_language_id')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Infinitive"
            placeholder="Enter the verb infinitive"
            error={errors.infinitive?.message}
            {...register('infinitive')}
          />
          <Input
            label="Translation"
            placeholder="Enter translation"
            error={errors.translation?.message}
            {...register('translation')}
          />
        </div>

        <div className="flex items-center gap-4">
          <Checkbox label="Irregular verb" {...register('is_irregular')} />
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Add any notes about usage, exceptions, etc."
          {...register('notes')}
        />

        {/* Audio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Audio (optional)</label>
          <div className="flex gap-2 mb-2">
            <Button type="button" variant={audioMode === 'tts' ? 'primary' : 'outline'} size="sm" onClick={() => setAudioMode('tts')}>
              <Volume2 className="w-4 h-4" /> TTS
            </Button>
            <Button type="button" variant={audioMode === 'url' ? 'primary' : 'outline'} size="sm" onClick={() => setAudioMode('url')}>
              <LinkIcon className="w-4 h-4" /> URL
            </Button>
            <Button type="button" variant={audioMode === 'upload' ? 'primary' : 'outline'} size="sm" onClick={() => setAudioMode('upload')}>
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
          {audioMode === 'tts' ? (
            <p className="text-sm text-muted-foreground">Will use browser text-to-speech</p>
          ) : audioMode === 'url' ? (
            <Input placeholder="Enter audio URL" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
          ) : (
            <div className="flex items-center gap-2">
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="text-sm" />
              {audioFile && <button type="button" onClick={() => setAudioFile(null)}><X className="w-4 h-4" /></button>}
            </div>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Categories</label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-24 overflow-y-auto">
              {categories.map((cat) => (
                <Checkbox
                  key={cat.id}
                  label={cat.name}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, cat.id])
                    } else {
                      setSelectedCategories(selectedCategories.filter((id) => id !== cat.id))
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conjugations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Conjugations</label>
            {unusedTenses.length > 0 && (
              <Select
                options={[
                  { value: '', label: 'Add tense...' },
                  ...unusedTenses.map((t) => ({ value: t.id, label: t.name })),
                ]}
                value=""
                onChange={(e) => {
                  const tense = availableTenses.find((t) => t.id === e.target.value)
                  if (tense) addConjugation(tense)
                }}
                className="w-48"
              />
            )}
          </div>

          {tensesWithConjugations.map((tenseId) => {
            const tense = availableTenses.find((t) => t.id === tenseId)
            const tenseConjugations = conjugations.filter((c) => c.tense_id === tenseId)

            return (
              <div key={tenseId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{tense?.name}</h4>
                  <button
                    type="button"
                    onClick={() => removeConjugationsForTense(tenseId)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tenseConjugations.map((conj, idx) => {
                    const globalIndex = conjugations.findIndex(
                      (c) => c.tense_id === conj.tense_id && c.person === conj.person
                    )
                    return (
                      <Input
                        key={`${conj.tense_id}-${conj.person}`}
                        label={conj.person}
                        value={conj.conjugated_form}
                        onChange={(e) => updateConjugation(globalIndex, e.target.value)}
                        className="text-sm"
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}

          {tensesWithConjugations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
              Select a tense above to add conjugations
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-card pb-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {verb ? 'Update' : 'Add'} Verb
          </Button>
        </div>
      </form>
    </Modal>
  )
}
