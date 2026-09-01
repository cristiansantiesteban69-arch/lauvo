import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOOR_COUNT, FLOOR_HEIGHT, FINAL_HEIGHT, FOOTPRINT, PODIUM_BASE_Y, PODIUM_HEIGHT, GROUND_OFFSET } from './buildingConfig';

const CORNER_OFFSET = FOOTPRINT / 2 - 0.3;
const CORNERS = [
  [CORNER_OFFSET, CORNER_OFFSET],
  [-CORNER_OFFSET, CORNER_OFFSET],
  [CORNER_OFFSET, -CORNER_OFFSET],
  [-CORNER_OFFSET, -CORNER_OFFSET],
];

const RING_SIDES = [
  { axis: 'x', sign: 1 },
  { axis: 'x', sign: -1 },
  { axis: 'z', sign: 1 },
  { axis: 'z', sign: -1 },
];
const RING_SPAN = FOOTPRINT - 0.4;
const BAR_THICKNESS = 0.14;

function ringBarTransform(dummy, side, floorIndex) {
  // + GROUND_OFFSET: ring beams must align with Floors/Facade/Windows,
  // which all measure floor index from where the podium ends, not from
  // true ground (y=0). See buildingConfig.js for the full explanation.
  const y = floorIndex * FLOOR_HEIGHT + GROUND_OFFSET;
  const half = RING_SPAN / 2;
  if (side.axis === 'x') {
    dummy.position.set(0, y, side.sign * half);
    dummy.scale.set(RING_SPAN, BAR_THICKNESS, BAR_THICKNESS);
  } else {
    dummy.position.set(side.sign * half, y, 0);
    dummy.scale.set(BAR_THICKNESS, BAR_THICKNESS, RING_SPAN);
  }
}

/**
 * Skeleton
 * The structural frame: a podium base (grounds the tower — a slab wider
 * than the shaft above it, the classic "podium + tower" composition that
 * reads as designed architecture rather than a single extruded box), 4
 * corner columns + a central core rising together (physical scale/
 * position growth, not opacity), and a solid ring-frame beam at every
 * floor level (InstancedMesh, one draw call) that fades in once the
 * frame reaches that height. `heightT` (0-1) is the shared skeleton-rise
 * progress from buildingConfig.skeletonHeightT — Foundation and
 * Structure are really the same rising frame at different heights, not
 * separate objects.
 */
export default function Skeleton({ heightT }) {
  const columnsRef = useRef();
  const coreRef = useRef();
  const podiumRef = useRef();
  const ringMeshRef = useRef();
  const ringCount = FLOOR_COUNT * RING_SIDES.length;

  useLayoutEffect(() => {
    const mesh = ringMeshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let f = 0; f < FLOOR_COUNT; f++) {
      for (const side of RING_SIDES) {
        ringBarTransform(dummy, side, f);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const targetHeight = Math.max(0.15, heightT * FINAL_HEIGHT);
    // Columns/core are anchored partway into the podium (visually
    // "founded" in it) and must reach exactly as high as the current
    // floor stack — GROUND_OFFSET + targetHeight — or their tops would
    // fall short of the topmost floor as it rises.
    const anchorEmbed = PODIUM_HEIGHT / 2;
    const shaftBottom = GROUND_OFFSET - anchorEmbed;
    const shaftHeight = targetHeight + anchorEmbed;

    if (columnsRef.current) {
      columnsRef.current.children.forEach((col) => {
        col.scale.y = THREE.MathUtils.damp(col.scale.y, shaftHeight, 4, delta);
        col.position.y = shaftBottom + col.scale.y / 2;
      });
    }
    if (coreRef.current) {
      const coreHeight = Math.max(0.15, shaftHeight * 0.99);
      coreRef.current.scale.y = THREE.MathUtils.damp(coreRef.current.scale.y, coreHeight, 4, delta);
      coreRef.current.position.y = shaftBottom + coreRef.current.scale.y / 2;
    }
    if (podiumRef.current) {
      const target = Math.max(0.05, Math.min(1, targetHeight / PODIUM_HEIGHT));
      podiumRef.current.scale.y = THREE.MathUtils.damp(podiumRef.current.scale.y, target, 5, delta);
      podiumRef.current.position.y = PODIUM_BASE_Y + (podiumRef.current.scale.y * PODIUM_HEIGHT) / 2;
    }

    const mesh = ringMeshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let f = 0; f < FLOOR_COUNT; f++) {
      const floorHeight = f * FLOOR_HEIGHT;
      const t = THREE.MathUtils.clamp((targetHeight - floorHeight) / FLOOR_HEIGHT, 0, 1);
      const s = Math.max(0.02, t);
      for (const side of RING_SIDES) {
        ringBarTransform(dummy, side, f);
        // the bar's full length is set by ringBarTransform; only its
        // cross-section thickness grows in, like a beam materializing
        // into place along its whole span at once
        if (side.axis === 'x') {
          dummy.scale.y = BAR_THICKNESS * s;
          dummy.scale.z = BAR_THICKNESS * s;
        } else {
          dummy.scale.x = BAR_THICKNESS * s;
          dummy.scale.y = BAR_THICKNESS * s;
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* podium — a wider grounding slab beneath the tower shaft, the
          detail that turns "extruded box" into "composed architecture" */}
      <mesh ref={podiumRef} position={[0, PODIUM_BASE_Y, 0]} scale={[1, 0.05, 1]} receiveShadow castShadow>
        <boxGeometry args={[FOOTPRINT + 1.6, PODIUM_HEIGHT, FOOTPRINT + 1.6]} />
        <meshStandardMaterial color="#22252b" roughness={0.55} metalness={0.35} />
      </mesh>

      <group ref={columnsRef}>
        {CORNERS.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.85, z]} scale={[1, 0.15, 1]} castShadow>
            <boxGeometry args={[0.45, 1, 0.45]} />
            <meshStandardMaterial color="#c7c9ce" roughness={0.3} metalness={0.75} />
          </mesh>
        ))}
      </group>

      <mesh ref={coreRef} position={[0, 0.85, 0]} scale={[1, 0.15, 1]}>
        <boxGeometry args={[1.6, 1, 1.6]} />
        <meshStandardMaterial color="#3a3d44" roughness={0.55} metalness={0.45} />
      </mesh>

      {/* per-floor ring frame — solid, lit bars (not wireframe) */}
      <instancedMesh ref={ringMeshRef} args={[null, null, ringCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9a9ca3" roughness={0.4} metalness={0.6} />
      </instancedMesh>
    </group>
  );
}
