// LibraryActions
// Export / Import controls for the recipe library.
//
// Export:
//   We build a JSON blob with a small wrapper { version, exportedAt, recipes }
//   so future versions can detect format changes. Then we create an object URL
//   and trigger a download via a synthetic anchor click. The URL is revoked
//   immediately after to free memory.
//
// Import:
//   The hidden <input type="file"> is what actually gets clicked when the
//   user presses "Import." FileReader reads the file as text, JSON.parse turns
//   it into an object, and we validate the shape before dispatching IMPORT.
//   IMPORT is a *merge* (local wins on conflict) — the reducer handles that.
//
// Why merge instead of replace? Importing should never quietly destroy data
// the user has spent time tagging. If they want a clean slate they can clear
// localStorage in DevTools — explicit and obvious.
//
// Props:
//   recipes:   the current library (for export)
//   dispatch:  reducer dispatch (for import)

import { useRef, useState } from "react"

const FORMAT_VERSION = 1

export default function LibraryActions({ recipes, dispatch }) {
    const fileRef = useRef(null)
    const [message, setMessage] = useState(null)   // { kind: "ok"|"err", text }

    function showMessage(kind, text) {
        setMessage({ kind, text })
        setTimeout(() => setMessage(null), 4000)
    }

    function handleExport() {
        const payload = {
            version: FORMAT_VERSION,
            exportedAt: new Date().toISOString(),
            recipes,
        }
        const json = JSON.stringify(payload, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)

        // Build a date stamp in the user's local timezone for the filename.
        const stamp = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD

        const a = document.createElement("a")
        a.href = url
        a.download = `recipe-library-${stamp}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        showMessage("ok", `Exported ${recipes.length} recipe${recipes.length === 1 ? "" : "s"}.`)
    }

    function handleImportClick() {
        fileRef.current?.click()
    }

    function handleFile(e) {
        const file = e.target.files?.[0]
        // Reset the input so the same file can be picked again later if needed.
        e.target.value = ""
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result))

                // Accept both wrapped { recipes: [...] } and bare [...] for
                // friendlier import (e.g. someone hand-edits a file).
                const incoming = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed?.recipes)
                        ? parsed.recipes
                        : null

                if (!incoming) {
                    showMessage("err", "That JSON doesn't look like a recipe library.")
                    return
                }

                // Light validation: keep only objects with id + title + markdown.
                const valid = incoming.filter(r =>
                    r && typeof r.id === "string"
                    && typeof r.title === "string"
                    && typeof r.markdown === "string"
                )

                if (valid.length === 0) {
                    showMessage("err", "No valid recipes found in that file.")
                    return
                }

                const before = recipes.length
                dispatch({ type: "IMPORT", payload: valid })
                const added = valid.filter(r => !recipes.some(x => x.id === r.id)).length
                const skipped = valid.length - added

                let summary = `Imported ${added} recipe${added === 1 ? "" : "s"}.`
                if (skipped > 0) summary += ` Skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}.`
                showMessage("ok", summary)
                // (before is captured for clarity in code review — not used in the message.)
                void before
            } catch (err) {
                console.error(err)
                showMessage("err", "Couldn't parse that file as JSON.")
            }
        }
        reader.onerror = () => showMessage("err", "Couldn't read that file.")
        reader.readAsText(file)
    }

    return (
        <div className="library-actions">
            <button
                type="button"
                className="ghost-btn"
                onClick={handleExport}
                disabled={recipes.length === 0}
                title="Download your recipe library as JSON"
            >
                ⬇ Export
            </button>
            <button
                type="button"
                className="ghost-btn"
                onClick={handleImportClick}
                title="Add recipes from a previously exported JSON file"
            >
                ⬆ Import
            </button>
            <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                hidden
            />
            {message && (
                <span
                    role="status"
                    className={"library-action-msg " + (message.kind === "err" ? "is-err" : "is-ok")}
                >
                    {message.text}
                </span>
            )}
        </div>
    )
}
