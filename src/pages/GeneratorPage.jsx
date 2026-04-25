// GeneratorPage
// The "/" route. Lets the user collect ingredients, then asks the AI for a recipe.
//
// Local state (intentional — not in RecipesContext):
//   ingredients: string[]  — chips shown before the user generates
//   recipe:      string    — markdown returned from the AI
//
// On Day 2 we'll add: delete-ingredient, validation, loading + error states.
// On Day 3 we'll add: a "Save recipe" button that dispatches to RecipesContext.

import React from "react"
import IngredientsList from "../components/IngredientsList"
import ClaudeRecipe from "../components/ClaudeRecipe"
import { getRecipeFromChefClaude } from "../ai"

export default function GeneratorPage() {
    const [ingredients, setIngredients] = React.useState([])
    const [recipe, setRecipe] = React.useState("")

    async function getRecipe() {
        const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
        setRecipe(recipeMarkdown)
    }

    function addIngredient(formData) {
        const newIngredient = formData.get("ingredient")
        // Day 2 will add: trim, dedupe, reject empty.
        setIngredients(prev => [...prev, newIngredient])
    }

    return (
        <main>
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
                    getRecipe={getRecipe}
                />
            )}

            {recipe && <ClaudeRecipe recipe={recipe} />}
        </main>
    )
}
