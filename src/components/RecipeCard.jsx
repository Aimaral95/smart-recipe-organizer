// RecipeCard
// Compact preview of a single recipe — used in the LibraryPage grid.
// Whole-card click navigates to the detail route. Favorite ★ is a separate
// button (sibling of the Link, not a child) so clicking it doesn't trigger
// the navigation.
//
// Props:
//   recipe:        the recipe object
//   onToggleFav:   () => void

import { Link } from "react-router-dom"

export default function RecipeCard({ recipe, onToggleFav }) {
    const { id, title, cookTimeMinutes, tags = [], dietary = [], favorite } = recipe

    return (
        <article className="recipe-card">
            <button
                type="button"
                className={"card-favorite " + (favorite ? "is-fav" : "")}
                onClick={onToggleFav}
                aria-label={favorite ? "Unfavorite" : "Mark as favorite"}
                title={favorite ? "Unfavorite" : "Mark as favorite"}
            >
                {favorite ? "★" : "☆"}
            </button>
            <Link to={`/recipe/${id}`} className="card-link">
                <h3 className="card-title">{title}</h3>
                <div className="card-meta">
                    {typeof cookTimeMinutes === "number" && (
                        <span className="card-time">⏱ {cookTimeMinutes} min</span>
                    )}
                    {dietary.length > 0 && (
                        <span className="card-diet">{dietary.join(" · ")}</span>
                    )}
                </div>
                {tags.length > 0 && (
                    <div className="card-tags">
                        {tags.slice(0, 4).map(tag => (
                            <span key={tag} className="card-tag">{tag}</span>
                        ))}
                    </div>
                )}
            </Link>
        </article>
    )
}
