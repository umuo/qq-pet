(() => {
  var e = {};
  var t = e => {
    console.log("window.electronAPI.urlWindow_h_bus", window.electronAPI.urlWindow_h_bus);
    window.electronAPI.urlWindow_h_bus(e);
  };
  const s = {
    data: () => ({
      toSee: null,
      def: "https://www.baidu.com",
      iframeUrl: "https://www.bilibili.com/video/BV1G2ApeQEm7/?spm_id_from=333.788.player.switch&vd_source=71a2601007cdb14733da4b4447451271&p=22",
      urls: "https://www.bilibili.com/video/BV1G2ApeQEm7/?spm_id_from=333.788.player.switch&vd_source=71a2601007cdb14733da4b4447451271&p=22",
      useUrl: [],
      cantdo: false,
      opacity: 0.2,
      mouseMove: null,
      mouseMoveOP: null,
      isPenetrate: false,
      disable: false,
      current: 0,
      leftText: "<",
      open: false,
      scrollTime: null
    }),
    computed: {},
    created() {
      if (this.def) {
        this.iframeUrl = this.def;
        this.urls = this.def;
        this.useUrl.push(this.urls);
      }
    },
    mounted() {
      this.doMousePenetrate();
      window.open;
      window.electronAPI.urlWindow_m_bus((e, s) => {
        if (s.type == "load") {
          seeApp();
          t({
            event: "tourl",
            url: this.iframeUrl
          });
        } else if (s.type == "setUrl") {
          console.log(s.data.type, s.data.url);
          this.addPage(s.data.url);
        }
      });
      t({
        event: "mounted"
      });
    },
    methods: {
      doMousePenetrate() {
        let e = false;
        let s = 0;
        this.mouseMove = new move({
          id: "appMain",
          mousemove: (i, r) => {
            let l = !i.target.hasAttribute("cantdo");
            if (this.isPenetrate != l) {
              this.isPenetrate = l;
              window.electronAPI.urlWindow_h_bus_m_eventMouse({
                canDoType: this.isPenetrate
              });
            }
            if (e) {
              let e = s - i.screenY;
              s = i.screenY;
              let r = Math.min(Math.max(this.opacity + e / 100, 0), 1);
              this.opacity = r;
              t({
                event: "copacity",
                opacity: this.opacity
              });
            }
          },
          mouseup: t => {
            e &&= false;
          },
          mouseout: t => {
            if (e) {
              e = false;
            } else {
              this.isPenetrate = true;
              window.electronAPI.urlWindow_h_bus_m_eventMouse({
                canDoType: this.isPenetrate
              });
            }
          }
        }).init();
        this.mouseMoveOP = new move({
          id: "oppp",
          mousedown: t => {
            e = true;
            s = t.screenY;
          }
        }).init();
        const i = e => {
          let s = e.deltaY < 0 ? 0.05 : -0.05;
          this.opacity = Math.min(Math.max(this.opacity + s, 0), 1);
          t({
            event: "copacity",
            opacity: this.opacity
          });
        };
        this.mouseMoveOP.moveDom.addEventListener("wheel", i, false);
        this.mouseMoveOP.moveDom.addEventListener("mousewheel", i, false);
      },
      handleSubmit() {
        console.log("this.urls", this.urls);
        if (this.urls) {
          this.addPage(this.urls);
        } else {
          this.urls = this.useUrl[this.current];
        }
      },
      closeWindow() {
        console.log("close");
        t({
          event: "close"
        });
      },
      changeDisable() {
        this.disable = !this.disable;
        t({
          event: "czd",
          disable: this.disable
        });
      },
      addPage(e) {
        if (e == this.useUrl[this.current]) {
          return;
        }
        let s = this.useUrl.indexOf(e);
        if (s != -1) {
          console.log("item i c", s);
          this.changeUrl(e);
          return;
        }
        if (this.useUrl[this.current + 1]) {
          this.useUrl.splice(this.current + 1, this.useUrl.length, e);
        } else {
          this.useUrl.push(e);
        }
        this.current = this.useUrl.length - 1;
        this.urls = this.useUrl[this.current];
        this.iframeUrl = this.useUrl[this.current];
        t({
          event: "tourl",
          url: this.iframeUrl
        });
        setTimeout(() => {
          this.toPageScrollTop();
        }, 0);
      },
      nextPage() {
        if (this.useUrl[this.current + 1]) {
          this.current = this.current + 1;
          this.urls = this.useUrl[this.current];
          this.iframeUrl = this.useUrl[this.current];
          t({
            event: "tourl",
            url: this.iframeUrl
          });
          this.toPageScrollTop();
        }
      },
      upPage() {
        if (this.current > 0) {
          this.current = this.current - 1;
          this.urls = this.useUrl[this.current];
          this.iframeUrl = this.useUrl[this.current];
          t({
            event: "tourl",
            url: this.iframeUrl
          });
          this.toPageScrollTop();
        }
      },
      changeUrl(e) {
        if (e == this.iframeUrl) {
          return;
        }
        let s = this.useUrl.indexOf(e);
        if (s != -1) {
          console.log("i", e, s);
          this.current = s;
          this.urls = this.useUrl[this.current];
          this.iframeUrl = this.useUrl[this.current];
          t({
            event: "tourl",
            url: this.iframeUrl
          });
          this.toPageScrollTop();
        }
      },
      toPageScrollTop() {
        if (this.scrollTime) {
          clearTimeout(this.scrollTime);
        }
        this.scrollTime = setTimeout(() => {
          let e = document.getElementById("urlsFloats" + this.current);
          if (e) {
            e.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }
        }, 100);
      },
      deleteUrl(e) {
        let t = this.useUrl.indexOf(e);
        if (t != -1) {
          if (e == this.iframeUrl) {
            this.useUrl.splice(t, 1);
            if (this.useUrl[t]) {
              console.log("item", this.useUrl, t);
              this.changeUrl(this.useUrl[t]);
            } else if (this.useUrl[t - 1]) {
              console.log("item i", t);
              this.changeUrl(this.useUrl[t - 1]);
            }
          } else {
            this.useUrl.splice(t, 1);
          }
        }
      },
      changeOpen() {
        this.open = !this.open;
      }
    }
  };
  Vue.createApp(s).mount("#app");
  var i = window;
  for (var r in e) {
    i[r] = e[r];
  }
  if (e.__esModule) {
    Object.defineProperty(i, "__esModule", {
      value: true
    });
  }
})();
