#!/usr/bin/env python3
"""GAIA/OMNI input-file calibration and verified, opt-in browser delivery.
No synthetic sensor source, OS macro bypass, or invented delivery receipts.
JSON input: {"samples":[{"raw":{"spatial":[x,y,z],"spectrum":[...],
"patches":[[9 values], ... nine 3x3 patches],"fork":number},"target":{...}}]}
Install Playwright only for --browser-url: pip install playwright && playwright install chromium.
"""
import argparse
import asyncio
import json
import math
from pathlib import Path
from urllib.parse import urlsplit
from datetime import datetime, timezone


def number(v, where):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):
        raise ValueError(where+' must be finite numeric')
    return float(v)


def validate(obj,where):
    if not isinstance(obj,dict):raise ValueError(where+' must be object')
    spatial=obj.get('spatial');spectrum=obj.get('spectrum');patches=obj.get('patches')
    if not isinstance(spatial,list) or len(spatial)!=3:raise ValueError(where+'.spatial must have 3 values')
    if not isinstance(spectrum,list) or not 1<=len(spectrum)<=2048:raise ValueError(where+'.spectrum invalid')
    if not isinstance(patches,list) or len(patches)!=9:raise ValueError(where+'.patches must have 9 matrices')
    if any(not isinstance(row,list) or len(row)!=9 for row in patches):
        raise ValueError(where+'.patch matrix must have 9 values')
    return {'spatial':[number(v,where+'.spatial') for v in spatial],
        'spectrum':[number(v,where+'.spectrum') for v in spectrum],
        'patches':[[number(v,where+'.patches') for v in row] for row in patches],
        'fork':number(obj.get('fork'),where+'.fork')}


def read_dataset(path):
    file=Path(path)
    if file.stat().st_size>15000000:raise ValueError('input exceeds 15 MB cap')
    payload=json.loads(file.read_text(encoding='utf-8'))
    entries=payload.get('samples') if isinstance(payload,dict) else None
    if not isinstance(entries,list) or not 1<=len(entries)<=1024:raise ValueError('samples must contain 1-1024 pairs')
    out=[]
    for i,item in enumerate(entries):
        if not isinstance(item,dict):raise ValueError('invalid sample pair')
        a=validate(item.get('raw'),'raw sample '+str(i));b=validate(item.get('target'),'target sample '+str(i))
        if len(a['spectrum'])!=len(b['spectrum']):raise ValueError('spectrum length mismatch')
        out.append((a,b))
    return out


class OffscreenCanvasRenderer:
    """Pure Python scalar map; NOT the browser OffscreenCanvas API."""
    def __init__(self,height=16,width=40):
        self.height=height;self.width=width;self.buffer=[[0.]*width for _ in range(height)]
    def clear_buffer(self):
        for row in self.buffer:row[:]=[0.]*self.width
    def render_spatial_projection(self,x,y,z,weight=1.):
        denom=z+30.
        if abs(denom)<1e-6:return
        px=round(self.width/2+x*15/denom);py=round(self.height/2+y*8/denom)
        if 0<=px<self.width and 0<=py<self.height:self.buffer[py][px]+=abs(weight)
    def apply_sensor_patch_illumination(self,matrices):
        for i,m in enumerate(matrices):
            sx=(i%3)*self.width//3;sy=(i//3)*self.height//3
            for j,v in enumerate(m):
                x=sx+j%3;y=sy+j//3
                if x<self.width and y<self.height:self.buffer[y][x]+=abs(v)*0.05
    def ascii_map(self):
        chars=' .:-=+*#%@'
        mx=max((v for row in self.buffer for v in row),default=0.)
        scale=(len(chars)-1)/mx if mx>0 else 0
        return '\n'.join(''.join(chars[min(len(chars)-1,int(v*scale))] for v in row) for row in self.buffer)


