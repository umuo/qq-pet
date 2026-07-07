const _require = eval("require");
const {
  GrowUp
} = _require("./GrowUp.js");
const {
  State
} = _require("./State.js");
const {
  Goods
} = _require("./Goods.js");
class myPet {
  Goods = null;
  GrowUp = null;
  State = null;
  growTime = 60000;
  outData = {};
  constructor(e = {}) {}
  init(e = {}) {
    let {
      fn: t,
      petInfo: _
    } = e;
    this.State = new State({
      petInfo: _,
      callBackState: t.backState
    });
    this.Goods = new Goods({
      backUseConsumables: e => {
        let _ = this.State.useConsumables(e);
        t.backActive(_);
        return _;
      },
      callUseActive: e => this.State.doActive({
        ...e,
        activeOption: getPetInfoOne("", "activeOption")
      })
    });
    this.GrowUp = new GrowUp({
      petInfo: _,
      growTime: this.growTime,
      callBackState: e => {
        if (e.type == "onLine") {
          this.State.determineHealth(getPetInfo(), {
            speak: true
          });
        } else if (e) {
          t.backState(e);
        }
      }
    });
  }
  startGrowUp() {
    this.GrowUp.startGrowUp();
  }
  changePetInfoReply(e) {
    this.State.determineHealth(e);
    this.GrowUp.doChangeMaxInfo(e);
  }
  determineHealth(e = {}) {
    this.State.determineHealth(null, e);
  }
}
try {
  if (module) {
    module.exports = {
      myPet
    };
  }
} catch (e) {}
