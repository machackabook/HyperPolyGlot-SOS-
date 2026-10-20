import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { D3StreamConfig, D3StreamShape } from '../types';
import {
  Activity,
  Layers,
  Radio,
  Share2,
  Sliders,
  Sparkles,
  Zap,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';

interface D3DataStreamVisualizerProps {
  config: D3StreamConfig;
  onConfigChange: (updated: Partial<D3StreamConfig>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  sentiment?: string;
  className?: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  radius: number;
  label: string;
  path: string;
  ping: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  value: number;
}

interface PacketDatum {
  id: number;
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
  color: string;
}

export const D3DataStreamVisualizer: React.FC<D3DataStreamVisualizerProps> = ({
  config,
  onConfigChange,
  primaryColor = '#00f2ff',
  secondaryColor = '#a855f7',
  sentiment = 'analytical',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [livePackets, setLivePackets] = useState(config.packetRate);
  const [liveThroughput, setLiveThroughput] = useState(config.throughputMbps);
  const [liveJitter, setLiveJitter] = useState(config.jitterMs);

  // Palette color lookups
  const paletteColors = useMemo(() => {
    switch (config.palette) {
      case 'matrix':
        return { primary: '#10b981', secondary: '#059669', accent: '#34d399', bg: 'rgba(5, 46, 22, 0.15)' };
      case 'fuchsia':
        return { primary: '#d946ef', secondary: '#8b5cf6', accent: '#ec4899', bg: 'rgba(74, 4, 78, 0.15)' };
      case 'amber':
        return { primary: '#f59e0b', secondary: '#ef4444', accent: '#fbbf24', bg: 'rgba(69, 26, 3, 0.15)' };
      case 'cyberpunk':
        return { primary: '#00f2ff', secondary: '#f43f5e', accent: '#facc15', bg: 'rgba(15, 23, 42, 0.2)' };
      case 'cyan':
      default:
        return { primary: primaryColor, secondary: secondaryColor, accent: '#38bdf8', bg: 'rgba(8, 51, 68, 0.15)' };
    }
  }, [config.palette, primaryColor, secondaryColor]);

  // Telemetry fluctuation heartbeat
  useEffect(() => {
    if (!config.active) return;
    const interval = setInterval(() => {
      setLivePackets((prev) => Math.max(200, Math.floor(prev + (Math.random() - 0.48) * 80)));
      setLiveThroughput((prev) => +(Math.max(120, prev + (Math.random() - 0.48) * 35)).toFixed(1));
      setLiveJitter((prev) => +(Math.max(0.4, prev + (Math.random() - 0.5) * 0.25)).toFixed(2));
    }, 800);
    return () => clearInterval(interval);
  }, [config.active]);

  // Main D3 Rendering Engine
  useEffect(() => {
    if (!config.active || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Glow filter definition
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradient definitions
    const grad = defs
      .append('linearGradient')
      .attr('id', 'd3-stream-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', paletteColors.primary).attr('stop-opacity', 0.65);
    grad.append('stop').attr('offset', '100%').attr('stop-color', paletteColors.secondary).attr('stop-opacity', 0.15);

    let animationFrameId: number;

    // =========================================================================
    // 1. CLUSTERED FORCE DIRECTED NETWORK TOPOLOGY
    // =========================================================================
    if (config.shape === 'force') {
      const nodeCount = Math.min(60, Math.max(16, config.nodeCount));
      const clusterCount = 5;
      const clusters = [
        { id: 'core', path: '/sys/kernel', color: paletteColors.primary },
        { id: 'vfs', path: '/usr/local/bin', color: paletteColors.secondary },
        { id: 'ai', path: '/etc/neural', color: paletteColors.accent },
        { id: 'sat', path: '/dev/satcom', color: '#f43f5e' },
        { id: 'mem', path: '/var/memory', color: '#fbbf24' },
      ];

      const nodes: SimNode[] = Array.from({ length: nodeCount }, (_, i) => {
        const clusterIdx = i % clusterCount;
        const cluster = clusters[clusterIdx];
        const isGateway = i < clusterCount;
        return {
          id: `node-${i}`,
          group: clusterIdx,
          radius: isGateway ? 12 : Math.random() * 5 + 3,
          label: isGateway ? `${cluster.id.toUpperCase()}-GWAY` : `NODE-${i}`,
          path: cluster.path,
          ping: Math.floor(Math.random() * 25 + 8),
        };
      });

      const links: SimLink[] = [];
      nodes.forEach((node, i) => {
        if (i < clusterCount) {
          // Connect gateways to the central hub (node 0)
          if (i > 0) {
            links.push({ source: nodes[i].id, target: nodes[0].id, value: 3 });
          }
        } else {
          // Connect nodes to their cluster gateway
          const clusterGateway = nodes[node.group];
          links.push({ source: node.id, target: clusterGateway.id, value: 2 });
          
          // Random cross-cluster dependencies
          if (Math.random() > 0.85) {
            const randomOther = nodes[Math.floor(Math.random() * nodeCount)];
            links.push({ source: node.id, target: randomOther.id, value: 1 });
          }
        }
      });

      const g = svg.append('g').attr('class', 'force-container');

      const link = g
        .append('g')
        .attr('stroke', paletteColors.primary)
        .attr('stroke-opacity', 0.25)
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke-width', (d) => Math.sqrt(d.value))
        .attr('stroke-dasharray', '2,4');

      const nodeG = g
        .append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'node-item')
        .style('cursor', 'pointer');

      // Outer halo
      nodeG
        .append('circle')
        .attr('r', (d) => d.radius * 1.8)
        .attr('fill', (d) => clusters[d.group].color)
        .attr('fill-opacity', 0.15)
        .attr('stroke', (d) => clusters[d.group].color)
        .attr('stroke-width', 0.8)
        .attr('filter', 'url(#d3-glow)');

      // Core dot
      nodeG
        .append('circle')
        .attr('r', (d) => d.radius)
        .attr('fill', (d) => (d.radius > 10 ? '#ffffff' : clusters[d.group].color))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.2);

      // Node labels
      nodeG
        .append('text')
        .text((d) => (d.radius > 8 ? d.label : ''))
        .attr('x', (d) => d.radius + 5)
        .attr('y', 3)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.8);

      // Moving packet dots
      const packetGroup = g.append('g').attr('class', 'packets');
      const packets: PacketDatum[] = [];
      for (let p = 0; p < 30; p++) {
        const randLink = links[Math.floor(Math.random() * links.length)];
        packets.push({
          id: p,
          sourceId: typeof randLink.source === 'string' ? randLink.source : (randLink.source as any).id,
          targetId: typeof randLink.target === 'string' ? randLink.target : (randLink.target as any).id,
          progress: Math.random(),
          speed: (Math.random() * 0.015 + 0.005) * (config.packetRate / 1000),
          color: Math.random() > 0.4 ? paletteColors.primary : paletteColors.accent,
        });
      }

      const simulation = d3
        .forceSimulation<SimNode>(nodes)
        .force(
          'link',
          d3
            .forceLink<SimNode, SimLink>(links)
            .id((d) => d.id)
            .distance((d) => (d.value > 2 ? 50 : 100) / config.linkTension)
        )
        .force('charge', d3.forceManyBody().strength(-150 * config.intensity))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05))
        .force('cluster', (alpha: number) => {
          // Attractive force towards cluster centers
          nodes.forEach((d) => {
            const cluster = clusters[d.group];
            const gateway = nodes[d.group]; // We used gateways as centers
            if (gateway && gateway !== d) {
              d.vx! += (gateway.x! - d.x!) * alpha * 0.2 * config.intensity;
              d.vy! += (gateway.y! - d.y!) * alpha * 0.2 * config.intensity;
            }
          });
        })
        .force('collision', d3.forceCollide<SimNode>().radius((d) => d.radius * 2.5));

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);

        // Update packet positions along links
        packets.forEach((pkt) => {
          pkt.progress += pkt.speed;
          if (pkt.progress > 1) {
            pkt.progress = 0;
            const newLink = links[Math.floor(Math.random() * links.length)];
            pkt.sourceId = typeof newLink.source === 'string' ? newLink.source : (newLink.source as any).id;
            pkt.targetId = typeof newLink.target === 'string' ? newLink.target : (newLink.target as any).id;
          }
        });

      // Trail configuration based on sentiment
      const isCreative = sentiment === 'creative';
      const isAnalytical = sentiment === 'analytical';
      const trailLength = isCreative ? 0.15 : isAnalytical ? 0.05 : 0.08;
      const packetRadius = isCreative ? 3.5 : 2.2;

      const packetSelection = packetGroup.selectAll<SVGLineElement, PacketDatum>('line').data(packets, (d) => d.id);

      packetSelection
        .join('line')
        .attr('stroke', (d) => isCreative ? '#d946ef' : d.color)
        .attr('stroke-width', packetRadius)
        .attr('stroke-linecap', 'round')
        .attr('filter', 'url(#d3-glow)')
        .attr('x1', (d) => {
          const sNode = nodes.find((n) => n.id === d.sourceId);
          const tNode = nodes.find((n) => n.id === d.targetId);
          if (!sNode || !tNode || sNode.x === undefined || tNode.x === undefined) return 0;
          const trailProgress = Math.max(0, d.progress - trailLength);
          return sNode.x + (tNode.x - sNode.x) * trailProgress;
        })
        .attr('y1', (d) => {
          const sNode = nodes.find((n) => n.id === d.sourceId);
          const tNode = nodes.find((n) => n.id === d.targetId);
          if (!sNode || !tNode || sNode.y === undefined || tNode.y === undefined) return 0;
          const trailProgress = Math.max(0, d.progress - trailLength);
          return sNode.y + (tNode.y - sNode.y) * trailProgress;
        })
        .attr('x2', (d) => {
          const sNode = nodes.find((n) => n.id === d.sourceId);
          const tNode = nodes.find((n) => n.id === d.targetId);
          if (!sNode || !tNode || sNode.x === undefined || tNode.x === undefined) return 0;
          return sNode.x + (tNode.x - sNode.x) * d.progress;
        })
        .attr('y2', (d) => {
          const sNode = nodes.find((n) => n.id === d.sourceId);
          const tNode = nodes.find((n) => n.id === d.targetId);
          if (!sNode || !tNode || sNode.y === undefined || tNode.y === undefined) return 0;
          return sNode.y + (tNode.y - sNode.y) * d.progress;
        });
    });

      return () => {
        simulation.stop();
      };
    }

    // =========================================================================
    // 2. DYNAMIC FLOWING STREAMGRAPH
    // =========================================================================
    if (config.shape === 'streamgraph') {
      const g = svg.append('g').attr('class', 'streamgraph-container');
      const pointCount = 40;
      const layerCount = 4;
      const layerNames = ['Ingress Traffic', 'Egress Bandwidth', 'Neural Packet Synapses', 'Quantum Entanglement'];

      let time = 0;
      const layersData = Array.from({ length: layerCount }, (_, lIdx) => {
        return Array.from({ length: pointCount }, (_, pIdx) => ({
          x: pIdx,
          y: Math.sin(pIdx * 0.3 + lIdx) * 15 + 25 + Math.random() * 5,
        }));
      });

      const xScale = d3.scaleLinear().domain([0, pointCount - 1]).range([0, width]);
      const yScale = d3.scaleLinear().domain([-100, 100]).range([height * 0.85, height * 0.15]);

      const colors = [paletteColors.primary, paletteColors.secondary, paletteColors.accent, '#f43f5e'];

      const paths = g
        .selectAll('path')
        .data(layersData)
        .join('path')
        .attr('fill', (_, i) => colors[i % colors.length])
        .attr('fill-opacity', (_, i) => (i === 0 ? 0.35 : 0.22))
        .attr('stroke', (_, i) => colors[i % colors.length])
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#d3-glow)');

      // Horizontal baseline telemetry grids
      const gridG = g.append('g').attr('class', 'grid-lines').attr('opacity', 0.2);
      [0.3, 0.5, 0.7].forEach((ratio) => {
        gridG
          .append('line')
          .attr('x1', 0)
          .attr('y1', height * ratio)
          .attr('x2', width)
          .attr('y2', height * ratio)
          .attr('stroke', paletteColors.primary)
          .attr('stroke-dasharray', '4,8');
      });

      const renderStream = () => {
        time += 0.03 * config.intensity;

        const updatedLayers = layersData.map((layer, lIdx) => {
          return layer.map((pt, pIdx) => {
            const freq = 0.25 * (lIdx + 1);
            const amp = (18 + lIdx * 6) * config.intensity;
            const wave = Math.sin(pIdx * freq + time) * Math.cos(time * 0.5 + pIdx * 0.1) * amp;
            return {
              x: pt.x,
              y0: (lIdx - 1.5) * 22 + wave - amp * 0.5,
              y1: (lIdx - 1.5) * 22 + wave + amp * 0.5,
            };
          });
        });

        const areaGen = d3
          .area<any>()
          .x((d) => xScale(d.x))
          .y0((d) => yScale(d.y0))
          .y1((d) => yScale(d.y1))
          .curve(d3.curveBasis);

        paths.data(updatedLayers).attr('d', areaGen as any);

        animationFrameId = requestAnimationFrame(renderStream);
      };

      renderStream();

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    // =========================================================================
    // 3. CONCENTRIC RADAR & TELEMETRY SWEEP
    // =========================================================================
    if (config.shape === 'radar') {
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      const maxR = Math.min(width, height) * 0.38;

      // Range rings
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        g.append('circle')
          .attr('r', maxR * ratio)
          .attr('fill', 'none')
          .attr('stroke', paletteColors.primary)
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', ratio === 1 ? 'none' : '3,5');
      });

      // Axis crosshairs
      g.append('line').attr('x1', -maxR).attr('y1', 0).attr('x2', maxR).attr('y2', 0).attr('stroke', paletteColors.primary).attr('stroke-opacity', 0.2);
      g.append('line').attr('x1', 0).attr('y1', -maxR).attr('x2', 0).attr('y2', maxR).attr('stroke', paletteColors.primary).attr('stroke-opacity', 0.2);

      // Radar sweep wedge
      const sweep = g.append('path').attr('fill', `url(#d3-stream-grad)`).attr('opacity', 0.45);

      // Detected blips
      const blips = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        r: Math.random() * maxR * 0.88 + 20,
        pingTime: Math.random() * 100,
      }));

      const blipG = g.selectAll('.blip').data(blips).join('g').attr('class', 'blip');

      blipG
        .append('circle')
        .attr('r', 3.5)
        .attr('cx', (d) => Math.cos(d.angle) * d.r)
        .attr('cy', (d) => Math.sin(d.angle) * d.r)
        .attr('fill', paletteColors.accent)
        .attr('filter', 'url(#d3-glow)');

      blipG
        .append('text')
        .text((d) => `SAT-${d.id + 10}`)
        .attr('x', (d) => Math.cos(d.angle) * d.r + 6)
        .attr('y', (d) => Math.sin(d.angle) * d.r + 3)
        .attr('fill', '#94a3b8')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace');

      let sweepAngle = 0;
      const renderRadar = () => {
        sweepAngle += 0.025 * config.intensity;
        const wedgeArc = d3
          .arc()
          .innerRadius(0)
          .outerRadius(maxR)
          .startAngle(sweepAngle)
          .endAngle(sweepAngle + 0.35);

        sweep.attr('d', wedgeArc as any);

        animationFrameId = requestAnimationFrame(renderRadar);
      };

      renderRadar();

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    // =========================================================================
    // 4. ORBITAL CHORD RING MATRIX
    // =========================================================================
    if (config.shape === 'chord') {
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      const outerR = Math.min(width, height) * 0.32;
      const count = 12;

      const stations = Array.from({ length: count }, (_, i) => {
        const theta = (i / count) * Math.PI * 2;
        return {
          id: i,
          x: Math.cos(theta) * outerR,
          y: Math.sin(theta) * outerR,
          label: `STATION-α${i + 1}`,
          theta,
        };
      });

      // Outer ring guide
      g.append('circle').attr('r', outerR).attr('fill', 'none').attr('stroke', paletteColors.primary).attr('stroke-opacity', 0.2).attr('stroke-width', 1);

      // Chords between stations
      const chordLinesG = g.append('g');
      stations.forEach((st, i) => {
        const target = stations[(i + 4) % count];
        chordLinesG
          .append('path')
          .attr('d', `M ${st.x} ${st.y} Q 0 0 ${target.x} ${target.y}`)
          .attr('fill', 'none')
          .attr('stroke', i % 2 === 0 ? paletteColors.primary : paletteColors.secondary)
          .attr('stroke-opacity', 0.35)
          .attr('stroke-width', 1.4)
          .attr('filter', 'url(#d3-glow)');
      });

      // Station nodes
      const stG = g.selectAll('.station').data(stations).join('g').attr('class', 'station');

      stG
        .append('circle')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('r', 6)
        .attr('fill', paletteColors.primary)
        .attr('filter', 'url(#d3-glow)');

      stG
        .append('text')
        .text((d) => d.label)
        .attr('x', (d) => d.x * 1.15 - 20)
        .attr('y', (d) => d.y * 1.15)
        .attr('fill', '#cbd5e1')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace');

      let rot = 0;
      const renderChord = () => {
        rot += 0.003 * config.intensity;
        g.attr('transform', `translate(${width / 2}, ${height / 2}) rotate(${rot * 57.2958})`);
        animationFrameId = requestAnimationFrame(renderChord);
      };

      renderChord();

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
  }, [config.active, config.shape, config.nodeCount, config.linkTension, config.intensity, config.palette, paletteColors]);

  if (!config.active) return null;

  return (
    <>
      {/* 1. Underlying Real-Time SVG Canvas */}
      <svg
        ref={svgRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none z-0 ${className}`}
        style={{
          opacity: 0.9,
          mixBlendMode: 'screen',
        }}
      />

      {/* 2. Background Stream Telemetry Banner (Gemini Full Duplex Streamer) */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none max-w-2xl w-full px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,242,255,0.15)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold tracking-wider uppercase text-white">D3 STREAM [{config.shape.toUpperCase()}]</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300">{livePackets.toLocaleString()} pkt/s</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-300">{liveThroughput} MB/s</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300">Jitter: {liveJitter}ms</span>
        </div>

        {/* Gemini's Real-Time Telemetry Summary text streamed directly into background */}
        {config.geminiTelemetrySummary && (
          <div className="mt-1.5 text-[11px] text-slate-300/80 font-mono tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
            {config.geminiTelemetrySummary}
          </div>
        )}
      </div>

      {/* 3. Floating Interactive HUD Controller Panel */}
      {config.showPanel && (
        <div className="absolute top-16 right-4 z-40 w-72 rounded-xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-xl shadow-2xl font-mono text-xs text-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-bold text-white text-[11px] tracking-wide">D3 TELEMETRY HUD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanelMinimized(!panelMinimized)}
                className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title={panelMinimized ? 'Expand panel' : 'Collapse panel'}
              >
                {panelMinimized ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => onConfigChange({ showPanel: false })}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Hide HUD"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          {!panelMinimized && (
            <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
              {/* Shape Switcher */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" /> Shape Matrix
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['force', 'streamgraph', 'radar', 'chord'] as D3StreamShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => {
                        audioVoiceService.playEarcon('switch');
                        onConfigChange({ shape });
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer text-left flex items-center gap-1.5 ${
                        config.shape === shape
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.25)]'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {shape === 'force' && <Share2 className="w-3 h-3" />}
                      {shape === 'streamgraph' && <Activity className="w-3 h-3" />}
                      {shape === 'radar' && <Radio className="w-3 h-3" />}
                      {shape === 'chord' && <RefreshCw className="w-3 h-3" />}
                      <span className="capitalize">{shape}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Telemetry Metric Gauges */}
              <div className="p-2 bg-black/60 rounded-lg border border-slate-800/80 space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Packets Ingress:</span>
                  <span className="text-emerald-400 font-bold">{livePackets.toLocaleString()} /s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Data Throughput:</span>
                  <span className="text-cyan-400 font-bold">{liveThroughput} MB/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Jitter Variance:</span>
                  <span className="text-amber-400 font-bold">{liveJitter} ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Trigger Command:</span>
                  <span className="text-fuchsia-300 font-mono truncate max-w-[120px]">{config.lastCommand || 'satcom'}</span>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-2 text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Intensity / Speed</span>
                    <span className="text-cyan-300">{config.intensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="3.0"
                    step="0.1"
                    value={config.intensity}
                    onChange={(e) => onConfigChange({ intensity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Node Density</span>
                    <span className="text-cyan-300">{config.nodeCount}</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    step="2"
                    value={config.nodeCount}
                    onChange={(e) => onConfigChange({ nodeCount: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Palette Switcher */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-1 block">
                  Chromatic Matrix
                </label>
                <div className="flex items-center gap-1.5">
                  {(['cyan', 'fuchsia', 'matrix', 'amber', 'cyberpunk'] as const).map((pal) => (
                    <button
                      key={pal}
                      type="button"
                      onClick={() => onConfigChange({ palette: pal })}
                      className={`px-1.5 py-0.5 rounded text-[9px] border uppercase transition cursor-pointer ${
                        config.palette === pal
                          ? 'border-white text-white font-bold bg-white/10'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Action Triggers */}
              <div className="pt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    audioVoiceService.playEarcon('stream');
                    setLivePackets((p) => p + 3000);
                    setLiveThroughput((t) => +(t * 1.8).toFixed(1));
                  }}
                  className="flex-1 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-cyan-300" />
                  <span>BURST</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioVoiceService.playEarcon('success');
                    setLiveJitter(0.4);
                  }}
                  className="flex-1 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3 text-emerald-300" />
                  <span>STABILIZE</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
