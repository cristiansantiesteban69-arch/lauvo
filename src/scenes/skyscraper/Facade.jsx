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

const PANEL_WIDTH = FOOTPRINT - 0.6;
const PANEL_THICKNESS = 0.08;
const MULLION_THICKNESS = 0.045;
const MULLION_DEPTH = 0.1;

function panelTransform(dummy, side, floorIndex) {
  const offset = FOOTPRINT / 2;
  const y = floorIndex * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + GROUND_OFFSET;
  if (side.axis === 'z') {
    dummy.position.set(0, y, side.sign * offset);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(PANEL_WIDTH, FLOOR_HEIGHT * 0.86, PANEL_THICKNESS);
  } else {
    dummy.position.set(side.sign * offset, y, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(PANEL_THICKNESS, FLOOR_HEIGHT * 0.86, PANEL_WIDTH);
  }
}

// A horizontal mullion (window-wall frame line) sitting right at each
// floor line, spanning the full facade width on that side — the detail
// that reads as "an assembled glass envelope with structure behind it"
// rather than a single flat colored slab.
function mullionTransform(dummy, side, floorIndex) {
  const offset = FOOTPRINT / 2 + 0.01;
  const y = floorIndex * FLOOR_HEIGHT + GROUND_OFFSET;
  if (side.axis === 'z') {
    dummy.position.set(0, y, side.sign * offset);
    dummy.scale.set(PANEL_WIDTH + 0.1, MULLION_THICKNESS, MULLION_DEPTH);
  } else {
    dummy.position.set(side.sign * offset, y, 0);
    dummy.scale.set(MULLION_DEPTH, MULLION_THICKNESS, PANEL_WIDTH + 0.1);
  }
  dummy.rotation.set(0, 0, 0);
}

/**
 * Facade
 * Stylized "glass" perimeter panels, one InstancedMesh for the whole
 * building (FLOOR_COUNT * 4 sides instances, still a single draw call),
 * plus a second, lightweight InstancedMesh of horizontal mullions at
 * every floor line (same instance count, one more draw call) — the
 * frame lines that make it read as an assembled curtain wall wrapping a
 * structure, not a flat texture. Deliberately minimal/flat rather than
 * photoreal glass — a premium digital-studio look, not an architectural
 * render. Both reveal bottom-to-top once the frame (Skeleton/Floors) has
 * already passed that height, in lockstep with each other.
 */
export default function Facade({ facadeT, lowDetail = false }) {
  const glassRef = useRef();
  const mullionRef = useRef();
  const count = FLOOR_COUNT * SIDES.length;
  const showMullions = !lowDetail;

  const layout = useMemo(() => {
    const rand = createSeededRandom(555);
    const items = [];
    for (let f = 0; f < FLOOR_COUNT; f++) {
      for (const side of SIDES) {
        items.push({ floor: f, side, shade: 0.85 + rand() * 0.25 });
      }
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const glass = glassRef.current;
    const mullion = mullionRef.current;
    if (!glass) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const mullionColor = new THREE.Color('#dfe3e8');
    layout.forEach((p, i) => {
      panelTransform(dummy, p.side, p.floor);
      dummy.updateMatrix();
      glass.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.55 * p.shade, 0.62 * p.shade, 0.7 * p.shade);
      glass.setColorAt(i, color);

      if (showMullions && mullion) {
        mullionTransform(dummy, p.side, p.floor);
        dummy.updateMatrix();
        mullion.setMatrixAt(i, dummy.matrix);
        mullion.setColorAt(i, mullionColor);
      }
    });
    glass.instanceMatrix.needsUpdate = true;
    if (glass.instanceColor) glass.instanceColor.needsUpdate = true;
    if (showMullions && mullion) {
      mullion.instanceMatrix.needsUpdate = true;
      if (mullion.instanceColor) mullion.instanceColor.needsUpdate = true;
    }
  }, [layout, showMullions]);

  useFrame((_, delta) => {
    const glass = glassRef.current;
    const mullion = mullionRef.current;
    if (!glass) return;
    const dummy = new THREE.Object3D();
    const targetVisible = facadeT * FLOOR_COUNT;
    let changed = false;

    if (!glass.userData.scales) glass.userData.scales = new Array(count).fill(0);

    layout.forEach((p, i) => {
      const t = THREE.MathUtils.clamp(targetVisible - p.floor, 0, 1);
      const prevScale = glass.userData.scales[i];
      const nextScale = THREE.MathUtils.damp(prevScale, t, 5, delta);
      glass.userData.scales[i] = nextScale;

      // panels grow vertically into place from the floor line up
      panelTransform(dummy, p.side, p.floor);
      dummy.scale.y *= Math.max(0.001, nextScale);
      dummy.position.y = p.floor * FLOOR_HEIGHT + GROUND_OFFSET + dummy.scale.y / 2;
      dummy.updateMatrix();
      glass.setMatrixAt(i, dummy.matrix);

      // the mullion at this floor line snaps into place once its panel
      // has mostly assembled — a frame following the glass, not leading it
      if (showMullions && mullion) {
        mullionTransform(dummy, p.side, p.floor);
        const mullionReveal = THREE.MathUtils.smoothstep(nextScale, 0.7, 1);
        dummy.scale.x *= p.side.axis === 'z' ? Math.max(0.02, mullionReveal) : 1;
        dummy.scale.z *= p.side.axis === 'x' ? Math.max(0.02, mullionReveal) : 1;
        dummy.updateMatrix();
        mullion.setMatrixAt(i, dummy.matrix);
      }

      if (Math.abs(nextScale - prevScale) > 0.0005) changed = true;
    });

    if (changed) {
      glass.instanceMatrix.needsUpdate = true;
      if (showMullions && mullion) mullion.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={glassRef} args={[null, null, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          roughness={0.08}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.12}
          transparent
          opacity={0.82}
        />
      </instancedMesh>
      {showMullions && (
        <instancedMesh ref={mullionRef} args={[null, null, count]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.35} metalness={0.6} />
        </instancedMesh>
      )}
    </group>
  );
}
