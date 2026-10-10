const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
test('whole app quit/restart and interrupted farm exit preserve '+(process.env.QQPET_TEST_PLANTED==='1'?'planted crops':'purchases')+' and refund wallets once',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-farm-restart-'));
 for(const phase of ['purchase-quit','clean-recover','orphan-exit','orphan-recover'])await new Promise((resolve,reject)=>{
  const child=spawn(require('electron'),[path.join(__dirname,'farm-restart.electron.cjs'),dir,phase],{stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',chunk=>{output+=chunk;process.stdout.write(chunk);});child.stderr.on('data',chunk=>{output+=chunk;process.stderr.write(chunk);});child.on('error',reject);child.on('exit',(code,signal)=>{try{if(phase==='orphan-exit')assert.equal(signal,'SIGKILL',phase+' failed: '+output);else assert.equal(code,0,phase+' failed: '+output);resolve();}catch(error){reject(error);}});
 });
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'config-macos.json'),'utf8'));assert.equal(saved.pet.info.yb,175);assert.equal(saved.pet.playroom.farm.session,null);assert.equal(saved.pet.playroom.farm.user.burden.find(i=>i.Items==='RadishSeed')?.number||0,process.env.QQPET_TEST_PLANTED==='1'?0:2);
 if(process.env.QQPET_TEST_PLANTED==='1'){assert.equal(saved.pet.playroom.farm.user.farmland.filter(p=>p.crop==='RadishSeed').length,2);}
 console.log('Farm restart fixture:',dir);
});
