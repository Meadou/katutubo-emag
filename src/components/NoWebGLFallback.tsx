/** Plain ground for browsers without WebGL. The magazine text, lists and links still work fully. */
export default function NoWebGLFallback() {
  return <div className="stage stage--fallback" aria-hidden="true" />
}
