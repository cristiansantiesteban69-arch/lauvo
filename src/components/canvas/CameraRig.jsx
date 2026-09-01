import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useJourney } from '../../context/JourneyContext';
import { BUILDING_END, ASCENT_END } from '../../lib/journeyMap';

// Named camera keyframes across the FULL shared journey progress (0-1).
// The first two live in the hero/city-approach segment (see
// src/lib/journeyMap.js); the rest track the skyscraper as it rises,
// staying wide enough to keep the whole tower in frame instead of
// pushing in close and breaking the composition.
//
// Phase 3 note: an extra keyframe (p=0.40) was added mid-"floors" stage —
// previously the camera interpolated in one long, unbroken arc across
// the entire floors band (buildingLocal ~0.25-0.45, a large share of the
// scroll), which read as a dead stretch with no camera change while the
// building was visibly still under construction. This keyframe gives a
// proper vertical follow shot alongside the rising floors instead.
//
// Phase 3 (Facade+Life+Summit pass): the same problem existed between
// p=0.5 and p=0.7 — one arc spanning the entire "facade" band plus the
// start of "windows/life", so the facade never got its own distinct
// camera beat ("acercamiento y lectura de la envolvente" per brief).
// Added p=0.58 for a closer read of the glass/mullion envelope before
// pulling back into the wider windows/life orbit at p=0.7. The final two
// keyframes were also raised slightly (pos/look y) because the crane
// mast and rooftop antenna now sit above FINAL_HEIGHT (~30) — the old
// framing, sized for a shorter Phase-1 crane, would have clipped them
// out of the final hero shot.
//
// Phase 4 note: these `p` values were all originally expressed against a
// journey-track that ended right after the finished-tower hero shot. To
// make room for Phase 4's ascent, that track grew longer (see
// global.css), which means the same absolute scroll distance now maps to
// a SMALLER raw-progress number. Every keyframe below is rescaled by
// `BUILDING_END` (0.64) so each one still happens at exactly the same
// physical scroll position as before — no jump, no re-tuning of the
// Phase 1-3 camera path. The ascent keyframes are appended afterward in
// the new [BUILDING_END, 1] segment, picking up from the exact position
// the old final keyframe ended on.
//
// Phase 4.2 note: the same rescale happens one level deeper below (see
// PRE_DEEP_SPACE_KEYFRAMES) — the whole array below (Phases 1-3 + 4.1)
// gets multiplied by `ASCENT_END` this time, for the same reason.
const PRE_ASCENT_KEYFRAMES = [
  { p: 0, pos: [0, 9, 30], look: [0, 4, -6], fov: 48, roll: 0 },
  { p: 0.06, pos: [7, 6, 14], look: [0, 4, -8], fov: 45, roll: 0.006 },
  { p: 0.14, pos: [4.5, 3.6, 9], look: [0, 3, -10], fov: 42, roll: 0 }, // foundation / structure begin
  { p: 0.3, pos: [7, 10, 14], look: [0, 9, -10], fov: 44, roll: -0.006 }, // structure completing, floors beginning
  { p: 0.4, pos: [5.5, 13.5, 9], look: [0, 13, -10], fov: 43, roll: 0.003 }, // vertical follow as floors rise
  { p: 0.5, pos: [10, 14, 17], look: [0, 14, -10], fov: 45, roll: 0.004 }, // facade: wide arrival
  { p: 0.58, pos: [4, 15, 8], look: [0, 15, -9], fov: 40, roll: -0.003 }, // facade: close read of the envelope
  { p: 0.7, pos: [-8, 17, 15], look: [0, 17, -10], fov: 44, roll: -0.004 }, // life: orbit to the other side, windows + light
  { p: 0.9, pos: [2, 24, 30], look: [0, 21, -10], fov: 42, roll: 0 }, // summit: pulling back for scale, roof coming into view
  { p: 1, pos: [17, 21, 36], look: [0, 18, -8], fov: 38, roll: 0 }, // completed landmark, wide hero shot — ascent starts exactly here
].map((k) => ({ ...k, p: k.p * BUILDING_END }));

// Phase 4.1 — ASCENT / CITY TO SKY. Raw p values live in [BUILDING_END, 1].
// The building stays framed at first (first keyframe here matches the
// pre-ascent final shot almost exactly, just easing the pull-back
// already in motion), then the camera rises and pulls back in stages so
// the tower gradually shrinks from protagonist to one shape among many,
// then the whole city becomes readable, then the view widens further as
// if the ground itself is dropping away. fov opens up gradually (a wider
// lens reads as "more world becoming visible") instead of staying fixed.
const ASCENT_KEYFRAMES = [
  { p: BUILDING_END + 0.08, pos: [26, 34, 50], look: [0, 15, -14], fov: 42, roll: 0.004 }, // lifting off, tower still clearly the subject
  { p: BUILDING_END + 0.18, pos: [18, 60, 82], look: [0, 6, -20], fov: 46, roll: -0.003 }, // city spreading into view, tower now one of many
  { p: BUILDING_END + 0.28, pos: [-12, 105, 135], look: [0, -6, -28], fov: 49, roll: 0.003 }, // whole city readable, ground starting to recede
  { p: 1, pos: [4, 170, 220], look: [0, -25, -40], fov: 52, roll: 0 }, // high above the city, atmosphere thinning, edge of this stage
];

