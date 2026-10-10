const { dayKey } = require('./companion');
// Only completed minutes while the game is ready and actively used earn rewards.
class GameSession {
  constructor({ reward, now = () => performance.now(), wallNow = Date.now }) {
    Object.assign(this, { reward, now, wallNow });
    this.last = now(); this.day = dayKey(wallNow()); this.seconds = 0;
    this.ready = false; this.closed = false; this.previousActive = false;
  }
  tick(active) {
    if (this.closed) return;
    const time = this.now();
    const day = dayKey(this.wallNow());
    if (day !== this.day) { this.seconds = 0; this.day = day; }
    // Long gaps (sleep, a suspended process) are not time spent playing.
    const delta = Math.max(0, Math.min(2, (time - this.last) / 1000));
    this.last = time;
    if (this.ready && active && this.previousActive) this.seconds += delta;
    this.previousActive = this.ready && active;
    const minutes = Math.floor(this.seconds / 60);
    if (minutes) { this.seconds -= minutes * 60; this.reward(minutes, this.day); }
  }
  setReady(ready) { this.tick(false); this.ready = ready; this.previousActive = false; }
  close(active = false) { this.tick(active); this.closed = true; }
}
module.exports = { GameSession };