class UnifiedTelemetryOptimizer:
    """Deterministic loss-reducing coordinate descent; does not infer data provenance."""
    def __init__(self):
        self.parameters={
            'scale_x':1.,'scale_y':1.,'scale_z':1.,
            'bias_x':0.,'bias_y':0.,'bias_z':0.,
            'theta':0.,'phi':0.,'psi':0.,
            'spectrum_attenuation':1.,'patch_attenuation':1.,
            'tuning_fork_gain':1.,'tuning_fork_phase':0.
        }
        self.visualizer=OffscreenCanvasRenderer()
        self.error_history=[]
    def _process_spatial(self,vec):
        p=self.parameters
        x=vec[0]*p['scale_x']+p['bias_x']
        y=vec[1]*p['scale_y']+p['bias_y']
        z=vec[2]*p['scale_z']+p['bias_z']
        a,b,c=p['theta'],p['phi'],p['psi']
        cy=y*math.cos(a)-z*math.sin(a)
        cz=y*math.sin(a)+z*math.cos(a)
        xx=x*math.cos(b)+cz*math.sin(b)
        zz=-x*math.sin(b)+cz*math.cos(b)
        return (xx*math.cos(c)-cy*math.sin(c),xx*math.sin(c)+cy*math.cos(c),zz)
    def calculate_multi_canvas_loss(self,data,render=False):
        p=self.parameters
        if render:self.visualizer.clear_buffer()
        total=0.;estimate=0.;expected=0.
        for i,(raw,tgt) in enumerate(data):
            pos=self._process_spatial(raw['spatial'])
            total+=sum((a-b)**2 for a,b in zip(pos,tgt['spatial']))
            total+=sum((v*p['spectrum_attenuation']-t)**2 for v,t in zip(raw['spectrum'],tgt['spectrum']))
            patches=[[v*p['patch_attenuation'] for v in row] for row in raw['patches']]
            total+=0.1*sum((v-t)**2 for a,b in zip(patches,tgt['patches']) for v,t in zip(a,b))
            fork=raw['fork']*p['tuning_fork_gain']*math.cos(p['tuning_fork_phase'])
            total+=(fork-tgt['fork'])**2
            harmonic=math.cos(i*2*math.pi/len(data))
            estimate+=sum(pos)*harmonic;expected+=sum(tgt['spatial'])*harmonic
            if render:
                self.visualizer.render_spatial_projection(*pos,weight=p['spectrum_attenuation'])
                self.visualizer.apply_sensor_patch_illumination(patches)
        return (total+0.1*(estimate-expected)**2)/len(data)
    def optimize(self,data,iterations=70):
        if not 1<=iterations<=400:raise ValueError('iterations must be 1-400')
        baseline=self.calculate_multi_canvas_loss(data)
        best=baseline;self.error_history=[best]
        for _ in range(iterations):
            changed=False
            for name in self.parameters:
                old=self.parameters[name]
                step=0.025 if name.startswith('bias') else 0.015
                if name.startswith('scale') or name.endswith('_attenuation') or name=='tuning_fork_gain':step=0.01
                local_best=best;choice=old
                for diff in (-step,step):
                    candidate=old+diff
                    if (name.startswith('scale') or name.endswith('_attenuation') or name=='tuning_fork_gain') and candidate<=0:continue
                    self.parameters[name]=candidate
                    trial=self.calculate_multi_canvas_loss(data)
                    if trial+1e-12<local_best:local_best=trial;choice=candidate
                self.parameters[name]=choice
                if local_best<best:best=local_best;changed=True
            self.error_history.append(best)
            if not changed:break
        self.calculate_multi_canvas_loss(data,render=True)
        return {'source':'user-file-calibration',
            'provenance':'input file; original hardware acquisition not verified',
            'timestamp':datetime.now(timezone.utc).isoformat(),
            'initialLoss':baseline,'finalLoss':best,'iterations':len(self.error_history)-1,
            'samples':len(data),'parameters':dict(self.parameters),
            'map':self.visualizer.ascii_map()}


class OmniAutomationMatrix:
    """User-authorized browser handoff, never system-wide macros or extension injection."""
    @staticmethod
    async def deliver_to_browser(url,payload,allow_origin=None):
        u=urlsplit(url)
        if u.scheme not in ('http','https') or not u.hostname:raise ValueError('invalid browser URL')
        origin=u.scheme+'://'+u.netloc
        if allow_origin and allow_origin!=origin:raise PermissionError('destination origin mismatch')
        if not allow_origin and u.hostname not in ('localhost','127.0.0.1','::1'):
            raise PermissionError('remote origin requires --allow-origin with exact origin')
        try:
            from playwright.async_api import async_playwright
        except ImportError as err:
            raise RuntimeError('Playwright not installed: pip install playwright && playwright install chromium') from err
        async with async_playwright() as p:
            browser=await p.chromium.launch(headless=True)
            try:
                page=await browser.new_page()
                response=await page.goto(url,wait_until='domcontentloaded',timeout=30000)
                if not response or not response.ok:raise RuntimeError('target page unavailable')
                await page.wait_for_function('typeof window.__GAIA_RESONANCE__?.ingest === "function"',timeout=20000)
                ack=await page.evaluate('(data)=>window.__GAIA_RESONANCE__.ingest(data)',payload)
                if not isinstance(ack,dict) or ack.get('accepted') is not True or not ack.get('receipt'):
                    raise RuntimeError('browser receiver did not acknowledge payload')
                return {'accepted':True,'scope':'in-page only, no backend persistence', 'receipt':ack['receipt'],'origin':origin}
            finally:await browser.close()


def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('--input',required=True)
    a.add_argument('--iterations',type=int,default=70)
    a.add_argument('--report')
    a.add_argument('--browser-url')
    a.add_argument('--allow-origin')
    args=a.parse_args()
    report=UnifiedTelemetryOptimizer().optimize(read_dataset(args.input),args.iterations)
    print(json.dumps(report,indent=2))
    if args.report:Path(args.report).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    if args.browser_url:
        print(json.dumps({'browser_handoff':asyncio.run(OmniAutomationMatrix.deliver_to_browser(args.browser_url,report,args.allow_origin))},indent=2))


if __name__=='__main__':main()
