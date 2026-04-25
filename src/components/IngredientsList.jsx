// IngredientsList
// Renders the chips of ingredients the user has added, plus the "Get a recipe"
// CTA card once they've added at least 4. Stateless — receives everything via props.
//
// Day 2 will add a small × delete button to each chip.

export default function IngredientsList({ ingredients, getRecipe }) {
    return (
        <section className="ingredients-section">
            <h2>Ingredients on hand</h2>
            <ul className="ingredients-list" aria-live="polite">
                {ingredients.map(ingredient => (
                    <li key={ingredient}>{ingredient}</li>
                ))}
            </ul>

            {ingredients.length > 3 && (
                <div className="get-recipe-container">
                    <div>
                        <h3>Ready for a recipe?</h3>
                        <p>Generate a recipe from your list of ingredients.</p>
                    </div>
                    <button onClick={getRecipe}>Get a recipe</button>
                </div>
            )}
        </section>
    )
}
