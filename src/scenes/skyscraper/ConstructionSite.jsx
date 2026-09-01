import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES, bandT, skeletonHeightT, FOOTPRINT, GROUND_OFFSET } from './buildingConfig';
import Skeleton from './Skeleton';
import Floors from './Floors';
import Facade from './Facade';
import Windows from './Windows';
import RooftopSystems from './RooftopSystems';
import GhostOutline from './GhostOutline';
import Crane from './Crane';

const HOARDING_SPAN = 7.6;
const HOARDING_HEIGHT = 0.9;
const HOARDING_THICKNESS = 0.08;
const HOARDING_PANELS = [
  { axis: 'x', sign: 1 },
  { axis: 'x', sign: -1 },
  { axis: 'z', sign: 1 },
  { axis: 'z', sign: -1 },
];

function hoardingPanelProps(side) {
  const half = HOARDING_SPAN / 2;
  if (side.axis === 'x') {
    return {
      position: [0, HOARDING_HEIGHT / 2, side.sign * half],
      args: [HOARDING_SPAN, HOARDING_HEIGHT, HOARDING_THICKNESS],
    };
  }
  return {
    position: [side.sign * half, HOARDING_HEIGHT / 2, 0],
    args: [HOARDING_THICKNESS, HOARDING_HEIGHT, HOARDING_SPAN],
  };
}

/**
 * ConstructionSite
 * The focal point of the whole scene and, from Phase 2 on, "THE WEBSITE
 * IS THE BUILDING": a full skyscraper that assembles itself as the
 * visitor scrolls. `reveal` is BUILDING_LOCAL progress (0-1), passed down
 * from Experience.jsx. This component only computes the per-stage
 * progress values (foundation/structure/floors/facade/windows/systems/
 * completion) from that single number and hands them to the specialized
 * sub-components in ./ — it holds no construction geometry itself beyond
 * the platform and hoarding, which is genuinely just the site, not the
 * building.
 */
export default function ConstructionSite({ reveal = 0, lowDetail = false }) {
  const siteLight = useRef();
  const entranceGlowRef = useRef();

  const foundationT = bandT(reveal, STAGES.foundation);
  const structureT = bandT(reveal, STAGES.structure);
  const floorsT = bandT(reveal, STAGES.floors);
  const facadeT = bandT(reveal, STAGES.facade);
  const windowsT = bandT(reveal, STAGES.windows);
  const systemsT = bandT(reveal, STAGES.systems);
  const completionT = bandT(reveal, STAGES.completion);
  const heightT = skeletonHeightT(reveal); // frame height, shared by Skeleton/Floors/Windows

  // A single shared material for all 4 hoarding panels — LAUVO
  // consolidation pass: previously this was one solid box rendered in
  // `wireframe` mode, which read as a "WebGL demo schematic" AND, if
  // simply switched to a solid material without changing geometry,
  // would have become an opaque box hiding the entire construction
  // inside it. Four separate wall panels forming an open perimeter (not
  // a closed box) fixes both problems: a real, lit site fence you can
  // still see the building through.
  const hoardingMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#181b21', roughness: 0.85, metalness: 0.1, transparent: true, opacity: 0.9 }),
    []
  );

  useFrame((_, delta) => {
    if (siteLight.current) {
      // warm site light peaks while the frame is actively rising, then
      // settles once the building has its own elegant lighting (windows)
      const target = 6 + Math.min(1, foundationT + structureT + floorsT) * 20 - windowsT * 8;
      siteLight.current.intensity = THREE.MathUtils.damp(siteLight.current.intensity, Math.max(6, target), 3, delta);
    }
    // the fenced lot fades out once real structure is visible — it's a
    // building site becoming a building, not a permanent fixture
    const hoardingTarget = (1 - THREE.MathUtils.clamp(floorsT, 0, 1)) * 0.9;
    hoardingMaterial.opacity = THREE.MathUtils.damp(hoardingMaterial.opacity, hoardingTarget, 3, delta);

    if (entranceGlowRef.current) {
      entranceGlowRef.current.intensity = THREE.MathUtils.damp(
        entranceGlowRef.current.intensity,
        completionT * 10,
        3,
        delta
      );
    }
  });

  return (
    <group position={[0, 0, -10]}>
      {/* the warm light that makes this spot the one alive point in a cold city */}
      <pointLight ref={siteLight} position={[0, 9, 0]} intensity={6} color="#f2a93b" distance={45} decay={2} />
      <spotLight
        position={[6, 16, 4]}
        angle={0.5}
        penumbra={0.6}
        intensity={18}
        color="#f7c581"
        distance={40}
        castShadow
      />
      {/* elegant, controlled entrance light — at the true ground/podium
          line (GROUND_OFFSET), where the tower actually meets the
          ground — appears only once the building is complete, distinct
          from the site's construction glow */}
      <pointLight
        ref={entranceGlowRef}
        position={[0, GROUND_OFFSET, FOOTPRINT / 2 + 0.5]}
        intensity={0}
        color="#eef0f3"
        distance={8}
        decay={2}
      />
      {/* cool rim light on the far side of the tower — separates it from
          the dark sky and gives the silhouette real depth instead of
          relying on the warm site light alone */}
      <directionalLight position={[-14, 22, -30]} intensity={0.9} color="#9fc2e8" />

      {/* base platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[7, 0.3, 7]} />
        <meshStandardMaterial color="#1a1d23" roughness={0.9} />
      </mesh>

      {/* perimeter hoarding — 4 solid panels forming an open fence, not
          a closed wireframe box */}
      {HOARDING_PANELS.map((side, i) => {
        const { position, args } = hoardingPanelProps(side);
        return (
          <mesh key={i} position={position} material={hoardingMaterial} castShadow>
            <boxGeometry args={args} />
          </mesh>
        );
      })}

      <GhostOutline heightT={heightT} completionT={completionT} />
      <Skeleton heightT={heightT} />
      <Floors heightT={heightT} />
      <Facade facadeT={facadeT} lowDetail={lowDetail} />
      <Windows windowsT={windowsT} heightT={heightT} lowDetail={lowDetail} />
      <RooftopSystems systemsT={systemsT} completionT={completionT} />
      <Crane active={foundationT + structureT + floorsT} completionT={completionT} />
    </group>
  );
}
