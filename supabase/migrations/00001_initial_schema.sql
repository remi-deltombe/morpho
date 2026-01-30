-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  native_language_id UUID,
  target_language_id UUID,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create languages table
CREATE TABLE languages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenses table
CREATE TABLE tenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table (hierarchical)
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create words table
CREATE TABLE words (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_language_id UUID REFERENCES languages(id) ON DELETE RESTRICT NOT NULL,
  target_language_id UUID REFERENCES languages(id) ON DELETE RESTRICT NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  plural_form TEXT,
  example_sentence TEXT,
  notes TEXT,
  image_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create word_categories junction table
CREATE TABLE word_categories (
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (word_id, category_id)
);

-- Create verbs table
CREATE TABLE verbs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_language_id UUID REFERENCES languages(id) ON DELETE RESTRICT NOT NULL,
  target_language_id UUID REFERENCES languages(id) ON DELETE RESTRICT NOT NULL,
  infinitive TEXT NOT NULL,
  translation TEXT NOT NULL,
  is_irregular BOOLEAN DEFAULT FALSE,
  notes TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verb_categories junction table
CREATE TABLE verb_categories (
  verb_id UUID REFERENCES verbs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (verb_id, category_id)
);

-- Create conjugations table
CREATE TABLE conjugations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  verb_id UUID REFERENCES verbs(id) ON DELETE CASCADE NOT NULL,
  tense_id UUID REFERENCES tenses(id) ON DELETE CASCADE NOT NULL,
  person TEXT NOT NULL,
  conjugated_form TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints for profiles
ALTER TABLE profiles 
  ADD CONSTRAINT fk_native_language 
  FOREIGN KEY (native_language_id) REFERENCES languages(id) ON DELETE SET NULL;

ALTER TABLE profiles 
  ADD CONSTRAINT fk_target_language 
  FOREIGN KEY (target_language_id) REFERENCES languages(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_languages_user_id ON languages(user_id);
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_tenses_language_id ON tenses(language_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_words_user_id ON words(user_id);
CREATE INDEX idx_words_source_language ON words(source_language_id);
CREATE INDEX idx_words_target_language ON words(target_language_id);
CREATE INDEX idx_verbs_user_id ON verbs(user_id);
CREATE INDEX idx_verbs_source_language ON verbs(source_language_id);
CREATE INDEX idx_verbs_target_language ON verbs(target_language_id);
CREATE INDEX idx_conjugations_verb_id ON conjugations(verb_id);
CREATE INDEX idx_conjugations_tense_id ON conjugations(tense_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conjugations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Languages policies (system languages visible to all, custom to owner)
CREATE POLICY "Users can view system languages" ON languages
  FOR SELECT USING (is_system = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can insert own languages" ON languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own languages" ON languages
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete own languages" ON languages
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- Tenses policies (visible if language is visible)
CREATE POLICY "Users can view tenses for accessible languages" ON tenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM languages 
      WHERE languages.id = tenses.language_id 
      AND (languages.is_system = TRUE OR languages.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert tenses for own languages" ON tenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM languages 
      WHERE languages.id = language_id 
      AND languages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tenses for own languages" ON tenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM languages 
      WHERE languages.id = language_id 
      AND languages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tenses for own languages" ON tenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM languages 
      WHERE languages.id = language_id 
      AND languages.user_id = auth.uid()
    )
  );

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Words policies
CREATE POLICY "Users can view own words" ON words
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own words" ON words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words" ON words
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words" ON words
  FOR DELETE USING (auth.uid() = user_id);

-- Word categories policies
CREATE POLICY "Users can view own word categories" ON word_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM words WHERE words.id = word_id AND words.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own word categories" ON word_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM words WHERE words.id = word_id AND words.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own word categories" ON word_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM words WHERE words.id = word_id AND words.user_id = auth.uid())
  );

-- Verbs policies
CREATE POLICY "Users can view own verbs" ON verbs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verbs" ON verbs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verbs" ON verbs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own verbs" ON verbs
  FOR DELETE USING (auth.uid() = user_id);

-- Verb categories policies
CREATE POLICY "Users can view own verb categories" ON verb_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own verb categories" ON verb_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own verb categories" ON verb_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

-- Conjugations policies
CREATE POLICY "Users can view own conjugations" ON conjugations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own conjugations" ON conjugations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

CREATE POLICY "Users can update own conjugations" ON conjugations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own conjugations" ON conjugations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM verbs WHERE verbs.id = verb_id AND verbs.user_id = auth.uid())
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_words_updated_at
  BEFORE UPDATE ON words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verbs_updated_at
  BEFORE UPDATE ON verbs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
