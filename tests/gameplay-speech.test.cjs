const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {GameplaySpeech,facts,safeLine}=require('../src/service/gameplay/speech');
const pet={info:{name:'企鹅',host:'主人',sex:'GG',birthDay:'2020-10-01'}};
test('rewrites preserve quantities, units, named gifts and destinations; altered or invented facts fall back',()=>{
  const source='主人，收下「生日礼物」，获得 300 元宝。',words=facts(source,pet);
  assert.equal(safeLine(source,'主人，获得 300 元宝，快收下「生日礼物」吧~',words),'主人，获得 300 元宝，快收下「生日礼物」吧~');
  for(const bad of ['主人，收下「生日礼物」，获得 500 元宝。','主人，收下「生日礼物」，获得 300 元宝，还有1张照片。','主人，收下「玩具礼物」，获得 300 元宝。','<b>'+source+'</b>',null,''])assert.equal(safeLine(source,bad,words),source);
  const trip='出发去北京市！大约一小时后回来，途中可能遇到奇遇。';
  assert.ok(facts(trip,pet).includes('一小时'));assert.equal(safeLine(trip,trip+' 顺便去上海市。',facts(trip,pet)),trip);
  const harvest='农场有2块地的庄稼熟了，鱼塘有3条鱼可以收获。';
  assert.equal(safeLine(harvest,'农场有3块地的庄稼熟了，鱼塘有2条鱼可以收获。',facts(harvest,pet)),harvest,'same numbers with swapped units are rejected');
  const morning='主人，早上好！今天也一起加油吧！';
  assert.equal(safeLine(morning,'主人，晚上好！今天也一起加油吧！',facts(morning,pet)),morning,'time-of-day cannot be changed');
});
test('disabled, failure and timeout keep original; late output cannot create a second bubble',async()=>{
  let calls=0;const emitted=[],source='邮箱有2封新信。';
  const service=new GameplaySpeech({enabled:()=>false,quiet:()=>false,pet:()=>pet,generate:()=>{calls++;},emit:p=>emitted.push(p),timeoutMs:10});
  assert.equal(await service.rewrite(source),source);assert.equal(calls,0);
  service.enabled=()=>true;service.generate=()=>Promise.reject(Error('offline'));assert.equal(await service.rewrite(source),source);
  let resolve;service.generate=()=>new Promise(r=>{resolve=r;});await service.say({data:{type:'text',data:source,submitText:'去看看'},otherOpt:{type:'gameplayHarvest',target:'farm'}});
  assert.equal(emitted.length,1);assert.equal(emitted[0].data.data,source);assert.equal(emitted[0].data.submitText,'去看看');assert.equal(emitted[0].otherOpt.target,'farm');
  resolve('邮箱有2封新信，快看~');await new Promise(r=>setTimeout(r,15));assert.equal(emitted.length,1);
});
test('newer announcements, DND, owner changes and runtime stop discard pending stale speech',async()=>{
  let resolve,quiet=false,current=pet;const emitted=[];
  const service=new GameplaySpeech({enabled:()=>true,quiet:()=>quiet,pet:()=>current,generate:()=>new Promise(r=>{resolve=r;}),emit:p=>emitted.push(p)});
  const first=service.say({data:{data:'邮箱有1封新信。'}});await Promise.resolve();await Promise.resolve();
  await service.say({data:{data:'农场有2块地的庄稼熟了。'}});resolve('邮箱有1封新信，快看~');await first;assert.equal(emitted.length,1);assert.ok(emitted[0].data.data.startsWith('农场'));
  for(const change of [()=>quiet=true,()=>current={info:{...pet.info,name:'另一个宠物'}},()=>service.cancel()]) {
    quiet=false;current=pet;const pending=service.say({data:{data:'邮箱有1封新信。'}});await Promise.resolve();await Promise.resolve();change();resolve('邮箱有1封新信，快看~');await pending;assert.equal(emitted.length,1);
  }
});
test('real existing AI transport uses configured endpoint/model/key and validates gameplay output',async()=>{
  const requests=[];let answer='主人，邮箱有2封新信，快来看看吧~';
  const server=http.createServer((req,res)=>{let body='';req.on('data',data=>body+=data);req.on('end',()=>{requests.push({path:req.url,key:req.headers.authorization,body:JSON.parse(body)});res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({tolk:answer,submitText:'更改按钮'})}}]}));});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const settings={llmEnabled:true,llmApiKey:'fixture-key',llmUrl:`http://127.0.0.1:${server.address().port}`,llmModel:'fixture-model'};
  global.getSys=key=>settings[key];require('../src/service/llm');
  const service=new GameplaySpeech({enabled:()=>true,pet:()=>pet,generate:(s,w,p)=>llmService.rewriteGameplay(s,w,p)});
  const source='主人，邮箱有2封新信。';
  try {
    assert.equal(await service.rewrite(source),answer);assert.equal(requests.length,1);assert.equal(requests[0].path,'/v1/chat/completions');assert.equal(requests[0].key,'Bearer fixture-key');assert.equal(requests[0].body.model,'fixture-model');
    assert.ok(requests[0].body.messages[1].content.includes('2封'));answer='主人，邮箱有9封新信。';assert.equal(await service.rewrite(source),source);
  } finally {await new Promise(r=>server.close(r));delete global.getSys;}
});
