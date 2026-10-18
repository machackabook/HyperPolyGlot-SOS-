import test from 'node:test';
import assert from 'node:assert/strict';
import { getCommandSuggestions, COMMAND_REGISTRY } from './autocompleteService.ts';

test('getCommandSuggestions returns empty array for empty or whitespace query', () => {
  assert.deepEqual(getCommandSuggestions(''), []);
  assert.deepEqual(getCommandSuggestions('   '), []);
});

test('getCommandSuggestions ranks prefix matches highest', () => {
  const suggestions = getCommandSuggestions('ren');
  assert.ok(suggestions.length > 0, 'Should find suggestions for "ren"');
  assert.ok(suggestions[0].command.startsWith('render'), 'Top suggestion should start with "render"');
});

test('getCommandSuggestions returns specific topology subcommands when typing "render "', () => {
  const suggestions = getCommandSuggestions('render t');
  assert.ok(suggestions.some((s) => s.command === 'render tesseract'), 'Should suggest "render tesseract"');
  assert.ok(suggestions.some((s) => s.command === 'render torus'), 'Should suggest "render torus"');
});

test('getCommandSuggestions incorporates dynamic files from current directory', () => {
  const files = ['welcome.txt', 'fibonacci.js', 'projects/'];
  const suggestions = getCommandSuggestions('cat', 6, files);
  assert.ok(suggestions.some((s) => s.command === 'cat welcome.txt'), 'Should suggest "cat welcome.txt"');
});

test('getCommandSuggestions matches satcom and singularity commands', () => {
  const satcomSuggestions = getCommandSuggestions('sat');
  assert.ok(satcomSuggestions.some((s) => s.command === 'satcom ping'), 'Should suggest "satcom ping"');

  const singSuggestions = getCommandSuggestions('sing');
  assert.ok(singSuggestions.some((s) => s.command === 'singularity evolve'), 'Should suggest "singularity evolve"');
});

test('registry contains at least 30 commands covering all system features', () => {
  assert.ok(COMMAND_REGISTRY.length >= 30, `Registry has ${COMMAND_REGISTRY.length} items`);
});
