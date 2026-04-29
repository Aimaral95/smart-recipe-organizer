// ai.js — client-side wrapper that returns recipe markdown.
//
// Two functions:
//   1. getRecipeFromChefClaude(ingredients[]) — generate a NEW recipe.
//   2. extractRecipeFromCaption(captionText)  — pull a structured recipe out
//      of arbitrary text the user pasted (Instagram / TikTok / Facebook /
//      blog captions). The "social media import" feature.
//
// In PRODUCTION both calls hit our own serverless endpoint at
// /api/generate-recipe (with a `mode` flag picking which prompt to use).
// The Anthropic API key lives only in Vercel's server environment — it never
// reaches the browser bundle, so site visitors can't steal it.
//
// In DEVELOPMENT we fall back to calling the Anthropic SDK directly from the
// browser with `dangerouslyAllowBrowser: true`, which is fine because:
//   - VITE_ANTHROPIC_API_KEY is in .env.local (gitignored).
//   - Nobody else can reach localhost.
//   - It saves you from having to install/run `vercel dev` to develop.
//
// To use the production code path locally instead, install `vercel` (npm i -g
// vercel), run `vercel dev`, and the same /api/generate-recipe call will be
// served by the local function runner.

import Anthropic from "@anthropic-ai/sdk"
import { HfInference } from "@huggingface/inference"

const GENERATE_SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients.

Format your response in markdown. Always include:
- An H2 with the recipe title
- An "Ingredients" section as a bullet list with quantities
- An "Instructions" section as a numbered list of steps
- An italic line at the end like: *Estimated cook time: 30 minutes*
`

// Mirrors the EXTRACT_SYSTEM_PROMPT in api/generate-recipe.js so the dev
// path (browser SDK) and the prod path (server) behave identically.
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
`

const browserKey = import.meta.env.VITE_ANTHROPIC_API_KEY
const isProd = import.meta.env.PROD

// Custom error so callers can detect "the input wasn't a recipe" specifically
// (e.g. show a friendly nudge instead of a generic error banner).
export class NotARecipeError extends Error {
    constructor(message = "I couldn't find a recipe in that text.") {
        super(message)
        this.name = "NotARecipeError"
    }
}

export async function getRecipeFromChefClaude(ingredientsArr) {
    // Production path: call our own server. Server has the real key.
    if (isProd || !browserKey) {
        return callServerEndpoint({ mode: "generate", ingredients: ingredientsArr })
    }
    // Dev path: browser SDK so `npm run dev` keeps working without `vercel dev`.
    return callBrowserSdk({
        system: GENERATE_SYSTEM_PROMPT,
        userMessage: `I have ${ingredientsArr.join(", ")}. Please give me a recipe you'd recommend I make!`,
    })
}

export async function extractRecipeFromCaption(captionText) {
    const trimmed = (captionText || "").trim()
    if (trimmed.length < 10) {
        throw new Error("Paste a longer caption — I need real content to work with.")
    }

    if (isProd || !browserKey) {
        return callServerEndpoint({ mode: "extract", caption: trimmed.slice(0, 8000) })
    }

    const text = await callBrowserSdk({
        system: EXTRACT_SYSTEM_PROMPT,
        userMessage: `Here is the caption I copied. Extract the recipe from it:\n\n---\n${trimmed.slice(0, 8000)}\n---`,
    })

    // The dev path doesn't go through the server's 422 short-circuit, so we
    // detect the sentinel here ourselves.
    if (text.trim() === "NOT_A_RECIPE") {
        throw new NotARecipeError()
    }
    return text
}

async function callServerEndpoint(body) {
    const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        // Try to read structured error first, fall back to status text.
        let detail = res.statusText
        try {
            const data = await res.json()
            if (data?.error) detail = data.error
        } catch { /* not JSON */ }

        // 422 from the extract path means "the model decided this isn't a
        // recipe" — give callers a typed error to react to.
        if (res.status === 422) {
            throw new NotARecipeError(detail)
        }
        throw new Error(detail || `Recipe API failed (${res.status})`)
    }

    const data = await res.json()
    return data.recipe || ""
}

async function callBrowserSdk({ system, userMessage }) {
    const anthropic = new Anthropic({
        apiKey: browserKey,
        dangerouslyAllowBrowser: true,
    })
    const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: userMessage }],
    })
    return msg.content[0].text
}

const hf = new HfInference(import.meta.env.VITE_HF_ACCESS_TOKEN)

export async function getRecipeFromMistral(ingredientsArr) {
    const ingredientsString = ingredientsArr.join(", ")
    try {
        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "system", content: GENERATE_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`,
                },
            ],
            max_tokens: 1024,
        })
        return response.choices[0].message.content
    } catch (err) {
        console.error(err.message)
        return ""
    }
}
