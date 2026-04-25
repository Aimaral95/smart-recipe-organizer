# Smart Recipe Organizer — Week Plan

**Deadline:** Wed Apr 29, 2026 — demo day
**Today:** Tue Apr 22, 2026 (7 days out)
**Stack:** React 19 + Vite + React Router + plain CSS + localStorage + Claude/Mistral APIs
**Deploy target:** Vercel (free tier)

---

## 1. Where you are now

The Scrimba "Chef Claude" starter:

- Add ingredients to a list
- Click "Get a recipe" → AI returns a markdown recipe
- Recipe shown in `ClaudeRecipe.jsx`

**What's missing from your approved proposal:** saving, tagging, organizing, filtering by diet/time, multi-recipe library, delete, ingredient parsing beyond plain strings, cross-device access, polish.

---

## 2. Target architecture

### Folder structure (what we'll reorganize into)

```
src/
  components/
    Header.jsx
    IngredientInput.jsx          (form — extracted from Main)
    IngredientsList.jsx          (edit + delete buttons)
    RecipeCard.jsx               NEW — used on Library page
    RecipeDetail.jsx             NEW — full recipe view
    FilterBar.jsx                NEW — diet, tag, cook-time, search
    TagEditor.jsx                NEW — chip UI to add/remove tags
    EmptyState.jsx               NEW — reusable "nothing here yet"
    LoadingSpinner.jsx           NEW
    ErrorBanner.jsx              NEW
  pages/
    GeneratorPage.jsx            (your current Main.jsx)
    LibraryPage.jsx              NEW — grid of saved recipes
    RecipeDetailPage.jsx         NEW
  hooks/
    useLocalStorage.js           NEW — custom hook (advanced React signal)
    useRecipes.js                NEW — wraps reducer + persistence
    useDebounce.js               NEW — for search input
  context/
    RecipesContext.jsx           NEW — library state shared app-wide
  reducers/
    recipesReducer.js            NEW — useReducer actions
  utils/
    parseRecipe.js               NEW — pulls title / ingredients / time out of AI markdown
    filters.js                   NEW — pure filter functions
  data/
    sampleRecipes.json           seed data so the library is never empty on first load
  ai.js                          (existing, small cleanup)
  App.jsx
  index.jsx
  index.css
```

### Data model (localStorage key: `recipes`)

```js
{
  id: "uuid",
  title: "Beef Bolognese Pasta",
  ingredients: ["1 lb ground beef", "1 onion, diced", ...],
  instructions: ["Boil water.", "Brown the beef.", ...],
  markdown: "# full markdown body from AI",   // fallback if parsing fails
  tags: ["italian", "dinner"],
  dietary: ["gluten-free"],                    // vegetarian | vegan | gluten-free | dairy-free | keto | none
  cookTimeMinutes: 30,
  createdAt: "2026-04-22T18:30:00Z",
  favorite: false
}
```

### State strategy (this is your "advanced React" story)

- `RecipesContext` + `useReducer` holds the saved-recipe library
- Actions: `ADD`, `DELETE`, `UPDATE_TAGS`, `UPDATE_DIET`, `TOGGLE_FAVORITE`, `IMPORT_JSON`
- `useLocalStorage` custom hook persists on every state change
- Ingredient list stays local to `GeneratorPage` (no need to share it)
- `useDebounce` hook smooths the search input

### Routing

- `/` → GeneratorPage (input + AI recipe + Save button)
- `/library` → LibraryPage (grid + FilterBar + search)
- `/recipe/:id` → RecipeDetailPage (full view + edit tags + delete)

---

## 3. Daily schedule

### Day 1 — Tue Apr 22 (today): foundation
**Goal:** new folder structure in place, nothing broken.

- Move existing files into `src/` with the structure above
- `npm install react-router-dom uuid`
- Create `.env.local` with your API key + add `.env.local` to `.gitignore`
- Set up `RecipesContext` skeleton (provider only, no actions yet)
- Wire React Router with 3 empty pages

**End-of-day check:** app loads at `/`, `/library`, `/recipe/abc` — existing generator still works.

### Day 2 — Wed Apr 23: ingredients + AI polish
- Delete-ingredient button (small × next to each)
- Inline edit for an ingredient
- Validation: no empty strings, no duplicates
- Loading spinner while AI is generating
- Error banner if the AI call fails
- Write `parseRecipe.js`: pulls title, ingredient list, steps, and cook-time hint out of the markdown

**End-of-day check:** generator feels polished. Parsed recipe object logs to console cleanly.

### Day 3 — Thu Apr 24: library (save + list + detail)
- Build `recipesReducer` + `useRecipes` hook
- "Save recipe" button on GeneratorPage
- `LibraryPage`: grid of `RecipeCard`s
- `RecipeDetailPage`: full markdown + Delete button
- `useLocalStorage` persists on every reducer action
- Seed `sampleRecipes.json` so the library is never empty on first visit

**End-of-day check:** generate → save → see in library → open detail → delete. Refresh survives.

### Day 4 — Fri Apr 25: tags, dietary, cook time, filtering, media, table view
- `TagEditor` component (chip UI, add + remove)
- Dietary multi-select dropdown
- Cook-time field (minutes)
- Update the system prompt so Claude includes cook-time in the output; parse it
- `FilterBar` on LibraryPage: diet, tag, max cook time, title search
- Favorite toggle (star icon) + "show favorites only" filter
- **Recipe image** (media — rubric line 4): file-upload input on detail page, store as base64 in the recipe object
- **Library table view toggle** (table — rubric line 4): grid/table switch, sortable columns

