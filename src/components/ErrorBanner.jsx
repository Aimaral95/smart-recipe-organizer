// ErrorBanner
// Red-tinted dismissible alert. Used when the AI call fails so the user has
// a clear, recoverable signal — not a silent failure.
//
// Props:
//   message:  string to display
//   onDismiss: optional callback when user clicks ×

export default function ErrorBanner({ message, onDismiss }) {
    if (!message) return null
    return (
        <div className="error-banner" role="alert">
            <span className="icon" aria-hidden="true">⚠</span>
            <p>{message}</p>
            {onDismiss && (
                <button
                    type="button"
                    className="dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss error"
                >
                    ×
                </button>
            )}
        </div>
    )
}
