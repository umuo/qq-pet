Vue.createApp({
  data: () => ({ state: null, message: '', tab: 'tasks', cardId: null, letterId:null, photoId: null }),
  mounted() {
    window.electronAPI.onPlayroomState(({ state, message, tab }) => { this.state = state; if (message) this.message = message; if (tab) this.tab = tab; });
    window.electronAPI.onPlayroomTab(tab => { this.tab = tab; });
    window.electronAPI.playroomAction({ type: 'view' });
  },
  computed: {
    card() { return this.state?.travel.postcards.find(c => c.id === this.cardId); },
    visited() { return Object.keys(this.state?.travel.visits || {}).length; },
    photo() { return this.state?.travel.photos.find(p => p.id === this.photoId); },
    letter() {return this.state?.mail.letters.find(l=>l.id===this.letterId);}
  },
  methods: {
    travelWindow() { window.electronAPI.playroomAction({ type: 'travelWindow' }); },
    claim(task) { window.electronAPI.playroomAction({ type: 'claim', day: this.state.daily.day, id: task.id }); },
    claimPokeMilestone(task) { window.electronAPI.playroomAction({type:'claimPokeMilestone',day:this.state.daily.day,target:task.target}); },
    claimMilestone(task) { window.electronAPI.playroomAction({type:'claimTravelMilestone',target:task.target}); },
    setting(event) { window.electronAPI.playroomAction({ type: 'setting', faceMode: Number(event.target.value) }); },
    games() { window.electronAPI.playroomAction({ type: 'games' }); },
    farm() { window.electronAPI.playroomAction({ type: 'farm' }); },
    desktopGame(dir) { window.electronAPI.playroomAction({ type: 'desktopGame', dir }); },
    useBackground(id) { window.electronAPI.playroomAction({type:'useBackground',id}); },
    buyToy(id) { window.electronAPI.playroomAction({ type: 'buyToy', id }); },
    useToy(id) { window.electronAPI.playroomAction({ type: 'useToy', id }); },
    startTravel() { window.electronAPI.playroomAction({ type: 'travelStart' }); },
    stopTravel() { window.electronAPI.playroomAction({ type: 'travelStop' }); },
    openCard(card) { this.cardId = card.id; window.electronAPI.playroomAction({ type: 'readCard', id: card.id }); },
    encounter(card) { window.electronAPI.playroomAction({ type: 'claimEncounter', id: card.id }); },
    openLetter(letter) {this.letterId=letter.id;window.electronAPI.playroomAction({type:'readLetter',id:letter.id});},
    claimLetter(letter) {window.electronAPI.playroomAction({type:'claimLetter',id:letter.id});},
    photoUrl(id) { return '../assets/reference/album/' + id + '.webp'; }
  }
}).mount('#app');
// executeJavaScript must not try to serialize Vue's reactive component proxy.
void 0;
