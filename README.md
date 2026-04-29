# Smart Recipe Organizer

> A full-stack recipe app: serverless API backend on Vercel, React frontend, and Anthropic's Claude doing the cooking.

A single-page web app that lets users generate recipes from ingredients on hand, import recipes from social-media captions, and organize a personal library — all backed by a serverless function that proxies the Claude API and keeps secrets off the client.

**Live demo:** https://smart-recipe-organizer.vercel.app

**Author:** Aimaral Khaumyetbyek — solo project. Designed, built, and documented end-to-end (frontend, serverless backend, deployment, demo materials).

---

## Why this project

The frontend is a React 19 SPA, but the interesting work for a backend course lives in `api/generate-recipe.js`. That file is a Vercel serverless function that:

- Accepts two distinct request shapes through a single endpoint (a `mode` switch).
- Validates every field before talking to Anthropic — bad inputs fail fast with a useful 4xx, never a cryptic 500 from upstream.
- Holds the Anthropic API key as a server-only environment variable, so it never ships in the browser bundle and can't be stolen via DevTools.
- Translates upstream errors into well-formed HTTP responses with appropriate status codes (`405`, `400`, `422`, `500`, `502`) and a consistent JSON error shape.
- Acts as a choke point — rate limiting, logging, prompt swapping, or model upgrades can happen here without redeploying the frontend.

The frontend is the consumer of that API, but it stays useful in dev without it: a fallback path in `src/ai.js` calls Anthropic directly using a gitignored local key, so `npm run dev` works without spinning up the function runner.

---

## Features

**AI recipe generation.** User types ingredients, the backend asks Claude for a recipe, and the response comes back as markdown with a title, ingredient list, numbered steps, and an estimated cook time.

**Import from social media.** User pastes a caption from Instagram, TikTok, Facebook, a food blog, or a screenshot. The backend uses a different system prompt to extract a structured recipe out of the noise (hashtags, emoji, "follow me for more!" filler). If the input clearly isn't a recipe, the server short-circuits with a 422 and a helpful message.

**Personal library.** Save any recipe. Add tags, mark dietary restrictions (vegetarian, vegan, gluten-free, dairy-free, keto, low-carb, paleo), set a cook time, attach a photo. Favorites pin to the top.

**Auto-photo via Unsplash.** When a free Unsplash access key is configured, every saved recipe gets a relevant cover photo fetched on save. Best-effort: if the API fails, the recipe just stays imageless.

**Filtering and search.** Search by title (debounced), filter by max cook time, AND-filter across multiple dietary tags, OR-filter across user tags, or just show favorites.

**Two views.** Card grid for browsing, sortable table for scanning. The view choice persists.

**Print or save as PDF.** Every detail page has a print stylesheet that hides nav and edit chrome, leaving a clean recipe sheet. Use the browser's "Save as PDF" for a portable copy.

**Data ownership.** Export the whole library to a timestamped JSON file. Re-import on another device. Imports merge by id — local edits never get clobbered.

**Keyboard shortcuts.** Press `?` for the full list. Highlights: `n` jumps to the generator, `i` to the importer, `l` to the library, `/` focuses the search field.

**Resilient.** A React error boundary catches render-time crashes and shows a recovery panel. Async errors get a dismissible banner with the actual server message.

**Accessible.** Skip-to-content link, route-change focus management for screen readers, visible keyboard focus indicators, semantic landmarks, ARIA on everything that needs it.

---

## Tech stack

| Layer | Choice | Why |
| ----- | ------ | --- |
| Backend runtime | Vercel serverless functions (Node) | Zero infrastructure, auto-scales, secrets stay server-side. |
| AI provider | Anthropic Claude (`claude-haiku-4-5`) | Fast, inexpensive, plenty smart for both prompts. |
| Backend SDK | `@anthropic-ai/sdk` | Official SDK; only loaded inside the function, not the bundle. |
| Frontend framework | React 19 | Modern hook ergonomics, function-component-first. |
| Build tool | Vite 5 | Instant HMR, tiny config. |
| Routing | React Router v6 | Declarative routes + `useNavigate`. |
| State | `useReducer` + `Context` | One source of truth for the library; no Redux overhead. |
| Persistence | `localStorage` | See the trade-off discussion below. |
| Image hosting | Unsplash CDN (URLs only) | Avoids storing image bytes locally. |
| Styling | Hand-written CSS with custom properties | No compile step, full control. |

