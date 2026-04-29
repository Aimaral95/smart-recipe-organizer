// RecipeDetailPage
// The "/recipe/:id" route. Reads :id from the URL, looks up the recipe in
// RecipesContext, renders the markdown, and exposes editable metadata
// (image, cook time, dietary, tags) below.
//
// All editors are controlled — each one calls a dispatch on change so the
// recipe persists immediately. There's no separate "Save" button: every
// keystroke / chip click is committed via context → reducer → localStorage.

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { useRecipes } from "../context/RecipesContext"
import TagEditor from "../components/TagEditor"
import DietarySelector from "../components/DietarySelector"
import CookTimeEditor from "../components/CookTimeEditor"
import ImageUploader from "../components/ImageUploader"
import { fetchUnsplashPhotoForRecipe, isUnsplashConfigured } from "../utils/unsplash"

export default function RecipeDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { recipes, dispatch } = useRecipes()
    const [photoStatus, setPhotoStatus] = useState("")  // "" | "loading" | "none"

    const recipe = recipes.find(r => r.id === id)

    if (!recipe) {
        return (
            <main id="main" tabIndex={-1}>
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

    function setTags(tags) {
        dispatch({ type: "UPDATE_TAGS", payload: { id, tags } })
    }

    function setDietary(dietary) {
        dispatch({ type: "UPDATE_DIET", payload: { id, dietary } })
    }

    function setCookTime(cookTimeMinutes) {
        dispatch({ type: "UPDATE_TIME", payload: { id, cookTimeMinutes } })
    }

    function setImage(image) {
        dispatch({ type: "UPDATE_IMAGE", payload: { id, image } })
    }

    // "Find a photo" button — fetches from Unsplash using the recipe's title
    // as the search query. Shows a quick "looking..." state, then either
    // updates the image or surfaces a "no photo found" hint for ~3s.
    async function findPhotoOnUnsplash() {
        if (!recipe) return
        setPhotoStatus("loading")
        const { url } = await fetchUnsplashPhotoForRecipe(recipe.title)
        if (url) {
            dispatch({ type: "UPDATE_IMAGE", payload: { id, image: url } })
            setPhotoStatus("")
        } else {
            setPhotoStatus("none")
            setTimeout(() => setPhotoStatus(""), 3000)
        }
    }

    return (
        <main id="main" tabIndex={-1} className="recipe-detail">
            <div className="detail-toolbar no-print">
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
                        className="ghost-btn"
                        onClick={() => window.print()}
                        title="Open the print dialog — choose 'Save as PDF' there"
                    >
                        ⎙ Print / PDF
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

            {/* Image lives above the markdown so it acts like a hero photo. */}
            <ImageUploader value={recipe.image || ""} onChange={setImage} />

            {/* "Find a photo" — best-effort Unsplash search using the recipe
                title. Hidden when the access key isn't configured so we don't
                show a button that does nothing. */}
            {isUnsplashConfigured() && (
                <div className="photo-finder no-print">
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={findPhotoOnUnsplash}
                        disabled={photoStatus === "loading"}
                    >
                        {photoStatus === "loading"
                            ? "Looking on Unsplash..."
                            : recipe.image
                                ? "Try a different photo"
                                : "Find a photo on Unsplash"}
                    </button>
                    {photoStatus === "none" && (
                        <span className="photo-finder-hint">
                            No matching photo — try editing the title or upload one yourself.
                        </span>
                    )}
                </div>
            )}

            <article className="suggested-recipe-container">
                <ReactMarkdown>{recipe.markdown}</ReactMarkdown>
            </article>

            {/* Editable metadata. Each control dispatches on change. */}
            <section className="details-panel" aria-label="Recipe details">
                <h3>Details</h3>

                <div className="details-row">
                    <label className="details-label" htmlFor="cooktime">Cook time</label>
                    <CookTimeEditor
                        value={recipe.cookTimeMinutes}
                        onChange={setCookTime}
                    />
                </div>

                <div className="details-row">
                    <span className="details-label">Dietary</span>
                    <DietarySelector
                        value={recipe.dietary || []}
                        onChange={setDietary}
                    />
                </div>

                <div className="details-row">
                    <span className="details-label">Tags</span>
                    <TagEditor
                        tags={recipe.tags || []}
                        onChange={setTags}
                    />
                </div>
            </section>
        </main>
    )
}
