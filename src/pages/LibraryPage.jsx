// LibraryPage
// Day 3: this page will show a grid of saved recipes pulled from RecipesContext.
// Day 4: filter bar (diet, tag, max cook time, title search) lives here.
// Day 4-5: grid/table view toggle.
// For Day 1 it's just a stub so the route resolves.

export default function LibraryPage() {
    return (
        <main>
            <section className="hero">
                <h2>Your recipe <span className="accent">library</span></h2>
                <p>Recipes you save will live here. Tag them, filter by dietary needs or cook time, and pull them up anytime.</p>
            </section>

            <div className="empty-state">
                <div className="icon" aria-hidden="true">📚</div>
                <h3>Library coming Day 3</h3>
                <p>Once we wire up saving, this page fills with your recipe cards.</p>
            </div>
        </main>
    )
}
