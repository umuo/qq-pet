const {app,nativeImage}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-tray-hd-'));
app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});
let sex='GG',enabled=true;
global.getPetInfo=()=>({info:{sex}});global.getSys=()=>({hdImages:enabled});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<200;i++){if(fn())return;await delay(10);}throw Error('Tray animation timeout');}
const assets=path.resolve(__dirname,'../src/assets');
const timeout=setTimeout(()=>app.exit(2),45000);let menu;
app.whenReady().then(async()=>{
  const {MenuCreate,loadTrayIcon}=require('../src/windows/main/menu');
  const {hdPairs,hdImagePath}=require('../src/windows/util/hdImages');
  const trayPaths=Object.keys(hdPairs()).filter(low=>low.startsWith('img_res/Tray/'));
  assert.equal(trayPaths.length,84);
  const check=image=>{
    assert.ok(!image.isEmpty());assert.deepEqual(image.getSize(),{width:18,height:18});
    assert.ok(image.getScaleFactors().includes(1)&&image.getScaleFactors().includes(2));
    const png=image.toPNG({scaleFactor:2});assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[36,36]);
  };
  for(const low of trayPaths){
    const expected='reference/'+low.replace('/Boy/','/GG/').replace('/Girl/','/MM/').replace('/deafult.ico','/normal/1.ico').replace('.ico','@2x.png');
    assert.equal(hdPairs()[low],expected,'tray frames preserve gender, state and frame identity');
    check(loadTrayIcon(path.join(assets,low)));
  }
  const states={normal:4,dirty:4,event:2,feast:3,game:4,hungry:4,ill:2,pause:5,study:4,trip:3,work:3,dead:2};
  let sequences=0,updates=0;
  for(sex of ['GG','MM']){
    menu=new MenuCreate({title:'隔离托盘验证'});
    assert.ok(menu.tray.getBounds().width>0,'the native OS creates the actual tray item');
    let records=[];const set=menu.tray.setImage.bind(menu.tray);
    menu.tray.setImage=image=>{records.push({at:Date.now(),image});updates++;return set(image);};
    const folder=sex==='GG'?'Boy':'Girl';
    for(const [name,end] of Object.entries(states)){
      records=[];menu.activeTraysIcon({name,time:30,change:true});await until(()=>records.length>=end+1);
      for(let i=0;i<=end;i++){
        check(records[i].image);
        const frame=i%end+1,directory=name==='trip'?'travel':name;
        const expected=loadTrayIcon(path.join(assets,'img_res/Tray',folder,directory,frame+'.ico'));
        assert.ok(records[i].image.toBitmap().equals(expected.toBitmap()),'native '+sex+'/'+name+' cycles the correct frame '+frame);
      }
      sequences++;
    }
    records=[];menu.activeTraysIcon({name:'leave',change:true});assert.equal(records.length,1);check(records[0].image);
    await delay(80);assert.equal(records.length,1,'leave is a static icon');sequences++;
    records=[];menu.activeTraysIcon({name:'normal',change:true});await until(()=>records.length>=2);
    assert.ok(records[1].at-records[0].at>=250,'the default animation retains the original 350 ms cadence');
    enabled=false;await until(()=>records.some(record=>!record.image.getScaleFactors().includes(2)));
    const original=path.join(assets,'img_res/Tray',folder,'normal/1.ico');
    assert.equal(hdImagePath(original,false),original);
    const low=nativeImage.createFromPath(original),expected=low.isEmpty()?nativeImage.createFromPath(path.join(assets,'tray-icon.png')):low.resize({width:18,height:18});
    assert.ok(loadTrayIcon(original).toBitmap().equals(expected.toBitmap()),'disabled HD retains original decoding and fallback');
    enabled=true;menu.activeTraysIcon({name:'feast',change:true,time:30});menu.activeTraysIcon({name:'normal'});
    assert.equal(menu.oldActiveTraysIcon.name,'feast','busy-state priority is retained');
    menu.activeTraysIcon({name:'pause',time:30});assert.equal(menu.oldActiveTraysIcon.name,'pause');
    const tray=menu.tray;menu.destroyTray();const closed=records.length;await delay(80);
    assert.ok(tray.isDestroyed());assert.equal(records.length,closed,'destroy clears the real animation timer');
  }
  const original=path.join(assets,'img_res/Tray/Boy/travel/1.ico'),high=hdImagePath(original),read=fs.readFileSync;
  fs.readFileSync=function(file,...args){if(path.resolve(file)===high)throw Error('isolated unavailable HD file');return read.call(this,file,...args);};
  let missing;try{missing=loadTrayIcon(original);}finally{fs.readFileSync=read;}
  enabled=false;assert.ok(missing.toBitmap().equals(loadTrayIcon(original).toBitmap()),'missing HD preserves the original fallback');enabled=true;
  for(const [name,file] of Object.entries({boy:'img_res/Tray/Boy/travel/1.ico',girl:'img_res/Tray/Girl/travel/1.ico'}))fs.writeFileSync(path.join(temp,name+'-travel.png'),loadTrayIcon(path.join(assets,file)).toPNG({scaleFactor:2}));
  console.log('PASS actual native tray:',JSON.stringify({files:trayPaths.length,sequences,updates,logicalSize:18,retinaPixels:36,output:temp}));
  clearTimeout(timeout);app.quit();
}).catch(error=>{console.error(error);menu?.destroyTray();app.exit(1);});
