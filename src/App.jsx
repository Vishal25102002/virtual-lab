// App.jsx with lab environment moved forward and simplified UI
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, Stars, Environment } from '@react-three/drei';
import LabEnvironment from './components/LabEnvironment';
import EngineModel from './components/EngineModel';
import './App.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // Hide intro after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle loading state
  useEffect(() => {
    // Simulate loading completion after assets are loaded
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Loading screen */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
          <div className="w-24 h-24 mb-8 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold mb-2">Loading V8 Engine</h2>
          <p className="text-gray-400">Preparing interactive experience...</p>
        </div>
      )}
      
      {/* Intro animation */}
      {showIntro && !loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-80 text-white transition-all duration-1000">
          <div className="text-center px-6 py-8 rounded-lg backdrop-blur-md bg-opacity-30 bg-blue-900 transform animate-fadeIn">
            <h1 className="text-4xl font-bold mb-4 animate-pulse">V8 Engine Interactive Lab</h1>
            <p className="text-xl animate-fadeIn">Explore the inner workings of a V8 engine</p>
          </div>
        </div>
      )}

      <Canvas
        shadows
        camera={{
          position: [0, 5, 25],
          fov: 50, // Narrower field of view to focus on engine
          near: 0.1,
          far: 1000,
          up: [0, 1, 0]
        }}
        gl={{ 
          powerPreference: 'high-performance', 
          antialias: true,
          depth: true,
          alpha: false,
        }}
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 10, -5]} intensity={0.4} />
        <pointLight position={[0, 8, 0]} intensity={0.5} distance={30} decay={2} color="#b0c4de" />
        <pointLight position={[-10, 0, -10]} intensity={0.3} distance={15} decay={2} color="#ffdead" />


        {/* Load lab and engine models */}
        <Suspense fallback={null}>
          {/* Static Lab Environment - moved forward as requested */}
          <LabEnvironment position={[0, 0, -5]} /> {/* Z=5 moves the lab forward */}
          
          {/* Interactive Engine Model centered in the lab */}
          <EngineModel position={[0, 0, 2]} />
        </Suspense>
      </Canvas>

      {/* Left side info panel - updated for exploded parts and merging */}
      <div className="absolute top-4 left-4 p-4 bg-gray-900 bg-opacity-80 border border-blue-500 text-white rounded-lg shadow-md backdrop-filter backdrop-blur-md max-w-md transition-all duration-300 hover:bg-opacity-90">
        <h1 className="text-xl font-bold mb-2 text-blue-300">V8 Engine Interactive Lab</h1>
        <div className="space-y-2">
          <p className="text-sm flex items-center">
            <span className="inline-block w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-xs">↕</span>
            <span>Drag <strong>up/down</strong> to rotate vertically</span>
          </p>
          <p className="text-sm flex items-center">
            <span className="inline-block w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-xs">↔</span>
            <span>Drag <strong>left/right</strong> to rotate horizontally</span>
          </p>
          <p className="text-sm flex items-center">
            <span className="inline-block w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-xs">🖱️</span>
            <span>Mouse wheel to <strong>zoom in/out</strong></span>
          </p>
          <p className="text-sm flex items-center">
            <span className="inline-block w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-xs">👆</span>
            <span>Click on parts to <strong>separate them into lab</strong></span>
          </p>
          <p className="text-sm flex items-center">
            <span className="inline-block w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2 text-xs">⚙️</span>
            <span>Click any separated part to <strong>merge all parts back</strong></span>
          </p>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-900 bg-opacity-70 text-white text-xs flex justify-between items-center">
        <div>V8 Engine | 8 Cylinders | 450 HP</div>
        <div className="flex space-x-4">
          <div>Press <kbd className="bg-gray-700 px-1 rounded">H</kbd> to hide controls</div>
          <div>Press <kbd className="bg-gray-700 px-1 rounded">R</kbd> for auto-rotation</div>
          <div>Press <kbd className="bg-gray-700 px-1 rounded">0</kbd> to reset view</div>
        </div>
      </div>

      {/* Custom styled loader */}
      <Loader 
        containerStyles={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
        innerStyles={{
          backgroundColor: '#1a1a2e',
          borderRadius: '8px',
          padding: '20px'
        }}
        barStyles={{
          backgroundColor: '#4169e1'
        }}
        dataStyles={{
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}
        dataInterpolation={(p) => `Loading Engine: ${p.toFixed(0)}%`}
      />
    </div>
  );
}