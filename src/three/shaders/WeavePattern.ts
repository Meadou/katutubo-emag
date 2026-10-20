import * as THREE from 'three'

/**
 * Procedural woven-cloth shader: diamond lattices, zigzag bands and thread grain,
 * inspired by (not copied from) Philippine textile geometry. The cloth waves gently.
 */
export function createWeaveMaterial(primary: string, opts: { wave?: number; brightness?: number } = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWave: { value: opts.wave ?? 0.08 },
      uA: { value: new THREE.Color('#1a0f0b') },
      uB: { value: new THREE.Color(primary) },
      uC: { value: new THREE.Color('#efe2c4') },
      uBright: { value: opts.brightness ?? 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uWave;
      varying vec2 vUv; varying float vShade;
      void main() {
        vUv = uv;
        vec3 p = position;
        float w = sin(p.y * 2.2 + uTime * 1.3) * cos(p.x * 1.4 + uTime * 0.7);
        p.z += w * uWave;
        vShade = 0.85 + w * 0.6;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uTime; uniform float uBright;
      varying vec2 vUv; varying float vShade;
      float diamond(vec2 p, float s) { p = abs(fract(p * s) - 0.5); return step(p.x + p.y, 0.32) - step(p.x + p.y, 0.18); }
      void main() {
        vec2 uv = vUv * vec2(1.0, 2.0);
        // banded layout: border bands + central diamond field
        float band = floor(uv.x * 7.0);
        float border = step(mod(band, 3.0), 0.5);
        float zig = step(abs(fract(uv.y * 10.0 + abs(fract(uv.x * 7.0) - 0.5) * 2.0) - 0.5), 0.12);
        float dia = diamond(uv + vec2(0.0, 0.0), 6.0);
        float inner = diamond(uv + 0.5 / 6.0, 6.0) * 0.6;
        vec3 col = uA;
        col = mix(col, uB, clamp(dia + inner, 0.0, 1.0) * (1.0 - border));
        col = mix(col, uC, zig * border);
        // thread grain
        float grain = 0.88 + 0.12 * sin(vUv.x * 900.0) * sin(vUv.y * 700.0);
        col *= grain * vShade * uBright;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  })
}

/** Animated ocean: deep ink with a glimmering dot grid. */
export function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#d9a441') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWorld;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vWorld;
      void main() {
        vec2 g = vWorld.xz * 3.0;
        vec2 f = abs(fract(g) - 0.5);
        float dot = smoothstep(0.08, 0.0, length(f));
        float wave = 0.5 + 0.5 * sin(length(vWorld.xz) * 1.6 - uTime * 0.8);
        float fade = smoothstep(14.0, 2.0, length(vWorld.xz));
        float a = dot * (0.12 + wave * 0.35) * fade;
        gl_FragColor = vec4(uColor, a);
      }`,
  })
}
