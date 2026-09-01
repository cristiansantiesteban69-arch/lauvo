/**
 * journeyMap
 * The shared JourneyContext `progress` (0-1) covers the entire current
 * journey-track. As each phase adds content, this file gains one more
 * named segment + a `<segment>Local()` re-normalizer — the pattern
 * introduced in Phase 2 (buildingLocal), extended for Phase 4.1
 * (ascentLocal), and now extended again for Phase 4.2 (deepSpaceLocal):
 *
 *  - [0, HERO_END]              hero pinned + city establishing/approach
 *  - [HERO_END, BUILDING_END]   the skyscraper construction narrative (Ph. 2-3)
 *  - [BUILDING_END, ASCENT_END] Phase 4.1: ascent away from the finished tower
 *  - [ASCENT_END, 1]            Phase 4.2: deep space (stars, distant Earth)
 *
 * Phase 4.2 note: adding the deep-space segment meant the journey-track
 * grew longer again (see global.css), which shifts what a given raw
 * `progress` number means for existing content — exactly the same
 * situation Phase 4.1 solved by introducing BUILDING_END. The fix is the
 * same pattern applied one level deeper: HERO_END and BUILDING_END are
 * rescaled by the same factor (ASCENT_END) so buildingLocal keeps
 * producing identical output for the same absolute scroll distance, and
 * ascentLocal's own segment [BUILDING_END, ASCENT_END] is now bounded
 * instead of open-ended, so it too keeps producing identical output for
 * progress within its (unchanged) physical scroll range. Any camera
 * keyframe still expressed in raw `progress` had to be rescaled the same
 * way — done in CameraRig.jsx.
 *
 * deepSpaceLocal() re-normalizes the new tail segment to its own 0-1
 * range, the same way ascentLocal() did for its segment, so a future
 * "DEEP_SPACE_END" boundary can be introduced later (Phase 5: Moon)
 * without touching this segment's math.
 */

// Phase 4.2 scaling factor: the journey-track's total height before this
// phase (i.e. right after Phase 4.1) divided by its new total height
// after adding room for deep space. Every constant below that predates
// Phase 4.2 is multiplied by this factor once.
const DEEP_SPACE_SCALE = 2 / 3;

export const HERO_END = 0.0512 * DEEP_SPACE_SCALE;

// Marks the end of the Phase 2-3 skyscraper narrative / start of Phase 4.
// See the derivation comment this constant originally shipped with
// (Phase 4.1): BUILDING_END = OLD_TOTAL / NEW_TOTAL at the time. Now
// rescaled by DEEP_SPACE_SCALE for the same reason HERO_END is above.
export const BUILDING_END = 0.64 * DEEP_SPACE_SCALE;

// Marks the end of the Phase 4.1 ascent-only track / start of Phase 4.2
// (deep space). journey-track grew from 3750vh to... wait, see below:
// concretely, journey-track grew from 2500vh to 3750vh (desktop) to make
// room for Phase 4.2, so ASCENT_END = 2500/3750 = 2/3 — the same ratio
// as DEEP_SPACE_SCALE above (this segment boundary IS that scale factor,
// by definition: it marks where the pre-Phase-4.2 track used to end).
export const ASCENT_END = DEEP_SPACE_SCALE;

export function buildingLocal(progress) {
  return Math.min(1, Math.max(0, (progress - HERO_END) / (BUILDING_END - HERO_END)));
}

/**
 * ascentLocal
 * 0 = still at the finished-tower hero shot (end of Phase 2-3), 1 = as
 * far as the Phase 4.1 ascent goes (now a bounded segment ending at
 * ASCENT_END, where Phase 4.2 picks up). Values above ASCENT_END pin
 * this to 1, matching how buildingLocal pins to 1 once its own segment
 * is behind us.
 */
export function ascentLocal(progress) {
  return Math.min(1, Math.max(0, (progress - BUILDING_END) / (ASCENT_END - BUILDING_END)));
}

/**
 * deepSpaceLocal
 * 0 = right where Phase 4.1's ascent left off, 1 = as far as Phase 4.2
 * currently goes. For progress below ASCENT_END this is pinned to 0 (deep
 * space hasn't started), matching the same pattern as the segments above.
 */
export function deepSpaceLocal(progress) {
  return Math.min(1, Math.max(0, (progress - ASCENT_END) / (1 - ASCENT_END)));
}
