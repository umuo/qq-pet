const _require = eval("require"),
  { GrowUp } = _require("./GrowUp.js"),
  { State } = _require("./State.js"),
  { Goods } = _require("./Goods.js");
class myPet {
  Goods = null;
  GrowUp = null;
  State = null;
  growTime = 6e4;
  outData = {};
  constructor(e = {}) {}
  init(e = {}) {
    let { fn: t, petInfo: _ } = e;
    ((this.State = new State({ petInfo: _, callBackState: t.backState })),
      (this.Goods = new Goods({
        backUseConsumables: (e) => {
          let _ = this.State.useConsumables(e);
          return (t.backActive(_), _);
        },
        callUseActive: (e) =>
          this.State.doActive({
            ...e,
            activeOption: getPetInfoOne("", "activeOption"),
          }),
      })),
      (this.GrowUp = new GrowUp({
        petInfo: _,
        growTime: this.growTime,
        callBackState: (e) => {
          "onLine" == e.type
            ? this.State.determineHealth(getPetInfo(), { speak: !0 })
            : e && t.backState(e);
        },
      })));
  }
  startGrowUp() {
    this.GrowUp.startGrowUp();
  }
  changePetInfoReply(e) {
    (this.State.determineHealth(e), this.GrowUp.doChangeMaxInfo(e));
  }
  determineHealth(e = {}) {
    this.State.determineHealth(null, e);
  }
}
try {
  module && (module.exports = { myPet });
} catch (e) {}
