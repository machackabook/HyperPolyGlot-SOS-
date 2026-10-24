#!/usr/bin/env python3
"""NEXUS Ouroboros Guard v2.6: safe, verified script evolution.

Mutation is a supplied candidate, never an unchecked model-generated shell command.
Tests are syntax checks only; runtime behavioral tests require separate isolated CI.
The baseline is never touched unless a candidate passes and the source is unchanged.
"""
from __future__ import annotations
import argparse,hashlib,json,os,stat,subprocess,tempfile,time
from pathlib import Path

LIMIT=1024*1024
def digest(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()
def allowed(path:Path,root:Path)->Path:
    root=root.resolve(strict=True)
    if not root.is_dir():raise ValueError("Invalid trusted workspace")
    # Do not accept path traversal, symlink files, or files outside the root.
    candidate=path.absolute()
    if candidate.is_symlink():raise ValueError("Symlink target is forbidden")
    resolved=candidate.resolve(strict=True)
    if root not in resolved.parents:raise ValueError("Target not inside authorized root")
    if resolved.suffix!=".sh" or not resolved.is_file():raise ValueError("Only .sh files supported")
    return resolved
def syntax_check(data:bytes,timeout:float=3.0)->tuple[bool,float,str]:
    if len(data)>LIMIT or b"\x00" in data:raise ValueError("Candidate rejected by size/type budget")
    with tempfile.TemporaryDirectory(prefix="gaia-guard-") as folder:
        temp=Path(folder)/"candidate.sh"
        temp.write_bytes(data)
        start=time.monotonic()
        try:
            proc=subprocess.run(["bash","-n",str(temp)],timeout=timeout,
                capture_output=True,text=True,check=False)
            return proc.returncode==0,time.monotonic()-start,proc.stderr[:1000]
        except subprocess.TimeoutExpired:
            return False,time.monotonic()-start,"Syntax validation timed out"
def evolve(root:Path,target:Path,candidate:Path,apply:bool=False)->dict:
    root=root.resolve(strict=True)
    path=allowed(target,root)
    proposed=allowed(candidate,root)
    baseline=path.read_bytes()
    changed=proposed.read_bytes()
    ok,seconds,error=syntax_check(changed)
    record={"protocol":"ouroboros-v2.6","target":str(path.relative_to(root)),
        "baseline_sha256":digest(baseline),"candidate_sha256":digest(changed),
        "validation":"bash -n","valid":ok,"syntax_seconds":round(seconds,6),
        "applied":False,"reason":"candidate syntax invalid" if not ok else "validated; staged only"}
    if not apply or not ok:return record
    # Save trusted original before touching target. Snapshots remain in a private workspace.
    snapshot_dir=root/".gaia-private"/"ouroboros-snapshots"
    snapshot_dir.mkdir(parents=True,exist_ok=True,mode=0o700)
    snapshot=snapshot_dir/(digest(baseline)+".sh.bak")
    if not snapshot.exists():
        fd=os.open(snapshot,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,"wb") as fh:fh.write(baseline);fh.flush();os.fsync(fh.fileno())
    elif snapshot.read_bytes()!=baseline:raise ValueError("Snapshot integrity conflict")
    if path.read_bytes()!=baseline:
        raise ValueError("Baseline changed during verification; no changes applied")
    fd,tmp=tempfile.mkstemp(prefix=".gaia-candidate-",suffix=".sh",dir=path.parent)
    try:
        os.fchmod(fd,stat.S_IMODE(path.stat().st_mode))
        with os.fdopen(fd,"wb") as fh:fh.write(changed);fh.flush();os.fsync(fh.fileno())
        ok2,_,error2=syntax_check(Path(tmp).read_bytes())
        if not ok2 or path.read_bytes()!=baseline:
            raise ValueError("Final check failed; baseline preserved: "+error2[:100])
        os.replace(tmp,path)
        record.update(applied=True,reason="syntax verified and atomically promoted",
                      snapshot=str(snapshot.relative_to(root)))
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
    return record
def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--root",required=True)
    cli.add_argument("--target",required=True)
    cli.add_argument("--candidate",required=True)
    cli.add_argument("--apply",action="store_true")
    args=cli.parse_args()
    result=evolve(Path(args.root),Path(args.target),Path(args.candidate),args.apply)
    print(json.dumps(result,sort_keys=True))
    if not result["valid"]:raise SystemExit(2)
if __name__=="__main__":
    main()
