import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {gaiaMeshV4} from '../services/gaiaMeshSyncV4.mjs';

/**
 * CrossVoid Ethernet World — public, source-grounded 3D experience.
 * No claim of online multiplayer, real-world distances, 6000 live workers,
 * hardware access, or private memory access.
 */
type SceneNode={id:string;title:string;kind:string;status:string;sourceRef:string;x:number;y:number;z:number};
type ViewStatus={fps:number;renderNodes:number;sourceLinks:number;peerStatus:'not-connected'};
const COLORS:Record<string,number>={core:0xffcc00,adapter:0x00e5ff,canvas:0x9932cc,notebook:0x34d399,repository:0x34d399,dataset:0x34d399,document:0x94a3b8};
const labelButton='rounded-lg border border-cyan-400/40 bg-slate-950/80 px-2 py-1.5 text-xs text-cyan-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-amber-300';
function permittedSource(ref:string){
  try{
    const u=new URL(ref);
    return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/machackabook/HyperPolyGlot-SOS-/blob/');
  }catch{return false}
}
export function CrossvoidEthernetWorld({onExit}:{onExit:()=>void}){
 const canvasHost=useRef<HTMLDivElement|null>(null);
 const [selected,setSelected]=useState<SceneNode|null>(null);
 const [view,setView]=useState<ViewStatus>({fps:0,renderNodes:0,sourceLinks:0,peerStatus:'not-connected'});
 const [paused,setPaused]=useState(false);
 const [rotation,setRotation]=useState({yaw:0,pitch:0});
 const world=useRef<{select:(id:string)=>void}|null>(null);
 const frame=gaiaMeshV4.snapshot();
 const publicNodes=frame.nodes.filter((node:any)=>permittedSource(node.sourceRef)).slice(0,48);
 const publicIds=new Set(publicNodes.map((x:any)=>x.id));
 const links=frame.links.filter((e:any)=>publicIds.has(e.from)&&publicIds.has(e.to)).slice(0,96);
 useEffect(()=>{
   const root=canvasHost.current;
   if(!root)return;
   const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const scene=new THREE.Scene();
   scene.background=new THREE.Color(0x01030a);
   scene.fog=new THREE.FogExp2(0x01030a,.018);
   const camera=new THREE.PerspectiveCamera(60,1,.1,200);
   camera.position.set(0,5,42);
   camera.lookAt(0,0,0);
   const renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'});
   renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
   root.appendChild(renderer.domElement);
   renderer.domElement.style.cssText='width:100%;height:100%;display:block;cursor:grab;touch-action:none';
   const objects:THREE.Object3D[]=[];
   const materials:THREE.Material[]=[];
   const geometries:THREE.BufferGeometry[]=[];
   const nodes:SceneNode[]=[];
   const pickables:THREE.Mesh[]=[];
   const graphGroup=new THREE.Group();
   scene.add(graphGroup);
   scene.add(new THREE.AmbientLight(0x8899ff,.65));
   const glow=new THREE.PointLight(0x00e5ff,48,120);
   glow.position.set(0,4,8);scene.add(glow);
   function addMesh(mesh:THREE.Mesh, pick=false){
     objects.push(mesh);graphGroup.add(mesh);
     if(pick)pickables.push(mesh);
   }
   // Rotating toroidal corridor; atmospheric objects represent geometry only.
   const corridorGeom=new THREE.TorusGeometry(16,.035,3,96);
   geometries.push(corridorGeom);
   for(let i=0;i<16;i++){
     const mat=new THREE.MeshBasicMaterial({color:i%3===0?0xffcc00:0x00e5ff,
       transparent:true,opacity:.14,depthWrite:false});
     materials.push(mat);
     const ring=new THREE.Mesh(corridorGeom,mat);
     ring.position.z=-i*7+9;
     ring.rotation.z=i*.27;
     addMesh(ring);
   }
   // Star positions use deterministic seeds; stars are visual, not server nodes.
   let seed=0x13579bdf;
   const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
   const starPositions=new Float32Array(1500);
   for(let i=0;i<1500;i+=3){
      starPositions[i]=(rand()-.5)*110;
      starPositions[i+1]=(rand()-.5)*75;
      starPositions[i+2]=-rand()*120+20;
   }
   const stars=new THREE.BufferGeometry();
   stars.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
   geometries.push(stars);
   const starsMaterial=new THREE.PointsMaterial({color:0xb5d8ff,size:.16,transparent:true,opacity:.8});
   materials.push(starsMaterial);
   graphGroup.add(new THREE.Points(stars,starsMaterial));

   const nCount=publicNodes.length;
   publicNodes.forEach((node:any,i:number)=>{
     const angle=i*Math.PI*(3-Math.sqrt(5)),r=9+Math.sqrt(i+1)*1.2;
     const data:SceneNode={id:node.id,title:node.title,kind:node.kind,status:node.status,
       sourceRef:node.sourceRef,x:Math.cos(angle)*r,y:Math.sin(angle)*r*.52,z:8-(i%7)*5};
     nodes.push(data);
     const geometry=new THREE.OctahedronGeometry(node.kind==='core'?1.15:.8,0);
     geometries.push(geometry);
     const mat=new THREE.MeshStandardMaterial({color:COLORS[node.kind]||0x94a3b8,
       emissive:COLORS[node.kind]||0x94a3b8,emissiveIntensity:.35,
       transparent:true,opacity:.87,flatShading:true});
     materials.push(mat);
     const mesh=new THREE.Mesh(geometry,mat);
     mesh.position.set(data.x,data.y,data.z);
     mesh.userData.nodeId=node.id;
     addMesh(mesh,true);
   });
   const index=new Map(nodes.map(x=>[x.id,x]));
   const positions:number[]=[];
   for(const link of links){
     const a=index.get(link.from),b=index.get(link.to);
     if(!a||!b)continue;
     positions.push(a.x,a.y,a.z,b.x,b.y,b.z);
   }
   if(positions.length){
     const geometry=new THREE.BufferGeometry();
     geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
     const mat=new THREE.LineBasicMaterial({color:0x34d399,transparent:true,opacity:.48});
     geometries.push(geometry);materials.push(mat);
     graphGroup.add(new THREE.LineSegments(geometry,mat));
   }
   setView({fps:0,renderNodes:nodes.length,sourceLinks:positions.length/6,peerStatus:'not-connected'});
   world.current={select:(id)=>{
     const found=nodes.find(x=>x.id===id);if(found)setSelected(found);
   }};
   const size=()=>{
     if(!root.isConnected)return;
     const width=Math.max(1,root.clientWidth),height=Math.max(1,root.clientHeight);
     renderer.setSize(width,height,false);
     camera.aspect=width/height;camera.updateProjectionMatrix();
   };
   const observer=new ResizeObserver(size);observer.observe(root);size();
   const ray=new THREE.Raycaster(),point=new THREE.Vector2();
   let drag:{x:number;y:number;distance:number;id:number}|null=null;
   let yaw=0,pitch=0,targetYaw=0,targetPitch=0;
   function down(e:PointerEvent){drag={x:e.clientX,y:e.clientY,distance:0,id:e.pointerId};
     renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';}
   function move(e:PointerEvent){
     if(!drag||drag.id!==e.pointerId)return;
     const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
     drag.x=e.clientX;drag.y=e.clientY;drag.distance+=Math.hypot(dx,dy);
     targetYaw+=dx*.003;targetPitch=Math.max(-.7,Math.min(.7,targetPitch+dy*.003));
   }
   function up(e:PointerEvent){
     if(!drag||drag.id!==e.pointerId)return;
     const click=drag.distance<7;drag=null;renderer.domElement.style.cursor='grab';
     if(!click)return;
     const bounds=renderer.domElement.getBoundingClientRect();
     point.set(((e.clientX-bounds.left)/bounds.width)*2-1,-((e.clientY-bounds.top)/bounds.height)*2+1);
     ray.setFromCamera(point,camera);
     const matches=ray.intersectObjects(pickables,false);
     if(matches.length){
       const id=matches[0].object.userData.nodeId;
       const node=nodes.find(x=>x.id===id);
       if(node)setSelected(node);
     }
   }
   renderer.domElement.addEventListener('pointerdown',down);
   renderer.domElement.addEventListener('pointermove',move);
   renderer.domElement.addEventListener('pointerup',up);
   renderer.domElement.addEventListener('pointercancel',up);
   let raf=0,last=performance.now(),frames=0,measure=last,disposed=false;
   const animate=(now:number)=>{
     if(disposed)return;
     raf=requestAnimationFrame(animate);
     if(document.hidden||paused)return;
     const dt=Math.min(.05,(now-last)/1000);last=now;
     yaw+=(targetYaw-yaw)*.1;pitch+=(targetPitch-pitch)*.1;
     graphGroup.rotation.y=yaw;
     graphGroup.rotation.x=pitch;
     if(!motion){
       graphGroup.rotation.z=Math.sin(now*.00013)*.04;
       for(let i=0;i<pickables.length;i++)pickables[i].rotation.y+=dt*.13;
     }
     renderer.render(scene,camera);
     frames++;
     if(now-measure>=1500){
       const fps=Math.round(frames*1000/(now-measure));
       setView(v=>({...v,fps}));
       frames=0;measure=now;
     }
   };
   raf=requestAnimationFrame(animate);
   return()=>{
     disposed=true;cancelAnimationFrame(raf);observer.disconnect();
     renderer.domElement.removeEventListener('pointerdown',down);
     renderer.domElement.removeEventListener('pointermove',move);
     renderer.domElement.removeEventListener('pointerup',up);
     renderer.domElement.removeEventListener('pointercancel',up);
     geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());
     renderer.dispose();renderer.domElement.remove();world.current=null;
   };
 },[paused]); // Rebuilding on pause is unnecessary for physics; current scope is modest.
 return <section className="relative mt-4 overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#01030a]">
   <div className="absolute left-3 top-3 z-10 max-w-[72%] pointer-events-none">
     <p className="text-xs font-semibold tracking-widest text-amber-200">ETHERNET · INTERACTIVE CROSSVOID</p>
     <p className="text-[10px] text-cyan-200/80">Drag to rotate · select a glowing node · source-linked world</p>
   </div>
   <div className="h-[min(48vh,460px)] w-full" ref={canvasHost} aria-label="3D interactive Ethernet world of public GAIA project nodes"/>
   <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cyan-400/20 bg-slate-950/90 px-3 py-2 text-xs">
     <span>{view.renderNodes} source nodes · {view.sourceLinks} tethers · measured {view.fps} FPS</span>
     <div className="flex gap-2">
       <button className={labelButton} type="button" onClick={()=>setPaused(v=>!v)}>{paused?'Resume':'Pause'}</button>
       <button className={labelButton} type="button" onClick={onExit}>Exit world</button>
     </div>
   </div>
   <div className="max-h-28 overflow-y-auto border-t border-cyan-400/20 bg-slate-950/90 p-2">
     {selected? <div className="text-xs text-slate-200">
       <strong className="text-emerald-300">{selected.title}</strong> · {selected.status}
       <p className="mt-1 break-all text-[10px] text-slate-400">{selected.sourceRef}</p>
       <a href={selected.sourceRef} rel="noopener noreferrer" target="_blank" className="text-cyan-300 underline">Open public source ↗</a>
     </div>: <p className="text-xs text-slate-400">Select a source node. The world is currently an interactive public scene, not an authenticated multiplayer session.</p>}
     <div className="mt-2 flex flex-wrap gap-1">
       {publicNodes.slice(0,12).map((n:any)=>
         <button key={n.id} className="rounded border border-cyan-400/20 px-2 py-1 text-[10px] hover:bg-cyan-900/40"
           onClick={()=>world.current?.select(n.id)}>{n.title}</button>)}
     </div>
   </div>
 </section>;
}
