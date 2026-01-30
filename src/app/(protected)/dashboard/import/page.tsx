'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, Download, FileText, Wand2, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWords, useVerbs, useLanguages, useProfile } from '@/lib/hooks'
import { Button, Textarea, Select, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function ImportExportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'extract'>('import')
  const [importData, setImportData] = useState('')
  const [importType, setImportType] = useState<'json' | 'csv'>('json')
  const [isImporting, setIsImporting] = useState(false)
  const [extractText, setExtractText] = useState('')
  const [extractedWords, setExtractedWords] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const { words, refetch: refetchWords } = useWords()
  const { verbs, refetch: refetchVerbs } = useVerbs()
  const { languages } = useLanguages()
  const { profile } = useProfile()

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please paste data to import')
      return
    }

    setIsImporting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in again')
        return
      }

      let data: { words?: unknown[]; verbs?: unknown[] }

      if (importType === 'json') {
        data = JSON.parse(importData)
      } else {
        // Parse CSV
        const lines = importData.trim().split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
        const rows = lines.slice(1).map((line) => {
          const values = line.split(',')
          return headers.reduce((obj, header, i) => {
            obj[header] = values[i]?.trim() || ''
            return obj
          }, {} as Record<string, string>)
        })

        // Detect if it's words or verbs based on headers
        if (headers.includes('infinitive')) {
          data = { verbs: rows }
        } else {
          data = { words: rows }
        }
      }

      // Import words
      if (data.words && Array.isArray(data.words)) {
        const wordsArray = data.words as Record<string, unknown>[]
        const wordsToInsert = wordsArray.map((w) => ({
          user_id: user.id,
          word: w.word as string,
          translation: w.translation as string,
          plural_form: (w.plural_form as string) || null,
          example_sentence: (w.example_sentence as string) || null,
          notes: (w.notes as string) || null,
          source_language_id: (w.source_language_id as string) || profile?.native_language_id,
          target_language_id: (w.target_language_id as string) || profile?.target_language_id,
        }))

        const { error } = await supabase.from('words').insert(wordsToInsert as never)
        if (error) throw error
        toast.success(`Imported ${wordsToInsert.length} words`)
        refetchWords()
      }

      // Import verbs
      if (data.verbs && Array.isArray(data.verbs)) {
        const verbsArray = data.verbs as Record<string, unknown>[]
        const verbsToInsert = verbsArray.map((v) => ({
          user_id: user.id,
          infinitive: v.infinitive as string,
          translation: v.translation as string,
          is_irregular: v.is_irregular === true || v.is_irregular === 'true',
          notes: (v.notes as string) || null,
          source_language_id: (v.source_language_id as string) || profile?.native_language_id,
          target_language_id: (v.target_language_id as string) || profile?.target_language_id,
        }))

        const { error } = await supabase.from('verbs').insert(verbsToInsert as never)
        if (error) throw error
        toast.success(`Imported ${verbsToInsert.length} verbs`)
        refetchVerbs()
      }

      setImportData('')
    } catch (err) {
      toast.error('Failed to import data. Check the format.')
      console.error(err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = (type: 'words' | 'verbs', format: 'json' | 'csv') => {
    const data = type === 'words' ? words : verbs
    let content: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify({ [type]: data }, null, 2)
      filename = `morpho-${type}.json`
    } else {
      // CSV
      if (type === 'words') {
        const headers = ['word', 'translation', 'plural_form', 'example_sentence', 'notes']
        const rows = words.map((w) => headers.map((h) => `"${w[h as keyof typeof w] ?? ''}"`).join(','))
        content = [headers.join(','), ...rows].join('\n')
      } else {
        const headers = ['infinitive', 'translation', 'is_irregular', 'notes']
        const rows = verbs.map((v) => headers.map((h) => `"${v[h as keyof typeof v] ?? ''}"`).join(','))
        content = [headers.join(','), ...rows].join('\n')
      }
      filename = `morpho-${type}.csv`
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} ${type}`)
  }

  const handleExtract = async () => {
    if (!extractText.trim()) {
      toast.error('Please paste text to extract words from')
      return
    }

    // Simple word extraction: split by non-word characters, filter, normalize
    const allWords = extractText
      .toLowerCase()
      .split(/[^a-zA-ZÀ-ÿ]+/)
      .filter((w) => w.length > 2)
      .filter((w, i, arr) => arr.indexOf(w) === i) // unique

    // Filter out words that already exist in vocabulary
    const existingWords = new Set(words.map((w) => w.word.toLowerCase()))
    const newWords = allWords.filter((w) => !existingWords.has(w))

    setExtractedWords(newWords)
    toast.success(`Found ${newWords.length} new words`)
  }

  const copyExtractedWords = () => {
    navigator.clipboard.writeText(extractedWords.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const addExtractedToVocabulary = async () => {
    if (extractedWords.length === 0) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please sign in again')
      return
    }

    const wordsToInsert = extractedWords.map((word) => ({
      user_id: user.id,
      word,
      translation: '', // User will need to fill this
      source_language_id: profile?.native_language_id,
      target_language_id: profile?.target_language_id,
    }))

    const { error } = await supabase.from('words').insert(wordsToInsert as never)

    if (error) {
      toast.error('Failed to add words')
    } else {
      toast.success(`Added ${extractedWords.length} words to vocabulary`)
      setExtractedWords([])
      setExtractText('')
      refetchWords()
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Import / Export" />

        <div className="p-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setActiveTab('extract')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'extract'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wand2 className="w-4 h-4 inline mr-2" />
              Extract Words
            </button>
          </div>

          {/* Import Tab */}
          {activeTab === 'import' && (
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Import words or verbs from JSON or CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={importType === 'json' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportType('json')}
                  >
                    JSON
                  </Button>
                  <Button
                    variant={importType === 'csv' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportType('csv')}
                  >
                    CSV
                  </Button>
                </div>

                <Textarea
                  label="Paste your data"
                  placeholder={
                    importType === 'json'
                      ? '{\n  "words": [\n    { "word": "hello", "translation": "bonjour" }\n  ]\n}'
                      : 'word,translation,plural_form\nhello,bonjour,\ncat,chat,cats'
                  }
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />

                <Button onClick={handleImport} isLoading={isImporting}>
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Export Words</CardTitle>
                  <CardDescription>
                    {words.length} words in your vocabulary
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExport('words', 'json')}>
                    <FileText className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('words', 'csv')}>
                    <FileText className="w-4 h-4" />
                    CSV
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Verbs</CardTitle>
                  <CardDescription>
                    {verbs.length} verbs in your vocabulary
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExport('verbs', 'json')}>
                    <FileText className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('verbs', 'csv')}>
                    <FileText className="w-4 h-4" />
                    CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Extract Tab */}
          {activeTab === 'extract' && (
            <Card>
              <CardHeader>
                <CardTitle>Extract Unknown Words</CardTitle>
                <CardDescription>
                  Paste text and extract words you don&apos;t know yet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Paste your text"
                  placeholder="Paste any text (article, book excerpt, etc.) and we'll extract words you haven't learned yet..."
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  className="min-h-[150px]"
                />

                <Button onClick={handleExtract}>
                  <Wand2 className="w-4 h-4" />
                  Extract Words
                </Button>

                {extractedWords.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Found {extractedWords.length} new words
                      </h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyExtractedWords}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                        <Button size="sm" onClick={addExtractedToVocabulary}>
                          Add All to Vocabulary
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-48 overflow-y-auto">
                      {extractedWords.map((word) => (
                        <span
                          key={word}
                          className="px-2 py-1 text-sm bg-background rounded border"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
