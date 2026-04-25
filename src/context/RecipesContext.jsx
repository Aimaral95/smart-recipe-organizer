// RecipesContext
// Holds the saved-recipe library so any page (Generator, Library, Detail)
// can read it without prop-drilling.
//
// Day 1 (today): skeleton only — empty array + no-op dispatch. App still renders.
// Day 3: replace useState with useReducer(recipesReducer) and add useLocalStorage
//        so saved recipes persist across refreshes.
//
// Usage in any component:
//     const { recipes, dispatch } = useRecipes()

import { createContext, useContext, useState } from "react"

const RecipesContext = createContext(null)

export function RecipesProvider({ children }) {
    // Placeholder state. Day 3 swaps this for useReducer + useLocalStorage.
    const [recipes, setRecipes] = useState([])

    // Placeholder dispatch — same shape we'll use with the reducer on Day 3,
    // so consumers don't need to change when we upgrade.
    function dispatch(action) {
        console.log("RecipesContext dispatch (stub):", action)
    }

    const value = { recipes, dispatch, setRecipes }
    return (
        <RecipesContext.Provider value={value}>
            {children}
        </RecipesContext.Provider>
    )
}

// Custom hook so consumers don't import useContext + the context object themselves.
// Throwing when used outside the provider catches a common bug early.
export function useRecipes() {
    const ctx = useContext(RecipesContext)
    if (ctx === null) {
        throw new Error("useRecipes must be used inside <RecipesProvider>")
    }
    return ctx
}
