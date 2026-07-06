const sendToMain = (event) => {
  window.electronAPI.control_ToMain(event);
};

const activeDefs = {
  status: {
    value: "status",
    name: "状态",
    type: "openWindow",
    icon: "../assets/control/icons/chongwu.png",
  },
  food: {
    value: "food",
    type: "food",
    name: "食物",
    icon: "../assets/control/icons/weishi.png",
    foot: "hunger",
  },
  clean: {
    value: "clean",
    type: "commodity",
    name: "清洁",
    icon: "../assets/control/icons/qingjie.png",
    foot: "clean",
  },
  cure: {
    value: "cure",
    type: "medicine",
    name: "吃药",
    icon: "../assets/control/icons/zhibing.png",
    foot: "cure",
  },
  work: {
    value: "work",
    type: "work",
    name: "打工",
    icon: "../assets/control/icons/dagong.png",
  },
  study: {
    value: "study",
    type: "study",
    name: "学习",
    icon: "../assets/control/icons/xuexi.png",
  },
  trip: {
    value: "trip",
    type: "trip",
    name: "旅游",
    icon: "../assets/control/icons/lvyou.png",
  },
  friend: {
    value: "friend",
    name: "好友",
    icon: "../assets/control/icons/haoyou.png",
  },
  play: {
    value: "play",
    name: "玩耍",
    icon: "../assets/control/icons/wanshua.png",
  },
  hlyg: {
    value: "hlyg",
    name: "渔港",
    type: "openWindow",
    icon: "../assets/control/icons/hlyg.png",
  },
  mstx: {
    value: "mstx",
    name: "密室",
    type: "openWindow",
    icon: "../assets/control/icons/mstx.png",
  },
  fz: {
    value: "fz",
    type: "fz",
    name: "开粉",
    icon: "../assets/control/icons/fenzhuan.png",
  },
  task: {
    value: "task",
    type: "task",
    name: "任务",
    icon: "../assets/control/icons/renwu.png",
    class: "activeTask",
    children: [
      { useType: "online", iconTitle: "url(../assets/tip/gift/6.svg)" },
      { useType: "sign", iconTitle: "url(../assets/tip/gift/4.svg)" },
    ],
  },
};

