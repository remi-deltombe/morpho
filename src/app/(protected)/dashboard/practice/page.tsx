'use client'

import { useState } from 'react'
import { 
  Brain, 
  Filter, 
  Trophy, 
  Target, 
  Flame,
  BookOpen,
  BookA,
  X,
  ChevronDown
} from 'lucide-react'
import { usePractice, useCategories } from '@/lib/hooks'
import { Button, Checkbox, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { BasicTranslationQuestion } from '@/components/practice/basic-translation-question'

export default function PracticePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [includeWords, setIncludeWords] = useState(true)
  const [includeVerbs, setIncludeVerbs] = useState(true)
  const [practiceStarted, setPracticeStarted] = useState(false)

  const { categories } = useCategories()
  
  const {
    currentItem,
    questionConfig,
    isLoading,
    sessionStats,
    totalItems,
    submitAnswer,
    skipItem,
    refetch,
  } = usePractice({
    categoryIds: selectedCategories,
    includeWords,
    includeVerbs,
  })

  const handleStartPractice = () => {
    refetch()
    setPracticeStarted(true)
  }

  const handleEndPractice = () => {
    setPracticeStarted(false)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const accuracy = sessionStats.totalPracticed > 0
    ? Math.round((sessionStats.correct / sessionStats.totalPracticed) * 100)
    : 0

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Practice" />

        <div className="p-4">
          {!practiceStarted ? (
            // Setup Screen
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Hero Card */}
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
                  <p className="text-muted-foreground mb-6">
                    Train your vocabulary with spaced repetition learning
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="flex justify-center gap-8 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{totalItems}</p>
                      <p className="text-sm text-muted-foreground">Items Available</p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={handleStartPractice}
                    disabled={totalItems === 0}
                    className="px-8"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Start Practice Session
                  </Button>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Filter className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Filters</CardTitle>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
                
                {showFilters && (
                  <CardContent className="space-y-6">
                    {/* Item Type */}
                    <div>
                      <p className="text-sm font-medium mb-3">Include</p>
                      <div className="flex gap-4">
                        <Checkbox
                          label="Words"
                          checked={includeWords}
                          onChange={(e) => setIncludeWords(e.target.checked)}
                        />
                        <Checkbox
                          label="Verbs"
                          checked={includeVerbs}
                          onChange={(e) => setIncludeVerbs(e.target.checked)}
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Categories</p>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(category => (
                            <button
                              key={category.id}
                              onClick={() => toggleCategory(category.id)}
                              className={`
                                px-3 py-1.5 rounded-full text-sm font-medium
                                transition-colors duration-200
                                ${selectedCategories.includes(category.id)
                                  ? 'bg-primary text-white'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }
                              `}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                        {selectedCategories.length > 0 && (
                          <button
                            onClick={() => setSelectedCategories([])}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Empty State */}
              {totalItems === 0 && !isLoading && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No items to practice</h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedCategories.length > 0 || !includeWords || !includeVerbs
                        ? 'Try adjusting your filters or add more items to your vocabulary.'
                        : 'Add some words or verbs to start practicing!'}
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Add Words
                      </Button>
                      <Button variant="outline" onClick={() => window.location.href = '/dashboard/verbs'}>
                        <BookA className="w-4 h-4 mr-2" />
                        Add Verbs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Practice Session
            <div className="max-w-4xl mx-auto">
              {/* Session Stats Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{sessionStats.correct}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5 text-red-500" />
                    <span className="font-medium">{sessionStats.incorrect}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">{accuracy}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">{sessionStats.totalPracticed}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleEndPractice}>
                  End Session
                </Button>
              </div>

              {/* Question */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : currentItem && questionConfig ? (
                <BasicTranslationQuestion
                  key={`${currentItem.id}-${sessionStats.totalPracticed}`}
                  item={currentItem}
                  config={questionConfig}
                  onAnswer={submitAnswer}
                  onSkip={skipItem}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Session Complete!</h3>
                    <p className="text-muted-foreground mb-6">
                      You've practiced all available items.
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{sessionStats.correct}</p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</p>
                        <p className="text-xs text-muted-foreground">Incorrect</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                    </div>
                    <Button onClick={handleEndPractice}>
                      Back to Setup
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
