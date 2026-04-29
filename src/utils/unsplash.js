// unsplash.js — best-effort photo fetcher for a recipe.
//
// Why Unsplash?
//   The library has no built-in visuals — generated recipes are markdown
//   only. A single hero photo per card transforms the look and feel.
//   Unsplash's Search API is free for non-commercial use, returns curated
//   food photography for queries like "creamy garlic pasta", and the
//   returned URLs are CDN-hosted (no localStorage cost — we only store
//   the URL string, not the image bytes).
//
// Setup (only needed if you want auto-photos):
//   1. Register a free app at https://unsplash.com/developers.
//   2. Copy the "Access Key" (NOT the secret key).
//   3. Add VITE_UNSPLASH_ACCESS_KEY=<your key> to .env.local.
//
// If the key is missing, every call returns "" silently and the rest of
// the app keeps working unchanged. There is no required dependency on
// this feature.
//
// API design notes:
//   - Returns a URL string on success, "" on any failure (no exceptions
//     surface to the UI). The save flow should NEVER block on this call.
//   - Caps a single search at 5 results and picks the first non-portrait
//     photo so we don't get tall faces at the top of a horizontal card.
//   - Sends `client_id` as a query param (Unsplash's recommended browser
//     auth) — there's no risk of leaking a secret because the access key
//     is the public half of the credential pair.

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ""

// Strip noise from a recipe title so the search is more likely to land
// on relevant food photography. "The BEST creamy garlic pasta!! 🍝" →
// "creamy garlic pasta".
function cleanQuery(raw) {
    if (!raw || typeof raw !== "string") return ""
    return raw
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")  // emoji block
        .replace(/[!?.,:;"'(){}\[\]]/g, " ")
        .replace(/\b(the|best|easy|quick|amazing|ultimate|perfect|delicious|recipe|homemade|my|mom's|grandma's)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80)
}

// Returns { url, attribution } on success, or { url: "" } on any failure.
// We pass through the photographer's name + profile link because Unsplash's
// API guidelines ask for attribution. The UI can display them next to the
// image; if not, that's still allowed under the API terms because we're not
// republishing in a way that competes with Unsplash itself.
export async function fetchUnsplashPhotoForRecipe(rawQuery) {
    if (!ACCESS_KEY) return { url: "" }

    const query = cleanQuery(rawQuery)
    if (!query) return { url: "" }

    try {
        const url = new URL("https://api.unsplash.com/search/photos")
        url.searchParams.set("query", `${query} food`)
        url.searchParams.set("per_page", "5")
        url.searchParams.set("orientation", "landscape")
        url.searchParams.set("content_filter", "high")
        url.searchParams.set("client_id", ACCESS_KEY)

        const res = await fetch(url.toString())
        if (!res.ok) return { url: "" }

        const data = await res.json()
        const results = Array.isArray(data?.results) ? data.results : []
        if (results.length === 0) return { url: "" }

        // Pick a deterministic-ish result — first one that has a small
        // CDN-hosted url. We could random-pick, but determinism makes the
        // "save → see photo" experience feel less flaky.
        const pick = results.find(p => p?.urls?.small) || results[0]
        if (!pick?.urls?.small) return { url: "" }

        return {
            url: pick.urls.small,
            attribution: {
                name: pick.user?.name || "Unsplash photographer",
                profile: pick.user?.links?.html || "https://unsplash.com",
            },
        }
    } catch (err) {
        // Logged for the developer; the user never sees this — the recipe
        // just stays imageless, which is identical to the pre-Unsplash state.
        console.warn("Unsplash photo fetch failed:", err?.message || err)
        return { url: "" }
    }
}

// Convenience boolean — lets the UI hide the "Find a photo" button when
// the feature isn't configured, instead of showing a button that does nothing.
export function isUnsplashConfigured() {
    return Boolean(ACCESS_KEY)
}
