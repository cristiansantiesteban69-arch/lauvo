import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useJourney } from '../context/JourneyContext';

gsap.registerPlugin(ScrollTrigger);

/**
 * useJourneyScroll
 * Drives JourneyContext.progress from a single ScrollTrigger scrubbed
 * against the journey track element, instead of each scene/section
 * listening to native scroll independently. Replaces the Phase 0
 * placeholder (native scroll listener) now that GSAP is in use.
 *
 * trackRef must point to the element spanning the full scrollable journey
 * (see App.jsx). scrub smooths the mapping so the cinematic motion doesn't
 * feel tied 1:1 to jittery trackpad/wheel deltas.
 */
export function useJourneyScroll(trackRef) {
  const { setProgress } = useJourney();

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => setProgress(self.progress),
    });

    return () => trigger.kill();
  }, [setProgress, trackRef]);
}
