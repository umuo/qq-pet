const test = require('node:test');
const assert = require('node:assert/strict');
const { Farm, freshFarm } = require('../src/service/gameplay/farm');
const { encode } = require('../src/windows/util/pet/sol');
function harness() {
  let pet = { info: { name: '小企鹅', health: 5, yb: 300, mood: 800, hunger: 2000, clean: 2000 }, maxInfo: { level: 10, mood: 1000, hunger: 3000, clean: 3000 }, activeOption: {} };
  const writes = []; let serial = 0;
  const farm = new Farm({ readPet: () => pet, writePet: patch => { writes.push(JSON.parse(JSON.stringify(patch))); pet = { ...pet, ...patch, info: { ...pet.info, ...patch.info } }; }, makeId: () => 'session-' + ++serial, random: () => 0 });
  return { farm, writes, pet: () => pet };
}
test('farm reserves its wallet once and atomically returns net balance alongside outside income', () => {
  const h = harness(); const boot = h.farm.open();
  assert.equal(boot.user.wealth, '300'); assert.equal(h.pet().info.yb, 0);
  assert.equal(h.writes.at(-1).playroom.farm.session.balance, 300);
  assert.equal(h.farm.open().id, boot.id); assert.equal(h.writes.length, 1);
  h.pet().info.yb = 40;
  const user = { ...boot.user, wealth: '220' };
  assert.equal(h.farm.sync({ id: boot.id, sequence: 1, user }), true);
  assert.equal(h.pet().info.yb, 40);
  assert.equal(h.farm.close({ id: boot.id, sequence: 2, user }), true);
  assert.equal(h.pet().info.yb, 260); assert.equal(h.pet().info.mood, 800);
  assert.equal(h.writes.at(-1).playroom.farm.session, null);
  assert.equal(h.writes.at(-1).info.yb, 260);
  assert.equal(h.farm.close({ id: boot.id }), false);
  assert.equal(h.farm.sync({ id: boot.id, sequence: 3, user: { ...user, wealth: '1000' } }), false);
});
test('stale ids/sequences and invalid farm money/data cannot alter the reserved balance', () => {
  const h = harness(); const boot = h.farm.open();
  for (const payload of [{ id: 'wrong', sequence: 1, user: boot.user }, { id: boot.id, sequence: 0, user: boot.user }, { id: boot.id, sequence: 1, user: { ...boot.user, wealth: '-1' } }, { id: boot.id, sequence: 1, user: { ...boot.user, wealth: 'NaN' } }, { id: boot.id, sequence: 1, user: { ...boot.user, farmland: [] } }]) assert.equal(h.farm.sync(payload), false);
  assert.equal(h.farm.view().wallet, 300);
  h.farm.close({ id: boot.id }); assert.equal(h.pet().info.yb, 300);
});
test('crash recovery reads last Ruffle SOL once, and ignores an old profile session', () => {
  for (const valid of [true, false]) {
    const h = harness(); const boot = h.farm.open(); h.pet().info.yb = 15;
    const raw = Buffer.from(encode('test', { user: { ...freshFarm(), username: '小企鹅', wealth: '180' } })).toString('base64');
    assert.equal(h.farm.recover({ id: valid ? boot.id : 'old-profile', raw }), true);
    assert.equal(h.pet().info.yb, valid ? 195 : 315);
    assert.equal(h.farm.recover({ id: boot.id, raw }), false);
  }
});
test('failed load refunds wallet; unhealthy and paused pets cannot open a new session', () => {
  const h = harness(); const boot = h.farm.open(); h.farm.close({ id: boot.id });
  assert.equal(h.pet().info.yb, 300);
  h.pet().maxInfo.stopGrowth = true; assert.equal(h.farm.open().ok, false);
  h.pet().maxInfo.stopGrowth = false; h.pet().activeOption.ill = {}; assert.equal(h.farm.open().ok, false);
});
