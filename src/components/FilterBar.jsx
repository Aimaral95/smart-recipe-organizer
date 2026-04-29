// FilterBar
// All the filter controls that sit on top of the LibraryPage. This is a
// controlled component — the parent owns the `filters` object and passes a
// single `onChange(nextFilters)` setter. Each control builds the next
// filters object by spreading the current one and overriding one field.
//
// Why controlled? A single source of truth makes "Clear all" trivial
// (just pass EMPTY_FILTERS upward) and means the parent can also drive
// the filters from elsewhere — e.g. URL params later, or a "favorites only"
// shortcut button on a card.
//
// Props:
//   filters:    current filters object
//   onChange:   (nextFilters) => void
//   allTags:    string[]   tags discovered across the user's library
//   resultCount:number     post-filter count, shown in the header

import { DIETARY_OPTIONS } from "./DietarySelector"
import { EMPTY_FILTERS, isAnyFilterActive } from "../utils/filters"

export default function FilterBar({ filters, onChange, allTags = [], resultCount }) {
    function patch(partial) {
        onChange({ ...filters, ...partial })
    }

    function toggleDiet(d) {
        const has = filters.diets.includes(d)
        patch({
            diets: has ? filters.diets.filter(x => x !== d) : [...filters.diets, d],
        })
    }

    function toggleTag(t) {
        const has = filters.tags.includes(t)
        patch({
            tags: has ? filters.tags.filter(x => x !== t) : [...filters.tags, t],
        })
    }

    function handleMaxTime(e) {
        const v = e.target.value
        if (v === "") {
            patch({ maxTime: null })
            return
        }
        const n = parseInt(v, 10)
        if (Number.isNaN(n) || n < 0) return
        patch({ maxTime: n })
    }

    const anyActive = isAnyFilterActive(filters)

    return (
        <section className="filter-bar" aria-label="Recipe filters">
            <div className="filter-bar-header">
                <h3>Filters</h3>
                <span className="filter-result-count" aria-live="polite">
                    {resultCount} result{resultCount === 1 ? "" : "s"}
                </span>
                {anyActive && (
                    <button
                        type="button"
                        className="ghost-btn filter-clear"
                        onClick={() => onChange(EMPTY_FILTERS)}
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="filter-row">
                <label className="filter-field">
                    <span className="filter-field-label">Search</span>
                    <input
                        type="search"
                        value={filters.q}
                        onChange={e => patch({ q: e.target.value })}
                        placeholder="Search by title…"
                        aria-label="Search recipes by title"
                    />
                </label>

                <label className="filter-field filter-field-time">
                    <span className="filter-field-label">Max cook time</span>
                    <span className="filter-time-row">
                        <input
                            type="number"
                            min="0"
                            max="999"
                            step="5"
                            value={filters.maxTime ?? ""}
                            onChange={handleMaxTime}
                            placeholder="any"
                            aria-label="Maximum cook time in minutes"
                        />
                        <span className="suffix">min</span>
                    </span>
                </label>

                <label className="filter-field filter-field-fav">
                    <input
                        type="checkbox"
                        checked={filters.favoritesOnly}
                        onChange={e => patch({ favoritesOnly: e.target.checked })}
                    />
                    <span>★ Favorites only</span>
                </label>
            </div>

            <div className="filter-section">
                <span className="filter-section-label">Dietary (matches all)</span>
                <div className="filter-chip-group" role="group" aria-label="Filter by dietary">
                    {DIETARY_OPTIONS.map(option => {
                        const selected = filters.diets.includes(option)
                        return (
                            <button
                                type="button"
                                key={option}
                                className={"diet-chip" + (selected ? " selected" : "")}
                                aria-pressed={selected}
                                onClick={() => toggleDiet(option)}
                            >
                                {option}
                            </button>
                        )
                    })}
                </div>
            </div>

            {allTags.length > 0 && (
                <div className="filter-section">
                    <span className="filter-section-label">Tags (matches any)</span>
                    <div className="filter-chip-group" role="group" aria-label="Filter by tags">
                        {allTags.map(tag => {
                            const selected = filters.tags.includes(tag)
                            return (
                                <button
                                    type="button"
                                    key={tag}
                                    className={"tag-filter-chip" + (selected ? " selected" : "")}
                                    aria-pressed={selected}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </section>
    )
}
