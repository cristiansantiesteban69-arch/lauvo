import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { useJourney } from '../../context/JourneyContext';
import { buildingLocal, ascentLocal, deepSpaceLocal } from '../../lib/journeyMap';
import { isLowDetailDevice } from '../../lib/device';
import CityScene from '../../scenes/city/CityScene';
import ConstructionSite from '../../scenes/skyscraper/ConstructionSite';
import AtmosphereTransition from '../../scenes/space/AtmosphereTransition';
import DeepSpaceScene from '../../scenes/space/DeepSpaceScene';
import CameraRig from './CameraRig';
import AtmosphereDust from './AtmosphereDust';

/**
 * Experience
 * The single WebGL canvas for the whole site, fixed behind the scrollable
 * HTML content. Renders the city + a fully constructible skyscraper (see
 * scenes/skyscraper/ConstructionSite and buildingConfig), the Phase 4.1
 * ascent away from it, and — from Phase 4.2 — deep space (stars, distant
 * Earth; see scenes/space/DeepSpaceScene). Phase 5 (Moon) adds a scene
 * the same way, without touching this assembly point.
 */
export default function Experience() {
  const { progress } = useJourney();
  const lowDetail = useMemo(() => isLowDetailDevice(), []);

  // BUILDING_LOCAL: 0 = empty site, 1 = finished skyscraper.
  // ASCENT_LOCAL: 0 = still at the finished-tower hero shot, 1 = as far
  // as the Phase 4.1 ascent goes.
  // DEEP_SPACE_LOCAL: 0 = right where the ascent left off, 1 = as far as
  // Phase 4.2 currently goes. See src/lib/journeyMap.js.
  const reveal = buildingLocal(progress);
  const ascent = ascentLocal(progress);
  const deepSpace = deepSpaceLocal(progress);

  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        shadows={!lowDetail}
        camera={{ position: [0, 9, 30], fov: 45, near: 0.1, far: 4200 }}
        dpr={lowDetail ? [1, 1] : [1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050710']} />
        <fog attach="fog" args={['#0d1219', 18, 110]} />
        <Suspense fallback={null}>
          <CityScene lowDetail={lowDetail} />
          <ConstructionSite reveal={reveal} lowDetail={lowDetail} />
          <AtmosphereDust lowDetail={lowDetail} />
          <AtmosphereTransition ascentLocal={ascent} deepSpaceLocal={deepSpace} />
          <DeepSpaceScene deepSpaceLocal={deepSpace} lowDetail={lowDetail} />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
