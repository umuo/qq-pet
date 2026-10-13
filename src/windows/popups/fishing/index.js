(() => {
  var e = {};
  var o = e => {
    window.electronAPI.fishing_h_bus(e);
  };
  var t = null;
  const s = {
    data: () => ({
      url: "",
      doerrIs: false,
      t: null
    }),
    computed: {},
    created() {},
    mounted() {
      let e = this;
      window.electronAPI.fishing_m_bus((s, r) => {
        console.log("msg", r);
        if (r.type == "load") {
          const frame = document.querySelector("iframe");
          frame.addEventListener("load", () => {
            t = frame.contentWindow;
            t.getPetInfoFromMain = () => o({ event: "getInfo" });
            t.saveInfoData = data => o({ event: "saveDatas", data });
            t.close_game = () => o({ event: "close" });
            window.__qqPetInstallHandCursor?.(t);
            t.selfeLoad = true;
          });
          // Register before navigating, including fast cached iframe loads.
          e.url = r.data;
          seeApp();
        } else if (r.type == "setPetInfo" && t) {
          t.setPetInfo(r.data);
        } else if (r.type == 'saveAck' && t) {
          t.ackFishSave?.(r.sequence);
        } else if (r.type == 'saveRejected' && t) {
          t.ackFishSave?.(r.sequence);
          t.restoreFishSave?.(r.data);
        }
      });
      o({
        event: "mounted"
      });
    },
    methods: {
      closeWindow() {
        o({
          event: "close"
        });
      },
      doError() {
        if (this.doerrIs) {
          console.log("iframeWindow?.errorFishesDo", t, t?.errorFishesDo);
          if (t?.errorFishesDo) {
            t.errorFishesDo();
          }
          this.doerrIs = false;
          if (this.t) {
            clearTimeout(this.t);
          }
        } else {
          this.doerrIs = true;
          this.t = setTimeout(() => {
            this.doerrIs = false;
            this.t = null;
          }, 5000);
        }
      }
    }
  };
  Vue.createApp(s).mount("#app");
  var r = window;
  for (var n in e) {
    r[n] = e[n];
  }
  if (e.__esModule) {
    Object.defineProperty(r, "__esModule", {
      value: true
    });
  }
})();
