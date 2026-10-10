const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
test('actual startup keeps a healthy managed trip and its saved mail; illness still cancels activity', () => {
  for (const ill of [null, { type: 'ill', health: 2 }]) {
    const saved = { info: { host: '测试', sex: 'GG', birthDay: '2026-10-09', lastLoginTime: Date.now(), health: 5 }, maxInfo: {}, activeValue: { study: {} }, activeOption: { ill, work: null, study: null, desktopGame:'rope', trip: { managedTravel: true, id: 3, city: '北京市' } }, otherOptions: {}, playroom: { version: 1, travel: { session: { id: 3 }, postcards: [{ id: 2 }] } } };
    let restored;
    const context = vm.createContext({
      require: name => name.endsWith('root.js') ? { createMain(fn) { fn(0, '', ''); } } : name.endsWith('level') ? { pinkDiamondLevel: { isExpirationDate: () => ({}), toChangeOtherDatas: () => ({}) } } : name.endsWith('main.js') ? { cleate() {} } : {},
      $Store: { getItem: key => key === 'pet' ? saved : {} },
      setSys() {}, setCache() {}, setPetInfo: data => restored = data,
      shuffleArr: x => x, upDownArr: x => x, $test: false, console, Date,
      tool: { getTime: () => '2026-10-09', getDayHourTime: () => Date.now() }
    });
    vm.runInContext(fs.readFileSync('src/ini/doMain.js', 'utf8'), context);
    assert.equal(restored.activeOption.trip?.id || null, ill ? null : 3);
    assert.equal(restored.playroom.travel.postcards.length, 1);
    assert.equal(restored.activeOption.desktopGame,null,'startup clears a game window that no longer exists');
  }
});
test('actual growth countdown never finishes a wall-clock trip as a work/study activity', () => {
  const { GrowUp } = require('../src/windows/util/pet/GrowUp');
  const growth = Object.create(GrowUp.prototype);
  const options = { trip: { managedTravel: true, stateTime: 999, overTime: 60, obtain: { yb: 100 } } };
  const result = growth.countdownActiveTime(options, {}, () => assert.fail('legacy award'), () => assert.fail('legacy study update'));
  assert.equal(result.trip.stateTime, 999);
  assert.equal(result.trip.managedTravel, true);
});
