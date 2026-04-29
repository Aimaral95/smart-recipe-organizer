// useDebounce
// Returns a "lagging" copy of a value that only updates after the value has
// been stable for `delay` milliseconds. Classic use case: an input where you
// want the displayed text to update instantly but only run a heavy effect
// (filter, fetch, etc.) after the user stops typing.
//
// Why a custom hook?
//   - It's a clean abstraction over a setTimeout/clearTimeout pair.
//   - Calling code stays tiny:
//        const q = useDebounce(filters.q, 200)
//   - The same hook works for any type — string, number, object — because
//     it just stores whatever you hand it.
//
// Implementation notes:
//   - useEffect re-runs whenever `value` (or `delay`) changes. We schedule
//     a setTimeout to commit the new value to state, and the cleanup
//     function cancels that timeout if value changes again first.
//   - Because the cleanup runs before the next effect, rapid typing keeps
//     pushing the commit further out — exactly what "debounce" means.

import { useEffect, useState } from "react"

export default function useDebounce(value, delay = 200) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(handle)
    }, [value, delay])

    return debounced
}
