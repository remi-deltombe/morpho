import Link from 'next/link'
import { ArrowRight, BookOpen, Languages, Folder, Volume2, Smartphone, Cloud } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="text-2xl font-bold">
            Morph<span className="text-primary">ō</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 px-6 pt-16 pb-24 max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Master any language,
            <br />
            <span className="text-primary">one word at a time</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Build your vocabulary, learn verb conjugations, and track your progress
            with Morphō — your personal language learning companion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-lg font-medium"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-muted transition-colors text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need to learn
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Morphō provides all the tools to build and retain your vocabulary effectively
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Words & Translations</h3>
              <p className="text-muted-foreground">
                Save words with translations, plural forms, example sentences, and notes.
                Build your vocabulary systematically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verb Conjugations</h3>
              <p className="text-muted-foreground">
                Master verb conjugations with customizable tenses for each language.
                Mark irregular verbs and track all forms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Categories</h3>
              <p className="text-muted-foreground">
                Organize your vocabulary with hierarchical categories. Filter and find
                words by topic easily.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Audio Pronunciation</h3>
              <p className="text-muted-foreground">
                Hear correct pronunciations with text-to-speech or upload your own
                audio recordings for each word.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Ready</h3>
              <p className="text-muted-foreground">
                Install Morphō on your phone like a native app. Learn on the go with
                full offline support.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-card rounded-xl border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Import & Export</h3>
              <p className="text-muted-foreground">
                Import vocabulary lists or export your data. Extract unknown words
                from any text automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Learn any language
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Morphō supports any language with customizable tenses. Pre-configured templates
            for popular languages get you started quickly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['English', 'French', 'Finnish', 'Spanish', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Chinese'].map((lang) => (
              <span
                key={lang}
                className="px-4 py-2 bg-muted rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              + Any language
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start learning?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your free account and start building your vocabulary today.
            No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-lg font-medium"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold">
            Morph<span className="text-primary">ō</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Morphō. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