**End-of-day check:** save 5+ recipes with varied tags/diets, every filter combination works, table view sorts correctly, recipe image displays.

### Day 5 — Sat Apr 26: polish + advanced React
- `useContext` wired cleanly across pages
- `useDebounce` custom hook on the search input
- Export library to JSON / import from JSON (satisfies "accessible across devices" in your proposal)
- Keyboard: Enter adds ingredient, Esc clears input
- Responsive CSS: mobile breakpoint at 640px, grid collapses to one column
- `document.title` updates per route

**End-of-day check:** shrink browser window to phone width — still usable.

### Day 6 — Sun Apr 27: states, accessibility, content
- `EmptyState` component wherever a list can be empty
- Loading skeletons on recipe cards
- `ErrorBoundary` class component wrapping the app
- `aria-label`s, focus management, keyboard nav audit
- Favicon + `<title>` + meta description in `index.html`
- Tighten all button labels and headings

**End-of-day check:** walk through the app as a new user — every edge case handled.

### Day 7 — Mon Apr 28: deploy + demo prep
- `npm run build`, test with `npm run preview`
- Deploy to Vercel (connect GitHub, import repo)
- Add `ANTHROPIC_API_KEY` in Vercel dashboard as env var
- Screen-record a 2-minute demo video (backup in case live demo fails)
- Rewrite `README.md`: features, stack, run instructions, live URL, screenshots
- Rehearse the demo out loud 3 times

**End-of-day check:** live URL works on your phone AND laptop. README is resume-ready.

### Wed Apr 29 — demo day
Don't touch the code. Just present.

---

## 4. Proposal coverage checklist

Every bullet from your approved proposal → where it lives:

- Generate recipes from ingredients → GeneratorPage + `ai.js`
- Save, tag, organize → LibraryPage + TagEditor + recipesReducer
- Ingredient parsing → `parseRecipe.js` + input validation in IngredientInput
- Filter by dietary restrictions / cooking time → FilterBar
- Centralized platform → `useLocalStorage` persistence + React Router
- Accessible across devices → Vercel deploy + export/import JSON

## 4b. Grading rubric coverage (150 pts)

| Rubric line | Points | Where it's earned |
|---|---|---|
| 1. Functionality & Features | 40 | Days 2-5 — every proposal feature working end-to-end |
| 2. Code Quality & Structure | 30 | Day 1 folder structure + per-file comment blocks (in your own words) + custom hooks Day 5 |
| 3. UI/UX Design | 20 | Day 5 responsive + Day 6 empty/loading/error states + accessibility audit |
| 4. Use of Web Technologies | 20 | Forms (Days 1-4) + media (recipe image, Day 4) + table view (Day 4-5) + React Router |
| 5. Demo Setup | 20 | Day 7 Vercel deploy + 2-minute backup video |
| 6. Documentation / README | 20 | Day 7 README rewrite — title, summary, stack, features, run instructions, live URL, screenshots |

---

## 5. How to use Claude (me) this week

This is the part most students miss. Getting an A isn't about code appearing — it's about you being able to defend every line.

### Daily rhythm

1. **Morning:** open this plan, read today's checklist, ask me to explain the first concept you don't know.
2. **Per task:** ask me to explain first, then let me scaffold, then YOU fill in the logic. Reverse that order and you'll lose the learning.
3. **After I write code:** ask "walk me through this line by line."
4. **End of day:** tell me what worked, what didn't, and what tomorrow needs to adjust.

### Prompts that work

- "I'm on Day 3, about to write `useRecipes`. Explain `useReducer` and why it's better than `useState` here."
- "Here's my `RecipeCard.jsx` [paste]. Review it like a senior React dev — what would you change and why?"
- "I got this error: [paste]. What does it mean? Don't fix it yet — help me figure it out."
- "Quiz me on today's code before I sleep."

### Prompts that sabotage your learning

- "Just build the whole library page."
- "Write the entire project."
- "Give me the code, no explanation."

### Demo-day trick (real differentiator)

At the top of every non-trivial file, write a comment block **in your own words** explaining what it does and why. If you can't write that comment, you don't understand the file yet. This is how you pass the oral defense.

### Red-flag rule

If code I've written is in your project and you can't explain it out loud, stop. Ask me to explain until you can. A working project you can't defend will drag your grade down harder than a smaller project you fully understand.

---

## 6. Risks & mitigations

- **API key leak on deploy.** `.env.local` is git-ignored; on Vercel the key lives as an env var only. We'll double-check before you push.
- **AI output format drifts.** `parseRecipe` will always fall back to raw markdown if parsing fails — the user still sees a recipe.
- **Falling behind mid-week.** Days 5-6 have the most cuttable scope. If you slip, drop (in this order): import/export JSON → error boundaries → keyboard shortcuts. Don't cut tags/filters/delete — those are proposal-required.
- **Demo-day live-AI failure.** Your Day-7 recorded video is your backup. Play it if the API hiccups during presentation.

---

## 7. Ready?

Tomorrow morning, message me: **"let's start Day 1"** and I'll walk you through the folder reorg step by step. Today, just read this doc and let me know if any of the architecture decisions feel shaky — better to adjust now than Day 4.
