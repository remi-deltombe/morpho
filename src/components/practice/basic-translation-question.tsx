'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Check, X, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import type { PracticeItem, QuestionConfig } from '@/types/database'

interface BasicTranslationQuestionProps {
  item: PracticeItem
  config: QuestionConfig
  onAnswer: (isCorrect: boolean) => void
  onSkip: () => void
}

export function BasicTranslationQuestion({
  item,
  config,
  onAnswer,
  onSkip,
}: BasicTranslationQuestionProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Determine what to show and what to ask for
  const isTargetToSource = config.direction === 'target-to-source'
  const showText = isTargetToSource ? item.targetText : item.translationText
  const expectedAnswer = isTargetToSource ? item.translationText : item.targetText
  const showLanguage = isTargetToSource ? item.targetLanguage : item.sourceLanguage
  const answerLanguage = isTargetToSource ? item.sourceLanguage : item.targetLanguage

  // Audio-only mode for level 3+
  const isAudioOnly = config.level >= 3 && isTargetToSource && item.audioUrl && Math.random() > 0.5

  // Play audio
  const playAudio = () => {
    if (config.audioPlayLimit !== null && audioPlayed >= config.audioPlayLimit) {
      return
    }

    if (item.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(item.audioUrl)
      audioRef.current.play()
      setAudioPlayed(prev => prev + 1)
    } else {
      // Use TTS
      const utterance = new SpeechSynthesisUtterance(
        isTargetToSource ? item.targetText : item.translationText
      )
      utterance.lang = showLanguage.code
      speechSynthesis.speak(utterance)
      setAudioPlayed(prev => prev + 1)
    }
  }

  // Auto-play audio on mount for appropriate levels
  useEffect(() => {
    if (config.audioAutoPlay && config.level <= 3) {
      const timer = setTimeout(() => {
        playAudio()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [item.id])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [item.id])

  // Reset state when item changes
  useEffect(() => {
    setUserAnswer('')
    setShowResult(false)
    setIsCorrect(false)
    setAudioPlayed(0)
  }, [item.id])

  // Check answer
  const checkAnswer = () => {
    const normalizedUser = userAnswer.toLowerCase().trim()
    const normalizedExpected = expectedAnswer.toLowerCase().trim()
    
    // Also check plural form if asking for target language
    const isAnswerCorrect = 
      normalizedUser === normalizedExpected ||
      (item.pluralForm && normalizedUser === item.pluralForm.toLowerCase().trim())
    
    setIsCorrect(isAnswerCorrect)
    setShowResult(true)
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showResult) {
      onAnswer(isCorrect)
    } else {
      checkAnswer()
    }
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showResult) {
      onAnswer(isCorrect)
    }
  }

  const canPlayAudio = config.audioPlayLimit === null || audioPlayed < config.audioPlayLimit

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question Card */}
      <div className="bg-card rounded-2xl p-8 shadow-lg border">
        {/* Level indicator */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Level {config.level}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.type === 'word' ? 'Word' : 'Verb'} • Score: {item.learningScore}
          </span>
        </div>

        {/* Audio Button */}
        {(item.audioUrl || true) && (
          <button
            type="button"
            onClick={playAudio}
            disabled={!canPlayAudio}
            className={`
              w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center
              transition-all duration-200
              ${canPlayAudio 
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'}
            `}
          >
            <Volume2 className="w-8 h-8" />
          </button>
        )}

        {/* Question Text */}
        {!isAudioOnly && (
          <div className="text-center mb-6">
            <p className="text-3xl font-bold mb-2">{showText}</p>
            {config.showPluralForm && item.pluralForm && (
              <p className="text-lg text-muted-foreground">
                Plural: {item.pluralForm}
              </p>
            )}
            {config.showExamples && item.exampleSentence && (
              <p className="text-sm text-muted-foreground italic mt-3">
                "{item.exampleSentence}"
              </p>
            )}
          </div>
        )}

        {isAudioOnly && (
          <div className="text-center mb-6">
            <p className="text-lg text-muted-foreground">
              Listen and translate to {answerLanguage.name}
            </p>
          </div>
        )}

        {/* Direction indicator */}
        <p className="text-center text-sm text-muted-foreground mb-4">
          Translate to <span className="font-medium text-foreground">{answerLanguage.name}</span>
        </p>

        {/* Answer Input */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type your answer in ${answerLanguage.name}...`}
              className={`
                text-center text-lg py-6
                ${showResult 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''}
              `}
              disabled={showResult}
            />
            {showResult && (
              <div className={`
                absolute right-3 top-1/2 -translate-y-1/2
                w-8 h-8 rounded-full flex items-center justify-center
                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
              `}>
                {isCorrect ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <X className="w-5 h-5 text-white" />
                )}
              </div>
            )}
          </div>

          {/* Show correct answer if wrong */}
          {showResult && !isCorrect && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Correct answer:</p>
              <p className="text-xl font-semibold text-foreground">{expectedAnswer}</p>
              {item.pluralForm && (
                <p className="text-sm text-muted-foreground mt-1">
                  Plural: {item.pluralForm}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {!showResult ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onSkip}
                >
                  Skip
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!userAnswer.trim()}
                >
                  Check
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                className="w-full"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
