// Vercel serverless function — POST /api/generate-recipe
// Runs server-side on Vercel's edge/Node runtime. Receives a request from
// the browser and asks Anthropic for a recipe in markdown. The Anthropic
// API key never leaves the server.
//
// Two modes, picked by the `mode` field in the request body:
//
//   1. mode: "generate"  (default — back-compat for the original generator)
//      Body: { ingredients: string[] }
//      Returns: a brand-new recipe based on those ingredients.
//
//   2. mode: "extract"
//      Body: { caption: string }
//      Returns: a clean, structured markdown recipe parsed out of arbitrary
//      caption text the user pasted from Instagram, TikTok, Facebook, a blog,
//      a screenshot OCR, etc. Strips hashtags, emoji clutter, and the usual
//      "follow me for more!" filler.
//
// Why move this server-side?
//   In dev, src/ai.js called the Anthropic SDK directly from the browser
//   with `dangerouslyAllowBrowser: true`. That works locally but ships the
//   API key inside the production JS bundle — anyone visiting the deployed
//   site could open DevTools, copy the key, and burn through your quota.
//
//   Putting the call behind a serverless endpoint gives us:
//     - Key secrecy: ANTHROPIC_API_KEY is a server-only env var on Vercel.
//     - A choke point: we can rate-limit, log, or swap models server-side
//       without redeploying the frontend.
//     - Cleaner client: the browser just does a fetch, no SDK in the bundle.
//
// Deployment:
//   This file is auto-detected by Vercel because it lives under /api/.
//   The deployed URL becomes https://<your-app>.vercel.app/api/generate-recipe.
//   Locally, run `vercel dev` (npm install -g vercel) to mount it at
//   http://localhost:3000/api/generate-recipe — or stick with `npm run dev`
//   and the existing browser SDK fallback in src/ai.js.

import Anthropic from "@anthropic-ai/sdk"

const GENERATE_SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients.

Format your response in markdown. Always include:
- An H2 with the recipe title
- An "Ingredients" section as a bullet list with quantities
- An "Instructions" section as a numbered list of steps
- An italic line at the end like: *Estimated cook time: 30 minutes*
`.trim()

const EXTRACT_SYSTEM_PROMPT = `
You convert messy social-media recipe captions into clean, structured markdown recipes.

The user will paste text copied from Instagram, TikTok, Facebook, a food blog, or similar. The text will be noisy: hashtags, emojis, "link in bio", chatty intros, sponsor mentions, sign-offs. Your job is to find the actual recipe inside and rewrite it cleanly.

If the input does NOT contain a recipe — for example it's just a description, a question, or random text — respond with exactly this single line and nothing else:
NOT_A_RECIPE

Otherwise, output ONLY a markdown recipe in this exact shape:

## <Recipe title>

### Ingredients
- <quantity> <ingredient>
- <quantity> <ingredient>
...

### Instructions
1. <Step one>
2. <Step two>
...

*Estimated cook time: <N> minutes*

Rules:
- No preamble, no closing remarks, no "Here is the recipe". Just the markdown.
- Strip emojis, hashtags, @mentions, and promotional fluff.
- If a quantity is missing, write "to taste" rather than inventing a number.
- If cook time is not stated, give your best estimate based on the steps.
- Keep the title short and descriptive — no clickbait, no all-caps.
- Use the language the caption is written in. If unclear, use English.
`.trim()

export default async function handler(req, res) {
    // Only POST is allowed; GET to this endpoint should fail loudly.
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST")
        return res.status(405).json({ error: "Method not allowed" })
    }

    // Default mode is "generate" so legacy callers (the original front-end
    // before paste-caption was added) keep working unchanged.
    const body = req.body || {}
    const mode = body.mode || "generate"

    // Validate per-mode inputs early — way nicer error message than letting
    // Anthropic 400 us five seconds later.
    let userMessage
    if (mode === "generate") {
        const { ingredients } = body
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ error: "Send { ingredients: string[] }" })
        }
        userMessage = `I have ${ingredients.join(", ")}. Please give me a recipe you'd recommend I make!`
    } else if (mode === "extract") {
        const { caption } = body
        if (typeof caption !== "string" || caption.trim().length < 10) {
            return res.status(400).json({ error: "Send { caption: string } with real content" })
        }
        // Cap the input to avoid runaway token costs from someone pasting a novel.
        const trimmed = caption.trim().slice(0, 8000)
        userMessage = `Here is the caption I copied. Extract the recipe from it:\n\n---\n${trimmed}\n---`
    } else {
        return res.status(400).json({ error: `Unknown mode: ${mode}` })
    }

    // Fail fast if the env var is missing — way more useful than a cryptic
    // 401 from Anthropic five seconds later.
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        console.error("ANTHROPIC_API_KEY is not set in this environment")
        return res.status(500).json({ error: "Server is missing its API key" })
    }

    try {
        const anthropic = new Anthropic({ apiKey })

        const msg = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: mode === "extract" ? EXTRACT_SYSTEM_PROMPT : GENERATE_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
        })

        const text = (msg.content[0]?.text || "").trim()

        // Surface the "not a recipe" sentinel as a clear 422 so the front-end
        // can show a friendly message instead of saving garbage.
        if (mode === "extract" && text === "NOT_A_RECIPE") {
            return res.status(422).json({ error: "I couldn't find a recipe in that text. Try pasting just the caption with the steps." })
        }

        return res.status(200).json({ recipe: text })
    } catch (err) {
        console.error("Anthropic call failed:", err)
        const message = err?.message || "Unknown error"
        return res.status(502).json({ error: `Anthropic call failed: ${message}` })
    }
}
