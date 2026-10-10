// HTML hit targets keep the pet draggable while Ruffle stays click-through.
window.PetInteractions = class {
  constructor({ root, pose, request, mode }) {
    Object.assign(this, { root, pose, request, mode });
    this.layer = document.createElement('div');
    this.layer.className = 'pet-interactions';
    root.appendChild(this.layer);
    this.hovered = false;
    this.down = null;
    this.onEnter = () => { this.hovered = true; this.schedule(); };
    this.onLeave = () => { this.hovered = false; this.clear(); };
    this.onDown = event => {
      if (event.button !== 0) { this.clear(); return; }
      this.down = { x: event.screenX, y: event.screenY, clientX: event.clientX, clientY: event.clientY, target: event.target.closest('[data-pet-spot]'), moved: false };
      if (!this.down.target) this.clear();
    };
    this.onMove = event => {
      if (this.down && Math.max(Math.hypot(event.screenX - this.down.x, event.screenY - this.down.y), Math.hypot(event.clientX - this.down.clientX, event.clientY - this.down.clientY)) >= 4) this.down.moved = true;
    };
    this.onUp = event => {
      const down = this.down;
      this.down = null;
      if (event.button === 0 && down?.target && !down.moved && down.target.contains(event.target) && this.pose()) {
        const key = down.target.dataset.petSpot;
        this.clear();
        this.request({ ...this.pose(), key });
      }
      if (this.hovered) this.schedule();
    };
    root.addEventListener('mouseenter', this.onEnter);
    root.addEventListener('mouseleave', this.onLeave);
    root.addEventListener('mousedown', this.onDown);
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
  }
  clear() { clearTimeout(this.timer); this.layer.replaceChildren(); }
  schedule() {
    this.clear();
    if (!this.hovered || this.down || !this.mode()) return;
    this.timer = setTimeout(() => this.show(), 300);
  }
  show() {
    const pose = this.pose();
    if (!pose || !this.mode() || this.down) return;
    this.layer.classList.toggle('show-hints', this.mode() === 2);
    this.layer.replaceChildren(...Object.entries(PetFaceData.points(pose)).map(([key, point]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.petSpot = key;
      button.className = 'pet-spot';
      button.style.left = point.left;
      button.style.top = point.top;
      button.title = ({ H: '摸摸头', M: '戳戳肚子', BE: '逗逗我', LE: '碰左眼', RE: '碰右眼', LH: '碰碰左手', RH: '碰碰右手', LF: '碰碰左脚', RF: '碰碰右脚' })[key] || '逗逗企鹅';
      button.setAttribute('aria-label', button.title);
      return button;
    }));
  }
  destroy() {
    this.clear(); this.layer.remove();
    this.root.removeEventListener('mouseenter', this.onEnter);
    this.root.removeEventListener('mouseleave', this.onLeave);
    this.root.removeEventListener('mousedown', this.onDown);
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
  }
};
void 0;
