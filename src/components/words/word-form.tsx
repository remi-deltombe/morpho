"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Volume2, Upload, Link as LinkIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCategories, useLanguages, useProfile } from "@/lib/hooks";
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Checkbox,
} from "@/components/ui";
import type { WordWithCategories } from "@/types/database";

const wordSchema = z.object({
  word: z.string().min(1, "Word is required"),
  translation: z.string().min(1, "Translation is required"),
  plural_form: z.string().optional(),
  example_sentence: z.string().optional(),
  notes: z.string().optional(),
  source_language_id: z.string().min(1, "Source language is required"),
  target_language_id: z.string().min(1, "Target language is required"),
});

type WordFormData = z.infer<typeof wordSchema>;

interface WordFormProps {
  isOpen: boolean;
  onClose: () => void;
  word?: WordWithCategories | null;
  onSuccess: () => void;
}

export function WordForm({ isOpen, onClose, word, onSuccess }: WordFormProps) {
  const { profile } = useProfile();
  const { languages } = useLanguages();
  const { categories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [audioMode, setAudioMode] = useState<"url" | "upload" | "tts">("tts");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      source_language_id: profile?.native_language_id || "",
      target_language_id: profile?.target_language_id || "",
    },
  });

  // Set language defaults when profile loads (handles async loading)
  useEffect(() => {
    if (isOpen && !word && profile) {
      if (profile.native_language_id) {
        setValue("source_language_id", profile.native_language_id);
      }
      if (profile.target_language_id) {
        setValue("target_language_id", profile.target_language_id);
      }
    }
  }, [isOpen, word, profile, setValue]);

  useEffect(() => {
    if (!isOpen) return;

    if (word) {
      setValue("word", word.word);
      setValue("translation", word.translation);
      setValue("plural_form", word.plural_form || "");
      setValue("example_sentence", word.example_sentence || "");
      setValue("notes", word.notes || "");
      setValue("source_language_id", word.source_language_id);
      setValue("target_language_id", word.target_language_id);
      setSelectedCategories(word.categories.map((c) => c.id));
      setImageUrl(word.image_url || "");
      setAudioUrl(word.audio_url || "");
    } else {
      // Reset form fields for new word

      reset({
        word: "",
        translation: "",
        plural_form: "",
        example_sentence: "",
        notes: "",
        source_language_id: "",
        target_language_id: "",
      });
      setSelectedCategories([]);
      setImageUrl("");
      setAudioUrl("");
      setImageFile(null);
      setAudioFile(null);
    }
  }, [isOpen, word, profile, reset]);

  const uploadFile = async (
    file: File,
    bucket: string,
  ): Promise<string | null> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      toast.error(
        `Failed to upload ${bucket === "images" ? "image" : "audio"}`,
      );
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const onSubmit = async (data: WordFormData) => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in again");
        return;
      }

      // Handle file uploads
      let finalImageUrl = imageUrl;
      let finalAudioUrl = audioUrl;

      if (imageFile) {
        const url = await uploadFile(imageFile, "images");
        if (url) finalImageUrl = url;
      }

      if (audioFile) {
        const url = await uploadFile(audioFile, "audio");
        if (url) finalAudioUrl = url;
      }

      const wordData = {
        ...data,
        user_id: user.id,
        image_url: finalImageUrl || null,
        audio_url: finalAudioUrl || null,
      };

      if (word) {
        // Update existing word
        const { error } = await supabase
          .from("words")
          .update(wordData as never)
          .eq("id", word.id);

        if (error) throw error;

        // Update categories
        await supabase.from("word_categories").delete().eq("word_id", word.id);
        if (selectedCategories.length > 0) {
          await supabase.from("word_categories").insert(
            selectedCategories.map((catId) => ({
              word_id: word.id,
              category_id: catId,
            })) as never,
          );
        }

        toast.success("Word updated successfully");
      } else {
        // Create new word
        const { data: newWord, error } = await supabase
          .from("words")
          .insert(wordData as never)
          .select("id")
          .single();

        if (error) throw error;

        const wordId = (newWord as { id: string }).id;

        // Add categories
        if (selectedCategories.length > 0) {
          await supabase.from("word_categories").insert(
            selectedCategories.map((catId) => ({
              word_id: wordId,
              category_id: catId,
            })) as never,
          );
        }

        toast.success("Word added successfully");
      }

      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to save word");
    } finally {
      setIsLoading(false);
    }
  };

  const testTTS = () => {
    const wordValue = (document.getElementById("word") as HTMLInputElement)
      ?.value;
    if (wordValue) {
      const targetLang = languages.find(
        (l) =>
          l.id ===
          (document.getElementById("target_language_id") as HTMLSelectElement)
            ?.value,
      );
      const utterance = new SpeechSynthesisUtterance(wordValue);
      utterance.lang = targetLang?.code || "en";
      speechSynthesis.speak(utterance);
    }
  };

  const languageOptions = languages.map((lang) => ({
    value: lang.id,
    label: lang.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={word ? "Edit Word" : "Add New Word"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Source Language"
            options={languageOptions}
            error={errors.source_language_id?.message}
            {...register("source_language_id")}
          />
          <Select
            label="Target Language"
            options={languageOptions}
            error={errors.target_language_id?.message}
            {...register("target_language_id")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Word"
            placeholder="Enter the word"
            error={errors.word?.message}
            {...register("word")}
          />
          <Input
            label="Translation"
            placeholder="Enter translation"
            error={errors.translation?.message}
            {...register("translation")}
          />
        </div>

        <Input
          label="Plural Form (optional)"
          placeholder="Enter plural form"
          {...register("plural_form")}
        />

        <Textarea
          label="Example Sentence (optional)"
          placeholder="Enter an example sentence"
          {...register("example_sentence")}
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Add any notes"
          {...register("notes")}
        />

        {/* Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Image (optional)</label>
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={imageMode === "url" ? "primary" : "outline"}
              size="sm"
              onClick={() => setImageMode("url")}
            >
              <LinkIcon className="w-4 h-4" />
              URL
            </Button>
            <Button
              type="button"
              variant={imageMode === "upload" ? "primary" : "outline"}
              size="sm"
              onClick={() => setImageMode("upload")}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
          {imageMode === "url" ? (
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              {imageFile && (
                <button type="button" onClick={() => setImageFile(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Audio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Audio (optional)</label>
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={audioMode === "tts" ? "primary" : "outline"}
              size="sm"
              onClick={() => setAudioMode("tts")}
            >
              <Volume2 className="w-4 h-4" />
              TTS
            </Button>
            <Button
              type="button"
              variant={audioMode === "url" ? "primary" : "outline"}
              size="sm"
              onClick={() => setAudioMode("url")}
            >
              <LinkIcon className="w-4 h-4" />
              URL
            </Button>
            <Button
              type="button"
              variant={audioMode === "upload" ? "primary" : "outline"}
              size="sm"
              onClick={() => setAudioMode("upload")}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
          {audioMode === "tts" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              <span>Will use browser text-to-speech</span>
              <Button type="button" variant="ghost" size="sm" onClick={testTTS}>
                Test
              </Button>
            </div>
          ) : audioMode === "url" ? (
            <Input
              placeholder="Enter audio URL"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              {audioFile && (
                <button type="button" onClick={() => setAudioFile(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Categories</label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              {categories.map((cat) => (
                <Checkbox
                  key={cat.id}
                  label={cat.name}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, cat.id]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((id) => id !== cat.id),
                      );
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {word ? "Update" : "Add"} Word
          </Button>
        </div>
      </form>
    </Modal>
  );
}
