/**
 * isLowDetailDevice
 * A simple, one-time-at-mount check (not a reactive media query) used to
 * decide construction counts for InstancedMesh components — those counts
 * are fixed at creation time, so this is read once via useMemo(() => ...,
 * []) rather than tracked across resizes. Good enough for "reduce detail
 * on phones", not meant to handle live orientation/viewport changes.
 */
export function isLowDetailDevice() {
  if (typeof window === 'undefined') return false;
  const narrow = window.innerWidth < 700;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return narrow || Boolean(reducedMotion);
}
