import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'
import './styles/journey.css'
import './styles/demos.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter: deep links like #/group/ifugao survive a refresh on GitHub Pages */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
