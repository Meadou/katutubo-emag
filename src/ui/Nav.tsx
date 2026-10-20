import { Link, NavLink } from 'react-router-dom'
import { useUi } from './store'
import { strings } from '../i18n/t'

/** A paper tab at the top: the wordmark, three ways in, and the sound switch. */
export default function Nav() {
  const s = strings
  const sound = useUi((u) => u.sound)
  const setSound = useUi((u) => u.setSound)
  return (
    <header className="nav">
      <Link to="/" className="nav__mark" aria-label={`${s.site.name}, ${s.nav.cover}`}>{s.site.name}</Link>
      <nav aria-label={s.nav.label} className="nav__links">
        <NavLink to="/" end>{s.nav.cover}</NavLink>
        <NavLink to="/issues">{s.nav.issues}</NavLink>
        <NavLink to="/about">{s.nav.about}</NavLink>
        <button type="button" className={`nav__sound ${sound ? 'is-on' : ''}`} aria-pressed={sound} onClick={() => setSound(!sound)}>
          <span className="sound-dot" aria-hidden="true" />{s.nav.sound}<span className="nav__sound-state"> {sound ? s.nav.on : s.nav.off}</span>
        </button>
      </nav>
    </header>
  )
}
