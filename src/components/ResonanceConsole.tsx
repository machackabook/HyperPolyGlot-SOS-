import React, {useEffect, useRef, useState} from 'react';
import {VariableDepthLeapfrog, BitwiseOctaveField, octaveTrace, makeBathymetry} from '../services/resonanceEngine.mjs';

type Receipt = {source:string; timestamp:string; initialLoss:number; finalLoss:number; iterations:number; parameters:Record<string,number>};
declare global { interface Window { __GAIA_RESONANCE__?: {ingest:(x:unknown)=>{accepted:boolean;receipt?:string;reason?:string}} } }
function valid(x:unknown):x is Receipt {
  if(!x||typeof x!=='object') return false;
  const a=x as Record<string,any>;
  return a.source==='user-file-calibration' && typeof a.timestamp==='string' &&
    Number.isFinite(a.initialLoss) && Number.isFinite(a.finalLoss) && a.finalLoss>=0 &&
    a.finalLoss<=a.initialLoss && Number.isSafeInteger(a.iterations) &&
    a.iterations>=0 && !!a.parameters && typeof a.parameters==='object' &&
    Object.values(a.parameters).every(v=>typeof v==='number'&&Number.isFinite(v));
}
const card:React.CSSProperties={border:'1px solid #27617b',borderRadius:10,background:'#071928',padding:12,minWidth:0};
const button:React.CSSProperties={background:'#102a3a',border:'1px solid #368cb2',borderRadius:8,color:'#bdf2ff',padding:'8px 11px',cursor:'pointer',fontFamily:'monospace'};
const label:React.CSSProperties={fontSize:12,color:'#a9cbd9',display:'block',marginTop:8};
export function ResonanceConsole(){
  const [open,setOpen]=useState(false),[running,setRunning]=useState(true);
  const [complexity,setComplexity]=useState(0.5),[scattering,setScattering]=useState(0.55),[speed,setSpeed]=useState(1);
  const [metrics,setMetrics]=useState({iteration:0,cfl:0,rms:0,peak:0});
  const [micMessage,setMicMessage]=useState('OFF · acoustic sensor disconnected');
  const [calibration,setCalibration]=useState<Receipt|null>(null);
  const [receipt,setReceipt]=useState('No calibration file has been delivered');
  const wave=useRef<HTMLCanvasElement>(null), trace=useRef<HTMLCanvasElement>(null), spectrum=useRef<HTMLCanvasElement>(null);
  const sim=useRef<VariableDepthLeapfrog|null>(null), octave=useRef<BitwiseOctaveField|null>(null);
  const audio=useRef<{stream:MediaStream;ctx:AudioContext;analyser:AnalyserNode}|null>(null);
  useEffect(()=>{
    window.__GAIA_RESONANCE__={ingest(x:unknown){
      if(!valid(x))return {accepted:false,reason:'INVALID_CALIBRATION_SCHEMA'};
      setCalibration(x); setOpen(true);
      const receipt='local-browser:'+new Date().toISOString();
      setReceipt(receipt);return {accepted:true,receipt};
    }};
    return ()=>{delete window.__GAIA_RESONANCE__};
  },[]);
  useEffect(()=>{
    if(!open) return;
    let raf=0,frame=0,t=0,alive=true;
    const nx=128,ny=80;
    const model=new VariableDepthLeapfrog({nx,ny,dt:0.075,depth:makeBathymetry(nx,ny,complexity)});
    const field=new BitwiseOctaveField(160,110,24);
    sim.current=model;octave.current=field;
    if(wave.current){wave.current.width=nx;wave.current.height=ny}
    if(trace.current){trace.current.width=field.width;trace.current.height=field.height}
    if(spectrum.current){spectrum.current.width=256;spectrum.current.height=68}
    const draw=()=>{
      if(!alive)return;
      if(running){
        for(let i=0;i<2;i++)model.step();
        if(frame%3===0){
          t+=0.045*speed;
          const p=octaveTrace(t);
          model.inject(nx/2+p.x*nx/5,ny/2+p.y*ny/11,scattering*0.16);
        }
        field.step(speed);
      }
      const wc=wave.current?.getContext('2d');
      if(wc){
        const image=wc.createImageData(nx,ny);
        let max=0.05;
        for(const v of model.current)max=Math.max(max,Math.abs(v));
        for(let i=0;i<nx*ny;i++){
          const v=Math.max(-1,Math.min(1,model.current[i]/max));
          const d=Math.min(1,(model.depth[i]-0.1)/2.2),j=i*4;
          image.data[j]=32+Math.max(v,0)*220+d*36;
          image.data[j+1]=18+(1-Math.abs(v))*40+Math.max(-v,0)*195+d*50;
          image.data[j+2]=65+Math.max(-v,0)*175+d*50;
          image.data[j+3]=255;
        }
        wc.putImageData(image,0,0);
      }
      const tc=trace.current?.getContext('2d');
      if(tc)tc.putImageData(new ImageData(new Uint8ClampedArray(field.buffer),field.width,field.height),0,0);
      const ac=spectrum.current?.getContext('2d');
      if(ac){
        const w=ac.canvas.width,h=ac.canvas.height; ac.fillStyle='#051622';ac.fillRect(0,0,w,h);
        if(audio.current){
          const bins=new Uint8Array(audio.current.analyser.frequencyBinCount);
          audio.current.analyser.getByteFrequencyData(bins);
          const n=Math.min(bins.length,128);
          ac.fillStyle='#34d399';
          for(let i=0;i<n;i++)ac.fillRect(i*w/n,h-(bins[i]/255)*h,w/n-1,(bins[i]/255)*h);
        }else{
          ac.fillStyle='#799cad';ac.font='11px monospace';ac.fillText('MIC OFF · NO MEASURED FFT',8,33);
        }
      }
      if(frame++%15===0)setMetrics(model.stats());
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return ()=>{alive=false;cancelAnimationFrame(raf);sim.current=null;octave.current=null};
  },[open,running,complexity,scattering,speed]);
  useEffect(()=>{
    if(open)return;
    if(audio.current){audio.current.stream.getTracks().forEach(t=>t.stop());void audio.current.ctx.close();audio.current=null;setMicMessage('OFF · acoustic sensor disconnected')}
  },[open]);
  useEffect(()=>()=>{if(audio.current){audio.current.stream.getTracks().forEach(t=>t.stop());void audio.current.ctx.close();audio.current=null}},[]);
  async function mic(){
    if(audio.current){audio.current.stream.getTracks().forEach(t=>t.stop());await audio.current.ctx.close();audio.current=null;setMicMessage('OFF · acoustic sensor disconnected');return}
    if(!navigator.mediaDevices?.getUserMedia){setMicMessage('UNAVAILABLE · microphone API unsupported');return}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      const ctx=new AudioContext(); const analyser=ctx.createAnalyser();
      analyser.fftSize=512;ctx.createMediaStreamSource(stream).connect(analyser);
      audio.current={stream,ctx,analyser};setMicMessage('LIVE · microphone FFT · '+ctx.sampleRate+' Hz');
    }catch(e){setMicMessage('DENIED · '+(e instanceof Error?e.message:'microphone access failed'))}
  }
  const reset=()=>{sim.current?.clear();octave.current?.buffer.fill(0);setMetrics({iteration:0,cfl:sim.current?.cfl||0,rms:0,peak:0})};
  return <>
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-label="Toggle Resonance Lab"
      style={{...button,position:'fixed',zIndex:221,top:12,right:14,color:'#00e5ff',boxShadow:'0 0 18px #00e5ff44'}}>
      {open?'✕ Close resonance':'∿ Resonance Lab'}
    </button>
    {open&&<section role="dialog" aria-label="GAIA resonance dynamics console" aria-modal="false"
      style={{position:'fixed',zIndex:220,top:60,bottom:8,left:8,right:8,maxWidth:1250,margin:'auto',overflowY:'auto',padding:16,background:'#03111af7',border:'1px solid #397991',borderRadius:12,color:'#dcf7ff',fontFamily:'monospace',boxShadow:'0 0 60px #000c'}}>
      <header style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',borderBottom:'1px solid #23566d',paddingBottom:14}}>
        <div><strong style={{fontSize:18,color:'#00e5ff'}}>GAIA / NEXUS — RESONANCE DYNAMICS</strong>
        <div style={{fontSize:11,color:'#8ab6c9'}}>Variable-depth wave solver · four-harmonic octave trace · real WebAudio when connected</div></div>
        <span style={{fontSize:11,color:'#34d399'}}>LOCAL COMPUTATION · NO TELEMETRY FABRICATION</span>
      </header>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:12,marginTop:14}}>
        <article style={card}><strong style={{fontSize:12,color:'#a1f1f7'}}>BATHYMETRIC FDTD WAVEFIELD</strong>
          <canvas ref={wave} aria-label="Computed propagating variable depth wave" style={{display:'block',width:'100%',aspectRatio:'8 / 5',marginTop:10,imageRendering:'pixelated',borderRadius:5}}/>
          <p style={{fontSize:11}}>Grid 128×80 · RMS {metrics.rms.toFixed(5)} · peak {metrics.peak.toFixed(4)} · CFL {metrics.cfl.toFixed(3)}</p>
        </article>
        <article style={card}><strong style={{fontSize:12,color:'#a1f1f7'}}>OCTAVE TRACE / BITWISE RGBA COLLISIONS</strong>
          <canvas ref={trace} aria-label="Fourier four-harmonic parametric curve" style={{display:'block',width:'100%',aspectRatio:'8 / 5.5',marginTop:10,imageRendering:'pixelated',borderRadius:5}}/>
          <p style={{fontSize:11}}>x = cos t + ½cos 2t + ½cos 4t + ⅜cos 8t</p>
          <p style={{fontSize:11}}>y = 2sin t − sin 2t + sin 4t − ¾sin 8t</p>
        </article>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:12,marginTop:12}}>
        <article style={card}><strong style={{color:'#a1f1f7'}}>FIELD CONTROLS</strong>
          <div style={{display:'flex',gap:8,marginTop:12,alignItems:'center'}}>
            <button type="button" style={button} onClick={()=>setRunning(v=>!v)}>{running?'Pause':'Run'}</button>
            <button type="button" style={button} onClick={reset}>Reset</button>
            <small>Steps {metrics.iteration}</small>
          </div>
          <label style={label}>Bathymetry complexity {complexity.toFixed(2)}
            <input type="range" min="0" max="1" step="0.05" value={complexity} onChange={e=>setComplexity(+e.target.value)} style={{width:'100%',accentColor:'#00e5ff'}}/>
          </label>
          <label style={label}>Source scattering {scattering.toFixed(2)}
            <input type="range" min="0" max="1" step="0.05" value={scattering} onChange={e=>setScattering(+e.target.value)} style={{width:'100%',accentColor:'#c084fc'}}/>
          </label>
          <label style={label}>Trace speed {speed.toFixed(2)}
            <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={e=>setSpeed(+e.target.value)} style={{width:'100%',accentColor:'#34d399'}}/>
          </label>
        </article>
        <article style={card}><strong style={{color:'#a1f1f7'}}>ACOUSTIC FFT & INPUT-FILE CALIBRATION</strong>
          <canvas ref={spectrum} aria-label="Microphone frequency bins when connected" style={{display:'block',width:'100%',height:68,margin:'12px 0',background:'#041622'}}/>
          <button type="button" style={button} onClick={()=>void mic()}>{audio.current?'Disconnect microphone':'Connect microphone'}</button>
          <p style={{fontSize:11,color:'#9dbac8'}}>{micMessage}</p>
          <div style={{fontSize:11,color:'#8fb7ca',borderTop:'1px solid #23566d',paddingTop:8}}>{receipt}</div>
          {calibration&&<p style={{fontSize:11,color:'#34d399'}}>Input-file calibration loss {calibration.initialLoss.toFixed(6)} → {calibration.finalLoss.toFixed(6)} ({calibration.iterations} steps)</p>}
        </article>
      </div>
      <p style={{fontSize:11,color:'#7fa4b6',marginTop:14}}>Physical sensors, remote SSH, authenticated AI inference and quantum-hardware access are not implied. The wave model is mathematical; microphone FFT requires consent. Browser calibration receipts confirm local reception only.</p>
    </section>}
  </>;
}
