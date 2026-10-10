const test = require('node:test');
const assert = require('node:assert/strict');
const { Companion, dayKey } = require('../src/service/gameplay/companion');
const { GameSession } = require('../src/service/gameplay/gameSession');
function harness() {
  let time = new Date(2026, 9, 9, 12).getTime();
  let pet = { info: { yb: 300, health: 5, hunger: 100, clean: 100, mood: 100, growth: 0 }, maxInfo: { level: 10, hunger: 3000, clean: 3000, mood: 1000, growthRate: 260 }, activeOption: {} };
  const writes = [];
  const service = new Companion({ readPet: () => pet, writePet: patch => { writes.push(patch); pet = { ...pet, ...patch, info: { ...pet.info, ...patch.info } }; }, now: () => time, random: () => 0 });
  return { service, writes, pet: () => pet, advance: ms => time += ms };
}
test('daily tasks survive reload; reward and claimed flag are committed together exactly once', () => {
  const h = harness();
  const first = h.service.view();
  assert.equal(new Set(first.daily.tasks.map(t => t.id)).size, 4);
  h.service.view(); assert.equal(h.writes.length, 1);
  const task = first.daily.tasks[0];
  assert.equal(h.service.claim(first.daily.day, task.id).ok, false);
  h.service.record(task.id, task.target);
  assert.equal(h.service.claim(first.daily.day, task.id).ok, true);
  assert.equal(h.writes.at(-1).info.yb, 350);
  assert.equal(h.writes.at(-1).playroom.daily.tasks[0].claimed, true);
  assert.equal(h.service.claim(first.daily.day, task.id).ok, false);
  const saved = JSON.parse(JSON.stringify(h.pet()));
  const reload = new Companion({ readPet: () => saved, writePet() { assert.fail('no save needed'); }, now: () => new Date(2026, 9, 9, 12).getTime() });
  assert.equal(reload.claim(first.daily.day, task.id).ok, false);
  h.advance(86400000);
  assert.equal(h.service.claim(first.daily.day, task.id).ok, false);
  assert.deepEqual(h.service.view().daily.counts, {});
});
test('pokes and game rewards respect health, pause, daily limits and rollover', () => {
  const h = harness(); h.service.view();
  h.pet().activeOption.work = {}; assert.equal(h.service.poke(), false);
  h.pet().activeOption.work = null;
  assert.equal(h.service.poke(), true); assert.equal(h.pet().info.mood, 105);
  assert.equal(h.service.rewardGame(59).minutes, 59);
  assert.equal(h.service.rewardGame(10).minutes, 1);
  assert.equal(h.pet().info.yb, 600);
  assert.equal(h.service.rewardGame(1).minutes, 0);
  const oldDay = h.pet().playroom.daily.day;
  h.advance(86400000);
  assert.equal(h.service.rewardGame(1, oldDay).minutes, 0);
  assert.equal(h.service.rewardGame(1).minutes, 1);
  h.pet().maxInfo.stopGrowth = true;
  assert.equal(h.service.record('Eat'), false);
  assert.equal(h.service.rewardGame(10).minutes, 0);
  h.pet().maxInfo.stopGrowth = false; h.pet().info.health = 1;
  assert.equal(h.service.poke(), false);
  assert.equal(h.service.record('Clean'), false);
});
test('day refreshes at local 6AM', () => {
  assert.equal(dayKey(new Date(2026, 9, 9, 5, 59)), '2026-10-08');
  assert.equal(dayKey(new Date(2026, 9, 9, 6)), '2026-10-09');
});
test('daily game reward budget survives revisiting an earlier date and reload', () => {
  const h=harness();h.service.view();assert.equal(h.service.rewardGame(60).minutes,60);
  const firstDay=h.pet().playroom.daily.day;h.advance(86400000);assert.equal(h.service.rewardGame(1).minutes,1);
  h.advance(-86400000);assert.equal(h.service.view().daily.day,firstDay);
  assert.equal(h.service.view().daily.gameMinutes,60,'old date retains its awarded minutes');
  assert.equal(h.service.rewardGame(1).minutes,0);assert.equal(h.pet().info.yb,605);
  const saved=JSON.parse(JSON.stringify(h.pet()));const reload=new Companion({readPet:()=>saved,writePet(){assert.fail('no repeat reward');},now:()=>new Date(2026,9,9,12).getTime()});
  assert.equal(reload.rewardGame(1).minutes,0);
});
test('legacy awarded minutes migrate without reopening the budget; corrupt ledger refuses rewards',()=>{
  const h=harness();h.service.view();h.pet().playroom.daily.gameMinutes=59;delete h.pet().playroom.gameRewardDays;
  assert.equal(h.service.rewardGame(2).minutes,1);assert.equal(h.pet().playroom.gameRewardDays[h.pet().playroom.daily.day],60);
  h.pet().playroom.gameRewardDays=[];assert.equal(h.service.rewardGame(1).minutes,0);
});
test('returning to a prior date restores its tasks, progress, claimed flags and frozen gifts',()=>{
  const h=harness(),initial=h.service.view(),task=initial.daily.tasks[0];
  h.service.record(task.id,task.target);assert.ok(h.service.claim(initial.daily.day,task.id).ok);
  h.service.poke();const original=JSON.parse(JSON.stringify(h.pet().playroom.daily));
  h.advance(86400000);h.service.view();h.advance(-86400000);h.service.view();
  assert.deepEqual(h.pet().playroom.daily,original);
  assert.equal(h.service.claim(initial.daily.day,task.id).ok,false);assert.equal(h.pet().info.yb,350);
});
test('game sessions exclude loading, blur and suspended gaps; closing is idempotent', () => {
  let time = 0, wall = new Date(2026, 9, 9, 12).getTime();
  const rewards = [];
  const session = new GameSession({ reward: (...args) => rewards.push(args), now: () => time, wallNow: () => wall });
  const tick = (seconds, active) => { for (let i = 0; i < seconds; i++) { time += 1000; session.tick(active); } };
  tick(100, true); assert.equal(rewards.length, 0);
  session.setReady(true); tick(31, true); tick(100, false); tick(31, true);
  assert.equal(rewards.length, 1);
  time += 3600000; session.tick(true); assert.equal(rewards.length, 1);
  wall += 86400000; tick(1, false); assert.equal(session.seconds, 0);
  tick(61, true); assert.equal(rewards.length, 2);
  session.close(true); session.close(true); tick(100, true);
  assert.equal(rewards.length, 2);
});
