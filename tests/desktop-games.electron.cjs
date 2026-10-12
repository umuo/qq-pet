// Real original desktop SWFs, temporary browser data and an in-memory pet.
const {app,BrowserWindow,nativeImage}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-desktop-games-'));
app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});
global.$Store={setItem(){}};require('../src/ini/pet');global.openSpeak=()=>{};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<150;i++){if(await fn())return;await delay(100);}throw Error('Desktop game timeout');}
const sex=process.env.QQPET_TEST_SEX||'GG',level=Number(process.env.QQPET_TEST_LEVEL||20);assert.ok(['GG','MM'].includes(sex));assert.ok([6,20].includes(level));
const timeout=setTimeout(()=>app.exit(2),120000);
// Compare the displayed penguin outline with the three yellow silhouettes.
// This reads rendered pixels; it does not inspect or change Flash's answer.
function silhouette(image,choice=false){
 const size=image.getSize(),pixels=image.toBitmap(),scale=Math.sqrt(pixels.length/(size.width*size.height*4)),width=Math.round(size.width*scale),height=Math.round(size.height*scale),mask=new Uint8Array(width*height),bgIndex=(Math.floor(height*.15)*width+Math.floor(width*.08))*4,bg=[pixels[bgIndex+2],pixels[bgIndex+1],pixels[bgIndex]];
 let left=width,right=0,top=height,bottom=0;
 for(let y=Math.floor(height*(choice ? .12 : .30));y<height*(choice ? .97 : .92);y++)for(let x=Math.floor(width*.04);x<width*.96;x++){
  const i=(y*width+x)*4,r=pixels[i+2],g=pixels[i+1],b=pixels[i];
  const hit=choice?Math.max(r,b)>225&&g>120&&g<230&&Math.min(r,b)<110:Math.hypot(r-bg[0],g-bg[1],b-bg[2])>65;
  if(hit){mask[y*width+x]=1;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(choice){
  // Keep the silhouette itself, excluding disconnected button highlights.
  const seen=new Uint8Array(mask.length);let largest=[];
  for(let start=0;start<mask.length;start++)if(mask[start]&&!seen[start]){
   const component=[start];seen[start]=1;
   for(let i=0;i<component.length;i++){
    const at=component[i],x=at%width;
    for(const next of [x>0?at-1:-1,x<width-1?at+1:-1,at-width,at+width])if(next>=0&&next<mask.length&&mask[next]&&!seen[next]){seen[next]=1;component.push(next);}
   }
   if(component.length>largest.length)largest=component;
  }
  mask.fill(0);left=width;right=0;top=height;bottom=0;
  for(const at of largest){mask[at]=1;const x=at%width,y=Math.floor(at/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(right<=left||bottom<=top)return null;
 const normalized=[];for(let y=0;y<40;y++)for(let x=0;x<40;x++)normalized.push(mask[Math.round(top+(bottom-top)*y/39)*width+Math.round(left+(right-left)*x/39)]);
 normalized.area=mask.reduce((sum,hit)=>sum+hit,0);return normalized;
}
function outlineScore(a,b){let overlap=0,union=0;for(let i=0;i<a.length;i++){if(a[i]&&b[i])overlap++;if(a[i]||b[i])union++;}return overlap/union;}
app.whenReady().then(async()=>{
  global.windowsMain=new(require('../src/windows/window'))();const open=windowsMain.open.bind(windowsMain);
  const errors=[],requested=new Map();windowsMain.open=option=>{option.default.show=false;option.default.webPreferences={offscreen:true,backgroundThrottling:false};const created=option.created;option.created=value=>{const urls=[];requested.set(value.vm,urls);value.vm.webContents.debugger.attach('1.3');value.vm.webContents.debugger.on('message',(_event,method,params)=>{if(method==='Network.requestWillBeSent')urls.push(params.request.url);});value.vm.webContents.debugger.sendCommand('Network.enable').catch(error=>errors.push(error.message));value.vm.webContents.on('console-message',event=>{if(event.message.startsWith('GUESS_RESULT'))console.log(event.message);if(event.level==='error'||event.level>=3){errors.push(event.message);console.log(event.message);}});return created(value);};return open(option);};
  setPetInfo({info:{name:'企鹅',host:'测试',sex,growth:level===6?1000:40000,health:5,yb:300,mood:850,hunger:2000,clean:2000},maxInfo:{level,hunger:4000,clean:4000}});
  const view=require('../src/windows/popups/desktopGames/main');
  for(const game of view.GAMES.filter(g=>!process.env.QQPET_TEST_GAME||g.dir===process.env.QQPET_TEST_GAME)){
    view.cleate(game.dir);await until(async()=>{if(view.window) {const message=await view.window.webContents.executeJavaScript("document.getElementById('game-status')?.textContent");if(message?.includes('失败'))throw Error(message+' '+JSON.stringify(errors));}return view.window && getPetInfo().activeOption.desktopGame===game.dir;});
    const win=view.window;await delay(1500);
    assert.deepEqual(await win.webContents.executeJavaScript("desktopGameView.wins.get('main').frame.contentWindow.TICKLE_GetFeeling()"),{feelNow:Number(getPetInfo().info.mood),feelTotal:1000},'Flash receives the actual synchronous feeling response');
    if(process.env.QQPET_TEST_BUBBLE_REWARD)await until(()=>win.webContents.executeJavaScript("typeof desktopGameView.wins.get('main')?.player?.['Main.onMouseDownBubble']==='function'"));
    const variant=`1${game.kidOnly||level<9?0:2}${sex==='MM'?3:2}`;assert.ok(requested.get(win).some(url=>url.endsWith('/'+game.dir+'/main_'+variant+'.swf')),'actual SWF request must match '+sex+'/'+level+'/'+game.dir+'/main_'+variant);
    if(process.env.QQPET_TEST_GUESS_REWARD)await win.webContents.executeJavaScript("(()=>{const api=desktopGameView.wins.get('main').frame.contentWindow.API,remote=api.RemoteCall;window.guessEvents=[];api.RemoteCall=(name,fn,...args)=>{guessEvents.push({name,fn,args});if(fn==='Action.onResultShow'||fn.startsWith('CountStatus.'))console.log('GUESS_RESULT',JSON.stringify({name,fn,args}));return remote(name,fn,...args);};})()");
    if(process.env.QQPET_TEST_ROPE_REWARD)await win.webContents.executeJavaScript("(()=>{const frame=desktopGameView.wins.get('main').frame.contentWindow,get=frame.TICKLE_GetFeeling,api=frame.API,remote=api.RemoteCall;window.ropeStart=0;window.ropeCounts=[];frame.TICKLE_GetFeeling=(...args)=>{ropeStart=Date.now();return get(...args)};api.RemoteCall=(name,fn,...args)=>{if(fn==='CountStatus.onCountUpdate')ropeCounts.push(args[0]);return remote(name,fn,...args)};})()");
    // Hit the ball game's body: the footer can be transparent for the GG kid.
    let point=await win.webContents.executeJavaScript(`(()=>{const r=document.querySelector('[data-name=main]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(${['ball','paopao2','mouse'].includes(game.dir)?'r.y+95':'r.bottom-25'})}})()`);
    for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(100);}
    await delay(process.env.QQPET_TEST_MOUSE_REWARD||process.env.QQPET_TEST_ROPE_REWARD?100:1500);
    if(process.env.QQPET_TEST_ROPE_REWARD){
      assert.equal(game.dir,'rope');const before=Number(getPetInfo().info.yb);
      // Wait for the original game to start, then watch its visible rope phase.
      for(let i=0;i<20&&!await win.webContents.executeJavaScript('!!ropeStart');i++){
        point=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('[data-name=main]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+95)}})()");
        for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(1);}
        await delay(50);
      }
      const started=await win.webContents.executeJavaScript('ropeStart');assert.ok(started,'native body click starts actual rope animation');
      let lastJump=0,jumps=0;
      for(let i=0;i<150&&!win.isDestroyed()&&Number(getPetInfo().info.yb)===before;i++){
        const rect=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('[data-name=main]').getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}})()");
        const shot=nativeImage.createFromBuffer((await win.webContents.capturePage()).toPNG()),factor=shot.getSize().width/await win.webContents.executeJavaScript('window.innerWidth');
        const crop=shot.crop(Object.fromEntries(Object.entries(rect).map(([k,v])=>[k,Math.round(v*factor)]))),size=crop.getSize(),pixels=crop.toBitmap();let pink=0;
        // The original rope turns pink as it passes in front of the pet.
        // Observe those rendered pixels rather than guessing the random cycle.
        for(let y=Math.floor(size.height*.3);y<size.height*.97;y++)for(let x=Math.floor(size.width*.1);x<size.width*.9;x++){
          const at=(y*size.width+x)*4,r=pixels[at],g=pixels[at+1],b=pixels[at+2];
          if((x<size.width*.3||x>size.width*.7)&&Math.max(r,b)>235&&Math.min(r,b)>40&&Math.min(r,b)<140&&g<110)pink++;
        }
        if(pink>15&&Date.now()-lastJump>700){
          fs.writeFileSync(path.join(temp,`rope-jump-${jumps}.png`),crop.toPNG());
          point={x:rect.x+Math.round(rect.width/2),y:rect.y+115};
          for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(1);}
          lastJump=Date.now();jumps++;await delay(30);
          console.log('Rope native visual jump',JSON.stringify({jumps,pink,elapsed:Date.now()-started,counts:await win.webContents.executeJavaScript('ropeCounts')}));
        }
        await delay(20);
      }
      await until(()=>Number(getPetInfo().info.yb)>before||win.isDestroyed());
      assert.deepEqual(await win.webContents.executeJavaScript('ropeCounts'),[1,2,3,4,5],'original rope callback reports five actual jumps');
      await until(()=>win.webContents.executeJavaScript("document.getElementById('game-status').textContent.includes('元宝 +1')"));
      await delay(300);fs.writeFileSync(path.join(temp,'rope-score.png'),(await win.webContents.capturePage()).toPNG());
      console.log('Rope native reward',JSON.stringify({before,after:getPetInfo().info.yb,screenshots:temp}));
      assert.equal(Number(getPetInfo().info.yb),before+1);assert.equal(getPetInfo().info.mood,905);
    }
    if(game.dir==='ball')assert.ok(await win.webContents.executeJavaScript("desktopGameView.wins.has('WND_NAME_BALL')"),'native body click starts the ball game before its idle quit timer');
    if(process.env.QQPET_TEST_GUESS_REWARD){
      assert.equal(game.dir,'guess');const before=Number(getPetInfo().info.yb);let selections=0,lastRound='';const remembered=new Map(),roundSeen=new Map();
      for(let i=0;i<500&&!win.isDestroyed()&&Number(getPetInfo().info.yb)===before;i++){
        const info=await win.webContents.executeJavaScript("(()=>{const events=guessEvents.map((e,i)=>({...e,i})),latest=events.filter(e=>e.fn==='Action.onSetClickable'&&e.args[0]===true).at(-1),active=latest&&!events.slice(latest.i+1).some(e=>e.fn==='Action.onSetClickable'&&e.args[0]===false);const rect=w=>{const r=w.box.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};return {round:active?String(latest.i):null,main:rect(desktopGameView.wins.get('main')),choices:Array.from(desktopGameView.wins.values()).filter(w=>w.name.startsWith('WND_NAME_ACTION_')).map(w=>({name:w.name,rect:rect(w),show:events.filter(e=>e.name===w.name&&e.fn==='Action.onActionShow').at(-1)?.i??-1}))};})()");
        if(info.choices.length===3){
          const screen=nativeImage.createFromBuffer((await win.webContents.capturePage()).toPNG()),viewport=await win.webContents.executeJavaScript('window.innerWidth'),factor=screen.getSize().width/viewport;
          const crop=rect=>screen.crop(Object.fromEntries(Object.entries(rect).map(([key,value])=>[key,Math.round(value*factor)])));
          for(const choice of info.choices){
            let memo=remembered.get(choice.name);
            if(!memo||memo.show!==choice.show){memo={show:choice.show,seen:Date.now(),mask:null};remembered.set(choice.name,memo);}
            const mask=silhouette(crop(choice.rect),true);
            if(choice.show>=0&&Date.now()-memo.seen>=150&&mask&&(!memo.mask||mask.area>=memo.mask.area)){
              memo.mask=mask;fs.writeFileSync(path.join(temp,`guess-memory-${choice.show}-${choice.name}.png`),crop(choice.rect).toPNG());
            }
          }
          if(info.round&&!roundSeen.has(info.round))roundSeen.set(info.round,Date.now());
          const main=info.round?silhouette(crop(info.main)):null;
          if(info.round&&info.round!==lastRound&&Date.now()-roundSeen.get(info.round)>=150&&main&&info.choices.every(choice=>remembered.get(choice.name)?.mask)){
            const scores=info.choices.map(choice=>({...choice,score:outlineScore(main,remembered.get(choice.name).mask)})).sort((a,b)=>b.score-a.score),chosen=scores[0];
            console.log('Guess visual selection',JSON.stringify({round:info.round,scores:scores.map(({name,score})=>({name,score})),chosen:chosen.name}));
            fs.writeFileSync(path.join(temp,`guess-round-${selections}.png`),screen.toPNG());
            for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,x:chosen.rect.x+Math.round(chosen.rect.width/2),y:chosen.rect.y+Math.round(chosen.rect.height/2),button:'left',clickCount:1});await delay(10);}
            lastRound=info.round;selections++;
          }
        }
        await delay(100);
      }
      console.log('Guess native visual reward',JSON.stringify({selections,before,after:getPetInfo().info.yb,destroyed:win.isDestroyed(),screenshots:temp}));
      assert.equal(Number(getPetInfo().info.yb),before+1,'five correct visual choices trigger the original reward');assert.equal(getPetInfo().info.mood,905);
    }else if(process.env.QQPET_TEST_MOUSE_REWARD){
      assert.equal(game.dir,'mouse');const before=Number(getPetInfo().info.yb);let clicks=0;const rats=new Set(),jumped=new Set();
      const rootX=await win.webContents.executeJavaScript("desktopGameView.wins.get('main').x");
      for(let i=0;i<1400&&!win.isDestroyed()&&Number(getPetInfo().info.yb)===before;i++){
        const observed=await win.webContents.executeJavaScript("Array.from(desktopGameView.wins.values()).filter(w=>w.name.startsWith('WND_NAME_RAT_')).map(w=>({name:w.name,x:w.x,y:w.y}))");
        observed.forEach(rat=>rats.add(rat.name));if(i%40===0)console.log('Mouse native observation',JSON.stringify({i,observed}));
        const incoming=observed.find(rat=>!jumped.has(rat.name)&&rat.x<rootX+220&&rat.x>rootX+170);
        if(incoming||(!rats.size&&i%10===0)){
          for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(1);}clicks++;
          if(incoming){jumped.add(incoming.name);console.log('Mouse timed jump',JSON.stringify({rat:incoming,rootX}));}
        }
        await delay(20);
      }
      if(!win.isDestroyed()&&Number(getPetInfo().info.yb)>before){
        await until(()=>win.webContents.executeJavaScript("document.getElementById('game-status').textContent.includes('元宝 +1')"));
        await delay(300);
      }
      if(!win.isDestroyed())fs.writeFileSync(path.join(temp,'mouse-score.png'),(await win.webContents.capturePage()).toPNG());
      console.log('Mouse native jump reward',JSON.stringify({clicks,rats:[...rats],destroyed:win.isDestroyed(),before,after:getPetInfo().info.yb,screenshots:temp}));
      assert.equal(Number(getPetInfo().info.yb),before+1,'native jumps avoid five actual rats and trigger the first reward');assert.equal(getPetInfo().info.mood,905);
    }else if(process.env.QQPET_TEST_BUBBLE_REWARD){
      assert.equal(game.dir,'paopao2');const before=Number(getPetInfo().info.yb);let clicks=0;
      console.log('Bubble main state',await win.webContents.executeJavaScript("JSON.stringify(Array.from(desktopGameView.wins.values(),w=>({name:w.name,hidden:w.box.hidden,meta:w.player?.ruffle().metadata,callbacks:Object.getOwnPropertyNames(w.player||{}).filter(k=>k.includes('.')||k.includes('Main'))})))"));
      console.log('Bubble resource requests',JSON.stringify(requested.get(win).filter(url=>url.includes('/smallGame/'))));fs.writeFileSync(path.join(temp,'bubble-start.png'),(await win.webContents.capturePage()).toPNG());

      for(let i=0;i<200&&Number(getPetInfo().info.yb)===before&&!win.isDestroyed();i++){
        const bubbles=await win.webContents.executeJavaScript("Array.from(desktopGameView.wins.values()).filter(w=>w.name!=='main'&&/Bubble[^/]*\\.swf/i.test(w.player?.ruffle().loadedConfig?.url||'')&&!w.box.hidden).map(w=>{const r=w.box.getBoundingClientRect();return {name:w.name,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),width:r.width,height:r.height}})");
        if(i%20===0)console.log('Bubble observation',JSON.stringify({i,bubbles,names:await win.webContents.executeJavaScript("Array.from(desktopGameView.wins.keys())")}));
        if(!bubbles.length&&i%10===0&&await win.webContents.executeJavaScript("desktopGameView.wins.size===1")){
          for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(100);}
        }
        for(const bubble of bubbles){for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,x:bubble.x,y:bubble.y,button:'left',clickCount:1});await delay(30);}clicks++;}
        await delay(120);
      }
      console.log('Bubble native clicks/reward',JSON.stringify({clicks,before,after:getPetInfo().info.yb}));
      assert.equal(Number(getPetInfo().info.yb),before+1,'real bubble clicks trigger first reward');assert.equal(getPetInfo().info.mood,905);
    }else if(process.env.QQPET_TEST_BALL_REWARD){
      assert.equal(game.dir,'ball');const before=Number(getPetInfo().info.yb);let clicks=0;
      // Keep native input on the penguin until the loaded ball becomes visible.
      for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}
      await delay(500);
      console.log('Ball initial windows: '+await win.webContents.executeJavaScript("JSON.stringify(Array.from(desktopGameView.wins.values(),w=>({name:w.name,hidden:w.box.hidden,x:w.x,y:w.y})))"));
      for(let i=0;i<180&&Number(getPetInfo().info.yb)===before&&!win.isDestroyed();i++){
        const ball=await win.webContents.executeJavaScript("(()=>{const b=document.querySelector('[data-name=WND_NAME_BALL]');if(!b||b.hidden)return null;const r=b.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
        if(ball){for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...ball,button:'left',clickCount:1});await delay(15);}clicks++;}
        else if(i%10===0){for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(30);}}
        await delay(80);
      }
      console.log('Native ball tracking clicks: '+clicks+' wallet: '+before+' -> '+getPetInfo().info.yb);
      assert.equal(Number(getPetInfo().info.yb),before+1,'real SWF ball hits must trigger the reward without calling the bridge directly');
      assert.equal(getPetInfo().info.mood,905);
    }else for(let i=0;i<6;i++){for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}await delay(200);}
    // Bubble rounds keep creating players; wait for the current set to load
    // instead of treating a newly created iframe as a failed resource.
    let state;
    await until(async()=>{state=await win.webContents.executeJavaScript("Array.from(desktopGameView.wins.values(),w=>({name:w.name,ready:!!w.player?.ruffle().metadata,width:w.w,height:w.h,hand:!!w.player?.shadowRoot?.querySelector('canvas')&&getComputedStyle(w.player.shadowRoot.querySelector('canvas')).cursor.includes('data:image')}))");return state.length>0&&state.every(w=>w.ready&&w.hand);});
    assert.ok(state.length>0);assert.ok(state.every(w=>w.ready));assert.ok(state.every(w=>w.hand));
    if(game.dir==='100ceng'){
      const cloud=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('[data-name=w_name_cloud]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
      for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...cloud,button:'left',clickCount:1});await delay(100);}
      const before=await win.webContents.executeJavaScript("desktopGameView.wins.get('w_name_player').x");
      win.webContents.sendInputEvent({type:'keyDown',keyCode:'Left'});await delay(400);win.webContents.sendInputEvent({type:'keyUp',keyCode:'Left'});
      const after=await win.webContents.executeJavaScript("desktopGameView.wins.get('w_name_player').x");
      fs.writeFileSync(path.join(temp,'100ceng-keyboard.png'),(await win.webContents.capturePage()).toPNG());console.log('100 floor positions: '+before+' -> '+after+' screenshot '+temp);
      assert.notEqual(after,before,'100 floors arrow key moves the actual player window');
    }
    fs.writeFileSync(path.join(temp,game.dir+'.png'),(await win.webContents.capturePage()).toPNG());
    console.log('GAME '+sex+'/'+level+'/'+game.dir+' '+JSON.stringify(state));
    if(process.env.QQPET_TEST_BALL_FINISH){
      assert.equal(game.dir,'ball');const rewarded=Number(getPetInfo().info.yb);let hiddenTicks=0,missed=false,quit=false;const positions=[];
      win.webContents.on('ipc-message',(_event,channel,data)=>{if(channel==='desktopGames_h_event'&&data?.type==='quit')quit=true;});
      // No synthetic score/callback: stop clicking and let the ball fall.
      for(let i=0;i<120&&!win.isDestroyed();i++){
        const ball=await win.webContents.executeJavaScript("(()=>{const b=desktopGameView.wins.get('WND_NAME_BALL');return b?{hidden:b.box.hidden,x:b.x,y:b.y}:null})()");
        if(ball)positions.push(ball);if(i%20===0)console.log('Ball no-input observation',JSON.stringify({i,ball}));hiddenTicks=ball?.hidden?hiddenTicks+1:0;
        if(hiddenTicks>=6&&!missed){missed=true;fs.writeFileSync(path.join(temp,'ball-missed.png'),(await win.webContents.capturePage()).toPNG());console.log('Ball naturally missed/hidden after no input',JSON.stringify(ball));}
        await delay(500);
      }
      console.log('Ball no-input result',JSON.stringify({destroyed:win.isDestroyed(),quit,missed,samples:positions.length,last:positions.slice(-4)}));
      assert.ok(positions.length>0,'observe the original moving ball after input stops');
      assert.ok(win.isDestroyed(),'original game naturally quits without closing its window from the harness');
      assert.ok(quit,'original renderer sends the quit event');
      assert.equal(Number(getPetInfo().info.yb),rewarded,'miss/automatic close cannot re-award');
      console.log('PASS original no-input ball motion, automatic quit event and unchanged reward');
    }else if(process.env.QQPET_TEST_BUBBLE_FINISH||process.env.QQPET_TEST_MOUSE_FINISH||process.env.QQPET_TEST_GUESS_FINISH||process.env.QQPET_TEST_ROPE_FINISH){
      assert.equal(game.dir,process.env.QQPET_TEST_ROPE_FINISH?'rope':process.env.QQPET_TEST_GUESS_FINISH?'guess':process.env.QQPET_TEST_MOUSE_FINISH?'mouse':'paopao2');const rewarded=Number(getPetInfo().info.yb);let quit=false;
      win.webContents.on('ipc-message',(_event,channel,data)=>{if(channel==='desktopGames_h_event'&&data?.type==='quit')quit=true;});
      for(let i=0;i<120&&!win.isDestroyed();i++)await delay(500);
      assert.ok(win.isDestroyed(),'stopping input naturally ends the original game');
      assert.ok(quit,'original game sends its quit event');
      assert.equal(Number(getPetInfo().info.yb),rewarded,'misses and automatic close cannot re-award');
      console.log('PASS original '+game.dir+' loss, automatic quit event and unchanged reward');
    }else{const closed=new Promise(r=>win.once('closed',r));win.close();await closed;}
    assert.equal(getPetInfo().activeOption.desktopGame,null);
  }
  assert.equal(getPetInfo().playroom.lifetime.desktopRounds,process.env.QQPET_TEST_GAME?1:6);
  console.log('Actual native-play rewards: '+JSON.stringify({yb:getPetInfo().info.yb,mood:getPetInfo().info.mood,rewards:getPetInfo().playroom.daily.desktopRewards||0}));
  // Exercise the real frame-to-main reward bridge separately from winning a game.
  view.cleate('rope');await until(()=>view.window && getPetInfo().activeOption.desktopGame==='rope');
  const crashWindow=view.window,balance=Number(getPetInfo().info.yb),mood=Number(getPetInfo().info.mood),rounds=getPetInfo().playroom.lifetime.desktopRounds;
  await crashWindow.webContents.executeJavaScript("desktopGameView.wins.get('main').frame.contentWindow.TICKLE_SendAction()");
  assert.equal(Number(getPetInfo().info.yb),balance+1);assert.equal(Number(getPetInfo().info.mood),Math.min(1000,mood+55));
  assert.ok(await crashWindow.webContents.executeJavaScript("document.getElementById('game-status').textContent.includes('元宝 +1')"),'the reward response reaches the renderer, not just the main-process wallet');
  const crashClosed=new Promise(r=>crashWindow.once('closed',r));crashWindow.webContents.forcefullyCrashRenderer();await crashClosed;
  assert.equal(getPetInfo().activeOption.desktopGame,null);assert.equal(getPetInfo().playroom.lifetime.desktopRounds,rounds+1);
  assert.equal(Number(getPetInfo().info.yb),balance+1);
  assert.deepEqual(errors,[]);
  console.log('PASS: selected original desktop games load, native clicks/100-floor keyboard movement, child players/hand cursors, reward bridge and crash close restore once. Screenshots: '+temp);
  clearTimeout(timeout);for(const w of BrowserWindow.getAllWindows())w.destroy();app.quit();
}).catch(error=>{console.error(error);for(const w of BrowserWindow.getAllWindows())w.destroy();app.exit(1);});
