/**
 * Every sound on the site is synthesized here, in the browser. These voices suggest instruments; they
 * are not recordings and not traditional pieces, and the page says so wherever one plays.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = false

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = enabled ? 0.8 : 0
    master.connect(ctx.destination)
  }
  return { ctx, out: master! }
}

/** Turns all sound on or off; the first "on" must come from a click so the browser allows audio. */
export function setSoundEnabled(on: boolean) {
  enabled = on
  const { ctx: c, out } = audio()
  if (on) void c.resume()
  out.gain.setTargetAtTime(on ? 0.8 : 0, c.currentTime, 0.05)
}
export const soundEnabled = () => enabled

/** A bossed gong: fundamental plus inharmonic partials, fast attack, long decay. */
export function gong(hz = 150, level = 1) {
  if (!enabled) return
  const { ctx: c, out } = audio()
  const t = c.currentTime + 0.005
  for (const [mult, gain, decay] of [[1, 0.5, 3.2], [2.76, 0.16, 1.4], [5.4, 0.06, 0.6], [0.5, 0.12, 2.2]] as const) {
    const o = c.createOscillator(), g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(hz * mult, t)
    o.frequency.exponentialRampToValueAtTime(hz * mult * 0.992, t + decay)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain * level, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + decay + 0.05)
  }
}

/** A plucked string (Karplus–Strong): a burst of noise through a tuned, decaying delay loop. */
export function pluck(hz = 220, level = 1) {
  if (!enabled) return
  const { ctx: c, out } = audio()
  const len = 1.6, n = Math.floor(c.sampleRate * len)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  const period = Math.max(2, Math.round(c.sampleRate / hz))
  for (let i = 0; i < period; i++) d[i] = Math.random() * 2 - 1
  for (let i = period; i < n; i++) d[i] = 0.996 * 0.5 * (d[i - period] + d[i - period + 1])
  const src = c.createBufferSource(), g = c.createGain()
  src.buffer = buf
  g.gain.value = 0.5 * level
  src.connect(g).connect(out)
  src.start()
}

/** A jaw harp's twang: a buzzing drone whose overtones sweep, as if shaped by the mouth. */
export function twang(hz = 110, level = 1) {
  if (!enabled) return
  const { ctx: c, out } = audio()
  const t = c.currentTime + 0.005
  const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(hz, t)
  f.type = 'bandpass'
  f.Q.value = 9
  f.frequency.setValueAtTime(500, t)
  f.frequency.exponentialRampToValueAtTime(1600, t + 0.25)
  f.frequency.exponentialRampToValueAtTime(700, t + 0.6)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.35 * level, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
  o.connect(f).connect(g).connect(out)
  o.start(t)
  o.stop(t + 1)
}
