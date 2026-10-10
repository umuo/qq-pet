const {travel}=require('../../../service/gameplay/travel');
const {speech}=require('../../../service/gameplay/speech');
const {dialog}=require('electron');
class TravelWindow {
  window=null;
  cleate(){
    if(this.window&&!this.window.isDestroyed()){this.window.show();this.window.focus();return;}
    windowsMain.open({name:'travel',loadFile:'popups/travel',default:{width:650,height:570,transparent:true,frame:false,resizable:false,skipTaskbar:false},created:({vm,preloads,getinfo})=>{
      this.window=vm;vm.setTitle('企鹅 · 旅游');vm.setOpacity(1);
      const send=message=>{if(!vm.isDestroyed())vm.webContents.send('travel_m_state',{state:travel().view(),vip:!!getPetInfo().otherOptions?.pinkDiamond,message});};
      let confirming=false;
      const finish=async expectedTours=>{
        if(confirming)return;
        confirming=true;
        try{
          const result=await dialog.showMessageBox(vm,{type:'question',title:'完成旅游成就',message:'确认花费 8888 元宝完成旅游成就吗？',detail:'地图点亮记录将重新开始，完成次数增加一次。照片、明信片和纪念品会保留。',buttons:['取消','完成旅游成就'],defaultId:0,cancelId:0,noLink:true});
          if(vm.isDestroyed()||result.response!==1)return;
          send(travel().finishTour(expectedTours).message);
        }catch(_){send('暂时无法打开确认窗口，请稍后再试。');}finally{confirming=false;}
      };
      preloads({travel_h_action:(event,payload)=>{
        if(event.sender!==vm.webContents)return;
        if(payload?.type==='close'){vm.close();return;}
        if(payload?.type==='finishTour'){void finish(payload.tours);return;}
        if(payload?.type==='start'||payload?.type==='stop'){
          const result=payload.type==='start'?travel().start():travel().cancel();send(result.message);
          if(result.ok)speech().say({data:{type:'text',data:result.message},active:'speak'});
        }else send();
      }});
      getinfo([{event:'pet',name:'travel-window',fn:()=>send()}]);
      const timer=setInterval(()=>send(),1000);vm.on('closed',()=>{clearInterval(timer);this.window=null;});
    }}).catch(console.error);
  }
}
module.exports=new TravelWindow();
