/** "Scroll to begin": a word and a paper strip that slides down, once a few seconds have passed. */
export default function ScrollCue({ label }: { label: string }) {
  return (
    <p className="cue">
      <span>{label}</span>
      <span className="cue__strip" aria-hidden="true"><i /></span>
    </p>
  )
}