---

## Backend API

### `POST /api/generate-recipe`

One endpoint, two modes. The request body must include a `mode` field; everything else depends on the mode.

#### Mode: `generate` (default)

Ask Claude to invent a recipe from a list of ingredients.

```http
POST /api/generate-recipe
Content-Type: application/json

{
  "mode": "generate",
  "ingredients": ["chicken", "rice", "garlic", "lemon", "parsley"]
}
```

```http
200 OK
Content-Type: application/json

{
  "recipe": "## Lemon-Garlic Chicken with Herbed Rice\n\n### Ingredients\n..."
}
```

#### Mode: `extract`

Pull a structured recipe out of an arbitrary social-media caption.

```http
POST /api/generate-recipe
Content-Type: application/json

{
  "mode": "extract",
  "caption": "The BEST creamy garlic pasta!! 🍝✨\n\n1 lb spaghetti..."
}
```

```http
200 OK

{
  "recipe": "## Creamy Garlic Pasta\n\n### Ingredients\n..."
}
```

If the caption clearly isn't a recipe, Claude returns a sentinel and the server replies with:

```http
422 Unprocessable Entity

{
  "error": "I couldn't find a recipe in that text. Try pasting just the caption with the steps."
}
```

#### Error shape

Every non-2xx response uses the same JSON shape so the frontend can handle them uniformly:

```json
{ "error": "<human-readable message>" }
```

| Status | When it fires |
| ------ | ------------- |
| `400` | Missing or malformed body fields. |
| `405` | Anything other than `POST` (also sets the `Allow` header). |
| `422` | Caption submitted but Claude decided it's not a recipe. |
| `500` | `ANTHROPIC_API_KEY` env var is missing on the server. |
| `502` | Upstream Anthropic call threw. The error message is forwarded. |

#### Why two modes through one endpoint?

Both call Anthropic with the same model and roughly the same response handling — the only thing that differs is the system prompt and the input shape. A single endpoint with a `mode` switch keeps deployment simpler (one Vercel function, one log stream, one set of env vars) and makes adding a third mode (e.g. "scale recipe to N servings") a small change instead of a new file.

---

## Architecture overview

```
api/
└── generate-recipe.js         Vercel serverless function — Anthropic call,
                                input validation, error mapping.

src/
├── App.jsx                    Top-level: BrowserRouter > RecipesProvider > Routes
├── index.jsx                  Entry point
├── index.css                  All styles. CSS variables in :root for theming.
├── ai.js                      Client wrapper around the API. Prod path: fetch
│                              the serverless endpoint. Dev fallback: call the
│                              Anthropic SDK directly with a gitignored key.
│
├── pages/
│   ├── GeneratorPage.jsx      /          Build ingredient list → call API → save
│   ├── ImportPage.jsx         /import    Paste a caption → call API → save
│   ├── LibraryPage.jsx        /library   FilterBar + grid/table view
│   └── RecipeDetailPage.jsx   /recipe/:id  Read + edit a single recipe
│
├── components/
│   ├── Header.jsx             Sticky top nav with NavLinks
│   ├── ErrorBoundary.jsx      Class component — the only one in the project
│   ├── KeyboardShortcuts.jsx  Global shortcut handler + help overlay
│   ├── RouteFocusReset.jsx    A11y: focus <main> on URL change
│   ├── FilterBar.jsx          Search, max time, dietary, tags, favorites-only
│   ├── RecipeTable.jsx        Sortable table view
│   ├── RecipeCard.jsx         Card view
│   ├── LibraryActions.jsx     Export/Import JSON
│   ├── ImageUploader.jsx      base64 + FileReader
│   ├── TagEditor.jsx          Free-form chip input
│   ├── DietarySelector.jsx    Multi-select chip toggle (exports DIETARY_OPTIONS)
│   ├── CookTimeEditor.jsx     Number input
│   ├── IngredientsList.jsx    Generator's chip list
│   ├── ClaudeRecipe.jsx       ReactMarkdown wrapper
│   ├── LoadingSpinner.jsx     CSS spinner
│   └── ErrorBanner.jsx        Dismissible inline error
│
├── context/
│   └── RecipesContext.jsx     useReducer + useContext + localStorage persistence
│
├── reducers/
│   └── recipesReducer.js      Pure reducer — every library mutation flows here
│
├── utils/
│   ├── parseRecipe.js         Markdown → { title, ingredients, instructions, cookTime }
│   ├── filters.js             filterRecipes / sortRecipes / collectAllTags
│   ├── unsplash.js            Best-effort Unsplash photo lookup
│   └── storage.js             loadJSON / saveJSON wrappers
│
├── hooks/
│   ├── useDebounce.js         Lagging value with setTimeout cleanup
│   └── useKeyboardShortcuts.js  Window-level keydown listener
│
└── data/
    └── sampleRecipes.json     Seed data for first-time users
```

