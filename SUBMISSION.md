# Submission checklist

The single page to walk through on submission day. Aim to complete this 24 hours before the deadline so you have a buffer.

## Inputs you'll collect

By the end of this checklist, you'll have:

- A public **GitHub repo URL**.
- A live **Vercel deployment URL**.
- A **demo video URL** (Loom / YouTube / Vimeo).
- A **written description** paragraph for the submission form.

Whatever your backend course's submission form actually wants, those four cover it.

---

## Phase 1 — Pre-submission audit (30 minutes, do this first)

These are the "did I forget anything" checks. Run them with the project open in an editor.

### Code hygiene

- [ ] No `console.log` calls in `src/` or `api/` outside of intentional `console.error` / `console.warn` for error reporting.
- [ ] No `TODO`, `FIXME`, `XXX`, or `HACK` comments left in shipping code.
- [ ] No `debugger` statements.
- [ ] No `alert()` calls.
- [ ] No leftover commented-out code blocks larger than a couple of lines.

Quick way to check all of these — paste into your terminal:

```bash
grep -rn "console\.log\|console\.debug\|TODO\|FIXME\|XXX\|HACK\|debugger\|alert(" src/ api/
```

If that prints nothing, you're clean.

### Secrets

- [ ] `.env.local` is in `.gitignore` (verify: `grep "\.env\.local" .gitignore` should print a hit).
- [ ] `.env.local` is not in your git history (verify: `git log --all -- .env.local` should print nothing).
- [ ] No `sk-ant-...` real-looking keys in tracked files (verify: `grep -rn "sk-ant-" --include="*.js" --include="*.jsx" --include="*.json" .` should only show the README's `sk-ant-...` documentation placeholder).
- [ ] No `VITE_` env vars referenced in code that you haven't documented in `.env.local.example`.

### Repo structure

- [ ] `README.md` exists and starts with the project name + tagline.
- [ ] `DEPLOY.md` exists.
- [ ] `DEMO_SCRIPT.md` exists.
- [ ] `vercel.json` exists with the SPA rewrite rule.
- [ ] `.env.local.example` exists and documents every env var the app expects.
- [ ] `package.json` lists `@anthropic-ai/sdk` under `dependencies` (not `devDependencies` — Vercel wouldn't install it).

### Build

```bash
npm install
npm run build
```

- [ ] Build completes without errors.
- [ ] No critical warnings (eslint warnings are fine; "Module not found" is not).

---

## Phase 2 — Deployment (45 minutes, follow DEPLOY.md)

Walk through `DEPLOY.md` end-to-end. The detailed checklist is there — at the end of it you should have:

- [ ] All Days 4–8 work committed and pushed to GitHub.
- [ ] Public GitHub repo URL: `https://github.com/______`
- [ ] Live Vercel URL: `https://______.vercel.app`
- [ ] All smoke tests in DEPLOY.md Step 5 passed.
- [ ] README updated with both URLs and the change pushed.

---

## Phase 3 — Demo recording (60–90 minutes, follow DEMO_SCRIPT.md)

DEMO_SCRIPT.md has the full 5-minute outline. Before you hit record:

- [ ] Mic tested on a 30-second sample.
- [ ] Browser zoom set to ~110% so code is readable in 1080p video.
- [ ] DevTools docked on the right side, not the bottom (more vertical space for the page).
- [ ] All preparation items from the script's "Setup checklist" are done.
- [ ] You've practiced the opening sentence twice.

After recording:

- [ ] Watch it back on 1.0× before uploading. Check audio levels and that no sensitive data is visible (e.g., your real key in a terminal).
- [ ] Upload to Loom / YouTube / Vimeo. Make it **unlisted** — graders should see it via the link, not via search.
- [ ] Demo video URL: `https://______`

---

## Phase 4 — Write the submission description

Most submission forms ask for a short paragraph or two. Here's a template you can adapt — replace the bracketed bits:

> **Smart Recipe Organizer** is a full-stack web app that lets users generate
> recipes from ingredients on hand, import recipes from Instagram or TikTok
> captions, and organize a personal library with filtering, tagging, and
> dietary restrictions. The frontend is a React 19 SPA built with Vite; the
> backend is a Vercel serverless function that proxies the Anthropic Claude
> API, validates inputs, maps upstream errors to clean HTTP responses (400 /
> 422 / 500 / 502 with a consistent JSON error shape), and keeps the API
> key server-side so it never reaches the browser bundle.
>
> The single endpoint at `/api/generate-recipe` supports two modes via a
> `mode` field — `generate` (build a recipe from ingredients) and `extract`
> (parse an arbitrary social-media caption into structured markdown). I
> chose this design over two endpoints to share validation, error mapping,
> and upstream client setup; it also makes adding new modes (e.g. recipe
> scaling) a small change instead of a new file.
>
> State on the client is managed with `useReducer` + Context, persisted to
> localStorage. I deliberately deferred authentication and a real database
> as a scope cut — the trade-off is documented in the README, along with
> the migration path (every reducer case maps cleanly to an API call when
> swapped for a Postgres backend).
>
> Live demo: [URL] · Repo: [URL] · Demo video: [URL]

Tighten it to whatever word count the form requests.

- [ ] Description written and saved somewhere you can paste from.

---

## Phase 5 — Final submission

Open the submission form. Have all four URLs and the description ready in your clipboard.

- [ ] GitHub URL filled in.
- [ ] Live demo URL filled in.
- [ ] Demo video URL filled in.
- [ ] Description pasted.
- [ ] Any additional fields the form asks for filled in.
- [ ] **Click submit.**
- [ ] Take a screenshot of the confirmation page in case the email confirmation gets eaten by your spam folder.

---

## After submission — the things you'll wish you'd done

- [ ] Tag the commit you submitted: `git tag submission && git push --tags`. If you keep working on the project, you can always check out the exact submitted version.
- [ ] Save the demo video file locally — Loom links can break or be deleted, your local copy can't.
- [ ] Note the submitted Vercel deployment ID (Vercel keeps a permanent URL for every deployment in the dashboard). You can pin it as the production URL if you want to be sure post-submission edits don't change what graders see.

---

## If something blows up after you submit

Don't panic. Most courses let you submit a follow-up email or comment if you discover a critical bug. Triage:

- **Bug in the live site:** push a fix to GitHub. Vercel auto-deploys. Send a one-liner to the grader: "Pushed a small fix to <commit-hash>; the submission was at <tag>."
- **Demo video has a bad section:** offer a 30-second supplementary clip.
- **Submission form was wrong (URL typo, etc.):** email the course admin with corrections.

The grader has seen worse. A focused, honest follow-up reads as professional. A second full re-record reads as panic — don't do that.

Good luck.
