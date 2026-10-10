const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../src/assets/reference');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
test('imported bytes match every manifest hash and original LFS size', () => {
  assert.equal(manifest.commit, '6e2c8bf976d66192382f86065fdeb76528f6716c');
  for (const [relative, entry] of Object.entries(manifest.files)) {
    const file = path.resolve(root, relative);
    assert.ok(file.startsWith(root + path.sep));
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.length, entry.size, relative);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, relative);
  }
});
test('all farm/game/font dependencies and 231 catalogued travel photos are present', () => {
  const keys = Object.keys(manifest.files);
  assert.equal(keys.filter(p => p.startsWith('qqfarm/')).length, 6);
  assert.equal(keys.filter(p => p.startsWith('smallGame/')).length, 71);
  assert.ok(keys.includes('qqfont.ttf'));
  const photos = require('../src/service/gameplay/data/album.json');
  assert.equal(photos.length, 231);
  for (const photo of photos) {
    const relative = 'album/' + photo.id + '.webp';
    assert.ok(manifest.files[relative], relative);
    const bytes = fs.readFileSync(path.join(root, relative));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  }
});
