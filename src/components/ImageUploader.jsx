// ImageUploader
// Lets the user attach a photo to a recipe. The image is read in-browser as
// a base64 "data URL" so it can live inside the recipe object in localStorage —
// no backend, no upload server.
//
// Why base64 in localStorage?
//   Pro: zero infrastructure, works offline, no extra dependencies.
//   Con: localStorage caps around 5MB total per origin. We enforce a 1MB
//        per-image cap below to keep room for the rest of the library.
//
// FileReader is the browser API that turns a File into a string. The flow:
//   user picks file → reader.readAsDataURL(file) → reader.onload fires with
//   a string like "data:image/jpeg;base64,/9j/..." → we hand that to onChange.
//
// Props:
//   value:    string  current data URL (or "" if no image)
//   onChange: (next: string) => void

import { useRef, useState } from "react"

const MAX_BYTES = 1024 * 1024  // 1MB

export default function ImageUploader({ value = "", onChange }) {
    const inputRef = useRef(null)
    const [error, setError] = useState("")

    function handleFile(e) {
        setError("")
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("Please pick an image file (PNG, JPG, etc.)")
            return
        }
        if (file.size > MAX_BYTES) {
            setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 1 MB.`)
            return
        }

        const reader = new FileReader()
        reader.onload = () => onChange(String(reader.result))
        reader.onerror = () => setError("Couldn't read that file. Try another one.")
        reader.readAsDataURL(file)
    }

    function clear() {
        onChange("")
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="image-uploader">
            {value ? (
                <div className="image-preview">
                    <img src={value} alt="Recipe" />
                    <button type="button" className="ghost-btn" onClick={clear}>
                        Remove image
                    </button>
                </div>
            ) : (
                <label className="image-drop">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                    />
                    <span className="image-drop-icon" aria-hidden="true">📷</span>
                    <span>Click to add a photo (max 1 MB)</span>
                </label>
            )}
            {error && <p className="image-error">{error}</p>}
        </div>
    )
}
