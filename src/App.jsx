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
import GeneratorPage from "./pages/GeneratorPage"
import LibraryPage from "./pages/LibraryPage"
import RecipeDetailPage from "./pages/RecipeDetailPage"
import { RecipesProvider } from "./context/RecipesContext"

export default function App() {
    return (
        <BrowserRouter>
            <RecipesProvider>
                <Header />
                <Routes>
                    <Route path="/" element={<GeneratorPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </RecipesProvider>
        </BrowserRouter>
    )
}

function NotFound() {
    return (
        <main>
            <h2>Page not found</h2>
            <p>That URL doesn't match any page.</p>
        </main>
    )
}
