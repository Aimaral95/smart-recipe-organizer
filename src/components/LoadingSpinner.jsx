// LoadingSpinner
// Tiny presentational component. Pure CSS animation defined in index.css.
// Accepts an optional `label` prop to render text next to the spinner.

export default function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    )
}
