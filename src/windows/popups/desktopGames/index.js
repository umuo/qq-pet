// Adapted from AnkioTomas/qqpet ui/smallgame.ts, snapshot 6e2c8bf (GPL-3.0).
(() => {
  const stage=document.getElementById('game-stage');
  const wins=new Map(),inCall=new Set();let root=null,dir='',top=50,ending=false;
  const status=s=>document.getElementById('game-status').textContent=s;
  const place=w=>Object.assign(w.box.style,{left:w.x+'px',top:w.y+'px',width:w.w+'px',height:w.h+'px'});
  const guard=(w,f)=>(...args)=>{inCall.add(w);try{return f(...args);}finally{inCall.delete(w);}};
  function call(w,fn,args) {
    if(!w?.player || wins.get(w.name)!==w)return;
    if(inCall.has(w))return void setTimeout(()=>call(w,fn,args));
    try{return w.player.ruffle().callExternalInterface(fn,...args);}catch(error){console.error('Game callback',fn,error);}
  }
  function destroy(w) {
    if(!w || wins.get(w.name)!==w)return;
    for(const child of [...wins.values()])if(child.parent===w)destroy(child);
    wins.delete(w.name);setTimeout(()=>w.box.remove());
    if(w===root)finish();
  }
  function finish() {if(ending)return;ending=true;window.electronAPI.desktopEvent({type:'quit'});}
  function api(self) {
    const of=n=>n?wins.get(n):self;
    const move=(w,x,y)=>{if(!w)return 0;w.x=Number(x);w.y=Number(y);place(w);return 1;};
    const methods={
      IsVisible:n=>+(!!of(n)&&!of(n).box.hidden),IsEnableDrag:n=>+(!!of(n)?.drag),
      EnableDrag:(on,n)=>{if(!of(n))return 0;of(n).drag=on===1;return 1;},
      DestroyWindow:n=>{destroy(of(n));return 1;},
      ResizeWindow:(width,height,n)=>{if(!of(n))return 0;Object.assign(of(n),{w:Number(width),h:Number(height)});place(of(n));return 1;},
      MoveTo:(x,y,n)=>move(of(n),x,y),MoveBy:(x,y,n)=>of(n)?move(of(n),of(n).x+Number(x),of(n).y+Number(y)):0,
      GetWindowRect:n=>of(n)?`${of(n).x},${of(n).y},${of(n).w},${of(n).h}`:'0,0,0,0',GetWindowPosition:()=>`${self.x},${self.y}`,
      GetScalable:()=>1,SetScalable:()=>1,
      CreateWindow:(name,x,y,w,h,hidden,swf)=>{if(wins.has(name))destroy(wins.get(name));const child=open(name,self,swf,x,y,w,h);if(child)child.box.hidden=hidden===1;return child?1:0;},
      GetWindowName:opt=>opt===0?self.name:opt===-1?(self.parent?.name||''):[...wins.values()].filter(w=>w.parent===self).map(w=>w.name),
      SetWindow:(op,n)=>{if(op==='topmost'&&of(n))of(n).box.style.zIndex=String(++top);},
      Show:(cmd,n)=>{if(!of(n))return 0;of(n).box.hidden=cmd===0;return 1;},
      GetCursorPosition:()=>`${cursor.x},${cursor.y},0`,GetScreenWidth:()=>stage.clientWidth,GetScreenHeight:()=>stage.clientHeight,
      RemoteCall:(name,fn,...args)=>call(wins.get(name),fn,args)
    };
    return Object.fromEntries(Object.entries(methods).map(([name,f])=>[name,guard(self,f)]));
  }
  const cursor={x:0,y:0};
  function inputs(w,doc) {
    let drag=null;
    doc.addEventListener('pointerdown',e=>{
      const canvas=w.player?.shadowRoot?.querySelector('canvas');
      if(canvas){canvas.tabIndex=0;canvas.focus();}
      if(w.drag&&e.button===0)drag={x:e.screenX,y:e.screenY};
    },true);
    doc.addEventListener('pointermove',e=>{cursor.x=w.x+e.clientX;cursor.y=w.y+e.clientY;if(!drag)return;w.x+=e.screenX-drag.x;w.y+=e.screenY-drag.y;drag={x:e.screenX,y:e.screenY};place(w);call(w,'APIEvent.OnWindowMove',[w.x,w.y,w.w,w.h]);},true);
    for(const name of ['pointerup','pointercancel'])doc.addEventListener(name,()=>{drag=null;},true);
    doc.defaultView.addEventListener('blur',()=>{drag=null;});
  }
  function open(name,parent,swf,x,y,w,h) {
    // Only files in this game's resource folder may be loaded by an SWF.
    if(typeof swf!=='string'||!/^[-\w]+\.swf$/i.test(swf)){console.error('Invalid game resource',swf);return null;}
    const box=document.createElement('div');box.className='desktopGameWin';box.dataset.name=name;
    box.classList.toggle('passive',/^(prompt_(money|mood|timer)|status_count|shadow|player_|rat\.)/.test(swf));
    const frame=document.createElement('iframe');box.appendChild(frame);
    const win={name,parent,box,frame,x:Number(x),y:Number(y),w:Number(w),h:Number(h),drag:false,player:null};wins.set(name,win);place(win);stage.appendChild(box);
    frame.addEventListener('load',async()=>{
      if(wins.get(name)!==win)return;
      const target=frame.contentWindow,doc=target.document;
      Object.assign(target,{API:api(win),TICKLE_GetFeeling:guard(win,()=>window.electronAPI.desktopRequest({type:'feeling'})),TICKLE_SendAction:guard(win,()=>{const reward=window.electronAPI.desktopRequest({type:'reward'});if(reward){status(`好开心！心情 +${reward.mood} · 元宝 +${reward.yb}`);call(win,'TICKLE_OnResult',[reward.mood,reward.yb]);}})});
      window.__qqPetInstallHandCursor?.(target);inputs(win,doc);
      try {
        const player=target.RufflePlayer.newest().createPlayer();win.player=player;doc.body.appendChild(player);
        player.ruffle().addFSCommandHandler(command=>{if(command==='quit')destroy(root);});
        await player.ruffle().load({url:new URL(`../assets/reference/smallGame/${dir}/${swf}`,document.baseURI).href,base:new URL(`../assets/reference/smallGame/${dir}/`,document.baseURI).href,allowScriptAccess:true,autoplay:'on',splashScreen:false,unmuteOverlay:'hidden',contextMenu:'off',wmode:'transparent',letterbox:'off',backgroundColor:null});
        // load() can resolve before Ruffle initializes the movie. Do not enable
        // native input or game rewards while the main stage is still blank.
        const deadline=performance.now()+20000;
        // Guess's main_*.swf is only a loader. Its metadata can be ready before
        // game_*.swf initializes the actual game and registers its callbacks.
        while(!player.ruffle().metadata||(win===root&&dir==='guess'&&typeof player['Main.onActionClick']!=='function')){
          if(ending||wins.get(name)!==win)return;
          if(performance.now()>=deadline)throw Error('Desktop game initialization timeout');
          await new Promise(resolve=>setTimeout(resolve,50));
        }
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        if(win===root && !ending){window.electronAPI.desktopEvent({type:'ready'});status('点击企鹅开始，陪它玩一局吧。');frame.focus();player.focus();}
      }catch(error){console.error('Desktop game load',error);status('游戏加载失败，请回到企鹅后重试。');window.electronAPI.desktopEvent({type:'failed'});}
    },{once:true});
    const script=new URL('./js/ruffle/ruffle.js',document.baseURI).href;
    frame.srcdoc=`<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}ruffle-player{width:100%;height:100%;pointer-events:auto!important}</style><script>window.RufflePlayer={config:{autoplay:'on',splashScreen:false,unmuteOverlay:'hidden',allowScriptAccess:true}};<\/script><script src="${script}"><\/script></head><body></body></html>`;
    return win;
  }
  document.getElementById('game-quit').onclick=finish;
  stage.addEventListener('pointermove',e=>{const rect=stage.getBoundingClientRect();cursor.x=e.clientX-rect.x;cursor.y=e.clientY-rect.y;});
  window.electronAPI.onDesktopBoot(game=>{if(root)return;dir=game.dir;document.getElementById('game-name').textContent=game.name;document.getElementById('game-help').textContent=game.help||'点击企鹅开始，和它一起玩一局吧。';root=open('main',null,game.file,Math.round((stage.clientWidth-140)/2),stage.clientHeight-160,140,140);});
  window.electronAPI.desktopEvent({type:'boot'});
  // Keep this diagnostic handle read-only to the parent test harness.
  window.desktopGameView={wins,call};
})();
void 0;
