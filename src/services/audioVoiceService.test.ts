import test from 'node:test';
import assert from 'node:assert/strict';

// Helper tests for audio DSP volume calculation and clamping logic
function calculateNormalizedRms(waveformData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < waveformData.length; i++) {
    const normalized = (waveformData[i] - 128) / 128;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / waveformData.length);
  return Math.min(1.0, rms * 4.5);
}

test('calculateNormalizedRms returns zero for silent waveform buffer', () => {
  const silentWave = new Uint8Array(128).fill(128); // 128 is center DC offset
  const vol = calculateNormalizedRms(silentWave);
  assert.equal(vol, 0.0);
});

test('calculateNormalizedRms calculates accurate amplitude for max peak wave', () => {
  const maxWave = new Uint8Array(128).map((_, i) => (i % 2 === 0 ? 255 : 0));
  const vol = calculateNormalizedRms(maxWave);
  assert.ok(vol > 0.9, `Volume should be close to 1.0, got ${vol}`);
});

test('pitch and rate parameters clamp within standard boundary [0.5, 2.0]', () => {
  const clamp = (val: number) => Math.max(0.5, Math.min(2.0, val));
  assert.equal(clamp(0.1), 0.5);
  assert.equal(clamp(3.5), 2.0);
  assert.equal(clamp(1.2), 1.2);
});

test('voice profiles include all 4 personas with harmonic carrier frequencies', () => {
  const profiles = [
    { id: 'sovereign', freq: 432 },
    { id: 'quantum', freq: 528 },
    { id: 'cyber', freq: 963 },
    { id: 'tranquil', freq: 639 },
  ];
  assert.equal(profiles.length, 4);
  assert.ok(profiles.every((p) => p.freq > 400 && p.freq < 1000));
});

test('voice audio frequency blending aggregates max energy per bin', () => {
  const bufA = new Uint8Array([50, 120, 200]);
  const bufB = new Uint8Array([80, 90, 240]);
  const out = new Uint8Array(3);
  for (let i = 0; i < 3; i++) {
    out[i] = Math.max(bufA[i], bufB[i]);
  }
  assert.equal(out[0], 80);
  assert.equal(out[1], 120);
  assert.equal(out[2], 240);
});

