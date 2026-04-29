# Deployment guide

Step-by-step from "code on my laptop" to "live URL with the backend running." Plan ~30–45 minutes the first time, including verification.

## What you'll end up with

- A public GitHub repo with all the code.
- A live `https://<project>.vercel.app` URL.
- The serverless function at `https://<project>.vercel.app/api/generate-recipe` running with your real Anthropic key as a server-side environment variable.

## Before you start

- [ ] You have a GitHub account.
- [ ] You have a Vercel account (sign in with GitHub — fastest).
- [ ] You have your Anthropic API key handy. Get one at <https://console.anthropic.com> if not.
- [ ] You're in the project directory in your terminal.

---

## Step 1 — Commit everything you haven't committed yet

The repo's last commit is from early in the project. Days 4–8 work is uncommitted. Stage everything and commit before pushing.

```bash
# See what's outstanding.
git status

# Stage everything (the .gitignore will exclude .env.local automatically).
git add -A

# Sanity check — make sure no .env.local snuck in.
git status | grep -i env
# Should show only .env.local.example. If you see ".env.local" without ".example", STOP
# and double-check .gitignore before continuing.

# Commit.
git commit -m "Days 4-8: filters, debounce, export/import, shortcuts, error boundary, accessibility, serverless function, paste-caption import, Unsplash auto-photo, print stylesheet"
```

If you'd rather have a cleaner history than one giant commit, split it into a couple of logical chunks. The grader probably won't dig through the log, but having "Day 7: serverless function" and "Day 8: paste-caption import + photos" separately reads better than one mega-commit.

## Step 2 — Push to GitHub

If you haven't created the GitHub repo yet:

1. Go to <https://github.com/new>.
2. Repo name: `smart-recipe-organizer` (or whatever you like).
3. **Public** (so the grader can read it without an invite).
4. **Do not** check "Add a README" — your local repo already has one.
5. Click **Create repository**.

Then, in your terminal:

```bash
# Copy the "push existing repository" commands from the GitHub page, or use:
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Open the repo URL in a browser. Verify:
- [ ] All `src/` folders are visible.
- [ ] `api/generate-recipe.js` is visible (this is the backend).
- [ ] `.env.local` is **not** visible (only `.env.local.example` should be there).
- [ ] `node_modules` is **not** visible.

If `.env.local` somehow got committed, **stop and rotate your API key** at <https://console.anthropic.com> before doing anything else, then remove it from history (`git rm --cached .env.local`, commit, force push).

## Step 3 — Import the repo into Vercel

1. Go to <https://vercel.com/new>.
2. Click **Import** next to your GitHub repo (you may need to give Vercel access to it first).
3. Vercel auto-detects this as a Vite project. Leave the **Framework Preset**, **Build Command**, **Output Directory**, and **Install Command** at their defaults.
4. **Don't click Deploy yet** — set environment variables first (next step). If you do click Deploy first, the build will succeed but the recipe-generation API will return a 500 with "Server is missing its API key" (which is, ironically, the intended error message — see `api/generate-recipe.js`).

## Step 4 — Set environment variables

Still on the Import screen, expand **Environment Variables**:

| Name | Value | Required? |
| ---- | ----- | --------- |
| `ANTHROPIC_API_KEY` | Your real `sk-ant-...` key | Required |
| `VITE_UNSPLASH_ACCESS_KEY` | Your Unsplash access key | Optional — auto-photo only |

Two important details:

- `ANTHROPIC_API_KEY` does **not** have a `VITE_` prefix. That's deliberate — it makes Vite refuse to expose it to the browser bundle, so it stays on the server.
- `VITE_UNSPLASH_ACCESS_KEY` **does** have the prefix. Unsplash's access key is the public half of the credential pair (their API uses it as a `client_id` query param), so it's safe to ship in the browser bundle. The "secret key" never leaves your laptop.

Click **Deploy**. Wait ~60 seconds.

## Step 5 — Smoke test the live deployment

Vercel will give you a URL like `https://smart-recipe-organizer-<hash>.vercel.app`. Open it.

