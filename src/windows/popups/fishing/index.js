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
          e.url = r.data;
          seeApp();
          setTimeout(() => {
            let e = document.querySelector("iframe");
            console.log("ifram", e);
            e.addEventListener("load", e => {
              (t = e.target.contentWindow.window).getPetInfoFromMain = function () {
                console.log("getInfo");
                o({
                  event: "getInfo"
                });
              };
              t.saveInfoData = e => {
                console.log("datas", e);
                o({
                  event: "saveDatas",
                  data: e
                });
              };
              t.close_game = () => {
                o({
                  event: "close"
                });
              };
              setTimeout(() => {
                t.selfeLoad = true;
                console.log("selfeLoad", t);
              }, 0);
            });
          }, 0);
        } else if (r.type == "setPetInfo" && t) {
          t.setPetInfo(r.data);
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
