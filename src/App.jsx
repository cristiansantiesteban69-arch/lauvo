import { useRef } from 'react';
import { JourneyProvider } from './context/JourneyContext';
import Layout from './components/layout/Layout';
import Experience from './components/canvas/Experience';
import HeroSection from './sections/HeroSection';
import ScrollCaptions from './sections/ScrollCaptions';
import { useJourneyScroll } from './hooks/useJourneyScroll';
import './styles/global.css';

function JourneyTrack({ children }) {
  const trackRef = useRef(null);
  useJourneyScroll(trackRef);

  return (
    <div ref={trackRef} className="journey-track">
      {children}
    </div>
  );
}

function App() {
  return (
    <JourneyProvider>
      <Layout canvas={<Experience />}>
        <JourneyTrack>
          <HeroSection />
          <ScrollCaptions />
          {/* No extra spacer needed — journey-track's height (see
              global.css) is what gives the skyscraper construction its
              scroll length. Future phases (space/moon/etc.) extend that
              height further as their content is added. */}
        </JourneyTrack>
      </Layout>
    </JourneyProvider>
  );
}

export default App;
