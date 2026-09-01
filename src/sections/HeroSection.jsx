import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * HeroSection
 * The first real screen of the site. Pinned in place with GSAP while the
 * city establishing shot plays behind it, then released as the visitor
 * scrolls into the approach toward the construction site. Title lines
 * reveal through a masked wipe (not a plain fade) for a more premium,
 * "studio reel" feel.
 */
export default function HeroSection() {
  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const cueRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // entrance choreography, once on mount
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(eyebrowRef.current, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.7 })
        .fromTo(line1Ref.current, { yPercent: 115 }, { yPercent: 0, duration: 1.1 }, '-=0.3')
        .fromTo(line2Ref.current, { yPercent: 115 }, { yPercent: 0, duration: 1.1 }, '-=0.9')
        .fromTo(subRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
          '-=0.5'
        )
        .fromTo(cueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3');

      // pin the hero while the city establishing shot plays, then release
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=60%',
        pin: true,
        pinSpacing: false,
        scrub: false,
      });

      // fade + settle the hero content out as it approaches release —
      // slight scale-down reads as the camera pulling away, not a UI fade
      gsap.to(sectionRef.current.querySelectorAll('.hero-fade-out'), {
        opacity: 0,
        y: -36,
        scale: 0.98,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=60%',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  function handleExplore() {
    window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
  }

  return (
    <section ref={sectionRef} className="section section--hero">
      <p ref={eyebrowRef} className="hero-eyebrow hero-fade-out">
        <span className="hero-eyebrow__line" />
        From earth to the moon
      </p>
      <h1 className="hero-title hero-fade-out">
        <span className="hero-title__mask">
          <span ref={line1Ref} className="hero-title__line">
            We build
          </span>
        </span>
        <span className="hero-title__mask">
          <span ref={line2Ref} className="hero-title__line">
            digital worlds.
          </span>
        </span>
      </h1>
      <p ref={subRef} className="hero-sub hero-fade-out">
        Websites. 3D experiences. Digital systems. Automation. AI.
      </p>
      <div ref={ctaRef} className="hero-cta-group hero-fade-out">
        <button type="button" className="btn btn--primary" onClick={handleExplore}>
          <span>Build something</span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleExplore}>
          <span>Explore</span>
        </button>
      </div>
      <div ref={cueRef} className="scroll-cue hero-fade-out" aria-hidden="true">
        <span className="scroll-cue__label">Scroll</span>
        <span className="scroll-cue__line" />
      </div>
    </section>
  );
}
