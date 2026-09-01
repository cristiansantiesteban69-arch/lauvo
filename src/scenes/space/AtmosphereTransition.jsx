import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// City/ground-level atmosphere (matches Experience.jsx's initial <fog>/
// <color> values), the "edge of the atmosphere" target reached at the
// end of Phase 4.1's ascent, and the "deep space" target reached at the
// end of Phase 4.2 — each stage picks up exactly where the previous
// one's target left off, so the whole sequence reads as one continuous
// darkening rather than three separate looks.
const CITY_FOG_COLOR = new THREE.Color('#0d1219');
const CITY_FOG_NEAR = 18;
const CITY_FOG_FAR = 110;
const CITY_SKY_TOP = new THREE.Color('#050710');
const CITY_SKY_BOTTOM = new THREE.Color('#141a26');

const ASCENT_FOG_COLOR = new THREE.Color('#04050c');
const ASCENT_FOG_NEAR = 260;
const ASCENT_FOG_FAR = 900;
const ASCENT_SKY_TOP = new THREE.Color('#020208');
const ASCENT_SKY_BOTTOM = new THREE.Color('#070a14');

// Deep space: fog pushed far enough out that it has virtually no visible
// effect (a vacuum doesn't scatter light), and the sky dome flattens
// toward a near-black so the star field (rendered on top, additive) does
// the work of filling the sky instead of a lit gradient competing with it.
const DEEP_SPACE_FOG_COLOR = new THREE.Color('#000000');
const DEEP_SPACE_FOG_NEAR = 2000;
const DEEP_SPACE_FOG_FAR = 4200;
const DEEP_SPACE_SKY_TOP = new THREE.Color('#000000');
const DEEP_SPACE_SKY_BOTTOM = new THREE.Color('#02040a');

/**
 * AtmosphereTransition
 * Drives the scene's fog and SkyDome gradient through two chained
 * transitions, each keyed to its own local progress value:
 *  - `ascentLocal` (Phase 4.1): city → edge-of-atmosphere
 *  - `deepSpaceLocal` (Phase 4.2): edge-of-atmosphere → deep space
 * `deepSpaceLocal` only starts moving once `ascentLocal` has fully
 * reached 1 (see journeyMap.js), so there is never a moment where both
 * transitions are "active" at once — this stays one continuous lerp
 * chain, not two competing systems. No new geometry: this only mutates
 * the scene's existing fog and the SkyDome material already mounted by
 * CityScene (found by name once, not prop-drilled).
 */
export default function AtmosphereTransition({ ascentLocal = 0, deepSpaceLocal = 0 }) {
  const { scene } = useThree();
  const skyMaterialRef = useRef(null);
  const smoothedAscent = useRef(0);
  const smoothedDeepSpace = useRef(0);

  useEffect(() => {
    const dome = scene.getObjectByName('sky-dome');
    skyMaterialRef.current = dome?.material ?? null;
  }, [scene]);

  useFrame((_, delta) => {
    smoothedAscent.current = THREE.MathUtils.damp(smoothedAscent.current, ascentLocal, 2.5, delta);
    smoothedDeepSpace.current = THREE.MathUtils.damp(smoothedDeepSpace.current, deepSpaceLocal, 2.5, delta);
    const a = smoothedAscent.current;
    const d = smoothedDeepSpace.current;

    const fogColor = new THREE.Color().copy(CITY_FOG_COLOR).lerp(ASCENT_FOG_COLOR, a).lerp(DEEP_SPACE_FOG_COLOR, d);
    const near = THREE.MathUtils.lerp(THREE.MathUtils.lerp(CITY_FOG_NEAR, ASCENT_FOG_NEAR, a), DEEP_SPACE_FOG_NEAR, d);
    const far = THREE.MathUtils.lerp(THREE.MathUtils.lerp(CITY_FOG_FAR, ASCENT_FOG_FAR, a), DEEP_SPACE_FOG_FAR, d);
    const skyTop = new THREE.Color().copy(CITY_SKY_TOP).lerp(ASCENT_SKY_TOP, a).lerp(DEEP_SPACE_SKY_TOP, d);
    const skyBottom = new THREE.Color()
      .copy(CITY_SKY_BOTTOM)
      .lerp(ASCENT_SKY_BOTTOM, a)
      .lerp(DEEP_SPACE_SKY_BOTTOM, d);

    if (scene.fog) {
      scene.fog.color.copy(fogColor);
      scene.fog.near = near;
      scene.fog.far = far;
    }

    if (scene.background?.isColor) {
      scene.background.copy(skyTop);
    }

    const skyMat = skyMaterialRef.current;
    if (skyMat) {
      skyMat.uniforms.topColor.value.copy(skyTop);
      skyMat.uniforms.bottomColor.value.copy(skyBottom);
    }
  });

  return null;
}
