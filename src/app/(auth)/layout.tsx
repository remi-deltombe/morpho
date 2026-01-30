import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary-light/20">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Morph<span className="text-primary">ō</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Master vocabulary, verbs & conjugations
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Morphō. All rights reserved.
      </p>
    </div>
  )
}
