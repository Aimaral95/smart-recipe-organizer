# Demo script — Smart Recipe Organizer

Target length: **5 minutes**. The structure is built for a backend course, so the serverless function and API design get the most airtime; the frontend is the consumer that exercises the API.

Save this file open on a second monitor while you record.

## Setup checklist (do this BEFORE you hit record)

- [ ] Your live `*.vercel.app` URL is loaded in a fresh Chrome **private** window so localStorage is empty (you'll demo the empty state).
- [ ] DevTools is **already open** on the Network tab, with "Preserve log" checked.
- [ ] Your code editor is on a second tab/monitor with these files open and ready:
  - `api/generate-recipe.js` (this is the headliner)
  - `src/ai.js`
  - `src/reducers/recipesReducer.js`
  - `src/hooks/useDebounce.js`
- [ ] Your Vercel dashboard is open in another tab — you'll briefly show the **Functions** logs and the **Environment Variables** screen with the values redacted.
- [ ] One paragraph of recipe caption is in your clipboard (copy from a real Instagram post). You'll paste it during the import demo.
- [ ] Mute Slack, Discord, email. Mic checked.
- [ ] One memorized opening sentence so you don't ramble at minute zero.

## Opening — 30 seconds

> "Hi, I'm Aimaral. This is Smart Recipe Organizer — a full-stack web app I built as my final project. The frontend is React, but the interesting work for a backend course is in `api/generate-recipe.js` — a Vercel serverless function that proxies the Anthropic Claude API, validates inputs, maps upstream errors to clean HTTP responses, and keeps the API key off the client. I'll show the API in action, then walk through the code."

Click into your live URL. Don't hesitate.

## Section 1 — Backend in action via the consumer — 75 seconds

Demonstrate the API by exercising both modes through the UI. The point isn't the UI — it's that every action in the UI is a network call to your function.

1. **Generate mode.** Type 5 ingredients. Click **Get a recipe**. While it's loading, point at the Network tab: "There's the request to `/api/generate-recipe`. Notice it's POST with a JSON body — `{ mode: 'generate', ingredients: [...] }`. The Anthropic key isn't anywhere in the request — that's the whole point of the proxy."
2. Click the request → **Response**. "Server returns `{ recipe: '...' }` with markdown. The function did the LLM call server-side and the browser just sees the result."
3. Click **Save to library** → you're routed to `/recipe/<id>`.
4. **Extract mode.** Click **Import** in the nav. Paste your prepared Instagram caption. Click **Extract recipe**. Show the Network tab again: "Same endpoint, but now the body is `{ mode: 'extract', caption: '...' }`. One function, two prompts, picked by a `mode` field."
5. Save it. Hand off to the detail page.
6. **Error path.** Go back to **Import**. Paste random text like "hello hello hello hello." Click **Extract**. The UI shows a friendly red banner. Point at Network: "Server returns 422 with `{ error: '...' }`. Claude returned the sentinel `NOT_A_RECIPE`, the function caught it, mapped it to a 422, and the front-end shows the message verbatim."

## Section 2 — Backend code walkthrough — 105 seconds

Switch to your editor. **`api/generate-recipe.js`** stays on screen for this whole section.

1. **Top of the file — the routing decision.** "One handler. The first thing it does is reject everything that isn't a POST — 405 with the `Allow` header set, like the spec says."
2. **The mode switch.** "I picked one endpoint over two. Both modes share the env-var check, the upstream client setup, the error mapping. Splitting them into two files would have meant duplicating all of that, plus a third file every time I add a third mode. The mode field gives me a switch instead."
3. **Per-mode validation.** "Generate mode requires a non-empty `ingredients` array. Extract mode requires a `caption` string of at least 10 characters, and I cap it at 8000 chars before forwarding — that prevents someone pasting a novel and burning my token budget."
4. **Server-only env var.** Highlight `process.env.ANTHROPIC_API_KEY`. "Note no `VITE_` prefix. Vite refuses to bundle env vars without the prefix into the browser code. So this var only exists at runtime in the Vercel serverless environment."
5. **Anthropic SDK usage.** "Standard SDK call, with the system prompt picked by mode. The generate prompt asks for a recipe in markdown; the extract prompt strips social-media noise and either returns markdown in a fixed shape or the literal string `NOT_A_RECIPE`."
6. **The 422 short-circuit.** "After Claude responds, I check for the sentinel. If I see it, I return 422 with a structured error message. The frontend has a typed `NotARecipeError` class so it can render a different UI for that case."
7. **The 502 catch-all.** "Any other Anthropic error gets caught and mapped to 502. The error message is forwarded — that's why the UI banner shows the actual upstream message instead of 'something went wrong.'"

Now **`src/ai.js`**:

1. "On the client side, this wrapper has two paths. In production, `import.meta.env.PROD` is true, and we fetch the serverless endpoint. In dev with a local key, we use the SDK directly so I don't need to run `vercel dev` to develop. Both paths return the same string."
2. Show `NotARecipeError`. "Custom error class. The fetch path detects HTTP 422 and throws this. The SDK path detects the `NOT_A_RECIPE` string and throws this. The page that calls this can catch it and render a friendly message."

Briefly show the Vercel **Functions** tab — point at the log entries from the calls you just made. "Every invocation is logged here. Stack traces too. This is one of the reasons I like the proxy: I get observability for free."

## Section 3 — Frontend integration that matters for backend grading — 60 seconds

Switch back to the browser, then to your editor.

1. **`src/reducers/recipesReducer.js`.** "Pure function. Every library mutation flows through here — ADD, DELETE, UPDATE_TAGS, UPDATE_DIET, UPDATE_TIME, UPDATE_IMAGE, TOGGLE_FAVORITE, IMPORT, REPLACE_ALL. Why does this matter for backend? Because if I extend this app post-submission to a real database, every case body becomes a fetch call. The reducer is the abstraction line between local state and remote state."
2. **`src/context/RecipesContext.jsx`** (open quickly). "Lazy initializer reads from localStorage once on mount. A useEffect writes back on every change. Custom `useRecipes` hook throws if you call it outside the provider — misuse caught at runtime."
3. **`src/hooks/useDebounce.js`.** "Tiny. Custom hook for the search field. Without this, every keystroke re-filters the whole library — fine at 5 recipes, bad at 500."

## Section 4 — Polish that demonstrates production-readiness — 30 seconds

Back in the browser.

1. **Force a render error** if you have time (have a `throw` ready in a comment). The error boundary catches it, shows a recovery panel. "If something throws, instead of a blank page the user sees this and can click **Try again**."
2. Press `?`. Help overlay appears. **Tab** from the address bar — skip link slides down. "Keyboard accessible end-to-end."
3. Click **Export library**. Mention briefly: "Timestamped JSON file with version + recipes. Re-importable. Merge-by-id semantics so re-importing your own export back doesn't clobber edits."
4. Click **⎙ Print / PDF** on a recipe page. Print preview hides nav and edit chrome. "Save-as-PDF without adding a PDF library — just a print stylesheet."

## Closing — 30 seconds

> "Quick recap of what's backend-relevant: a Vercel serverless function with one endpoint and two modes, server-only API key, structured input validation, HTTP status codes mapped from upstream behavior, observable logs in the Vercel dashboard. The trade-off I made was no auth and no real database — I documented in the README why I chose to defer that. Source is on GitHub at [your repo URL]. Thanks for watching."

Don't trail off. End with a clear sentence.

## Things to NOT demonstrate

- The `process.env.NODE_ENV` switch in `ai.js` — interesting in code, hard to convey in a video.
- The reducer's `IMPORT` merge logic — too much edge-case setup for 5 minutes.
- The mobile responsive layout (mention it, but don't waste 30 seconds resizing the window).
- The Unsplash auto-photo unless your env var is configured. If it is, mention it once: "On save, the function fires off an Unsplash search and patches in the URL — best-effort, never blocks save."

## Questions you should expect

**"Why one endpoint with a `mode` field instead of two endpoints?"**
Both modes share env-var setup, error mapping, and upstream client wiring. Two endpoints would duplicate that. The mode switch keeps the surface tiny and adding a third mode is one branch.

**"Why no authentication?"**
Deliberate scope cut. Implementing sign-up, sign-in, password reset, and a Postgres schema would have doubled the project. The reducer's pure-function shape means migrating later is contained — each `case` body becomes a fetch call.

**"What happens if the Anthropic API is down?"**
The function catches the upstream error and returns 502 with the message forwarded. The browser's `ai.js` throws an `Error` whose message is that string. The page renders it in a dismissible banner. The user sees a real, useful message instead of "something went wrong."

**"What happens if `localStorage` hits its quota?"**
The `saveJSON` wrapper in `src/utils/storage.js` catches `QuotaExceededError` and logs it. Production would surface a banner. Each user-uploaded image is capped at 1MB to keep room for the rest. Auto-photos store the Unsplash CDN URL only (not bytes) so they don't count toward the budget.

**"Could you have skipped the serverless function?"**
Technically yes — set `dangerouslyAllowBrowser: true` in the SDK and ship the key in the bundle. That's the path the original tutorial took. It's the wrong call for anything that ships, because anyone with DevTools can copy the key and burn through your quota. The function is the right answer.

**"What would you build next?"**
Auth + a real database (Supabase or Postgres + Auth.js are the obvious fits), shareable recipe links, a "what can I substitute for X" mode, and a recipe-scaling mode (third API mode using the same endpoint).

**"How did you use AI to build this?"**
Honest answer: I used Claude Code as a pair-programmer for scaffolding, drafting the reducer, debugging the markdown parser, and writing this README. The architectural decisions, the API contract, and the integration are mine. AI-assisted development is normal practice now.

## Recording tips

- Slow down. Aim for 80% of your conversational pace. Demos always feel slow when recording, fast when watching.
- Use the cursor like a pointer — when you say "this hook," your mouse should be hovering over the import.
- One take is fine. Cuts in a 5-minute demo look unprofessional; small mistakes look human.
- 1080p screen recording. Loom and OBS both work. QuickTime if you're on a Mac with no extras.
- Test mic level on a 30-second test before the real take. Sit closer than feels natural.

Good luck.
