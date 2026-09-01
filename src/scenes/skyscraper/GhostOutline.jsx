import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINAL_HEIGHT, FOOTPRINT, GROUND_OFFSET } from './buildingConfig';

/**
 * GhostOutline
 * The faint wireframe preview of the building's eventual height,
 * introduced in Phase 1. It fades in early (a promise of what's coming)
 * and now — extended for Phase 2 — fades all the way to invisible as the
 * real building's completion stage finishes, so the transition reads as
 * "the promise became the real thing" rather than a prop left behind.
 * Spans the TRUE ground-to-roof height (GROUND_OFFSET + FINAL_HEIGHT),
 * so it previews the whole building including the podium, not just the
 * floor stack above it. Wireframe is intentional here — this is meant to
 * read as an architectural preview sketch, unlike the solid structural
 * elements elsewhere in the building.
 */
export default function GhostOutline({ heightT, completionT }) {
  const ghostRef = useRef();
  const totalHeight = FINAL_HEIGHT + GROUND_OFFSET;

  useFrame((_, delta) => {
    if (!ghostRef.current) return;
    // rises with the frame, fades in early, then dissolves fully as the
    // real building completes (completionT -> 1 means ghost opacity -> 0)
    const baseTarget = THREE.MathUtils.clamp((heightT - 0.3) / 0.7, 0, 0.22);
    const target = baseTarget * (1 - completionT);
    ghostRef.current.material.opacity = THREE.MathUtils.damp(
      ghostRef.current.material.opacity,
      target,
      3,
      delta
    );
  });

  return (
    <mesh ref={ghostRef} position={[0, totalHeight / 2, 0]}>
      <boxGeometry args={[FOOTPRINT + 0.2, totalHeight, FOOTPRINT + 0.2]} />
      <meshBasicMaterial color="#c7c9ce" wireframe transparent opacity={0} />
    </mesh>
  );
}
