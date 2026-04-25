// RecipeDetailPage
// Day 3: full recipe view (title, ingredients, instructions, markdown) + delete.
// Day 4: edit tags + dietary + cook time inline; recipe image.
// Reads :id from the URL via useParams and looks up the recipe in RecipesContext.

import { useParams } from "react-router-dom"

export default function RecipeDetailPage() {
    const { id } = useParams()
    return (
        <main>
            <section className="hero">
                <h2>Recipe detail</h2>
                <p>Full view coming Day 3. Right now this page is just proving routing works.</p>
            </section>
            <div className="empty-state">
                <p>URL param <code>id</code>: <strong>{id}</strong></p>
            </div>
        </main>
    )
}
