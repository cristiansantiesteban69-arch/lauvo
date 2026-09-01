import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

const JourneyCtx = createContext(null);

export const JOURNEY_PHASES = [
  { id: 'earth', from: 0, to: 0.15 },
  { id: 'city', from: 0.15, to: 0.3 },
  { id: 'skyscraper', from: 0.3, to: 0.65 },
  { id: 'ascent', from: 0.65, to: 0.85 },
  { id: 'moon', from: 0.85, to: 1 },
];

function resolvePhase(progress) {
  const found = JOURNEY_PHASES.find(
    (p) => progress >= p.from && progress < p.to
  );

  return found
    ? found.id
    : JOURNEY_PHASES[JOURNEY_PHASES.length - 1].id;
}

export function JourneyProvider({ children }) {
  const [progress, setProgressState] = useState(0);
  const progressRef = useRef(0);

  const setProgress = useCallback((value) => {
    progressRef.current = value;
    setProgressState(value);
  }, []);

  const value = useMemo(
    () => ({
      progress,
      setProgress,
      progressRef,
      phase: resolvePhase(progress),
    }),
    [progress, setProgress]
  );

  return (
    <JourneyCtx.Provider value={value}>
      {children}
    </JourneyCtx.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyCtx);

  if (!ctx) {
    throw new Error('useJourney must be used within JourneyProvider');
  }

  return ctx;
}
