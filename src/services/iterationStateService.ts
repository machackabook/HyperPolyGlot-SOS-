/**
 * IterationStateService - Lightweight Per-Iteration State Persistence & Compaction Engine
 * Automatically saves state deltas after every command execution, compresses historical memory
 * using PrimeMathCompressor, and stores records in virtual sparsebands to guarantee zero memory bloat.
 */

import { EnvironmentState } from '../types';
import { primeCompressor, PrimeCompressionStats } from './primeMathCompressor';
import { sparsebundleService } from './sparsebundleService';

export interface IterationSnapshot {
  iterationId: number;
  timestamp: number;
  command: string;
  outputPreview: string;
  topology: string;
  sentiment: string;
  primaryColor: string;
  cwd: string;
  compressedSize: number;
  rawSize: number;
  primeToken: string;
}

export interface StateEngineTelemetry {
  totalIterationsRecorded: number;
  currentIterationId: number;
  inMemorySnapshotsCount: number;
  archivedSparseSnapshotsCount: number;
  totalRawBytes: number;
  totalCompressedBytes: number;
  spaceReductionPercentage: string;
  activeSparsebundle: string;
  lastCompactedAt: number;
}

class IterationStateService {
  private currentIteration = 0;
  private rawMemoryWindow: IterationSnapshot[] = []; // In-memory sliding window (max 5)
  private readonly MAX_RAM_WINDOW = 5;
  private totalRawBytesAccumulated = 0;
  private totalCompressedBytesAccumulated = 0;
  private activeBundle = 'StateVault.sparsebundle';
  private lastCompactionTime = Date.now();

  /**
   * Records state delta after each command iteration
   */
  public recordIteration(
    command: string,
    output: string,
    envState: EnvironmentState,
    cwd: string
  ): IterationSnapshot {
    this.currentIteration++;
    const timestamp = Date.now();

    // Prepare serializable iteration delta
    const deltaPayload = JSON.stringify({
      iter: this.currentIteration,
      ts: timestamp,
      cmd: command,
      out: output.slice(0, 4000), // Cap per-iteration raw preview
      env: {
        topology: envState.topology,
        sentiment: envState.sentiment,
        color: envState.primaryColor,
        speed: envState.speed,
        terminalDock: envState.terminalDock,
        voiceProfile: envState.voiceProfile,
      },
      cwd,
    });

    const rawBytes = new TextEncoder().encode(deltaPayload).length;
    this.totalRawBytesAccumulated += rawBytes;

    // 1. Prime Mathematica High-Integer Compression
    const { compressed, stats } = primeCompressor.compress(deltaPayload);
    this.totalCompressedBytesAccumulated += stats.compressedBytes;

    const snapshot: IterationSnapshot = {
      iterationId: this.currentIteration,
      timestamp,
      command,
      outputPreview: output.slice(0, 120),
      topology: envState.topology,
      sentiment: envState.sentiment,
      primaryColor: envState.primaryColor,
      cwd,
      compressedSize: stats.compressedBytes,
      rawSize: rawBytes,
      primeToken: stats.fermatVerificationResidue,
    };

    // 2. Commit compressed snapshot to virtual sparsebundle bands
    try {
      const fileName = `iterations/iter_${String(this.currentIteration).padStart(6, '0')}.prm`;
      sparsebundleService.writeFile(this.activeBundle, fileName, compressed);
    } catch (err) {
      console.warn('[IterationStateService] Sparse write warning:', err);
    }

    // 3. Maintain sliding window in RAM to keep storage lightweight
    this.rawMemoryWindow.push(snapshot);
    if (this.rawMemoryWindow.length > this.MAX_RAM_WINDOW) {
      this.rawMemoryWindow.shift(); // Evict older snapshot from active RAM into sparsebundle
    }

    // Auto-compact every 25 iterations
    if (this.currentIteration % 25 === 0) {
      this.compactStorage();
    }

    return snapshot;
  }

  /**
   * Reclaims storage and optimizes sparse bands
   */
  public compactStorage() {
    this.lastCompactionTime = Date.now();
    return sparsebundleService.compact(this.activeBundle);
  }

  /**
   * Retrieves telemetry metrics
   */
  public getTelemetry(): StateEngineTelemetry {
    const raw = Math.max(1, this.totalRawBytesAccumulated);
    const comp = this.totalCompressedBytesAccumulated;
    const ratio = Math.max(0, +((1 - (comp / raw)) * 100).toFixed(1));

    return {
      totalIterationsRecorded: this.currentIteration,
      currentIterationId: this.currentIteration,
      inMemorySnapshotsCount: this.rawMemoryWindow.length,
      archivedSparseSnapshotsCount: Math.max(0, this.currentIteration - this.rawMemoryWindow.length),
      totalRawBytes: this.totalRawBytesAccumulated,
      totalCompressedBytes: this.totalCompressedBytesAccumulated,
      spaceReductionPercentage: `${ratio}%`,
      activeSparsebundle: this.activeBundle,
      lastCompactedAt: this.lastCompactionTime,
    };
  }

  /**
   * Reads and decompresses a specific historical iteration from sparse storage
   */
  public getHistoricalIteration(iterationId: number): any | null {
    try {
      const fileName = `iterations/iter_${String(iterationId).padStart(6, '0')}.prm`;
      const compressed = sparsebundleService.readFile(this.activeBundle, fileName);
      const decompressed = primeCompressor.decompress(compressed);
      return JSON.parse(decompressed.decompressedText);
    } catch {
      return null;
    }
  }

  /**
   * Gets recent memory window
   */
  public getRecentSnapshots(): IterationSnapshot[] {
    return [...this.rawMemoryWindow];
  }
}

export const iterationStateService = new IterationStateService();
