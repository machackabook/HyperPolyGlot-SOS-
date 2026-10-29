/**
 * GAIA Resonance Engine — mathematical field computation, not physical quantum telemetry.
 * Conservative variable-depth leapfrog: u_tt = g div(h grad u) - damping u_t.
 * Reflective zero-flux edges. Pure JS and Node-testable; no network permissions.
 */
export const TAU = Math.PI * 2;
export function octaveTrace(t) {
  if (!Number.isFinite(t)) throw new RangeError('t must be finite');
  return {
    x: Math.cos(t) + 0.5 * Math.cos(2*t) + 0.5 * Math.cos(4*t) + 0.375 * Math.cos(8*t),
    y: 2*Math.sin(t) - Math.sin(2*t) + Math.sin(4*t) - 0.75*Math.sin(8*t)
  };
}
export function makeBathymetry(nx, ny, complexity=0.5) {
  if (!Number.isInteger(nx) || !Number.isInteger(ny) || nx<3 || ny<3 || nx*ny>200000)
    throw new RangeError('Invalid grid dimensions');
  if (!Number.isFinite(complexity) || complexity<0 || complexity>1) throw new RangeError('Invalid complexity');
  const h = new Float32Array(nx*ny);
  for (let y=0; y<ny; y++) for (let x=0; x<nx; x++) {
    const u=(x+0.5)/nx*2-1, v=(y+0.5)/ny*2-1;
    const hills=0.5*Math.sin(6*u)*Math.cos(5*v)+0.25*Math.cos(11*u+3*v);
    const center=Math.exp(-13*(u*u+v*v));
    h[y*nx+x]=Math.max(0.15, 1.0+complexity*(0.5*hills + 1.6*center));
  }
  return h;
}
const face=(a,b)=>2*a*b/(a+b);
export class VariableDepthLeapfrog {
  /** @param {{nx?:number,ny?:number,dx?:number,g?:number,dt?:number,damping?:number,depth?:ArrayLike<number>}} options */
  constructor({nx=96,ny=64,dx=1,g=9.81,dt=0.11,damping=0.003,depth}={}) {
    if (!Number.isInteger(nx)||!Number.isInteger(ny)||nx<3||ny<3||nx*ny>200000) throw new RangeError('grid size');
    if (![dx,g,dt,damping].every(Number.isFinite)||dx<=0||g<=0||dt<=0||damping<0||damping>=1) throw new RangeError('grid constants');
    this.nx=nx;this.ny=ny;this.dx=dx;this.g=g;this.dt=dt;this.damping=damping;
    this.depth=depth ? Float32Array.from(depth) : makeBathymetry(nx,ny);
    if (this.depth.length!==nx*ny||!Array.from(this.depth).every(d=>Number.isFinite(d)&&d>0)) throw new RangeError('depth must be positive and finite');
    const maxH=Math.max(...this.depth);
    this.cfl=dt*Math.sqrt(2*g*maxH)/dx;
    if (this.cfl>0.95) throw new RangeError('unstable leapfrog step: CFL='+this.cfl.toFixed(3)+' > 0.95');
    this.current=new Float32Array(nx*ny);
    this.previous=new Float32Array(nx*ny);
    this.next=new Float32Array(nx*ny);
    this.iteration=0;
  }
  inject(x,y,amplitude=0.5) {
    if(![x,y,amplitude].every(Number.isFinite))throw new RangeError('nonfinite source');
    const ix=Math.max(1,Math.min(this.nx-2,Math.round(x))),iy=Math.max(1,Math.min(this.ny-2,Math.round(y)));
    const k=iy*this.nx+ix;
    this.current[k]+=amplitude;
    this.previous[k]+=amplitude;
  }
  step() {
    const {nx,ny,depth:h,current:u,previous:old,next:out,dt,dx,g,damping}=this;
    const factor=g*dt*dt/(dx*dx);
    for(let y=0;y<ny;y++) for(let x=0;x<nx;x++){
      const k=y*nx+x, hk=h[k], uk=u[k];
      const east=x<nx-1 ? face(hk,h[k+1])*(u[k+1]-uk):0;
      const west=x>0 ? face(hk,h[k-1])*(u[k-1]-uk):0;
      const south=y<ny-1 ? face(hk,h[k+nx])*(u[k+nx]-uk):0;
      const north=y>0 ? face(hk,h[k-nx])*(u[k-nx]-uk):0;
      const val=((2*u[k])-(1-damping)*old[k]+factor*(east+west+south+north))/(1+damping);
      if(!Number.isFinite(val)) throw new Error('wave field diverged');
      out[k]=val;
    }
    this.previous=u;this.current=out;this.next=old;this.iteration++;
    return this.current;
  }
  stats() {
    let absMax=0,rms=0;
    for(const v of this.current){absMax=Math.max(absMax,Math.abs(v));rms+=v*v}
    return {iteration:this.iteration,cfl:this.cfl,peak:absMax,rms:Math.sqrt(rms/this.current.length),grid:[this.nx,this.ny],source:'computed wavefield'};
  }
  clear(){this.current.fill(0);this.previous.fill(0);this.next.fill(0);this.iteration=0}
}
export class BitwiseOctaveField {
  constructor(width,height,count=24){
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width*height>400000)throw new RangeError('trace dimensions');
    this.width=width;this.height=height;this.buffer=new Uint8ClampedArray(width*height*4);
    this.agents=Array.from({length:count},(_,i)=>({t:i*TAU/count,depth:128+((i*19)%128),r:(i*37)&255,g:(i*73)&255}));
  }
  step(speed=1,decay=0.97) {
    if(!Number.isFinite(speed)||!Number.isFinite(decay)||decay<0||decay>1)throw new RangeError('invalid trace step');
    const b=this.buffer,w=this.width,h=this.height;
    for(let i=0;i<b.length;i+=4){b[i]=Math.floor(b[i]*decay);b[i+1]=Math.floor(b[i+1]*decay);b[i+2]=Math.floor(b[i+2]*decay);b[i+3]=Math.floor(b[i+3]*decay)}
    for(const a of this.agents){
      a.t=(a.t+0.015*speed)%TAU;
      const pt=octaveTrace(a.t);
      const x=Math.max(0,Math.min(w-1,Math.floor((pt.x+1.65)/4.4*w)));
      const y=Math.max(0,Math.min(h-1,Math.floor((pt.y+4.5)/9*h)));
      const i=4*(y*w+x),collided=b[i+3]>120 && b[i+2]!==a.depth;
      if(collided){
        for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
          if(((dx^dy)&1)!==0)continue;
          const xx=(x+dx+w)%w, yy=(y+dy+h)%h,j=4*(yy*w+xx);
          b[j]=(a.r^b[i+2])&255;b[j+1]=(a.g+dx*32)&255;b[j+2]=Math.max(a.depth,b[i+2]);b[j+3]=255;
        }
      }else{b[i]=(b[i]^a.r)|64;b[i+1]|=(y&255);b[i+2]=a.depth;b[i+3]=255}
    }
    return b;
  }
}
