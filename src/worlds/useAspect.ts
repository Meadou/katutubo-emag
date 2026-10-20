import { useEffect, useState } from 'react'

/** The viewport's aspect ratio, rounded so worlds are rebuilt only when the shape really changes. */
export function useAspect(): number {
  const read = () => (typeof window === 'undefined' ? 1.6 : Math.round((window.innerWidth / Math.max(1, window.innerHeight)) * 10) / 10)
  const [a, setA] = useState(read)
  useEffect(() => {
    const on = () => setA(read())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return a
}
