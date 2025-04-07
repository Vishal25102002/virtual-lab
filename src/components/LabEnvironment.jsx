// LabEnvironment.jsx
import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export default function LabEnvironment({ position = [0, 0, 0] }) {
  const labRef = useRef();
  const { scene: labScene } = useGLTF('/lab.glb');

  useEffect(() => {
    if (!labScene || !labRef.current) return;

    // Clean up previous children
    while(labRef.current.children.length > 0) {
      // Only remove children that are not exploded parts (they have a special userData flag)
      const child = labRef.current.children[0];
      if (!child.userData?.isExplodedPart) {
        labRef.current.remove(child);
      }
    }

    // Clone the lab scene for safe modifications
    const labClone = labScene.clone();

    // Compute bounding box to scale and center the lab
    const box = new THREE.Box3().setFromObject(labClone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale lab to a larger size to fill the view
    const scaleFactor = 90; // Increased to see more of the lab
    const scale = maxDim > 0 ? scaleFactor / maxDim : 1;
    labClone.scale.set(scale, scale, scale);

    // Re-center lab so it sits around the origin
    labClone.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    // Apply provided position with adjustments
    labClone.position.x += position[0];
    labClone.position.y += position[1];
    labClone.position.z += position[2];
    
    // Make sure the lab is facing toward the camera
    labClone.rotation.y = Math.PI;

    // Fix materials while preserving original colors
    labClone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Preserve original materials but ensure they're not shared
        if (child.material) {
          // Clone the material to avoid shared state
          child.material = child.material.clone();
          
          // Ensure basic properties are set
          if (typeof child.material.roughness === 'undefined') {
            child.material.roughness = 0.7;
          }
          
          if (typeof child.material.metalness === 'undefined') {
            child.material.metalness = 0.2;
          }
        }
      }
    });

    labRef.current.add(labClone);
    
    // Add name to the lab for easy reference from other components
    labRef.current.name = 'LabEnvironment';
  }, [labScene, position]);

  return <group ref={labRef} />;
}