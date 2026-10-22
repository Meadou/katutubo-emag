/**
 * The cover's imagery: the kinds of instrument the magazine compares, drawn as plain line drawings
 * and named. Each is a general shape (no community's carving, design or ornament), and nothing moves.
 */
const ITEMS = [
  {
    key: 'lute', name: 'Boat lute',
    draw: <>
      <path d="M4 22 C 4 15, 14 13, 30 15 L 80 19 C 88 19.5, 110 19.5, 116 21 C 118 21.5, 118 23.5, 116 24 C 110 25.5, 88 25.5, 80 26 L 30 30 C 14 32, 4 29, 4 22 Z" />
      <path d="M10 21 L 114 22.2 M10 24 L 114 23.2" className="thin" />
      <path d="M84 18 v3 M92 18.4 v3 M100 18.8 v3" />
    </>,
  },
  {
    key: 'gong', name: 'Bossed gong',
    draw: <>
      <path d="M44 4 L 44 9 M76 4 L 76 9 M40 4 H 80" />
      <circle cx="60" cy="24" r="15" />
      <circle cx="60" cy="24" r="9" className="thin" />
      <circle cx="60" cy="24" r="4" />
    </>,
  },
  {
    key: 'zither', name: 'Bamboo zither',
    draw: <>
      <rect x="18" y="14" width="84" height="18" rx="9" />
      <path d="M30 14 v18 M90 14 v18" className="thin" />
      <path d="M30 18 H 90 M30 22 H 90 M30 26 H 90" className="thin" />
    </>,
  },
  {
    key: 'harp', name: 'Jaw harp',
    draw: <>
      <rect x="20" y="17" width="80" height="12" rx="2" />
      <path d="M36 23 H 86 L 88 21 M36 21 V 25" className="thin" />
    </>,
  },
]

export default function Instruments() {
  return (
    <ul className="instruments" aria-label="The instruments compared in this issue">
      {ITEMS.map((i) => (
        <li key={i.key}>
          <svg viewBox="0 0 120 44" aria-hidden="true">{i.draw}</svg>
          <span>{i.name}</span>
        </li>
      ))}
    </ul>
  )
}