---

## Running locally

You need Node 18+ and an Anthropic API key from <https://console.anthropic.com>.

```bash
# 1. Install
npm install

# 2. Add your API key
cp .env.local.example .env.local
# Edit .env.local and paste your sk-ant-... key.

# 3. Run the dev server
npm run dev
# Open http://localhost:5173
```

In dev, the Anthropic SDK is called directly from the browser. The key sits in `.env.local`, which is gitignored. To exercise the production code path locally — calling `/api/generate-recipe` instead — install the Vercel CLI (`npm i -g vercel`) and run `vercel dev`.

---

## Deploying to Vercel

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step. Short version:

1. Push to GitHub.
2. Import the repo on <https://vercel.com> — it auto-detects Vite.
3. Add `ANTHROPIC_API_KEY` (and optionally `VITE_UNSPLASH_ACCESS_KEY`) under Environment Variables.
4. Click **Deploy**.

The `vercel.json` in this repo handles SPA fallback so deep links like `/library` and `/recipe/<id>` survive a refresh.

---

## Architecture decisions

**Why move the AI call server-side?**
The Anthropic SDK supports `dangerouslyAllowBrowser: true` so it can run in the browser. That works locally — `.env.local` is gitignored — but in production it would bake the API key into the JavaScript bundle. Anyone visiting the deployed site could open DevTools, copy the key, and burn through the quota. The serverless function in `api/generate-recipe.js` keeps the key as a Vercel-only env var. The browser does a `fetch("/api/generate-recipe")` instead of importing the SDK. The keyword `dangerouslyAllowBrowser` is a giant red flag that I missed on first pass — fixing it for production was the most important backend change in the whole project.

**Why two API modes through one endpoint instead of two endpoints?**
Both modes call the same upstream model and share most of the response/error handling. A `mode` field switches the system prompt and the input validation. Splitting into two functions would have meant duplicating the env-var check, the upstream client setup, and the error mapping — and adding a third mode later would mean a third file. One endpoint makes the API surface stay small.

**Why `useReducer` + `Context` instead of Redux?**
The library is a single array of recipes with ~10 mutations. A reducer + context is enough — Redux would add a build target, a peer dependency, and a layer of indirection for no visible benefit at this size. The reducer is a pure function in its own file, so the testability story is the same.

**Why `localStorage` instead of a real database with auth?**
For a user-facing product, a real database with login is the right answer. I chose localStorage here as a deliberate scope cut: implementing auth (sign-up, sign-in, password reset, session management), a Postgres schema with migrations, and authenticated CRUD endpoints would have doubled the project size and split focus across two unrelated stacks. The trade-off is documented in `Export/Import` — users can move their library between devices manually. If I extend this app post-submission, swapping `useReducer + localStorage` for Supabase or Postgres + Auth.js is the obvious next step, and the reducer's pure-function shape means most action handlers map 1:1 to API calls.

**Why a class component for the error boundary?**
React's error-boundary API (`getDerivedStateFromError` + `componentDidCatch`) has no hook equivalent yet. This is the one place in the project where a class is the right tool. Every other component is a function component.

**Why debounce only the search field?**
Diet/tag chips and the favorites toggle commit discretely — one click is one filter change. Search is the only filter where the user "types into" the value, so it's the only one that benefits from debouncing. 200ms feels instant to a human but cuts re-filters during typing by ~90%.

---

## Testing

Manual smoke tests, run after deploy:

