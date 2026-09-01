import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSeededRandom } from '../../lib/seededRandom';
import { FLOOR_COUNT, FLOOR_HEIGHT, FOOTPRINT, GROUND_OFFSET } from './buildingConfig';

const SIDES = [
  { axis: 'z', sign: 1 },
  { axis: 'z', sign: -1 },
  { axis: 'x', sign: 1 },
  { axis: 'x', sign: -1 },
];
const PER_SIDE_DEFAULT = 3;
const PER_SIDE_LOW = 2;
const DARK_COLOR = new THREE.Color('#12151a');
const COOL_LIT = new THREE.Color('#dce6f5');
const WARM_LIT = new THREE.Color('#f2d9a8');

function windowPosition(dummy, side, floorIndex, slot, perSide) {
  const offset = FOOTPRINT / 2 + 0.01;
  const y = floorIndex * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.5 + GROUND_OFFSET;
  const along = (slot - (perSide - 1) / 2) * (FOOTPRINT / (perSide + 1));
  if (side.axis === 'z') {
    dummy.position.set(along, y, side.sign * offset);
    dummy.scale.set(0.7, FLOOR_HEIGHT * 0.5, 0.02);
  } else {
    dummy.position.set(side.sign * offset, y, along);
    dummy.scale.set(0.02, FLOOR_HEIGHT * 0.5, 0.7);
  }
  dummy.rotation.set(0, 0, 0);
}

/**
 * Windows
 * A single InstancedMesh for every window on the tower. Windows are
 * grouped into small per-floor-per-side "room clusters" that share a
 * base lighting threshold (with a little per-window jitter) — reads as
 * "a room turned its lights on" rather than each pane rolling dice
 * independently, which was starting to look like uniform noise across a
 * tall tower. A small chance of never lighting at all keeps the building
 * from feeling like a light switch. Color mixes mostly cool tones with
 * occasional warm accents, staying distinct from the crane/site's
 * saturated construction amber per the project's cold-city / warm-site /
 * elegant-building lighting rule. `lowDetail` reduces windows-per-side
 * (3 -> 2) on small/low-power devices.
 */
export default function Windows({ windowsT, heightT, lowDetail = false }) {
  const meshRef = useRef();
  const perSide = lowDetail ? PER_SIDE_LOW : PER_SIDE_DEFAULT;
  const count = FLOOR_COUNT * SIDES.length * perSide;
  const lastQuantized = useRef(-1);

  const layout = useMemo(() => {
    const rand = createSeededRandom(777);
    const items = [];
    for (let f = 0; f < FLOOR_COUNT; f++) {
      for (const side of SIDES) {
        // one "room" per floor-face: a shared base threshold so its
        // windows tend to light up together, in a small group, instead
        // of each pane rolling independently
        const clusterBase = rand() * 0.68;
        const clusterWarm = rand() < 0.3; // some rooms read warmer overall
        for (let s = 0; s < perSide; s++) {
          const neverLights = rand() < 0.12;
          const jitter = (rand() - 0.5) * 0.14;
          items.push({
            floor: f,
            side,
            slot: s,
            threshold: THREE.MathUtils.clamp(clusterBase + jitter, 0, 0.92),
            warm: clusterWarm ? rand() < 0.75 : rand() < 0.12,
            neverLights,
          });
        }
      }
    }
    return items;
  }, [perSide]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    layout.forEach((w, i) => {
      windowPosition(dummy, w.side, w.floor, w.slot, perSide);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, DARK_COLOR);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, perSide]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Recompute lit-state colors only when progress moves meaningfully —
    // avoids re-uploading the instance color buffer every single frame.
    const quantized = Math.round(windowsT * 200);
    if (quantized === lastQuantized.current) return;
    lastQuantized.current = quantized;

    const color = new THREE.Color();
    layout.forEach((w, i) => {
      const floorReady = heightT * FLOOR_COUNT - w.floor > 0.6;
      const lit = floorReady && !w.neverLights && windowsT > w.threshold;
      color.copy(lit ? (w.warm ? WARM_LIT : COOL_LIT) : DARK_COLOR);
      mesh.setColorAt(i, color);
    });
    mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
