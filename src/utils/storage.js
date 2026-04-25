// storage.js
// Thin wrapper around localStorage that handles JSON encoding and quietly
// returns a fallback when the key is missing or the stored value is corrupt.
// Used by RecipesContext to persist the recipe library.
//
// Why a wrapper? localStorage.getItem() returns string | null and throws
// during JSON.parse if the value is malformed. Centralizing that try/catch
// here keeps consumer code clean.

export function loadJSON(key, fallback) {
    try {
        const stored = localStorage.getItem(key)
        if (stored === null) return fallback
        const parsed = JSON.parse(stored)
        return parsed
    } catch (err) {
        console.error(`loadJSON: failed to parse "${key}" from localStorage`, err)
        return fallback
    }
}

export function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
        // QuotaExceededError, private browsing modes, etc. Log and continue.
        console.error(`saveJSON: failed to persist "${key}"`, err)
    }
}
