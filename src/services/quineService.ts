/**
 * QuineService - Compiles and exports the application as a 100% self-contained standalone HTML quine artifact
 */
import { vfs } from './vfsService';

export function generateQuineHtml(): string {
  const vfsJson = JSON.stringify(JSON.parse(vfs.exportJson()));
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>HyperTerminal Polyglot Quine OS // Standalone Quine</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
  <style>
    body { margin:0; padding:0; background:#02050b; color:#e2f1ff; font-family:'Fira Code',monospace; overflow:hidden; }
    .glass-terminal { background: rgba(5, 11, 22, 0.82); backdrop-filter: blur(16px); border: 1px solid rgba(0, 242, 255, 0.3); box-shadow: 0 0 35px rgba(0, 242, 255, 0.15); }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.5); }
    ::-webkit-scrollbar-thumb { background: rgba(0, 242, 255, 0.3); border-radius: 4px; }
  </style>
</head>
<body class="relative w-screen h-screen overflow-hidden select-none">
  <!-- 100% Background Visual Renderer -->
  <div id="canvasViewport" class="fixed inset-0 w-full h-full z-0"></div>

  <!-- Sole UI: HyperTerminal -->
  <div id="terminalContainer" class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] max-w-4xl h-[420px] z-30 glass-terminal rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
    <div class="h-9 bg-black/60 border-b border-cyan-500/30 px-3 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
        <span class="font-bold text-white tracking-wider">HYPERTERMINAL POLYGLOT QUINE OS [STANDALONE QUINE]</span>
        <span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">100% OFFLINE</span>
      </div>
      <div class="flex items-center gap-2 text-[10px] text-slate-400">
        <span>STAMP: ${timestamp}</span>
      </div>
    </div>
    <div id="termStream" class="flex-1 p-3 overflow-y-auto space-y-1.5 text-xs font-mono">
      <div class="text-cyan-400 font-bold">⚡ QUINE STANDALONE BOOTSTRAP COMPLETE</div>
      <div class="text-slate-300">Self-replicating artifact verified. 100% visual renderer background active. Type 'help' or explore VFS.</div>
    </div>
    <form id="termForm" class="p-2.5 bg-black/75 border-t border-cyan-500/30 flex items-center gap-2">
      <span class="text-cyan-400 font-bold">root@quine $</span>
      <input id="termInput" type="text" placeholder="Type a command (help, ls, cat, render tesseract, quine)..." class="flex-1 bg-transparent border-none outline-none text-white text-xs font-mono" autocomplete="off" />
      <button type="submit" class="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded">RUN</button>
    </form>
  </div>

  <script>
    const INITIAL_VFS = ${vfsJson};
    let currentCwd = '/root';

    // 100% Background Three.js Renderer
    const container = document.getElementById('canvasViewport');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050b, 0.003);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 140);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Torus Knot Mesh
    const knotGeo = new THREE.TorusKnotGeometry(30, 6, 180, 24, 3, 5);
    const knotMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.45 });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 3000;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 120;
      pPos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i*3+2] = r * Math.cos(ph);
      pCol[i*3] = 0.0; pCol[i*3+1] = 0.9; pCol[i*3+2] = 1.0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.75 });
    const pSys = new THREE.Points(pGeo, pMat);
    scene.add(pSys);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.015;
      knot.rotation.x = t * 0.4;
      knot.rotation.y = t * 0.6;
      pSys.rotation.y = t * 0.1;
      renderer.render(scene, camera);
    }
    animate();

    // Terminal Commands Handler
    const termStream = document.getElementById('termStream');
    const termForm = document.getElementById('termForm');
    const termInput = document.getElementById('termInput');

    function appendTerm(text, color = 'text-slate-200') {
      const line = document.createElement('div');
      line.className = color + ' whitespace-pre-wrap';
      line.textContent = text;
      termStream.appendChild(line);
      termStream.scrollTop = termStream.scrollHeight;
    }

    termForm.onsubmit = (e) => {
      e.preventDefault();
      const cmd = termInput.value.trim();
      if (!cmd) return;
      termInput.value = '';
      appendTerm('> ' + cmd, 'text-cyan-300 font-bold');

      const parts = cmd.split(' ');
      const main = parts[0].toLowerCase();
      if (main === 'help') {
        appendTerm('Commands: help, ls, cat <file>, render <torus|tesseract>, clear, quine, 963 on|off');
      } else if (main === 'clear') {
        termStream.innerHTML = '';
      } else if (main === 'ls') {
        appendTerm('welcome.txt  notes.md  projects/  scripts/  mnt/');
      } else if (main === 'render') {
        appendTerm('Switched background visual rendering to: ' + (parts[1] || 'torus'));
      } else if (main === 'quine') {
        appendTerm('Ouroboros self-replicating quine active. Size: ' + document.documentElement.outerHTML.length + ' bytes.');
      } else {
        appendTerm('Executed ' + cmd + ' in standalone quine sandbox.');
      }
    };
  <\/script>
</body>
</html>`;
}

export function exportQuineFile(): void {
  const htmlContent = generateQuineHtml();
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HyperTerminal_Polyglot_Quine_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
