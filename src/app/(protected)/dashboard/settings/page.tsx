'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { User, Languages, Palette, Shield, Moon, Sun, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useLanguages } from '@/lib/hooks'
import { useTheme } from '@/components/theme-provider'
import { Button, Select, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, isLoading: profileLoading } = useProfile()
  const { languages } = useLanguages()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [nativeLanguage, setNativeLanguage] = useState(profile?.native_language_id || '')
  const [targetLanguage, setTargetLanguage] = useState(profile?.target_language_id || '')
  const [isSaving, setIsSaving] = useState(false)

  // Update state when profile loads
  useState(() => {
    if (profile) {
      setNativeLanguage(profile.native_language_id || '')
      setTargetLanguage(profile.target_language_id || '')
    }
  })

  const handleSaveLanguages = async () => {
    if (!nativeLanguage || !targetLanguage) {
      toast.error('Please select both languages')
      return
    }

    if (nativeLanguage === targetLanguage) {
      toast.error('Native and target language must be different')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in again')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          native_language_id: nativeLanguage,
          target_language_id: targetLanguage,
        } as never)
        .eq('id', user.id)

      if (error) throw error
      toast.success('Language preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const languageOptions = languages.map((lang) => ({
    value: lang.id,
    label: lang.name,
  }))

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Settings" />

        <div className="p-4 space-y-6 max-w-2xl">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile?.email || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'Loading...'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Language Preferences</CardTitle>
                  <CardDescription>Default languages for new entries</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Native Language"
                options={languageOptions}
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
              />
              <Select
                label="Target Language"
                options={languageOptions}
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              />
              <Button onClick={handleSaveLanguages} isLoading={isSaving}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how Morphō looks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Theme</label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'primary' : 'outline'}
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'outline'}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'primary' : 'outline'}
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={async () => {
                  const supabase = createClient()
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    profile?.email || '',
                    { redirectTo: `${window.location.origin}/reset-password` }
                  )
                  if (error) {
                    toast.error('Failed to send reset email')
                  } else {
                    toast.success('Password reset email sent')
                  }
                }}
              >
                Change Password
              </Button>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                <Button
                  variant="destructive"
                  onClick={() => {
                    toast.error('Account deletion is not implemented in this demo')
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
