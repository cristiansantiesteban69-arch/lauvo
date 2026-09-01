/**
 * buildingConfig
 * Single source of numeric truth for the Phase 2 skyscraper, so
 * Skeleton/Floors/Facade/Windows/GhostOutline/CameraRig all agree on the
 * same dimensions and construction stage boundaries instead of each
 * hard-coding their own numbers.
 *
 * "reveal" throughout the skyscraper scene is BUILDING_LOCAL progress:
 * 0 = the site is still an empty lot, 1 = the skyscraper is finished.
 * See ConstructionSite.jsx for how this is derived from the shared
 * JourneyContext progress.
 */

export const FLOOR_COUNT = 16;
export const FLOOR_HEIGHT = 1.9;
export const FINAL_HEIGHT = FLOOR_COUNT * FLOOR_HEIGHT; // 30.4 — height of the floor stack itself
export const FOOTPRINT = 4.6; // building width/depth at the base

// LAUVO consolidation: the podium (a wider grounding slab under the
// tower shaft — see Skeleton.jsx) sits between true ground (y=0) and
// where floor 0 begins. Every component that positions something by
// floor index (Floors, Facade, Windows) or by absolute building height
// (RooftopSystems, GhostOutline) must add GROUND_OFFSET, or it will
// misalign with the podium/columns introduced in Skeleton.jsx.
export const PODIUM_BASE_Y = 0.3; // sits on top of ConstructionSite's 0.3-tall base platform
export const PODIUM_HEIGHT = 1.1;
export const GROUND_OFFSET = PODIUM_BASE_Y + PODIUM_HEIGHT; // 1.4 — y where floor 0 begins
export const TOTAL_HEIGHT = GROUND_OFFSET + FINAL_HEIGHT; // true ground-to-roof height, ~31.8

// Construction stages as fractions of BUILDING_LOCAL (0-1), following the
// brief's approximate percentages.
export const STAGES = {
  foundation: [0, 0.1],
  structure: [0.1, 0.25],
  floors: [0.25, 0.45],
  facade: [0.45, 0.6],
  windows: [0.6, 0.75],
  systems: [0.75, 0.9],
  completion: [0.9, 1],
};

/** Progress (0-1) within a named stage band, clamped. */
export function bandT(local, [from, to]) {
  if (to <= from) return local >= from ? 1 : 0;
  return Math.min(1, Math.max(0, (local - from) / (to - from)));
}

// The skeleton (corner columns + core + ring beams) finishes rising by
// the end of the "floors" stage — everything after that is skin/detail
// added on top of an already-complete frame, matching the brief's
// foundation -> structure -> floors -> facade -> windows -> systems ->
// completion sequence.
export function skeletonHeightT(local) {
  return Math.min(1, Math.max(0, local / STAGES.floors[1]));
}
