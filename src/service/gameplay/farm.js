const { Companion, companion } = require('./companion');
const { decode } = require('../../windows/util/pet/sol');
const { randomUUID } = require('node:crypto');
function freshFarm() {
  return { house: 'house', kennel: 'kennel', fence: 'fence', experience: '1', rank: '01', burden: [], warehouse: [], farmland: Array.from({ length: 18 }, (_, i) => ({ farmland: i < 6 ? 'FarmlandS' : 'Wasteland' })), weather: 'Sunny' };
}
function validUser(user) {
  return user && typeof user === 'object' && Array.isArray(user.farmland) && user.farmland.length === 18 && user.farmland.every(p => p && typeof p.farmland === 'string') && Array.isArray(user.burden) && Array.isArray(user.warehouse) && Number.isSafeInteger(Number(user.wealth)) && Number(user.wealth) >= 0;
}
class Farm {
  constructor(options = {}) {
    this.companion = options.companion || new Companion(options);
    this.makeId = options.makeId || randomUUID;
  }
  load() {
    const data = this.companion.load();
    data.state.farm = { user: null, session: null, ...data.state.farm };
    return data;
  }
  open() {
    const { p, state } = this.load();
    if (!this.companion.usable(p) || p.activeOption.ill) return { ok: false, message: '先恢复健康、继续成长，再来照料农场吧~' };
    if (!state.farm.session) {
      const balance = Number(p.info.yb) || 0;
      if (!Number.isSafeInteger(balance) || balance < 0) return { ok: false, message: '元宝余额异常，请先检查宠物存档。' };
      state.farm.user = { ...(state.farm.user || freshFarm()), username: p.info.name, wealth: String(balance) };
      state.farm.session = { id: this.makeId(), balance, sequence: 0 };
      // Reserve the farm's wallet, so concurrent purchases elsewhere cannot spend it.
      this.companion.writePet({ playroom: state, info: { yb: 0 } });
    }
    return { ok: true, id: state.farm.session.id, sequence: state.farm.session.sequence, user: state.farm.user };
  }
  snapshot(payload) {
    if (!payload || typeof payload.raw !== 'string' || payload.raw.length > 2 * 1024 * 1024) return null;
    try { return decode(Uint8Array.from(Buffer.from(payload.raw, 'base64'))).user; } catch (_) { return null; }
  }
  sync(payload) {
    const { state } = this.load();
    const session = state.farm.session;
    if (!session || payload?.id !== session.id || !Number.isSafeInteger(payload.sequence) || payload.sequence <= session.sequence) return false;
    const user = payload.user || this.snapshot(payload);
    if (!validUser(user)) return false;
    state.farm.user = JSON.parse(JSON.stringify(user));
    session.balance = Number(user.wealth); session.sequence = payload.sequence;
    this.companion.writePet({ playroom: state });
    return true;
  }
  close(payload = {}) {
    let { p, state } = this.load();
    if (!state.farm.session || payload.id !== state.farm.session.id) return false;
    this.sync(payload);
    ({ p, state } = this.load());
    const balance = state.farm.session.balance;
    state.farm.session = null;
    if (state.farm.user) state.farm.user.checked = Math.floor(Date.now() / 1000);
    this.companion.writePet({ playroom: state, info: { yb: (Number(p.info.yb) || 0) + balance } });
    return true;
  }
  recover(payload) {
    const { state } = this.load();
    if (!state.farm.session) return false;
    // A stale SOL from another pet/import cannot replace this session's farm.
    const valid = payload?.id === state.farm.session.id;
    return this.close({ ...(valid ? payload : {}), id: state.farm.session.id, sequence: state.farm.session.sequence + 1 });
  }
  view() {
    const { p, state } = this.load();
    return { open: !!state.farm.session, wallet: state.farm.session?.balance || 0, outside: Number(p.info.yb) || 0, started: !!state.farm.user };
  }
}
let instance;
function farm() { return instance ||= new Farm({ companion: companion() }); }
module.exports = { Farm, farm, freshFarm, validUser };
