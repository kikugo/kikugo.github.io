import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  floatTo16BitPCM,
  int16ToBase64,
  base64ToInt16,
  downsampleFloat32,
} from '../audio.js';

test('floatTo16BitPCM clamps and scales', () => {
  const out = floatTo16BitPCM(Float32Array.from([0, 1, -1, 2]));
  assert.equal(out[0], 0);
  assert.equal(out[1], 32767);
  assert.equal(out[2], -32768);
  assert.equal(out[3], 32767); // clamped from 2.0
});

test('int16 <-> base64 round-trips', () => {
  const pcm = Int16Array.from([0, 1234, -5678, 32767, -32768]);
  const b64 = int16ToBase64(pcm);
  const back = base64ToInt16(b64);
  assert.deepEqual(Array.from(back), Array.from(pcm));
});

test('downsampleFloat32 reduces length by the ratio', () => {
  const input = new Float32Array(480); // 0.01s @ 48kHz
  const out = downsampleFloat32(input, 48000, 16000);
  assert.equal(out.length, 160); // -> 0.01s @ 16kHz
});

test('downsampleFloat32 is a no-op when rates match', () => {
  const input = Float32Array.from([0.1, 0.2, 0.3]);
  const out = downsampleFloat32(input, 16000, 16000);
  assert.deepEqual(Array.from(out), Array.from(input));
});
