// ImportPage
// The "/import" route. Lets the user paste a recipe caption from anywhere
// (Instagram, TikTok, Facebook, a blog, a screenshot OCR, a forwarded text)
// and converts it into a clean, structured recipe in their library.
//
// Why "paste a caption" instead of "paste a URL"?
//   Instagram, TikTok, and Facebook all block scraping — direct fetches from
//   the browser hit CORS, login walls, or both. A serverless scraper would
//   need per-platform auth and would break the moment any of them tweaks
//   their HTML. Pasting the caption text sidesteps all of that AND works for
//   blogs, screenshots, friend-forwarded recipes, anything in arbitrary text.
//
// The two-phase UI:
//   1. Paste phase  — big textarea + "Extract recipe" button.
//   2. Preview phase — extracted markdown is rendered for review, then the
//      user clicks "Save to library" (or "Try again" to re-paste).
//
// The save action is identical to GeneratorPage's: parse the markdown,
// build a Recipe, dispatch ADD, navigate to the detail page. Imports look
// no different from generations once they're in the library.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuid } from "uuid"
import ReactMarkdown from "react-markdown"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorBanner from "../components/ErrorBanner"
import { extractRecipeFromCaption, NotARecipeError } from "../ai"
import { useRecipes } from "../context/RecipesContext"
import { parseRecipe } from "../utils/parseRecipe"
import { fetchUnsplashPhotoForRecipe } from "../utils/unsplash"

export default function ImportPage() {
    const [caption, setCaption] = useState("")
    const [recipe, setRecipe] = useState("")        // extracted markdown
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const { dispatch } = useRecipes()
    const navigate = useNavigate()

    async function handleExtract() {
        setError("")
        setIsLoading(true)
        try {
            const markdown = await extractRecipeFromCaption(caption)
            setRecipe(markdown)
        } catch (err) {
            console.error(err)
            if (err instanceof NotARecipeError) {
                setError(
                    "I couldn't find a recipe in that text. " +
                    "Try pasting a caption that actually has ingredients and steps."
                )
            } else {
                setError(
                    err?.message
                        ? `Couldn't extract a recipe: ${err.message}`
                        : "Couldn't extract a recipe. Check your connection and try again."
                )
            }
        } finally {
            setIsLoading(false)
        }
    }

    function handleTryAgain() {
        setRecipe("")
        setError("")
    }

    function saveRecipe() {
        const parsed = parseRecipe(recipe)
        const newRecipe = {
            id: uuid(),
            title: parsed.title || "Imported recipe",
            ingredients: parsed.ingredients,
            instructions: parsed.instructions,
            markdown: recipe,
            tags: ["imported"],         // small breadcrumb so the user can spot imports later
            dietary: [],
            cookTimeMinutes: parsed.cookTimeMinutes,
            image: "",
            favorite: false,
            createdAt: new Date().toISOString(),
        }
        dispatch({ type: "ADD", payload: newRecipe })

        // Best-effort Unsplash photo lookup. Same pattern as GeneratorPage:
        // never block the navigation, never bubble errors to the UI.
        fetchUnsplashPhotoForRecipe(newRecipe.title).then(({ url }) => {
            if (url) {
                dispatch({ type: "UPDATE_IMAGE", payload: { id: newRecipe.id, image: url } })
            }
        })

        navigate(`/recipe/${newRecipe.id}`)
    }

    const charCount = caption.length
    const tooShort = caption.trim().length < 10

    return (
        <main id="main" tabIndex={-1}>
            <section className="hero">
                <h2>
                    Import a recipe from <span className="accent">anywhere</span>
                </h2>
                <p>
                    Copy the caption from an Instagram reel, a TikTok, a Facebook post,
                    a food blog, or a forwarded text. Paste it below and we'll turn it
                    into a clean recipe and save it to your library.
                </p>
            </section>

            {!recipe && (
                <section className="import-panel" aria-label="Paste recipe text">
                    <label htmlFor="caption-input" className="import-label">
                        Paste the recipe caption
                    </label>
                    <textarea
                        id="caption-input"
                        className="import-textarea"
                        placeholder={
                            "e.g.\n\nThe BEST creamy garlic pasta 🍝✨ Save for later!\n\nYou'll need:\n- 1 lb spaghetti\n- 4 cloves garlic\n- 1 cup heavy cream\n- 1/2 cup parmesan\n\nBoil pasta. Sauté garlic in butter. Add cream, simmer 3 min. Toss with pasta and cheese. 20 mins total.\n\n#pasta #easyrecipes"
                        }
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        rows={12}
                        disabled={isLoading}
                    />
                    <div className="import-meta">
                        <span className={"char-count " + (tooShort ? "is-low" : "")}>
                            {charCount} character{charCount === 1 ? "" : "s"}
                        </span>
                        <div className="import-actions">
                            {caption && (
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={() => setCaption("")}
                                    disabled={isLoading}
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                type="button"
                                className="primary-btn"
                                onClick={handleExtract}
                                disabled={tooShort || isLoading}
                            >
                                {isLoading ? "Extracting..." : "Extract recipe"}
                            </button>
                        </div>
                    </div>

                    <details className="import-tip">
                        <summary>Where do I copy the caption from?</summary>
                        <ul>
                            <li><strong>Instagram:</strong> tap the post → tap the "..." → "Copy caption" (or long-press the caption text).</li>
                            <li><strong>TikTok:</strong> tap "Share" → "Copy link", then open the link and copy the description.</li>
                            <li><strong>Facebook:</strong> tap the post's "..." menu → "Copy link" or just select &amp; copy the visible text.</li>
                            <li><strong>Blog post:</strong> select the recipe text (ingredients + steps) and paste here.</li>
                            <li><strong>Image / screenshot:</strong> use your phone's "Live Text" / Google Lens to copy the text first.</li>
                        </ul>
                    </details>
                </section>
            )}

            <ErrorBanner message={error} onDismiss={() => setError("")} />

            {isLoading && <LoadingSpinner label="Reading the caption..." />}

            {recipe && !isLoading && (
                <>
                    <section className="import-preview" aria-label="Extracted recipe preview">
                        <div className="preview-banner">
                            <strong>Preview</strong> — review the extracted recipe, then save it.
                        </div>
                        <article className="suggested-recipe-container">
                            <ReactMarkdown>{recipe}</ReactMarkdown>
                        </article>
                    </section>

                    <div className="save-recipe-bar">
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={handleTryAgain}
                        >
                            Try a different caption
                        </button>
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={saveRecipe}
                        >
                            Save to library
                        </button>
                    </div>
                </>
            )}
        </main>
    )
}
