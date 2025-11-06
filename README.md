# AI Judge Ghana

Virtual courtroom where lawyers argue via voice or text and an AI judge delivers verdicts following Ghanaian court procedures (Evidence Act NRCD 323, 1992 Constitution).

## Tech Stack
- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Supabase (Auth, Database, Storage, Realtime)
- OpenAI Whisper (transcription) + GPT-4/GPT-4o-mini (verdict)
- Vercel (hosting)

## Getting Started

1) Clone and install
```bash
npm install
```

2) Environment variables (create .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
# Optional for server-to-self callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3) Tailwind is preconfigured. Start the dev server:
```bash
npm run dev
```

4) Supabase setup
- Create a project in Supabase
- Run SQL in `supabase/migrations/0001_init.sql`
- Create a storage bucket named `audio` (public)
- Realtime: ensure `cases`, `arguments`, `verdicts` are part of publication (included in migration)

5) OpenAI setup
- Add `OPENAI_API_KEY` to Vercel/Supabase environment

## Key Flows

- Authentication: Magic link via Supabase Auth (email)
- Case: Create at `/case/new` or join via `/join`
- Courtroom: `/case/[id]` shows stage, record audio -> uploads to Supabase Storage -> server transcribes with Whisper -> saves `arguments`
- Progression: when both lawyers submit for a stage, backend advances `cases.current_stage`. After `closing_submission`, verdict is generated.
- Verdict: Stored in `verdicts`, displayed in UI and visible from `/history`.

## Database Schema (in `supabase/migrations`)
- `users` (profiles)
- `cases` (case state; `current_stage`)
- `arguments` (per-stage submissions with transcript & audio path)
- `verdicts` (AI judge result JSON)

## Deployment
- Push to GitHub and import to Vercel
- Set env vars in Vercel
- Link Supabase project
- Enable Realtime and create `audio` storage bucket

## Notes
- Whisper model: `whisper-1`
- Chat model: `gpt-4o-mini` (or `gpt-4-turbo`)
- Client uses Supabase Realtime to listen for case stage changes and verdict creation

## MVP Checklist
- Auth (Supabase)
- Create/Join Case
- Voice Recording + Whisper transcription
- Stage-based courtroom flow
- Realtime sync between lawyers
- AI verdict (Ghana law–based reasoning)
- Verdict saved in Supabase
- Clean UI + Deploy-ready


