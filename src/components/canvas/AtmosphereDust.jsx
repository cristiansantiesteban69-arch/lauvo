import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '../../lib/seededRandom';

const BASE_COUNT = 140;
const SPREAD = 30;
const HEIGHT = 18;

/**
 * AtmosphereDust
 * Cheap ambient motion so the scene doesn't feel static, without a particle
 * system heavy enough to hurt mobile frame rate. One Points draw call,
 * position updated in a single typed-array pass per frame. `lowDetail`
 * roughly halves the count on small/low-power devices.
 */
export default function AtmosphereDust({ lowDetail = false }) {
  const pointsRef = useRef();
  const count = lowDetail ? Math.round(BASE_COUNT * 0.45) : BASE_COUNT;

  const positions = useMemo(() => {
    const rand = createSeededRandom(99);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * SPREAD;
      arr[i * 3 + 1] = rand() * HEIGHT;
      arr[i * 3 + 2] = (rand() - 0.5) * SPREAD - 8;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1;
      arr[idx] += delta * 0.15;
      if (arr[idx] > HEIGHT) arr[idx] = 0;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#eef0f3"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
