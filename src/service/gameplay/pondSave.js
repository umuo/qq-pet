// Commit whole fish operations, not individual cookie writes.
class PondSave {
  sequence = 0;
  constructor({pet=()=>getPetInfo(),update=patch=>setPetInfo(patch)}={}) {
    this.pet=pet;this.update=update;
  }
  commit(batch) {
    if (!batch || !Array.isArray(batch.packets)) throw Error('鱼塘保存数据无效。');
    if (batch.packets.some(data=>!data||!Number.isSafeInteger(data.sequence)||data.sequence<=0)) throw Error('鱼塘保存数据无效。');
    const packets=batch.packets.slice().sort((a,b)=>a.sequence-b.sequence);
    const patch={},current=this.pet();let balance=Number(current.info.yb),sequence=this.sequence;
    if (!Number.isSafeInteger(balance)||balance<0) throw Error('当前元宝余额无效。');
    for (const data of packets) {
      if (!data || !Number.isSafeInteger(data.sequence)||data.sequence<=0) throw Error('鱼塘保存数据无效。');
      if (data.sequence<=sequence) continue;
      if (Object.hasOwn(data,'fishes')) {
        const fishes=typeof data.fishes==='string'?JSON.parse(data.fishes):data.fishes;
        if (!Array.isArray(fishes)||fishes.length>5||fishes.some(f=>!f||typeof f!=='object'||Array.isArray(f))) throw Error('鱼塘数据无效。');
        patch.fishing={...patch.fishing,fishes:JSON.parse(JSON.stringify(fishes))};
      }
      for (const key of ['harvestfish','canusecnt']) if (Object.hasOwn(data,key)) {
        const value=Number(data[key]);
        if (!Number.isSafeInteger(value)||value<0) throw Error('鱼塘计数无效。');
        patch.fishing={...patch.fishing,[key]:value};
      }
      if (Object.hasOwn(data,'yb')) {
        const value=Number(data.yb),base=Number(data.walletBase);
        if (!Number.isSafeInteger(value)||value<0||!Number.isSafeInteger(base)||base<0) throw Error('鱼塘元宝数据无效。');
        balance+=value-base;
        if (!Number.isSafeInteger(balance)||balance<0) throw Error('元宝已发生变化，鱼塘操作未完成，请重试。');
        patch.info={yb:balance};
      }
      sequence=data.sequence;
    }
    if (sequence>this.sequence) {
      this.update(patch);
      this.sequence=sequence;
    }
    return this.sequence;
  }
  discard(batch) {
    for (const data of Array.isArray(batch?.packets)?batch.packets:[]) if (Number.isSafeInteger(data?.sequence)) this.sequence=Math.max(this.sequence,data.sequence);
    return this.sequence;
  }
}
module.exports={PondSave};
