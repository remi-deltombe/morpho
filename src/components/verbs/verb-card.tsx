'use client'

import { useState } from 'react'
import { Volume2, Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui'
import type { VerbWithConjugations } from '@/types/database'

interface VerbCardProps {
  verb: VerbWithConjugations
  onEdit: (verb: VerbWithConjugations) => void
  onDelete: (verb: VerbWithConjugations) => void
}

export function VerbCard({ verb, onEdit, onDelete }: VerbCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const playAudio = () => {
    if (verb.audio_url) {
      const audio = new Audio(verb.audio_url)
      audio.play()
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(verb.infinitive)
      utterance.lang = verb.target_language?.code || 'en'
      speechSynthesis.speak(utterance)
      setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
    }
  }

  // Group conjugations by tense
  const conjugationsByTense = verb.conjugations.reduce((acc, conj) => {
    const tenseName = conj.tense?.name || 'Unknown'
    if (!acc[tenseName]) acc[tenseName] = []
    acc[tenseName].push(conj)
    return acc
  }, {} as Record<string, typeof verb.conjugations>)

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Irregular indicator */}
          {verb.is_irregular && (
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0" title="Irregular verb">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{verb.infinitive}</h3>
              <button
                onClick={playAudio}
                className={`p-1 rounded-full hover:bg-muted transition-colors ${
                  isPlaying ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              {verb.is_irregular && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-warning/10 text-warning">
                  Irregular
                </span>
              )}
            </div>

            <p className="text-muted-foreground">{verb.translation}</p>

            {verb.notes && (
              <p className="text-sm text-muted-foreground mt-1 italic">
                {verb.notes}
              </p>
            )}

            {/* Categories */}
            {verb.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {verb.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                    style={cat.color ? { backgroundColor: `${cat.color}20`, color: cat.color } : {}}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(verb)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(verb)}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expand/Collapse Conjugations */}
        {verb.conjugations.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide conjugations
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show conjugations ({verb.conjugations.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Conjugations Table */}
      {isExpanded && verb.conjugations.length > 0 && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {Object.entries(conjugationsByTense).map(([tense, conjugations]) => (
            <div key={tense}>
              <h4 className="font-medium text-sm mb-2">{tense}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {conjugations.map((conj) => (
                  <div key={conj.id} className="text-sm">
                    <span className="text-muted-foreground">{conj.person}:</span>{' '}
                    <span className="font-medium">{conj.conjugated_form}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
