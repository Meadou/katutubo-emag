import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { PROVINCES, groups } from '../content'
import { strings } from '../i18n/t'

// jsdom has no WebGL, so these render the static journey: the same page a reader without 3D gets.
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
const stop = (slug: string) => document.getElementById(`stop-${slug}`)!

describe('the cover', () => {
  it('names the magazine, its subject and the group that made it, and the way in', () => {
    at('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Katutubo' })).toBeInTheDocument()
    const cover = document.getElementById('intro')!
    expect(within(cover).getByText('Myths, Stories and Music of the Davao Region')).toBeInTheDocument()
    for (const m of strings.intro.members) expect(within(cover).getByText(m)).toBeInTheDocument()
    expect(within(cover).getByRole('list', { name: /instruments/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Begin the journey' })).toBeInTheDocument()
    // the one sound switch lives in the one control
    expect(within(screen.getByRole('banner')).getByRole('button', { name: /Sound/ })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('the journey', () => {
  it('has one control, the breadcrumb pill, first in the page: the keyboard and screen-reader route to every people', () => {
    at('/')
    const crumb = screen.getByRole('banner')
    expect(crumb.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const open = within(crumb).getByRole('button', { name: /Choose where to go/ })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(open)
    expect(open).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('navigation', { name: 'Journey' })
    const peoples = within(menu).getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/group/'))
    expect(peoples.map((a) => a.getAttribute('href'))).toEqual(groups.map((g) => `#/group/${g.slug}`))
    // and every part of the magazine
    for (const p of Object.values(strings.parts).filter((x) => x !== strings.parts.provinces)) expect(within(menu).getByRole('link', { name: p })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(open)
  })

  it('visits ten peoples, two in each province, around the Davao Gulf', () => {
    at('/')
    expect(groups).toHaveLength(10)
    expect([...new Set(groups.map((g) => g.province))]).toEqual([...PROVINCES])
    for (const p of PROVINCES) {
      const sec = document.getElementById(`province-${p.toLowerCase().replace(/ /g, '-')}`)!
      expect(within(sec).getByRole('heading', { name: p })).toBeInTheDocument()
    }
  })

  it('follows the rubric\'s order: introduction, the peoples, comparison, significance, conclusion, respect, references', () => {
    at('/')
    const order = ['introduction', `province-${PROVINCES[0].toLowerCase().replace(/ /g, '-')}`, 'compare-creation', 'compare-table', 'significance', 'conclusion', 'respect', 'references']
    const ids = [...document.querySelectorAll('[data-world]')].map((e) => e.id)
    const where = order.map((id) => ids.indexOf(id))
    expect(where.every((i) => i >= 0)).toBe(true)
    expect([...where].sort((a, b) => a - b)).toEqual(where)
    // the introduction carries the contents of the issue
    const contents = within(document.getElementById('introduction')!).getByRole('navigation', { name: strings.introduction.contents })
    for (const p of PROVINCES) expect(within(contents).getByRole('link', { name: p })).toBeInTheDocument()
  })

  it('says "Coming soon" at a people whose issue is being prepared, and invents nothing there', () => {
    at('/group/mandaya')
    const s = within(stop('mandaya'))
    expect(s.getByRole('heading', { name: 'Mandaya' })).toBeInTheDocument()
    expect(s.getByText('Coming soon')).toBeInTheDocument()
    expect(s.queryByRole('note')).toBeNull()
    expect(stop('mandaya').querySelector('.lede')).toBeNull()
  })

  it('says plainly where the published record has not been found yet, and invents nothing there', () => {
    at('/group/sangil')
    const s = within(stop('sangil'))
    expect(s.getByText('Information unavailable for now')).toBeInTheDocument()
    expect(s.queryByText('Coming soon')).toBeNull()
    expect(stop('sangil').querySelector('.lede')).toBeNull()
  })

  it('compares all ten side by side, and any two', () => {
    at('/')
    const table = within(document.getElementById('compare-table')!).getByRole('table')
    expect(within(table).getAllByRole('rowheader').map((r) => r.textContent)).toEqual(groups.map((g) => g.name))
    const pick = within(document.getElementById('compare-table')!)
    fireEvent.change(pick.getByLabelText(strings.compare.first), { target: { value: 'blaan' } })
    expect(document.querySelector('.pair')).toHaveTextContent("B'laan")
  })
})

describe('the index of peoples', () => {
  it('filters to a province and shows its two peoples', () => {
    at('/issues')
    fireEvent.click(screen.getByRole('button', { name: 'Davao Oriental' }))
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.querySelector('.row__name')?.textContent).sort()).toEqual(groups.filter((g) => g.province === 'Davao Oriental').map((g) => g.name).sort())
  })
})
