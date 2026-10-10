const test = require('node:test');
const assert = require('node:assert/strict');
const { Travel, DESTINATIONS, DURATION, PHOTOS } = require('../src/service/gameplay/travel');
const { Companion } = require('../src/service/gameplay/companion');
function harness(random = () => 0.5) {
  let time = new Date(2026, 9, 9, 12).getTime();
  let pet = { info: { host: '阿明', health: 5, mood: 100, yb: 300, hunger: 2000, clean: 2000 }, maxInfo: { level: 10, mood: 1000, hunger: 3000, clean: 3000 }, activeOption: { work: null, study: null, trip: null, ill: null } };
  const writes = [];
  const options = { readPet: () => pet, writePet: patch => { writes.push(JSON.parse(JSON.stringify(patch))); pet = { ...pet, ...patch, info: { ...pet.info, ...patch.info } }; }, now: () => time, random };
  const travel = new Travel(options);
  travel.photoAvailable = () => true;
  return { travel, writes, options, pet: () => pet, advance: n => time += n };
}
test('35 mapped destinations all have stories; new trip blocks simultaneous activities', () => {
  const h = harness(); const view = h.travel.view();
  assert.equal(DESTINATIONS.length, 35);
  assert.equal(view.map.provinces.length, 35);
  assert.deepEqual(new Set(view.destinations), new Set(view.map.provinces.map(p => p.name)));
  assert.ok(DESTINATIONS.every(p => p.extraordinaryEncounter.length && p.extraordinaryEncounter.every(e => e.tolk && e.submitText)));
  h.pet().activeOption.work = {}; assert.equal(h.travel.start().ok, false);
  h.pet().activeOption.work = null; assert.equal(h.travel.start().ok, true);
  assert.equal(h.pet().activeOption.trip.managedTravel, true);
  assert.equal(h.travel.start().ok, false);
});
test('offline completion awards visit, mood and postcard once in one snapshot', () => {
  const h = harness(); h.travel.start();
  h.advance(DURATION + 60000);
  const resumed = new Travel(h.options);
  assert.equal(resumed.tick().ok, true);
  const saved = h.writes.at(-1);
  assert.equal(saved.activeOption.trip, null);
  assert.equal(saved.info.mood, 120);
  assert.equal(saved.playroom.travel.postcards.length, 1);
  assert.equal(Object.values(saved.playroom.travel.visits)[0], 1);
  assert.equal(saved.playroom.daily.counts.Travel1, 1);
  assert.equal(resumed.tick(), null);
  assert.equal(h.travel.tick(), null);
  assert.equal(h.pet().info.mood, 120);
  assert.match(h.travel.view().postcards[0].text, /阿明/);
});
test('pause freezes time across restart; backwards clock gives no progress', () => {
  const h = harness(); h.travel.start();
  h.advance(10000); h.pet().maxInfo.stopGrowth = true; h.travel.tick();
  const remaining = h.travel.view().session.remainingMs;
  h.advance(DURATION * 2); new Travel(h.options).tick();
  assert.equal(h.travel.view().session.remainingMs, remaining);
  h.pet().maxInfo.stopGrowth = false; h.travel.tick();
  assert.equal(h.travel.view().session.remainingMs, remaining);
  h.advance(-5000); h.travel.tick();
  assert.equal(h.travel.view().session.remainingMs, remaining);
  h.advance(remaining); assert.equal(h.travel.tick().ok, true);
});
test('manual return and illness/death cancel without map progress or rewards', () => {
  for (const reason of ['manual', 'ill', 'dead', 'legacy-stop']) {
    const h = harness(); h.travel.start(); h.advance(DURATION);
    if (reason === 'manual') h.travel.cancel();
    if (reason === 'ill') h.pet().activeOption.ill = { type: 'ill' };
    if (reason === 'dead') h.pet().info.health = 0;
    if (reason === 'legacy-stop') h.pet().activeOption.trip = null;
    h.travel.tick();
    const view = h.travel.view();
    assert.equal(view.session, null, reason); assert.equal(view.postcards.length, 0, reason);
    assert.deepEqual(view.visits, {}, reason); assert.equal(h.pet().info.yb, 300);
  }
});
test('lucky encounter returns early; postcard reading and souvenir reward are durable/idempotent', () => {
  const h = harness(() => 0); h.travel.start();
  h.advance(55 * 60000); h.travel.tick();
  const card = h.travel.view().postcards[0];
  assert.equal(card.encounter, true); assert.equal(card.read, false);
  h.travel.openCard(card.id); assert.equal(h.travel.view().unread, 0);
  assert.equal(h.travel.claimEncounter(card.id).ok, true);
  const snapshot = h.writes.at(-1);
  assert.equal(snapshot.info.yb, 340);
  assert.equal(snapshot.playroom.travel.postcards[0].claimed, true);
  assert.equal(snapshot.playroom.travel.souvenirs.length, 1);
  assert.equal(new Travel(h.options).claimEncounter(card.id).ok, false);
  h.travel.start(); h.advance(55 * 60000); h.travel.tick();
  const next = h.travel.view().postcards[0];
  assert.notEqual(next.id, card.id); assert.equal(next.reward, 20);
  h.travel.claimEncounter(next.id); assert.equal(h.pet().info.yb, 360);
});
test('daily companion refresh preserves travel/mail and settings', () => {
  const h = harness(() => 0); h.travel.start(); h.advance(DURATION); h.travel.tick();
  const companion = new Companion(h.options); companion.setting(1);
  h.advance(86400000); companion.view();
  const view = h.travel.view(); assert.equal(view.postcards.length, 1);
  assert.equal(h.pet().playroom.settings.faceMode, 1);
});
test('travel photos match the destination or generic pool, never repeat, and stay linked to mail', () => {
  const h = harness(() => 0);
  for (let i = 0; i < 12; i++) {
    h.travel.start(); h.advance(DURATION); h.travel.tick();
  }
  const photos = h.travel.view().photos;
  assert.equal(photos.length, 12);
  assert.equal(new Set(photos.map(p => p.id)).size, 12);
  for (const shot of photos) {
    const config = PHOTOS.find(p => p.id === shot.id);
    assert.ok(config.p === '北京市' || config.p === '');
    assert.equal(shot.city, '北京市');
  }
  for (const card of h.travel.view().postcards) assert.ok(photos.some(p => p.id === card.photo));
});

