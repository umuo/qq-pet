(() => {
  var t = {};
  var e = t => {
    window.electronAPI.tip_h_bus(t);
  };
  const s = {
    data: () => ({
      submitText: "确定",
      msgOpt: {
        data: "没有消息哦~~"
      },
      tipBackground: {
        backgroundImage: "url(\"../assets/tip/normal/14.svg\")"
      },
      sweetHeart: false,
      tipMainSweetHeart: {
        maxWidth: "68%"
      }
    }),
    computed: {},
    created() {},
    mounted() {
      this.doMousePenetrate();
      window.electronAPI.tip_m_bus((t, e) => {
        if (e.type == "load") {
          if (e.data) {
            try {
              this.msgOpt = JSON.parse(e.data);
            } catch (t) {}
          }
          seeApp();
        } else if (e.type == "nextData" && e.data) {
          try {
            this.msgOpt = JSON.parse(e.data);
            console.log("this.msgOpt", this.msgOpt);
          } catch (t) {}
        }
      });
      window.electronAPI.tip_m_setData((t, e) => {
        if (this.sweetHeart != e.data?.sweetHeart) {
          this.sweetHeart = e.data.sweetHeart;
          this.tipBackground.backgroundImage = this.sweetHeart ? "url(\"../assets/tip/heart/10.svg\")" : "url(\"../assets/tip/normal/14.svg\")";
        }
      });
      e({
        event: "mounted"
      });
    },
    methods: {
      submit(t) {
        let e = {
          closeType: t,
          submitText: this.submitText,
          msgOpt: this.msgOpt
        };
        this.closeWindow(e);
      },
      doMousePenetrate() {},
      closeWindow(t) {
        e({
          event: "close",
          data: JSON.stringify(t)
        });
      }
    }
  };
  Vue.createApp(s).mount("#app");
  var a = window;
  for (var i in t) {
    a[i] = t[i];
  }
  if (t.__esModule) {
    Object.defineProperty(a, "__esModule", {
      value: true
    });
  }
})();
