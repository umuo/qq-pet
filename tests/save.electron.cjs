const {app,BrowserWindow,dialog}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-save-ui-')),dir=path.join(temp,'userData');
app.setPath('userData',dir);app.on('window-all-closed',()=>{});global.initData={};
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(100);}throw Error('Save UI timeout');}
const timeout=setTimeout(()=>app.exit(2),60000);
app.whenReady().then(async()=>{
  require('../src/ini/init');global.openSpeak=()=>{};require('../src/service/model/user').getLogs=async()=>null;
  setPetInfo({info:{name:'原企鹅',host:'测试',sex:'GG',growth:30000,health:5,hunger:2000,clean:2000,mood:850,yb:300},maxInfo:{level:10,hunger:4000,clean:4000}});
  setSys({name:'apiKey',value:'local-secret'});
  const {freshFarm}=require('../src/service/gameplay/farm');
  setPetInfo({playroom:{version:1,travel:{visits:{北京市:1},photos:[{id:'u_alipay'}],postcards:[],souvenirs:[],session:null},mail:{letters:[{id:'welcome',claimed:true}],sent:{welcome:true}},farm:{user:{...freshFarm(),wealth:'300'},session:null}}});
  const farm=require('../src/windows/popups/farm/main');farm.cleate();
  await until(()=>farm.window && getPetInfo().playroom.farm.session && farm.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function'"));
  setPetInfo({info:{yb:25}});
  const out=path.join(temp,'export.json'),incomingFile=path.join(temp,'incoming.json');let confirmation=0,exitRequested=false,relaunchRequested=false;
  dialog.showSaveDialog=async()=>({canceled:false,filePath:out});
  dialog.showOpenDialog=async()=>({canceled:false,filePaths:[incomingFile]});
  dialog.showMessageBox=async(_win,options)=>{if(options.type==='error')throw Error(options.message);return {response:confirmation};};
  const originalExit=app.exit.bind(app);app.relaunch=()=>{relaunchRequested=true;};app.exit=()=>{exitRequested=true;};
  const setup=require('../src/windows/popups/setup/main');setup.cleate();
  await until(()=>setup.window && setup.window.webContents.executeJavaScript("document.body.textContent.includes('导出宠物存档')"));
  async function click(label){const win=setup.window;win.focus();const point=await win.webContents.executeJavaScript(`(()=>{const row=Array.from(document.querySelectorAll('.childrenIn')).find(el=>el.textContent.includes(${JSON.stringify(label)}));row.scrollIntoView();const el=row.querySelector('.but')||row.querySelector('[class*=but]')||row,r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
  await click('导出宠物存档');await until(()=>fs.existsSync(out));
  const exported=JSON.parse(fs.readFileSync(out,'utf8'));assert.equal(exported.pet.info.yb,325);assert.equal(exported.pet.playroom.farm.session,null);assert.equal(farm.window,null);assert.equal(exported.settings.apiKey,undefined);
  const incoming=JSON.parse(JSON.stringify(exported));incoming.pet.info.name='导入企鹅';incoming.pet.info.sex='MM';incoming.pet.info.yb=880;incoming.settings.hdImages=false;incoming.cache.store.food=[{id:'test-food',num:2}];fs.writeFileSync(incomingFile,JSON.stringify(incoming));
  await click('导入宠物存档');await delay(400);assert.equal(fs.existsSync(path.join(dir,'pending-pet-import.json')),false);assert.equal(getPetInfo().info.name,'原企鹅','cancel retains current pet');
  confirmation=1;await click('导入宠物存档');await until(()=>exitRequested);
  assert.equal(relaunchRequested,true);assert.equal(getPetInfo().info.name,'原企鹅','live windows never receive imported state');
  const backups=fs.readdirSync(path.join(dir,'pet-backups'));assert.equal(backups.length,1);const backup=JSON.parse(fs.readFileSync(path.join(dir,'pet-backups',backups[0]),'utf8'));assert.equal(backup.pet.info.yb,325);assert.equal(backup.pet.info.name,'原企鹅');
  BrowserWindow.getAllWindows().forEach(win=>win.destroy());
  // A second real Electron process runs the production init order against only this fixture directory.
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(__dirname,'save-startup.electron.cjs'),dir],{stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',data=>{log+=data;});child.stderr.on('data',data=>{log+=data;});child.on('error',reject);child.on('exit',code=>{console.log(log);code===0?resolve():reject(Error('Startup test exited '+code));});});
  console.log('PASS native settings export/import buttons, farm settlement, backup, cancel, pending import and real next-process startup. File dialogs/relaunch dispatch are fixture-controlled. Files:',temp);
  clearTimeout(timeout);originalExit(0);
}).catch(error=>{console.error(error);process.exit(1);});
