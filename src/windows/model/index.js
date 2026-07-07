(() => {
  var e = {};
  var o = e => {
    window.electronAPI.model_h_bus(e);
  };
  const d = {
    data: () => ({}),
    computed: {},
    created() {},
    mounted() {
      window.electronAPI.model_m_bus((e, o) => {
        if (o.type == "load") {
          seeApp();
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
      }
    }
  };
  Vue.createApp(d).mount("#app");
  var t = window;
  for (var n in e) {
    t[n] = e[n];
  }
  if (e.__esModule) {
    Object.defineProperty(t, "__esModule", {
      value: true
    });
  }
})();
