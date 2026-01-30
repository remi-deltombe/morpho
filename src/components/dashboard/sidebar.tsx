'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  BookOpen,
  Languages,
  Folder,
  Settings,
  LogOut,
  BookA,
  Upload,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Words', icon: BookOpen },
  { href: '/dashboard/verbs', label: 'Verbs', icon: BookA },
  { href: '/dashboard/categories', label: 'Categories', icon: Folder },
  { href: '/dashboard/languages', label: 'Languages', icon: Languages },
  { href: '/dashboard/import', label: 'Import / Export', icon: Upload },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-card border-r
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:sticky
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/dashboard" className="text-xl font-bold">
              Morph<span className="text-primary">ō</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={toggleTheme}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
