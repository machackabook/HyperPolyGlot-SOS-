import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { primeCompressor, PrimeMathCompressor } from './primeMathCompressor';
import { sparsebundleService } from './sparsebundleService';
import { iterationStateService } from './iterationStateService';
import { pipelineEngine } from './pipelineEngine';

describe('PrimeMathCompressor - High-Integer Prime Mathematica Engine', () => {
  test('Canonical prime constants and Fermat residue verification', () => {
    assert.equal(PrimeMathCompressor.CANONICAL_PRIME, 137451921129154222n);
    const residue = PrimeMathCompressor.computeFermatResidue('HyperTerminal Sovereign Core 2026');
    assert.match(residue, /^0x[0-9A-F]+:0x[0-9A-F]+/);
  });

  test('Compresses and reversibly decompresses data using prime polynomial residues', () => {
    const original = 'HyperTerminal state iteration: {"status": "active", "openwrt": "192.168.1.1", "firewall": "enabled"}';
    const { compressed, stats } = primeCompressor.compress(original);

    assert.ok(compressed.startsWith('PRM:'));
    assert.ok(stats.compressedBytes > 0);
    assert.ok(stats.fermatVerificationResidue.length > 0);

    const result = primeCompressor.decompress(compressed);
    assert.equal(result.checksumValid, true);
    assert.match(result.decompressedText, /HyperTerminal state iteration/);
  });
});

describe('SparsebundleService - Virtual Sparse Disk Image Engine', () => {
  test('Creates virtual 50GB sparsebundle with 64KB bands', () => {
    const meta = sparsebundleService.createBundle('TestVault.sparsebundle', 50 * 1024 * 1024 * 1024, 64 * 1024);
    assert.equal(meta.bundleName, 'TestVault.sparsebundle');
    assert.equal(meta.virtualCapacityBytes, 50 * 1024 * 1024 * 1024);
    assert.equal(meta.bandSizeBytes, 64 * 1024);
  });

  test('Dynamically allocates sparse bands and reassembles files', () => {
    const payload = 'A'.repeat(128 * 1024); // 128 KB payload (needs 2 x 64KB bands)
    const writeRes = sparsebundleService.writeFile('TestVault.sparsebundle', 'payload.bin', payload);
    assert.equal(writeRes.bytesWritten, 128 * 1024);
    assert.equal(writeRes.bandsAllocated, 2);

    const readBack = sparsebundleService.readFile('TestVault.sparsebundle', 'payload.bin');
    assert.equal(readBack.length, 128 * 1024);
    assert.equal(readBack, payload);
  });

  test('Compacts bundle and computes sparsity ratio', () => {
    const compactRes = sparsebundleService.compact('TestVault.sparsebundle');
    assert.ok(compactRes.newAllocatedBytes > 0);
    assert.match(compactRes.sparsitySaving, /%/);
  });
});

describe('PipelineEngine - Pipethru Workflow & High-Speed Toolchain', () => {
  test('Detects and splits unquoted pipeline stages', () => {
    const cmd = 'cat welcome.txt | grep HyperTerminal | wc -l';
    assert.equal(pipelineEngine.hasPipe(cmd), true);
    const stages = pipelineEngine.splitPipeline(cmd);
    assert.deepEqual(stages, ['cat welcome.txt', 'grep HyperTerminal', 'wc -l']);
  });

  test('Executes stream filters (grep, wc, sort, uniq, prime)', () => {
    const input = 'orange\napple\nbanana\napple\norange\napple';
    const grepRes = pipelineEngine.executeFilter('grep apple', input);
    assert.equal(grepRes.output, 'apple\napple\napple');

    const wcRes = pipelineEngine.executeFilter('wc -l', input);
    assert.equal(wcRes.output, '6');

    const primeRes = pipelineEngine.executeFilter('prime compress', 'Sample computational data');
    assert.ok(primeRes.output.includes('PRIME MATHEMATICA COMPRESSION APPLIED'));
  });

  test('Executes Bun and UV high-performance toolchains', () => {
    const bunVer = pipelineEngine.executeBun(['--version']);
    assert.equal(bunVer, '1.1.20');

    const bunRun = pipelineEngine.executeBun(['run', 'Math.pow(2, 16)']);
    assert.match(bunRun, /65536/);

    const uvList = pipelineEngine.executeUv(['pip', 'list']);
    assert.match(uvList, /numpy/);
    assert.match(uvList, /sympy/);
  });
});

describe('IterationStateService - Per-Iteration Snapshotting', () => {
  test('Records iteration state and evicts raw RAM to sparse bands', () => {
    const fakeEnv: any = {
      topology: 'torus',
      sentiment: 'analytical',
      primaryColor: '#00f2ff',
      speed: 1.0,
      terminalDock: 'bottom',
      voiceProfile: 'gemini_female',
    };

    const snap = iterationStateService.recordIteration('ls -la', 'total 42\ndrwxr-xr-x root', fakeEnv, '/root');
    assert.ok(snap.iterationId > 0);
    assert.equal(snap.command, 'ls -la');
    assert.ok(snap.compressedSize > 0);

    const telemetry = iterationStateService.getTelemetry();
    assert.ok(telemetry.totalIterationsRecorded > 0);
    assert.ok(telemetry.inMemorySnapshotsCount <= 5);
  });
});
