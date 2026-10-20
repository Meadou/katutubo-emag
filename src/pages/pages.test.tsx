import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { groups } from '../content'

// jsdom has no WebGL, so these render the static journey: the same page a reader without 3D gets.
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
const stop = (slug: string) => document.getElementById(`stop-${slug}`)!

describe('the journey', () => {
  it('opens with what Katutubo is and the way in, and nothing more', () => {
    at('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Katutubo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin the journey' })).toBeInTheDocument()
    expect(screen.queryByText(/turn on sound/)).toBeNull()
    // the one sound switch is in the nav
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('button', { name: /Sound/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('lists every people in the rail from the first screen: the keyboard and screen-reader route', () => {
    at('/')
    const rail = screen.getByRole('navigation', { name: 'Journey' })
    expect(within(rail).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(groups.map((g) => `#/group/${g.slug}`))
    // it comes right after the opening card in the page, so Tab reaches it before any chapter
    const firstRegion = document.getElementById('region-luzon')!
    expect(rail.compareDocumentPosition(firstRegion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Begin the journey' }).compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('visits nine peoples, three in each island group, north to south', () => {
    at('/')
    expect(groups.map((g) => g.slug)).toEqual(['kalinga', 'ifugao', 'bugkalot', 'suludnon', 'ati', 'magahat', 'maranao', 'tboli', 'samadilaut'])
    for (const r of ['Luzon', 'Visayas', 'Mindanao']) expect(groups.filter((g) => g.islandGroup === r)).toHaveLength(3)
    const rail = screen.getByRole('navigation', { name: 'Journey' })
    expect(within(rail).getAllByRole('link').map((a) => a.textContent)).toEqual(groups.map((g) => g.name))
  })

  it('says "Coming soon" at a people whose issue is being prepared, and invents nothing there', () => {
    at('/group/kalinga')
    const s = within(stop('kalinga'))
    expect(s.getByRole('heading', { name: 'Kalinga' })).toBeInTheDocument()
    expect(s.getByText('Coming soon')).toBeInTheDocument()
    expect(s.getByText('Skin, Sound & Peace')).toBeInTheDocument()
    expect(s.queryByRole('note')).toBeNull()
  })

  it('names a people by their own name first', () => {
    at('/group/bugkalot')
    const s = within(stop('bugkalot'))
    expect(s.getByRole('heading', { name: 'Bugkalot' })).toBeInTheDocument()
    expect(s.getByText('also known as Ilongot')).toBeInTheDocument()
  })

  it('plays a finished issue where its people are, with the draft note and the sources', () => {
    at('/group/ifugao')
    const s = within(stop('ifugao'))
    expect(s.getByRole('note')).toHaveTextContent(/Draft/)
    const music = document.getElementById('ch-ifugao-music')!
    expect(within(music).getByRole('heading', { name: 'Music' })).toBeInTheDocument()
    expect(within(music).getByText(/Not a recording/)).toBeInTheDocument()
    expect(within(document.getElementById('sources-ifugao')!).getByRole('heading', { name: 'Sources and further reading' })).toBeInTheDocument()
  })
})

describe('the issue index', () => {
  it('filters to the Visayas and shows its three peoples as coming soon', () => {
    at('/issues')
    fireEvent.click(screen.getByRole('button', { name: 'Visayas' }))
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.querySelector('.row__name')?.textContent)).toEqual(['Suludnon', 'Ati', 'Magahat'])
    for (const r of rows) expect(r).toHaveTextContent('Coming soon')
  })
})
