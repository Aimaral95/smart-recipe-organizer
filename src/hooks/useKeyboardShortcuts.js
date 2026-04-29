// useKeyboardShortcuts
// Register a map of single-key shortcuts at the window level. Each key
// maps to a handler function. The hook automatically ignores key events
// while the user is typing in an input, textarea, or contenteditable
// element — except for Escape, which is allowed everywhere so users can
// always blur out of a field.
//
// Example:
//   useKeyboardShortcuts({
//     "n": () => navigate("/"),
//     "l": () => navigate("/library"),
//     "/": () => searchRef.current?.focus(),
//     "?": () => setHelpOpen(true),
//     "Escape": () => setHelpOpen(false),
//   })
//
// Note: handlers are looked up on every keydown via a ref so the caller
// doesn't have to memoize them — the effect only resubscribes when the
// component unmounts.

import { useEffect, useRef } from "react"

const ALWAYS_ALLOWED = new Set(["Escape"])

function isTypingTarget(el) {
    if (!el) return false
    const tag = el.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
    if (el.isContentEditable) return true
    return false
}

export default function useKeyboardShortcuts(shortcuts) {
    // Keep the latest handlers in a ref so the effect can be a one-shot.
    const ref = useRef(shortcuts)
    ref.current = shortcuts

    useEffect(() => {
        function onKeyDown(e) {
            // Don't hijack browser/OS modifier shortcuts (Cmd-S, Ctrl-R, etc.).
            if (e.metaKey || e.ctrlKey || e.altKey) return

            const key = e.key
            if (!ALWAYS_ALLOWED.has(key) && isTypingTarget(e.target)) return

            const handler = ref.current?.[key]
            if (typeof handler === "function") {
                // Handlers decide whether to preventDefault — Escape, for
                // example, should still clear a focused search input.
                handler(e)
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])
}
