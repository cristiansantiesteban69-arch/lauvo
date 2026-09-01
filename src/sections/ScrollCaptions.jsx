import { useJourney } from '../context/JourneyContext';
import { buildingLocal, ascentLocal, deepSpaceLocal } from '../lib/journeyMap';

// Framed as blueprint-style annotations (index + label + one short line)
// rather than plain floating copy, matching the "engineering" aesthetic.
// Each caption's `from`/`to` window is expressed against whichever local
// progress its `space` says — 'building' (buildingLocal, 0-1 across the
// construction narrative) for 01-06, 'ascent' (ascentLocal, Phase 4.1)
// for 07, 'deepSpace' (deepSpaceLocal, Phase 4.2) for 08-09. Phase 3:
// "Floors" (03) split out of what was previously a single wide
// "Structure" window, so the floors-rising stretch of scroll gets its
// own narrative beat instead of trailing under the structure caption.
//
// Phase 4: captions 07-09 are placeholder/provisional narrative text
// only — no commercial content, no company name — matching the brief's
// request for temporary captions during Phase 4 using the existing
// system.
const CAPTIONS = [
  {
    id: 'foundation',
    index: '01',
    label: 'Foundation',
    text: 'Every great digital experience starts with a strong foundation.',
    space: 'building',
    from: 0.02,
    to: 0.2,
  },
  {
    id: 'structure',
    index: '02',
    label: 'Structure',
    text: 'Build the system behind the experience.',
    space: 'building',
    from: 0.22,
    to: 0.32,
  },
  {
    id: 'floors',
    index: '03',
    label: 'Floors',
    text: 'Every floor adds another layer to the experience.',
    space: 'building',
    from: 0.34,
    to: 0.43,
  },
  {
    id: 'design',
    index: '04',
    label: 'Design',
    text: 'Make it impossible to ignore.',
    space: 'building',
    from: 0.46,
    to: 0.58,
  },
  {
    id: 'development',
    index: '05',
    label: 'Development',
    text: 'Where ideas become reality.',
    space: 'building',
    from: 0.61,
    to: 0.83,
  },
  {
    id: 'interaction',
    index: '06',
    label: 'Interaction',
    text: 'Make digital feel alive.',
    space: 'building',
    from: 0.86,
    to: 1,
  },
  {
    id: 'ascent',
    index: '07',
    label: 'Ascent',
    text: 'Leaving the ground behind.',
    space: 'ascent',
    from: 0.08,
    to: 0.55,
  },
  {
    id: 'deep-space',
    index: '08',
    label: 'Deep space',
    text: 'The atmosphere is behind us now.',
    space: 'deepSpace',
    from: 0.06,
    to: 0.3,
  },
  {
    id: 'earth',
    index: '09',
    label: 'Earth',
    text: 'This is where we started.',
    space: 'deepSpace',
    from: 0.45,
    to: 0.95,
  },
];

function windowProgress(local, from, to) {
  const fadeIn = 0.04;
  if (local < from - fadeIn || local > to) return 0;
  if (local < from) return (local - (from - fadeIn)) / fadeIn;
  if (local > to - fadeIn) return Math.max(0, (to - local) / fadeIn);
  return 1;
}

export default function ScrollCaptions() {
  const { progress } = useJourney();
  const localBySpace = {
    building: buildingLocal(progress),
    ascent: ascentLocal(progress),
    deepSpace: deepSpaceLocal(progress),
  };

  return (
    <div className="scroll-captions" aria-hidden="true">
      {CAPTIONS.map((c) => {
        const t = windowProgress(localBySpace[c.space], c.from, c.to);
        return (
          <div
            key={c.id}
            className="scroll-caption"
            style={{ opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}
          >
            <span className="scroll-caption__index">{c.index}</span>
            <span className="scroll-caption__rule" />
            <span className="scroll-caption__text">
              <span className="scroll-caption__label">{c.label}</span>
              {c.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
