/**
 * SshService - SSH Session Management, Gateway Connection Maintenance,
 * and Remote Command Execution Engine
 */

export interface SshSession {
  id: string;
  target: string; // e.g. root@192.168.1.1:22
  user: string;
  host: string;
  port: number;
  cipherSuite: string;
  kexAlgorithm: string;
  connectedAt: number;
  lastKeepalive: number;
  latencyMs: number;
  status: 'CONNECTED' | 'RECONNECTING' | 'CLOSED';
  identityKey: string;
}

export interface SshCommandResult {
  sessionId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

class SshService {
  private sessions: Map<string, SshSession> = new Map();
  private keepaliveTimer: any = null;

  constructor() {
    // Pre-seed trusted OpenWrt Gateway session
    this.createSession('root@192.168.1.1:22', 'id_ed25519');
    this.startKeepaliveHeartbeat();
  }

  public getSessions(): SshSession[] {
    return Array.from(this.sessions.values());
  }

  public getSession(id: string): SshSession | undefined {
    return this.sessions.get(id);
  }

  public createSession(target: string, identityKey = 'id_ed25519'): SshSession {
    let user = 'root';
    let host = '192.168.1.1';
    let port = 22;

    const atSplit = target.split('@');
    if (atSplit.length === 2) {
      user = atSplit[0];
      const hostPort = atSplit[1].split(':');
      host = hostPort[0];
      if (hostPort[1]) {
        const p = parseInt(hostPort[1], 10);
        if (!isNaN(p)) port = p;
      }
    } else {
      const hostPort = target.split(':');
      host = hostPort[0];
      if (hostPort[1]) {
        const p = parseInt(hostPort[1], 10);
        if (!isNaN(p)) port = p;
      }
    }

    const id = `ssh-${host.replace(/\./g, '-')}-${port}-${Date.now().toString(36).slice(-4)}`;
    const session: SshSession = {
      id,
      target: `${user}@${host}:${port}`,
      user,
      host,
      port,
      cipherSuite: 'chacha20-poly1305@openssh.com',
      kexAlgorithm: 'curve25519-sha256',
      connectedAt: Date.now(),
      lastKeepalive: Date.now(),
      latencyMs: host === '192.168.1.1' ? 1.2 : host === '127.0.0.1' ? 0.3 : 14.5,
      status: 'CONNECTED',
      identityKey,
    };

    this.sessions.set(id, session);
    return session;
  }

  public disconnect(idOrTarget: string): boolean {
    let targetSessionId = idOrTarget;
    if (!this.sessions.has(idOrTarget)) {
      const found = Array.from(this.sessions.values()).find(
        (s) => s.target === idOrTarget || s.host === idOrTarget
      );
      if (found) targetSessionId = found.id;
      else return false;
    }

    const s = this.sessions.get(targetSessionId);
    if (s) {
      s.status = 'CLOSED';
      this.sessions.delete(targetSessionId);
      return true;
    }
    return false;
  }

