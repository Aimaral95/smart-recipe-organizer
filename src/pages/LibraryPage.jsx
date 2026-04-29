// LibraryPage
// The "/library" route. Shows the saved recipes with:
//   - FilterBar (search, max time, dietary AND, tags OR, favorites-only)
//   - View toggle (grid | table)
//   - Filtered list rendered as cards or a sortable table
//
// State pattern:
//   - `recipes` lives in RecipesContext (persisted via reducer + useEffect).
//   - `filters` is local — they reset on full page reload, which feels right
//     for a library view (no surprise stale filters next session).
//   - `viewMode` is local but persisted to localStorage so the user's
//     preference sticks across sessions.

import { useEffect, useMemo, useState } from "react"
import RecipeCard from "../components/RecipeCard"
import RecipeTable from "../components/RecipeTable"
import FilterBar from "../components/FilterBar"
import LibraryActions from "../components/LibraryActions"
import { useRecipes } from "../context/RecipesContext"
import {
    EMPTY_FILTERS,
    filterRecipes,
    collectAllTags,
} from "../utils/filters"
import { loadJSON, saveJSON } from "../utils/storage"
import useDebounce from "../hooks/useDebounce"

const VIEW_KEY = "smart-recipe-organizer.view.v1"

export default function LibraryPage() {
    const { recipes, dispatch } = useRecipes()

    const [filters, setFilters] = useState(EMPTY_FILTERS)
    const [viewMode, setViewMode] = useState(() => {
        const stored = loadJSON(VIEW_KEY, "grid")
        return stored === "table" ? "table" : "grid"
    })

    // Persist view-mode preference whenever it changes.
    useEffect(() => {
        saveJSON(VIEW_KEY, viewMode)
    }, [viewMode])

    // Debounce only the search query — diet/tag/time chips already commit
    // discretely (one click = one filter change), so they don't need it.
    // 200ms feels instant but spares us a re-filter on every keystroke when
    // the library grows large.
    const debouncedQ = useDebounce(filters.q, 200)
    const effectiveFilters = useMemo(
        () => ({ ...filters, q: debouncedQ }),
        [filters, debouncedQ]
    )

    // Memoize derived data so we don't recompute on every render.
    const allTags = useMemo(() => collectAllTags(recipes), [recipes])
    const filtered = useMemo(
        () => filterRecipes(recipes, effectiveFilters),
        [recipes, effectiveFilters]
    )

    function toggleFavorite(id) {
        dispatch({ type: "TOGGLE_FAVORITE", payload: id })
    }

    // ---------- Empty library (no recipes saved at all) ---------- //
    if (recipes.length === 0) {
        return (
            <main id="main" tabIndex={-1}>
                <section className="hero">
                    <h2>
                        Your recipe <span className="accent">library</span>
                    </h2>
                    <p>0 saved recipes. Generate one and click "Save to library."</p>
                </section>
                <div className="empty-state">
                    <div className="icon" aria-hidden="true">📚</div>
                    <h3>No saved recipes yet</h3>
                    <p>Generate one on the home page, or import an existing library below.</p>
                    <div className="empty-actions">
                        <LibraryActions recipes={recipes} dispatch={dispatch} />
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main id="main" tabIndex={-1}>
            <section className="hero">
                <h2>
                    Your recipe <span className="accent">library</span>
                </h2>
                <p>
                    {recipes.length} saved recipe{recipes.length === 1 ? "" : "s"}.
                    Filter, sort, and dig in.
                </p>
            </section>

            <div className="library-toolbar">
                <LibraryActions recipes={recipes} dispatch={dispatch} />
                <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            <FilterBar
                filters={filters}
                onChange={setFilters}
                allTags={allTags}
                resultCount={filtered.length}
            />

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="icon" aria-hidden="true">🔍</div>
                    <h3>No recipes match these filters</h3>
                    <p>
                        Try removing a filter or{" "}
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => setFilters(EMPTY_FILTERS)}
                        >
                            clear all filters
                        </button>
                        .
                    </p>
                </div>
            ) : viewMode === "table" ? (
                <RecipeTable
                    recipes={filtered}
                    onToggleFav={toggleFavorite}
                />
            ) : (
                <div className="recipe-grid">
                    {filtered.map(r => (
                        <RecipeCard
                            key={r.id}
                            recipe={r}
                            onToggleFav={() => toggleFavorite(r.id)}
                        />
                    ))}
                </div>
            )}
        </main>
    )
}

// Small inline component — too tiny to deserve its own file.
function ViewToggle({ value, onChange }) {
    return (
        <div className="view-toggle" role="group" aria-label="View mode">
            <button
                type="button"
                className={"view-toggle-btn" + (value === "grid" ? " is-active" : "")}
                aria-pressed={value === "grid"}
                onClick={() => onChange("grid")}
            >
                ▦ Grid
            </button>
            <button
                type="button"
                className={"view-toggle-btn" + (value === "table" ? " is-active" : "")}
                aria-pressed={value === "table"}
                onClick={() => onChange("table")}
            >
                ☰ Table
            </button>
        </div>
    )
}
