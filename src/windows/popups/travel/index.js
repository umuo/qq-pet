// Travel layout adapted from qqpet ui/travel.ts and ui/box.ts (6e2c8bf, GPL-3.0).
Vue.createApp({
  data:()=>({state:null,vip:false,tab:'map',message:'',photo:null}),
  mounted(){window.electronAPI.onTravelState(payload=>{this.state=payload.state;this.vip=payload.vip;if(payload.message)this.message=payload.message;});this.action('view');},
  computed:{
    visited(){return Object.keys(this.state?.visits||{}).length;},
    skin(){return this.vip?'vip':'normal';},
    head(){return this.vip?['Q_01.svg','Q_02.svg','Q_03.svg']:['beijing1.svg','beijing2.svg','beijing3.svg'];},
    foot(){return this.vip?['Q_07.svg','Q_08.svg','Q_09.svg']:['beijing6.svg','beijing7.svg','beijing8.svg'];},
    elapsed(){return Math.floor(((this.state?.session?.durationMs||0)-(this.state?.session?.remainingMs||0))/60000);}
  },
  methods:{action(type){window.electronAPI.travelAction({type,tours:this.state?.tours});},frame(file){return '../assets/reference/windowTip/'+this.skin+'/'+file;},photoUrl(id){return '../assets/reference/album/'+id+'.webp';}}
}).mount('#app');void 0;
