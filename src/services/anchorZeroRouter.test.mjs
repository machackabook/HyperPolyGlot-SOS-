import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDirective,parseVoiceDirective} from './anchorZeroRouter.ts';
test('immediate panel and style routing',()=>{
 assert.deepEqual(parseDirective('panel canvas on'),{kind:'panel',panel:'canvas',on:true});
 assert.deepEqual(parseDirective('(canvas)opacity 50%'),{kind:'opacity',panel:'canvas',value:50});
 assert.equal(parseDirective('(canvas)opacity 101%'),null);
 assert.deepEqual(parseDirective('undo'),{kind:'undo'});
});
test('wake routing needs a recognized wake word and a bounded command',()=>{
 assert.deepEqual(parseVoiceDirective('Solaris, panel docs on'),{kind:'panel',panel:'docs',on:true});
 assert.deepEqual(parseVoiceDirective('Hey Muse'),{kind:'persona',persona:'MUSE'});
 assert.equal(parseVoiceDirective('panel docs on'),null);
 assert.equal(parseDirective('eval process.exit()'),null);
});
