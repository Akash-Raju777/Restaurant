'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CinematicChefCanvasProps {
  scrollProgress: number; // 0.0 to 1.0
  isSoundActive?: boolean;
}

export default function CinematicChefCanvas({ scrollProgress, isSoundActive = false }: CinematicChefCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  // References to dynamic 3D elements for scroll animation
  const elementsRef = useRef<{
    chefPlane?: THREE.Mesh;
    fireLight?: THREE.PointLight;
    flareLight?: THREE.PointLight;
    dishLight?: THREE.SpotLight;
    ambientLight?: THREE.AmbientLight;
    rimLight?: THREE.DirectionalLight;
    flameParticles?: THREE.Points;
    flameGeo?: THREE.BufferGeometry;
    flameVelocities?: Float32Array;
    emberParticles?: THREE.Points;
    emberGeo?: THREE.BufferGeometry;
    smokeParticles?: THREE.Points;
    smokeGeo?: THREE.BufferGeometry;
    smokeVelocities?: Float32Array;
    ingredientsGroup?: THREE.Group;
    ingredients?: Array<{
      mesh: THREE.Object3D;
      basePos: THREE.Vector3;
      peakPos: THREE.Vector3;
      rotationSpeed: THREE.Vector3;
      phase: number;
    }>;
    steamGroup?: THREE.Group;
    steamParticles?: THREE.Points;
  }>({});

  // 1. Procedural texture helpers to avoid broken image URLs
  const createFireParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 230, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 170, 40, 0.9)');
    grad.addColorStop(0.5, 'rgba(240, 70, 10, 0.5)');
    grad.addColorStop(0.8, 'rgba(180, 20, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  const createSmokeParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(200, 190, 180, 0.35)');
    grad.addColorStop(0.4, 'rgba(160, 150, 140, 0.18)');
    grad.addColorStop(0.7, 'rgba(100, 90, 80, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  const createEmberTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 200, 60, 1)');
    grad.addColorStop(0.6, 'rgba(255, 80, 10, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // 2. 3D Procedural Food Geometries
  const createChiliMesh = (scale = 1.0) => {
    const group = new THREE.Group();
    // Curved curve for red chili
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.12, 0.35, 0.05),
      new THREE.Vector3(0.08, 0.75, -0.05),
      new THREE.Vector3(-0.1, 1.1, 0.02),
    ]);
    const chiliGeo = new THREE.TubeGeometry(curve, 32, 0.075 * scale, 12, false);
    const chiliMat = new THREE.MeshStandardMaterial({
      color: 0xd61818,
      roughness: 0.18,
      metalness: 0.15,
      emissive: 0x400202,
    });
    const chiliMesh = new THREE.Mesh(chiliGeo, chiliMat);
    group.add(chiliMesh);

    // Green stem
    const stemGeo = new THREE.CylinderGeometry(0.02 * scale, 0.035 * scale, 0.18 * scale, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.5,
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(-0.02, -0.08, 0);
    stem.rotation.z = 0.2;
    group.add(stem);

    return group;
  };

  const createBellPepperSlice = (colorHex: number, scale = 1.0) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.15 * scale, -0.25 * scale);
    shape.quadraticCurveTo(0.25 * scale, -0.1 * scale, 0.35 * scale, 0.25 * scale);
    shape.quadraticCurveTo(0.15 * scale, 0.35 * scale, -0.1 * scale, 0.2 * scale);
    shape.quadraticCurveTo(-0.35 * scale, 0.0, -0.15 * scale, -0.25 * scale);

    const extrudeSettings = {
      depth: 0.08 * scale,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.025 * scale,
      bevelThickness: 0.025 * scale,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.22,
      metalness: 0.12,
    });
    return new THREE.Mesh(geo, mat);
  };

  const createOnionRing = (scale = 1.0) => {
    const geo = new THREE.TorusGeometry(0.26 * scale, 0.06 * scale, 10, 24, Math.PI * 1.55);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x880e4f,
      roughness: 0.3,
      metalness: 0.05,
      emissive: 0x2a0418,
    });
    return new THREE.Mesh(geo, mat);
  };

  const createHerbLeaf = (scale = 1.0) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.1 * scale, 0.15 * scale, 0.12 * scale, 0.35 * scale, 0, 0.5 * scale);
    shape.bezierCurveTo(-0.12 * scale, 0.35 * scale, -0.1 * scale, 0.15 * scale, 0, 0);

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  };

  const createSeasonedMorsel = (scale = 1.0) => {
    const geo = new THREE.DodecahedronGeometry(0.14 * scale, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.65,
      metalness: 0.08,
      emissive: 0x331406,
    });
    return new THREE.Mesh(geo, mat);
  };

  // 3. Audio Crackling Fire & Sizzle Synthesizer (Zero asset dependency)
  useEffect(() => {
    if (!isSoundActive) {
      if (audioGainRef.current && audioCtxRef.current) {
        audioGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.2);
      }
      return;
    }

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();

        // White/Pink noise generator for sizzling oil & crackle
        const bufferSize = audioCtxRef.current.sampleRate * 2;
        const noiseBuffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          let pink = b0 + b1 + b2 + white * 0.5362;
          // Random crackle pop impulses
          if (Math.random() < 0.003) {
            pink += (Math.random() - 0.5) * 8.0;
          }
          output[i] = pink * 0.07;
        }

        const whiteNoise = audioCtxRef.current.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;

        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = 0.08;
        audioGainRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        whiteNoise.start();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioGainRef.current) {
        audioGainRef.current.gain.setTargetAtTime(0.08, audioCtxRef.current.currentTime, 0.2);
      }
    } catch (e) {
      console.warn('Audio synthesis not allowed before user gesture', e);
    }

    return () => {
      if (audioGainRef.current && audioCtxRef.current) {
        audioGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.2);
      }
    };
  }, [isSoundActive]);

  // 4. Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x080808, 0.045);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTING SYSTEM
    // Ambient light - starts faint, grows as scene warms
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.1);
    scene.add(ambientLight);
    elementsRef.current.ambientLight = ambientLight;

    // Fire point light under wok (Center-Right, around x=1.6, y=-2.5, z=1.2)
    const fireLight = new THREE.PointLight(0xff5500, 0.1, 15, 1.8);
    fireLight.position.set(1.5, -2.4, 1.2);
    scene.add(fireLight);
    elementsRef.current.fireLight = fireLight;

    // Flare burst light during tossing peak
    const flareLight = new THREE.PointLight(0xffa500, 0.0, 18, 1.5);
    flareLight.position.set(1.8, -0.8, 1.6);
    scene.add(flareLight);
    elementsRef.current.flareLight = flareLight;

    // Golden Rim Light (Chef silhouette)
    const rimLight = new THREE.DirectionalLight(0xd9a441, 0.2);
    rimLight.position.set(4, 3, -1);
    scene.add(rimLight);
    elementsRef.current.rimLight = rimLight;

    // Dish presentation spotlight (Scene 5 highlight)
    const dishLight = new THREE.SpotLight(0xfff3d6, 0.0, 16, Math.PI / 4, 0.4, 1.5);
    dishLight.position.set(1.6, 2.5, 3.5);
    dishLight.target.position.set(1.6, -1.8, 0.5);
    scene.add(dishLight);
    scene.add(dishLight.target);
    elementsRef.current.dishLight = dishLight;

    // 5. PRIMARY ASSET: CHEF PLANE (16:9 Aspect Ratio)
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/images/chef-cooking.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;

        // Plane size: width 16, height 9 (matches 1024x576)
        const planeGeo = new THREE.PlaneGeometry(16, 9, 32, 32);
        const planeMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.1,
          side: THREE.FrontSide,
        });

        const chefPlane = new THREE.Mesh(planeGeo, planeMat);
        // Center the chef slightly to the right so left side remains spacious for luxury typography
        chefPlane.position.set(0.6, 0, 0);
        scene.add(chefPlane);
        elementsRef.current.chefPlane = chefPlane;
      },
      undefined,
      (err) => {
        console.error('Error loading chef texture', err);
      }
    );

    // 6. PROCEDURAL 3D INGREDIENTS GROUP
    const ingredientsGroup = new THREE.Group();
    ingredientsGroup.position.set(0.6, 0, 0.2);
    scene.add(ingredientsGroup);
    elementsRef.current.ingredientsGroup = ingredientsGroup;

    // Generate individual 3D ingredients positioned relative to the wok (wok center approx at x=1.5, y=-2.0, z=0.5)
    const ingredientsList: Array<{
      mesh: THREE.Object3D;
      basePos: THREE.Vector3;
      peakPos: THREE.Vector3;
      rotationSpeed: THREE.Vector3;
      phase: number;
    }> = [];

    // Chillies
    const chili1 = createChiliMesh(1.1);
    const chili2 = createChiliMesh(0.9);
    const chili3 = createChiliMesh(1.0);
    ingredientsGroup.add(chili1);
    ingredientsGroup.add(chili2);
    ingredientsGroup.add(chili3);

    ingredientsList.push({
      mesh: chili1,
      basePos: new THREE.Vector3(1.4, -1.8, 0.3),
      peakPos: new THREE.Vector3(2.1, 1.2, 1.8),
      rotationSpeed: new THREE.Vector3(2.5, 1.8, 1.2),
      phase: 0.0,
    });
    ingredientsList.push({
      mesh: chili2,
      basePos: new THREE.Vector3(1.6, -1.9, 0.2),
      peakPos: new THREE.Vector3(0.9, 1.4, 1.6),
      rotationSpeed: new THREE.Vector3(-1.8, 2.2, -1.4),
      phase: 0.15,
    });
    ingredientsList.push({
      mesh: chili3,
      basePos: new THREE.Vector3(1.2, -1.7, 0.35),
      peakPos: new THREE.Vector3(1.7, 1.7, 2.1),
      rotationSpeed: new THREE.Vector3(1.4, -2.5, 1.9),
      phase: 0.25,
    });

    // Bell Peppers (Yellow, Green, Red)
    const bellYellow1 = createBellPepperSlice(0xf9a825, 1.0);
    const bellYellow2 = createBellPepperSlice(0xffb300, 0.85);
    const bellGreen1 = createBellPepperSlice(0x2e7d32, 1.1);
    const bellGreen2 = createBellPepperSlice(0x43a047, 0.8);
    const bellRed1 = createBellPepperSlice(0xd32f2f, 0.95);

    ingredientsGroup.add(bellYellow1);
    ingredientsGroup.add(bellYellow2);
    ingredientsGroup.add(bellGreen1);
    ingredientsGroup.add(bellGreen2);
    ingredientsGroup.add(bellRed1);

    ingredientsList.push({
      mesh: bellYellow1,
      basePos: new THREE.Vector3(1.3, -1.85, 0.4),
      peakPos: new THREE.Vector3(1.6, 1.5, 1.9),
      rotationSpeed: new THREE.Vector3(2.0, -1.5, 2.8),
      phase: 0.05,
    });
    ingredientsList.push({
      mesh: bellYellow2,
      basePos: new THREE.Vector3(1.7, -1.75, 0.3),
      peakPos: new THREE.Vector3(2.3, 0.8, 1.4),
      rotationSpeed: new THREE.Vector3(-2.2, 1.9, 1.1),
      phase: 0.2,
    });
    ingredientsList.push({
      mesh: bellGreen1,
      basePos: new THREE.Vector3(1.5, -1.8, 0.45),
      peakPos: new THREE.Vector3(0.8, 0.9, 1.7),
      rotationSpeed: new THREE.Vector3(1.8, 2.0, -1.6),
      phase: 0.1,
    });
    ingredientsList.push({
      mesh: bellGreen2,
      basePos: new THREE.Vector3(1.8, -1.9, 0.35),
      peakPos: new THREE.Vector3(1.3, 1.8, 2.2),
      rotationSpeed: new THREE.Vector3(-1.5, -2.4, 2.0),
      phase: 0.3,
    });
    ingredientsList.push({
      mesh: bellRed1,
      basePos: new THREE.Vector3(1.4, -1.7, 0.4),
      peakPos: new THREE.Vector3(2.0, 1.3, 1.5),
      rotationSpeed: new THREE.Vector3(2.2, 1.2, -2.1),
      phase: 0.12,
    });

    // Onion Rings (Purple-white)
    const onion1 = createOnionRing(1.1);
    const onion2 = createOnionRing(0.85);
    const onion3 = createOnionRing(1.0);
    ingredientsGroup.add(onion1);
    ingredientsGroup.add(onion2);
    ingredientsGroup.add(onion3);

    ingredientsList.push({
      mesh: onion1,
      basePos: new THREE.Vector3(1.5, -1.8, 0.3),
      peakPos: new THREE.Vector3(1.8, 1.6, 2.0),
      rotationSpeed: new THREE.Vector3(3.0, 1.5, -1.8),
      phase: 0.08,
    });
    ingredientsList.push({
      mesh: onion2,
      basePos: new THREE.Vector3(1.6, -1.9, 0.4),
      peakPos: new THREE.Vector3(1.1, 1.1, 1.5),
      rotationSpeed: new THREE.Vector3(-2.0, 3.2, 1.4),
      phase: 0.22,
    });
    ingredientsList.push({
      mesh: onion3,
      basePos: new THREE.Vector3(1.35, -1.75, 0.35),
      peakPos: new THREE.Vector3(2.2, 1.4, 1.7),
      rotationSpeed: new THREE.Vector3(1.6, -2.2, 2.6),
      phase: 0.18,
    });

    // Herb Leaves & Spiced Morsels
    for (let i = 0; i < 4; i++) {
      const leaf = createHerbLeaf(0.8 + Math.random() * 0.4);
      ingredientsGroup.add(leaf);
      ingredientsList.push({
        mesh: leaf,
        basePos: new THREE.Vector3(1.3 + Math.random() * 0.5, -1.8, 0.3 + Math.random() * 0.2),
        peakPos: new THREE.Vector3(0.7 + Math.random() * 1.5, 1.0 + Math.random() * 1.0, 1.2 + Math.random() * 1.0),
        rotationSpeed: new THREE.Vector3(2 + Math.random() * 3, 2 + Math.random() * 3, 2 + Math.random() * 3),
        phase: Math.random() * 0.3,
      });

      const morsel = createSeasonedMorsel(0.8 + Math.random() * 0.4);
      ingredientsGroup.add(morsel);
      ingredientsList.push({
        mesh: morsel,
        basePos: new THREE.Vector3(1.3 + Math.random() * 0.4, -1.85, 0.3 + Math.random() * 0.2),
        peakPos: new THREE.Vector3(1.0 + Math.random() * 1.2, 0.6 + Math.random() * 0.8, 1.0 + Math.random() * 0.8),
        rotationSpeed: new THREE.Vector3(1.5, 2.0, 1.8),
        phase: Math.random() * 0.3,
      });
    }

    elementsRef.current.ingredients = ingredientsList;

    // 7. FIRE PARTICLE SYSTEM (Under Wok)
    const flameCount = 180;
    const flameGeo = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameCount * 3);
    const flameVelocities = new Float32Array(flameCount * 3);
    const flameSizes = new Float32Array(flameCount);
    const flameAlphas = new Float32Array(flameCount);

    for (let i = 0; i < flameCount; i++) {
      flamePositions[i * 3 + 0] = 1.3 + (Math.random() - 0.5) * 0.9;
      flamePositions[i * 3 + 1] = -2.6 + Math.random() * 0.4;
      flamePositions[i * 3 + 2] = 0.5 + (Math.random() - 0.5) * 0.5;

      flameVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.015;
      flameVelocities[i * 3 + 1] = 0.02 + Math.random() * 0.04;
      flameVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;

      flameSizes[i] = 25 + Math.random() * 35;
      flameAlphas[i] = Math.random();
    }

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeo.setAttribute('size', new THREE.BufferAttribute(flameSizes, 1));

    const flameMat = new THREE.PointsMaterial({
      size: 45,
      map: createFireParticleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.0, // starts off in Scene 1
    });

    const flameParticles = new THREE.Points(flameGeo, flameMat);
    scene.add(flameParticles);
    elementsRef.current.flameParticles = flameParticles;
    elementsRef.current.flameGeo = flameGeo;
    elementsRef.current.flameVelocities = flameVelocities;

    // 8. KINETIC EMBERS & SPARKS SYSTEM (Cinematic 3D Frustum Depth)
    const emberCount = 350;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberVelocities = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3 + 0] = (Math.random() - 0.5) * 14;
      emberPositions[i * 3 + 1] = -4 + Math.random() * 8;
      emberPositions[i * 3 + 2] = -2 + Math.random() * 8; // deep in front and behind camera

      emberVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.008;
      emberVelocities[i * 3 + 1] = 0.008 + Math.random() * 0.025;
      emberVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));

    const emberMat = new THREE.PointsMaterial({
      size: 16,
      map: createEmberTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });

    const emberParticles = new THREE.Points(emberGeo, emberMat);
    scene.add(emberParticles);
    elementsRef.current.emberParticles = emberParticles;
    elementsRef.current.emberGeo = emberGeo;

    // 9. VOLUMETRIC STEAM & SMOKE
    const smokeCount = 90;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeVelocities = new Float32Array(smokeCount * 3);

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3 + 0] = 1.4 + (Math.random() - 0.5) * 1.2;
      smokePositions[i * 3 + 1] = -2.2 + Math.random() * 2.5;
      smokePositions[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.8;

      smokeVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.005;
      smokeVelocities[i * 3 + 1] = 0.008 + Math.random() * 0.018;
      smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));

    const smokeMat = new THREE.PointsMaterial({
      size: 140,
      map: createSmokeParticleTexture(),
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      opacity: 0.2,
    });

    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);
    elementsRef.current.smokeParticles = smokeParticles;
    elementsRef.current.smokeGeo = smokeGeo;
    elementsRef.current.smokeVelocities = smokeVelocities;

    // 10. RESIZE LISTENER
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 5. ANIMATION & SCROLL CHOREOGRAPHY LOOP
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const p = Math.max(0, Math.min(1, scrollProgress)); // 0.0 to 1.0 clamped

      const elements = elementsRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;

      if (!camera || !renderer || !scene) return;

      // ─── SCENE 1: CHEF REVEAL (0.0 to 0.20) ──────────────────────────
      // Camera slowly pushes toward chef. Firelight begins faint flicker.
      // ─── SCENE 2: FIRE IGNITION (0.20 to 0.40) ────────────────────────
      // Flames grow beneath the wok with turbulence. Sparks rise.
      // ─── SCENE 3: INGREDIENTS IN MOTION (0.40 to 0.60) ────────────────
      // Ingredients toss from wok into the air with 3D rotation and depth.
      // ─── SCENE 4: THE CHEF COOKS / SEAR FLARE (0.60 to 0.80) ──────────
      // Peak wok toss, flames flare upward, embers streak past camera.
      // ─── SCENE 5: SIGNATURE DISH REVEAL (0.80 to 1.0) ─────────────────
      // Ingredients settle back in wok, flames calm, aromatic steam rises.

      // CAMERA POSITIONING LERP
      let targetCamX = 0;
      let targetCamY = 0;
      let targetCamZ = 7.8;
      let targetLookX = 0.5;
      let targetLookY = 0;

      if (p < 0.2) {
        // Scene 1: Wide reveal pushing in
        const s = p / 0.2;
        targetCamX = 0.0 + s * 0.3;
        targetCamY = 0.0 - s * 0.15;
        targetCamZ = 7.8 - s * 0.8;
      } else if (p < 0.4) {
        // Scene 2: Pushing closer to wok burner
        const s = (p - 0.2) / 0.2;
        targetCamX = 0.3 + s * 0.4;
        targetCamY = -0.15 - s * 0.25;
        targetCamZ = 7.0 - s * 0.8;
        targetLookX = 0.6 + s * 0.3;
        targetLookY = -0.1 - s * 0.3;
      } else if (p < 0.6) {
        // Scene 3: Floating ingredients view
        const s = (p - 0.4) / 0.2;
        targetCamX = 0.7 + s * 0.3;
        targetCamY = -0.4 + s * 0.3; // tilt slightly up to watch flying food
        targetCamZ = 6.2 - s * 0.5;
        targetLookX = 0.9 + s * 0.2;
        targetLookY = -0.4 + s * 0.2;
      } else if (p < 0.8) {
        // Scene 4: Dramatic close angle for flame flare
        const s = (p - 0.6) / 0.2;
        targetCamX = 1.0 + s * 0.2;
        targetCamY = -0.1 - s * 0.3;
        targetCamZ = 5.7 - s * 0.7;
        targetLookX = 1.2 + s * 0.2;
        targetLookY = -0.6 - s * 0.2;
      } else {
        // Scene 5: Intimate macro focus on the finished dish
        const s = (p - 0.8) / 0.2;
        targetCamX = 1.2 + s * 0.2;
        targetCamY = -0.4 - s * 0.3;
        targetCamZ = 5.0 - s * 0.4;
        targetLookX = 1.4;
        targetLookY = -0.9 - s * 0.1;
      }

      // Smooth camera interpolation
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.lookAt(targetLookX, targetLookY, 0);

      // LIGHTING INTENSITY LOGIC
      const flicker = Math.sin(time * 18.0) * 0.15 + Math.cos(time * 26.0) * 0.1 + (Math.random() - 0.5) * 0.08;

      if (elements.ambientLight) {
        // Ambient light rises from 0.08 (Scene 1 dark intro) to 0.4
        const targetAmb = p < 0.2 ? 0.08 + (p / 0.2) * 0.15 : 0.23 + p * 0.15;
        elements.ambientLight.intensity = targetAmb;
      }

      if (elements.fireLight) {
        // Fire under wok
        let baseFire = 0;
        if (p < 0.15) {
          baseFire = 0.1 + (p / 0.15) * 0.3;
        } else if (p < 0.4) {
          // Ignition grows
          baseFire = 0.4 + ((p - 0.15) / 0.25) * 2.2;
        } else if (p < 0.6) {
          // Steady cooking heat
          baseFire = 2.6 + Math.sin(time * 12) * 0.4;
        } else if (p < 0.8) {
          // Massive flare
          baseFire = 4.2 + ((p - 0.6) / 0.2) * 3.5;
        } else {
          // Calming to gentle embers
          baseFire = 1.8 * (1.0 - (p - 0.8) / 0.2) + 0.6;
        }
        elements.fireLight.intensity = Math.max(0, baseFire + flicker * baseFire * 0.3);
      }

      if (elements.flareLight) {
        // Flare during Scene 4
        if (p >= 0.6 && p <= 0.85) {
          const flareFactor = Math.sin(((p - 0.6) / 0.25) * Math.PI);
          elements.flareLight.intensity = flareFactor * 5.5 + (Math.random() * 0.8);
        } else {
          elements.flareLight.intensity = 0.0;
        }
      }

      if (elements.dishLight) {
        // Dish spotlight in Scene 5
        if (p > 0.78) {
          const dishProgress = (p - 0.78) / 0.22;
          elements.dishLight.intensity = dishProgress * 3.8;
        } else {
          elements.dishLight.intensity = 0.0;
        }
      }

      // FLAME PARTICLES PHYSICS & OPACITY
      if (elements.flameParticles && elements.flameGeo && elements.flameVelocities) {
        const mat = elements.flameParticles.material as THREE.PointsMaterial;
        let flameOpacity = 0;
        if (p < 0.15) {
          flameOpacity = 0.05;
        } else if (p < 0.4) {
          flameOpacity = 0.15 + ((p - 0.15) / 0.25) * 0.65;
        } else if (p < 0.6) {
          flameOpacity = 0.8;
        } else if (p < 0.8) {
          flameOpacity = 1.0;
        } else {
          flameOpacity = 0.35 * (1.0 - (p - 0.8) / 0.2) + 0.15;
        }
        mat.opacity = flameOpacity;

        const posAttr = elements.flameGeo.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const vels = elements.flameVelocities;
        const flareMultiplier = p >= 0.6 && p <= 0.8 ? 2.5 : 1.0;

        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 0] += vels[i * 3 + 0] + Math.sin(time * 10 + i) * 0.003;
          positions[i * 3 + 1] += vels[i * 3 + 1] * flareMultiplier;
          positions[i * 3 + 2] += vels[i * 3 + 2];

          // Reset flame particle when it reaches peak height
          const peakHeight = -2.6 + (p >= 0.6 && p <= 0.8 ? 2.8 : 1.2);
          if (positions[i * 3 + 1] > peakHeight) {
            positions[i * 3 + 0] = 1.3 + (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 1] = -2.6;
            positions[i * 3 + 2] = 0.5 + (Math.random() - 0.5) * 0.4;
          }
        }
        posAttr.needsUpdate = true;
      }

      // EMBERS MOTION (Continual drift + faster during flare)
      if (elements.emberParticles && elements.emberGeo) {
        const emberAttr = elements.emberGeo.attributes.position as THREE.BufferAttribute;
        const emPos = emberAttr.array as Float32Array;
        const emberSpeed = 0.015 + p * 0.035;

        for (let i = 0; i < emPos.length / 3; i++) {
          emPos[i * 3 + 0] += Math.sin(time * 2 + i) * 0.004;
          emPos[i * 3 + 1] += emberSpeed + Math.cos(time + i) * 0.003;
          emPos[i * 3 + 2] += Math.sin(time * 1.5 + i) * 0.002;

          if (emPos[i * 3 + 1] > 6) {
            emPos[i * 3 + 1] = -4;
            emPos[i * 3 + 0] = (Math.random() - 0.5) * 14;
          }
        }
        emberAttr.needsUpdate = true;
      }

      // VOLUMETRIC SMOKE DRIFT
      if (elements.smokeParticles && elements.smokeGeo && elements.smokeVelocities) {
        const sMat = elements.smokeParticles.material as THREE.PointsMaterial;
        // Smoke is visible in Scene 1 (creeping), peaks in Scene 4, and becomes fragrant steam in Scene 5
        sMat.opacity = p < 0.2 ? 0.15 + (p / 0.2) * 0.15 : 0.25 + Math.sin(p * Math.PI) * 0.2;

        const smokeAttr = elements.smokeGeo.attributes.position as THREE.BufferAttribute;
        const smPos = smokeAttr.array as Float32Array;
        const smVels = elements.smokeVelocities;

        for (let i = 0; i < smPos.length / 3; i++) {
          smPos[i * 3 + 0] += smVels[i * 3 + 0] + Math.sin(time * 1.5 + i) * 0.003;
          smPos[i * 3 + 1] += smVels[i * 3 + 1];
          smPos[i * 3 + 2] += smVels[i * 3 + 2];

          if (smPos[i * 3 + 1] > 2.8) {
            smPos[i * 3 + 0] = 1.4 + (Math.random() - 0.5) * 1.0;
            smPos[i * 3 + 1] = -2.2;
            smPos[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.6;
          }
        }
        smokeAttr.needsUpdate = true;
      }

      // 3D INGREDIENTS FLIGHT & TOSSING MOTION
      if (elements.ingredients) {
        elements.ingredients.forEach((item) => {
          // Ingredients are resting in wok in Scene 1 & 2
          // In Scene 3 & 4 (p between 0.38 and 0.82), they follow a dramatic parabolic tossing arc!
          // In Scene 5 (p > 0.82), they settle gracefully back into the wok.

          let tossFactor = 0;
          if (p >= 0.35 && p <= 0.82) {
            // Parabolic toss arc with phase offset for natural organic stagger
            const localProgress = (p - 0.35) / 0.47;
            const shifted = (localProgress + item.phase) % 1.0;
            tossFactor = Math.sin(shifted * Math.PI);
          } else if (p > 0.82) {
            // Settling back to wok
            tossFactor = Math.max(0, 0.15 * (1.0 - (p - 0.82) / 0.18));
          }

          // Position interpolation
          const curX = THREE.MathUtils.lerp(item.basePos.x, item.peakPos.x, tossFactor);
          const curY = THREE.MathUtils.lerp(item.basePos.y, item.peakPos.y, tossFactor) + Math.sin(time * 3 + item.phase) * 0.04;
          const curZ = THREE.MathUtils.lerp(item.basePos.z, item.peakPos.z, tossFactor);

          item.mesh.position.set(curX, curY, curZ);

          // Continuous 3D rotation in flight
          if (tossFactor > 0.05) {
            item.mesh.rotation.x += item.rotationSpeed.x * delta * (1.0 + tossFactor * 2.0);
            item.mesh.rotation.y += item.rotationSpeed.y * delta * (1.0 + tossFactor * 2.0);
            item.mesh.rotation.z += item.rotationSpeed.z * delta * (1.0 + tossFactor * 2.0);
          } else {
            // Gentle resting rotation
            item.mesh.rotation.x = Math.sin(time * 0.8 + item.phase) * 0.2;
            item.mesh.rotation.z = Math.cos(time * 0.8 + item.phase) * 0.2;
          }
        });
      }

      // CHEF PLANE PARALLAX AND KINETIC TILT
      if (elements.chefPlane) {
        // Slight tilt reaction during heavy toss (Scene 4)
        const wokTilt = p >= 0.55 && p <= 0.8 ? Math.sin((p - 0.55) / 0.25 * Math.PI) * 0.04 : 0;
        elements.chefPlane.rotation.z = -wokTilt;
        elements.chefPlane.position.y = wokTilt * 0.8;
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 1 }}
    />
  );
}
