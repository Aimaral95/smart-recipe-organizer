// Vercel serverless function — POST /api/generate-recipe
// This file runs on the server, not in the browser.
// It receives the user's request, sends it to Anthropic,
// and returns the recipe as markdown.

// The API key stays safe on the server.
// The browser never sees it.

// There are two modes:

// 1. "generate"
// The user gives ingredients.
// The app creates a new recipe.

// Example body:
// { ingredients: ["chicken", "rice", "tomato"] }

// 2. "extract"
// The user pastes a recipe caption from Instagram, TikTok,
// Facebook, a blog, or screenshot text.
// The app cleans it and turns it into a structured recipe.

// Example body:
// { caption: "..." }

// Why this is server-side:
// At first, the app called Anthropic directly from the browser.
// That worked for testing, but it was unsafe for production
// because the API key could be exposed in the website code.

// Now the frontend only sends a normal fetch request.
// Vercel keeps ANTHROPIC_API_KEY private on the server.

// This also makes the app easier to improve later.
// For example, I can add rate limiting, logging,
// or change the AI model without changing the frontend.

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
    // Only POST requests are allowed here.
    // If someone tries to use GET, the request will fail.
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST")
        return res.status(405).json({ error: "Method not allowed" })
    }

    // Default is "generate" so the old frontend still works
    // without any changes.
    const body = req.body || {}
    const mode = body.mode || "generate"

    // Check inputs early so we can give a clear error,
    // instead of waiting for the AI to fail later.
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

    // Check if the API key exists first.
    // It's better to fail early with a clear message
    // than get a confusing error later.
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

        // If the result isn’t actually a recipe,
        // return a clear 422 error so the frontend
        // can show a nice message instead of saving bad data.
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
