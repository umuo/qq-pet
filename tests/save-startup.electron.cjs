const {app} = require('electron');
const assert = require('node:assert/strict'), fs = require('node:fs'),path = require('node:path');
const dir=process.argv[2];app.setPath('userData',dir);global.initData={};
app.whenReady().then(()=>{
  require('../src/ini/init');
  const pet=$Store.getItem('pet');
  assert.equal(pet.info.name,'导入企鹅');assert.equal(pet.info.yb,880);
  assert.equal(pet.playroom.travel.photos[0].id,'u_alipay');
  assert.equal(pet.playroom.mail.letters[0].claimed,true);
  assert.equal(pet.playroom.farm.session,null);assert.equal(pet.activeOption.desktopGame,null);
  assert.equal($Store.getItem('cache').store.food[0].id,'test-food');
  assert.equal($Store.getItem('sys').apiKey,'local-secret');assert.equal($Store.getItem('sys').hdImages,false);
  assert.equal(fs.existsSync(path.join(dir,'pending-pet-import.json')),false);
  setPetInfo(pet);setCache({init:$Store.getItem('cache')});setSys({init:$Store.getItem('sys')});
  const {farm}=require('../src/service/gameplay/farm');assert.equal(farm().recover({id:'stale-local-sol',raw:'broken'}),false);
  assert.equal(getPetInfo().info.yb,880);
  console.log('PASS real startup init consumes pending import, preserves photos/mail/farm/inventory, retains AI credentials, rejects stale SOL');
  app.exit(0);
}).catch(error=>{console.error(error);app.exit(1);});
