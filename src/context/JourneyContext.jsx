import { createContext, useContext, useMemo, useRef, useState } from 'react';

/**
 * JourneyContext
 * Single source of truth for "how far into the Earth -> Moon journey" the
 * visitor has scrolled (0 to 1). Every 3D scene and overlay section reads
 * from here instead of tracking scroll independently, so phases can be
 * built and tested in isolation and later wired into the same timeline.
 *
 * progress: number 0-1, overall journey position
 * setProgress: updater, called by the scroll driver (built in Phase 1)
 * phase: which named beat we're in, derived from progress ranges
 */

const JourneyCtx = createContext(null);

// Named ranges along the 0-1 timeline. Adjusted as each phase is built.
export const JOURNEY_PHASES = [
  { id: 'earth', from: 0, to: 0.15 },
  { id: 'city', from: 0.15, to: 0.3 },
  { id: 'skyscraper', from: 0.3, to: 0.65 },
  { id: 'ascent', from: 0.65, to: 0.85 },
  { id: 'moon', from: 0.85, to: 1 },
];

function resolvePhase(progress) {
  const found = JOURNEY_PHASES.find((p) => progress >= p.from && progress < p.to);
  return found ? found.id : JOURNEY_PHASES[JOURNEY_PHASES.length - 1].id;
}

export function JourneyProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const value = useMemo(
    () => ({
      progress,
      setProgress: (v) => {
        progressRef.current = v;
        setProgress(v);
      },
      progressRef,
      phase: resolvePhase(progress),
    }),
    [progress]
  );

  return <JourneyCtx.Provider value={value}>{children}</JourneyCtx.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyCtx);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}
