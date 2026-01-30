'use client'

import { useState } from 'react'
import { Volume2, Pencil, Trash2, ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import type { WordWithCategories } from '@/types/database'

interface WordCardProps {
  word: WordWithCategories
  onEdit: (word: WordWithCategories) => void
  onDelete: (word: WordWithCategories) => void
}

export function WordCard({ word, onEdit, onDelete }: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const playAudio = () => {
    if (word.audio_url) {
      const audio = new Audio(word.audio_url)
      audio.play()
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
    } else {
      // Use Web Speech API
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = word.target_language?.code || 'en'
      speechSynthesis.speak(utterance)
      setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Image thumbnail */}
        {word.image_url ? (
          <img
            src={word.image_url}
            alt={word.word}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{word.word}</h3>
            <button
              onClick={playAudio}
              className={`p-1 rounded-full hover:bg-muted transition-colors ${
                isPlaying ? 'text-primary' : 'text-muted-foreground'
              }`}
              title="Play pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-muted-foreground truncate">{word.translation}</p>

          {word.plural_form && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="opacity-70">Plural:</span> {word.plural_form}
            </p>
          )}

          {word.example_sentence && (
            <p className="text-sm text-muted-foreground mt-1 italic line-clamp-2">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          )}

          {/* Categories */}
          {word.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {word.categories.map((cat) => (
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
            onClick={() => onEdit(word)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(word)}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