Run through this quick checklist:

- [ ] The home page loads. Header shows **Generator | Import | Library**.
- [ ] Add 4–5 ingredients. Click **Get a recipe**. A recipe appears.
- [ ] **Open DevTools → Network.** Click **Get a recipe** again. Confirm the request goes to `/api/generate-recipe` (not `api.anthropic.com`). This proves the backend is being used.
- [ ] In Network, click that request → Headers. Confirm there is no `x-api-key` or `Authorization` header. The key stays server-side.
- [ ] Click **Save to library**. You're navigated to `/recipe/<id>`. Refresh the page — the recipe is still there (localStorage works).
- [ ] Click **Library**. The grid view loads. Click **Table** view. Refresh — the view choice sticks.
- [ ] Click **Import**. Paste a long-form recipe caption. Click **Extract recipe**. The preview should look clean.
- [ ] Click **Save to library**. If `VITE_UNSPLASH_ACCESS_KEY` is set, a photo appears within ~2 seconds.
- [ ] Click **⎙ Print / PDF** on a recipe detail page. The print preview should hide nav and edit chrome.
- [ ] Visit `https://<your-app>.vercel.app/library` directly (deep-link refresh). It should load — `vercel.json` rewrites take care of the SPA fallback.

If any step fails, check the **Functions** tab on your Vercel dashboard — every `api/generate-recipe` invocation is logged there, including stack traces.

## Step 6 — Update the README with your URLs

Open `README.md`, find these two lines:

```
**Live demo:** _Add your Vercel URL here once deployed._

**Repo:** _Add your GitHub URL here._
```

Replace the placeholders with your actual URLs. Commit and push:

```bash
git add README.md
git commit -m "Add live demo and repo URLs to README"
git push
```

Vercel auto-redeploys on push. ~60 seconds later, the live site shows the updated README links if anyone clicks through.

## Common deployment issues and fixes

**Build fails: "Module not found: @anthropic-ai/sdk"**
You probably accidentally added `@anthropic-ai/sdk` as a `devDependency` instead of a regular `dependency` in `package.json`. Vercel only installs `dependencies` for the function bundle. Move it to `dependencies` and push again.

**API returns 500 "Server is missing its API key"**
The env var name in Vercel doesn't match what `api/generate-recipe.js` reads. The function expects `process.env.ANTHROPIC_API_KEY` exactly — no typo, no `VITE_` prefix.

**API returns 502 "Anthropic call failed: ..."**
The key is valid but the upstream call failed. Common causes: out of quota, model name no longer exists, rate-limited. Click **Functions** in Vercel and read the actual error in the logs.

**Import page returns "I couldn't find a recipe"**
Working as intended — the server returns `422` when Claude judges the input isn't recipe-shaped. Test with a real caption that has ingredients and steps.

**Photos don't appear after saving**
Check `VITE_UNSPLASH_ACCESS_KEY` is set in Vercel. If it isn't, the auto-photo feature is silently disabled (this is the documented fallback). The "Find a photo" button on the detail page is hidden in that mode too — that's the `isUnsplashConfigured()` check.

**Static assets 404 on `/library` or `/recipe/<id>`**
`vercel.json` is missing or malformed. Verify it has a `rewrites` rule sending non-`/api` paths to `/index.html`.

---

## Custom domain (optional)

If you want `recipes.<your-domain>.com` instead of `*.vercel.app`:

1. Vercel dashboard → your project → **Settings → Domains**.
2. Add the domain. Vercel will show you the DNS records to set.
3. Add a `CNAME` record at your DNS provider pointing to `cname.vercel-dns.com`.
4. Wait ~5 minutes for DNS to propagate, then refresh the Vercel page until it says **Valid Configuration**.

Not necessary for submission. Skip unless you specifically want it for the demo.
