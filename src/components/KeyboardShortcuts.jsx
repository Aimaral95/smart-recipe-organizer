// KeyboardShortcuts
// Global keyboard navigation for the app. Registers a small set of
// single-key shortcuts and renders a help overlay (toggle: ?) that lists
// them.
//
// Why a component (instead of just calling the hook in App)?
//   - It needs its own useState for the overlay.
//   - Putting it next to the overlay markup keeps everything cohesive.
//
// Has to render inside <BrowserRouter> because it calls useNavigate.
// Doesn't render anything when closed except a hidden listener — so it's
// cheap to mount once at the top of the tree.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts"

const SHORTCUTS = [
    { keys: ["n"], label: "Generate a new recipe" },
    { keys: ["i"], label: "Import a recipe from a caption" },
    { keys: ["l"], label: "Open library" },
    { keys: ["/"], label: "Focus library search" },
    { keys: ["?"], label: "Show this help" },
    { keys: ["Esc"], label: "Close help" },
]

export default function KeyboardShortcuts() {
    const navigate = useNavigate()
    const [helpOpen, setHelpOpen] = useState(false)

    useKeyboardShortcuts({
        n: e => { e.preventDefault(); navigate("/") },
        i: e => { e.preventDefault(); navigate("/import") },
        l: e => { e.preventDefault(); navigate("/library") },
        // "/" focuses the library search. If we're not already there,
        // navigate first, then focus once the input has mounted.
        "/": e => {
            e.preventDefault()
            const focusSearch = () => {
                const el = document.querySelector('input[type="search"]')
                el?.focus()
            }
            if (window.location.pathname !== "/library") {
                navigate("/library")
                setTimeout(focusSearch, 50)
            } else {
                focusSearch()
            }
        },
        "?": e => { e.preventDefault(); setHelpOpen(true) },
        // Escape only acts when the help overlay is open, so input fields
        // keep their native Esc-to-clear behavior.
        Escape: () => setHelpOpen(open => (open ? false : open)),
    })

    if (!helpOpen) return null

    return (
        <div
            className="shortcut-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={() => setHelpOpen(false)}
        >
            <div
                className="shortcut-panel"
                onClick={e => e.stopPropagation()}
            >
                <div className="shortcut-panel-header">
                    <h3>Keyboard shortcuts</h3>
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setHelpOpen(false)}
                        aria-label="Close"
                    >
                        Close
                    </button>
                </div>
                <ul className="shortcut-list">
                    {SHORTCUTS.map(({ keys, label }) => (
                        <li key={label} className="shortcut-row">
                            <span className="shortcut-keys">
                                {keys.map(k => <kbd key={k}>{k}</kbd>)}
                            </span>
                            <span className="shortcut-label">{label}</span>
                        </li>
                    ))}
                </ul>
                <p className="shortcut-tip">
                    Tip: shortcuts are ignored while you're typing in an input.
                </p>
            </div>
        </div>
    )
}