const app = {
  data: () => ({
    isPenetrate: false,
    paddingTopMain: 0,
    petInfo: {
      hunger: { label: "饥饿：", value: [0, 0], background: "hongse" },
      clean: { label: "清洁：", value: [0, 0], background: "hongse" },
      cure: { label: "健康：", value: [0, 0], background: "hongse" },
    },
    activeMenu: false,
    saveActiveMenu: false,
    doActive: false,
    doActiveMenu: null,
    mouseMove: null,
    menus: [
      {
        name: "日常",
        icon: "../assets/control/icons/richang.png",
        children: [activeDefs.status, activeDefs.food, activeDefs.clean, activeDefs.cure],
      },
      {
        name: "交互",
        icon: "../assets/control/icons/chongwu.png",
        children: [activeDefs.work, activeDefs.study, activeDefs.trip],
      },
      {
        name: "活动",
        icon: "../assets/control/icons/gonggao.png",
        children: [activeDefs.task, activeDefs.hlyg, activeDefs.fz],
      },
    ],
    activeList: [],
    total: 1,
    current: 1,
    pageSize: 4,
    useActiveLoading: false,
    mousePosition: [0, 0],
    tipMainPosition: [0, 0],
    tipOpt: null,
    activeUseData: {},
    taskMsg: [
      { class: "wait" },
      { class: "take", label: "可领取", icon: "url(../assets/tip/gift/61.svg)" },
      { class: "taked", label: "已领取", icon: "url(../assets/tip/gift/60.svg)" },
    ],
    winShow: false,
    winShowText: "",
    winType: "",
  }),
  mounted() {
    this.doMousePenetrate();

    window.electronAPI.control_ToHtml((event, payload) => {
      if (payload.type === "load") {
        this.paddingTopMain = payload.paddingTopMain;
        seeApp();
      }
    });

    window.electronAPI.control_ToHtml_viewStyle((event, payload) => {
      if (payload.type === "hide") {
        this.activeMenu = false;
        this.winShow = false;
        this.winShowText = "";
        this.winType = "";
        this.isHide();
      } else if (payload.type !== "menu" || this.doActive) {
        if (payload.type === "active" && payload.opt.value) {
          this.chooseOnce({ value: payload.opt.value });
        }
      } else {
        this.activeMenu = true;
      }
    });

    let petInfoTimer = 0;
    window.electronAPI.control_ToHtml_gePetInfo((event, payload) => {
      const activeFoot = this.doActiveMenu?.foot;
      const activeFootVisible = ["hunger", "clean", "cure"].includes(activeFoot);

      if (payload.type !== "info" || !activeFootVisible) {
        if (payload.type !== "info" || petInfoTimer) return;

        const updateInfo = () => {
          const nextInfo = {};
          for (const key in payload.data) {
            const percent = payload.data[key].now / payload.data[key].max;
            nextInfo[key] = {
              label: key === "hunger" ? "饥饿：" : key === "clean" ? "清洁：" : "健康：",
              value: [payload.data[key].now + "", payload.data[key].max + ""],
              background: percent > 0.6 ? "shenglan" : percent > 0.3 ? "huangse" : "hongse",
            };
          }
          this.petInfo = nextInfo;
        };

        if (petInfoTimer === 0) updateInfo();
        petInfoTimer = setTimeout(() => {
          updateInfo();
          petInfoTimer = null;
        }, 60000);
        return;
      }

      const percent = payload.data[activeFoot].now / payload.data[activeFoot].max;
      this.petInfo[activeFoot] = {
        label: activeFoot === "hunger" ? "饥饿：" : activeFoot === "clean" ? "清洁：" : "健康：",
        value: [payload.data[activeFoot].now + "", payload.data[activeFoot].max + ""],
        background: percent > 0.6 ? "shenglan" : percent > 0.3 ? "huangse" : "hongse",
      };
    });

    window.electronAPI.control_ToHtml_setActiveData((event, payload) => {
      console.log(" msg.data.result :>> ", payload, this.doActiveMenu);
      this.useActiveLoading = false;

      if (payload.type === "err") {
        console.log("msg :>> ", payload);
        if (payload.data.overType === "dead") {
          this.seeTip({ msg: "您的宠物已死亡，请用还魂丹进行复活~~" });
          return;
        }
        if (payload.data.type === "medicine") {
          this.seeTip({ msg: payload.data.ill ? "主人，吃错药了,我好难受~" : "主人 我很健康哦~~" });
          return;
        }
        if (payload?.data?.msg) this.seeTip({ msg: payload.data.msg, data: payload.data });
        return;
      }

      if (payload.type === "stopGrowth") {
        this.seeTip({ msg: "您的宠物暂停成长中~~" });
        return;
      }

      if (payload.type === this.doActiveMenu?.type) {
        this.activeList = payload.data.result;
        console.log(" msg.data.result :>> ", payload.data.result);
        if (this.activeList?.length % 4 !== 0 && this.activeList?.length !== 0) {
          for (let i = 4 - (this.activeList.length % 4); i > 0; i--) this.activeList.push({});
        }
        this.total = payload.data.total;
        this.current = payload.data.current;
        console.log("this.a :>> ", this.activeList);
      }
    });

    window.electronAPI.control_ToHtml_backDetermine((event, payload) => {
      if (payload.event === "winShow") {
        this.winShowText = payload.text;
        this.winType = "";
        this.winShow = true;
        return;
      }
      this.tipOpt = payload.data;
      this.tipMainPosition = this.mousePosition;
    });

    sendToMain({ event: "mounted" });
  },
  methods: {
    changeChildren(index) {
      if (this.activeUseData?.i === index) return;
      this.activeUseData = { ...this.doActiveMenu.children[index], i: index };
      this.current = 1;
      window.electronAPI.control_ToMain_getActiveData(
        JSON.stringify({ ...this.doActiveMenu, ...this.activeUseData, pageSize: this.pageSize, current: this.current }),
      );
    },
    closeTip(closeOnly) {
      console.log("close", closeOnly);
      if (closeOnly) {
        this.tipOpt = null;
      } else {
        if (this.tipOpt?.data && (this.tipOpt?.data.type === "work" || this.tipOpt?.data.type === "study")) {
          this.useGood({ ...this.tipOpt.data, activeIt: true });
        }
        this.tipOpt = null;
        this.doActive = null;
        sendToMain({ event: "mainFocus" });
      }
    },
    seeTip(payload) {
      if (payload.type !== "cure") {
        this.tipOpt = payload;
        this.tipMainPosition = this.mousePosition;
      } else {
        window.electronAPI.control_ToMain_determine(JSON.stringify({ ...payload }));
      }
    },
    useGood(item, index = 0) {
      if (item.isTake !== 1 && item.isTake != null) return;
      this.useActiveLoading = true;
      window.electronAPI.control_ToMain_useActiveData(
        JSON.stringify({ ...item, inIndex: index, ...this.activeUseData, pageSize: this.pageSize, current: this.current }),
      );
    },
    nextPage(next) {
      if (next) {
        if (this.total - this.current > 0) this.current++;
      } else if (this.current - 1 >= 1) {
        this.current--;
      }
      window.electronAPI.control_ToMain_getActiveData(
        JSON.stringify({ ...this.doActiveMenu, ...this.activeUseData, pageSize: this.pageSize, current: this.current }),
      );
    },
    closeActive() {
      this.doActive = false;
      this.doActiveMenu = null;
      if (this.saveActiveMenu) {
        this.activeMenu = true;
        this.saveActiveMenu = false;
        this.saveActiveList = [];
        this.activeList = [];
        this.current = 1;
        sendToMain({ event: "focus" });
      }
      this.isHide();
    },
    chooseOnce(item, options = {}) {
      if (item.type === "openWindow") {
        window.electronAPI.control_ToMain_openWindow(JSON.stringify(item));
        return;
      }

      if (item.type === "fz") {
        this.winShowText = "是否花费300元宝购买5天粉钻特权，20成长值/天 ~~";
        this.winType = "fz";
        this.winShow = true;
        return;
      }

      this.doActiveMenu = null;
      if (this.activeMenu) {
        this.saveActiveMenu = true;
        this.activeMenu = false;
      }
      this.doActiveMenu = activeDefs[item.value];
      this.activeUseData = this.doActiveMenu?.children?.length
        ? { ...this.doActiveMenu.children[options.index || 0], i: options.index || 0 }
        : {};

      if (this.doActiveMenu) {
        this.doActive = true;
        window.electronAPI.control_ToMain_getActiveData(
          JSON.stringify({ ...this.doActiveMenu, ...this.activeUseData, pageSize: this.pageSize, current: 1 }),
        );
      }
    },
    doMousePenetrate() {
      this.mouseMove = new move({
        id: "appMain",
        mousemove: (event) => {
          const canDoType = event.target.hasAttribute("cando");
          if (this.isPenetrate !== canDoType) {
            this.isPenetrate = canDoType;
            window.electronAPI.control_ToMain_eventMouse({ canDoType: this.isPenetrate });
          }
          this.mousePosition = [event.clientX, event.clientY];
        },
      }).init();
    },
    isHide() {
      if (!this.activeMenu && !this.doActive) sendToMain({ event: "hide" });
    },
    closeWindow() {
      sendToMain({ event: "close" });
    },
    toPercent(value, total) {
      return (+value / +total) * 100 + "%";
    },
    closeTipWin(closeOnly) {
      if (closeOnly || !this.winType) this.winShow = false;
      if (!closeOnly && this.winType) {
        window.electronAPI.control_ToMain_useActiveData(
          JSON.stringify({ event: "winShow", val: { type: this.winType, day: 5, growth: 20 } }),
        );
      }
    },
  },
};

Vue.createApp(app).mount("#app");
