(() => {
  var e = {};
  var t = e => {
    window.electronAPI.setup_h_bus(e);
  };
  const s = {
    data: () => ({
      leftMenu: [{
        label: "全局设置",
        value: "globalSettings",
        children: [{
          label: "重生为另一个性别~~~（注意数据丢失）",
          type: "buts",
          value: "sex"
        }, {
          label: "有其他屏幕接入？我也想去~~",
          type: "buts",
          value: "newScreen"
        }, {
          label: "宠物不见了？点我试试~~",
          type: "buts",
          value: "homing"
        }, {
          label: "透明度",
          type: "slider",
          value: "opacity"
        }, {
          label: "开机自启",
          type: "radio",
          value: "startupSelf"
        }, {
          label: "暂停成长",
          type: "radio",
          value: "stopGrowth"
        }, {
          label: "开启免打扰模式",
          type: "radio",
          value: "doNotDisturb"
        }]
      }, {
        label: "工具-玩~",
        value: "tools",
        children: [{
          label: "打开屏幕辅助工具，好玩尝试下~",
          type: "radio",
          value: "floatStyle"
        }, {
          label: "打开swf文件查看器，无需Flash插件~",
          type: "buts",
          value: "viewSwf"
        }, {
          label: "打开控制透明浏览器，你懂得~",
          type: "buts",
          value: "urlWindowOpen"
        }, {
          label: "实时监听播报剪切板",
          type: "radio",
          value: "clip"
        }, {
          label: "说明书~~",
          type: "buts",
          value: "urlWindow"
        }]
      }, {
        label: "快捷键设置",
        value: "keyboardShortcuts",
        children: [{
          label: "设置",
          type: "shortcutKeys",
          value: "openStting"
        }, {
          label: "截图",
          type: "shortcutKeys",
          value: "screenshot"
        }, {
          label: "开启上帝模式",
          type: "shortcutKeys",
          value: "god"
        }]
      }, {
        label: "关于",
        value: "about",
        children: [{
          label: "基本信息",
          type: "see",
          vType: "html",
          value: "版本：1.7.3<br />作者：动琴弦🎸 🎸 🇨🇳 💿<br />",
          values: []
        }, {
          label: "检查更新~~",
          type: "buts",
          value: "newProgram"
        }]
      }, {
        label: "赞助",
        value: "about",
        children: []
      }, {
        label: "LOG",
        value: "about",
        children: []
      }, {
        label: "AI对话",
        value: "aiSettings",
        children: [{
          label: "启用 AI 对话",
          type: "radio",
          value: "llmEnabled"
        }, {
          label: "API URL (OpenAI 格式)",
          type: "input",
          value: "llmUrl",
          placeholder: "https://api.openai.com/v1"
        }, {
          label: "API Key",
          type: "input",
          value: "llmApiKey",
          placeholder: "sk-...",
          inputType: "password"
        }, {
          label: "模型名称",
          type: "input",
          value: "llmModel",
          placeholder: "gpt-3.5-turbo / deepseek-chat"
        }, {
          label: "测试连接",
          type: "buts",
          value: "testLlm"
        }]
      }, {
        label: "专注守护",
        value: "focusGuard",
        children: [{
          label: "启用专注守护",
          type: "radio",
          value: "focusEnabled"
        }, {
          label: "专注/护眼提醒（25分钟）",
          type: "radio",
          value: "focusEyeReminder"
        }, {
          label: "久坐提醒（50分钟）",
          type: "radio",
          value: "focusSedentaryReminder"
        }, {
          label: "深夜劝睡（22点后）",
          type: "radio",
          value: "focusLateNightReminder"
        }, {
          label: "长时间未操作回归问候",
          type: "radio",
          value: "focusWelcomeBack"
        }]
      }],
      activeMenu: -1,
      seeChildren: [],
      isChangeSysData: {},
      sysData: {
        clip: false,
        doNotDisturb: false,
        stopGrowth: false,
        screenshot: [],
        god: [],
        openStting: [],
        opacity: 1,
        llmEnabled: false,
        llmUrl: "https://api.deepseek.com/v1",
        llmApiKey: "",
        llmModel: "",
        focusEnabled: false,
        focusEyeReminder: true,
        focusSedentaryReminder: true,
        focusLateNightReminder: true,
        focusWelcomeBack: true
      },
      mouse: null,
      isSetKey: null,
      useKeys: [["ALT", "SHIFT", "CONTROL"], ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "/", "*", "-", "+", ".", "ENTER"]]
    }),
    computed: {},
    created() {},
    mounted() {
      this.chooseMenu(0);
      window.electronAPI.setup_m_bus((e, t) => {
        if (t?.version) {
          this.leftMenu[3].children[0].value = `版本：${t.version}<br />作者：动琴弦🎸 🎸 🇨🇳 💿<br />`;
        }
        if (t.type == "load") {
          console.log("load");
          seeApp();
        } else if (t.type == "HaveUpdate") {
          console.log("leftMenu", this.leftMenu[3].children[1]);
        } else if (t.type == "showLog") {
          this.leftMenu[3].children[0].values = t.mvs || [];
          this.leftMenu[4].children = t.zz || [];
          this.leftMenu[5].children = t.data || [];
        }
      });
      window.electronAPI.setup_m_sysInfo((e, t) => {
        let s = t.data;
        try {
          s = JSON.parse(s);
        } catch (e) {}
        for (let e in s) {
          if (!this.isSetKey || e != "screenshot") {
            this.sysData[e] = s[e];
          }
        }
      });
      t({
        event: "mounted"
      });
    },
    methods: {
      saveChange() {
        window.electronAPI.setup_h_setStting({
          data: JSON.stringify(this.isChangeSysData),
          type: "saveChange"
        });
        this.isChangeSysData = {};
      },
      saveChangeData(e, t) {
        this.isChangeSysData[e] = t;
      },
      changeShortKeysBut(e, t) {
        let s = e.value + "-" + t;
        if (this.isSetKey != s) {
          this.isSetKey = s;
          if (this.isSetKey) {
            this.addEventListenerKeyOn(e, t);
          }
        } else {
          this.closeShortKey();
        }
      },
      closeShortKey() {
        this.isSetKey = null;
        this.addEventListenerKeyOff();
      },
      addEventListenerKeyOn() {
        this.addEventListener({
          mousedown: e => {
            if (e.which == 1) {
              if (e.target.hasAttribute("cancel")) {
                this.closeShortKey();
              }
            } else if (e.which != 2) {
              e.which;
            }
          },
          keydown: (e, t) => {
            if (!this.isSetKey) {
              this.addEventListenerKeyOff();
            }
            let s = this.isSetKey.split("-");
            let a = t.key.toUpperCase() + "";
            if (a == "ESCAPE") {
              this.closeShortKey();
            }
            if (this.useKeys[s[1]].includes(a)) {
              this.sysData[s[0]][s[1]] = a;
              this.saveChangeData(s[0], {
                changeValue: s[0],
                type: "shortcutKeys",
                changeKey: this.sysData[s[0]]
              });
              this.closeShortKey();
            }
          }
        });
      },
      addEventListener(e) {
        this.mouse ||= new move({
          id: "appMain",
          ...e
        });
        this.mouse.init();
      },
      addEventListenerKeyOff() {
        if (this.mouse) {
          this.mouse.destroy();
        }
      },
      setStting(e, t) {
        e = {
          ...e,
          data: this.sysData[e.value]
        };
        if (t) {
          e.useType = t;
        }
        if (e.type == "buts" && e.value == "getOption") {
          this.getInputSrc({
            fn: t => {
              e.src = t;
              window.electronAPI.setup_h_setStting({
                data: JSON.stringify(e)
              });
            }
          });
        } else {
          window.electronAPI.setup_h_setStting({
            data: JSON.stringify(e)
          });
        }
      },
      getInputSrc(e) {
        let {
          fn: t
        } = e;
        let s = document.createElement("input");
        s.setAttribute("type", "file");
        s.setAttribute("webkitdirectory", "true");
        s.setAttribute("multiple", "");
        s.setAttribute("accept", ".epk");
        s.addEventListener("change", function (e) {
          var a = this.files[0].path;
          t(a);
          s.remove();
        });
        document.body.appendChild(s);
        s.click();
      },
      chooseMenu(e) {
        if (this.activeMenu != e) {
          this.closeShortKey();
          this.activeMenu = e;
          this.seeChildren = this.leftMenu[this.activeMenu]?.children || [];
        }
      },
      closeWindow() {
        t({
          event: "close"
        });
      }
    }
  };
  Vue.createApp(s).mount("#app");
  var a = window;
  for (var l in e) {
    a[l] = e[l];
  }
  if (e.__esModule) {
    Object.defineProperty(a, "__esModule", {
      value: true
    });
  }
})();
