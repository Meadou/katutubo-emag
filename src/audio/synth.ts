/**
 * Every sound on the site is synthesized here, in the browser, and only ever starts from a tap.
 * These voices suggest instruments; they are not recordings and not traditional pieces, and every
 * demo that plays them says so.
 */
let ctx: AudioContext | null = null
let out: GainNode | null = null

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    out = ctx.createGain()
    out.gain.value = 0.7
    out.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return { c: ctx, out: out! }
}

/** Seconds from now on the audio clock (for scheduling patterns). */
export const now = () => audio().c.currentTime

function partials(hz: number, at: number, parts: readonly (readonly [number, number, number])[], level: number) {
  const { c, out: o } = audio()
  for (const [mult, gain, decay] of parts) {
    const osc = c.createOscillator(), g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(hz * mult, at)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gain * level, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    osc.connect(g).connect(o)
    osc.start(at)
    osc.stop(at + decay + 0.05)
  }
}

/** A flat gong (no raised boss): bright, clangy partials and a quicker fade. */
export function flatGong(hz: number, at = now(), level = 1) {
  partials(hz, at, [[1, 0.42, 1.1], [1.52, 0.22, 0.7], [2.31, 0.16, 0.45], [3.7, 0.08, 0.25], [5.1, 0.04, 0.16]], level)
}

/** A bossed gong: a clear fundamental from the raised knob, a hum below it, and a long decay. */
export function bossedGong(hz: number, at = now(), level = 1) {
  partials(hz, at, [[1, 0.5, 2.6], [2.76, 0.14, 1.1], [5.4, 0.05, 0.5], [0.5, 0.1, 1.8]], level)
}

/** A plucked string (Karplus–Strong): a burst of noise through a tuned, decaying loop. */
export function pluck(hz: number, at = now(), level = 1) {
  const { c, out: o } = audio()
  const n = Math.floor(c.sampleRate * 1.8)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  const period = Math.max(2, Math.round(c.sampleRate / hz))
  for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1
  for (let i = period; i < n; i++) d[i] = 0.996 * 0.5 * (d[i - period] + d[i - period + 1])
  const src = c.createBufferSource(), g = c.createGain()
  src.buffer = buf
  g.gain.value = 0.55 * level
  src.connect(g).connect(o)
  src.start(at)
}
