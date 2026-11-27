# JobTrail: project rules for Claude

## What this is
A private job-application tracker. A user signs in, pastes a job advert, and the app uses the Claude API to extract structured fields into an application record. A dashboard shows applications by status with upcoming deadlines.

## Stack
- Next.js (App Router) with TypeScript (strict mode) and Tailwind CSS
- Supabase: Auth (email + password), PostgreSQL, Row-Level Security
- `@supabase/ssr` for server and client Supabase helpers
- Claude API via the official `@anthropic-ai/sdk` package, called **only from server code**
- `zod` for validating all input and all AI output
- Deployed on Vercel

## Security rules (never break these)
1. **Secrets stay on the server.** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must never be imported into client components or prefixed with `NEXT_PUBLIC_`. Never hard-code any key.
2. **Row-Level Security is on for every table.** Every policy restricts rows to `auth.uid() = user_id`. Never use the service role key for normal user requests.
3. **Validate everything.** Parse request bodies with zod. Treat Claude's output as untrusted: parse it as JSON and validate it against a zod schema before saving.
4. **Limit input size.** Reject pasted job adverts over 20,000 characters.
5. **Check auth in every server action and API route.** Return 401 if there is no user.
6. **Never render user or AI text as raw HTML** (no `dangerouslySetInnerHTML`).
7. `.env.local` is in `.gitignore`. Provide `.env.example` with empty values.

## Data model: table `applications`
id (uuid, pk), user_id (uuid, references auth.users, not null), company, role_title, location, salary_text, deadline (date, nullable), status (enum: saved, applied, interview, offer, rejected; default saved), job_url, visa_notes, requirements (text[]), notes, advert_text, created_at, updated_at.

## Working style
- Make small, reviewable changes. After each change, tell me which files changed and how to test it.
- Ask before adding a new dependency.
- Explain any security-relevant decision in one sentence.
- Write simple, readable code over clever code.