- Add ingredients, generate a recipe, save it. Refresh the page — recipe still in the library.
- Edit the recipe's tags, dietary, cook time, image. Refresh — edits persist.
- Filter the library by `max cook time = 25`. Confirm only sub-25 recipes show.
- Toggle to table view. Refresh — table view sticks.
- Export, clear `localStorage`, import the file back. Library is restored.
- Open `/import`, paste a real Instagram caption, click **Extract recipe**. Confirm the markdown preview is reasonable.
- Open `/import`, paste random text ("hello world hello world hello"), click **Extract**. Confirm you see the friendly "couldn't find a recipe" message (the backend's 422 surfaces here).
- Press `?`. Help overlay shows. Press `Escape`. It closes.
- Tab from anywhere on the page — the skip link should slide down.
- DevTools → Network → make a recipe call → confirm `Authorization` header is **not** present anywhere in the request, and the request goes to `/api/generate-recipe` (not directly to anthropic.com).

---

## Challenges & learning

The hardest backend decision was the error-mapping layer. The first cut just re-threw whatever Anthropic gave back; that meant a misconfigured env var on Vercel produced the same opaque "fetch failed" in the browser as a temporary upstream outage. Splitting them out into `400 / 422 / 500 / 502` with a consistent JSON shape made the front-end's error UI suddenly easy — the error message in the dismissible banner is now the literal string the server produced.

The `dangerouslyAllowBrowser: true` flag in the Anthropic SDK is a red flag I missed in the original tutorial I started from. It's quietly fine for a local-only proof-of-concept, but a one-line slip for anything that ships. Moving the call server-side wasn't hard, but it changed the shape of every error path the frontend has to handle. It was worth doing on day 1; I did it on day 7.

The `useReducer` shape is a quiet underrated benefit. Every library mutation goes through one pure function, which means swapping localStorage for a real backend later is a contained change — replace each `case` body with a `fetch` call, keep the rest of the app intact. The reducer is the abstraction line.

State persistence taught me to take quota errors seriously. `localStorage.setItem` can throw `QuotaExceededError` when a user's library grows past ~5MB — usually triggered by base64 image uploads. Capping uploads at 1MB and storing Unsplash CDN *URLs* instead of bytes solved it before it became a user problem.

The accessibility pass was the most surprising win for time spent. Adding the skip-link, route-change focus reset, and ARIA roles took ~2 hours and made keyboard-only navigation work end-to-end. Demoing keyboard-only flow during the final presentation lands a lot harder than describing it.

---

## Future improvements

If I had another week — and the obvious next steps if I extend this past the submission:

- **Authentication and a real database.** Supabase or Auth.js + Postgres is the obvious fit. The reducer is already shaped so each case maps to a `fetch` — the migration is mostly mechanical.
- **Recipe scaling mode.** A third mode in `/api/generate-recipe`: `{ mode: "scale", recipe, factor }`. Same endpoint, third system prompt, ~30 lines.
- **Shareable links.** Public read-only URLs for individual recipes (`/r/<short-id>`), behind a feature flag.
- **"What can I substitute for X?"** A per-ingredient swap suggestion that reuses the same proxy.
- **Server-side rate limiting.** Right now the endpoint trusts the client; a small Redis-backed token bucket per IP keyed off Vercel's edge config would harden it.
- **Telemetry.** Wire Vercel Analytics or PostHog to see which prompts users actually run.

---

## Team

Solo project — every line of code, the architecture decisions, the API contract, the documentation, and the demo materials are mine. I used Claude Code as a pair-programmer for scaffolding, drafting the reducer, and proofreading the README, but the design and integration calls are mine.

| Member | Role | Contribution |
| ------ | ---- | ------------ |
| **Aimaral Khaumyetbyek** | Sole contributor | Frontend (React 19 SPA, routing, state, components, styling, accessibility), backend (Vercel serverless function, validation, error mapping), deployment (Vercel + env vars), documentation, demo script. |

---

## Submission package

Three files are submitted alongside this repo, per the project deliverables rubric:

1. `Smart_Recipe_Organizer_Source.zip` — the full source tree (excludes `node_modules`, `dist`, and `.env.local`).
2. `Smart_Recipe_Organizer_Demo.mp4` — the recorded demo video (see `DEMO_SCRIPT.md` for the script).
3. `README.md` — this document.

Optional/auxiliary files in the repo:
- `Smart_Recipe_Organizer_Presentation.pptx` — final-presentation slide deck (12 slides).
- `DEPLOY.md` — step-by-step Vercel deployment walkthrough.
- `DEMO_SCRIPT.md` — the 5-minute demo script used for the recorded walkthrough.
- `SUBMISSION.md` — the day-of submission checklist.

---

## License

MIT — feel free to fork and ship your own version.
