/**
 * Layout
 * Three-layer structure used across the whole site:
 *  - a fixed full-viewport layer for the 3D canvas (Experience)
 *  - a fixed cinematic vignette/grain layer that sits between the canvas
 *    and the content, adding depth and keeping text legible over the 3D
 *    scene without any extra render cost (pure CSS, no draw calls)
 *  - a scrollable layer for HTML sections/overlays that sit on top
 * Sections in src/sections/ are the only place page copy and DOM UI live;
 * they read scroll progress from JourneyContext to sync with the 3D layer.
 *
 * LAUVO consolidation: a persistent brand mark now lives here (not in
 * HeroSection) because it needs to stay visible for the entire scroll,
 * not just the hero — the same anchor point a future full navigation
 * menu (brief section 9) will attach to.
 */
export default function Layout({ canvas, children }) {
  return (
    <>
      {canvas}
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="brand-mark">LAUVO</div>
      <main className="journey-content">{children}</main>
    </>
  );
}
