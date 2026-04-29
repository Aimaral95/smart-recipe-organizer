// CookTimeEditor
// Tiny number input for cook time in minutes. Empty string = "not set" (null).
// Parent owns the value. We expose onChange(numberOrNull).

export default function CookTimeEditor({ value, onChange }) {
    function handleChange(e) {
        const v = e.target.value
        if (v === "") {
            onChange(null)
            return
        }
        const n = parseInt(v, 10)
        if (Number.isNaN(n) || n < 0) return
        onChange(n)
    }

    return (
        <div className="cook-time-editor">
            <input
                type="number"
                min="0"
                max="999"
                step="5"
                value={value ?? ""}
                onChange={handleChange}
                placeholder="—"
                aria-label="Cook time in minutes"
            />
            <span className="suffix">minutes</span>
        </div>
    )
}
