#!/usr/bin/env python3
"""AXS6K observed-process registry: 6000 stable agent UUID slots, not 6000 workers."""
import argparse, datetime, hashlib, json, pathlib, sqlite3, subprocess, sys, uuid
NS=uuid.UUID("b1d00c82-7f25-5b37-9ba1-d9319633b4d0")
ROOT=pathlib.Path.home()/".nexus"/"axs6k"/"agents.sqlite3"
def observe(pid):
 if pid<=0:return None
 if sys.platform.startswith("linux"):
  try:
   p=pathlib.Path("/proc")/str(pid)
   birth=pathlib.Path("/proc/sys/kernel/random/boot_id").read_text().strip()+":"+(p/"stat").read_text().rsplit(")",1)[1].split()[19]
   return birth,(p/"comm").read_text().strip()[:100]
  except (OSError,IndexError):return None
 if sys.platform=="win32":
  command=("$p=Get-CimInstance Win32_Process -Filter 'ProcessId = %d' -ErrorAction SilentlyContinue; "
    "if($p){@{birth=$p.CreationDate.ToUniversalTime().ToString('o');name=$p.Name}|ConvertTo-Json -Compress}")%pid
  try:
   r=subprocess.run(["powershell.exe","-NoProfile","-NonInteractive","-Command",command],capture_output=True,text=True,timeout=12)
   if r.returncode or not r.stdout.strip():return None
   v=json.loads(r.stdout);return str(v["birth"]),str(v["name"])[:100]
  except (OSError,ValueError,KeyError,subprocess.TimeoutExpired):return None
 raise RuntimeError("Only Linux and Windows supported")
def main():
 p=argparse.ArgumentParser();p.add_argument("--db",type=pathlib.Path,default=ROOT);cmd=p.add_subparsers(dest="action",required=True)
 cmd.add_parser("init");b=cmd.add_parser("bind");b.add_argument("--slot",type=int,required=True);b.add_argument("--pid",type=int,required=True)
 u=cmd.add_parser("unbind");u.add_argument("--slot",type=int,required=True)
 cmd.add_parser("status");cmd.add_parser("verify-ledger");cmd.add_parser("mirror-registry")
 a=p.parse_args();path=a.db.expanduser();path.parent.mkdir(parents=True,exist_ok=True)
 if sys.platform.startswith("linux"):path.parent.chmod(0o700)
 c=sqlite3.connect(path)
 if sys.platform.startswith("linux"):path.chmod(0o600)
 c.executescript("CREATE TABLE IF NOT EXISTS agents(slot INTEGER PRIMARY KEY, uuid TEXT UNIQUE, quadrant INTEGER, role TEXT);"
  "CREATE TABLE IF NOT EXISTS bindings(slot INTEGER PRIMARY KEY,pid INTEGER,birth TEXT,label TEXT);"
  "CREATE TABLE IF NOT EXISTS ledger(seq INTEGER PRIMARY KEY,at TEXT,action TEXT,body TEXT,prev TEXT,hash TEXT);")
 def append(action,body):
  prev=(c.execute("SELECT hash FROM ledger ORDER BY seq DESC LIMIT 1").fetchone() or ["0"*64])[0]
  at=datetime.datetime.now(datetime.timezone.utc).isoformat();payload=json.dumps({"at":at,"action":action,"data":body},sort_keys=True)
  h=hashlib.sha256((prev+"\n"+payload).encode()).hexdigest()
  c.execute("INSERT INTO ledger(at,action,body,prev,hash) VALUES(?,?,?,?,?)",(at,action,payload,prev,h));c.commit()
 if a.action=="init":
  for slot in range(6000):
   quadrant=slot//1500
   c.execute("INSERT OR IGNORE INTO agents VALUES(?,?,?,?)",(slot,str(uuid.uuid5(NS,"AXS6K:slot:"+str(slot))),quadrant,("security","engineering","knowledge","media")[quadrant]))
  append("init",{"slots":6000});print("6000 UUID slots allocated; 0 managed workers claimed")
 elif a.action=="bind":
  row=c.execute("SELECT uuid FROM agents WHERE slot=?",(a.slot,)).fetchone();obs=observe(a.pid)
  if not row or not obs:raise SystemExit("BLOCKED: slot missing or PID not observable")
  old=c.execute("SELECT pid,birth FROM bindings WHERE slot=?",(a.slot,)).fetchone()
  if old and old!=(a.pid,obs[0]):raise SystemExit("BLOCKED: explicitly unbind prior process first")
  c.execute("INSERT OR REPLACE INTO bindings VALUES(?,?,?,?)",(a.slot,a.pid,obs[0],obs[1]))
  append("bind",{"slot":a.slot,"pid":a.pid,"birth":obs[0]})
  print(json.dumps({"agent_uuid":row[0],"pid":a.pid,"status":"OBSERVED_LIVE"}))
 elif a.action=="unbind":
  if not c.execute("SELECT 1 FROM bindings WHERE slot=?",(a.slot,)).fetchone():raise SystemExit("No binding")
  c.execute("DELETE FROM bindings WHERE slot=?",(a.slot,));append("unbind",{"slot":a.slot})
 elif a.action=="status":
  rows=c.execute("SELECT pid,birth FROM bindings").fetchall()
  live=sum(1 for pid,birth in rows if (obs:=observe(pid)) and obs[0]==birth)
  print(json.dumps({"allocated":c.execute("SELECT count(*) FROM agents").fetchone()[0],"bound":len(rows),"observed_live":live,"exited_or_reused":len(rows)-live,"managed_workers_verified":0}))
 elif a.action=="verify-ledger":
  prev="0"*64
  for seq,payload,ph,h in c.execute("SELECT seq,body,prev,hash FROM ledger ORDER BY seq"):
   if ph!=prev or hashlib.sha256((prev+"\n"+payload).encode()).hexdigest()!=h:raise SystemExit("FAIL ledger at "+str(seq))
   prev=h
  print("PASS local hash chain; no external signing claimed")
 elif a.action=="mirror-registry":
  if sys.platform!="win32":raise SystemExit("Windows only")
  import winreg
  count=0;root="Software\\Cryptic\\NEXUS\\AXS6K\\Bindings"
  for slot,uid,pid,birth,label in c.execute("SELECT b.slot,a.uuid,b.pid,b.birth,b.label FROM bindings b JOIN agents a ON a.slot=b.slot"):
   obs=observe(pid)
   if not obs or obs[0]!=birth:continue
   with winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER,root+"\\"+uid,0,winreg.KEY_SET_VALUE) as k:
    winreg.SetValueEx(k,"PID",0,winreg.REG_DWORD,pid)
    winreg.SetValueEx(k,"Slot",0,winreg.REG_DWORD,slot)
    winreg.SetValueEx(k,"ProcessBirth",0,winreg.REG_SZ,birth)
    winreg.SetValueEx(k,"ExecutableName",0,winreg.REG_SZ,label)
   count+=1
  append("mirror",{"hive":"HKCU","live_bindings":count});print("Mirrored live bindings:",count)
 c.close()
if __name__=="__main__":main()
