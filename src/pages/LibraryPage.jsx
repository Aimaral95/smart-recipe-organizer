// LibraryPage
// The "/library" route. Reads the saved-recipe library from RecipesContext
// and renders a grid of RecipeCards.
//
// Day 4 will add: FilterBar (diet, tag, max time, search), favorites-only
// toggle, grid/table view switcher.

import RecipeCard from "../components/RecipeCard"
import { useRecipes } from "../context/RecipesContext"

export default function LibraryPage() {
    const { recipes, dispatch } = useRecipes()

    return (
        <main>
            <section className="hero">
                <h2>
                    Your recipe <span className="accent">library</span>
                </h2>
                <p>
                    {recipes.length} saved recipe{recipes.length === 1 ? "" : "s"}.
                    Click any card to view, edit tags, or delete.
                </p>
            </section>

            {recipes.length === 0 ? (
                <div className="empty-state">
                    <div className="icon" aria-hidden="true">📚</div>
                    <h3>No saved recipes yet</h3>
                    <p>Generate one on the home page and click "Save to library."</p>
                </div>
            ) : (
                <div className="recipe-grid">
                    {recipes.map(r => (
                        <RecipeCard
                            key={r.id}
                            recipe={r}
                            onToggleFav={() =>
                                dispatch({ type: "TOGGLE_FAVORITE", payload: r.id })
                            }
                        />
                    ))}
                </div>
            )}
        </main>
    )
}
