import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGesture } from 'react-use-gesture';

export default function EngineModelWithLab({ position = [0, 0, 0] }) {
  const engineRef = useRef();
  const labEnvRef = useRef();

  // For zoom (mouse wheel / pinch)
  const [scale, setScale] = useState(1.0);

  // For dragging rotation
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const dragDistanceRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Store original transforms and track exploded parts
  const originalPartsDataRef = useRef({});
  const explodedPartsRef = useRef({});

  // Load the GLTF model
  const { scene: gltfScene } = useGLTF('/enginev8label.glb');
  // Access the Three.js scene
  const { scene } = useThree();

  // Add an ambient light to the scene once
  useEffect(() => {
    if (!scene.getObjectByName('enhancedAmbientLight')) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      ambientLight.name = 'enhancedAmbientLight';
      scene.add(ambientLight);
    }
    return () => {
      const existingLight = scene.getObjectByName('enhancedAmbientLight');
      if (existingLight) scene.remove(existingLight);
    };
  }, [scene]);

  // Setup the engine model and record original part transforms
  useEffect(() => {
    if (!gltfScene || !engineRef.current) return;

    let engineRoot = gltfScene.getObjectByName('Engine');
    if (!engineRoot) {
      console.warn('Engine node not found; using entire GLTF scene.');
      engineRoot = gltfScene.clone();
    } else {
      engineRoot = engineRoot.clone();
    }

    const globalBox = new THREE.Box3();
    engineRoot.updateMatrixWorld(true);

    engineRoot.traverse((child) => {
      if (child.isMesh) {
        // Save original transform data
        originalPartsDataRef.current[child.uuid] = {
          position: child.position.clone(),
          rotation: child.rotation.clone(),
          scale: child.scale.clone(),
          parent: child.parent
        };

        child.geometry?.computeBoundingBox();
        globalBox.expandByObject(child);

        // Flag the part as not exploded
        child.userData.isExplodedPart = false;

        // Optional: tweak material properties
        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.3;
          child.material.metalness = 0.8;
        }

        // Give the part a name for debugging
        child.userData.partName = child.name || `Part_${child.uuid.slice(0, 5)}`;
      }
    });

    // Scale and center the engine model based on the computed bounding box
    if (!globalBox.isEmpty()) {
      const size = globalBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = maxDim > 0 ? 10 / maxDim : 1;
      engineRoot.scale.setScalar(scaleFactor);

      engineRoot.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3().setFromObject(engineRoot);
      engineRoot.position.y -= scaledBox.min.y;
    } else {
      console.warn('Global bounding box is empty! Using fallback scale.');
      engineRoot.scale.setScalar(10);
    }

    // Offset the engine model using props
    engineRoot.position.x += position[0];
    engineRoot.position.y += position[1];
    engineRoot.position.z += position[2];

    // Clear any previous children and add the engine model to the engine group
    while (engineRef.current.children.length > 0) {
      engineRef.current.remove(engineRef.current.children[0]);
    }
    engineRef.current.add(engineRoot);
  }, [gltfScene, position]);

  // Update engine rotation and scale each frame
  useFrame(() => {
    if (engineRef.current) {
      engineRef.current.rotation.x = rotationRef.current.x;
      engineRef.current.rotation.y = rotationRef.current.y;
      engineRef.current.rotation.z = rotationRef.current.z;
      engineRef.current.scale.set(scale, scale, scale);
    }
  });

  // Animate part dropping into the lab environment (explode)
  const movePartToLab = (part, index) => {
    part.userData.isExplodedPart = true;
    explodedPartsRef.current[part.uuid] = part;

    // Remove from the current parent and add to lab environment group
    if (part.parent) {
      part.parent.remove(part);
    }
    if (labEnvRef.current) {
      labEnvRef.current.add(part);
    }

    // Compute grid positions (for a neat layout in the lab)
    const gridStart = [0, 0.5, 12];
    const spacing = 3;
    const partsPerRow = 4;
    const row = Math.floor(index / partsPerRow);
    const col = index % partsPerRow;
    const centerOffset = (partsPerRow * spacing) / 2;
    const xPos = gridStart[0] + col * spacing - centerOffset + spacing / 2;
    const yPos = gridStart[1];
    const zPos = gridStart[2] - row * spacing;

    // Set initial position, rotation, and scale for the drop animation
    part.position.set(xPos, yPos + 5, zPos); // Start high for a drop effect
    part.rotation.set(0, Math.PI / 4, 0);
    part.scale.set(1.5, 1.5, 1.5);

    // Animate the drop to the target position
    part.userData.targetPos = { x: xPos, y: yPos, z: zPos };
    const dropAnim = () => {
      if (!part.userData.isExplodedPart) return;
      const distY = part.userData.targetPos.y - part.position.y;
      if (Math.abs(distY) > 0.05) {
        part.position.y += distY * 0.1;
        requestAnimationFrame(dropAnim);
      } else {
        part.position.y = part.userData.targetPos.y;
      }
    };
    dropAnim();
  };

  // Animate part moving back to the engine (merge)
  const movePartBackToEngine = (part) => {
    part.userData.isAnimatingBack = true;
    const originalData = originalPartsDataRef.current[part.uuid];
    if (!originalData) {
      console.warn('No original data for part', part.uuid);
      return;
    }
    const startPos = part.position.clone();
    const startRot = part.rotation.clone();
    const startScale = part.scale.clone();
    const targetPos = originalData.position;
    const targetRot = originalData.rotation;
    const targetScale = originalData.scale;
    const parent = originalData.parent;
    const duration = 500;
    const startTime = Date.now();

    const animateBack = () => {
      if (!part.userData.isAnimatingBack) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeT = 1 - Math.pow(1 - t, 3);

      // Lerp position, rotation, and scale
      part.position.x = startPos.x + (targetPos.x - startPos.x) * easeT;
      part.position.y = startPos.y + (targetPos.y - startPos.y) * easeT;
      part.position.z = startPos.z + (targetPos.z - startPos.z) * easeT;
      part.rotation.x = startRot.x + (targetRot.x - startRot.x) * easeT;
      part.rotation.y = startRot.y + (targetRot.y - startRot.y) * easeT;
      part.rotation.z = startRot.z + (targetRot.z - startRot.z) * easeT;
      part.scale.x = startScale.x + (targetScale.x - startScale.x) * easeT;
      part.scale.y = startScale.y + (targetScale.y - startScale.y) * easeT;
      part.scale.z = startScale.z + (targetScale.z - startScale.z) * easeT;

      if (t < 1) {
        requestAnimationFrame(animateBack);
      } else {
        // Finalize merging: remove from lab and reattach to original parent
        if (part.parent) part.parent.remove(part);
        parent.add(part);
        part.position.copy(targetPos);
        part.rotation.copy(targetRot);
        part.scale.copy(targetScale);
        part.userData.isAnimatingBack = false;
        part.userData.isExplodedPart = false;
        delete explodedPartsRef.current[part.uuid];
      }
    };
    animateBack();
  };

  // Use a single gesture binding for both engine and lab groups.
  const bind = useGesture(
    {
      onDrag: ({ delta: [dx, dy], event, first, last }) => {
        event.stopPropagation();
        if (first) {
          dragDistanceRef.current = 0;
          isDraggingRef.current = true;
          document.body.style.cursor = 'grabbing';
        }
        rotationRef.current.y += dx * 0.01;
        rotationRef.current.x += dy * 0.01;
        dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);
        if (last) {
          isDraggingRef.current = false;
          document.body.style.cursor = 'auto';
        }
      },
      onPinch: ({ delta: [d], event }) => {
        event.stopPropagation();
        event.preventDefault();
        const zoomSpeed = 0.01;
        let newScale = scale + d * zoomSpeed;
        newScale = Math.min(Math.max(newScale, 0.5), 2.0);
        setScale(newScale);
      },
      onWheel: ({ delta: [, dy], event }) => {
        event.stopPropagation();
        event.preventDefault();
        const zoomSpeed = 0.001;
        let newScale = scale - dy * zoomSpeed;
        newScale = Math.min(Math.max(newScale, 0.5), 2.0);
        setScale(newScale);
      },
      onClick: ({ event }) => {
        event.stopPropagation();
        // If the drag motion was minimal, consider it a click.
        if (dragDistanceRef.current < 10) {
          const mesh = event.object;
          if (mesh && mesh.isMesh) {
            if (!mesh.userData.isExplodedPart) {
              console.log(`Exploding part ${mesh.userData.partName}`);
              // Use the number of currently exploded parts as an index for layout
              const index = Object.keys(explodedPartsRef.current).length;
              movePartToLab(mesh, index);
            } else {
              console.log(`Merging part ${mesh.userData.partName}`);
              movePartBackToEngine(mesh);
            }
          }
        }
      }
    },
    { eventOptions: { passive: false } }
  );

  return (
    <>
      <group ref={engineRef} {...bind()} />
      <group ref={labEnvRef} name="LabEnvironment" {...bind()} />
    </>
  );
}
