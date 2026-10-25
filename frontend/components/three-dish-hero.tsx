'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeDishHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Group for Platter and Embers
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Platter Base (Cast Iron / Dark Copper Pan with Metallic Gold Rim)
    const panGeometry = new THREE.CylinderGeometry(2.6, 2.3, 0.35, 64);
    const panMaterial = new THREE.MeshStandardMaterial({
      color: 0x14100c,
      roughness: 0.35,
      metalness: 0.85,
    });
    const pan = new THREE.Mesh(panGeometry, panMaterial);
    pan.rotation.x = Math.PI * 0.22;
    mainGroup.add(pan);

    // Golden Rim Ring
    const rimGeometry = new THREE.TorusGeometry(2.62, 0.04, 16, 100);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9a441,
      roughness: 0.2,
      metalness: 0.95,
      emissive: 0x553505,
      emissiveIntensity: 0.4,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI * 0.72;
    rim.position.y = 0.12;
    mainGroup.add(rim);

    // Inner Glowing Embers Bed
    const emberBedGeo = new THREE.CircleGeometry(2.35, 48);
    const emberBedMat = new THREE.MeshStandardMaterial({
      color: 0x221105,
      emissive: 0xff4500,
      emissiveIntensity: 0.6,
      roughness: 0.8,
    });
    const emberBed = new THREE.Mesh(emberBedGeo, emberBedMat);
    emberBed.rotation.x = -Math.PI * 0.28;
    emberBed.position.set(0, 0.15, 0.05);
    mainGroup.add(emberBed);

    // 2. Floating Sparks / Embers Particle System
    const particleCount = prefersReducedMotion ? 40 : 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Spawn near the platter center
      const r = Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      velocities[i * 3] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02; // floating upward
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

      scales[i] = Math.random() * 0.08 + 0.03;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Texture Canvas (Soft radial glow)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 180, 50, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 90, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // 3. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xffe0a0, 2.5);
    goldKeyLight.position.set(4, 6, 5);
    scene.add(goldKeyLight);

    const emberPointLight = new THREE.PointLight(0xff6600, 3.5, 8);
    emberPointLight.position.set(0, 0.5, 0.5);
    scene.add(emberPointLight);

    const rimBlueLight = new THREE.DirectionalLight(0x4466aa, 0.8);
    rimBlueLight.position.set(-5, -3, -2);
    scene.add(rimBlueLight);

    // 4. Mouse Interactive Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 5. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth pan tilt damping
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

      // Gentle floating oscillation
      mainGroup.position.y = Math.sin(time * 1.2) * 0.08;

      // Pulse ember light
      emberPointLight.intensity = 3.0 + Math.sin(time * 3.5) * 0.8;

      // Animate particles drifting upward
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += velocities[i * 3 + 1];
        posArray[i * 3] += Math.sin(time + i) * 0.003;

        // Reset if float too high
        if (posArray[i * 3 + 1] > 2.5) {
          const r = Math.random() * 2.0;
          const theta = Math.random() * Math.PI * 2;
          posArray[i * 3] = Math.cos(theta) * r;
          posArray[i * 3 + 1] = -0.5;
          posArray[i * 3 + 2] = Math.sin(theta) * r;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[380px] lg:min-h-[520px] relative pointer-events-auto"
      aria-label="3D Interactive Signature Platter with Ember Effects"
    />
  );
}