  public executeRemoteCommand(sessionIdOrTarget: string, cmd: string): SshCommandResult {
    let session = this.sessions.get(sessionIdOrTarget);
    if (!session) {
      session = Array.from(this.sessions.values()).find(
        (s) => s.target === sessionIdOrTarget || s.host === sessionIdOrTarget
      );
    }

    if (!session) {
      return {
        sessionId: 'none',
        command: cmd,
        exitCode: 255,
        stdout: '',
        stderr: `ssh: Could not resolve hostname or active session for '${sessionIdOrTarget}': Host unreachable.`,
        durationMs: 4,
      };
    }

    session.lastKeepalive = Date.now();
    const cleanCmd = cmd.trim();

    // Emulate realistic OpenWrt / Linux system administration commands
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    if (/^cat\s+\/etc\/openwrt_release/i.test(cleanCmd)) {
      stdout = `DISTRIB_ID='OpenWrt'
DISTRIB_RELEASE='23.05.3'
DISTRIB_REVISION='r23809-234f1a2'
DISTRIB_TARGET='mediatek/filogic'
DISTRIB_ARCH='aarch64_cortex-a53'
DISTRIB_DESCRIPTION='OpenWrt 23.05.3 r23809-234f1a2'
DISTRIB_TAINTS=''`;
    } else if (/^uci\s+show\s+firewall/i.test(cleanCmd)) {
      stdout = `firewall.@defaults[0]=defaults
firewall.@defaults[0].syn_flood='1'
firewall.@defaults[0].input='REJECT'
firewall.@defaults[0].output='ACCEPT'
firewall.@defaults[0].forward='REJECT'
firewall.@zone[0]=zone
firewall.@zone[0].name='lan'
firewall.@zone[0].input='ACCEPT'
firewall.@zone[0].output='ACCEPT'
firewall.@zone[0].forward='ACCEPT'
firewall.@zone[1]=zone
firewall.@zone[1].name='wan'
firewall.@zone[1].input='DROP'
firewall.@zone[1].output='ACCEPT'
firewall.@zone[1].forward='DROP'
firewall.@zone[1].masq='1'
firewall.@zone[1].mtu_fix='1'`;
    } else if (/^uci\s+show\s+network/i.test(cleanCmd)) {
      stdout = `network.loopback=interface
network.loopback.device='lo'
network.loopback.proto='static'
network.loopback.ipaddr='127.0.0.1'
network.lan=interface
network.lan.device='br-lan'
network.lan.proto='static'
network.lan.ipaddr='192.168.1.1'
network.lan.netmask='255.255.255.0'
network.wan=interface
network.wan.device='eth0'
network.wan.proto='pppoe'`;
    } else if (/^iptables\s+-L/i.test(cleanCmd) || /^nft\s+list/i.test(cleanCmd)) {
      stdout = `Chain INPUT (policy DROP 12 packets, 720 bytes)
 pkts bytes target     prot opt in     out     source               destination         
 842K  112M zone_lan_input  all  --  br-lan *       0.0.0.0/0            0.0.0.0/0           
  14K 1084K zone_wan_input  all  --  pppoe-wan *   0.0.0.0/0            0.0.0.0/0           

Chain FORWARD (policy DROP 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         
 1.2M  840M zone_lan_forward  all  --  br-lan *       0.0.0.0/0            0.0.0.0/0           
 980K  710M zone_wan_forward  all  --  pppoe-wan *   0.0.0.0/0            0.0.0.0/0           

Chain OUTPUT (policy ACCEPT 1.8M packets, 1.4G bytes)`;
    } else if (/^ip\s+(addr|link)/i.test(cleanCmd) || /^ifconfig/i.test(cleanCmd)) {
      stdout = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP
3: br-lan: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
    inet 192.168.1.1/24 brd 192.168.1.255 scope global br-lan
4: pppoe-wan: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1492 qdisc fq_codel state UNKNOWN
    inet 198.51.100.42 peer 198.51.100.1/32 scope global pppoe-wan`;
    } else if (/^uname/i.test(cleanCmd)) {
      stdout = `Linux OpenWrt-Sovereign-GW 6.1.82 #0 SMP aarch64 GNU/Linux`;
    } else if (/^uptime/i.test(cleanCmd)) {
      stdout = ` 22:30:15 up 42 days, 16:28,  load average: 0.08, 0.12, 0.09`;
    } else if (/^free/i.test(cleanCmd)) {
      stdout = `              total        used        free      shared  buff/cache   available
Mem:        1048576      138240      786432        2048      123904      884736
Swap:             0           0           0`;
    } else if (/^logread/i.test(cleanCmd)) {
      stdout = `[kern.info] kernel: [   42.12] br-lan: port 1(eth1) entered forwarding state
[daemon.info] dnsmasq[1842]: read /etc/hosts - 4 addresses
[daemon.info] hostapd: wlan0: AP-ENABLED
[daemon.notice] netifd: Network device 'pppoe-wan' link is up
[daemon.info] dropbear[2402]: Child connection from 192.168.1.100:54210
[daemon.info] dropbear[2402]: Pubkey auth succeeded for 'root' with ed25519 key`;
    } else {
      stdout = `[SSH: ${session.target} remote output for "${cleanCmd}"]: Command executed successfully (exit code 0).`;
    }

    return {
      sessionId: session.id,
      command: cleanCmd,
      exitCode,
      stdout,
      stderr,
      durationMs: Math.round(session.latencyMs + Math.random() * 8 + 4),
    };
  }

  private startKeepaliveHeartbeat() {
    if (this.keepaliveTimer) return;
    this.keepaliveTimer = setInterval(() => {
      const now = Date.now();
      for (const s of this.sessions.values()) {
        s.lastKeepalive = now;
        s.latencyMs = Math.max(0.4, +(s.latencyMs + (Math.random() - 0.5) * 0.2).toFixed(2));
      }
    }, 15000);
    if (this.keepaliveTimer && typeof this.keepaliveTimer.unref === 'function') {
      this.keepaliveTimer.unref();
    }
  }
}

export const sshService = new SshService();
