import React, { useRef, useState, useMemo, Suspense } from 'react'; // Removed 'useEffect'
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
// REMOVED: import galaxyTexturePath from './galaxy.jpg'; -- We will load directly from the public folder.

// --- NEW DEEP SPACE SUBSTANCES ---

function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.8, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

function CosmicDust() {
  const pointsRef = useRef();
  const dustTexture = useMemo(() => createDustTexture(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    const count = 2000;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  useFrame((state) => {
    if(pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        attach="material" 
        size={0.2} 
        color="#87CEEB" 
        transparent 
        opacity={0.6}
        sizeAttenuation
        map={dustTexture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function AsteroidBelt() {
  const asteroidRef = useRef();
  
  const asteroids = useMemo(() => {
    const temp = [];
    const count = 1000;
    const radius = 12;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 4;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = (Math.random() - 0.5) * 1;
        temp.push({ 
          position: new THREE.Vector3(x, y, z),
          scale: Math.random() * 0.2 + 0.05,
          rotation: new THREE.Euler(Math.random(), Math.random(), Math.random())
        });
    }
    return temp;
  }, []);

  useFrame((_, delta) => {
    if (asteroidRef.current) {
        asteroidRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={asteroidRef}>
        {asteroids.map((asteroid, i) => (
            <mesh key={i} position={asteroid.position} scale={asteroid.scale} rotation={asteroid.rotation}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#5c5c5c" roughness={0.8} metalness={0.2} />
            </mesh>
        ))}
    </group>
  );
}

// --- CORE & DECORATIVE COMPONENTS ---

function GalaxyBackground() {
  // CORRECTED: Loads the image from the /public folder using a direct URL path.
  const texture = useLoader(THREE.TextureLoader, '/galaxy.jpg');
  return <mesh scale={[-1, 1, 1]}><sphereGeometry args={[200, 64, 64]} /><meshBasicMaterial map={texture} side={THREE.BackSide} /></mesh>;
}

function ExplorerShip() {
    const groupRef = useRef();
    useFrame((_, delta) => { if(groupRef.current) groupRef.current.rotation.y += delta * 0.05; });
    return ( <group ref={groupRef}><group position={[25, 3, 0]} rotation={[0, -Math.PI / 2, 0]}><mesh><coneGeometry args={[0.5, 2, 8]} /><meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.8} /></mesh><mesh position={[0, 0.6, 0.4]}><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial color="#61DAFB" emissive="#61DAFB" emissiveIntensity={2} /></mesh><mesh position={[0, -1, 0]}><cylinderGeometry args={[0.3, 0.2, 0.2, 16]} /><meshBasicMaterial color="#ff5555" toneMapped={false} /></mesh><pointLight position={[0, -1.2, 0]} color="#ff5555" intensity={5} distance={3} /></group></group> );
}

function CameraRig({ targetPosition }) {
  useFrame((state, delta) => {
    state.camera.position.lerp(targetPosition, 0.5 * delta);
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();
  });
  return null;
}

function Planet({ name, color, position, size, setActivePlanet, activePlanet, hasRings = false, hasMoons = false, hasBeacon = false }) {
  const meshRef = useRef();
  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.001; });
  const emissiveColor = activePlanet === name ? color : 'black';
  return ( <group position={position}><pointLight color={color} intensity={0.5} distance={15} /><mesh ref={meshRef} onClick={() => setActivePlanet(name)}><sphereGeometry args={[size, 32, 32]} /><meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={1} roughness={0.6} /><Text position={[0, size + 0.3, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">{name.toUpperCase()}</Text></mesh>{hasRings && <mesh rotation-x={Math.PI / 2}><torusGeometry args={[size + 0.2, 0.05, 16, 100]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} side={THREE.DoubleSide} /></mesh>}{hasMoons && <OrbitingMoons planetRadius={size} />}{hasBeacon && <PulsingBeacon color={color} size={size} />}</group> );
}
const OrbitingMoons = ({ planetRadius }) => { const group = useRef(); useFrame((_,d) => group.current.rotation.y += d*0.3); return <group ref={group}>{Array.from({length:5}).map((_,i) => <mesh key={i} position={[(planetRadius+0.5)*Math.cos(i/5*2*Math.PI),0,(planetRadius+0.5)*Math.sin(i/5*2*Math.PI)]}><boxGeometry args={[0.1,0.1,0.1]}/><meshStandardMaterial color="#fff" emissive="#61DAFB" emissiveIntensity={2}/></mesh>)}</group> };
const PulsingBeacon = ({color, size}) => { const ref = useRef(); useFrame(s => ref.current.material.opacity = 0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 3)); return <mesh ref={ref}><cylinderGeometry args={[0.02, 0.02, size * 3, 8]} /><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh> };

function Sun({ setActivePlanet, activePlanet }) {
  const sunRef = useRef();
  useFrame(() => { if (sunRef.current) sunRef.current.rotation.y += 0.0005; });
  const emissiveColor = activePlanet === 'About' ? '#ffdd44' : '#ff9900';
  return ( <group><pointLight color="#FFDAB9" intensity={2.5} distance={100} /><mesh ref={sunRef} onClick={() => setActivePlanet('About')}><sphereGeometry args={[1.2, 32, 32]} /><meshStandardMaterial emissive={emissiveColor} emissiveIntensity={1.5} color="#ff9900" /></mesh></group> );
}

function AncientMonolith({ setActivePlanet, activePlanet }) {
    const monolithRef = useRef();
    useFrame(() => {
        if(monolithRef.current) {
            monolithRef.current.rotation.y += 0.001;
            monolithRef.current.rotation.x += 0.0005;
        }
    });
    const emissiveColor = activePlanet === 'Philosophy' ? '#ffffff' : '#4444ff';
    return ( <group position={[0, 15, -15]}><pointLight color="#4444ff" intensity={2} distance={20} /><mesh ref={monolithRef} onClick={() => setActivePlanet('Philosophy')}><boxGeometry args={[0.5, 4, 1]} /><meshStandardMaterial color="#111122" roughness={0.2} metalness={0.9} emissive={emissiveColor} emissiveIntensity={0.5} /><Text position={[0, 2.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">PHILOSOPHY</Text></mesh></group> );
}

// --- UI COMPONENTS ---

function InfoPanel({ activePlanet }) {
  const content = {
    'About': { title: 'Fiaz Hussain: The Star', subtitle: 'A Universe of Code and Creativity', text: "Welcome to my cosmic portfolio. I am Fiaz, a front-end developer and the star at the center of this creative system. My passion is forging new digital worlds with React, turning complex problems into elegant, user-centric experiences." },
    'Projects': { title: 'The Reactos System', subtitle: 'A Galactic Showcase of Work', text: "Each project is a world of its own, carefully crafted and brought to life. \n1. Project E-commerce: A full-scale e-commerce website. \n2. Project web app: A stellar data visualization dashboard. \n3. Project buisiness corp.: An elegant and responsive corporate landing zone." },
    'Skills': { title: 'The Tech-Tauri Constellation', subtitle: 'An Arsenal of Technologies', text: "My capabilities orbit around a core of modern web technologies, forming a powerful constellation: \nJavaScript (ES6+), React, Next.js, Redux, Three.js, HTML5, CSS3/SASS, Git, REST & GraphQL APIs. I constantly explore new stars in the tech universe." },
    'Contact': { title: 'Contactron Beacon', subtitle: 'Open a Channel', text: "My communication channels are always open for new missions and collaborations. Let's connect and build the future of the web together. \n\nEmail: fiazhussain0341@gmail.com \nwhatsapp: +923411554750 \nGitHub: https://github.com/FIAZHUSSAIN750" },
    'Philosophy': { title: 'The Ancient Monolith', subtitle: 'Core Principles of Creation', text: "This structure represents the immutable laws that guide my work:\n\n1. User-Centricity: The user is the gravitational center of every project.\n2. Clean & Scalable Code: Build structures that last and can expand.\n3. Performance by Design: A fast experience is a fundamental right, not an afterthought." }
  };
  const currentContent = content[activePlanet];
  return ( <div className={`info-panel ${activePlanet ? 'show' : ''}`}>{currentContent && ( <><h1>{currentContent.title}</h1><h3>{currentContent.subtitle}</h3><p>{currentContent.text}</p></> )}</div> );
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const [activePlanet, setActivePlanet] = useState(null);
  const cameraPositions = useMemo(() => ({
    'initial': new THREE.Vector3(0, 8, 25),
    'About': new THREE.Vector3(0, 0, 6),
    'Projects': new THREE.Vector3(-10, 0, 6),
    'Skills': new THREE.Vector3(10, 0, 6),
    'Contact': new THREE.Vector3(0, -10, 6),
    'Philosophy': new THREE.Vector3(0, 15, -10),
  }), []);

  const handleNavClick = (planetName) => setActivePlanet(planetName);
  const resetView = () => setActivePlanet(null);

  return (
    <div className="app-container">
      <nav className="main-nav">
        <button onClick={() => handleNavClick('About')}>About</button>
        <button onClick={() => handleNavClick('Projects')}>Projects</button>
        <button onClick={() => handleNavClick('Skills')}>Skills</button>
        <button onClick={() => handleNavClick('Contact')}>Contact</button>
        <button onClick={() => handleNavClick('Philosophy')}>Philosophy</button>
        {activePlanet && <button onClick={resetView} className="close-btn">×</button>}
      </nav>
      <InfoPanel activePlanet={activePlanet} />
      <Canvas camera={{ position: cameraPositions.initial, fov: 60 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} color="#4c00ff" />
          <GalaxyBackground />
          <ExplorerShip />
          <Stars radius={150} depth={50} count={6000} factor={6} saturation={0} fade speed={1} />
          <AsteroidBelt />
          <CosmicDust />
          <AncientMonolith setActivePlanet={setActivePlanet} activePlanet={activePlanet} />
          <Sun setActivePlanet={setActivePlanet} activePlanet={activePlanet} />
          <Planet name="Projects" color="#61DAFB" position={[-8, 0, 0]} size={0.7} setActivePlanet={setActivePlanet} activePlanet={activePlanet} hasMoons={true} />
          <Planet name="Skills" color="#D900FF" position={[8, 0, 0]} size={0.6} setActivePlanet={setActivePlanet} activePlanet={activePlanet} hasRings={true} />
          <Planet name="Contact" color="#4dff88" position={[0, -8.5, 0]} size={0.5} setActivePlanet={setActivePlanet} activePlanet={activePlanet} hasBeacon={true} />
          <CameraRig targetPosition={cameraPositions[activePlanet] || cameraPositions.initial} />
        </Suspense>
      </Canvas>
      <div className="title-overlay">
        <h1>FIAZ HUSSAIN</h1>
        <h2>COSMIC DEVELOPER PORTFOLIO</h2>
      </div>
    </div>
  );
}