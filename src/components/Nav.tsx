import { NavLink, Link } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="nav__brand" aria-label="Katutubo, home">katutubo</Link>
      <nav aria-label="Main">
        <NavLink to="/" end>Cover</NavLink>
        <NavLink to="/issues">Issues</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
    </header>
  )
}
