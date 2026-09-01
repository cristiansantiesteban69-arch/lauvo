import Stars from './Stars';
import EarthGlobe from './EarthGlobe';

/**
 * DeepSpaceScene
 * Phase 4.2 assembler — mirrors CityScene (city) and ConstructionSite
 * (skyscraper): one folder, one entry component, computing nothing of
 * its own beyond passing `deepSpaceLocal` through. Stars reveal first
 * (the brief's "empiezan a aparecer pocas estrellas"), Earth fades in
 * later and stays a background presence, never the immediate subject.
 * A future "Moon" scene (Phase 5) is added the same way, alongside this
 * one, without touching it.
 */
export default function DeepSpaceScene({ deepSpaceLocal = 0, lowDetail = false }) {
  return (
    <group>
      <Stars reveal={deepSpaceLocal} lowDetail={lowDetail} />
      <EarthGlobe reveal={deepSpaceLocal} lowDetail={lowDetail} />
    </group>
  );
}
