import { setSoundEnabled } from '../audio/synth'
import { useMag } from '../store'

/** Sound off by default; one click turns on every instrument. The sounds are synthesized, and say so. */
export default function SoundToggle() {
  const sound = useMag((s) => s.sound)
  const setSound = useMag((s) => s.setSound)
  return (
    <button type="button" className={`sound ${sound ? 'is-on' : ''}`} aria-pressed={sound}
      onClick={() => { setSoundEnabled(!sound); setSound(!sound) }}>
      <span className="sound__ring" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {sound
            ? <path d="M3 6v4h2.5L9 13V3L5.5 6zM11.5 5.5a3.5 3.5 0 0 1 0 5" />
            : <path d="M3 6v4h2.5L9 13V3L5.5 6zM11.5 6.5l3 3M14.5 6.5l-3 3" />}
        </svg>
      </span>
      <span>{sound ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
