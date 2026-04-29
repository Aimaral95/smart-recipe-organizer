// TagEditor
// Free-form chip input. Renders the current tags as chips (with × to remove)
// and a small text input. Pressing Enter or clicking "+ Add" submits a new tag.
//
// Controlled component: the parent owns the `tags` array. We never store tags
// in our own state — only the in-progress draft string. Anytime tags change,
// we call onChange(nextTags) so the parent re-dispatches to context.
//
// Props:
//   tags:     string[]
//   onChange: (nextTags: string[]) => void

import { useState } from "react"

export default function TagEditor({ tags = [], onChange }) {
    const [draft, setDraft] = useState("")

    function commitDraft() {
        const cleaned = draft.trim().toLowerCase()
        if (!cleaned) return
        if (tags.includes(cleaned)) {
            setDraft("")
            return
        }
        onChange([...tags, cleaned])
        setDraft("")
    }

    function removeTag(tag) {
        onChange(tags.filter(t => t !== tag))
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault()
            commitDraft()
        }
    }

    return (
        <div className="tag-editor">
            <ul className="tag-chip-list" aria-label="Tags">
                {tags.map(tag => (
                    <li key={tag} className="tag-chip">
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove tag ${tag}`}
                            className="chip-remove"
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
            <div className="tag-input-row">
                <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag (italian, weeknight...)"
                    maxLength={24}
                    aria-label="New tag"
                />
                <button type="button" className="ghost-btn" onClick={commitDraft}>
                    + Add
                </button>
            </div>
        </div>
    )
}
