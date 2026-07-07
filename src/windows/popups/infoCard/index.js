(() => {
  var e = {};
  var t = e => {
    window.electronAPI.infoCard_ToMain(e);
  };
  const n = {
    data: () => ({
      petInfo: {},
      imgSrc: "",
      petName: "",
      host: "",
      maxlength: 8,
      errInput: [1, 1]
    }),
    computed: {
      pinkDiamondMainTtitle() {
        return `当前成长速度：${this.petInfo?.otherOptions?.growthValue || 0}/每天,到期时间：${this.petInfo?.pinkDiamondStr?.lostTime}`;
      }
    },
    created() {},
    mounted() {
      window.electronAPI.infoCard_ToHtml((e, t) => {
        if (t.type == "load") {
          seeApp();
        }
      });
      window.electronAPI.infoCard_ToHtmlPetInfo((e, t) => {
        if (t.type == "info") {
          this.petInfo = t.data;
          this.host = this.petInfo.info.host;
          this.petName = this.petInfo.info.name;
          this.getImgSrc();
        }
      });
      t({
        event: "mounted"
      });
    },
    methods: {
      changeName(e, t) {
        if (!(e + "")) {
          this.errInput[t == "name" ? 0 : 1] = 0;
          return;
        }
        this.errInput[t == "name" ? 0 : 1] = 1;
        let n = {
          [t]: e
        };
        window.electronAPI.infoCard_ToMain_Change(n);
      },
      getImgSrc() {
        let e = 1;
        let t = this.petInfo.maxInfo.level;
        if (t > 5 && t < 10) {
          e = 2;
        } else if (t >= 10) {
          e = 3;
        }
        this.imgSrc = "../assets/info/" + this.petInfo.info.sex + e + ".svg";
      },
      closeWindow() {
        t({
          event: "close"
        });
      }
    }
  };
  Vue.createApp(n).mount("#app");
  var o = window;
  for (var i in e) {
    o[i] = e[i];
  }
  if (e.__esModule) {
    Object.defineProperty(o, "__esModule", {
      value: true
    });
  }
})();
