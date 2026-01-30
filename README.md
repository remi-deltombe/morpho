# Morphō 🦋

A modern language learning application to help you master vocabulary, verbs, and conjugations.

## Features

- **🔐 Authentication**: Secure email/password authentication with verification and password reset
- **📚 Words**: Save words with translations, plural forms, example sentences, notes, and images
- **📖 Verbs**: Track verb conjugations with customizable tenses per language
- **📁 Categories**: Organize content with hierarchical categories
- **🔊 Audio**: Text-to-speech pronunciation or custom audio uploads
- **📱 PWA**: Install on your phone like a native app
- **🌙 Dark Mode**: Beautiful dark and light themes
- **📤 Import/Export**: Bulk import from JSON/CSV, export your data
- **✨ Text Extraction**: Paste any text and extract unknown words

## Tech Stack

- **Frontend**: React 19 + Next.js 16 (App Router)
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for audio/images)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works great)

### 1. Clone and Install

```bash
cd morpho
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL
   - anon/public key

3. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Set Up Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the migration file: `supabase/migrations/00001_initial_schema.sql`
3. Run the seed file: `supabase/seed.sql`

### 4. Set Up Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create two buckets:
   - `images` (public)
   - `audio` (public)

3. For each bucket, add this RLS policy:
   - Policy name: `Allow authenticated uploads`
   - Allowed operations: `INSERT`
   - Policy: `(auth.uid() IS NOT NULL)`

### 5. Configure Auth

1. Go to **Authentication > Providers** in Supabase
2. Enable **Email** provider
3. Go to **URL Configuration** and set:
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Update Supabase URLs

After deployment, update your Supabase settings:
- **Site URL**: Your Vercel URL
- **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`

## PWA Icons

To generate proper PWA icons, you can use any PNG to generate multiple sizes.

Create icons in these sizes in `/public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- apple-touch-icon.png (180x180)

You can use tools like [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register, etc.)
│   ├── (protected)/       # Protected pages (dashboard, etc.)
│   └── auth/callback/     # OAuth callback
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard components
│   ├── words/            # Word-related components
│   └── verbs/            # Verb-related components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   └── hooks/            # Custom React hooks
├── types/                 # TypeScript types
└── data/                  # Static data (language templates)

supabase/
├── migrations/           # Database migrations
└── seed.sql             # Seed data
```

## Language Templates

Pre-configured templates are available for:
- **English**: 15 tenses
- **French**: 17 tenses
- **Finnish**: 14 tenses

You can add custom languages and tenses in the app.

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT License - feel free to use this for your own learning projects!

---

Made with ❤️ for language learners
