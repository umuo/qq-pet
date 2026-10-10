const path = require('node:path');
const fs = require('node:fs');
const { companion } = require('../../../service/gameplay/companion');
const GAMES = [
  {dir:'guess',name:'猜动作',help:'点击企鹅开始，记住右侧轮廓，再选择与它动作一致的一项。连续猜对 5 次可获得奖励。'},
  {dir:'paopao2',name:'吹泡泡',help:'点击企鹅开始，再点破吹出的泡泡。'},
  {dir:'rope',name:'跳绳'},
  {dir:'mouse',name:'捉老鼠',help:'点击企鹅开始。老鼠跑近时点击企鹅跳起来，躲过 5 只就能获得奖励。'},
  {dir:'ball',name:'颠球',help:'点击企鹅开始，再点击抛起的球接住它。'},
  {dir:'100ceng',name:'下一百层',kidOnly:true,help:'点击企鹅开始，使用左右方向键移动，继续往下跳。'}
];
class DesktopGames {
  window = null;
  cleate(dir) {
    const game = GAMES.find(g=>g.dir===dir);
    if (!game) return;
    if (this.window && !this.window.isDestroyed()) { this.window.show();this.window.focus();return; }
    const p=getPetInfo();
    if (!companion().usable(p) || p.activeOption.ill || ['work','study','trip'].some(k=>p.activeOption[k]) || +p.maxInfo.level<=4) {
      openSpeak({data:{type:'text',data:'先破壳、恢复健康、完成正在做的事，再陪我玩吧~'},active:'speak'});return;
    }
    const variant=`1${game.kidOnly || +p.maxInfo.level<9 ? 0 : 2}${p.info.sex==='MM'?3:2}`;
    const file=`main_${variant}.swf`;
    if (!fs.existsSync(path.resolve(__dirname,'../../../assets/reference/smallGame',game.dir,file))) {openSpeak({data:{type:'text',data:'游戏资源不完整，暂时无法开始。'},active:'speak'});return;}
    windowsMain.open({name:'desktopGames',loadFile:'popups/desktopGames',default:{width:930,height:740,frame:true,transparent:false,backgroundColor:'#f3f1e4',alwaysOnTop:false,skipTaskbar:false,resizable:true,minWidth:750,minHeight:620},
      created:({vm,preloads,getinfo})=>{
        this.window=vm;vm.setTitle('企鹅 · '+game.name);vm.setOpacity(1);
        let ready=false,finished=false;
        const finish=()=>{if(finished)return;finished=true;const current=getPetInfo();setPetInfo({activeOption:{...current.activeOption,desktopGame:null}});if(ready)companion().desktopRound();};
        const close=()=>{finish();if(!vm.isDestroyed())vm.close();};
        preloads({
          desktopGames_h_event:(event,data)=>{if(event.sender!==vm.webContents || finished)return;
            if(data?.type==='boot')vm.webContents.send('desktopGames_m_boot',{...game,file});
            else if(data?.type==='ready'){ready=true;setPetInfo({activeOption:{...getPetInfo().activeOption,desktopGame:game.dir}});vm.focus();vm.webContents.focus();}
            else if(data?.type==='quit')close();
            else if(data?.type==='failed'){ready=false;openSpeak({data:{type:'text',data:'游戏加载失败，企鹅已回到桌面。请稍后重试。'},active:'speak'});close();}
          },
          desktopGames_h_request:(event,data)=>{if(event.sender!==vm.webContents || finished){event.returnValue=null;return;}
            const pet=getPetInfo();
            // sendSync replies when returnValue is first assigned. Compute the
            // response before replying so Flash receives the actual result.
            let response=null;
            if(data?.type==='feeling')response={feelNow:pet.info.mood,feelTotal:+pet.maxInfo.mood||1000};
            else if(data?.type==='reward' && ready && companion().usable(pet) && !pet.activeOption.ill && !['work','study','trip'].some(k=>pet.activeOption[k]))response=companion().rewardDesktop();
            event.returnValue=response;
          }
        });
        getinfo([{event:'pet',name:'desktopGames',fn:()=>{const pet=getPetInfo();if(!finished && ready && (!companion().usable(pet)||pet.activeOption.ill||['work','study','trip'].some(k=>pet.activeOption[k])))close();}}]);
        vm.webContents.on('render-process-gone',close);vm.on('closed',()=>{finish();this.window=null;});
      }
    }).catch(console.error);
  }
}
module.exports=new DesktopGames();
module.exports.GAMES=GAMES;
