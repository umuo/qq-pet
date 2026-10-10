const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const faceData = require('../src/windows/util/pet/facePoints');

test('all body interactions load and return to idle for each pose', async () => {
  let count = 0;
  for (const sex of ['GG', 'MM']) {
    for (const [level, mood] of [[2, 1000], [6, 1000], [10, 1000], [10, 850], [10, 700], [10, 300]]) {
      const h = harness(sex, level, mood);
      await h.normal();
      const { age, state } = h.pet.router;
      const pose = { sex, age, state };
      for (const [key, point] of Object.entries(faceData.points(pose))) {
        for (let variant = point.s || 1; variant <= (point.e || point.s || 1); variant++) {
          let loaded = 0;
          h.pet.interact('../assets/Action/' + faceData.target(pose, key, variant), () => loaded++);
          await h.tick(0);
          assert.equal(loaded, 1, `${sex}/${age}/${state}/${key}${variant}`);
          assert.equal(h.events.at(-1), 'interact');
          await h.tick();
          assert.equal(h.events.at(-1), 'normal');
          assert.equal(h.timers.size, 1);
          count++;
        }
      }
    }
  }
  assert.ok(count > 200);
});

function harness(sex = 'GG', level = 10, mood = 850) {
  let now = 0;
  let id = 0;
  const timers = new Map();
  const events = [];
  const parent = { appendChild(el) { el.parentNode = this; } };
  const placeholder = { parentNode: parent, removeAttribute() {}, remove() {} };
  const players = [];
  function createPlayer() {
    const el = { style: {}, parentNode: null, addEventListener(name, fn) { this[name] = fn; }, removeAttribute() {}, remove() {}, ruffle() { return this.api; } };
    el.api = {
      metadata: null, isPlaying: true,
      async load({ url }) {
        assert.ok(fs.existsSync(new URL(url)), url);
        el.api.metadata = { numFrames: url.includes('Stand') ? 1 : 100, frameRate: 12 };
        el.loadedmetadata();
      },
      suspend() { this.isPlaying = false; }, resume() { this.isPlaying = true; }
    };
    players.push(el);
    return el;
  }
  const context = vm.createContext({
    window: { RufflePlayer: { newest: () => ({ createPlayer }) }, requestAnimationFrame: () => 1 },
    document: { baseURI: 'file://' + path.resolve('src/windows/app.html'), getElementById: () => placeholder },
    performance: { now: () => now }, URL, console,
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    requestAnimationFrame: fn => { queueMicrotask(() => fn(now)); return 1; },
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
    clearTimeout: key => timers.delete(key), setInterval: () => 1, clearInterval() {}
  });
  vm.runInContext(fs.readFileSync(path.resolve('src/windows/util/pet/swfPet.js'), 'utf8'), context);
  const pet = new context.window.swfPet({ id: 'pet', backFn: event => events.push(event.name || event.tolkName) });
  pet.init({ state: { info: { sex, mood, health: 5, growth: 100 }, maxInfo: { level } }, baseRouter: 'file://' + path.resolve('src/assets/Action') });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  async function tick(elapsed = 10000) { now += elapsed; pet.state.getState(); await settle(); }
  async function normal() { await settle(); for (let i = 0; i < 5 && events.at(-1) !== 'normal'; i++) await tick(); }
  return { pet, events, timers, players, tick, settle, normal, context };
}

test('entry finishes even when polling skips its final frame; one-frame Stand accepts play', async () => {
  const h = harness();
  await h.normal();
  assert.equal(h.events[0], 'enter');
  assert.equal(h.events.at(-1), 'normal');
  assert.equal(h.pet.swf.dom.TotalFrames(), 1);
  assert.equal(h.timers.size, 1);
  let loaded = 0, finished = 0;
  h.pet.changeSwf('play', { load: () => loaded++, finish: () => finished++ });
  assert.equal(h.timers.size, 0);
  await h.tick(0);
  assert.equal(loaded, 1);
  assert.equal(h.events.at(-1), 'play');
  await h.tick();
  assert.equal(finished, 1);
  assert.equal(h.events.at(-1), 'normal');
  assert.equal(h.timers.size, 1);
  await h.tick();
  assert.equal(finished, 1);
});

test('idle repeatedly plays an action and re-arms only after returning to Stand', async () => {
  const h = harness();
  await h.normal();
  for (let i = 0; i < 3; i++) {
    const timer = h.timers.get(h.pet.swf.playTime);
    assert.ok(timer.delay >= 20000 && timer.delay <= 60000);
    h.timers.delete(h.pet.swf.playTime);
    timer.fn();
    await h.tick(0);
    assert.equal(h.events.at(-1), 'play');
    await h.tick();
    assert.equal(h.events.at(-1), 'normal');
    assert.equal(h.timers.size, 1);
  }
});

test('GG/MM egg, kid and adult moods use existing resources and finish their actions', async () => {
  for (const sex of ['GG', 'MM']) {
    for (const [level, mood] of [[2, 1000], [6, 1000], [10, 1000], [10, 850], [10, 700], [10, 300]]) {
      const h = harness(sex, level, mood);
      await h.normal();
      h.pet.changeSwf('play');
      await h.tick(0); await h.tick();
      for (let i = 0; i < 3 && h.events.at(-1) !== 'normal'; i++) await h.tick();
      assert.equal(h.events.at(-1), 'normal', `${sex}/${level}/${mood}`);
    }
  }
});

test('quiet small talk re-arms idle and queued feeding cancels it', async () => {
  const h = harness();
  await h.normal();
  h.context.Math.random = () => 0.1;
  const timer = h.timers.get(h.pet.swf.playTime);
  h.timers.delete(h.pet.swf.playTime);
  timer.fn();
  assert.equal(h.events.at(-1), 'smallTalk');
  assert.equal(h.timers.size, 1);
  h.pet.changeSwf('eat');
  assert.equal(h.timers.size, 0);
  await h.tick(0);
  assert.equal(h.events.at(-1), 'eat');
  assert.equal(h.pet.swf.playTime, null);
  await h.tick();
  assert.equal(h.events.at(-1), 'normal');
  assert.equal(h.timers.size, 1);
});


test('happy adults stand after repeated actions and recover from the legacy lying pose', async () => {
  for (const sex of ['GG', 'MM']) {
    const h = harness(sex, 10, 1000);
    await h.normal();
    // Low random values formerly selected prostrate for many consecutive actions.
    h.context.Math.random = () => 0;
    for (let i = 0; i < 12; i++) {
      h.pet.changeSwf('play'); await h.tick(0); await h.tick();
      assert.equal(h.pet.router.state, 'happy');
      assert.equal(h.events.at(-1), 'normal');
      assert.match(h.pet.swf.oldNext.src, /Adult\/happy\/Stand.swf$/);
      assert.equal(h.timers.size, 1);
    }
    h.pet.router.state = 'prostrate';
    h.pet.setPetState({info:{sex,mood:1000,health:5,growth:100},maxInfo:{level:10}});
    assert.equal(h.pet.router.state, 'happy');
  }
});
