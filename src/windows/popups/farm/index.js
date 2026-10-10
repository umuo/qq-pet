Vue.createApp({
  data: () => ({ ready: false, started: false, message: '正在打开农场…', wallet: { wallet: 0, outside: 0 }, id: null, sequence: 0, player: null, timer: null, lastRaw: null }),
  mounted() {
    window.electronAPI.onFarmWallet(value => { this.wallet = value; });
    window.electronAPI.onFarmBoot(result => this.boot(result));
    window.captureFarm = () => {
      clearInterval(this.timer); this.player?.ruffle().suspend();
      return { raw: localStorage.getItem(PetSol.storageKey()), id: this.id, sequence: ++this.sequence };
    };
    window.electronAPI.farmEvent({ type: 'ready' });
  },
  methods: {
    async boot(result) {
      if (this.started) return;
      if (!result.ok) { this.message = result.message; return; }
      this.started = true; this.id = result.id; this.sequence = result.sequence;
      localStorage.setItem('qqpet:farm-session', this.id);
      PetSol.writeSol(PetSol.storageKey(), 'test', { user: result.user });
      try {
        const player = RufflePlayer.newest().createPlayer(); player.id = 'farmPlayer'; this.player = Vue.markRaw(player);
        document.getElementById('farm-stage').appendChild(player);
        await player.ruffle().load({ url: new URL('../assets/reference/qqfarm/Farm.swf', document.baseURI).href, base: new URL('../assets/reference/qqfarm/', document.baseURI).href, allowScriptAccess: true, autoplay: 'on', contextMenu: 'off', splashScreen: false, unmuteOverlay: 'hidden', fontSources: [new URL('../assets/reference/qqfont.ttf', document.baseURI).href], defaultFonts: { sans: ['HappyZcool-2016'], serif: ['HappyZcool-2016'], typewriter: ['HappyZcool-2016'] } });
        const deadline = Date.now() + 15000;
        while (typeof player.farmAll !== 'function') { if (Date.now() > deadline) throw Error('农场界面加载超时'); await new Promise(r => setTimeout(r, 50)); }
        this.ready = true; this.message = '去商店买种子，背上小包来播种吧。';
        this.sync(); this.timer = setInterval(() => this.sync(), 250);
      } catch (error) {
        this.message = '农场加载失败，元宝已归还。请关闭后重新打开。';
        window.electronAPI.farmEvent({ type: 'failed' });
        console.error(error);
      }
    },
    sync() {
      const raw = localStorage.getItem(PetSol.storageKey());
      if (raw === this.lastRaw) return;
      this.lastRaw = raw;
      window.electronAPI.farmEvent({ type: 'sync', id: this.id, sequence: ++this.sequence, raw });
    },
    action(name) {
      if (!this.ready) return;
      try { this.message = this.player.farmAll(name) || '农场操作完成。'; this.sync(); }
      catch (error) { this.message = '这次操作没有完成，请稍后再试。'; console.error(error); }
    },
    close() { window.electronAPI.farmEvent({ type: 'close' }); }
  }
}).mount('#app');
void 0;
