import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOOTPRINT, FINAL_HEIGHT, GROUND_OFFSET } from './buildingConfig';

/**
 * Crane
 * Carried over from Phase 1, unchanged in spirit: a lightweight
 * procedural tower crane, no physics simulation. `active` (0-1) scales
 * how lively its idle sway is — near-still while there's little to do,
 * a bit more animated while the building is actively rising — so it
 * reads as "participating" without any new complexity.
 *
 * Phase 3 fix: the mast height was fixed at 16 from Phase 1, when the
 * construction site was a 5-beam placeholder — with the Phase 2/3
 * skyscraper now finishing around FINAL_HEIGHT (~30), a shorter crane
 * would read as visibly wrong next to the completed tower in the final
 * hero shot. The mast now sits above FINAL_HEIGHT instead of a fixed
 * number, so it always plausibly could have built the tower beside it.
 *
 * `completionT` (0-1, optional) lets the crane wind down its last lift
 * as the tower finishes — the hook cable retracts toward the jib — a
 * small "wrapping up" cue for Summit instead of a static prop.
 */
export default function Crane({ active = 1, completionT = 0 }) {
  const craneJib = useRef();
  const warningLight = useRef();
  const cableRef = useRef();
  const mastHeight = FINAL_HEIGHT + GROUND_OFFSET + 4;
  const offset = FOOTPRINT / 2 + 2.4;
  const cableFull = 4.2;
  const cableRetracted = 0.7;

  useFrame((state, delta) => {
    if (craneJib.current) {
      craneJib.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15 * Math.max(0.3, active);
    }
    if (warningLight.current) {
      // settles into a slower, calmer pulse once the tower is finished —
      // a working-site urgency giving way to a steady landmark signal
      const speed = THREE.MathUtils.lerp(2, 0.8, completionT);
      const pulse = 0.4 + Math.abs(Math.sin(state.clock.elapsedTime * speed)) * 0.9;
      warningLight.current.material.emissiveIntensity = pulse;
    }
    if (cableRef.current) {
      const target = THREE.MathUtils.lerp(cableFull, cableRetracted, completionT);
      const length = THREE.MathUtils.damp(cableRef.current.scale.y, target / cableFull, 3, delta);
      cableRef.current.scale.y = length;
      cableRef.current.position.y = -(length * cableFull) / 2;
    }
  });

  return (
    <group position={[offset, 0, -1.5]}>
      <mesh position={[0, mastHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.35, mastHeight, 0.35]} />
        <meshStandardMaterial color="#f2a93b" roughness={0.5} metalness={0.3} />
      </mesh>
      <group ref={craneJib} position={[0, mastHeight - 0.2, 0]}>
        <mesh position={[3.4, 0, 0]}>
          <boxGeometry args={[7, 0.28, 0.28]} />
          <meshStandardMaterial color="#f2a93b" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[2.2, 0.28, 0.28]} />
          <meshStandardMaterial color="#8b8d93" roughness={0.6} />
        </mesh>
        <mesh ref={cableRef} position={[6.2, -2.1, 0]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.08, cableFull, 0.08]} />
          <meshStandardMaterial color="#5c5e64" />
        </mesh>
        <mesh ref={warningLight} position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#e24b4a" emissive="#e24b4a" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}
