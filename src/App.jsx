// App
// Top-level component. Three responsibilities:
//   1. Wrap the whole tree in BrowserRouter so any descendant can use routes / links.
//   2. Wrap in RecipesProvider so any page can read/dispatch the saved-recipe library.
//   3. Render the Header (always visible) + the matching Route's page.
//
// BrowserRouter uses real URLs (e.g. /library) — works on Vercel because we'll
// configure SPA-fallback so refreshing /library serves index.html.

import { BrowserRouter, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import ErrorBoundary from "./components/ErrorBoundary"
import RouteFocusReset from "./components/RouteFocusReset"
import GeneratorPage from "./pages/GeneratorPage"
import LibraryPage from "./pages/LibraryPage"
import RecipeDetailPage from "./pages/RecipeDetailPage"
import ImportPage from "./pages/ImportPage"
import { RecipesProvider } from "./context/RecipesContext"

export default function App() {
    return (
        <BrowserRouter>
            <RecipesProvider>
                {/* Skip-link: invisible until focused via Tab. Lets keyboard
                    users jump past the header straight to the page content. */}
                <a href="#main" className="skip-link">Skip to main content</a>

                <Header />
                <KeyboardShortcuts />
                <RouteFocusReset />

                {/* Wrap the routes (not the header) in the boundary so the
                    nav stays usable even when a page crashes. */}
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<GeneratorPage />} />
                        <Route path="/import" element={<ImportPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </RecipesProvider>
        </BrowserRouter>
    )
}

function NotFound() {
    return (
        <main id="main" tabIndex={-1}>
            <section className="hero">
                <h2>Page not found</h2>
                <p>That URL doesn't match any page in this app.</p>
            </section>
            <div className="empty-state">
                <a href="/" className="primary-btn">Back to generator</a>
            </div>
        </main>
    )
}
