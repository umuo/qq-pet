const _require = eval("require");
const fishing = _require("../fishing/main");
const backRoom = _require("../backRoom/main");
const { pinkDiamondLevel } = _require("../../util/pet/level");

class mainClass {
  constructor() {
    this.window = null;
    this.show = false;
    this.name = "control";
    this.isReady = false;
    this.isCleate = false;
    this.positionSave = null;
  }

  addTop = 5;

  cleate(positionInfo, parentWindow) {
    this.isCleate = true;
    this.width = 1100;
    this.height = 500 + this.addTop;
    this.state = "hide";

    const position = this.calcPosition(positionInfo);
    const self = this;

    windowsMain
      .open({
        name: this.name,
        loadFile: "popups/" + this.name,
        jsFiles: ["./util/move.js"],
        default: {
          width: this.width,
          height: this.height,
          x: position.x,
          y: position.y,
          show: false,
          notChangeSize: true,
        },
        created(backVm) {
          const { vm, preloads, getinfo } = backVm;
          let passThrough = true;
          let studyContext = null;

          vm.setIgnoreMouseEvents(true, { forward: true });

          const sendPetInfo = (petInfo) => {
            if (studyContext && petInfo?.changeValue?.study) {
              const page = petControl.Goods.getConsumablesPage({
                ...studyContext,
                getWhere: "store",
              });
              vm.webContents.send("control_bus-html_setActiveData", {
                data: page,
                type: studyContext.type,
              });
            }

            const data = {
              hunger: { now: petInfo.info.hunger, max: petInfo.maxInfo.hunger },
              clean: { now: petInfo.info.clean, max: petInfo.maxInfo.clean },
              cure: { now: petInfo.info.health, max: petInfo.maxInfo.health },
            };
            vm.webContents.send("control_bus-html_gePetInfo", {
              type: "info",
              data,
            });
          };

          preloads({
            "control_set-say": (event, say) => {
              console.log(say, " --- control_set say");
            },
            "control_bus-Main": (event, payload) => {
              if (payload.event === "mounted") {
                self.isReady = true;
                vm.webContents.send("control_bus-html", {
                  paddingTopMain: self.addTop,
                  type: "load",
                });
                openLocalHost();
                sendPetInfo(getPetInfo());
                vm.on("blur", () => {
                  if (passThrough) self.changeState({ type: "hide" });
                  else vm.focus();
                });
                return;
              }

              if (payload.event === "close") vm.close();
              else if (payload.event === "focus") {
                self.state = "active";
                vm.focus();
              } else if (payload.event === "mainFocus" || (payload.event === "hide" && self.doHide(true))) {
                self.doHide(true);
              }
            },
            "control_bus-Main_eventMouse": (event, payload) => {
              passThrough = !payload.canDoType;
              vm.setIgnoreMouseEvents(passThrough, { forward: true });
            },
            "control_bus-Main_getActiveData": (event, raw) => {
              let payload = raw;
              try {
                payload = JSON.parse(raw);
              } catch (e) {}

              studyContext = payload.value === "study" ? payload : null;
              let page = petControl.Goods.getConsumablesPage({
                ...payload,
                getWhere: payload.getWhere || "store",
              });

              if (payload.value === "task") {
                page.result = self.doGiftIsTask(page.result, payload.useType);
              }

              sendPetInfo(getPetInfo());
              vm.webContents.send("control_bus-html_setActiveData", {
                data: page,
                type: payload.type,
              });
            },
            "control_bus-Main_useActiveData": (event, raw) => {
              self.useActiveData(vm, raw);
            },
            "control_bus-Main_determine": (event, raw) => {
              self.determine(vm, raw);
            },
            "control_bus-Main_openWindow": (event, raw) => {
              self.openWindow(raw);
            },
          });

          getinfo([
            {
              event: "pet",
              name: self.name,
              fn: (petInfo) => sendPetInfo(petInfo),
            },
          ]);
        },
        onload() {
          console.log("onload ", self.name);
          self.show = true;
        },
        onshow(win) {
          console.log("onshow ", self.name);
          self.window = win;
          self.show = true;
        },
        onhide() {
          console.log("onhide ", self.name);
          self.show = false;
        },
        onclose() {
          console.log("onclose ", self.name);
          self.window = null;
          self.isCleate = false;
          self.show = false;
          self.isReady = false;
          self.state = "hide";
        },
      })
      .then((win) => {
        this.window = win;
        if (this.positionSave) {
          console.log("使用储存位置 :>> ");
          this.window.setBounds(this.positionSave);
          this.positionSave = null;
        }
        this.init();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  calcPosition(positionInfo) {
    const point = [0, 0];
    point[0] = positionInfo.position[0] + positionInfo.maxSize[0] / 2;
    point[1] = positionInfo.position[1] + positionInfo.maxSize[1] - this.addTop;
    return {
      x: point[0] - this.width / 2,
      y: point[1],
      height: this.height,
      width: this.width,
    };
  }

  init() {
    this.show = true;
  }

  setPosition(positionInfo) {
    const bounds = this.calcPosition(positionInfo);
    if (this.window) {
      this.window.setBounds(bounds);
    } else {
      console.log("没有window储存位置 :>> ");
      this.positionSave = bounds;
    }
  }

  changeState(payload = {}) {
    if (!this.isReady) return;

    if (payload.type !== "hide") {
      setTimeout(() => {
        this.doShow(payload.type === "menu");
        if (this.window) this.window.focus();
      }, 0);
    }

    if (this.state !== payload.type) {
      this.state = payload.type;
      if (this.window) {
        this.window.webContents.send("control_bus-html_viewStyle", {
          type: this.state,
          opt: payload.opt || null,
        });
      }
    }
  }

  doGiftIsTask(items, useType) {
    const result = items;
    if (useType === "sign") {
      const now = new Date(tool.getTime({ format: "YY-MM-DD hh:mm" })).getTime();
      for (const index in result) {
        if (now >= result[index].time && result[index].isTake === 0) result[index].isTake = 1;
      }
    } else if (useType === "online") {
      const onlineDataTime = +getPetInfoOne("onlineDataTime", "info");
      for (const index in result) {
        if (onlineDataTime > result[index].time && result[index].isTake === 0) result[index].isTake = 1;
      }
    }
    return result;
  }

  useActiveData(vm, raw) {
    let payload = raw;
    try {
      payload = JSON.parse(raw);
    } catch (e) {}

    if (payload.event === "winShow") {
      this.usePinkDiamond(vm, payload);
      return;
    }

    if (getPetInfoOne("stopGrowth", "maxInfo")) {
      vm.webContents.send("control_bus-html_setActiveData", { type: "stopGrowth" });
      return;
    }

    if (payload?.useType) {
      if (payload.isTake === 1 && petControl.Goods.toAddGoods({ good: payload }) === true) {
        const gifts = getCache(payload.useType, "gift");
        gifts[payload.inIndex + (payload.current - 1) * payload.pageSize].isTake = 2;
        setCache({ name: payload.useType, upName: "gift", value: gifts });
        openSpeak({
          data: { type: "text" },
          communication: ["gift", payload.useType],
          nextActiveStr: "speak",
        });
      }

      const page = petControl.Goods.getConsumablesPage({
        ...payload,
        value: "task",
        getWhere: "store",
      });
      page.result = this.doGiftIsTask(page.result, payload.useType);
      vm.webContents.send("control_bus-html_setActiveData", {
        data: page,
        type: "task",
      });
      return;
    }

    if (["food", "commodity", "medicine"].includes(payload.type)) {
      const result = petControl.Goods.useConsumables(payload);
      if (result && !result.overType) {
        const page = petControl.Goods.getConsumablesPage({
          pageSize: payload.pageSize,
          current: payload.current,
          type: payload.type,
          getWhere: "store",
        });
        vm.webContents.send("control_bus-html_setActiveData", {
          data: page,
          type: payload.type,
        });
      } else {
        vm.webContents.send("control_bus-html_setActiveData", {
          data: result,
          type: "err",
        });
      }
      return;
    }

    if (payload.type === "work") {
      this.useWork(vm, payload);
      return;
    }

    if (payload.type === "study") {
      this.useStudy(vm, payload);
    }
  }

  useWork(vm, payload) {
    if (!payload.activeIt) {
      let result = { msg: "" };
      if (getPetInfoOne("work", "activeOption") || getPetInfoOne("study", "activeOption") || getPetInfoOne("trip", "activeOption")) {
        result = { msg: getPetInfoOne("host", "info") + "~做什么事都要专心哦~~" };
      } else if (getPetInfoOne("ill", "activeOption")) {
        result = {
          msg:
            (getPetInfoOne("ill", "activeOption").type === "dead" ? "您的宠物已死亡~" : "") ||
            getPetInfoOne("host", "info") + "~我生病，等我治疗好了再赚元宝吧~~",
        };
      } else if (payload.need > getPetInfoOne("level", "maxInfo") || !getPetInfoOne("level", "maxInfo")) {
        result = { msg: getPetInfoOne("host", "info") + "~我的等级不够哦，陪我长大再试试吧~~" };
      } else {
        let canWork = true;
        const studyValue = getPetInfoOne("study", "activeValue");
        for (const key in payload.education) {
          if (payload.education[key] && (!studyValue[key] || studyValue[key] < payload.education[key])) {
            canWork = false;
          }
        }
        result = canWork
          ? { ...payload, msg: getPetInfoOne("host", "info") + "~确定要去" + payload.tolkName + "吗？" }
          : { msg: getPetInfoOne("host", "info") + "~书到用时方恨少啊，我要努力学习~~" };
      }
      vm.webContents.send("control_bus-html_setActiveData", {
        data: result,
        type: "err",
      });
      return;
    }

    petControl.Goods.activeWork(payload);
  }

  useStudy(vm, payload) {
    if (!payload.activeIt) {
      const result =
        getPetInfoOne("work", "activeOption") || getPetInfoOne("study", "activeOption") || getPetInfoOne("trip", "activeOption")
          ? { msg: getPetInfoOne("host", "info") + "~做什么事都要专心哦~~" }
          : getPetInfoOne("ill", "activeOption")
            ? {
                msg:
                  (getPetInfoOne("ill", "activeOption").type === "dead" ? "您的宠物已死亡~" : "") ||
                  getPetInfoOne("host", "info") + "~我生病，等我治疗好了再上学吧~~",
              }
            : { ...payload, msg: getPetInfoOne("host", "info") + "~确定要学习" + payload.tolkName + "吗？" };

      vm.webContents.send("control_bus-html_setActiveData", {
        data: result,
        type: "err",
      });
      return;
    }

    if (petControl.Goods.activeStudy(payload)) {
      console.log("close mm");
      this.changeState({ type: "menu" });
    }
  }

  usePinkDiamond(vm, payload) {
    const yb = +getPetInfoOne("yb", "info");
    if (yb - 200 < 0) {
      vm.webContents.send("control_bus-html_backDetermine", {
        event: "winShow",
        text: `当前元宝￥${yb} ，还差￥${200 - yb}元宝，我可用打工、养鱼赚钱的~~`,
      });
      return;
    }

    let otherOptions = {};
    let extraData = {};
    if (getPetInfoOne("pinkDiamond", "otherOptions")) {
      otherOptions = {
        pinkDiamondExpirationDate: getPetInfoOne("pinkDiamondExpirationDate", "otherOptions") + hourTime * payload.val.day,
        growthValue: payload.val.growth,
      };
    } else {
      otherOptions = {
        pinkDiamond: true,
        pinkDiamondBeginDate: tool.getDayHourTime(),
        pinkDiamondExpirationDate: tool.getDayHourTime() + hourTime * payload.val.day,
        growthValue: payload.val.growth,
        pinkDiamondLevel: getPetInfoOne("pinkDiamondLevel", "otherOptions") || 1,
      };
      extraData = pinkDiamondLevel.toChangeOtherDatas({
        ...getPetInfoOne("", "otherOptions"),
        ...otherOptions,
      });
    }

    console.log("opts", extraData);
    setPetInfo({
      otherOptions,
      info: { yb: yb - 200 },
      ...extraData,
    });

    vm.webContents.send("control_bus-html_backDetermine", {
      event: "winShow",
      text: "您已开通粉钻会员，到期时间： " + tool.getTime({ defaultTime: otherOptions.pinkDiamondExpirationDate, format: "YY-MM-DD" }),
    });
  }

  determine(vm, raw) {
    let payload = raw;
    try {
      payload = JSON.parse(raw);
    } catch (e) {}

    const petInfo = getPetInfo();
    let data = {};
    if (payload.type === "cure") {
      data = petInfo.activeOption.ill
        ? {
            type: "icon",
            icon: `../assets/img_res/medicine/${petInfo.activeOption.ill.cure.icon}.gif`,
            tipMsg: petInfo.activeOption.ill.tolk,
            msg:
              petInfo.activeOption.ill.type === "dead"
                ? "您的宝贝已死亡，需要" + petInfo.activeOption.ill.cure.name + "进行复活~~"
                : "您的宝贝得了" + petInfo.activeOption.ill.name + "，需要" + petInfo.activeOption.ill.cure.name + "来来治疗哦~~~",
          }
        : { type: "msg", msg: getPetInfoOne("host", "info") + " 我很健康哦~~~" };
    }

    vm.webContents.send("control_bus-html_backDetermine", {
      data,
      type: payload.type,
    });
  }

  openWindow(raw) {
    let payload = raw;
    try {
      payload = JSON.parse(raw);
    } catch (e) {}

    if (payload.value === "status") {
      const stateInfo = _require("../stateInfo/main");
      const bounds = global.windowsMain?.wins?.main?.win?.getBounds?.();
      const nowPosition = bounds ? [bounds.x, bounds.y] : [0, 0];
      stateInfo.show ? stateInfo.doClose() : stateInfo.cleate({ nowPosition, msg: "msg fo stateInfo" });
      return;
    }

    openLocalHost((hostInfo) => {
      console.log("url", hostInfo);
      if (payload.value === "hlyg") {
        if (!fishing.show) fishing.cleate(hostInfo);
        else fishing.doClose();
      } else if (payload.value === "mstx") {
        if (!backRoom.show) backRoom.cleate(hostInfo);
        else backRoom.doClose();
      }
    });
  }

  useInState(payload = {}) {
    setTimeout(() => {
      this.doShow(true);
    }, 0);
    this.state = payload.type;
    if (this.window) {
      this.window.webContents.send("control_bus-html_viewStyle", {
        type: this.state,
        opt: payload.opt || null,
      });
    }
  }

  doHide(force) {
    if (this.show || force) this.window.hide();
  }

  doShow(force) {
    if (!this.show || force) this.window.show();
  }

  doClose() {
    this.window.close();
    this.show = false;
  }
}

const main = new mainClass();
module.exports = main;
