// GeneratorPage
// The "/" route. Lets the user collect ingredients, generate a recipe with AI,
// then save it to their library.
//
// Local state (intentional — not in RecipesContext):
//   ingredients: string[]   chips shown before the user generates
//   recipe:      string     markdown returned from the AI (last generation)
//   isLoading:   boolean    true while an AI call is in flight
//   error:       string     human-readable error message ("" = no error)
//   savedId:     string|""  id of the just-saved recipe (so we can offer "View")
//
// On save: parseRecipe → build full recipe object → dispatch ADD → navigate to detail.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuid } from "uuid"
import IngredientsList from "../components/IngredientsList"
import ClaudeRecipe from "../components/ClaudeRecipe"
import LoadingSpinner from "../components/LoadingSpinner"
import ErrorBanner from "../components/ErrorBanner"
import { getRecipeFromChefClaude } from "../ai"
import { useRecipes } from "../context/RecipesContext"
import { parseRecipe } from "../utils/parseRecipe"
import { fetchUnsplashPhotoForRecipe } from "../utils/unsplash"

export default function GeneratorPage() {
    const [ingredients, setIngredients] = useState([])
    const [recipe, setRecipe] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [savedId, setSavedId] = useState("")

    const { dispatch } = useRecipes()
    const navigate = useNavigate()

    function addIngredient(formData) {
        const raw = formData.get("ingredient")?.trim()
        if (!raw) return
        const isDuplicate = ingredients.some(
            existing => existing.toLowerCase() === raw.toLowerCase()
        )
        if (isDuplicate) return
        setIngredients(prev => [...prev, raw])
    }

    function removeIngredient(ingredient) {
        setIngredients(prev => prev.filter(item => item !== ingredient))
    }

    async function getRecipe() {
        setError("")
        setSavedId("")  // generating a new one wipes the "saved" indicator
        setIsLoading(true)
        try {
            const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
            setRecipe(recipeMarkdown)
        } catch (err) {
            console.error(err)
            setError(
                err?.message
                    ? `Couldn't generate a recipe: ${err.message}`
                    : "Couldn't generate a recipe. Check your connection and try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    function saveRecipe() {
        // Pull structured data out of the AI markdown. parseRecipe is forgiving —
        // missing fields fall through as null/[] and the markdown is still preserved.
        const parsed = parseRecipe(recipe)
        const newRecipe = {
            id: uuid(),
            title: parsed.title || "Untitled recipe",
            ingredients: parsed.ingredients,
            instructions: parsed.instructions,
            markdown: recipe,
            tags: [],
            dietary: [],
            cookTimeMinutes: parsed.cookTimeMinutes,
            image: "",
            favorite: false,
            createdAt: new Date().toISOString(),
        }
        dispatch({ type: "ADD", payload: newRecipe })
        setSavedId(newRecipe.id)

        // Fire-and-forget Unsplash photo lookup. We deliberately do NOT
        // await this — saving is instant whether or not the photo arrives.
        // If the call succeeds we patch in the URL with UPDATE_IMAGE. If
        // the user has no access key, or the API fails, the recipe just
        // stays imageless and they can upload one manually.
        fetchUnsplashPhotoForRecipe(newRecipe.title).then(({ url }) => {
            if (url) {
                dispatch({ type: "UPDATE_IMAGE", payload: { id: newRecipe.id, image: url } })
            }
        })

        // Hand off to the detail page so the user sees what they saved.
        navigate(`/recipe/${newRecipe.id}`)
    }

    return (
        <main id="main" tabIndex={-1}>
            <section className="hero">
                <h2>
                    Cook with what's <span className="accent">already in your kitchen</span>
                </h2>
                <p>
                    Add the ingredients you have on hand and we'll generate a recipe you can make right now.
                    Save the ones you love to your library.
                </p>
            </section>

            <form action={addIngredient} className="add-ingredient-form">
                <input
                    type="text"
                    placeholder="e.g. chicken, oregano, heavy cream..."
                    aria-label="Add ingredient"
                    name="ingredient"
                    required
                    maxLength={60}
                />
                <button>Add ingredient</button>
            </form>

            {ingredients.length === 0 ? (
                <div className="empty-state">
                    <div className="icon" aria-hidden="true">🥗</div>
                    <h3>No ingredients yet</h3>
                    <p>Type one above to get started. Add at least 4 and we'll suggest a recipe.</p>
                </div>
            ) : (
                <IngredientsList
                    ingredients={ingredients}
                    onRemove={removeIngredient}
                    getRecipe={getRecipe}
                    disabled={isLoading}
                />
            )}

            <ErrorBanner message={error} onDismiss={() => setError("")} />

            {isLoading && <LoadingSpinner label="Asking Chef Claude..." />}

            {recipe && !isLoading && (
                <>
                    <ClaudeRecipe recipe={recipe} />
                    <div className="save-recipe-bar">
                        {savedId ? (
                            <span className="saved-note">Saved to your library ✓</span>
                        ) : (
                            <button
                                type="button"
                                className="primary-btn"
                                onClick={saveRecipe}
                            >
                                Save to library
                            </button>
                        )}
                    </div>
                </>
            )}
        </main>
    )
}
