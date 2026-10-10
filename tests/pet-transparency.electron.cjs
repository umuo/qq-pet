// Check alpha from native pixels: screenshot previews can exaggerate a nearly
// transparent white hit-area present in the original adult animation.
const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-transparency-'));app.setPath('userData',dir);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const timer=setTimeout(()=>app.exit(2),30000);
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:300,height:300,frame:false,transparent:true,backgroundColor:'#00000000',webPreferences:{offscreen:true,backgroundThrottling:false,nodeIntegration:true,contextIsolation:false}});
 await win.loadFile(path.resolve(__dirname,'../src/windows/app.html'));
 for(const pose of ['GG/Adult/happy/Stand.swf','MM/Adult/happy/Stand.swf','GG/Egg/Stand.swf']){
  const url=require('node:url').pathToFileURL(path.resolve(__dirname,'../src/assets/Action',pose)).href;
  await win.webContents.executeJavaScript(`(async()=>{document.body.innerHTML='';const p=RufflePlayer.newest().createPlayer();p.style.cssText='position:absolute;left:20px;top:20px;width:240px;height:240px';document.body.appendChild(p);const ready=new Promise(resolve=>p.addEventListener('loadedmetadata',resolve,{once:true}));await p.ruffle().load({url:${JSON.stringify(url)},autoplay:'on',wmode:'transparent',backgroundColor:null,letterbox:'off',splashScreen:false,contextMenu:'off'});await ready;})()`);
  await delay(900);
  const image=await win.webContents.capturePage(),{width,height}=image.getSize(),pixels=image.toBitmap();
  let opaque=0,faintWhite=0;
  for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]>250)opaque++;if(pixels[i+3]>0&&pixels[i+3]<=4&&pixels[i]===pixels[i+3]&&pixels[i+1]===pixels[i+3]&&pixels[i+2]===pixels[i+3])faintWhite++;}
  assert.ok(opaque>1000,pose+' retains an opaque pet');
  for(const [x,y] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1]])assert.equal(pixels[(y*width+x)*4+3],0,pose+' has transparent window corners');
  if(pose==='GG/Adult/happy/Stand.swf'){
   // Original hit shape has an alpha multiplier of 3/256. Sample an interior
   // point of its rectangle outside the visible silhouette, scaled for Retina.
   const x=Math.round(width*155/600),y=Math.round(height*250/600);
   assert.ok(pixels[(y*width+x)*4+3]<=4,'adult hit-area must not become an opaque white background');
   assert.ok(faintWhite>1000,'original faint hit-area remains present');
  }
  fs.writeFileSync(path.join(dir,pose.replaceAll('/','-')+'.png'),image.toPNG());
  console.log('PASS pet alpha',JSON.stringify({pose,width,height,opaque,faintWhite}));
 }
 console.log('OUTPUT',dir);clearTimeout(timer);app.exit();
}).catch(error=>{console.error(error);app.exit(1);});
