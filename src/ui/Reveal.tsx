import { useEffect, useRef } from 'react'
import { journey } from '../worlds/engine'

/**
 * Article HTML whose blocks (paragraphs, quotes, lists) arrive one strip at a time as they reach the
 * reading area, staggered like paper sliding into place. In calm mode everything is simply there.
 */
export default function Reveal({ html, className = 'prose' }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const blocks = [...host.children] as HTMLElement[]
    blocks.forEach((b, i) => { b.classList.add('strip'); b.style.setProperty('--i', String(i % 4)) })
    if (journey.calm || typeof IntersectionObserver === 'undefined') {
      blocks.forEach((b) => b.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }),
      { rootMargin: '0px 0px -12% 0px' },
    )
    blocks.forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [html])
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
