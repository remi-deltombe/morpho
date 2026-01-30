'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'
import type { Language } from '@/types/database'

export default function OnboardingPage() {
  const router = useRouter()
  const [languages, setLanguages] = useState<Language[]>([])
  const [nativeLanguage, setNativeLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    async function fetchLanguages() {
      const supabase = createClient()
      const { data } = await supabase
        .from('languages')
        .select('*')
        .eq('is_system', true)
        .order('name')

      if (data) {
        setLanguages(data)
      }
      setIsFetching(false)
    }
    fetchLanguages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nativeLanguage || !targetLanguage) {
      toast.error('Please select both languages')
      return
    }

    if (nativeLanguage === targetLanguage) {
      toast.error('Native and target language must be different')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in again')
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          native_language_id: nativeLanguage,
          target_language_id: targetLanguage,
          onboarding_completed: true,
        } as never)
        .eq('id', user.id)

      if (error) {
        toast.error('Failed to save preferences')
        return
      }

      toast.success('Welcome to Morphō!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const languageOptions = languages.map((lang) => ({
    value: lang.id,
    label: lang.name,
  }))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary-light/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Morphō</CardTitle>
          <CardDescription>
            Let&apos;s set up your language preferences to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Select
              label="Your Native Language"
              placeholder="Select your native language"
              options={languageOptions}
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              disabled={isFetching}
              hint="The language you already speak fluently"
            />

            <Select
              label="Language You're Learning"
              placeholder="Select your target language"
              options={languageOptions}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isFetching}
              hint="The language you want to learn"
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!nativeLanguage || !targetLanguage}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
