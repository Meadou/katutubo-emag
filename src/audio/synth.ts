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

const plucks = new Map<string, AudioBuffer>()

/**
 * A plucked string, computed once per pitch (Karplus-Strong: a burst of noise circling a delay line
 * the length of one vibration, softened on each pass, the way a string loses its brightness).
 */
function pluckBuffer(c: AudioContext, hz: number, seconds: number, soft: number) {
  const key = `${hz}:${seconds}:${soft}`
  const cached = plucks.get(key)
  if (cached) return cached
  const n = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  const period = Math.max(2, Math.round(c.sampleRate / hz))
  const line = new Float32Array(period)
  for (let i = 0; i < period; i++) line[i] = Math.random() * 2 - 1
  let k = 0
  for (let i = 0; i < n; i++) {
    const next = (k + 1) % period
    const v = line[k]
    // average with the neighbour (the string's loss), slightly more for a softer, wooden tone
    line[k] = (v * (1 - soft) + line[next] * soft) * 0.996
    d[i] = v * 0.5
    k = next
  }
  plucks.set(key, buf)
  return buf
}

/**
 * A two-string boat lute, suggested: a bright plucked melody string over a soft, unfretted drone.
 * An approximation of the sound, not a recording; the demo that plays it says so.
 */
export function lutePluck(hz: number, droneHz: number | null, at = now(), level = 1) {
  const { c, out: o } = audio()
  const play = (f: number, gain: number, soft: number) => {
    const src = c.createBufferSource(), g = c.createGain(), body = c.createBiquadFilter()
    src.buffer = pluckBuffer(c, f, 2.2, soft)
    // the hollowed wooden body: a broad resonance in the low middle
    body.type = 'peaking'
    body.frequency.value = 420
    body.Q.value = 0.8
    body.gain.value = 5
    g.gain.value = gain * level
    src.connect(body).connect(g).connect(o)
    src.start(at)
  }
  play(hz, 0.9, 0.5)
  if (droneHz) play(droneHz, 0.35, 0.62)
}

/**
 * The journey's ambience: wind over the highlands and water by the lakes and the sea, both filtered
 * noise with a slow swell. It is not a field recording of any place, and no music plays in it.
 */
let bed: { wind: GainNode; water: GainNode } | null = null

function noiseSource(c: AudioContext) {
  const n = c.sampleRate * 4
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  // brown-ish noise: soft, without hiss
  let last = 0
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5 }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

function voice(c: AudioContext, o: GainNode, filter: BiquadFilterType, hz: number, q: number, swellHz: number) {
  const src = noiseSource(c), f = c.createBiquadFilter(), g = c.createGain(), swell = c.createOscillator(), depth = c.createGain()
  f.type = filter
  f.frequency.value = hz
  f.Q.value = q
  g.gain.value = 0
  // a slow swell, like gusts or waves arriving
  const level = c.createGain()
  level.gain.value = 0.5
  swell.frequency.value = swellHz
  depth.gain.value = 0.35
  swell.connect(depth).connect(level.gain)
  src.connect(f).connect(level).connect(g).connect(o)
  src.start()
  swell.start()
  return g
}

/** Starts the ambience (only ever from a tap: browsers allow sound to begin no other way). */
export function startAmbience() {
  const { c, out: o } = audio()
  if (!bed) bed = { wind: voice(c, o, 'bandpass', 520, 0.6, 0.07), water: voice(c, o, 'lowpass', 700, 0.3, 0.16) }
}

/** Sets how much wind and water is heard (0..1 each), easing over a couple of seconds. */
export function setAmbience(wind: number, water: number) {
  if (!bed || !ctx) return
  const t = ctx.currentTime
  bed.wind.gain.setTargetAtTime(wind * 0.5, t, 0.8)
  bed.water.gain.setTargetAtTime(water * 0.45, t, 0.8)
}

/** Silences the ambience (it fades out; the next start fades it back in). */
export const stopAmbience = () => setAmbience(0, 0)