// Phase 4.2 note: everything above (Phases 1-3 + the 4.1 ascent) was
// expressed against a journey-track that ended right at the edge of the
// atmosphere. To make room for deep space, that track grew longer again
// (see global.css), so — same fix as before — every keyframe above is
// rescaled by `ASCENT_END` (2/3) to keep it at exactly the same physical
// scroll position. The deep-space keyframes are appended in the new
// [ASCENT_END, 1] segment.
const PRE_DEEP_SPACE_KEYFRAMES = [...PRE_ASCENT_KEYFRAMES, ...ASCENT_KEYFRAMES].map((k) => ({
  ...k,
  p: k.p * ASCENT_END,
}));

// Phase 4.2 — DEEP SPACE. Raw p values live in [ASCENT_END, 1]. The
// camera keeps doing exactly what it was already doing (rising, pulling
// back, opening the lens) rather than switching to a new kind of motion —
// "atravesar la atmósfera" should feel like a continuation of the ascent,
// not a mode change. Composition drifts gradually toward the distant
// Earth (see scenes/space/EarthGlobe) without ever centering it hard —
// it stays a presence at the edge of frame, not the subject, per the
// brief ("no debe convertirse en el centro de atención inmediatamente").
const DEEP_SPACE_KEYFRAMES = [
  { p: ASCENT_END + 0.06, pos: [20, 260, 340], look: [0, -40, -60], fov: 54, roll: 0.003 }, // clearing the last of the atmosphere, first faint stars
  { p: ASCENT_END + 0.14, pos: [60, 420, 520], look: [10, -90, -90], fov: 56, roll: -0.002 }, // deep space opening up, star field thickening
  { p: ASCENT_END + 0.22, pos: [140, 600, 680], look: [60, -260, -160], fov: 58, roll: 0.002 }, // drifting toward where Earth is fading into view
  { p: 1, pos: [260, 760, 860], look: [60, -500, -260], fov: 60, roll: 0 }, // wide, open composition — Earth present but small, room left for what comes next
];

const KEYFRAMES = [...PRE_DEEP_SPACE_KEYFRAMES, ...DEEP_SPACE_KEYFRAMES];

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function sampleKeyframes(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (clamped >= a.p && clamped <= b.p) {
      const eased = smoothstep((clamped - a.p) / (b.p - a.p || 1));
      return {
        pos: a.pos.map((v, idx) => THREE.MathUtils.lerp(v, b.pos[idx], eased)),
        look: a.look.map((v, idx) => THREE.MathUtils.lerp(v, b.look[idx], eased)),
        fov: THREE.MathUtils.lerp(a.fov, b.fov, eased),
        roll: THREE.MathUtils.lerp(a.roll, b.roll, eased),
      };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { pos: last.pos, look: last.look, fov: last.fov, roll: last.roll };
}

export default function CameraRig() {
  const { progressRef } = useJourney();
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 4, -6));
  const currentFov = useRef(48);
  const currentRoll = useRef(0);

  useFrame((state, delta) => {
    const { pos, look, fov, roll } = sampleKeyframes(progressRef.current);

    const damp = 3.4;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos[0], damp, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos[1], damp, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos[2], damp, delta);

    lookTarget.current.x = THREE.MathUtils.damp(lookTarget.current.x, look[0], damp, delta);
    lookTarget.current.y = THREE.MathUtils.damp(lookTarget.current.y, look[1], damp, delta);
    lookTarget.current.z = THREE.MathUtils.damp(lookTarget.current.z, look[2], damp, delta);

    currentFov.current = THREE.MathUtils.damp(currentFov.current, fov, damp, delta);
    currentRoll.current = THREE.MathUtils.damp(currentRoll.current, roll, damp, delta);

    // a barely-perceptible handheld drift keeps the shot from feeling like
    // a locked-off render, without reading as shaky-cam
    const driftX = Math.sin(state.clock.elapsedTime * 0.18) * 0.03;
    const driftY = Math.cos(state.clock.elapsedTime * 0.13) * 0.02;

    camera.lookAt(
      lookTarget.current.x + driftX,
      lookTarget.current.y + driftY,
      lookTarget.current.z
    );
    camera.rotation.z = currentRoll.current;

    if (camera.isPerspectiveCamera && Math.abs(camera.fov - currentFov.current) > 0.01) {
      camera.fov = currentFov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
