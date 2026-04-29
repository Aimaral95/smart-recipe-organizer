// IngredientsList
// Renders the chips of ingredients the user has added, plus the "Get a recipe"
// CTA card once they've added at least 4. Stateless — receives everything via props.
//
// Two callbacks come down from GeneratorPage:
//   onRemove(ingredient): called when the user clicks × on a chip
//   getRecipe():          called when the user clicks "Get a recipe"
//
// `disabled` blocks the CTA while an AI call is in flight (Day 2 loading state).

export default function IngredientsList({ ingredients, onRemove, getRecipe, disabled }) {
    return (
        <section className="ingredients-section">
            <h2>Ingredients on hand</h2>
            <ul className="ingredients-list" aria-live="polite">
                {ingredients.map(ingredient => (
                    <li key={ingredient}>
                        <span>{ingredient}</span>
                        <button
                            type="button"
                            className="chip-remove"
                            onClick={() => onRemove(ingredient)}
                            aria-label={`Remove ${ingredient}`}
                            title={`Remove ${ingredient}`}
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>

            {ingredients.length > 3 ? (
                <div className="get-recipe-container">
                    <div>
                        <h3>Ready for a recipe?</h3>
                        <p>Generate a recipe from your list of ingredients.</p>
                    </div>
                    <button onClick={getRecipe} disabled={disabled}>
                        {disabled ? "Generating..." : "Get a recipe"}
                    </button>
                </div>
            ) : (
                <p className="ingredients-hint" aria-live="polite">
                    Add {4 - ingredients.length} more
                    {ingredients.length === 3 ? " ingredient" : " ingredients"} to
                    generate a recipe.
                </p>
            )}
        </section>
    )
}
