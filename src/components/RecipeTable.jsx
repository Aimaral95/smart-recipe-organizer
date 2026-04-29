// RecipeTable
// Compact tabular view of the library — alternative to the card grid.
// Useful when the user has lots of recipes and wants to scan/sort them.
//
// Sorting is local component state. Clicking a header toggles ascending /
// descending; clicking a different header switches the sort key and resets
// to ascending. The actual sort happens via sortRecipes from utils/filters.
//
// Navigation pattern: the whole row is wrapped in an onClick that calls
// navigate(...). The favorite ★ button uses stopPropagation so clicking it
// doesn't also fire the row click. We keep it as a <tr role="link"> with
// keyboard support so it's still accessible.
//
// Props:
//   recipes:        already-filtered list to display
//   onToggleFav:    (id) => void

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sortRecipes } from "../utils/filters"

export default function RecipeTable({ recipes, onToggleFav }) {
    const navigate = useNavigate()
    const [sortKey, setSortKey] = useState("title")
    const [sortDir, setSortDir] = useState("asc")

    const sorted = useMemo(
        () => sortRecipes(recipes, sortKey, sortDir),
        [recipes, sortKey, sortDir]
    )

    function handleSort(key) {
        if (key === sortKey) {
            setSortDir(d => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(key)
            setSortDir("asc")
        }
    }

    function indicator(key) {
        if (key !== sortKey) return ""
        return sortDir === "asc" ? " ↑" : " ↓"
    }

    function go(id) {
        navigate(`/recipe/${id}`)
    }

    function onRowKeyDown(e, id) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            go(id)
        }
    }

    return (
        <div className="recipe-table-wrap">
            <table className="recipe-table">
                <thead>
                    <tr>
                        <th scope="col" className="th-fav" aria-label="Favorite"></th>
                        <SortHeader
                            label="Title"
                            active={sortKey === "title"}
                            indicator={indicator("title")}
                            onClick={() => handleSort("title")}
                        />
                        <SortHeader
                            label="Cook time"
                            active={sortKey === "cookTimeMinutes"}
                            indicator={indicator("cookTimeMinutes")}
                            onClick={() => handleSort("cookTimeMinutes")}
                            className="th-time"
                        />
                        <th scope="col" className="th-diet">Dietary</th>
                        <th scope="col" className="th-tags">Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(r => (
                        <tr
                            key={r.id}
                            className="recipe-row"
                            role="link"
                            tabIndex={0}
                            onClick={() => go(r.id)}
                            onKeyDown={e => onRowKeyDown(e, r.id)}
                            aria-label={`Open recipe ${r.title}`}
                        >
                            <td className="td-fav">
                                <button
                                    type="button"
                                    className={"row-favorite " + (r.favorite ? "is-fav" : "")}
                                    onClick={e => {
                                        e.stopPropagation()
                                        onToggleFav(r.id)
                                    }}
                                    aria-label={r.favorite ? "Unfavorite" : "Mark as favorite"}
                                >
                                    {r.favorite ? "★" : "☆"}
                                </button>
                            </td>
                            <td className="td-title">{r.title}</td>
                            <td className="td-time">
                                {typeof r.cookTimeMinutes === "number"
                                    ? `${r.cookTimeMinutes} min`
                                    : "—"}
                            </td>
                            <td className="td-diet">
                                {(r.dietary && r.dietary.length > 0)
                                    ? r.dietary.join(", ")
                                    : <span className="muted">—</span>}
                            </td>
                            <td className="td-tags">
                                {(r.tags && r.tags.length > 0) ? (
                                    <div className="row-tags">
                                        {r.tags.slice(0, 4).map(tag => (
                                            <span key={tag} className="card-tag">{tag}</span>
                                        ))}
                                        {r.tags.length > 4 && (
                                            <span className="muted">+{r.tags.length - 4}</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="muted">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function SortHeader({ label, active, indicator, onClick, className = "" }) {
    return (
        <th scope="col" className={className} aria-sort={active ? "ascending" : "none"}>
            <button
                type="button"
                className="th-sort-btn"
                onClick={onClick}
            >
                {label}
                <span className="th-sort-indicator">{indicator}</span>
            </button>
        </th>
    )
}
