(() => {
  var t = {};
  // Ruffle does not expose the old Flash playhead API. Estimate the root
  // timeline from metadata, clamping at the last frame so polling cannot miss it.
  class PetPlayer {
    constructor(element) {
      this.element = element;
      this.metadata = null;
      this.startedAt = 0;
      this.pausedAt = null;
      this.frameOffset = 0;
    }
    async load(src) {
      const ready = new Promise(resolve => this.element.addEventListener("loadedmetadata", resolve, { once: true }));
      await this.element.ruffle().load({
        url: new URL(src, document.baseURI).href,
        autoplay: "on",
        wmode: "transparent",
        backgroundColor: null,
        letterbox: "off",
        splashScreen: false,
        contextMenu: "off",
        allowScriptAccess: true
      });
      await ready;
      this.metadata = this.element.ruffle().metadata;
      if (!this.metadata?.numFrames || !this.metadata?.frameRate) {
        throw new Error("Pet animation has no timeline metadata: " + src);
      }
      this.startedAt = performance.now();
    }
    CurrentFrame() {
      if (!this.metadata) return -1;
      const elapsed = (this.pausedAt ?? performance.now()) - this.startedAt;
      return Math.min(this.TotalFrames() - 1,
        this.frameOffset + Math.floor(elapsed * this.metadata.frameRate / 1000));
    }
    TotalFrames() { return this.metadata?.numFrames || 0; }
    PercentLoaded() { return this.metadata ? 100 : 0; }
    IsPlaying() { return this.element.ruffle().isPlaying; }
    StopPlay() {
      this.element.ruffle().suspend();
      this.pausedAt ??= performance.now();
    }
    Play() {
      if (this.pausedAt !== null) {
        this.startedAt += performance.now() - this.pausedAt;
        this.pausedAt = null;
      }
      this.element.ruffle().resume();
    }
    GotoFrame(frame) {
      // Ruffle has no public seek API; this offset is only for the scheduler.
      this.frameOffset = frame;
      this.startedAt = performance.now();
      if (this.pausedAt !== null) this.pausedAt = this.startedAt;
    }
    Rewind() { this.GotoFrame(0); }
    click() { this.element.click(); }
  }
  class e {
    useData = ["id", "dom", "backFn", "normalSwf", "router"];
    id = "";
    dom = null;
    defaultAttribute = {
      id: "",
      name: "",
      class: "",
      wmode: "transparent",
      allowscriptaccess: "always",
      style: ""
    };
    backFn = null;
    state = null;
    nextSwfRouter = {};
    oldNext = {};
    saveNext = {};
    changeNum = -1;
    normalSwf = null;
    router = null;
    changeIng = false;
    delayTime = 90;
    onceNext = false;
    constructor(t = {}) {
      for (let e in this.useData) {
        this[this.useData[e]] = t[this.useData[e]] || null;
      }
      this.defaultAttribute = {
        id: t.id || null,
        name: "pet",
        class: "pet",
        wmode: "transparent",
        allowScriptAccess: "always",
        type: "application/x-shockwave-flash"
      };
    }
    saveChange = null;
    async changeSwf(t = {}) {
      const { option, backFn } = t;
      if (!option?.src) return;
      if (this.changeIng) {
        this.saveChange = t;
        return;
      }
      this.changeIng = true;
      const old = this.dom;
      const oldPose = this.oldNext;
      const oldElement = old.element || old;
      const element = window.RufflePlayer.newest().createPlayer();
      element.className = "pet";
      element.style.visibility = "hidden";
      const size = option.opt?.size;
      if (size) {
        element.style.width = size[0] + "px";
        element.style.height = size[1] + "px";
      }
      oldElement.parentNode.appendChild(element);
      const player = new PetPlayer(element);
      try {
        await player.load(option.src);
        // Keep the previous pose visible until the next player has painted.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        oldElement.removeAttribute("id");
        element.id = this.id;
        element.style.visibility = "visible";
        oldElement.remove();
        this.dom = player;
        if (!this.oldNext.name) this.oldNext = option;
        const event = { ...option, event: "setState", dom: player };
        if (s(backFn)) backFn(event);
        if (s(this.backFn)) this.backFn(event);
        this.changeNum++;
        if (s(option.callBack?.load)) option.callBack.load();
        if (option.name === "normal" && this.normalSwf() === "normal") this.scheduleIdle();
        if (this.returnAfterLoad) {
          const returnToNormal = this.returnAfterLoad;
          this.returnAfterLoad = null;
          returnToNormal();
        }
      } catch (error) {
        element.remove();
        this.oldNext = oldPose;
        this.returnAfterLoad = null;
        if (oldPose.name === "normal") this.scheduleIdle();
        console.error("Cannot load pet animation", option.src, error);
      } finally {
        this.changeIng = false;
        if (this.saveChange) {
          const next = this.saveChange;
          this.saveChange = null;
          this.changeSwf(next);
        }
      }
    }
    setState(t) {
      if (this.changeIng || !t.frame || t.currentFrame < 0) return;
      this.state = t;
      let {
        currentFrame: e,
        frame: a,
        isPlaying: i,
        percentLoaded: n
      } = this.state;
      if (this.oldNext?.callBack?.finish && e >= a - (this.oldNext?.opt?.lastTimeCut || 1) - 1) {
        const finish = this.oldNext.callBack.finish;
        this.oldNext.callBack.finish = null;
        finish();
      }
      if (this.nextSwfRouter && this.oldNext.name !== "exit") {
        if (this.oldNext.name == "game") {
          return;
        }
        if (this.oldNext?.opt?.afterState && this.oldNext?.opt?.afterState?.length > 0 && this.nextSwfRouter.name !== "exit" && !this.oldNext?.opt?.afterState?.includes(this.nextSwfRouter.name)) {
          this.nextSwfRouter = null;
          return;
        }
        if ((this.changeNum == -1 || this.changeNum == 0) && e == -1) {
          return;
        }
        let t = this.oldNext?.opt?.lastTimeCut || 1;
        if ((this.onceNext?.name ? (this.onceNext.name + "").indexOf(this.nextSwfRouter.name) != -1 : this.onceNext) || e >= a - t || this.nextSwfRouter?.opt?.power > this.oldNext?.opt?.power || this.nextSwfRouter?.opt?.power == this.oldNext?.opt?.power && this.nextSwfRouter?.opt?.canSelfSet || this.nextSwfRouter.name === "exit" || this.oldNext?.opt?.isOverState == "normal") {
          this.onceNext &&= false;
          this.changeSwf({
            option: this.nextSwfRouter
          });
          if (this.nextSwfRouter?.opt?.backSwf) {
            let t = null;
            let e = this.nextSwfRouter?.opt?.backSwf;
            t = typeof e == "string" ? e == "normal" ? null : e : e.backSwfChange ? "canNext" : e.name == "normal" ? null : e.name;
            this.returnAfterLoad = () => {
              if (t != "canNext" || !this.nextSwfRouter) {
                this.nextSwf(t == "canNext" ? "" : t, null, this.oldNext.opt);
              }
            };
          }
          this.oldNext = this.nextSwfRouter;
          this.nextSwfRouter = null;
          return;
        }
        if (a != 1 && e + t < a && !i) {
          if (this.oldNext?.opt?.nextFrames) {
            this.goToFrames(this.oldNext.opt.nextFrames);
          }
          this.play();
          return;
        }
      }
    }
    playTime = null;
    nextSwf(t, e, a) {
      if (t && typeof t == "string") {
        t = {
          ...this.router.getRouter(t, this.oldNext)
        };
      }
      this.saveNext = {
        callBack: e || null,
        ...(t || this.router.getRouter(this.normalSwf(), this.oldNext))
      };
      if (!this.oldNext?.opt?.state || this.oldNext?.opt?.state != this.saveNext?.opt?.state || this.saveNext?.opt?.state != "normal" || this.oldNext.src != this.saveNext.src) {
        this.nextSwfRouter = this.saveNext;
        clearTimeout(this.playTime);
        this.playTime = null;
      }
    }
    scheduleIdle() {
      clearTimeout(this.playTime);
      this.playTime = setTimeout(() => {
        this.playTime = null;
        if (this.normalSwf() !== "normal" || this.oldNext.name !== "normal" || this.changeIng || this.nextSwfRouter) return;
        if (Math.random() < 0.2) {
          // Re-arm if small talk is suppressed (for example by quiet mode).
          this.scheduleIdle();
          if (s(this.backFn)) this.backFn({
            tolkName: "smallTalk", tolkActive: "speak", event: "setState"
          });
        } else {
          this.nextSwf(this.router.getRouter("play"));
        }
      }, Math.trunc(Math.random() * 40000 + 20000));
    }

    click() {
      try {
        this.dom.click();
        return true;
      } catch (t) {
        return t;
      }
    }
    stopPlay() {
      try {
        this.dom.StopPlay();
        return true;
      } catch (t) {
        return t;
      }
    }
    play() {
      try {
        this.dom.Play();
        return true;
      } catch (t) {
        return t;
      }
    }
    isPlaying() {
      try {
        return this.dom.IsPlaying();
      } catch (t) {
        return t;
      }
    }
    rewind() {
      try {
        this.dom.Rewind();
        return true;
      } catch (t) {
        return t;
      }
    }
    goToFrames(t) {
      if (t > this.state.frame) {
        t = this.state.frame;
      }
      this.dom.GotoFrame(t);
    }
  }
  class a {
    useData = ["baseRouter", "sex", "age", "state", "use"];
    baseRouter = "../../assets/Action";
    sex = "GG";
    oldAge = "";
    age = "Adult";
    ageNum = 0;
    oldAgeNum = -1;
    agegrow = 0;
    state = "happy";
    use = "";
    backFn = () => {};
    SwfList = {};
    isSick = 0;
    isSickTime = null;
    eggMax = 4;
    kidMax = 9;
    constructor(t = {}) {
      if (s(t?.backFn)) {
        this.backFn = t.backFn;
      }
      this.SwfList = this.initSwfList();
      this.changeState(t.state);
      if (t.baseRouter) {
        this.baseRouter = t.baseRouter;
      }
    }
    changeState(t) {
      let e = {
        ...t.info,
        age: t.maxInfo.level
      };
      this.sex = e.sex == "MM" ? "MM" : "GG";
      this.ageNum = e.age;
      this.agegrow = e.growth;
      this.age = e.age <= this.eggMax ? "Egg" : e.age > this.eggMax && e.age < this.kidMax ? "Kid" : "Adult";
      let a = false;
      if (this.oldAge != this.age) {
        if (this.age != "Adult") {
          this.state = "";
        } else {
          this.state = "happy";
        }
        if (this.oldAge) {
          a = true;
        }
        this.oldAge = this.age;
      }
      if (this.oldAgeNum != this.ageNum) {
        if (this.oldAgeNum != -1) {
          this.backFn({
            tolkName: "levUp",
            tolkActive: a ? "first" : "levUp",
            event: "setState"
          });
        }
        this.oldAgeNum = this.ageNum;
      }
      let i = "";
      if (this.age == "Adult") {
        if (e?.mood || e.mood == 0) {
          let a = l(e.mood, [{
            rule: [null, 900],
            value: "happy"
          }, {
            rule: [900, 800],
            value: "peaceful"
          }, {
            rule: [800, 500],
            value: "upset"
          }, {
            rule: [500, null],
            value: "sad"
          }]);
          if (this.state != a) {
            this.state = a;
            i = "changeState";
            this.backFn({
              event: "changeState",
              value: this.state
            });
          }
        } else {
          this.state = "happy";
        }
      } else {
        this.state = "";
      }
      if (e?.health < 5 && e?.health >= 2) {
        if (this.isSick != 1) {
          this.isSick = 1;
          this.backFn({
            event: "sick",
            value: this.state
          });
          if (this.isSickTime) {
            clearInterval(this.isSickTime);
          }
          this.isSickTime = setInterval(() => {
            this.backFn({
              event: "sick",
              value: this.state
            });
          }, 30000);
        }
      } else if (e?.health == 1) {
        if (this.isSickTime) {
          clearInterval(this.isSickTime);
        }
        if (this.isSick != 2) {
          this.isSick = 2;
          this.backFn({
            event: "dying",
            value: this.state
          });
        }
      } else if (e?.health == 0) {
        if (this.isSickTime) {
          clearInterval(this.isSickTime);
        }
        if (this.isSick != 3 && this.isSick != 4) {
          this.isSick = 3;
          this.backFn({
            event: "die",
            value: this.state
          });
        }
      } else {
        if (this.isSickTime) {
          clearInterval(this.isSickTime);
        }
        if (this.isSick != 4 && this.isSick != 0) {
          this.backFn({
            event: i || "normal",
            value: this.state
          });
          this.isSick = 0;
        }
      }
      this.use = "Play";
    }
    getRouter(t, e = {}) {
      let a = this.SwfList[this.sex][this.age];
      let i = `${this.baseRouter}/${this.sex}/${this.age}`;
      let s = a => {
        if (t === "enter" && +this.ageNum === 1 && this.agegrow == 0) {
          return this.getRouter("first");
        }
        if (t == "revival" || t == "bury") {
          this.isSick = 4;
        }
        if (t == "normal") {
          if (this.isSick == 2) {
            return {
              ...this.getRouter("dying"),
              state: "dying"
            };
          }
          if (this.isSick == 3 && e.name != "revival" && e.name != "bury") {
            return {
              ...this.getRouter("die"),
              state: "die"
            };
          }
        }
      };
      if (["enter", "exit", "clean", "eat", "game", "sick", "cure"].includes(t)) {
        a = a[t];
        i += `/${a.name}${a?.notNum ? "" : o({
          start: a.start,
          end: a.end
        })}.swf`;
        let e = {
          state: t,
          ...(a?.opt || {})
        };
        return s() || {
          src: i,
          opt: e,
          name: t
        };
      }
      if (["normal", "speak", "hide", "appear"].includes(t)) {
        a = this.state ? a[this.state][t] : a[t];
        let e = a.name;
        if (a?.haveNum) {
          e = e.replace(".swf", "") + o({
            start: a.start,
            end: a.end
          }) + ".swf";
        }
        i += `/${this.state ? this.state + "/" : ""}${e}`;
        let n = {
          state: t,
          ...(a?.opt || {})
        };
        return s() || {
          src: i,
          opt: n,
          name: t
        };
      }
      if (["hideright", "hideleft", "etoj", "jtoc", "dying", "die", "revival", "bury", "first", "levUp"].includes(t)) {
        a = a[t];
        let e = a.name;
        let n = "";
        if (a?.haveNum) {
          n = o({
            start: a.start,
            end: a.end
          });
          e = e.replace(".swf", "") + n + ".swf";
        }
        i += `/${e}`;
        let r = {
          state: t,
          ...(a?.opt || {})
        };
        if (n && typeof r.nextFrames == "object") {
          r.nextFrames = r.nextFrames[n];
        }
        return s() || {
          src: i,
          opt: r,
          name: t
        };
      }
      if (["play"].includes(t)) {
        a = this.state ? a[this.state][t] : a[t];
        i += `/${this.state ? this.state + "/" : ""}${t}/${a.name}${o({
          start: a.start,
          end: a.end
        })}.swf`;
        return {
          src: i,
          opt: {
            state: t,
            ...(a?.opt || {})
          },
          name: t
        };
      }
      if (t == "changeState") {
        a = this.state ? a[this.state].normal : a.normal;
        i += `/${this.state ? this.state + "/" : ""}${a.name}`;
        let t = {
          state: "changeState",
          power: 150,
          backSwf: "normal",
          canSelfSet: true
        };
        return s() || {
          src: i,
          opt: t,
          name: "changeState"
        };
      }
    }
    initSwfList() {
      let t = ["speak", "clean", "eat", "hide", "game", "appear", "etoj", "jtoc", "changeState", "cure", "sick", "dying", "die", "first", "levUp", "revival", "bury"];
      let e = (e = {}) => {
        let {
          enterOption: a,
          exitOption: i,
          sickOption: n,
          cleanOption: s,
          cureOption: r,
          eatOption: o,
          hiderightOption: l,
          hidelefttOption: h
        } = e;
        return {
          enter: {
            name: "Enter",
            start: a?.start || 1,
            end: a?.end || 3
          },
          exit: {
            name: "Exit",
            start: i?.start || 1,
            end: i?.end || 4
          },
          game: {
            name: "game/Game",
            start: 1,
            end: 1,
            opt: {
              power: 150,
              canSelfSet: true,
              size: [140, 280]
            }
          },
          clean: {
            name: "Clean",
            start: s?.start || 1,
            end: s?.end || 2,
            notNum: !!s?.notNum,
            opt: {
              power: 150,
              backSwf: "normal",
              canSelfSet: true
            }
          },
          eat: {
            name: "Eat",
            start: o?.start || 1,
            end: o?.end || 2,
            opt: {
              power: 150,
              backSwf: "normal",
              canSelfSet: true
            }
          },
          etoj: {
            name: "Etoj.swf",
            opt: {
              power: 66,
              backSwf: {
                name: "normal",
                backSwfChange: true
              },
              lastTimeCut: 7
            }
          },
          jtoc: {
            name: "Jtoc.swf",
            opt: {
              power: 66,
              backSwf: {
                name: "normal",
                backSwfChange: true
              },
              lastTimeCut: 7
            }
          },
          sick: {
            name: "Sick",
            start: n?.start || 1,
            end: n?.end || 2,
            notNum: !!n?.notNum,
            opt: {
              power: 150,
              backSwf: "normal",
              canSelfSet: true,
              ...(n?.opt || {})
            }
          },
          cure: {
            name: "Cure",
            start: 1,
            end: 2,
            notNum: !!r?.notNum,
            opt: {
              power: 150,
              backSwf: "normal",
              canSelfSet: true
            }
          },
          dying: {
            name: "Dying.swf",
            opt: {
              power: 150,
              backSwf: {
                name: "normal",
                backSwfChange: true
              }
            }
          },
          die: {
            name: "Die.swf",
            opt: {
              power: 170,
              afterState: ["revival", "bury"],
              canSelfSet: true
            }
          },
          revival: {
            name: "Revival.swf",
            opt: {
              power: 170,
              backSwf: {
                name: "normal",
                backSwfChange: true
              }
            }
          },
          bury: {
            name: "Bury.swf",
            opt: {
              power: 170,
              lastTimeCut: 5,
              afterState: ["normal", "changeState", "first"],
              backSwf: "normal"
            }
          },
          first: {
            name: "First.swf",
            opt: {
              power: 170,
              backSwf: "normal"
            }
          },
          hideleft: {
            name: "Hide_left.swf",
            start: h?.start || 1,
            end: h?.end || 1,
            haveNum: !!h?.haveNum,
            opt: {
              afterState: ["normal", "hideright", "hideleft", ...t],
              nextFrames: h?.nextFrames || 66
            }
          },
          hideright: {
            name: "Hide_right.swf",
            start: l?.start || 1,
            end: l?.end || 1,
            haveNum: !!l?.haveNum,
            opt: {
              afterState: ["hideleft", "hideright", "normal", ...t],
              nextFrames: l?.nextFrames || 66
            }
          },
          levUp: {
            name: "LevUp.swf",
            opt: {
              power: 170,
              backSwf: "normal"
            }
          }
        };
      };
      let a = (e = {}) => {
        let {
          playOption: a,
          speakOption: i,
          normalOption: n
        } = e;
        return {
          normal: {
            name: "Stand.swf",
            opt: {
              isOverState: "normal",
              afterState: ["hideleft", "hideright", "play", "interact", ...t],
              ...(n?.opt || {})
            }
          },
          hide: {
            name: "Hide.swf",
            opt: {
              power: 150,
              canSelfSet: true
            }
          },
          appear: {
            name: "Appear.swf",
            opt: {
              power: 150,
              backSwf: {
                name: "normal",
                backSwfChange: true
              },
              canSelfSet: true
            }
          },
          speak: {
            name: "Speak.swf",
            start: i?.start || 1,
            end: i?.end || 1,
            haveNum: !!i?.haveNum,
            opt: {
              afterState: ["hideleft", "hideright", "normal", ...t],
              backSwf: "normal",
              power: 100
            }
          },
          interact: {
            BE1: "E1.swf",
            BE2: "E2.swf"
          },
          play: {
            name: "P",
            start: a?.start || 1,
            end: a?.end || 1,
            opt: {
              backSwf: "normal",
              power: 50
            }
          }
        };
      };
      return {
        GG: {
          Adult: {
            ...e(),
            happy: a({
              playOption: {
                end: 47
              }
            }),
            prostrate: a({
              playOption: {
                end: 46
              }
            }),
            peaceful: a({
              playOption: {
                end: 100
              }
            }),
            upset: a({
              playOption: {
                end: 23
              }
            }),
            sad: a({
              playOption: {
                end: 22
              }
            })
          },
          Kid: {
            ...e({
              eatOption: {
                end: 1
              },
              exitOption: {
                end: 3
              },
              cleanOption: {
                notNum: true
              },
              sickOption: {
                notNum: true
              },
              cureOption: {
                notNum: true
              },
              hiderightOption: {
                haveNum: true,
                end: 2,
                nextFrames: {
                  1: 61,
                  2: 39
                }
              },
              hidelefttOption: {
                haveNum: true,
                end: 2,
                nextFrames: {
                  1: 61,
                  2: 39
                }
              }
            }),
            ...a({
              playOption: {
                end: 112
              },
              normalOption: {
                opt: {
                  isOverState: "normal"
                }
              }
            })
          },
          Egg: {
            ...e({
              enterOption: {
                end: 2
              },
              exitOption: {
                end: 3
              },
              cleanOption: {
                notNum: true
              },
              cureOption: {
                notNum: true
              },
              sickOption: {
                notNum: true
              },
              hiderightOption: {
                haveNum: true,
                end: 2,
                nextFrames: 61
              },
              hidelefttOption: {
                haveNum: true,
                end: 2,
                nextFrames: 61
              }
            }),
            ...a({
              playOption: {
                end: 29
              },
              speakOption: {
                haveNum: true,
                end: 3
              },
              normalOption: {
                opt: {
                  isOverState: "normal"
                }
              }
            })
          }
        },
        MM: {
          Adult: {
            ...e(),
            happy: a({
              playOption: {
                end: 47
              }
            }),
            prostrate: a({
              playOption: {
                end: 46
              }
            }),
            peaceful: a({
              playOption: {
                end: 100
              }
            }),
            upset: a({
              playOption: {
                end: 23
              }
            }),
            sad: a({
              playOption: {
                end: 22
              }
            })
          },
          Kid: {
            ...e({
              eatOption: {
                end: 1
              },
              exitOption: {
                end: 3
              },
              cleanOption: {
                notNum: true
              },
              sickOption: {
                notNum: true,
                opt: {
                  lastTimeCut: 600
                }
              },
              cureOption: {
                notNum: true
              },
              hiderightOption: {
                haveNum: true,
                end: 2,
                nextFrames: {
                  1: 61,
                  2: 39
                }
              },
              hidelefttOption: {
                haveNum: true,
                end: 2,
                nextFrames: {
                  1: 61,
                  2: 39
                }
              }
            }),
            ...a({
              playOption: {
                end: 112
              },
              normalOption: {
                opt: {
                  isOverState: "normal"
                }
              }
            })
          },
          Egg: {
            ...e({
              enterOption: {
                end: 2
              },
              exitOption: {
                end: 3
              },
              cleanOption: {
                notNum: true
              },
              cureOption: {
                notNum: true
              },
              sickOption: {
                notNum: true
              },
              hiderightOption: {
                haveNum: true,
                end: 2,
                nextFrames: 61
              },
              hidelefttOption: {
                haveNum: true,
                end: 2,
                nextFrames: 61
              }
            }),
            ...a({
              playOption: {
                end: 29
              },
              speakOption: {
                haveNum: true,
                end: 3
              },
              normalOption: {
                opt: {
                  isOverState: "normal"
                }
              }
            })
          }
        }
      };
    }
  }
  class i {
    useData = ["dom", "changeState"];
    dom = null;
    state = {
      frame: 0,
      isPlaying: false,
      currentFrame: 0,
      percentLoaded: 0
    };
    changeState = null;
    constructor(t = {}) {
      for (let e in this.useData) {
        this[this.useData[e]] = t[this.useData[e]] || null;
      }
    }
    setDom(t) {
      this.dom = t || null;
    }
    isPlaying() {
      try {
        return this.dom.IsPlaying();
      } catch (t) {
        return null;
      }
    }
    currentFrame() {
      try {
        return this.dom.CurrentFrame();
      } catch (t) {
        return null;
      }
    }
    totalFrames() {
      try {
        return this.dom.TotalFrames();
      } catch (t) {
        return null;
      }
    }
    percentLoaded() {
      try {
        return this.dom.PercentLoaded();
      } catch (t) {
        return null;
      }
    }
    getState() {
      this.state = {
        frame: this.totalFrames(),
        isPlaying: this.isPlaying(),
        currentFrame: this.currentFrame(),
        percentLoaded: this.percentLoaded()
      };
      if (s(this.changeState)) {
        this.changeState(this.state);
      }
    }
  }
  class n {
    AnimationFrames = {};
    defaultAnimations = {};
    fps = 24;
    defaultSystem = {
      fps: 24,
      interval: 1000 / 24
    };
    constructor(t = {}) {
      this.initAnimation();
    }
    createAnimationFrame(t) {
      let {
        name: e,
        fn: a,
        stop: i = () => false,
        interval: n = this.defaultSystem.interval
      } = t;
      if (!e) {
        return;
      }
      var s;
      this.clearAnimationFrames(e);
      var r;
      var o = Date.now();
      let l = () => {
        if (i()) {
          this.clearAnimationFrames(e);
        } else {
          s = Date.now();
          if ((r = s - o) > n) {
            o = s - r % n;
            if (a) {
              a();
            }
          }
          this.AnimationFrames[e] = window.requestAnimationFrame(l);
        }
      };
      l();
    }
    clearAnimationFrames(t) {
      try {
        if (t && this.AnimationFrames[t]) {
          window.cancelAnimationFrame(this.AnimationFrames[t]);
          this.AnimationFrames[t] = null;
          delete this.AnimationFrames[t];
        }
      } catch (t) {}
    }
    initAnimation() {
      this.createAnimationFrame({
        name: "init",
        fn: () => {
          for (let t in this.defaultAnimations) {
            if (this.defaultAnimations[t]?.fn && s(this.defaultAnimations[t].fn)) {
              this.defaultAnimations[t].fn();
            }
          }
        }
      });
    }
    addAnimation(t) {
      let {
        name: e,
        fn: a
      } = t;
      if (!r([e, a])) {
        this.defaultAnimations[e] = {
          fn: a
        };
      }
    }
    deleteAnimation(t) {
      if (!r([t])) {
        this.defaultAnimations[t] = {};
        delete this.defaultAnimations[t];
      }
    }
  }
  const s = t => t && typeof t == "function";
  const r = t => {
    let e = false;
    for (let a in t) {
      if (!t[a]) {
        e = true;
        break;
      }
    }
    return e;
  };
  const o = (t = {}) => {
    let e = t.start || 1;
    let a = t.end || 0;
    return Math.trunc(Math.random() * (a - e + 1) + e) + "";
  };
  const l = (t, e) => {
    let a = e[0].value;
    let i = e.length - 1;
    for (let n in e) {
      if (n == 0 && t >= e[n].rule[1]) {
        a = e[n].value;
        break;
      }
      if (t < e[n].rule[0] && t >= e[n].rule[1]) {
        a = e[n].value;
        break;
      }
      if (n == i && t < e[n].rule[0]) {
        a = e[n].value;
        break;
      }
    }
    return a;
  };
  window.swfPet = class {
    useData = ["id", "backFn", "goNormal"];
    id = "";
    dom = null;
    router = null;
    swf = null;
    state = null;
    goNormal = null;
    load = true;
    loadFn = null;
    timeControl = null;
    backFn = null;
    eggMax = 5;
    kidMax = 10;
    constructor(t = {}) {
      for (let e in this.useData) {
        this[this.useData[e]] = t[this.useData[e]] || null;
      }
      if (!s(this.backFn)) {
        this.backFn = function (t) {};
      }
    }
    init(t) {
      this.dom = this.id ? document.getElementById(this.id) : null;
      this.router = new a({
        state: t.state,
        backFn: t => {
          if (t.event == "setState") {
            this.backFn(t);
            return;
          }
          let e = () => {
            this.swf.nextSwf(t.event);
          };
          if (this.load) {
            this.loadFn = () => {
              e();
            };
          } else {
            e();
          }
        },
        baseRouter: t.baseRouter
      });
      this.state = new i({
        dom: this.dom,
        changeState: t => {
          if (this.swf?.setState) {
            this.swf?.setState(t);
          }
        }
      });
      this.swf = new e({
        id: this.id,
        dom: this.dom,
        backFn: t => {
          if (t.dom) {
            this.state.setDom(t.dom);
          }
          if (t.event == "setState") {
            let e = {
              ...t,
              dom: "",
              tolkName: t.tolkName || t.name
            };
            this.backFn(e);
          }
        },
        normalSwf: this.goNormal || function () {
          return "normal";
        },
        router: this.router
      });
      this.swf.changeSwf({
        option: this.router.getRouter("enter")
      });
      if (!this.loadFn) {
        this.swf.nextSwf();
      }
      this.timeControl = new n();
      this.addAnimation("geetState", () => {
        this.state.getState();
      });
      this.load = false;
      if (this.loadFn) {
        this.loadFn();
        this.loadFn = null;
      }
    }
    addAnimation(t, e) {
      this.timeControl.addAnimation({
        name: t,
        fn: e
      });
    }
    changeSwf(t, e) {
      this.swf.nextSwf(t ? this.router.getRouter(t) : "", e);
    }
    interact(src, loaded) {
      this.swf.nextSwf({ src, name: "interact", opt: { state: "interact", power: 80, backSwf: "normal" }, callBack: { load: loaded } });
    }
    setPetState(t) {
      if (this.router?.changeState) {
        this.router.changeState(t);
      }
    }
    doNext(t) {
      this.swf.onceNext = t;
    }
    eventLoopList = {};
    addLoop(t) {}
    getRandom(t, e) {
      return o({
        start: t,
        end: e
      });
    }
  };
  var h = window;
  for (var m in t) {
    h[m] = t[m];
  }
  if (t.__esModule) {
    Object.defineProperty(h, "__esModule", {
      value: true
    });
  }
})();
