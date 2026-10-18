import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeCommandLine, analyzeCommandSyntax } from './syntaxHighlightService.ts';

test('tokenizeCommandLine returns empty array for empty string', () => {
  assert.deepEqual(tokenizeCommandLine(''), []);
});

test('tokenizes 3D render commands and topology arguments', () => {
  const tokens = tokenizeCommandLine('render tesseract');
  assert.equal(tokens.length, 3); // 'render', ' ', 'tesseract'
  assert.equal(tokens[0].text, 'render');
  assert.equal(tokens[0].type, 'command-3d');
  assert.equal(tokens[2].text, 'tesseract');
  assert.equal(tokens[2].type, 'topology');
});

test('tokenizes VFS file operations, flags, and paths', () => {
  const tokens = tokenizeCommandLine('ls -la /root/projects');
  assert.equal(tokens[0].text, 'ls');
  assert.equal(tokens[0].type, 'command-vfs');
  assert.equal(tokens[2].text, '-la');
  assert.equal(tokens[2].type, 'flag');
  assert.equal(tokens[4].text, '/root/projects');
  assert.equal(tokens[4].type, 'path');
});

test('tokenizes AI and voice commands with parameters and toggles', () => {
  const tokens = tokenizeCommandLine('voice on');
  assert.equal(tokens[0].text, 'voice');
  assert.equal(tokens[0].type, 'command-ai');
  assert.equal(tokens[2].text, 'on');
  assert.equal(tokens[2].type, 'toggle');
});

test('tokenizes hex color codes and numeric arguments', () => {
  const tokens = tokenizeCommandLine('color #00f2ff 1.50');
  assert.equal(tokens[0].type, 'command-3d');
  assert.equal(tokens[2].text, '#00f2ff');
  assert.equal(tokens[2].type, 'hexcolor');
  assert.equal(tokens[4].text, '1.50');
  assert.equal(tokens[4].type, 'number');
});

test('tokenizes quoted strings and AI query arguments', () => {
  const tokens = tokenizeCommandLine('gemini "explain quantum coherence"');
  assert.equal(tokens[0].type, 'command-ai');
  assert.equal(tokens[2].text, '"explain quantum coherence"');
  assert.equal(tokens[2].type, 'string');
});

test('tokenizes pipeline and multiple command chaining', () => {
  const tokens = tokenizeCommandLine('cat welcome.txt | grep HyperTerminal');
  const types = tokens.map((t) => t.type);
  assert.ok(types.includes('operator'));
  assert.ok(types.includes('command-vfs'));
});

test('analyzeCommandSyntax correctly identifies categories and flags', () => {
  const analysis = analyzeCommandSyntax('cat -n notes.md');
  assert.equal(analysis.primaryCommand, 'cat');
  assert.equal(analysis.commandCategory, 'VFS FILE');
  assert.deepEqual(analysis.flags, ['-n']);
  assert.equal(analysis.hasError, false);
});

test('analyzeCommandSyntax flags unknown command as unregistered', () => {
  const analysis = analyzeCommandSyntax('foobar -x');
  assert.equal(analysis.primaryCommand, 'foobar');
  assert.equal(analysis.hasError, true);
});

test('analyzeCommandSyntax correctly classifies D3 and network commands', () => {
  const d3Analysis = analyzeCommandSyntax('d3 shape streamgraph');
  assert.equal(d3Analysis.primaryCommand, 'd3');
  assert.equal(d3Analysis.commandCategory, 'CORE SWARM');
  assert.equal(d3Analysis.hasError, false);

  const histAnalysis = analyzeCommandSyntax('history --export');
  assert.equal(histAnalysis.primaryCommand, 'history');
  assert.equal(histAnalysis.hasError, false);
  assert.deepEqual(histAnalysis.flags, ['--export']);
});
