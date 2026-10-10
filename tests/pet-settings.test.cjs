const test=require('node:test'),assert=require('node:assert/strict');
global.$Store={setItem(){}};global.windowsMain={setOpacity(){}};require('../src/ini/pet');
test('partial legacy settings retain missing defaults and honor explicit false values',()=>{
 setSys({init:{clip:false,llmEnabled:false,doNotDisturb:true}});
 const settings=getSys();assert.equal(settings.clip,false);assert.equal(settings.llmEnabled,false);assert.equal(settings.doNotDisturb,true);assert.equal(settings.hdImages,true);assert.equal(settings.opacity,1);assert.deepEqual(settings.shortcuts.openStting,['ALT','D']);
});
test('explicit empty shortcut configuration and disabled HD are retained',()=>{
 setSys({init:{shortcuts:{},hdImages:false}});assert.deepEqual(getSys().shortcuts,{});assert.equal(getSys().hdImages,false);assert.equal(getSys().clip,false);
});
