// ControlPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ControlPanel({ onExplodeAll, onResetParts, activePart }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Control buttons with Framer Motion */}
      <div className="flex gap-2 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExplodeAll}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Explode All Parts
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onResetParts}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Reset Parts
        </motion.button>
      </div>
      
      {/* Part information panel */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: activePart ? 1 : 0,
          height: activePart ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
        className="bg-gray-700/80 rounded-md p-4 overflow-hidden"
      >
        {activePart && (
          <>
            <h3 className="text-white text-lg font-bold mb-2">
              Selected Part: {activePart}
            </h3>
            <p className="text-gray-300 text-sm">
              {getPartDescription(activePart)}
            </p>
          </>
        )}
      </motion.div>
      
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-gray-400 text-xs text-center"
      >
        <p>Mouse drag: rotate | Mouse wheel: Z rotation | Click: explode part</p>
      </motion.div>
    </div>
  );
}

// Helper function to provide descriptions for engine parts
function getPartDescription(partName) {
  const descriptions = {
    'Piston': 'Converts pressure from combustion into mechanical energy, moving up and down within the cylinder.',
    'Cylinder': 'The sealed chamber where combustion occurs and the piston moves.',
    'Crankshaft': 'Converts the linear motion of the pistons into rotational motion.',
    'Camshaft': 'Controls the opening and closing of the intake and exhaust valves.',
    'Valves': 'Allow air/fuel mixture to enter the cylinder and exhaust gases to exit.',
    'Spark Plug': 'Creates the spark that ignites the air/fuel mixture in the cylinder.',
    'Connecting Rod': 'Connects the piston to the crankshaft.',
    'Oil Pan': 'Reservoir for engine oil at the bottom of the engine.',
    'Timing Belt': 'Synchronizes the rotation of the crankshaft and camshaft.',
    'Intake Manifold': 'Distributes the air/fuel mixture to each cylinder.',
    'Exhaust Manifold': 'Collects exhaust gases from multiple cylinders into one pipe.',
    'Water Pump': 'Circulates coolant through the engine block to prevent overheating.',
    'Flywheel': 'Provides rotational inertia to keep the engine running smoothly between power strokes.',
    'Head Gasket': 'Seals the cylinder head to the engine block, preventing leakage.',
    'Engine Block': 'The main structural component of the engine that contains the cylinders.',
    'Cylinder Head': 'The detachable top part of the engine that covers the cylinders.'
  };
  
  // Return description if available, otherwise a generic message
  return descriptions[partName] || `This is a ${partName} component of the V8 engine.`;
}