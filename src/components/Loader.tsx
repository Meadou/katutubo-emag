/** Shown while the 3D bundle downloads. */
export default function Loader() {
  return (
    <div className="loader" role="status">
      <span className="loader__ring" aria-hidden="true" />
      <span className="loader__text">Weaving the islands…</span>
    </div>
  )
}
