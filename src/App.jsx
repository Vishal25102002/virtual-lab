// App.jsx with manual rotation and zoom controls
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import LabEnvironment from './components/LabEnvironment';
import EngineModel from './components/EngineModel';
import './App.css';

export default function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <Canvas
        shadows
        camera={{
          position: [0, 8, 30],
          fov: 60,
          near: 0.1,
          far: 1000,
          up: [0, 1, 0]
        }}
        gl={{ 
          powerPreference: 'default', 
          antialias: true,
          depth: true,
          alpha: false,
        }}
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* Improved lighting setup */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.4} distance={30} decay={2} />

        {/* Load lab and engine models */}
        <Suspense fallback={null}>
          {/* Static Lab Environment */}
          <LabEnvironment position={[0, -8, 0]} />
          
          {/* Interactive Engine Model with manual rotation and zoom */}
          <EngineModel position={[0, -1, 0]} />
        </Suspense>
      </Canvas>

      {/* UI Overlay with instructions */}
      <div className="absolute top-4 left-4 p-3 bg-white border border-gray-300 text-black rounded-lg text-center shadow-md">
        <h1 className="text-lg font-bold mb-1">V8 Engine Interactive Lab</h1>
        <p className="text-xs">Drag to rotate the engine. Mouse wheel to zoom in/out.</p>
        <p className="text-xs mt-1">Click on parts to explode them.</p>
      </div>

      <Loader />
    </div>
  );
}