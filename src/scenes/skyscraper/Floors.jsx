import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '../../lib/seededRandom';
import { FLOOR_COUNT, FLOOR_HEIGHT, FOOTPRINT, GROUND_OFFSET } from './buildingConfig';

/**
 * Floors
 * One InstancedMesh standing in for every floor slab — a single draw call
 * regardless of building height. Each floor gets a tiny seeded variation
 * in footprint so the tower doesn't read as a stack of identical cubes.
 * Floors reveal bottom-to-top as `heightT` rises, growing into place
 * (scale) rather than fading in (opacity), so it reads as construction.
 */
export default function Floors({ heightT }) {
  const meshRef = useRef();

  const layout = useMemo(() => {
    const rand = createSeededRandom(2024);
    return Array.from({ length: FLOOR_COUNT }, () => ({
      inset: rand() * 0.18,
      tint: 0.9 + rand() * 0.12,
    }));
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    layout.forEach((f, i) => {
      const w = FOOTPRINT - f.inset;
      dummy.position.set(0, i * FLOOR_HEIGHT + GROUND_OFFSET, 0);
      dummy.scale.set(w, 0.14, w);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.16 * f.tint, 0.17 * f.tint, 0.19 * f.tint);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const targetVisible = heightT * FLOOR_COUNT;
    let changed = false;

    layout.forEach((f, i) => {
      const t = THREE.MathUtils.clamp(targetVisible - i, 0, 1);
      const eased = t * t; // slabs settle in with a soft ease, not linear pop
      const prevScale = mesh.userData.scales?.[i] ?? 0;
      const nextScale = THREE.MathUtils.damp(prevScale, eased, 5, delta);
      if (!mesh.userData.scales) mesh.userData.scales = new Array(FLOOR_COUNT).fill(0);
      mesh.userData.scales[i] = nextScale;

      const w = FOOTPRINT - f.inset;
      dummy.position.set(0, i * FLOOR_HEIGHT + GROUND_OFFSET, 0);
      dummy.scale.set(w, Math.max(0.02, nextScale * 0.14), w);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (Math.abs(nextScale - prevScale) > 0.0005) changed = true;
    });

    if (changed) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, FLOOR_COUNT]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} metalness={0.2} />
    </instancedMesh>
  );
}
