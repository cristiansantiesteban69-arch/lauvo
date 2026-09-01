import CityBlocks from './CityBlocks';
import SkyDome from './SkyDome';

/**
 * CityScene
 * The Earth/City beat: gradient sky, ground plane, near+far procedural
 * skyline, and moody directional lighting. The lighting is deliberately
 * split into two temperatures — a cold ambient/key wash over the whole
 * city, and a single warm source reserved for the construction site — so
 * the build site reads as the one warm, alive point in a cold skyline.
 */
export default function CityScene({ lowDetail = false }) {
  return (
    <group>
      <SkyDome />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0b0e13" roughness={1} metalness={0} />
      </mesh>

      <CityBlocks lowDetail={lowDetail} />

      {/* cool "moonlight" key light over the whole city */}
      <directionalLight
        position={[-18, 24, 12]}
        intensity={1.25}
        color="#a9c2e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* cold ambient fill — kept low so the warm site light reads as contrast */}
      <ambientLight intensity={0.16} color="#3d6fa8" />
      {/* faint cool rim from behind, adds separation between buildings and sky */}
      <directionalLight position={[10, 6, -20]} intensity={0.25} color="#5b7fb0" />
    </group>
  );
}
