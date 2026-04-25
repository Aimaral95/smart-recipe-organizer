// parseRecipe
// Pure utility — no React, no DOM. Takes markdown from the AI and pulls
// structured fields out of it so we can store/display/filter them properly.
//
// Why parse at all? On Day 3 we'll save recipes to localStorage. If we only
// store the raw markdown blob, we can't search by title, filter by cook time,
// or show a clean RecipeCard preview. This util is what lets the rest of the
// app treat a recipe as data, not just text.
//
// Forgiving by design: if the markdown doesn't follow the expected shape,
// each extractor returns a sensible default and we still hand back the raw
// markdown. The UI never gets stuck because parsing failed.
//
// Usage:
//     const { title, ingredients, instructions, cookTimeMinutes, raw } = parseRecipe(markdown)

export function parseRecipe(markdown) {
    if (!markdown || typeof markdown !== "string") {
        return emptyResult("")
    }

    return {
        title: extractTitle(markdown),
        ingredients: extractListUnder(markdown, /ingredients/i),
        instructions: extractListUnder(markdown, /instructions|directions|steps|method/i),
        cookTimeMinutes: extractCookTimeMinutes(markdown),
        raw: markdown,
    }
}

function emptyResult(raw) {
    return {
        title: null,
        ingredients: [],
        instructions: [],
        cookTimeMinutes: null,
        raw,
    }
}

// --- title ---------------------------------------------------------------
// Grabs the first markdown heading (#, ##, ### are all fair game).
// Strips bold ** markers and trims whitespace.
function extractTitle(markdown) {
    const match = markdown.match(/^\s*#{1,3}\s+(.+?)\s*$/m)
    if (!match) return null
    return match[1].replace(/\*\*/g, "").trim()
}

// --- list under a heading ------------------------------------------------
// Finds a heading that matches `headingPattern`, then collects the next
// run of bullet (-, *) or numbered (1.) list items beneath it.
// Stops at the next heading or a blank gap of >1 line.
function extractListUnder(markdown, headingPattern) {
    const lines = markdown.split("\n")
    let inSection = false
    const out = []
    const headingRe = /^\s*(?:#{1,3}\s+|\*\*[^*]+\*\*\s*:?\s*$)/

    for (const line of lines) {
        const trimmed = line.trim()

        if (!inSection) {
            // Match a markdown heading (# Foo) OR a bold pseudo-heading (**Foo:**)
            const isHeading =
                /^#{1,3}\s+/.test(trimmed) ||
                /^\*\*[^*]+\*\*\s*:?\s*$/.test(trimmed)
            if (isHeading && headingPattern.test(trimmed)) {
                inSection = true
            }
            continue
        }

        // Inside the section: stop on the next heading.
        if (trimmed && headingRe.test(trimmed)) break

        // Collect list items.
        const item = trimmed.match(/^(?:[-*]\s+|\d+\.\s+)(.+)$/)
        if (item) out.push(item[1].trim())
    }

    return out
}

// --- cook time -----------------------------------------------------------
// Two-pass strategy:
//   Pass 1: look only at lines that mention "time" / "cook" / "estimated" /
//           "total" / "prep" — these are intentional cook-time declarations.
//   Pass 2: if no labeled line exists, scan whole markdown (last resort).
//
// Without pass 1, an instruction like "cook 2 minutes" beats the real
// "Estimated cook time: 30 minutes" footer because it appears first.
function extractCookTimeMinutes(markdown) {
    const labelRe = /(?:cook[- ]?time|total[- ]?time|prep[- ]?time|estimated|ready in|takes about|takes\b)/i
    const lines = markdown.split("\n")

    // Pass 1: only check labeled lines.
    for (const line of lines) {
        if (labelRe.test(line)) {
            const minutes = parseDurationFromString(line)
            if (minutes !== null) return minutes
        }
    }

    // Pass 2: fall back to whole-document scan.
    return parseDurationFromString(markdown)
}

// Tries hardest match first: "1 hour 30 minutes" -> 90.
// Then plain minutes: "30 min" -> 30.
// Then plain hours: "1.5 hours" -> 90.
// Returns null if nothing recognizable found.
function parseDurationFromString(s) {
    const hoursAndMinutes = s.match(
        /(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s+)?(\d+)\s*(?:minutes?|mins?|m)\b/i
    )
    if (hoursAndMinutes) {
        return parseInt(hoursAndMinutes[1], 10) * 60 + parseInt(hoursAndMinutes[2], 10)
    }

    const minutesOnly = s.match(/(\d+)\s*(?:minutes?|mins?)\b/i)
    if (minutesOnly) {
        return parseInt(minutesOnly[1], 10)
    }

    const hoursOnly = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i)
    if (hoursOnly) {
        return Math.round(parseFloat(hoursOnly[1]) * 60)
    }

    return null
}
