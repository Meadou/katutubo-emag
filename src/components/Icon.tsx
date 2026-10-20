/** The magazine's few icons, drawn on one 16px grid with a 1.5px stroke. */
const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const ArrowRight = () => <svg {...base}><path d="M3 8h10M9 4l4 4-4 4" /></svg>
export const ArrowDown = () => <svg {...base}><path d="M8 3v10M4 9l4 4 4-4" /></svg>
export const Play = () => <svg {...base}><path d="M5 3.5v9l7.5-4.5z" fill="currentColor" /></svg>
export const Pause = () => <svg {...base}><path d="M5.5 3.5v9M10.5 3.5v9" /></svg>
