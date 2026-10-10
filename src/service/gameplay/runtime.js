const { travel } = require('./travel');
const { mailbox } = require('./mail');
const { harvest } = require('./harvest');
const { speech } = require('./speech');
// Runs independently of the playroom window, including offline completion on boot.
function startGameplay() {
  const tick = () => {
    const result = travel().tick();
    if (result?.message && !getSys('doNotDisturb')) speech().say({ data: { type: 'text', data: result.message }, active: 'speak' });
    const mail=mailbox().deliver();
    if(mail?.message && !getSys('doNotDisturb')) speech().say({data:{type:'text',data:mail.message},active:'speak'});
    const news=harvest().check(!!getSys('doNotDisturb'));
    if(news)speech().say({data:{type:'text',data:news.message,submitText:'去看看'},active:'speak',otherOpt:{type:'gameplayHarvest',target:news.target}});
  };
  listenInfo({ event: 'pet', name: 'gameplay', fn: tick });
  tick();
  const timer = setInterval(tick, 10000);
  return () => { clearInterval(timer); speech().cancel(); unListenInfo({ event: 'pet', name: 'gameplay' }); };
}
module.exports = { startGameplay };
