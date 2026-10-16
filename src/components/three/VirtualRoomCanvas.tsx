import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraAngle, EmotionType, RoomEnvironmentType } from '../../types';
import { ZeroTwoCharacter3D } from './ZeroTwoCharacter3D';
import { VirtualRoom3D } from './VirtualRoom3D';
import { playSound } from '../../utils/soundEffects';

interface VirtualRoomCanvasProps {
  emotion: EmotionType;
  isSpeaking: boolean;
  environmentType: RoomEnvironmentType;
  cameraAngle: CameraAngle;
  lowPerformanceMode?: boolean;
  onCharacterTap?: () => void;
  soundEnabled?: boolean;
}

export const VirtualRoomCanvas: React.FC<VirtualRoomCanvasProps> = ({
  emotion,
  isSpeaking,
  environmentType,
  cameraAngle,
  lowPerformanceMode = false,
  onCharacterTap,
  soundEnabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);

  // References to mutable 3D objects
  const characterRef = useRef<ZeroTwoCharacter3D | null>(null);
  const roomRef = useRef<VirtualRoom3D | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Orbit control state (custom touch & drag orbit)
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: 0, phi: 0.1, distance: 1.9 });
  const targetCameraPos = useRef(new THREE.Vector3(0, 1.55, 1.9));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.45, 0));

  // Update camera presets when cameraAngle prop changes
  useEffect(() => {
    if (cameraAngle === 'portrait') {
      targetCameraPos.current.set(0, 1.85, 0.95);
      targetLookAt.current.set(0, 1.82, 0);
      orbitAngleRef.current.distance = 0.95;
    } else if (cameraAngle === 'upper') {
      targetCameraPos.current.set(0, 1.55, 1.9);
      targetLookAt.current.set(0, 1.45, 0);
      orbitAngleRef.current.distance = 1.9;
    } else if (cameraAngle === 'full') {
      targetCameraPos.current.set(0, 1.25, 3.2);
      targetLookAt.current.set(0, 1.1, 0);
      orbitAngleRef.current.distance = 3.2;
    }
  }, [cameraAngle]);

  // Update emotion & speaking states on character
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setEmotion(emotion);
    }
  }, [emotion]);

  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.setSpeaking(isSpeaking);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (roomRef.current) {
      roomRef.current.setEnvironment(environmentType);
    }
  }, [environmentType]);

  // Mount WebGL Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLError('WebGL is not supported or is disabled in your browser.');
        return;
      }
    } catch {
      setWebGLError('WebGL is unavailable on this device.');
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0717);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.copy(targetCameraPos.current);
    camera.lookAt(targetLookAt.current);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowPerformanceMode,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(lowPerformanceMode ? 1.0 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !lowPerformanceMode;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err: any) {
      setWebGLError(`WebGL initialization failed: ${err?.message || 'Unknown error'}`);
      return;
    }

    // Add Character & Virtual Room
    const room = new VirtualRoom3D();
    room.setEnvironment(environmentType);
    scene.add(room.group);
    roomRef.current = room;

    const character = new ZeroTwoCharacter3D();
    character.setEmotion(emotion);
    scene.add(character.group);
    characterRef.current = character;

    // Touch & Pointer interaction listeners for Orbit & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevPointerRef.current = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevPointerRef.current.x;
      const deltaY = clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: clientX, y: clientY };

      orbitAngleRef.current.theta -= deltaX * 0.008;
      orbitAngleRef.current.phi = Math.max(
        -0.3,
        Math.min(0.6, orbitAngleRef.current.phi + deltaY * 0.008)
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(character.interactiveMeshes, true);

      if (intersects.length > 0) {
        playSound.success(soundEnabled);
        character.triggerGesture('wave');
        if (onCharacterTap) onCharacterTap();
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElement.addEventListener('click', onClick);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update Character animations & Room sakura particles
      character.update(delta, time);
      room.update(delta, time);

      // Smooth exponential camera interpolation
      const dist = orbitAngleRef.current.distance;
      const camX = Math.sin(orbitAngleRef.current.theta) * dist * Math.cos(orbitAngleRef.current.phi);
      const camZ = Math.cos(orbitAngleRef.current.theta) * dist * Math.cos(orbitAngleRef.current.phi);
      const camY = targetCameraPos.current.y + Math.sin(orbitAngleRef.current.phi) * dist;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 6, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 6, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camZ, 6, delta);
      camera.lookAt(targetLookAt.current);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      domElement.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('click', onClick);

      domElement.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [lowPerformanceMode, environmentType, soundEnabled]);

  if (webGLError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-rose-200">
        <p className="text-sm font-bold mb-2">3D Virtual Room Unavailable</p>
        <p className="text-xs text-zinc-400 max-w-sm mb-4">{webGLError}</p>
        <p className="text-xs text-pink-300">
          You can continue interacting with Zero Two seamlessly in the 2D Animated Avatar tab!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
