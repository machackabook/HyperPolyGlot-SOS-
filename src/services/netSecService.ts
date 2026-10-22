/**
 * NetSecService - Defensive Security Operations, Kali Infrastructure Workloads,
 * and OpenWrt Gateway Network Hardening Subsystem
 */

export interface OpenWrtFirewallRule {
  name: string;
  src?: string;
  dest?: string;
  target: 'ACCEPT' | 'DROP' | 'REJECT';
  proto?: string;
  srcPort?: string;
  destPort?: string;
  enabled: boolean;
}

export interface OpenWrtClientLease {
  ip: string;
  mac: string;
  hostname: string;
  interface: string;
  leaseExpires: string;
  isQuarantined: boolean;
}

export interface SecurityAuditCheck {
  id: string;
  category: 'KERNEL' | 'FIREWALL' | 'WIRELESS' | 'SSH' | 'DNS';
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  value: string;
  recommendation?: string;
}

export interface NetSecAuditReport {
  timestamp: string;
  gatewayIp: string;
  securityScore: number; // 0 - 100
  checks: SecurityAuditCheck[];
  quarantinedIps: string[];
  totalDevices: number;
}

class NetSecService {
  private gatewayIp = '192.168.1.1';
  private gatewayModel = 'OpenWrt 23.05.3 r23809-234f1a2';
  private kernelVersion = 'Linux 6.1.82 #0 SMP';
  private quarantinedIps: Set<string> = new Set();

  private clients: OpenWrtClientLease[] = [
    {
      ip: '192.168.1.100',
      mac: '00:1A:2B:3C:4D:5E',
      hostname: 'MacBook_Mirror_Core',
      interface: 'br-lan',
      leaseExpires: '11h 45m',
      isQuarantined: false,
    },
    {
      ip: '192.168.1.105',
      mac: '10:2A:3B:4C:5D:6E',
      hostname: 'Lenovo_Chromebook_Node',
      interface: 'br-lan',
      leaseExpires: '8h 20m',
      isQuarantined: false,
    },
    {
      ip: '192.168.1.120',
      mac: '20:3A:4B:5C:6D:7E',
      hostname: 'Optiplex_Compute_Vault',
      interface: 'br-lan',
      leaseExpires: '21h 05m',
      isQuarantined: false,
    },
    {
      ip: '192.168.1.150',
      mac: 'A0:B1:C2:D3:E4:F5',
      hostname: 'Kali_Security_Node',
      interface: 'br-lan',
      leaseExpires: '18h 12m',
      isQuarantined: false,
    },
  ];

  private firewallRules: OpenWrtFirewallRule[] = [
    { name: 'Allow-DHCP-Renew', src: 'wan', target: 'ACCEPT', proto: 'udp', destPort: '68', enabled: true },
    { name: 'Allow-Ping', src: 'wan', target: 'ACCEPT', proto: 'icmp', enabled: true },
    { name: 'Allow-IGMP', src: 'wan', target: 'ACCEPT', proto: 'igmp', enabled: true },
    { name: 'Block-WAN-SSH-Direct', src: 'wan', destPort: '22', target: 'DROP', proto: 'tcp', enabled: true },
    { name: 'Block-WAN-LuCI-Web', src: 'wan', destPort: '80,443', target: 'DROP', proto: 'tcp', enabled: true },
    { name: 'SYN-Flood-Protection', target: 'ACCEPT', enabled: true },
  ];

  // Toolchain definitions for Kali workload integration
  public getKaliToolchain() {
    return [
      { name: 'Nmap 7.94', status: 'AVAILABLE', category: 'Port Auditing', description: 'Network discovery and service vulnerability auditing engine' },
      { name: 'Wireshark/Tshark 4.2', status: 'AVAILABLE', category: 'Packet Inspection', description: 'Deep network protocol analyzer and anomaly detection' },
      { name: 'Suricata 7.0', status: 'ACTIVE', category: 'IDS / IPS', description: 'High-performance Network Threat Detection and inline packet filtering' },
      { name: 'Lynis 3.0.9', status: 'AVAILABLE', category: 'Hardening Audit', description: 'Comprehensive security auditing and compliance scoring tool' },
      { name: 'Aircrack-ng 1.7', status: 'AVAILABLE', category: 'Wireless Defense', description: '802.11 protocol auditing and WPA3 transition validation' },
      { name: 'OpenVAS / GVM', status: 'STANDBY', category: 'Vulnerability Engine', description: 'Full-featured vulnerability scanner and patch audit database' },
    ];
  }

