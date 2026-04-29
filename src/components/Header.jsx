// Header
// Site-wide top bar. Logo + app title on the left, nav links on the right.
// NavLink (vs plain Link) automatically gets an "active" class on the matching route,
// which we use in CSS to highlight the current page.

import { NavLink } from "react-router-dom"
import chefClaudeLogo from "../images/chef-claude-icon.png"

export default function Header() {
    return (
        <header>
            <NavLink to="/" className="brand">
                <img src={chefClaudeLogo} alt="" />
                <h1>Smart Recipe Organizer</h1>
            </NavLink>
            <nav className="main-nav" aria-label="Primary">
                <NavLink to="/" end>Generator</NavLink>
                <NavLink to="/import">Import</NavLink>
                <NavLink to="/library">Library</NavLink>
            </nav>
        </header>
    )
}
