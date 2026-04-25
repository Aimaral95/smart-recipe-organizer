// RecipesContext
// The saved-recipe library, made available to every page in the app.
//
// Three jobs:
//   1. Hold state via useReducer(recipesReducer).
//   2. Initialize from localStorage (or seed with sampleRecipes for first visit).
//   3. Persist on every change via useEffect.
//
// Bumping STORAGE_KEY to a new "v" string is the migration trick: if we ever
// change the recipe shape in a breaking way, change "v1" to "v2" and existing
// users get the seeded data again. Cheap and avoids weird half-migrated state.

import { createContext, useContext, useReducer, useEffect } from "react"
import { recipesReducer } from "../reducers/recipesReducer"
import { loadJSON, saveJSON } from "../utils/storage"
import sampleRecipes from "../data/sampleRecipes.json"

const STORAGE_KEY = "smart-recipe-organizer.recipes.v1"

const RecipesContext = createContext(null)

export function RecipesProvider({ children }) {
    // Lazy initializer — runs only on first render. Reads from localStorage,
    // falling back to the seeded sample recipes the first time the user opens
    // the app. Without lazy init, this would re-run on every render and waste work.
    const [recipes, dispatch] = useReducer(
        recipesReducer,
        undefined,
        () => loadJSON(STORAGE_KEY, sampleRecipes)
    )

    // Persist on every change. Effect runs after React commits state to the DOM.
    useEffect(() => {
        saveJSON(STORAGE_KEY, recipes)
    }, [recipes])

    const value = { recipes, dispatch }
    return (
        <RecipesContext.Provider value={value}>
            {children}
        </RecipesContext.Provider>
    )
}

// Custom hook so consumers don't import useContext + the context object themselves.
// Throws if used outside the provider — catches a common bug early.
export function useRecipes() {
    const ctx = useContext(RecipesContext)
    if (ctx === null) {
        throw new Error("useRecipes must be used inside <RecipesProvider>")
    }
    return ctx
}
