const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createRequire } = require('node:module');
const { imageSize, hdPairs, hdCss } = require('../src/windows/util/hdImages');
const assets = path.resolve(__dirname,'../src/assets');

test('actual PNG and JPEG icons with .gif names use exact-size HD images',()=>{
  for(const name of ['100010120','100010238','100010239','100010406']) {
    const low='img_res/food/'+name+'.gif';
    assert.deepEqual(imageSize(fs.readFileSync(path.join(assets,low))),[50,50]);
    assert.equal(hdPairs()[low],'reference/img_res/food/'+name+'@2x.png');
  }
  assert.equal(hdPairs()['Menu/ditu01.png'],undefined,'genuinely different dimensions retain the original');
});

test('changed original bytes invalidate an alias without changing project files',()=>{
  const target=path.join(assets,'img_res/commodity/100020032.gif');
  const sourceFile=path.resolve(__dirname,'../src/windows/util/hdImages.js');
  const module={exports:{}},realRequire=createRequire(sourceFile);
  const proxy={...fs,readFileSync(file,...args){const bytes=fs.readFileSync(file,...args);if(path.resolve(file)!==target)return bytes;const changed=Buffer.from(bytes);changed[changed.length-1]^=1;return changed;}};
  vm.runInNewContext(fs.readFileSync(sourceFile,'utf8'),{module,Buffer,__dirname:path.dirname(sourceFile),require:name=>name==='node:fs'?proxy:realRequire(name)});
  assert.equal(hdPairs()['img_res/commodity/100020032.gif'],'reference/img_res/clean/100020032@2x.png');
  assert.equal(module.exports.hdPairs()['img_res/commodity/100020032.gif'],undefined);
  const css='background:url("../assets/img_res/commodity/100020032.gif")';
  assert.ok(hdCss(css,true).includes('image-set('));
  assert.equal(module.exports.hdCss(css,true),css,'a changed icon keeps its original CSS URL');
});

test('incomplete image headers safely retain original resources',()=>{
  for(const file of ['sysSeting/guanbi00.png','img_res/food/100010032.gif','img_res/food/100010238.gif']) {
    const bytes=fs.readFileSync(path.join(assets,file));
    for(const length of [0,1,4,8])assert.equal(imageSize(bytes.subarray(0,length)),null);
  }
});
