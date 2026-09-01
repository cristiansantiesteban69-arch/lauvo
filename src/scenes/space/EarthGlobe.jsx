import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EARTH_RADIUS = 420;
// Positioned well below and behind the city/tower rather than directly
// under it — a sphere this size centered at the city's exact origin
// would sit tangent to the flat 400x400 ground plane and risk z-fighting
// / a visibly "flat disk on a planet" glitch at extreme distance. Offset
// horizontally too, so it isn't a dead-centered "logo" composition.
const EARTH_CENTER = [80, -1300, -120];

/**
 * EarthGlobe
 * A single stylized sphere (+ a slightly larger transparent shell for a
 * cheap Fresnel atmosphere rim) standing in for Earth as seen from deep
 * space — "de aquí venimos", not the protagonist. No textures, no scene
 * lights required (self-lit via a fixed shader light direction, so it
 * reads correctly regardless of how far it sits from the city's actual
 * light rig). `reveal` (0-1, driven by deepSpaceLocal) fades it in late
 * and gradually — never appears "de golpe" — and never reaches a
 * dramatic brightness that would compete with the star field.
 */
export default function EarthGlobe({ reveal = 0, lowDetail = false }) {
  const groupRef = useRef();
  const surfaceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vNormal;
          void main() {
            vec3 lightDir = normalize(vec3(0.45, 0.55, 0.35));
            float diffuse = max(dot(vNormal, lightDir), 0.0);
            vec3 ocean = vec3(0.05, 0.11, 0.22);
            vec3 lit = vec3(0.22, 0.55, 0.62);
            vec3 color = mix(ocean, lit, smoothstep(0.05, 0.85, diffuse));
            gl_FragColor = vec4(color, uOpacity);
          }
        `,
        transparent: true,
      }),
    []
  );

  const rimMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.5);
            vec3 glow = vec3(0.35, 0.62, 0.78);
            gl_FragColor = vec4(glow, fresnel * uOpacity * 0.6);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((_, delta) => {
    const target = THREE.MathUtils.smoothstep(reveal, 0.35, 0.85);
    surfaceMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
      surfaceMaterial.uniforms.uOpacity.value,
      target,
      2,
      delta
    );
    rimMaterial.uniforms.uOpacity.value = surfaceMaterial.uniforms.uOpacity.value;
    if (groupRef.current) {
      // a very slow spin — alive, not static — barely perceptible given
      // how far away and small-on-screen it stays
      groupRef.current.rotation.y += delta * 0.01;
    }
  });

  const segments = lowDetail ? 20 : 40;

  return (
    <group ref={groupRef} position={EARTH_CENTER}>
      <mesh material={surfaceMaterial}>
        <sphereGeometry args={[EARTH_RADIUS, segments, segments]} />
      </mesh>
      <mesh material={rimMaterial} scale={1.03}>
        <sphereGeometry args={[EARTH_RADIUS, segments, segments]} />
      </mesh>
    </group>
  );
}
