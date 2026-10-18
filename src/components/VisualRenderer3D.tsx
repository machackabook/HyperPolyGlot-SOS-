import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EnvironmentState } from '../types';
import { audioVoiceService } from '../services/audioVoiceService';

interface VisualRenderer3DProps {
  envState: EnvironmentState;
  onSceneClick?: () => void;
}

export const VisualRenderer3D: React.FC<VisualRenderer3DProps> = ({ envState, onSceneClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const envRef = useRef<EnvironmentState>(envState);

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

    const onPointerMove = (e: MouseEvent) => {
      const nx = (e.clientX - width / 2) / (width / 2);
      const ny = (e.clientY - height / 2) / (height / 2);
      mouseX = nx;
      mouseY = ny;
      targetRotY = nx * 0.45;
      targetRotX = ny * 0.35;
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
      topologiesGroup.rotation.y += (targetRotY - topologiesGroup.rotation.y) * 0.05;
      topologiesGroup.rotation.x += (targetRotX - topologiesGroup.rotation.x) * 0.05;

      // Visibility toggles based on active topology
      torusMesh.visible = currentEnv.topology === 'torus';
      tesseractGroup.visible = currentEnv.topology === 'tesseract';
      singularityGroup.visible = currentEnv.topology === 'singularity';
      neuralGroup.visible = currentEnv.topology === 'neural';
      galaxyGroup.visible = currentEnv.topology === 'galaxy';
      dnaGroup.visible = currentEnv.topology === 'dna';

      // Primary color update for active material
      const targetCol = new THREE.Color(currentEnv.primaryColor);
      const secondaryCol = new THREE.Color(currentEnv.secondaryColor);

      // Animate active topology
      if (currentEnv.topology === 'torus') {
        torusMat.color.lerp(targetCol, 0.08);
        torusMesh.rotation.x = t * 0.5;
        torusMesh.rotation.y = t * 0.7;
        const scale = 1 + Math.sin(t * 3) * 0.06 + smoothedAudio * 0.35;
        torusMesh.scale.setScalar(scale);
      } else if (currentEnv.topology === 'tesseract') {
        tessLineMat.color.lerp(targetCol, 0.08);
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
        accretionRing.rotation.z = t * 1.5;
        const pulse = 1 + Math.sin(t * 4) * 0.08 + smoothedAudio * 0.5;
        accretionRing.scale.setScalar(pulse);
      } else if (currentEnv.topology === 'neural') {
        axonMat.color.lerp(targetCol, 0.08);
        neuronMat.color.lerp(secondaryCol, 0.08);
        neuralGroup.rotation.y = t * 0.4;
      } else if (currentEnv.topology === 'galaxy') {
        galaxyGroup.rotation.z = t * 0.3;
        galaxyGroup.rotation.y = t * 0.2;
      } else if (currentEnv.topology === 'dna') {
        dnaMat.color.lerp(targetCol, 0.08);
        dnaGroup.rotation.y = t * 0.8;
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
        pColArr[i3] = targetCol.r * (0.8 + smoothedAudio * 0.5);
        pColArr[i3 + 1] = targetCol.g * (0.8 + smoothedAudio * 0.5);
        pColArr[i3 + 2] = secondaryCol.b * (0.8 + smoothedAudio * 0.5);
      }
      particleField.geometry.attributes.position.needsUpdate = true;
      particleField.geometry.attributes.color.needsUpdate = true;

      // Floating speech plane gentle hover
      speechPlane.position.y = 54 + Math.sin(t * 1.5) * 3;
      speechPlane.rotation.y = Math.sin(t * 0.8) * 0.08;

      // Render 2D Stratum 0 HUD Overlay
      renderHudCanvas(now, currentEnv, audioBytes);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
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
  const renderHudCanvas = (now: number, env: EnvironmentState, audioBytes: Uint8Array | null) => {
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
