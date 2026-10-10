(() => {
  var e = {};
  var t = e => {
    window.electronAPI.smallGame_h_bus(e);
  };
  const r = {
    data: () => ({
      dom: null,
      defaultAttribute: {
        id: "gameMain",
        name: "gameMain",
        class: "gameMain",
        wmode: "transparent",
        allowscriptaccess: "always"
      },
      open: true,
      changeIng: false,
      loadError: "",
      baseRouter: "../assets/game/",
      gameList: [{
        name: "QQ地下城与勇士之Q宠版",
        router: "QQ地下城与勇士之Q宠版.swf"
      }, {
        name: "QQ飞车",
        router: "QQ飞车.swf"
      }, {
        name: "QQ狩猎场",
        router: "QQ狩猎场.swf"
      }, {
        name: "QQ挖矿",
        router: "QQ挖矿.swf"
      }, {
        name: "Q宠爱森林",
        router: "Q宠爱森林.swf"
      }, {
        name: "宠爱QQ堂",
        router: "宠爱QQ堂.swf"
      }, {
        name: "泡泡",
        router: "泡泡.swf"
      }, {
        name: "营救",
        router: "营救.swf"
      }, {
        name: "摘星星",
        router: "摘星星.swf"
      }, {
        name: "捉鱼",
        router: "捉鱼.swf"
      }, {
        name: "冒险岛合集",
        show: false,
        children: [{
          name: "1起航",
          router: "mxd/1起航.swf"
        }, {
          name: "2爱情之爆发力(速度减慢)",
          router: "mxd/2爱情之爆发力(速度减慢).swf"
        }, {
          name: "2爱情之爆发力",
          router: "mxd/2爱情之爆发力.swf"
        }, {
          name: "3贼窝",
          router: "mxd/3贼窝.swf"
        }, {
          name: "4密室",
          router: "mxd/4密室.swf"
        }, {
          name: "5黑暗之眼",
          router: "mxd/5黑暗之眼.swf"
        }, {
          name: "6巨树",
          router: "mxd/6巨树.swf"
        }, {
          name: "7巨树之颠",
          router: "mxd/7巨树之颠.swf"
        }, {
          name: "8宝藏",
          router: "mxd/8宝藏.swf"
        }]
      }, {
        name: "其他换皮小游戏合集",
        show: false,
        children: [{
          name: "灰太狼",
          router: "hpxyx/灰太狼.swf"
        }, {
          name: "QQ钓鱼",
          router: "hpxyx/QQ钓鱼.swf"
        }, {
          name: "满天星",
          router: "hpxyx/满天星.swf"
        }, {
          name: "三明治",
          router: "hpxyx/三明治.swf"
        }, {
          name: "抓萤火虫",
          router: "hpxyx/抓萤火虫.swf"
        }]
      }],
      current: "",
      TopTip: "当前游戏都来自各个qq群收集 <br />"
    }),
    computed: {},
    created() {},
    mounted() {
      this.dom = document.getElementById("gameMain");
      window.electronAPI.smallGame_m_bus((e, t) => {
        if (t.type == "load") {
          seeApp();
        }
      });
      t({
        event: "mounted"
      });
    },
    methods: {
      async changeSwf(e) {
        console.log(e);
        if (e?.children) {
          e.show = !e.show;
          return;
        }
        if (this.changeIng) {
          return;
        }
        this.changeIng = true;
        this.loadError = "";
        this.current = e.router;
        t({ event: 'showSwf', title: e.name, router: e.router });
        const old = this.dom;
        const player = window.RufflePlayer.newest().createPlayer();
        player.className = 'gameMain';
        player.id = 'gameLoading';
        player.tabIndex = 0;
        player.style.visibility = 'hidden';
        old.parentNode.appendChild(player);
        try {
          const url = new URL(this.baseRouter + e.router, document.baseURI);
          await player.ruffle().load({ url: url.href, base: new URL('./', url).href, autoplay: 'on', splashScreen: false, unmuteOverlay: 'hidden', contextMenu: 'off', allowScriptAccess: true });
          // Ruffle can resolve load() before movie metadata is available.
          // Keep the player hidden and reward timer stopped during that gap.
          const deadline = Date.now() + 20000;
          while (!player.ruffle().metadata) {
            if (Date.now() >= deadline) throw new Error('游戏加载超时');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          old.remove(); player.id = 'gameMain'; player.style.visibility = 'visible'; player.focus();
          this.dom = player;
          t({ event: 'gameReady', router: e.router });
        } catch (error) {
          player.remove(); this.current = '';
          t({ event: 'gameFailed' });
          console.error('小游戏加载失败', error);
          this.loadError = `「${e.name}」加载失败，请重新选择。如果仍然失败，请检查游戏资源是否完整。`;
        } finally { this.changeIng = false; }
      },
      closeWindow() {
        t({
          event: "close"
        });
      },
      openMenu() {
        this.open = !this.open;
      }
    }
  };
  Vue.createApp(r).mount("#app");
  var n = window;
  for (var o in e) {
    n[o] = e[o];
  }
  if (e.__esModule) {
    Object.defineProperty(n, "__esModule", {
      value: true
    });
  }
})();
