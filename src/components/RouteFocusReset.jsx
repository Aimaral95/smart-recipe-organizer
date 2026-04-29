// RouteFocusReset
// Single-page apps don't reload the document on navigation, so the browser
// never re-announces a "page change" to assistive tech. The result: a screen
// reader user clicks "Library" and hears nothing — focus stays on the link
// and the new page content is silent.
//
// This component fixes that by:
//   1. Listening for pathname changes via useLocation.
//   2. Programmatically focusing the page's <main id="main"> element.
//      Each page renders its own <main id="main" tabIndex={-1}> so this
//      always has a target.
//   3. Scrolling to top — feels right when navigating to a fresh page.
//
// tabIndex={-1} is the trick: it makes an element programmatically focusable
// without inserting it into the natural Tab order.

import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export default function RouteFocusReset() {
    const { pathname } = useLocation()

    useEffect(() => {
        const main = document.getElementById("main")
        if (main) {
            // Defer to the next frame so the new route has actually mounted.
            requestAnimationFrame(() => main.focus({ preventScroll: true }))
        }
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [pathname])

    return null
}
