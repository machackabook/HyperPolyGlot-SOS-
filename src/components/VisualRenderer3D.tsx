import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EnvironmentState, VfsNode } from '../types';
import { audioVoiceService } from '../services/audioVoiceService';
import { vfs } from '../services/vfsService';
import { navigatorService } from '../services/navigatorService';
import { geoNexusService, GeoTelemetry } from '../services/geoNexusService';
import { EarthNasaOverlay } from './EarthNasaOverlay';
import { useState } from 'react';

interface VisualRenderer3DProps {
  envState: EnvironmentState;
  onSceneClick?: () => void;
}

interface VfsStarNode {
  mesh: THREE.Mesh;
  label: string;
  path: string;
  type: 'file' | 'directory';
  data: any;
  velocity: THREE.Vector3;
  originalPos: THREE.Vector3;
}

export const VisualRenderer3D: React.FC<VisualRenderer3DProps> = ({ envState, onSceneClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const envRef = useRef<EnvironmentState>(envState);
  const [geoTelemetry, setGeoTelemetry] = useState<GeoTelemetry>(geoNexusService.getTelemetry());

  useEffect(() => {
    return geoNexusService.onTelemetryChange(setGeoTelemetry);
  }, []);
  const telemetryHistory = useRef<{
    packets: number[];
    throughput: number[];
    jitter: number[];
  }>({
    packets: new Array(60).fill(0),
    throughput: new Array(60).fill(0),
    jitter: new Array(60).fill(0)
  });

  // Keep envRef updated so render loop accesses the latest values without recreation
  useEffect(() => {
    envRef.current = envState;
  }, [envState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050b, 0.0025);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    camera.position.set(0, 0, 140);
    camera.rotation.order = 'YXZ';

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f2ff, 1.8);
    keyLight.position.set(60, 80, 70);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.4);
    rimLight.position.set(-60, -40, -50);
    scene.add(rimLight);

    // 3. Procedural Topologies Group
    const topologiesGroup = new THREE.Group();
    scene.add(topologiesGroup);

    // Topology A: Torus Knot (Neuti-ba Knot)
    const torusGeo = new THREE.TorusKnotGeometry(32, 6.8, 240, 32, 3, 5);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    topologiesGroup.add(torusMesh);

    // Topology B: 4D Tesseract (Hypercube Wireframe)
    const tesseractGroup = new THREE.Group();
    const hypercube4D: number[][] = [];
    for (let i = 0; i < 16; i++) {
      hypercube4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }
    const tesseractEdges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) if (hypercube4D[i][k] !== hypercube4D[j][k]) diff++;
        if (diff === 1) tesseractEdges.push([i, j]);
      }
    }
    const tessLineGeo = new THREE.BufferGeometry();
    const tessPositions = new Float32Array(tesseractEdges.length * 6);
    tessLineGeo.setAttribute('position', new THREE.BufferAttribute(tessPositions, 3));
    const tessLineMat = new THREE.LineBasicMaterial({
      color: 0xff003c,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    const tesseractLines = new THREE.LineSegments(tessLineGeo, tessLineMat);
    tesseractGroup.add(tesseractLines);
    topologiesGroup.add(tesseractGroup);

    // Topology C: Singularity Core (Accretion Disc + Lensing Rings)
    const singularityGroup = new THREE.Group();
    const coreSphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const coreSphereMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    singularityGroup.add(coreSphere);

    const accretionGeo = new THREE.RingGeometry(18, 48, 64);
    const accretionMat = new THREE.MeshBasicMaterial({
      color: 0xff003c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const accretionRing = new THREE.Mesh(accretionGeo, accretionMat);
    accretionRing.rotation.x = Math.PI * 0.42;
    singularityGroup.add(accretionRing);
    topologiesGroup.add(singularityGroup);

    // Topology D: Neural Synaptic Mesh
    const neuralGroup = new THREE.Group();
    const neuronCount = 42;
    const neuronPositions: THREE.Vector3[] = [];
    const neuronMat = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.8 });
    for (let i = 0; i < neuronCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      neuronPositions.push(pos);
      const nGeo = new THREE.SphereGeometry(1.8, 12, 12);
      const nMesh = new THREE.Mesh(nGeo, neuronMat);
      nMesh.position.copy(pos);
      neuralGroup.add(nMesh);
    }
    const axonGeo = new THREE.BufferGeometry();
    const axonPosList: number[] = [];
    for (let i = 0; i < neuronCount; i++) {
      for (let j = i + 1; j < neuronCount; j++) {
        if (neuronPositions[i].distanceTo(neuronPositions[j]) < 28) {
          axonPosList.push(
            neuronPositions[i].x, neuronPositions[i].y, neuronPositions[i].z,
            neuronPositions[j].x, neuronPositions[j].y, neuronPositions[j].z
          );
        }
      }
    }
    axonGeo.setAttribute('position', new THREE.Float32BufferAttribute(axonPosList, 3));
    const axonMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending });
    const axonLines = new THREE.LineSegments(axonGeo, axonMat);
    neuralGroup.add(axonLines);
    topologiesGroup.add(neuralGroup);

    // Topology E: 7-Galaxy Relativistic Orbitals
    const galaxyGroup = new THREE.Group();
    const orbitalRings = [30, 48, 66, 84, 102, 120, 138];
    orbitalRings.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0xa855f7 : 0x00f2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      rMesh.rotation.x = Math.PI * 0.35 + idx * 0.08;
      rMesh.rotation.y = idx * 0.18;
      galaxyGroup.add(rMesh);
    });
    topologiesGroup.add(galaxyGroup);

    // Topology F: DNA Double Helix
    const dnaGroup = new THREE.Group();
    const dnaSteps = 40;
    const strandRadius = 14;
    const strandLength = 80;
    const dnaPoints: number[] = [];
    for (let i = 0; i < dnaSteps; i++) {
      const t = (i / dnaSteps) * Math.PI * 4;
      const y = (i / dnaSteps) * strandLength - strandLength / 2;
      const x1 = Math.cos(t) * strandRadius;
      const z1 = Math.sin(t) * strandRadius;
      const x2 = Math.cos(t + Math.PI) * strandRadius;
      const z2 = Math.sin(t + Math.PI) * strandRadius;
      // Base pair connector
      dnaPoints.push(x1, y, z1, x2, y, z2);
    }
    const dnaGeo = new THREE.BufferGeometry();
    dnaGeo.setAttribute('position', new THREE.Float32BufferAttribute(dnaPoints, 3));
    const dnaMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const dnaMesh = new THREE.LineSegments(dnaGeo, dnaMat);
    dnaGroup.add(dnaMesh);
    topologiesGroup.add(dnaGroup);

    // Topology G: Filesystem Galaxy (VFS)
    const galaxyVfsGroup = new THREE.Group();
    const vfsNodes: VfsStarNode[] = [];
    scene.add(galaxyVfsGroup);

    function buildFilesystemGalaxy() {
      // Clear existing
      while (galaxyVfsGroup.children.length > 0) {
        const child = galaxyVfsGroup.children[0];
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
        galaxyVfsGroup.remove(child);
      }
      vfsNodes.length = 0;

      const flatNodes: { name: string; node: VfsNode; path: string; depth: number }[] = [];
      const recurse = (curr: VfsNode, path: string, depth: number) => {
        if (!curr.children) return;
        Object.entries(curr.children).forEach(([name, child]) => {
          const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
          flatNodes.push({ name, node: child, path: fullPath, depth });
          if (child.type === 'directory') recurse(child, fullPath, depth + 1);
        });
      };
      recurse(vfs.getNode('/', '/').node!, '/', 0);

      // Layout in a spiral galaxy formation
      flatNodes.forEach((item, idx) => {
        const phi = Math.acos(-1 + (2 * idx) / flatNodes.length);
        const theta = Math.sqrt(flatNodes.length * Math.PI) * phi;
        
        // Cluster logic: distance from center based on depth + some randomness
        const spiralFactor = idx * 0.15;
        const radius = 25 + item.depth * 50 + Math.random() * 20 + spiralFactor;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const isDir = item.node.type === 'directory';
        const geo = isDir 
          ? new THREE.IcosahedronGeometry(3, 1) 
          : new THREE.BoxGeometry(2, 2, 2);
        
        const color = isDir ? 0xa855f7 : 0x00f2ff;
        const mat = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8,
          shininess: 100,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        galaxyVfsGroup.add(mesh);

        vfsNodes.push({
          mesh,
          label: item.name,
          path: item.path,
          type: item.node.type,
          data: item.node,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1),
          originalPos: mesh.position.clone(),
        });
      });
    }

    buildFilesystemGalaxy();

    // Topology H: Robotics Lab (Laser Grid + Manipulators)
    const roboticsLabGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(200, 20, 0x00f2ff, 0x02050b);
    gridHelper.position.y = -50;
    roboticsLabGroup.add(gridHelper);
    const armGeo = new THREE.BoxGeometry(4, 30, 4);
    const armMat = new THREE.MeshPhongMaterial({ color: 0x64748b, emissive: 0x334155 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, -35, 0);
    roboticsLabGroup.add(arm);
    topologiesGroup.add(roboticsLabGroup);

    // Topology I: Protein Fold (AlphaFold Ribbon)
    const proteinFoldGroup = new THREE.Group();
    const proteinPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 60; i++) {
      proteinPoints.push(new THREE.Vector3(
        Math.sin(i * 0.4) * 25,
        i * 2 - 60,
        Math.cos(i * 0.4) * 25
      ));
    }
    const proteinCurve = new THREE.CatmullRomCurve3(proteinPoints);
    const proteinGeo = new THREE.TubeGeometry(proteinCurve, 64, 2, 8, false);
    const proteinMat = new THREE.MeshPhongMaterial({ color: 0x10b981, emissive: 0x064e3b, wireframe: true });
    const proteinMesh = new THREE.Mesh(proteinGeo, proteinMat);
    proteinFoldGroup.add(proteinMesh);
    topologiesGroup.add(proteinFoldGroup);

    // Topology J: Earth NASA (Planetary Mesh + Satellites)
    const earthNasaGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(40, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ 
      color: 0x1e3a8a, 
      emissive: 0x1d4ed8, 
      emissiveIntensity: 0.2,
      wireframe: true 
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthNasaGroup.add(earth);
    // Add satellite rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(55 + i * 10, 0.2, 8, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5);
      ring.rotation.y = (Math.random() - 0.5);
      earthNasaGroup.add(ring);
    }
    topologiesGroup.add(earthNasaGroup);

    // 4. 4,000 Interactive Vector Flow Particles
    const PARTICLE_COUNT = 4000;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);
    const pBase: { theta: number; phi: number; r: number; speed: number; waveOffset: number }[] = [];

    const c1 = new THREE.Color(0x00f2ff);
    const c2 = new THREE.Color(0xa855f7);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 35 + Math.random() * 150;

      pBase.push({ theta, phi, r, speed: 0.3 + Math.random() * 0.8, waveOffset: Math.random() * 10 });
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);

      const lerped = c1.clone().lerp(c2, Math.random());
      pColors[i * 3] = lerped.r;
      pColors[i * 3 + 1] = lerped.g;
      pColors[i * 3 + 2] = lerped.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(pGeo, pMat);
    scene.add(particleField);

    // 5. Floating 3D Holographic Speech Banner
    const speechCanvas = document.createElement('canvas');
    speechCanvas.width = 1024;
    speechCanvas.height = 256;
    const speechTexture = new THREE.CanvasTexture(speechCanvas);
    speechTexture.colorSpace = THREE.SRGBColorSpace;
    const speechMat = new THREE.MeshBasicMaterial({
      map: speechTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const speechGeo = new THREE.PlaneGeometry(70, 17.5);
    const speechPlane = new THREE.Mesh(speechGeo, speechMat);
    speechPlane.position.set(0, 56, 10);
    scene.add(speechPlane);

    function updateSpeechHologramTexture(text: string, glyph: string, colorHex: string) {
      const sCtx = speechCanvas.getContext('2d');
      if (!sCtx) return;
      sCtx.clearRect(0, 0, 1024, 256);

      if (!text && !glyph) {
        speechTexture.needsUpdate = true;
        return;
      }

      // Background rounded banner
      sCtx.fillStyle = 'rgba(3, 8, 20, 0.75)';
      sCtx.strokeStyle = colorHex;
      sCtx.lineWidth = 4;
      sCtx.beginPath();
      sCtx.roundRect(20, 20, 984, 216, 24);
      sCtx.fill();
      sCtx.stroke();

      // Holographic glowing glyph
      sCtx.font = 'bold 54px Orbitron, sans-serif';
      sCtx.fillStyle = colorHex;
      sCtx.textAlign = 'left';
      sCtx.fillText(glyph || '⨋', 50, 135);

      // Speech / Transcription text
      sCtx.font = 'bold 30px "JetBrains Mono", monospace';
      sCtx.fillStyle = '#ffffff';
      const maxLen = 48;
      const truncated = text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
      sCtx.fillText(truncated || 'Neural Voice Core Ready', 120, 130);

      // Tagline
      sCtx.font = '20px "JetBrains Mono", monospace';
      sCtx.fillStyle = colorHex;
      sCtx.fillText(`// AI VOICE PROJECTION   SENTIMENT: ${envRef.current.sentiment.toUpperCase()}`, 120, 175);

      speechTexture.needsUpdate = true;
    }

    // 6. Interactive Mouse & Gesture Advection
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragRotX = 0;
    let dragRotY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredNodeId: string | null = null;

    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    const onKeyDown = (e: KeyboardEvent) => { if (keys.hasOwnProperty(e.key)) (keys as any)[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (keys.hasOwnProperty(e.key)) (keys as any)[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => { isDragging = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - lastX;
        const deltaY = e.touches[0].clientY - lastY;
        dragRotY += deltaX * 0.005;
        dragRotX += deltaY * 0.005;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);

    const onPointerMove = (e: MouseEvent) => {
      const nx = (e.clientX - width / 2) / (width / 2);
      const ny = (e.clientY - height / 2) / (height / 2);
      mouseX = nx;
      mouseY = ny;
      
      // Default parallax tilt (non-persistent)
      targetRotY = nx * 0.45;
      targetRotX = ny * 0.35;

      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        dragRotY += deltaX * 0.005;
        dragRotX += deltaY * 0.005;
        lastX = e.clientX;
        lastY = e.clientY;
      }

      // Update mouse for raycasting
      mouse.x = (e.clientX / width) * 2 - 1;
      mouse.y = -(e.clientY / height) * 2 + 1;
    };
    window.addEventListener('mousemove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 7. Master Continuous Render Loop
    let animId: number;
    let lastTime = performance.now();
    let smoothedAudio = 0;
    let lastSpokenText = '';

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentEnv = envRef.current;
      const t = (now * 0.0008 * currentEnv.speed) % 86400;

      // Real-time audio analyser polling
      const audioBytes = audioVoiceService.getAudioFrequencyData();
      let audioVolume = 0;
      if (audioBytes && audioBytes.length > 0) {
        let sum = 0;
        for (let i = 0; i < audioBytes.length; i++) sum += audioBytes[i];
        audioVolume = (sum / audioBytes.length) / 255;
      }
      smoothedAudio += (audioVolume - smoothedAudio) * 0.2;

      // Update 3D Holographic Speech Texture if text changed
      if (currentEnv.activeSpeechText !== lastSpokenText) {
        lastSpokenText = currentEnv.activeSpeechText;
        updateSpeechHologramTexture(lastSpokenText, currentEnv.floatingGlyph, currentEnv.primaryColor);
      }

      // Smooth camera and group orientation
      if (currentEnv.topology === 'galaxy_vfs') {
        // In galaxy mode, drag rotates the camera look direction
        camera.rotation.y = dragRotY + targetRotY * 0.2;
        camera.rotation.x = -dragRotX + targetRotX * 0.2;
      } else {
        // In object modes, drag rotates the topology group
        topologiesGroup.rotation.y += (dragRotY + targetRotY - topologiesGroup.rotation.y) * 0.05;
        topologiesGroup.rotation.x += (dragRotX + targetRotX - topologiesGroup.rotation.x) * 0.05;
      }

      // Visibility toggles based on active topology
      torusMesh.visible = currentEnv.topology === 'torus';
      tesseractGroup.visible = currentEnv.topology === 'tesseract';
      singularityGroup.visible = currentEnv.topology === 'singularity';
      neuralGroup.visible = currentEnv.topology === 'neural';
      galaxyGroup.visible = currentEnv.topology === 'galaxy';
      dnaGroup.visible = currentEnv.topology === 'dna';
      galaxyVfsGroup.visible = currentEnv.topology === 'galaxy_vfs';
      roboticsLabGroup.visible = currentEnv.topology === 'robotics_lab';
      proteinFoldGroup.visible = currentEnv.topology === 'protein_fold';
      earthNasaGroup.visible = currentEnv.topology === 'earth_nasa';

      // Camera Movement for Galaxy VFS
      if (currentEnv.topology === 'galaxy_vfs') {
        const moveSpeed = 1.2 * currentEnv.speed;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        if (keys.w || keys.ArrowUp) camera.position.addScaledVector(dir, moveSpeed);
        if (keys.s || keys.ArrowDown) camera.position.addScaledVector(dir, -moveSpeed);
        
        const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
        if (keys.a || keys.ArrowLeft) camera.position.addScaledVector(side, moveSpeed);
        if (keys.d || keys.ArrowRight) camera.position.addScaledVector(side, -moveSpeed);

        // Keep camera from going too far or sinking into nothingness
        const dist = camera.position.length();
        if (dist > 1500) camera.position.setLength(1500);

        // Raycasting for hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(galaxyVfsGroup.children);
        if (intersects.length > 0) {
          const hoveredMesh = intersects[0].object as THREE.Mesh;
          const node = vfsNodes.find(n => n.mesh === hoveredMesh);
          hoveredNodeId = node ? node.path : null;
        } else {
          hoveredNodeId = null;
        }

        // Individual node animations
        let closestNode: VfsStarNode | null = null;
        let minDistance = Infinity;

        vfsNodes.forEach((n) => {
          n.mesh.rotation.x += n.velocity.x;
          n.mesh.rotation.y += n.velocity.y;
          
          const pulse = 1 + Math.sin(t * 2 + n.originalPos.x) * 0.1 + smoothedAudio * 0.2;
          n.mesh.scale.setScalar(pulse);

          const d = n.mesh.position.distanceTo(camera.position);
          if (d < minDistance) {
            minDistance = d;
            closestNode = n;
          }

          // Highlight hovered node
          if (n.path === hoveredNodeId) {
            (n.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.5;
          } else {
            (n.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
          }
        });

        // Trigger Gemini Navigator if close enough to a node
        if (closestNode && minDistance < 50) {
          navigatorService.navigateToNode(
            (closestNode as VfsStarNode).label,
            (closestNode as VfsStarNode).path,
            (closestNode as VfsStarNode).type,
            (closestNode as VfsStarNode).data.content
          );
        }
      } else {
        // Reset camera if not in VFS mode
        const targetPos = new THREE.Vector3(0, 0, 140);
        camera.position.lerp(targetPos, 0.02);
        camera.lookAt(0, 0, 0);
      }

      // Primary color update for active material
      const targetCol = new THREE.Color(currentEnv.primaryColor);
      const secondaryCol = new THREE.Color(currentEnv.secondaryColor);
      const bloom = currentEnv.bloomIntensity;

      // Modulate lights
      keyLight.intensity = 1.8 * bloom;
      rimLight.intensity = 1.4 * bloom;

      // Animate active topology
      if (currentEnv.topology === 'torus') {
        torusMat.color.lerp(targetCol, 0.08);
        torusMat.opacity = 0.55 * bloom;
        torusMesh.rotation.x = t * 0.5;
        torusMesh.rotation.y = t * 0.7;
        const scale = 1 + Math.sin(t * 3) * 0.06 + smoothedAudio * 0.35;
        torusMesh.scale.setScalar(scale);
      } else if (currentEnv.topology === 'tesseract') {
        tessLineMat.color.lerp(targetCol, 0.08);
        tessLineMat.opacity = 0.85 * bloom;
        // 4D Givens rotation
        const angleXW = t * 0.7;
        const angleYZ = t * 0.5;
        const cosXW = Math.cos(angleXW), sinXW = Math.sin(angleXW);
        const cosYZ = Math.cos(angleYZ), sinYZ = Math.sin(angleYZ);

        const posAttr = tesseractLines.geometry.attributes.position;
        let lineIdx = 0;
        for (let e = 0; e < tesseractEdges.length; e++) {
          const v1 = hypercube4D[tesseractEdges[e][0]];
          const v2 = hypercube4D[tesseractEdges[e][1]];

          // Rotate v1
          const x1 = v1[0] * cosXW - v1[3] * sinXW;
          const w1 = v1[0] * sinXW + v1[3] * cosXW;
          const y1 = v1[1] * cosYZ - v1[2] * sinYZ;
          const z1 = v1[1] * sinYZ + v1[2] * cosYZ;
          const s1 = (38 / (3.2 - w1 * 0.7)) * (1 + smoothedAudio * 0.3);

          // Rotate v2
          const x2 = v2[0] * cosXW - v2[3] * sinXW;
          const w2 = v2[0] * sinXW + v2[3] * cosXW;
          const y2 = v2[1] * cosYZ - v2[2] * sinYZ;
          const z2 = v2[1] * sinYZ + v2[2] * cosYZ;
          const s2 = (38 / (3.2 - w2 * 0.7)) * (1 + smoothedAudio * 0.3);

          posAttr.setXYZ(lineIdx++, x1 * s1, y1 * s1, z1 * s1);
          posAttr.setXYZ(lineIdx++, x2 * s2, y2 * s2, z2 * s2);
        }
        posAttr.needsUpdate = true;
      } else if (currentEnv.topology === 'singularity') {
        accretionMat.color.lerp(targetCol, 0.08);
        accretionMat.opacity = 0.65 * bloom;
        accretionRing.rotation.z = t * 1.5;
        const pulse = 1 + Math.sin(t * 4) * 0.08 + smoothedAudio * 0.5;
        accretionRing.scale.setScalar(pulse);
      } else if (currentEnv.topology === 'neural') {
        axonMat.color.lerp(targetCol, 0.08);
        axonMat.opacity = 0.45 * bloom;
        neuronMat.color.lerp(secondaryCol, 0.08);
        neuronMat.opacity = 0.8 * bloom;
        neuralGroup.rotation.y = t * 0.4;
      } else if (currentEnv.topology === 'galaxy') {
        galaxyGroup.rotation.z = t * 0.3;
        galaxyGroup.rotation.y = t * 0.2;
        // ring opacities could be modulated too but they were individual
      } else if (currentEnv.topology === 'dna') {
        dnaMat.color.lerp(targetCol, 0.08);
        dnaMat.opacity = 0.7 * bloom;
        dnaGroup.rotation.y = t * 0.8;
      } else if (currentEnv.topology === 'galaxy_vfs') {
        // Master rotation of the galaxy
        galaxyVfsGroup.rotation.y = t * 0.05;
      } else if (currentEnv.topology === 'robotics_lab') {
        arm.rotation.y = t * 2;
        arm.position.x = Math.sin(t) * 20;
        gridHelper.material.opacity = 0.4 * bloom;
      } else if (currentEnv.topology === 'protein_fold') {
        proteinMat.color.lerp(targetCol, 0.08);
        proteinFoldGroup.rotation.y = t * 0.5;
        const scale = 1 + Math.sin(t * 2) * 0.1 + smoothedAudio * 0.3;
        proteinFoldGroup.scale.setScalar(scale);
      } else if (currentEnv.topology === 'earth_nasa') {
        earth.rotation.y = t * 0.2;
        earthMat.color.lerp(targetCol, 0.08);
        earthNasaGroup.children.forEach((child, idx) => {
          if (idx > 0) { // skip earth
            child.rotation.z += 0.01 * currentEnv.speed;
          }
        });
      }

      // Animate Particles with Gravity & Audio reactivity
      const pPosArr = particleField.geometry.attributes.position.array as Float32Array;
      const pColArr = particleField.geometry.attributes.color.array as Float32Array;
      const grav = currentEnv.gravity;
      const turb = currentEnv.turbulence;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const d = pBase[i];
        const angle = d.theta + t * 0.2 * d.speed * grav;
        const wave = Math.sin(d.phi * 5 + t * 2 + d.waveOffset) * 10 * turb;
        const r = (d.r + wave) * (1 + smoothedAudio * 0.25);

        const x = r * Math.sin(d.phi) * Math.cos(angle);
        const y = r * Math.sin(d.phi) * Math.sin(angle);
        const z = r * Math.cos(d.phi);

        const i3 = i * 3;
        pPosArr[i3] = x;
        pPosArr[i3 + 1] = y;
        pPosArr[i3 + 2] = z;

        // Color modulation
        pColArr[i3] = targetCol.r * (0.8 + smoothedAudio * 0.5) * bloom;
        pColArr[i3 + 1] = targetCol.g * (0.8 + smoothedAudio * 0.5) * bloom;
        pColArr[i3 + 2] = secondaryCol.b * (0.8 + smoothedAudio * 0.5) * bloom;
      }
      particleField.geometry.attributes.position.needsUpdate = true;
      particleField.geometry.attributes.color.needsUpdate = true;
      pMat.opacity = 0.85 * Math.min(1.0, bloom);

      // Floating speech plane gentle hover
      speechPlane.position.y = 54 + Math.sin(t * 1.5) * 3;
      speechPlane.rotation.y = Math.sin(t * 0.8) * 0.08;

      // Update Telemetry History (Sample every frame for smoothness)
      if (currentEnv.d3Stream.active) {
        const hist = telemetryHistory.current;
        // Shift and push new values with slight aesthetic jitter
        const pkts = currentEnv.d3Stream.packetRate + (Math.random() - 0.5) * 40;
        const tp = currentEnv.d3Stream.throughputMbps + (Math.random() - 0.5) * 10;
        const jt = currentEnv.d3Stream.jitterMs + (Math.random() - 0.5) * 0.1;

        hist.packets.shift(); hist.packets.push(pkts);
        hist.throughput.shift(); hist.throughput.push(tp);
        hist.jitter.shift(); hist.jitter.push(jt);
      }

      // Render 2D Stratum 0 HUD Overlay
      renderHudCanvas(now, currentEnv, audioBytes, camera, vfsNodes, hoveredNodeId);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      speechGeo.dispose();
      speechMat.dispose();
      speechTexture.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2D Canvas Holographic Radar & Audio Spectrum HUD (Stratum 0)
  const renderHudCanvas = (
    now: number, 
    env: EnvironmentState, 
    audioBytes: Uint8Array | null, 
    camera: THREE.Camera,
    vfsNodes: VfsStarNode[],
    hoveredNodeId: string | null
  ) => {
    const canvas = hudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // VFS Node Labels (Project 3D to 2D)
    if (env.topology === 'galaxy_vfs') {
      ctx.textAlign = 'center';
      vfsNodes.forEach((node) => {
        const isHovered = node.path === hoveredNodeId;
        const vector = node.mesh.position.clone();
        vector.project(camera);

        const x = (vector.x + 1) * w / 2;
        const y = -(vector.y - 1) * h / 2;

        const dist = node.mesh.position.distanceTo(camera.position);
        
        // Show label if within proximity OR hovered
        if (vector.z < 1.0 && (dist < 300 || isHovered)) {
          const proximityOpacity = Math.max(0, 1 - dist / 300);
          const opacity = isHovered ? 1.0 : proximityOpacity;
          
          if (opacity > 0.05) {
            const hexOpacity = Math.floor(opacity * 255).toString(16).padStart(2, '0');
            
            // Hover highlight effect
            if (isHovered) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = env.primaryColor;
            } else {
              ctx.shadowBlur = 0;
            }

            ctx.fillStyle = `${node.type === 'directory' ? env.secondaryColor : '#ffffff'}${hexOpacity}`;
            const fontSize = isHovered ? 18 : Math.max(10, 16 - dist / 30);
            ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
            ctx.fillText(node.label.toUpperCase(), x, y - 10);
            
            // Show full path on proximity or hover
            if (dist < 80 || isHovered) {
              ctx.font = '10px "JetBrains Mono", monospace';
              ctx.fillStyle = `${env.primaryColor}${Math.floor(opacity * 180).toString(16).padStart(2, '0')}`;
              ctx.fillText(node.path, x, y + 10);
            }
            
            ctx.shadowBlur = 0;
          }
        }
      });
    }

    // Outer cybernetic radar rings
    ctx.strokeStyle = `${env.primaryColor}22`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${env.secondaryColor}18`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    // Telemetry Oscilloscope HUD (Bottom Left)
    if (env.d3Stream.active) {
      const hist = telemetryHistory.current;
      const boxW = 200;
      const boxH = 120;
      const bx = 24;
      const by = h - boxH - 70; // Positioned above the audio wave

      // Backdrop
      ctx.fillStyle = 'rgba(3, 8, 20, 0.85)';
      ctx.strokeStyle = `${env.primaryColor}55`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      // Grid lines inside scope
      ctx.strokeStyle = `${env.primaryColor}11`;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const gy = by + (boxH / 4) * i;
        ctx.moveTo(bx + 5, gy);
        ctx.lineTo(bx + boxW - 5, gy);
      }
      ctx.stroke();

      // Title & Live Metrics
      ctx.font = 'bold 9px "Orbitron", sans-serif';
      ctx.fillStyle = env.primaryColor;
      ctx.textAlign = 'left';
      ctx.fillText('LIVE TELEMETRY STREAM', bx + 12, by + 18);

      const drawScope = (data: number[], color: string, label: string, yOffset: number, maxVal: number, unit: string) => {
        const latest = data[data.length - 1];
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = `${color}cc`;
        ctx.fillText(`${label}: ${latest.toFixed(latest < 10 ? 2 : 0)}${unit}`, bx + 12, by + yOffset);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const step = (boxW - 24) / (data.length - 1);
        data.forEach((val, i) => {
          const x = bx + 12 + i * step;
          const norm = Math.min(1, val / maxVal);
          const y = (by + boxH - 15) - norm * 60; // Scaled to fit in bottom half of box
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      // Draw layered waves
      drawScope(hist.packets, env.primaryColor, 'PKTS', 32, 5000, '/s');
      drawScope(hist.throughput, env.secondaryColor, 'TRPT', 44, 1000, 'MB');
      drawScope(hist.jitter, '#fbbf24', 'JITR', 56, 5, 'ms');
    }

    // Live Audio Spectrum Oscilloscope Wave at bottom
    if (audioBytes && audioBytes.length > 0) {
      ctx.strokeStyle = env.primaryColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sliceWidth = w / audioBytes.length;
      let x = 0;
      for (let i = 0; i < audioBytes.length; i++) {
        const v = audioBytes[i] / 255.0;
        const y = h - 12 - v * 40;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    }

    // Top Right Telemetry Stamp
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = `${env.primaryColor}cc`;
    ctx.textAlign = 'right';
    ctx.fillText(`TOPOLOGY: ${env.topology.toUpperCase()}`, w - 24, 28);
    ctx.fillStyle = `${env.secondaryColor}bb`;
    ctx.fillText(`SENTIMENT: ${env.sentiment.toUpperCase()}`, w - 24, 44);
    ctx.fillStyle = '#64748b';
    ctx.fillText(`G4: ${env.gravity.toFixed(2)} | V: ${env.speed.toFixed(2)}x`, w - 24, 60);

    // Physical Geolocation Tracker (Top Left)
    if (geoTelemetry.status === 'active') {
      ctx.textAlign = 'left';
      ctx.fillStyle = `${env.primaryColor}88`;
      ctx.font = 'bold 9px "Orbitron", sans-serif';
      ctx.fillText('PHYSICAL NODE TRACKER', 24, 28);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffffaa';
      ctx.fillText(`LAT: ${geoTelemetry.lat.toFixed(6)}`, 24, 40);
      ctx.fillText(`LNG: ${geoTelemetry.lng.toFixed(6)}`, 24, 50);
      ctx.fillStyle = `${env.secondaryColor}aa`;
      ctx.fillText(`PLUS: ${geoTelemetry.plusCode}`, 24, 60);
    }

    // Solfeggio indicator
    if (env.solfeggio963) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('963 HZ SOLFEGGIO: ACTIVE', w - 24, 76);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-[#02050b]" onClick={onSceneClick}>
      {/* Three.js 3D/4D WebGL Canvas Layer */}
      <div ref={mountRef} className="fixed inset-0 w-full h-full z-0 cursor-default" />

      {/* 2D Canvas Holographic HUD Overlay */}
      <canvas ref={hudCanvasRef} className="fixed inset-0 w-full h-full z-10 pointer-events-none" />

      {/* Photorealistic 3D Earth Overlay (Google Maps Platform) */}
      <EarthNasaOverlay active={envState.topology === 'earth_nasa'} />

      {/* Scanline CRT texture */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-35"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};
