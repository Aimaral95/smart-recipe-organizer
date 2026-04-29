// DietarySelector
// Multi-select toggle group for dietary categories. Clicking a chip flips its
// included/excluded state in the value array.
//
// The fixed list of options (DIETARY_OPTIONS) is exported so the FilterBar
// on the library page can show the same set of choices.
//
// Controlled component: parent owns `value`, we just call onChange.
//
// Props:
//   value:     string[]  currently selected diets
//   onChange:  (next: string[]) => void

export const DIETARY_OPTIONS = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "low-carb",
    "paleo",
]

export default function DietarySelector({ value = [], onChange }) {
    function toggle(option) {
        const isOn = value.includes(option)
        const next = isOn
            ? value.filter(d => d !== option)
            : [...value, option]
        onChange(next)
    }

    return (
        <div className="dietary-selector" role="group" aria-label="Dietary tags">
            {DIETARY_OPTIONS.map(option => {
                const selected = value.includes(option)
                return (
                    <button
                        type="button"
                        key={option}
                        className={"diet-chip" + (selected ? " selected" : "")}
                        aria-pressed={selected}
                        onClick={() => toggle(option)}
                    >
                        {option}
                    </button>
                )
            })}
        </div>
    )
}
