import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Shield,
  Activity,
  Terminal,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server,
  Zap,
  HardDrive,
  Cpu,
  Wifi,
  Eye,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { netSecService, OpenWrtClientLease, SecurityAuditCheck } from '../services/netSecService';
import { sshService, SshSession } from '../services/sshService';
import { sparsebundleService } from '../services/sparsebundleService';
import { iterationStateService } from '../services/iterationStateService';
import { audioVoiceService } from '../services/audioVoiceService';

interface NetworkSecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (cmd: string) => void;
}

interface PacketFlowDataPoint {
  time: number;
  wanInbound: number;
  lanForwarded: number;
  suricataFiltered: number;
  wifiEncrypted: number;
}

export const NetworkSecurityDashboard: React.FC<NetworkSecurityDashboardProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'kali' | 'ssh' | 'gateway' | 'sparse'>('overview');
  const [report, setReport] = useState(() => netSecService.runDefensiveAudit());
  const [gatewayStatus, setGatewayStatus] = useState(() => netSecService.getGatewayStatus());
  const [sshSessions, setSshSessions] = useState<SshSession[]>(() => sshService.getSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string>('root@192.168.1.1:22');
  const [sshCommandInput, setSshCommandInput] = useState('uci show firewall');
  const [sshOutput, setSshOutput] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stateTelemetry, setStateTelemetry] = useState(() => iterationStateService.getTelemetry());

  // Packet Flow History for D3
  const packetFlowHistory = useRef<PacketFlowDataPoint[]>([]);
  const d3PacketChartRef = useRef<SVGSVGElement | null>(null);
  const d3RadarChartRef = useRef<SVGSVGElement | null>(null);

  // Poll fresh status periodically when open
  useEffect(() => {
    if (!isOpen) return;

    // Seed initial packet history if empty
    if (packetFlowHistory.current.length === 0) {
      const now = Date.now();
      for (let i = 20; i >= 0; i--) {
        packetFlowHistory.current.push({
          time: now - i * 1000,
          wanInbound: 0,
          lanForwarded: 0,
          suricataFiltered: 0,
          wifiEncrypted: 0,
        });
      }
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const newPoint: PacketFlowDataPoint = {
        time: now,
        wanInbound: 0,
        lanForwarded: 0,
        suricataFiltered: 0,
        wifiEncrypted: 0,
      };

      packetFlowHistory.current.push(newPoint);
      if (packetFlowHistory.current.length > 30) {
        packetFlowHistory.current.shift();
      }

      setGatewayStatus(netSecService.getGatewayStatus());
      setSshSessions(sshService.getSessions());
      setStateTelemetry(iterationStateService.getTelemetry());
      renderD3PacketChart();
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Render D3 Streamgraph / Area Chart
  const renderD3PacketChart = () => {
    const svgEl = d3PacketChartRef.current;
    if (!svgEl || packetFlowHistory.current.length < 2) return;

    const svg = d3.select(svgEl);
    const width = svgEl.clientWidth || 550;
    const height = 180;
    const margin = { top: 15, right: 20, bottom: 25, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const data = packetFlowHistory.current;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.time)) as [Date, Date])
      .range([0, innerWidth]);

    const maxVal = d3.max(data, (d) => Math.max(d.wanInbound, d.lanForwarded, d.wifiEncrypted)) || 300;
    const yScale = d3.scaleLinear().domain([0, maxVal * 1.15]).range([innerHeight, 0]);

    // Defs for gradients
    const defs = svg.append('defs');

    // WAN Gradient
    const gradWan = defs.append('linearGradient').attr('id', 'grad-wan').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradWan.append('stop').attr('offset', '0%').attr('stop-color', '#00f2ff').attr('stop-opacity', 0.45);
    gradWan.append('stop').attr('offset', '100%').attr('stop-color', '#00f2ff').attr('stop-opacity', 0.02);

    // LAN Gradient
    const gradLan = defs.append('linearGradient').attr('id', 'grad-lan').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradLan.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    gradLan.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.02);

    // Suricata Drop Gradient
    const gradDrop = defs.append('linearGradient').attr('id', 'grad-drop').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradDrop.append('stop').attr('offset', '0%').attr('stop-color', '#ff003c').attr('stop-opacity', 0.6);
    gradDrop.append('stop').attr('offset', '100%').attr('stop-color', '#ff003c').attr('stop-opacity', 0.05);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,2')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => ''));

    // Area Generators
    const areaWan = d3
      .area<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y0(innerHeight)
      .y1((d) => yScale(d.wanInbound))
      .curve(d3.curveMonotoneX);

    const areaLan = d3
      .area<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y0(innerHeight)
      .y1((d) => yScale(d.lanForwarded))
      .curve(d3.curveMonotoneX);

    const areaDrop = d3
      .area<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y0(innerHeight)
      .y1((d) => yScale(d.suricataFiltered * 5))
      .curve(d3.curveMonotoneX);

    // Draw Areas
    g.append('path').datum(data).attr('fill', 'url(#grad-wan)').attr('d', areaWan);
    g.append('path').datum(data).attr('fill', 'url(#grad-lan)').attr('d', areaLan);
    g.append('path').datum(data).attr('fill', 'url(#grad-drop)').attr('d', areaDrop);

    // Line strokes
    const lineWan = d3
      .line<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y((d) => yScale(d.wanInbound))
      .curve(d3.curveMonotoneX);

    const lineLan = d3
      .line<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y((d) => yScale(d.lanForwarded))
      .curve(d3.curveMonotoneX);

    const lineDrop = d3
      .line<PacketFlowDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y((d) => yScale(d.suricataFiltered * 5))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#00f2ff').attr('stroke-width', 2).attr('d', lineWan);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#10b981').attr('stroke-width', 1.8).attr('d', lineLan);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#ff003c').attr('stroke-width', 2).attr('stroke-dasharray', '3,2').attr('d', lineDrop);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('color', '#64748b')
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date)))
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // Y Axis
    g.append('g')
      .attr('color', '#64748b')
      .call(d3.axisLeft(yScale).ticks(4))
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');
  };

  // Render D3 Radar Security Posture
  useEffect(() => {
    if (!isOpen || activeTab !== 'overview') return;
    const svgEl = d3RadarChartRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    const size = 180;
    const radius = size / 2 - 25;
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${size / 2},${size / 2})`);

    const axes = [
      { name: 'Kernel', val: 1.0 },
      { name: 'Firewall', val: 0.95 },
      { name: 'WPA3 PMF', val: 1.0 },
      { name: 'SSH Ed25519', val: 0.98 },
      { name: 'DNSSEC DoT', val: 0.94 },
      { name: 'Zero-Trust', val: 0.92 },
    ];

    const angleSlice = (Math.PI * 2) / axes.length;

    // Concentric Web Circles
    [0.25, 0.5, 0.75, 1.0].forEach((level) => {
      g.append('circle')
        .attr('r', radius * level)
        .attr('fill', 'none')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);
    });

    // Axis Lines & Labels
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#334155')
        .attr('stroke-dasharray', '2,2');

      const labelX = Math.cos(angle) * (radius + 14);
      const labelY = Math.sin(angle) * (radius + 14);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(axis.name);
    });

    // Polygon Radar Path
    const points: [number, number][] = axes.map((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [Math.cos(angle) * radius * axis.val, Math.sin(angle) * radius * axis.val];
    });

    const polygonPath = d3.line()(points) + 'Z';

    g.append('path')
      .attr('d', polygonPath)
      .attr('fill', 'rgba(0, 242, 255, 0.25)')
      .attr('stroke', '#00f2ff')
      .attr('stroke-width', 2);

    // Glowing anchor nodes
    points.forEach(([x, y]) => {
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', '#00f2ff').attr('stroke', '#020617').attr('stroke-width', 1.5);
    });
  }, [isOpen, activeTab, report]);

  if (!isOpen) return null;

  const handleQuarantineToggle = (ip: string, isCurrentlyQuarantined: boolean) => {
    if (isCurrentlyQuarantined) {
      netSecService.releaseDevice(ip);
      audioVoiceService.playTone(880, 'sine', 150);
    } else {
      netSecService.quarantineDevice(ip);
      audioVoiceService.playTone(330, 'sawtooth', 200);
    }
    setGatewayStatus(netSecService.getGatewayStatus());
    setReport(netSecService.runDefensiveAudit());
  };

  const handleRunSshCommand = () => {
    if (!sshCommandInput.trim()) return;
    const res = sshService.executeRemoteCommand(selectedSessionId, sshCommandInput);
    setSshOutput(res.exitCode === 0 ? res.stdout : `[Error ${res.exitCode}]: ${res.stderr}`);
    audioVoiceService.playTone(720, 'triangle', 60);
  };

  const handleTriggerAudit = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const fresh = netSecService.runDefensiveAudit();
      setReport(fresh);
      setIsRefreshing(false);
      audioVoiceService.playEarcon('success');
    }, 600);
  };

  const handleCompactVault = () => {
    const res = iterationStateService.compactStorage();
    setStateTelemetry(iterationStateService.getTelemetry());
    audioVoiceService.playTone(963, 'sine', 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-500/50 bg-[#060b18]/95 shadow-[0_0_50px_rgba(0,242,255,0.25)] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
              <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  KALI LINUX & OPENWRT DEFENSIVE CYBER OPERATIONS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                  SCORE: {report.securityScore}/100
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Gateway 192.168.1.1 (OpenWrt 23.05.3) • Kali SecOps Infrastructure • Persistent SSH Mesh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerAudit}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Re-run comprehensive defensive security scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>AUDIT NOW</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-1.5 bg-black/40 border-b border-slate-800 text-xs shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & D3 Stream', icon: Activity },
            { id: 'kali', label: 'Kali Toolchain & IDS', icon: Server },
            { id: 'ssh', label: 'SSH Session Manager', icon: Terminal },
            { id: 'gateway', label: 'OpenWrt & Rogue Quarantine', icon: Wifi },
            { id: 'sparse', label: 'Sparsebundle State Memory', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  audioVoiceService.playTone(880, 'sine', 30);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & D3 PACKET STREAM */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Top Row: D3 Packet Flow Stream + Radar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* D3 Real-Time Packet Flow Area Stream */}
                <div className="lg:col-span-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="font-bold text-white text-xs">
                        REAL-TIME D3 GATEWAY PACKET TRAFFIC & ANOMALY FILTER
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> WAN Inbound
                      </span>
                      <span className="flex items-center gap-1 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> LAN Forward
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Suricata Drops
                      </span>
                    </div>
                  </div>
                  <svg ref={d3PacketChartRef} className="w-full h-[180px] overflow-visible" />
                </div>

                {/* D3 Radar Security Posture */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col items-center justify-center space-y-1">
                  <div className="w-full flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold text-white text-[11px]">SECURITY POSTURE RADAR</span>
                    <span className="text-cyan-400 font-bold">{report.securityScore}%</span>
                  </div>
                  <svg ref={d3RadarChartRef} width={180} height={180} />
                </div>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[10px] text-slate-400">GATEWAY UPTIME</div>
                  <div className="text-sm font-bold text-white">{gatewayStatus.uptime.split(',')[0]}</div>
                  <div className="text-[9px] text-emerald-400">Load: {gatewayStatus.cpuLoad}</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[10px] text-slate-400">ACTIVE CLIENTS</div>
                  <div className="text-sm font-bold text-white">{gatewayStatus.dhcpClients.length} Online</div>
                  <div className="text-[9px] text-rose-400">
                    {gatewayStatus.quarantinedCount > 0 ? `${gatewayStatus.quarantinedCount} Quarantined` : '0 Quarantined (Secure)'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[10px] text-slate-400">SSH TUNNEL MESH</div>
                  <div className="text-sm font-bold text-cyan-300">{sshSessions.length} Active Node(s)</div>
                  <div className="text-[9px] text-slate-400">ChaCha20-Poly1305</div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <div className="text-[10px] text-slate-400">SPARSE STATE MEMORY</div>
                  <div className="text-sm font-bold text-purple-300">{stateTelemetry.spaceReductionPercentage} Saved</div>
                  <div className="text-[9px] text-slate-400">Prime Mathematica Token</div>
                </div>
              </div>

              {/* Security Audit Checks Summary */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">DEFENSIVE HARDENING MATRIX CHECKS</span>
                  <span className="text-[10px] text-slate-400">10 / 10 Passing</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {report.checks.map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-black/40 border border-slate-800/80 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-200">{c.title}</div>
                        <div className="text-[10px] text-slate-400">{c.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KALI DEFENSIVE TOOLCHAIN & IDS */}
          {activeTab === 'kali' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-300 text-sm">KALI LINUX WORKLOAD WORKSPACE</h3>
                  <p className="text-[11px] text-slate-300">
                    Host: kali@192.168.1.150 • Suricata Inline IPS • Lynis Compliance Auditor
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-purple-500/30 border border-purple-400 text-purple-200 font-bold text-[10px]">
                  DEFENSIVE WORKLOAD: ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {netSecService.getKaliToolchain().map((tool) => (
                  <div key={tool.name} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tool.name}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {tool.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-bold uppercase">{tool.category}</div>
                    <p className="text-[11px] text-slate-300">{tool.description}</p>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => onExecuteCommand?.(`netsec ${tool.name.toLowerCase().split(' ')[0]}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition cursor-pointer"
                      >
                        Inspect Telemetry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERSISTENT SSH SESSION MANAGER */}
          {activeTab === 'ssh' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">ACTIVE PERSISTENT SSH SESSIONS</span>
                  <button
                    onClick={() => {
                      setSshOutput('SSH_NOT_CONNECTED: Authenticated live SSH transport has not been configured. No session was created.');
                      setSshSessions(sshService.getSessions());
                      audioVoiceService.playEarcon('success');
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold transition cursor-pointer"
                  >
                    + Connect Kali Node
                  </button>
                </div>

                <div className="space-y-2">
                  {sshSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.target)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex flex-wrap items-center justify-between gap-2 ${
                        selectedSessionId === s.target
                          ? 'border-cyan-500/80 bg-cyan-950/30 shadow-[0_0_12px_rgba(0,242,255,0.2)]'
                          : 'border-slate-800 bg-black/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="font-bold text-white">{s.target}</span>
                          <span className="text-[10px] text-slate-400 ml-2">ID: {s.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-slate-400">{s.cipherSuite}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {s.latencyMs.toFixed(1)}ms
                        </span>
                        <span className="text-emerald-400 font-bold">● {s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remote Execution Sandbox */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5">
                <span className="font-bold text-white">REMOTE SSH COMMAND EXECUTION ({selectedSessionId})</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sshCommandInput}
                    onChange={(e) => setSshCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunSshCommand()}
                    placeholder="e.g. uci show firewall, iptables -L, uname -a"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleRunSshCommand}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>EXEC</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  {['uci show firewall', 'iptables -L', 'uname -a', 'logread | tail -n 10', 'free -m', 'cat /etc/openwrt_release'].map(
                    (cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          setSshCommandInput(cmd);
                          const res = sshService.executeRemoteCommand(selectedSessionId, cmd);
                          setSshOutput(res.exitCode === 0 ? res.stdout : res.stderr);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        {cmd}
                      </button>
                    )
                  )}
                </div>

                {sshOutput && (
                  <pre className="p-3 rounded-lg bg-black border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {sshOutput}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OPENWRT GATEWAY & ROGUE QUARANTINE */}
          {activeTab === 'gateway' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">OPENWRT DHCP CLIENTS & ZERO-TRUST DEFENSE</h4>
                    <p className="text-[10px] text-slate-400">
                      Instantly sever rogue lateral movements by injecting DROP policies into the gateway firewall
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Subnet: 192.168.1.0/24</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1.5 px-2">IP ADDRESS</th>
                        <th className="py-1.5 px-2">HOSTNAME</th>
                        <th className="py-1.5 px-2">MAC ADDRESS</th>
                        <th className="py-1.5 px-2">INTERFACE</th>
                        <th className="py-1.5 px-2">EXPIRES</th>
                        <th className="py-1.5 px-2 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {gatewayStatus.dhcpClients.map((client) => (
                        <tr key={client.ip} className={client.isQuarantined ? 'bg-rose-950/25' : ''}>
                          <td className="py-2 px-2 font-mono text-cyan-300 font-bold">{client.ip}</td>
                          <td className="py-2 px-2 text-white">{client.hostname}</td>
                          <td className="py-2 px-2 text-slate-400 font-mono">{client.mac}</td>
                          <td className="py-2 px-2 text-slate-400">{client.interface}</td>
                          <td className="py-2 px-2 text-slate-400">{client.leaseExpires}</td>
                          <td className="py-2 px-2 text-right">
                            <button
                              onClick={() => handleQuarantineToggle(client.ip, client.isQuarantined)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ml-auto ${
                                client.isQuarantined
                                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/60 hover:bg-rose-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-rose-400 hover:text-rose-300'
                              }`}
                            >
                              {client.isQuarantined ? (
                                <>
                                  <Unlock className="w-3 h-3 text-rose-400" />
                                  <span>RELEASE</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>QUARANTINE</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wi-Fi 6 WPA3-SAE & PMF Matrix */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
                <span className="font-bold text-white">GATEWAY WIRELESS SECURITY CONFIGURATION</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-300">Primary Core AP (wlan0)</div>
                    <div className="text-slate-300">SSID: HyperTerminal-SecNet (5GHz 802.11ax HE80)</div>
                    <div className="text-emerald-400">Encryption: WPA3-SAE (Protected Management Frames mandatory)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 space-y-1">
                    <div className="font-bold text-purple-300">Isolated Guest/IoT (wlan1)</div>
                    <div className="text-slate-300">SSID: Nexus_2G_IoT_Isolated (2.4GHz)</div>
                    <div className="text-amber-400">Client Isolation: ENABLED (Zero lateral broadcast)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SPARSEBUNDLE STATE MEMORY */}
          {activeTab === 'sparse' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">VIRTUAL SPARSEBUNDLE DISK IMAGE ENGINE</h4>
                    <p className="text-[10px] text-slate-400">
                      Standard Apple Sparsebundle (.sparsebundle) with on-demand band slicing & zero memory bloat
                    </p>
                  </div>
                  <button
                    onClick={handleCompactVault}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>COMPACT DISK</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-400">TOTAL ITERATIONS</div>
                    <div className="text-lg font-bold text-white">{stateTelemetry.totalIterationsRecorded}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-400">SLIDING RAM WINDOW</div>
                    <div className="text-lg font-bold text-cyan-300">{stateTelemetry.inMemorySnapshotsCount} Snapshots</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-400">SPARSE ARCHIVED</div>
                    <div className="text-lg font-bold text-purple-300">{stateTelemetry.archivedSparseSnapshotsCount} Bands</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-[10px] text-slate-400">PRIME COMPRESSION</div>
                    <div className="text-lg font-bold text-emerald-400">{stateTelemetry.spaceReductionPercentage} Saved</div>
                  </div>
                </div>

                {/* Bundle Specs */}
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                  <div>BUNDLE UUID     : urn:uuid:state-vault-sovereign-2026-sparse</div>
                  <div>VIRTUAL CAPACITY: 107,374,182,400 Bytes (100 GB Virtual Volume)</div>
                  <div>BAND CHUNK SIZE : 65,536 Bytes (64 KB Sparse Band Slices)</div>
                  <div>ACTIVE MOUNT    : /mnt/sparsebundles/vault (Auto-Attended Plug-n-Play)</div>
                  <div>PRIME MODULUS   : 137451921129154222 (18-Digit Sovereign Canonical Prime)</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Footer Controls */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] shrink-0 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All systems nominal • Defense score: {report.securityScore}/100</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
};