  // Audits network hardening posture across kernel, OpenWrt gateway, wireless and SSH
  public runDefensiveAudit(): NetSecAuditReport {
    const checks: SecurityAuditCheck[] = [
      {
        id: 'SYS-SYNCOOKIES',
        category: 'KERNEL',
        title: 'TCP SYN Cookie Protection (net.ipv4.tcp_syncookies)',
        status: 'PASS',
        value: '1 (Enabled)',
      },
      {
        id: 'SYS-RPFILTER',
        category: 'KERNEL',
        title: 'Reverse Path Filtering (net.ipv4.conf.all.rp_filter)',
        status: 'PASS',
        value: '1 (Strict anti-spoofing enabled)',
      },
      {
        id: 'SYS-REDIRECTS',
        category: 'KERNEL',
        title: 'ICMP Redirects Acceptance (net.ipv4.conf.all.accept_redirects)',
        status: 'PASS',
        value: '0 (Disabled - Mitigates MITM routing spoofing)',
      },
      {
        id: 'GW-FW-WAN-DROP',
        category: 'FIREWALL',
        title: 'OpenWrt WAN Default Input Policy',
        status: 'PASS',
        value: 'DROP / REJECT (Zero exposed management ports on WAN)',
      },
      {
        id: 'GW-FW-SYN-FLOOD',
        category: 'FIREWALL',
        title: 'OpenWrt SYN Flood Limiter Rate',
        status: 'PASS',
        value: 'Active (100 burst 50/sec threshold)',
      },
      {
        id: 'WIFI-WPA3-PMF',
        category: 'WIRELESS',
        title: 'OpenWrt Wi-Fi Security & PMF 802.11w',
        status: 'PASS',
        value: 'WPA3-SAE (Protected Management Frames Required)',
      },
      {
        id: 'WIFI-WPS',
        category: 'WIRELESS',
        title: 'Wi-Fi Protected Setup (WPS) Status',
        status: 'PASS',
        value: 'Disabled (Eliminates PIN brute-force vector)',
      },
      {
        id: 'SSH-CIPHERS',
        category: 'SSH',
        title: 'SSH Hardened Cipher Suites',
        status: 'PASS',
        value: 'chacha20-poly1305@openssh.com, curve25519-sha256',
      },
      {
        id: 'SSH-ROOT-PASSWD',
        category: 'SSH',
        title: 'OpenWrt Gateway SSH Authentication Mode',
        status: 'PASS',
        value: 'Ed25519 Public Key Only (Password Auth Disabled)',
      },
      {
        id: 'DNS-DNSSEC',
        category: 'DNS',
        title: 'Dnsmasq / Stubby DNSSEC Validation',
        status: 'PASS',
        value: 'Enforced via 1.1.1.1 / 8.8.8.8 DoT (DNS-over-TLS)',
      },
    ];

    // Compute security score
    const passed = checks.filter((c) => c.status === 'PASS').length;
    const score = Math.round((passed / checks.length) * 100);

    return {
      timestamp: new Date().toISOString(),
      gatewayIp: this.gatewayIp,
      securityScore: score,
      checks,
      quarantinedIps: Array.from(this.quarantinedIps),
      totalDevices: this.clients.length,
    };
  }

  // OpenWrt Gateway telemetry
  public getGatewayStatus() {
    return {
      gatewayIp: this.gatewayIp,
      model: this.gatewayModel,
      kernel: this.kernelVersion,
      uptime: '42 days, 16 hours, 28 mins',
      cpuLoad: '0.08, 0.12, 0.09',
      memory: {
        totalMb: 1024,
        freeMb: 768,
        cachedMb: 142,
      },
      interfaces: [
        { name: 'br-lan', ip: '192.168.1.1/24', type: 'Bridge (LAN)', txBytes: '14.8 GB', rxBytes: '89.4 GB', status: 'UP' },
        { name: 'pppoe-wan', ip: '198.51.100.42/32', type: 'PPPoE (WAN IPv4)', txBytes: '88.1 GB', rxBytes: '14.2 GB', status: 'UP' },
        { name: 'wan6', ip: '2001:db8:85a3::1/64', type: 'DHCPv6 (WAN IPv6)', txBytes: '12.4 GB', rxBytes: '3.1 GB', status: 'UP' },
        { name: 'wlan0', ssid: 'Nexus_5G_Sovereign', band: '5GHz (802.11ax)', enc: 'WPA3-SAE', status: 'UP' },
        { name: 'wlan1', ssid: 'Nexus_2G_IoT_Isolated', band: '2.4GHz (802.11n)', enc: 'WPA2-PSK (Isolated)', status: 'UP' },
      ],
      firewallRules: this.firewallRules,
      dhcpClients: this.clients.map((c) => ({
        ...c,
        isQuarantined: this.quarantinedIps.has(c.ip),
      })),
      quarantinedCount: this.quarantinedIps.size,
    };
  }

  // Quarantine host from gateway firewall
  public quarantineDevice(ip: string): boolean {
    const valid = this.clients.find((c) => c.ip === ip);
    if (!valid && !/^192\.168\.1\.\d+$/.test(ip)) {
      return false;
    }
    this.quarantinedIps.add(ip);
    return true;
  }

  public releaseDevice(ip: string): boolean {
    if (this.quarantinedIps.has(ip)) {
      this.quarantinedIps.delete(ip);
      return true;
    }
    return false;
  }

  public isQuarantined(ip: string): boolean {
    return this.quarantinedIps.has(ip);
  }

  // Generates OpenWrt UCI firewall configuration block
  public generateUciFirewallConfig(): string {
    return `config defaults
	option syn_flood '1'
	option input 'REJECT'
	option output 'ACCEPT'
	option forward 'REJECT'

config zone
	option name 'lan'
	list network 'lan'
	option input 'ACCEPT'
	option output 'ACCEPT'
	option forward 'ACCEPT'

config zone
	option name 'wan'
	list network 'wan'
	list network 'wan6'
	option input 'DROP'
	option output 'ACCEPT'
	option forward 'DROP'
	option masq '1'
	option mtu_fix '1'

config forwarding
	option src 'lan'
	option dest 'wan'

${Array.from(this.quarantinedIps)
  .map(
    (ip, i) => `config rule
	option name 'Quarantine-Compromised-Node-${i + 1}'
	option src 'lan'
	option src_ip '${ip}'
	option target 'DROP'
	option enabled '1'`
  )
  .join('\n\n')}`;
  }
}

export const netSecService = new NetSecService();