test('tour completion charges once and resets only the map; collections, pending letters and trips survive',()=>{
  const h=harness(()=>0);h.travel.start();h.advance(55*60000);h.travel.tick();h.travel.claimEncounter(1);h.travel.start();
  const state=h.pet().playroom.travel;
  state.visits=Object.fromEntries(DESTINATIONS.map(place=>[place.name,1]));h.pet().info.yb=10000;
  const before=JSON.parse(JSON.stringify(state)),dayCounts={...h.pet().playroom.daily.counts};
  assert.equal(h.travel.finishTour(0).ok,true);
  const patch=h.writes.at(-1);assert.equal(patch.info.yb,1112);assert.equal(patch.playroom.travel.tours,1);assert.deepEqual(patch.playroom.travel.visits,{});
  for(const key of ['postcards','souvenirs','photos','sequence','session'])assert.deepEqual(patch.playroom.travel[key],before[key],key);
  assert.deepEqual(patch.playroom.daily.counts,dayCounts);assert.ok(h.pet().activeOption.trip);
  const count=h.writes.length;assert.equal(new Travel(h.options).finishTour(0).ok,false);assert.equal(h.writes.length,count);
  h.advance(55*60000);h.travel.tick();assert.equal(h.travel.view().visits['北京市'],1);assert.equal(h.travel.view().tours,1);assert.equal(h.travel.view().postcards.length,2);
  h.pet().playroom.travel.visits=Object.fromEntries(DESTINATIONS.map(place=>[place.name,1]));h.pet().info.yb=20000;
  assert.equal(h.travel.finishTour(0).ok,false);assert.equal(h.travel.finishTour(1).ok,true);assert.equal(h.pet().info.yb,11112);assert.equal(h.travel.view().tours,2);
});
test('tour completion rejects incomplete maps, invalid counters and insufficient currency without writes',()=>{
  for(const mutate of [t=>delete t.visits['北京市'],t=>t.visits['北京市']=0,t=>t.visits['北京市']=-1,t=>t.visits['北京市']=1.5,t=>t.tours=-1,t=>t.tours=Number.MAX_SAFE_INTEGER]){
    const h=harness();h.travel.view();const t=h.pet().playroom.travel;t.visits=Object.fromEntries(DESTINATIONS.map(place=>[place.name,1]));h.pet().info.yb=10000;mutate(t);
    const count=h.writes.length;assert.equal(h.travel.finishTour(t.tours).ok,false);assert.equal(h.writes.length,count);assert.equal(h.pet().info.yb,10000);
  }
  for(const balance of [8887,Infinity,9000.5]){
    const h=harness();h.travel.view();h.pet().playroom.travel.visits=Object.fromEntries(DESTINATIONS.map(place=>[place.name,1]));h.pet().info.yb=balance;
    const count=h.writes.length;assert.equal(h.travel.finishTour(0).ok,false);assert.equal(h.writes.length,count);assert.equal(h.travel.view().tours,0);
  }
});
