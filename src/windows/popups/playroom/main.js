const { companion } = require('../../../service/gameplay/companion');
const { travel } = require('../../../service/gameplay/travel');
const { speech } = require('../../../service/gameplay/speech');
const { toys } = require('../../../service/gameplay/toys');
class PlayroomWindow {
  name = 'playroom';
  window = null;
  cleate(tab) {
    if(tab==='travel')return require('../travel/main').cleate();
    if (this.window && !this.window.isDestroyed()) { this.window.show(); this.window.focus(); if (tab) this.window.webContents.send('playroom_m_tab', tab); return; }
    windowsMain.open({
      name: this.name, loadFile: 'popups/playroom',
      default: { width: 540, height: 780, frame: true, transparent: false, backgroundColor: '#f6f3e7', alwaysOnTop: false, skipTaskbar: false, resizable: true, minWidth: 440, minHeight: 450 },
      created: ({ vm, preloads, getinfo }) => {
        this.window = vm;
        vm.setTitle('企鹅 · 陪伴与冒险'); vm.setOpacity(1);
        let messageSequence = 0;
        const sendState = message => {
          if (!vm.isDestroyed()) vm.webContents.send('playroom_m_state', { state: { ...companion().view(), travel: travel().view(), farm: require('../../../service/gameplay/farm').farm().view(), mail:require('../../../service/gameplay/mail').mailbox().view(), toys:toys().view(), backgrounds:require('../../../service/gameplay/backgrounds').backgrounds().view() }, message, tab });
          tab = undefined;
        };
        const send = message => {
          const sequence = ++messageSequence;
          sendState(message);
          if (message) speech().rewrite(message).then(line => {
            if (sequence === messageSequence && line !== message && !vm.isDestroyed()) sendState(line);
          });
        };
        preloads({ playroom_h_action: (event, payload) => {
          if (event.sender !== vm.webContents) return;
          if (payload?.type === 'claim') send(companion().claim(payload.day, payload.id).message);
          else if (payload?.type === 'claimPokeMilestone') send(companion().claimPokeMilestone(payload.day,payload.target).message);
          else if (payload?.type === 'claimTravelMilestone') send(travel().claimMilestone(payload.target).message);
          else if (payload?.type === 'travelWindow') require('../travel/main').cleate();
          else if (payload?.type === 'setting') { companion().setting(payload.faceMode); send(); }
          else if (payload?.type === 'games') require('../smallGame/main').cleate();
          else if (payload?.type === 'farm') require('../farm/main').cleate();
          else if (payload?.type === 'desktopGame') require('../desktopGames/main').cleate(payload.dir);
          else if (payload?.type === 'useBackground') send(require('../../../service/gameplay/backgrounds').backgrounds().use(payload.id).message);
          else if (payload?.type === 'buyToy') send(toys().buy(payload.id).message);
          else if (payload?.type === 'useToy') {
            const result = toys().use(payload.id); send(result.message);
            if (result.ok) speech().say({data:{type:'text',data:result.message},active:'speak'});
          }
          else if (payload?.type === 'travelStart') send(travel().start().message);
          else if (payload?.type === 'travelStop') send(travel().cancel().message);
          else if (payload?.type === 'readCard') { travel().openCard(payload.id); send(); }
          else if (payload?.type === 'claimEncounter') send(travel().claimEncounter(payload.id).message);
          else if (payload?.type === 'readLetter') {require('../../../service/gameplay/mail').mailbox().read(payload.id);send();}
          else if (payload?.type === 'claimLetter') send(require('../../../service/gameplay/mail').mailbox().claim(payload.id).message);
          else send();
        } });
        getinfo([{ event: 'pet', name: 'playroom', fn: () => send() }]);
        const timer = setInterval(() => send(), 10000);
        vm.on('closed', () => { clearInterval(timer); this.window = null; });
      }
    }).catch(console.error);
  }
}
module.exports = new PlayroomWindow();
