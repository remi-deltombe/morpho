'use client'

import { Menu, Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'

interface HeaderProps {
  onMenuClick: () => void
  title: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function Header({
  onMenuClick,
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur border-b safe-top">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>

      {onSearchChange && (
        <div className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
    </header>
  )
}
