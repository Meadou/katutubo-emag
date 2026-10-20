import { Ruler } from './Panel'

/** Shown while the 3D bundle downloads. */
export default function Loader() {
  return (
    <div className="loader" role="status">
      <span className="loader__text">Drawing the islands</span>
      <Ruler />
    </div>
  )
}
