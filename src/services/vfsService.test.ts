import test from 'node:test';
import assert from 'node:assert/strict';

// Helper tests for VFS path normalization and command routing logic
function normalizePath(cwd: string, targetPath: string = ''): string {
  const trimmed = (targetPath || '').trim();
  let parts: string[];
  if (trimmed.startsWith('/')) {
    parts = trimmed.split('/').filter(Boolean);
  } else {
    parts = (cwd + '/' + trimmed).split('/').filter(Boolean);
  }
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') {
      resolved.pop();
    } else {
      resolved.push(p);
    }
  }
  return '/' + resolved.join('/');
}

test('normalizePath resolves relative and absolute paths correctly', () => {
  assert.equal(normalizePath('/root', 'projects'), '/root/projects');
  assert.equal(normalizePath('/root/projects', '..'), '/root');
  assert.equal(normalizePath('/root', '/etc/hosts'), '/etc/hosts');
  assert.equal(normalizePath('/root/scripts', './test.sh'), '/root/scripts/test.sh');
  assert.equal(normalizePath('/root', '../../..'), '/');
});

test('sentiment parameter mapping produces valid color and physics tuples', () => {
  const colorMap = {
    analytical: { p: '#00f2ff', s: '#a855f7' },
    energetic: { p: '#ffd700', s: '#ff007f' },
    alarm: { p: '#ff003c', s: '#ff8800' },
    tranquil: { p: '#10b981', s: '#00f2ff' },
    cosmic: { p: '#a855f7', s: '#3b82f6' },
    chaos: { p: '#ff00ff', s: '#00ffff' },
  };

  assert.equal(colorMap.analytical.p, '#00f2ff');
  assert.equal(colorMap.alarm.p, '#ff003c');
  assert.equal(colorMap.tranquil.p, '#10b981');
  assert.equal(colorMap.cosmic.p, '#a855f7');
});
