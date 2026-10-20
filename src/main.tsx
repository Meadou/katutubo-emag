import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter: deep links like #/group/ifugao survive a refresh on GitHub Pages */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
