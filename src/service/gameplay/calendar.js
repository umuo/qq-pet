// Offline festival rules shared by mail and companion tasks.
function holidays(date) {
  const names=[];
  const fixed={'1-1':'元旦','5-1':'劳动节','10-1':'国庆节'};
  if(fixed[`${date.getMonth()+1}-${date.getDate()}`])names.push(fixed[`${date.getMonth()+1}-${date.getDate()}`]);
  // ICU's Chinese calendar works offline. Leap months are not festival months.
  try {
    const formatter=new Intl.DateTimeFormat('en-u-ca-chinese',{month:'numeric',day:'numeric'});
    if(formatter.resolvedOptions().calendar==='chinese') {
      const parts=Object.fromEntries(formatter.formatToParts(date).map(p=>[p.type,p.value]));
      const lunar={'1-1':'春节','5-5':'端午节','8-15':'中秋节'};
      if(/^\d+$/.test(parts.month) && lunar[`${parts.month}-${parts.day}`])names.push(lunar[`${parts.month}-${parts.day}`]);
    }
  } catch (_) { /* Fixed-date festivals remain available without Chinese ICU. */ }
  return names;
}
module.exports={holidays};
