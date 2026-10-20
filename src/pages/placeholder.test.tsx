import { describe, expect, it, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Article from './Article'
import IssueIndex from './IssueIndex'
import Home from './Home'
import { useMag } from '../store'

const at = (path: string, el: ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/group/:slug" element={el} /><Route path="*" element={el} /></Routes></MemoryRouter>)

beforeEach(() => useMag.setState({ hovered: null, chapter: 0, flyTo: null }))

describe('placeholder UI', () => {
  it('renders a placeholder as a coming-soon page', () => {
    at('/group/ati', <Article />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ati' })).toBeInTheDocument()
    expect(screen.getByText(/This issue is still being prepared/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Chapters' })).toBeNull()
    expect(screen.getByText('Read a finished issue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /T'boli/ })).toHaveAttribute('href', '/group/tboli')
  })
  it('a finished issue links to the next finished issue, wrapping', () => {
    at('/group/tboli', <Article />)
    expect(screen.getByRole('navigation', { name: 'Chapters' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ifugao/ })).toHaveAttribute('href', '/group/ifugao')
  })
  it('next issue skips placeholders between finished issues', () => {
    at('/group/mangyan', <Article />)
    expect(screen.getByRole('link', { name: /T'boli/ })).toHaveAttribute('href', '/group/tboli')
  })
  it('index marks placeholders as Coming soon under their island group', async () => {
    at('/issues', <IssueIndex />)
    await userEvent.click(screen.getByRole('button', { name: 'Visayas' }))
    const card = screen.getByRole('link', { name: /Ati/ })
    expect(within(card).getByText('Coming soon')).toBeInTheDocument()
    expect(card).toHaveAttribute('href', '/group/ati')
  })
  it('cover hint for a placeholder says Coming soon', () => {
    useMag.setState({ hovered: 'ati' })
    at('/', <Home />)
    expect(screen.getByText('Ati: Coming soon')).toBeInTheDocument()
  })
})
