import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

/** Cinematic finish: soft bloom on emissive accents, film grain, vignette. Skipped on slow devices. */
export default function Post() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      <Vignette offset={0.25} darkness={0.75} />
    </EffectComposer>
  )
}
