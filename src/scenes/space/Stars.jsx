import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '../../lib/seededRandom';

const STAR_COUNT_DEFAULT = 2200;
const STAR_COUNT_LOW = 650;
const RADIUS_MIN = 1200; // comfortably beyond the deep-space camera's max reach (~1180)
const RADIUS_MAX = 2350; // stays inside SkyDome's radius (2500)

/**
 * Stars
 * A single Points draw call standing in for a star field, distributed
 * through real 3D volume (a spherical shell) rather than painted on a
 * flat backdrop, so camera movement reads as genuine parallax/depth.
 *
 * Each star carries a random "reveal threshold" (0-1) compared against
 * `uReveal` in the vertex shader — as `reveal` rises, more stars cross
 * their threshold and fade/grow in, in a staggered, organic order
 * instead of the whole field switching on (or fading uniformly) at
 * once. This is what makes "empiezan a aparecer pocas estrellas, luego
 * aumenta gradualmente" work without animating per-star state on the
 * CPU — the GPU does it per-vertex, every frame, from one uniform.
 *
 * `lowDetail` cuts the count by roughly 70% for small/low-power devices.
 */
export default function Stars({ reveal = 0, lowDetail = false }) {
  const materialRef = useRef();
  const count = lowDetail ? STAR_COUNT_LOW : STAR_COUNT_DEFAULT;

  const { positions, thresholds, sizes, tints } = useMemo(() => {
    const rand = createSeededRandom(2600);
    const pos = new Float32Array(count * 3);
    const thr = new Float32Array(count);
    const sz = new Float32Array(count);
    const tint = new Float32Array(count); // 0 = cool white, 1 = warm pale gold

    for (let i = 0; i < count; i++) {
      // uniform-volume distribution within the shell via cube-root radius
      const u = rand();
      const radius = RADIUS_MIN + (RADIUS_MAX - RADIUS_MIN) * Math.cbrt(u);
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      thr[i] = rand() * 0.82; // leaves ~18% always past-threshold at reveal=1, none stuck fully closed
      sz[i] = 1.2 + rand() * 2.4;
      tint[i] = rand() < 0.12 ? 1 : 0;
    }

    return { positions: pos, thresholds: thr, sizes: sz, tints: tint };
  }, [count]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uReveal.value = THREE.MathUtils.damp(u.uReveal.value, reveal, 2, delta);
      u.uTime.value = state.clock.elapsedTime;
    }
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uReveal: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: `
          attribute float aThreshold;
          attribute float aSize;
          attribute float aTint;
          uniform float uReveal;
          uniform float uTime;
          varying float vAlpha;
          varying float vTint;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float visibility = clamp((uReveal - aThreshold) / 0.1, 0.0, 1.0);
            float twinkle = 0.75 + 0.25 * sin(uTime * (1.2 + aThreshold * 2.0) + aThreshold * 40.0);
            vAlpha = visibility * twinkle;
            vTint = aTint;
            gl_PointSize = aSize * visibility * (700.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vTint;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            if (d > 0.5) discard;
            float falloff = smoothstep(0.5, 0.0, d);
            vec3 cool = vec3(0.87, 0.92, 1.0);
            vec3 warm = vec3(1.0, 0.92, 0.78);
            vec3 color = mix(cool, warm, vTint);
            gl_FragColor = vec4(color, falloff * vAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return (
    <points renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aThreshold" args={[thresholds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
      </bufferGeometry>
      <primitive ref={materialRef} object={material} attach="material" />
    </points>
  );
}
