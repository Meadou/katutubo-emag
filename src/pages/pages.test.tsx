import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { groups } from '../content'

// jsdom has no WebGL, so these render the static journey: the same pages a reader without 3D gets.
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('placeholder issues', () => {
  it('say "Coming soon", have no chapters, and point to a finished issue', () => {
    at('/group/ati')
    expect(screen.getByRole('heading', { level: 1, name: 'Ati' })).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
    expect(screen.queryByRole('navigation', { name: 'Chapters' })).toBeNull()
    expect(screen.getByRole('link', { name: /Read a finished issue/ })).toHaveAttribute('href', '/group/tboli')
  })
})

describe('finished issues', () => {
  it('have the chapter rail and fly on to the next finished issue', () => {
    at('/group/tboli')
    const rail = screen.getByRole('navigation', { name: 'Chapters' })
    expect(within(rail).getAllByRole('link').length).toBe(5)
    expect(screen.getByRole('link', { name: "Fly on to the Ifugao" })).toHaveAttribute('href', '/group/ifugao')
  })

  it('skip placeholders on the way to the next issue', () => {
    at('/group/mangyan')
    expect(screen.getByRole('link', { name: "Fly on to the T'boli" })).toHaveAttribute('href', '/group/tboli')
  })

  it('keep the draft note and the sources', () => {
    at('/group/ifugao')
    expect(screen.getByRole('note')).toHaveTextContent(/Draft/)
    expect(screen.getByRole('heading', { name: 'Sources and further reading' })).toBeInTheDocument()
  })
})

describe('the issue index', () => {
  it('filters to the Visayas and shows Ati as coming soon', () => {
    at('/issues')
    fireEvent.click(screen.getByRole('button', { name: 'Visayas' }))
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Ati')
    expect(rows[0]).toHaveTextContent('Coming soon')
  })
})

describe('the cover', () => {
  it('lists every people as a link: the keyboard and screen-reader route into the issues', () => {
    at('/')
    const list = screen.getByRole('list', { name: 'Peoples in Katutubo' })
    const links = within(list).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(groups.map((g) => `/group/${g.slug}`))
  })
})
