import { useEffect, useRef, useState } from 'react'
import type { Group } from '../content'
import { audioLevel } from '../store'

/** Pentatonic-ish pitches for five bossed gongs (illustrative, not a specific tuning). */
const GONG_HZ = [262, 294, 330, 392, 440]
/** A simple repeating 16-step pattern: gong index per step, -1 = rest. */
const PATTERN = [0, -1, 2, 1, 3, -1, 2, -1, 4, 3, -1, 2, 1, -1, 0, 2]

function strike(ctx: AudioContext, out: AudioNode, hz: number, t: number) {
  // A bossed gong ≈ fundamental + inharmonic partials, fast attack, long decay.
  for (const [mult, gain, decay] of [[1, 0.5, 1.6], [2.76, 0.18, 0.7], [5.4, 0.08, 0.35]] as const) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(hz * mult, t)
    o.frequency.exponentialRampToValueAtTime(hz * mult * 0.995, t + decay)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + decay + 0.05)
  }
}

export default function MusicPlayer({ group }: { group: Group }) {
  const [playing, setPlaying] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const audioEl = useRef<HTMLAudioElement>(null)
  const ctxRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; src?: MediaElementAudioSourceNode } | null>(null)
  const timers = useRef<{ raf: number; seq: number }>({ raf: 0, seq: 0 })
  const synthesized = !group.audio

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.connect(ctx.destination)
      ctxRef.current = { ctx, analyser }
      if (audioEl.current) {
        const src = ctx.createMediaElementSource(audioEl.current)
        src.connect(analyser)
        ctxRef.current.src = src
      }
    }
    return ctxRef.current
  }

  const draw = () => {
    const c = ctxRef.current
    const cv = canvas.current
    if (!c || !cv) return
    const data = new Uint8Array(c.analyser.frequencyBinCount)
    c.analyser.getByteFrequencyData(data)
    const g = cv.getContext('2d')!
    const w = cv.width, h = cv.height, n = 48
    g.clearRect(0, 0, w, h)
    g.fillStyle = group.color
    let sum = 0
    for (let i = 0; i < n; i++) {
      const v = data[Math.floor((i / n) * data.length * 0.7)] / 255
      sum += v
      const bh = Math.max(2, v * h)
      g.globalAlpha = 0.35 + v * 0.65
      g.fillRect((i * w) / n + 1, (h - bh) / 2, w / n - 2, bh)
    }
    audioLevel.current = sum / n
    // Recorded audio: map 8 spectrum slices to the gong bands. (Synth sets bands directly on each strike.)
    if (!synthesized) {
      for (let b = 0; b < 8; b++) {
        const v = data[Math.floor((b / 8) * data.length * 0.5)] / 255
        audioLevel.bands[b] = Math.max(audioLevel.bands[b], v)
      }
    }
    timers.current.raf = requestAnimationFrame(draw)
  }

  const startSynth = () => {
    const { ctx, analyser } = ensureCtx()
    const out = ctx.createGain()
    out.gain.value = 0.6
    out.connect(analyser)
    const stepDur = 0.18
    let step = 0
    let nextT = ctx.currentTime + 0.05
    // look-ahead scheduler: keeps timing steady even when the main thread is busy
    timers.current.seq = window.setInterval(() => {
      while (nextT < ctx.currentTime + 0.2) {
        const gi = PATTERN[step % PATTERN.length]
        if (gi >= 0) {
          strike(ctx, out, GONG_HZ[gi], nextT)
          const delay = (nextT - ctx.currentTime) * 1000
          setTimeout(() => { audioLevel.bands[gi] = 1 }, Math.max(0, delay))
        }
        nextT += stepDur
        step++
      }
    }, 50)
  }

  const stop = () => {
    clearInterval(timers.current.seq)
    cancelAnimationFrame(timers.current.raf)
    audioEl.current?.pause()
    ctxRef.current?.ctx.suspend()
    audioLevel.current = 0
    setPlaying(false)
  }

  const toggle = async () => {
    if (playing) return stop()
    const { ctx } = ensureCtx()
    await ctx.resume()
    if (synthesized) startSynth()
    else await audioEl.current!.play()
    setPlaying(true)
    draw()
  }

  useEffect(() => () => {
    clearInterval(timers.current.seq)
    cancelAnimationFrame(timers.current.raf)
    audioLevel.current = 0
    audioLevel.bands.fill(0)
    ctxRef.current?.ctx.close()
  }, [])

  return (
    <div className="player">
      <button className="player__btn" onClick={toggle} aria-pressed={playing}>
        <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
        {playing ? 'Pause' : synthesized ? 'Play gong rhythm' : 'Listen'}
      </button>
      <canvas ref={canvas} className="player__viz" width={480} height={64} aria-hidden="true" />
      <p className="player__note">
        {synthesized
          ? 'Synthesized in your browser to suggest the sound of bossed gongs. Not a traditional recording or a traditional piece.'
          : 'Recording used with permission. See Sources for credits.'}
      </p>
      {!synthesized && (
        <audio ref={audioEl} src={import.meta.env.BASE_URL + group.audio} preload="none" crossOrigin="anonymous" onEnded={stop} />
      )}
    </div>
  )
}
