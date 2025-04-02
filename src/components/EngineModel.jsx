// EngineModel.jsx with manual rotation and zoom controls
import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function EngineModel({ position = [0, 0, 0] }) {
  const engineRef = useRef();
  const [hoveredPart, setHoveredPart] = useState(null);
  const [clickedParts, setClickedParts] = useState({});
  
  // Manual controls
  const [scale, setScale] = useState(1.0);
  
  // Load the GLTF model
  const { scene: gltfScene } = useGLTF('/enginev8label.glb');

  // Store each mesh's original local position
  const originalPositionsRef = useRef({});
  
  // Rotation state
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const isDraggingRef = useRef(false);
  const prevPointerPosRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    if (!gltfScene || !engineRef.current) return;

    // Clean up any previous content
    while(engineRef.current.children.length > 0) {
      engineRef.current.remove(engineRef.current.children[0]);
    }

    try {
      // Attempt to find a node named "Engine"
      let engineRoot = gltfScene.getObjectByName('Engine');
      if (!engineRoot) {
        console.warn('Engine node not found; using entire GLTF scene.');
        engineRoot = gltfScene.clone();
      } else {
        // Create a clone instead of removing from parent
        engineRoot = engineRoot.clone();
      }

      // Compute a global bounding box and store each mesh's original position
      const globalBox = new THREE.Box3();
      engineRoot.updateMatrixWorld(true);
      
      // Process each mesh in the model
      engineRoot.traverse((child) => {
        if (child.isMesh) {
          // Store original position
          originalPositionsRef.current[child.uuid] = child.position.clone();
          
          // Setup for shadows
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Compute bounding box
          child.geometry.computeBoundingBox();
          globalBox.expandByObject(child);
          
          // Preserve original materials but clone them to avoid shared materials
          if (child.material) {
            // Clone the material to avoid shared state
            child.material = child.material.clone();
            
            // Preserve original material properties but ensure they're properly set
            if (!child.material.roughness) child.material.roughness = 0.5;
            if (!child.material.metalness) child.material.metalness = 0.7;
            
            // Store original color for highlighting
            child.userData.originalColor = child.material.color.clone();
            
            // Add basic material properties if missing
            if (!child.material.emissive) {
              child.material.emissive = new THREE.Color(0x000000);
              child.material.emissiveIntensity = 0;
            }
          }
          
          // Store part name if available or generate one
          child.userData.partName = child.name || `Part_${child.uuid.substring(0, 5)}`;
        }
      });

      // Scale and position the engine based on its bounding box
      if (!globalBox.isEmpty()) {
        const size = globalBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Make engine larger to fill more of the screen
        const scaleFactor = maxDim > 0 ? 10 / maxDim : 1;
        
        engineRoot.scale.setScalar(scaleFactor);
        
        engineRoot.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(engineRoot);
        const minY = scaledBox.min.y;
        
        // Center the engine vertically
        engineRoot.position.y -= minY;
      } else {
        console.warn('Global bounding box is empty! Using fallback scale.');
        engineRoot.scale.setScalar(10);
      }

      // Position the engine
      engineRoot.position.x += position[0];
      engineRoot.position.y += position[1];
      engineRoot.position.z += position[2];

      // Add to our component
      engineRef.current.add(engineRoot);
    } catch (error) {
      console.error("Error setting up engine model:", error);
    }
  }, [gltfScene, position]);

  // Animate the engine each frame
  useFrame(() => {
    if (!engineRef.current) return;

    // Apply accumulated rotations
    engineRef.current.rotation.x = rotationRef.current.x;
    engineRef.current.rotation.y = rotationRef.current.y;
    engineRef.current.rotation.z = rotationRef.current.z;
    
    // Apply scale (zoom)
    engineRef.current.scale.set(scale, scale, scale);

    // Animate parts moving to exploded positions
    engineRef.current.traverse((child) => {
      if (!child.isMesh) return;
      
      const uuid = child.uuid;
      const originalPos = originalPositionsRef.current[uuid];
      
      if (!originalPos) return;
      
      if (clickedParts[uuid]) {
        // Calculate explosion direction based on position from center
        const center = new THREE.Vector3(0, 0, 0);
        const direction = new THREE.Vector3().subVectors(originalPos, center).normalize();
        
        // Handle zero vector case
        if (direction.lengthSq() < 0.001) {
          direction.set(0, 1, 0);
        }
        
        // Add a slight upward bias to make parts more visible
        direction.y += 0.3;
        direction.normalize();
        
        // Calculate explosion distance - parts further from center move further out
        const distanceFromCenter = originalPos.distanceTo(center);
        const explosionDistance = Math.max(2, distanceFromCenter * 0.7);
        
        // Calculate target position
        const targetPos = originalPos.clone().add(
          direction.multiplyScalar(explosionDistance)
        );
        
        // Move part toward exploded position with smooth animation
        child.position.lerp(targetPos, 0.1);
      } else {
        // Move part back to original position
        child.position.lerp(originalPos, 0.1);
      }
    });
  });

  // Handle mouse interaction with appropriate sensitivity for rotation
  const handlePointerDown = (e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    prevPointerPosRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevPointerPosRef.current.x;
      const deltaY = e.clientY - prevPointerPosRef.current.y;

      // Update rotation based on mouse movement
      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;

      // Track total drag distance
      dragDistanceRef.current += Math.abs(deltaX) + Math.abs(deltaY);
      prevPointerPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    
    // Reset cursor
    document.body.style.cursor = 'auto';
    
    // If this was a click rather than a drag
    if (isDraggingRef.current && dragDistanceRef.current < 10) {
      const mesh = e.object;
      if (mesh && mesh.isMesh) {
        // Toggle explosion state for this part
        setClickedParts(prev => ({
          ...prev,
          [mesh.uuid]: !prev[mesh.uuid]
        }));
        
        console.log(`Clicked part: ${mesh.userData.partName}`);
      }
    }
    
    isDraggingRef.current = false;
  };

  const handlePointerOver = (e) => {
    const mesh = e.object;
    if (mesh && mesh.isMesh) {
      // Highlight the part
      setHoveredPart(mesh.uuid);
      document.body.style.cursor = 'pointer';
      
      if (mesh.material) {
        // Subtle highlight with emissive glow instead of changing the color
        mesh.material.emissive = new THREE.Color(0x222222);
        mesh.material.emissiveIntensity = 0.5;
      }
    }
  };

  const handlePointerOut = (e) => {
    const mesh = e.object;
    if (mesh && mesh.isMesh) {
      // Remove highlight
      setHoveredPart(null);
      document.body.style.cursor = 'auto';
      
      if (mesh.material) {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    }
  };

  // Handle wheel for zooming in and out
  const handleWheel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Calculate new scale value for zoom (using deltaY)
    const zoomSpeed = 0.001;
    const newScale = scale - e.deltaY * zoomSpeed;
    
    // Limit zoom to reasonable bounds (0.5x to 2.0x)
    if (newScale >= 0.5 && newScale <= 2.0) {
      setScale(newScale);
    }
  };

  return (
    <group
      ref={engineRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onWheel={handleWheel}
    />
  );
}