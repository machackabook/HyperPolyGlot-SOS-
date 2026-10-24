/** NEXUS Cauldronscope: deterministic shader fields and visual orbit geometry.
 * The L4/L5 oscillation is a stylized libration marker, NOT an integrated
 * gravitational trajectory or scientifically validated epicycloid orbit.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function mapBit4ToCrypto16(bit4){
 if(!Number.isInteger(bit4)||bit4<0||bit4>15)throw RangeError('4-bit source 0..15');
 return bit4*0x1111; // 0x0000..0xffff, exactly 16 uniform steps
}
export function normalizePulse(crypto16){
 if(!Number.isInteger(crypto16)||crypto16<0||crypto16>65535)throw RangeError('Unsigned 16-bit value required');
 return crypto16/65535;
}
export function librationMarkers(angle,bit4,{radius=32,centerX=0,centerY=0}={}){
 if(!Number.isFinite(angle)||!Number.isFinite(radius)||radius<1||radius>500||
    !Number.isFinite(centerX)||!Number.isFinite(centerY))throw TypeError('Invalid geometry');
 const pulse=normalizePulse(mapBit4ToCrypto16(bit4));
 const wobble=12*pulse*Math.sin(3*angle);
 const r=radius+wobble;
 const point=(a)=>({x:centerX+r*Math.cos(a),y:centerY+r*Math.sin(a)});
 return {L4:point(angle+Math.PI/3),L5:point(angle-Math.PI/3),
  pulse,wobble,model:'stylized-libration-not-physical-orbit'};
}
export const vertexShader=String.raw\`
 precision mediump float;
 uniform float u_time;
 uniform float u_tensorPulse;
 varying vec2 vUv;
 void main(){
  vUv=uv;
  vec3 transformed=position;
  transformed.z+=sin(position.y*4.0+u_time)*u_tensorPulse*1.8;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.0);
 }\`;
export const fragmentShader=String.raw\`
 precision mediump float;
 uniform vec3 u_accentColor;
 uniform float u_time;
 uniform float u_tensorPulse;
 varying vec2 vUv;
 void main(){
   float wave=sin(vUv.x*10.0+u_time)*cos(vUv.y*10.0+u_time);
   vec3 color=max(vec3(0.0),u_accentColor+vec3(wave*0.14*u_tensorPulse));
   gl_FragColor=vec4(color,0.20+0.45*u_tensorPulse);
 }\`;
export function shaderPulseFromMetrics(metrics){
 const n=typeof metrics?.frame_interval_avg_ms==='number'?metrics.frame_interval_avg_ms:0;
 if(!Number.isFinite(n))return 0;
 // Driven by observed frame interval, never invented hardware throughput.
 return clamp((n-6)/45,0,1);
}
