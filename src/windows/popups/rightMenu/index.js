const sendToMain = (event) => {
  window.electronAPI.rightMenu_h_bus(event);
};

const menuWidth = 130;
const windowPadding = 10;

const app = {
  data: () => ({
    menu: [
      {
        label: "喂养宠物",
        value: "feeding",
        fn: 1,
        children: [
          { label: "喂养", value: "food" },
          { label: "清洗", value: "clean" },
          { label: "吃药", value: "cure" },
        ],
      },
      { label: "AI 智能助手 🤖", value: "openAiChat" },
      { label: "动作展览馆", value: "openSwfViewer" },
      { label: "小游戏", value: "smallGame" },
      { label: "商城", value: "openStore" },
      {
        label: "设置及帮助",
        value: "settingsAndHelp",
        children: [
          { label: "开启免打扰", value: "openMute" },
          { label: "宠物资料", value: "petInfo" },
          { label: "系统设置", value: "openSetup" },
        ],
        fn: 1,
      },
      { label: "停止成长", value: "stopGrowth" },
      { label: "调试控制台", value: "openDevTools" },
      { label: "退出宠物", value: "quit" },
    ],
    activeFatherValue: null,
    activeSunValue: null,
    positionType: null,
    menuSide: "right",
    sunBkBodyStyle: { transform: "translateX(-100%) translateY(-40%)" },
    menuMainStyle: { position: "fixed", bottom: "0", left: "50%" },
  }),
  mounted() {
    this.doMousePenetrate();
    window.electronAPI.rightMenu_m_bus((event, payload) => {
      if (payload.type === "load") {
        this.positionType = payload.positionType;
        this.menuSide = payload.menuSide || "right";
        this.applyPositionStyle();
        seeApp();
      } else if (payload.type === "changeMenu" && payload?.where?.length > 0 && payload?.data) {
        this.changeMenu(payload.data, payload.where);
      }
    });
    sendToMain({ event: "mounted" });
  },
  methods: {
    getWhere(index) {
      return index - 1;
    },
    applyPositionStyle() {
      if (this.positionType !== "followMain") return;

      this.menu[8].unShow = true;
      this.menuMainStyle.bottom = "20px";

      if (this.menuSide === "left") {
        this.menuMainStyle.left = `calc(100% - ${menuWidth + windowPadding}px)`;
        this.sunBkBodyStyle.transform = "translateX(-100%) translateY(-40%)";
      } else {
        this.menuMainStyle.left = `${windowPadding}px`;
        this.sunBkBodyStyle.transform = "translateX(100%) translateY(-40%)";
      }
    },
    changeMenu(item, where) {
      if (where.length === 1) {
        const first = this.getWhere(where[0]);
        if (where?.[0] && this.menu[first]) this.menu[first] = item;
        return;
      }

      if (where.length === 2) {
        const first = this.getWhere(where[0]);
        const second = this.getWhere(where[1]);
        if (where?.[0] && where?.[1] && this.menu[first].children[second]) {
          this.menu[first].children[second] = item;
        }
      }
    },
    chooseItem(item, index, type) {
      if (item.state === "none") return;
      if (item?.fn) {
        if (typeof item.fn === "function") item.fn({ item, type, id: index });
        return;
      }

      const data = JSON.stringify({
        ...item,
        type,
        label: item.value,
        id: index,
      });
      window.electronAPI.rightMenu_h_setItem({ data });
    },
    doMousePenetrate() {
      this.mouseMove = new move({
        id: "appMain",
        mousemove: (event) => {
          const target = event?.target;
          const canDoType = !!target?.hasAttribute?.("cando");
          if (this.isPenetrate !== canDoType) {
            this.isPenetrate = canDoType;
            window.electronAPI.rightMenu_h_eventMouse({ canDoType: this.isPenetrate });
          }

          if (this.isPenetrate) {
            const fv = target.getAttribute("fv");
            const sv = target.getAttribute("sv");
            if (fv || fv == null) {
              this.setFv(fv);
            }
            if (sv || sv == null) {
              this.setSv(sv);
            }
          } else {
            this.setFv(null);
            this.setSv(null);
          }
        },
      }).init();
    },
    setFv(value) {
      if (this.activeFatherValue !== value) this.activeFatherValue = value;
    },
    setSv(value) {
      if (this.activeSunValue !== value) this.activeSunValue = value;
    },
    closeWindow() {
      sendToMain({ event: "close" });
    },
  },
};

Vue.createApp(app).mount("#app");
