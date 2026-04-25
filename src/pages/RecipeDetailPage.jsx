// RecipeDetailPage
// The "/recipe/:id" route. Reads :id from the URL, looks up the recipe in
// RecipesContext, and renders it. Includes a Delete button that dispatches
// DELETE then redirects back to the library.
//
// Day 4 will add: TagEditor, dietary multi-select, cook time editor, image upload.
// Day 5 will add: keyboard shortcut for delete.

import { useParams, useNavigate, Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { useRecipes } from "../context/RecipesContext"

export default function RecipeDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { recipes, dispatch } = useRecipes()

    // Pull the matching recipe out of the array. find() returns undefined
    // if no match, which we handle with a friendly 404 view.
    const recipe = recipes.find(r => r.id === id)

    if (!recipe) {
        return (
            <main>
                <section className="hero">
                    <h2>Recipe not found</h2>
                    <p>That recipe might have been deleted, or the link is wrong.</p>
                </section>
                <div className="empty-state">
                    <Link to="/library" className="primary-btn">Back to library</Link>
                </div>
            </main>
        )
    }

    function handleDelete() {
        const confirmed = window.confirm(
            `Delete "${recipe.title}"? This can't be undone.`
        )
        if (!confirmed) return
        dispatch({ type: "DELETE", payload: id })
        navigate("/library")
    }

    function toggleFavorite() {
        dispatch({ type: "TOGGLE_FAVORITE", payload: id })
    }

    return (
        <main className="recipe-detail">
            <div className="detail-toolbar">
                <Link to="/library" className="ghost-btn">← Library</Link>
                <div className="toolbar-actions">
                    <button
                        type="button"
                        className={"icon-btn " + (recipe.favorite ? "is-fav" : "")}
                        onClick={toggleFavorite}
                        aria-label={recipe.favorite ? "Unfavorite" : "Mark as favorite"}
                    >
                        {recipe.favorite ? "★ Favorite" : "☆ Favorite"}
                    </button>
                    <button
                        type="button"
                        className="danger-btn"
                        onClick={handleDelete}
                    >
                        Delete recipe
                    </button>
                </div>
            </div>

            <article className="suggested-recipe-container">
                <ReactMarkdown>{recipe.markdown}</ReactMarkdown>
            </article>

            <aside className="detail-meta">
                {typeof recipe.cookTimeMinutes === "number" && (
                    <span className="meta-pill">⏱ {recipe.cookTimeMinutes} min</span>
                )}
                {recipe.dietary?.length > 0 && (
                    <span className="meta-pill">🥗 {recipe.dietary.join(", ")}</span>
                )}
                {recipe.tags?.length > 0 && (
                    <div className="card-tags">
                        {recipe.tags.map(tag => (
                            <span key={tag} className="card-tag">{tag}</span>
                        ))}
                    </div>
                )}
            </aside>
        </main>
    )
}
