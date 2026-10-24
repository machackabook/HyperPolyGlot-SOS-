"""GAIA Mesh Sync v4: bounded, read-only indexing of an explicitly mounted
notebook/canvas/source folder. No network crawl, OS macro, or synthetic telemetry.
Only source metadata and explicitly declared gaia-node: references leave this reader.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
from datetime import datetime, timezone
from urllib.parse import quote

MAX_NODES=128
MAX_DEPTH=3
MAX_FILE=1024*1024
SUFFIXES={'.ipynb':'notebook','.html':'canvas','.md':'document',
          '.txt':'document','.json':'dataset'}
UNSAFE=re.compile(r'(^\.|(?:^|[._-])(?:secret|token|password|credential|apikey|api-key|private|\.env)(?:[._-]|$))',re.I)
REF=re.compile(r'\bgaia-node:([a-z][a-z0-9_.:/-]{1,95})\b')
CORE_IDS={'nexus.core','nexus.scribe','nexus.memory','nexus.sqe',
          'nexus.canvas','nexus.wave','nexus.calibration','nexus.mcp','nexus.localai'}

class MeshScanError(ValueError):pass

def _root(path):
    if path is None or not isinstance(path,(str,Path)):
        return None
    root=Path(path).expanduser().resolve(strict=True)
    if not root.is_dir() or root.is_symlink():
        raise MeshScanError('Mesh root must be a real, authorized local directory')
    return root

def _files(root:Path):
    remaining=[(root,0)]
    count=0
    while remaining:
        directory,depth=remaining.pop(0)
        for entry in sorted(directory.iterdir(),key=lambda p:p.name):
            count+=1
            if count>2048:raise MeshScanError('Source directory scan budget exceeded')
            if UNSAFE.search(entry.name) or entry.is_symlink():
                continue
            if entry.is_dir() and depth<MAX_DEPTH:
                remaining.append((entry,depth+1))
            elif entry.is_file() and entry.suffix.lower() in SUFFIXES:
                if entry.stat().st_size<=MAX_FILE:yield entry

def scan_sources(root_path=None):
    """Return a complete provenance graph; never read a user's whole home directory."""
    chosen=root_path if root_path is not None else os.environ.get('GAIA_MESH_SOURCE_ROOT')
    if not chosen:
        return {'protocol':'gaia-mesh-sync-v4','source':'no-authorized-root',
                'nodes':[],'links':[],'indexed_at':None,'files_considered':0}
    root=_root(chosen)
    staged=[];references={}
    for file in _files(root):
        if len(staged)>=MAX_NODES:
            raise MeshScanError('Mesh source node budget exceeded')
        relative=file.relative_to(root).as_posix()
        # Exclude runtime-created links and require path to remain under authorized root.
        if not file.resolve().is_relative_to(root):
            continue
        data=file.read_bytes()
        if b'\0' in data[:1024]:continue
        h=hashlib.sha256(data).hexdigest()
        node_id='source.'+hashlib.sha256(relative.encode('utf8')).hexdigest()[:20]
        kind=SUFFIXES[file.suffix.lower()]
        node={
          'id':node_id,'kind':kind,'title':file.name[:100],
          'sourceRef':'local-source://'+quote(relative,safe='/._-'),
          'status':'indexed','contentHash':h
        }
        staged.append(node)
        text=data[:160000].decode('utf-8',errors='replace')
        # Notebook reference markers are declarations inside user-supplied content;
        # no content is sent to the frontend except the names and hashes.
        refs=list(dict.fromkeys(REF.findall(text)))[:32]
        references[node_id]=refs
    known={n['id'] for n in staged}|CORE_IDS
    links=[]
    for n in staged:
        links.append({'from':n['id'],'to':'nexus.core','type':'routes'})
        for ref in references[n['id']]:
            if ref in known and ref!=n['id'] and ref!='nexus.core':
                links.append({'from':n['id'],'to':ref,'type':'references'})
    return {'protocol':'gaia-mesh-sync-v4','source':'authorized-local-files',
            'indexed_at':datetime.now(timezone.utc).isoformat(),
            'files_considered':len(staged),'nodes':staged,'links':links}
