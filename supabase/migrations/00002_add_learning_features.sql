-- Migration: Add learning/practice features to words and verbs
-- This adds spaced repetition support for the Practice feature

-- Add learning columns to words table
ALTER TABLE words 
  ADD COLUMN IF NOT EXISTS learning_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS practice_count INTEGER DEFAULT 0;

-- Add learning columns to verbs table
ALTER TABLE verbs 
  ADD COLUMN IF NOT EXISTS learning_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS practice_count INTEGER DEFAULT 0;

-- Create indexes for efficient spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_words_learning_score ON words(learning_score);
CREATE INDEX IF NOT EXISTS idx_words_last_practiced ON words(last_practiced);
CREATE INDEX IF NOT EXISTS idx_verbs_learning_score ON verbs(learning_score);
CREATE INDEX IF NOT EXISTS idx_verbs_last_practiced ON verbs(last_practiced);
