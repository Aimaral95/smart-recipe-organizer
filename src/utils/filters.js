// filters.js
// Pure helpers for narrowing the recipe library by user-chosen criteria.
//
// Why pure functions? They're easy to reason about, easy to unit-test, and
// they don't pull in React. The component layer just calls filterRecipes
// with a filters object and renders whatever comes back.
//
// Filter shape:
//   {
//     q:             string   case-insensitive substring of the title
//     maxTime:       number?  max cook time in minutes (null = no limit)
//     diets:         string[] AND filter — recipe must have ALL of these
//     tags:          string[] OR filter  — recipe must have ANY of these
//     favoritesOnly: boolean
//   }
//
// Empty / null filters are skipped, so an "empty" filters object passes
// every recipe through unchanged.

export const EMPTY_FILTERS = {
    q: "",
    maxTime: null,
    diets: [],
    tags: [],
    favoritesOnly: false,
}

/** True if the user actually has any filter active. Used to render the "Clear all" affordance. */
export function isAnyFilterActive(filters) {
    if (!filters) return false
    return Boolean(
        (filters.q && filters.q.trim()) ||
        typeof filters.maxTime === "number" ||
        (filters.diets && filters.diets.length > 0) ||
        (filters.tags && filters.tags.length > 0) ||
        filters.favoritesOnly
    )
}

/**
 * Returns a new array of recipes that pass all active filters.
 * Order is preserved — filtering never re-sorts.
 */
export function filterRecipes(recipes, filters = EMPTY_FILTERS) {
    if (!Array.isArray(recipes)) return []

    const q = (filters.q || "").trim().toLowerCase()
    const maxTime = typeof filters.maxTime === "number" ? filters.maxTime : null
    const diets = filters.diets || []
    const tags = filters.tags || []
    const favoritesOnly = !!filters.favoritesOnly

    return recipes.filter(recipe => {
        // Title search — substring match, case-insensitive.
        if (q && !(recipe.title || "").toLowerCase().includes(q)) return false

        // Max cook time. If a recipe has no cookTimeMinutes set we exclude it
        // when a time filter is active — "show me recipes under 30 min" should
        // not surface recipes with unknown duration.
        if (maxTime !== null) {
            const t = recipe.cookTimeMinutes
            if (typeof t !== "number") return false
            if (t > maxTime) return false
        }

        // Dietary AND-filter: every selected diet must be present on the recipe.
        if (diets.length > 0) {
            const recipeDiets = recipe.dietary || []
            const hasAll = diets.every(d => recipeDiets.includes(d))
            if (!hasAll) return false
        }

        // Tag OR-filter: any one of the selected tags is enough.
        if (tags.length > 0) {
            const recipeTags = recipe.tags || []
            const hasAny = tags.some(t => recipeTags.includes(t))
            if (!hasAny) return false
        }

        if (favoritesOnly && !recipe.favorite) return false

        return true
    })
}

/**
 * Collect every unique tag across the library, sorted alphabetically.
 * Used by the FilterBar to render a chip per known tag.
 */
export function collectAllTags(recipes) {
    if (!Array.isArray(recipes)) return []
    const set = new Set()
    for (const r of recipes) {
        for (const t of r.tags || []) {
            if (typeof t === "string" && t.trim()) set.add(t)
        }
    }
    return [...set].sort()
}

/**
 * Sort helper for the table view. Returns a new array.
 * key: "title" | "cookTimeMinutes" | "favorite"
 * dir: "asc" | "desc"
 */
export function sortRecipes(recipes, key, dir = "asc") {
    if (!Array.isArray(recipes)) return []
    const sign = dir === "desc" ? -1 : 1
    const copy = [...recipes]

    copy.sort((a, b) => {
        const av = a[key]
        const bv = b[key]

        // Push nullish values to the bottom regardless of direction.
        const aMissing = av == null
        const bMissing = bv == null
        if (aMissing && bMissing) return 0
        if (aMissing) return 1
        if (bMissing) return -1

        if (typeof av === "string" && typeof bv === "string") {
            return av.localeCompare(bv) * sign
        }
        if (typeof av === "boolean" && typeof bv === "boolean") {
            // true sorts before false in asc.
            return (Number(bv) - Number(av)) * sign
        }
        return (av - bv) * sign
    })

    return copy
}
