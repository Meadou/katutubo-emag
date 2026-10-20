import { Link, NavLink } from 'react-router-dom'
import { strings } from '../i18n/t'

/** A paper tab at the top: the wordmark and three ways in. */
export default function Nav() {
  const s = strings
  return (
    <header className="nav">
      <Link to="/" className="nav__mark" aria-label={`${s.site.name}, ${s.nav.cover}`}>{s.site.name}</Link>
      <nav aria-label={s.nav.label} className="nav__links">
        <NavLink to="/" end>{s.nav.cover}</NavLink>
        <NavLink to="/issues">{s.nav.issues}</NavLink>
        <NavLink to="/about">{s.nav.about}</NavLink>
      </nav>
    </header>
  )
}
