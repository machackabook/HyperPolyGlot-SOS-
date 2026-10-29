/**
 * AXS browser rendering allocation engine.
 *
 * All budgets govern THIS tab's decorative Three.js workload only.
 * No remote OS processes, GPUs, Hugging Face models or sensor readings
 * are invented or managed by this module.
 */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const clamp = (x, low, high) => Math.min(high, Math.max(low, x));
const LEVELS = Object.freeze([
  {fpsCap:60, particleRatio:1, pixelRatioCap:2},
  {fpsCap:30, particleRatio:0.6, pixelRatioCap:1.5},
  {fpsCap:20, particleRatio:0.3, pixelRatioCap:1},
]);

/** Exact user-provided Fourier/octave trace; geometric coordinates, NOT telemetry. */
export function octaveTrace(t) {
  if (!finite(t)) throw new TypeError('Octave parameter must be finite');
  return {
    x: Math.cos(t) + 0.5*Math.cos(2*t) + 0.5*Math.cos(4*t) + 0.375*Math.cos(8*t),
    y: 2*Math.sin(t) - Math.sin(2*t) + Math.sin(4*t) - 0.75*Math.sin(8*t)
  };
}

/** Render-only QoS scheduler. Samples actual CPU render submission durations. */
export function createAxsResourceGovernor({maxParticles=4000, windowSize=60, reviewEvery=12, recoveryReviews=8}={}) {
  if (!Number.isSafeInteger(maxParticles) || maxParticles<1 || maxParticles>100000) throw new RangeError('Invalid particle cap');
  if (!Number.isSafeInteger(windowSize) || windowSize<12 || windowSize>600) throw new RangeError('Invalid window size');
  if (!Number.isSafeInteger(reviewEvery) || reviewEvery<1 || reviewEvery>windowSize) throw new RangeError('Invalid review interval');
  if (!Number.isSafeInteger(recoveryReviews) || recoveryReviews<1 || recoveryReviews>100) throw new RangeError('Invalid recovery interval');
  const samples=[];
  let accepted=0,level=0,recovery=0,mean=null,lastPresented=null,cadence=null;
  const describe=()=>{
    const tier=LEVELS[level];
    const sorted=[...samples].sort((a,b)=>a-b);
    const p90=sorted.length?sorted[Math.ceil(0.9*sorted.length)-1]:null;
    return {
      source:'browser-renderer', measured:accepted>0, sampleCount:accepted,
      frameAverageMs:mean, p90RenderMs:p90,
      observedFps:cadence===null?null:1000/cadence,
      fpsCap:tier.fpsCap, particleCount:Math.max(1,Math.min(maxParticles,Math.floor(maxParticles*tier.particleRatio))),
      particleCapacity:maxParticles, pixelRatioCap:tier.pixelRatioCap,
      tier:level, note:'Frame cost measures JavaScript and WebGL submission, not GPU execution or OS-thread utilization.'
    };
  };
  return {
    /** @param {number} durationMs @param {number|null} presentedAtMs */
    observe(durationMs,presentedAtMs=null){
      if (!finite(durationMs) || durationMs<0 || durationMs>60000) return describe();
      if(presentedAtMs!==null && finite(presentedAtMs)){
        if(lastPresented!==null){
          const interval=presentedAtMs-lastPresented;
          if(interval>0 && interval<500) cadence=cadence===null?interval:0.9*cadence+0.1*interval;
        }
        lastPresented=presentedAtMs;
      }
      accepted++;
      mean=mean===null?durationMs:0.9*mean+0.1*durationMs;
      samples.push(durationMs);if(samples.length>windowSize)samples.shift();
      if(samples.length>=reviewEvery && accepted%reviewEvery===0){
        const current=describe();
        const target=1000/LEVELS[level].fpsCap;
        if(current.p90RenderMs>target*0.9 && level<LEVELS.length-1){
          level++;recovery=0;
        }else if(level>0 && current.p90RenderMs<(1000/LEVELS[level-1].fpsCap)*0.58){
          recovery++;
          if(recovery>=recoveryReviews){level--;recovery=0;}
        }else{
          recovery=0;
        }
      }
      return describe();
    },
    status:describe,
    reset(){samples.length=0;accepted=0;level=0;recovery=0;mean=null;lastPresented=null;cadence=null;}
  };
}

export const axsResourceGovernor=createAxsResourceGovernor();
