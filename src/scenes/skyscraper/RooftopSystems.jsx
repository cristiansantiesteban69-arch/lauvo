import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINAL_HEIGHT, FOOTPRINT, GROUND_OFFSET } from './buildingConfig';

/**
 * RooftopSystems
 * "The building is coming alive, then finishes" details for the systems
 * + completion stages:
 *  - a construction hoist that climbs the facade once (systems stage),
 *    then retires — scales back down — as completion finishes, so the
 *    last temporary construction element visibly leaves the site instead
 *    of staying parked forever;
 *  - a rooftop parapet cap that closes off the tower's silhouette —
 *    without it the tower just stops, with it the top reads as finished
 *    architecture;
 *  - an antenna + beacon that rise and settle into a steady signal,
 *    the final "this is a landmark now" detail.
 * Kept to four meshes total — no new geometry categories, no particle
 * systems.
 */
export default function RooftopSystems({ systemsT, completionT }) {
  const hoistRef = useRef();
  const capRef = useRef();
  const antennaRef = useRef();
  const beaconRef = useRef();

  useFrame((state, delta) => {
    if (hoistRef.current) {
      // climbs from ground to roof over the systems stage, then retires
      // (scales down and hides) once the building no longer needs it —
      // a temporary construction element leaving, not staying forever
      const travel = THREE.MathUtils.clamp(systemsT, 0, 1);
      const y = THREE.MathUtils.lerp(GROUND_OFFSET * 0.6, FINAL_HEIGHT + GROUND_OFFSET - 2, travel);
      hoistRef.current.position.y = THREE.MathUtils.damp(hoistRef.current.position.y, y, 4, delta);
      const retire = 1 - THREE.MathUtils.smoothstep(completionT, 0.55, 0.9);
      const activeScale = systemsT > 0.02 ? 1 : 0;
      const targetScale = Math.min(activeScale, retire);
      hoistRef.current.scale.setScalar(
        THREE.MathUtils.damp(hoistRef.current.scale.x, targetScale, 4, delta)
      );
      hoistRef.current.visible = hoistRef.current.scale.x > 0.01;
    }
    if (capRef.current) {
      // the parapet closes off the silhouette — a distinct "capping"
      // beat, appearing slightly ahead of the antenna so the roofline
      // reads as finished before the signal equipment arrives on top of it
      const scale = THREE.MathUtils.damp(
        capRef.current.scale.y,
        Math.max(0.02, THREE.MathUtils.smoothstep(completionT, 0, 0.6)),
        3,
        delta
      );
      capRef.current.scale.set(1, scale, 1);
      capRef.current.position.y = FINAL_HEIGHT + GROUND_OFFSET + (scale * 0.4) / 2;
    }
    if (antennaRef.current) {
      const scale = THREE.MathUtils.damp(antennaRef.current.scale.y, Math.max(0.02, completionT), 3, delta);
      antennaRef.current.scale.set(1, scale, 1);
      antennaRef.current.position.y = FINAL_HEIGHT + GROUND_OFFSET + 0.4 + (scale * 2.4) / 2;
    }
    if (beaconRef.current) {
      const pulse = completionT > 0.85 ? 1 : 0.5 + Math.abs(Math.sin(state.clock.elapsedTime * 1.6)) * 0.6;
      beaconRef.current.material.emissiveIntensity = pulse * completionT;
      beaconRef.current.position.y = FINAL_HEIGHT + GROUND_OFFSET + 0.4 + completionT * 2.4;
    }
  });

  return (
    <group>
      <mesh ref={hoistRef} position={[FOOTPRINT / 2 + 0.3, 1, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color="#f2a93b" roughness={0.5} metalness={0.4} />
      </mesh>

      <mesh ref={capRef} position={[0, FINAL_HEIGHT + GROUND_OFFSET, 0]} scale={[1, 0.02, 1]}>
        <boxGeometry args={[FOOTPRINT + 0.3, 0.4, FOOTPRINT + 0.3]} />
        <meshStandardMaterial color="#dfe3e8" roughness={0.3} metalness={0.5} />
      </mesh>

      <mesh ref={antennaRef} position={[0, FINAL_HEIGHT + GROUND_OFFSET, 0]} scale={[1, 0.02, 1]}>
        <cylinderGeometry args={[0.05, 0.08, 2.4, 8]} />
        <meshStandardMaterial color="#c7c9ce" roughness={0.4} metalness={0.7} />
      </mesh>

      <mesh ref={beaconRef} position={[0, FINAL_HEIGHT + GROUND_OFFSET, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#e24b4a" emissive="#e24b4a" emissiveIntensity={0} />
      </mesh>
    </group>
  );
}
