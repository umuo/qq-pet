const test = require('node:test');
const assert = require('node:assert/strict');
const { encode, decode, storageKey } = require('../src/windows/util/pet/sol');
test('farm SOL round-trips Unicode, arrays, nested fields and signed numbers', () => {
  const data = { user: { username: '企鹅的农场', wealth: '300', rank: '01', weather: 'Sunny', active: true, blank: null, numbers: [0, 127, 128, 16384, 2097152, -1, 1.25], farmland: Array.from({ length: 18 }, (_, i) => ({ farmland: i < 6 ? 'FarmlandS' : 'Wasteland', crop: i === 0 ? 'RadishSeed' : '', time: 1791500000 })), burden: [{ object: 'RadishSeed', num: 2 }], warehouse: [] } };
  const bytes = Uint8Array.from(encode('test', data));
  assert.deepEqual(JSON.parse(JSON.stringify(decode(bytes))), data);
  assert.equal(storageKey(), 'localhost//test');
});
test('invalid/truncated SOL is rejected', () => {
  assert.throws(() => decode(new Uint8Array(0)), /header/);
  assert.throws(() => decode(new Uint8Array(30)), /header/);
});
