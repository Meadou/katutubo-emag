/** Static woven backdrop for browsers without WebGL. The magazine text still works fully. */
export default function NoWebGLFallback() {
  return <div className="stage stage--fallback" aria-hidden="true" />
}
