import { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { createSeededRandom } from '../../lib/seededRandom';

// Two instanced layers instead of one: a near skyline the visitor reads as
// detail, and a sparser, smaller, more muted far layer that sits deeper in
// the fog. Two draw calls total — still cheap — but the parallax-like
// depth cue reads as a much bigger city than 70 boxes alone would.
const NEAR_COUNT = 70;
const FAR_COUNT = 46;
const CLEAR_RADIUS = 9; // keeps the construction site free of background buildings
const NEAR_FIELD = 90;
const FAR_FIELD = 170;

const CONCRETE_SHADES = ['#3a3d44', '#2c2f36', '#4a4d54', '#23262c'];
const FAR_SHADES = ['#1c1f26', '#20232b', '#171a20'];
const LIT_WINDOW = '#f2c877';

function generateLayout({ seed, count, field, clearRadius, minHeight, maxHeight, shades, litChance }) {
  const rand = createSeededRandom(seed);
  const items = [];
  let attempts = 0;
  while (items.length < count && attempts < count * 6) {
    attempts += 1;
    const x = (rand() - 0.5) * field;
    const z = (rand() - 0.5) * field - 10;
    if (Math.hypot(x, z) < clearRadius) continue;
    // Squared random biases the skyline toward more short/mid buildings
    // with a few tall standouts, instead of a flat random spread — reads
    // as a more organic silhouette (real skylines aren't uniform) for
    // free, no extra draw calls.
    const heightBias = rand() * rand();
    const height = minHeight + heightBias * (maxHeight - minHeight);
    // Footprint scales loosely with height so tall buildings don't end
    // up as improbably thin "toothpicks" against the main tower.
    const footprintBase = 1.1 + (height / maxHeight) * 0.9;
    const width = footprintBase + rand() * 1.6;
    const depth = footprintBase + rand() * 1.6;
    const color = shades[Math.floor(rand() * shades.length)];
    items.push({ x, z, height, width, depth, color, lit: rand() < litChance });
  }
  return items;
}

function InstancedLayer({ layout, litColor }) {
  const meshRef = useRef();

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    layout.forEach((b, i) => {
      dummy.position.set(b.x, b.height / 2, b.z);
      dummy.scale.set(b.width, b.height, b.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(b.lit ? litColor : b.color);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, litColor]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, layout.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.78} metalness={0.18} />
    </instancedMesh>
  );
}

/**
 * CityBlocks
 * Near + far instanced skylines standing in for a full city. Height,
 * footprint and color are randomized once (seeded) at generation time, not
 * per-frame, so cost stays at two draw calls regardless of building count.
 */
export default function CityBlocks({ lowDetail = false }) {
  const nearLayout = useMemo(
    () =>
      generateLayout({
        seed: 1337,
        count: lowDetail ? Math.round(NEAR_COUNT * 0.6) : NEAR_COUNT,
        field: NEAR_FIELD,
        clearRadius: CLEAR_RADIUS,
        minHeight: 2,
        maxHeight: 16,
        shades: CONCRETE_SHADES,
        litChance: 0.18,
      }),
    [lowDetail]
  );

  const farLayout = useMemo(
    () =>
      generateLayout({
        seed: 4242,
        count: lowDetail ? 0 : FAR_COUNT,
        field: FAR_FIELD,
        clearRadius: NEAR_FIELD / 2,
        minHeight: 4,
        maxHeight: 26,
        shades: FAR_SHADES,
        litChance: 0.05,
      }),
    [lowDetail]
  );

  return (
    <group>
      <InstancedLayer layout={nearLayout} litColor={LIT_WINDOW} />
      {farLayout.length > 0 && <InstancedLayer layout={farLayout} litColor={LIT_WINDOW} />}
    </group>
  );
}
