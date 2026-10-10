(() => {
  var t = {};
  var e = t => {
    window.electronAPI.html_ToMain(t);
  };
  window.RufflePlayer = window.RufflePlayer || {};
  const i = {
    data: () => ({
      nowPosition: "",
      position: "center",
      maxSize: [144, 144],
      sizeStyle: {
        width: "144px",
        height: "144px"
      },
      loads: false,
      petContent: null,
      petInfo: {
        info: {},
        maxInfo: {},
        activeOption: {},
        otherOptions: {}
      },
      petControl: null,
      curState: false,
      swfPet: null,
      floatArr: []
    }),
    watch: {
      maxSize: {
        handler(t, e) {
          this.sizeStyle = {
            width: t[0] + "px",
            height: t[1] + "px"
          };
          this.setMainPosition([0, 0]);
        },
        deep: true
      }
    },
    computed: {},
    created() {
      window.addEventListener("message", t => {
        console.log("res father:>> ", t);
      }, false);
    },
    mounted() {
      window.electronAPI.html_ToMain_gameplayStorage?.({ raw: localStorage.getItem('localhost//test'), id: localStorage.getItem('qqpet:farm-session') });
      const cursor = { x: 0, y: 0 };
      window.API = {
        ...(window.API || {}),
        GetCursorPosition: () => `${cursor.x},${cursor.y},0`,
        GetWindowRect: () => `0,0,${innerWidth},${innerHeight}`
      };
      window.electronAPI.main_ToHtml_cursor((event, point) => {
        cursor.x = point.x;
        cursor.y = point.y;
      });
      this.loads = true;
      this.initPet();
      this.doMove();
      this.initInteractions();
      window.electronAPI.main_ToHtml_interact((event, { src, token }) => {
        this.swfPet.interact(src, () => window.electronAPI.html_ToMain_pokeLoaded(token));
      });
      this.getNowPosition();
      window.electronAPI.main_ToHtml((t, e) => {
        if (e.type == "load") {
          if (e.bd) {
            seeApp();
          }
          this.petInfo = e.petInfo;
          this.maxSize = e.maxSize;
          let t = [e.nowPosition[0] - +this.petInfo.info.lastX, e.nowPosition[1] - +this.petInfo.info.lastY];
          this.setMainPosition(t);
          if (this.swfPet.init) {
            this.swfPet.init({
              state: this.petInfo,
              baseRouter: e.bd ? "../assets/Action" : "../../assets/Action"
            });
          }
        }
      });
      window.electronAPI.main_ToHtml_setSay((t, e) => {
        try {
          e = JSON.parse(e);
        } catch {}
        for (let t in e) {
          console.log(e[t]);
        }
      });
      window.electronAPI.main_ToHtml_setPet((t, e) => {
        const wasAway = !!this.petInfo.activeOption.desktopGame;
        this.petInfo = e;
        this.interactions?.schedule();
        if (this.swfPet.setPetState) {
          this.swfPet.setPetState(e);
        }
        const isAway = !!e.activeOption.desktopGame;
        if (wasAway !== isAway && this.swfPet.swf) this.swfPet.changeSwf(isAway ? 'hide' : 'appear');
      });
      window.electronAPI.main_ToHtml_active((t, e) => {
        if (this.swfPet.changeSwf) {
          this.swfPet.changeSwf(e.active, {
            load: () => {
              if (e.load) {
                window.electronAPI.html_ToMain_backPetLoadFinish({
                  type: e?.type || null,
                  data: e.load,
                  event: "load",
                  otherOpt: e.otherOpt || null
                });
              }
            },
            finish: () => {
              if (e.finish) {
                window.electronAPI.html_ToMain_backPetLoadFinish({
                  type: e?.type || null,
                  data: e.finish,
                  event: "finish",
                  otherOpt: e.otherOpt || null
                });
              }
            }
          });
        }
        window.electronAPI.html_ToMain_getFocus();
      });
      window.electronAPI.main_m_nextActive((t, e) => {
        let i = true;
        if (e?.data) {
          try {
            i = JSON.parse(e.data);
          } catch {}
        }
        if (this.swfPet.doNext) {
          this.swfPet.doNext(i);
        }
      });
      window.electronAPI.main_m_setFloat((t, e) => {
        if (e.type == "seeFloat") {
          this.seeFloat(e.data);
        }
      });
      e({
        event: "mounted"
      });
    },
    methods: {
      seeFloat(t) {
        if (t?.num) {
          this.floatArr.push({
            id: Math.round(Math.random() * 4000 + 100),
            icon: "laugh",
            type: "addMood",
            nums: (t.num + "").split("")
          });
          setTimeout(() => {
            this.floatArr.shift();
          }, t?.time || 200);
        }
      },
      clickPet(t) {
        console.log("e :>> ", t);
      },
      initPet(t) {
        this.swfPet = new swfPet({
          id: "pet",
          goNormal: this.goNormal,
          backFn: t => {
            console.log("e", t);
            if (this.interactions) {
              if (t.name === "normal") this.interactions.schedule();
              else this.interactions.clear();
            }
            window.electronAPI.main_h_setPetState({
              type: "setState",
              data: JSON.stringify(t)
            });
          }
        });
      },
      goNormal() {
        if (this.petInfo.activeOption.desktopGame) return "hide";
        if (this.position == "left") {
          return "hideleft";
        } else if (this.position == "right") {
          return "hideright";
        } else if (this.position == "center") {
          return "normal";
        } else {
          return undefined;
        }
      },
      setMainPosition(t, e = {}) {
        window.electronAPI.html_ToMain_move({
          next: t,
          maxSize: [...this.maxSize],
          notChangeSize: e.changeSize || this.notChangeSize || false
        });
      },
      openPlayroom() { window.electronAPI.html_ToMain_openPlayroom(); },
      initInteractions() {
        this.interactions = new PetInteractions({
          root: document.getElementById("move"),
          mode: () => this.petInfo.playroom?.settings?.faceMode ?? 2,
          pose: () => {
            const swf = this.swfPet?.swf;
            if (!swf || swf.changeIng || swf.oldNext.name !== "normal" || swf.nextSwfRouter || this.position !== "center" || +this.petInfo.info.health <= 1 || this.petInfo.maxInfo.stopGrowth || ['work', 'study', 'trip'].some(k => this.petInfo.activeOption[k])) return null;
            const { sex, age, state } = this.swfPet.router;
            return { sex, age, state };
          },
          request: pose => window.electronAPI.html_ToMain_poke(pose)
        });
      },
      async doMove() {
        this.moveOut = new move({
          id: "move",
          dragThreshold: 4,
          contextmenu: () => {
            this.isClosed;
          },
          mousedown: t => {
            if (t.which == 1) {
              this.curState = true;
              window.electronAPI.html_ToMain_mouse({
                data: { isDown: !t.target.closest('[data-pet-spot]'), clientX: t.clientX, clientY: t.clientY },
                type: "which"
              });
            } else if (t.which == 2) {
              window.electronAPI.html_ToMain_mouse({
                type: "roller"
              });
            } else if (t.which == 3) {
              window.electronAPI.html_ToMain_mouse({
                data: {
                  ...t,
                  clientX: t.clientX,
                  clientY: t.clientY
                },
                type: "rightClick"
              });
            }
          },
          mousemove: (t, e) => {
            if (e.next) {
              this.setMainPosition(e.next);
            }
            window.electronAPI.html_ToMain_mouse({
              data: { clientX: t.clientX, clientY: t.clientY },
              type: "move"
            });
          },
          mouseup: (t, e) => {
            if (e.dragged) {
              this.swfPet.changeSwf();
            }
            this.curState = false;
            window.electronAPI.html_ToMain_mouse({
              data: e,
              type: "which"
            });
          },
          mouseout: (t, e) => {}
        }).init();
        let t = this.moveOut.getSize()[0];
        this.maxSize = [t, t];
      },
      getNowPosition() {
        window.electronAPI.main_ToHtml_setPotision((t, e, i) => {
          this.nowPosition = e;
          this.position = e[0] <= 3 ? "left" : e[0] >= +i[0] - +this.maxSize[0] - 3 ? "right" : "center";
        });
      },
      closeWindow() {
        e({
          event: "close"
        });
      }
    }
  };
  Vue.createApp(i).mount("#app");
  var o = window;
  for (var n in t) {
    o[n] = t[n];
  }
  if (t.__esModule) {
    Object.defineProperty(o, "__esModule", {
      value: true
    });
  }
})();
