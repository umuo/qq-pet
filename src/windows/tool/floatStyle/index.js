(() => {
  var t = {};
  let e = ["😀", "😁", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚", "☺", "😇", "😐", "😑", "😶", "😏", "😣", "😥", "😮", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝", "😒", "😓", "😔", "😕", "😲", "😷", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😬", "😰", "😱", "😳", "😵", "😡", "😠", "👦", "👧", "👨", "👩", "👴", "👵", "👶", "👱", "👮", "👲", "👳", "👷", "👸", "💂", "🎅", "👰", "👼", "💆", "💇", "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🙇", "🙌", "🙏", "👤", "👥", "🚶", "🏃", "👯", "💃", "👫", "👬", "👭", "💏", "💑", "👪", "💪", "👈", "👉", "☝", "👆", "👇", "✌", "✋", "👌", "👍", "👎", "✊", "👊", "👋", "👏", "👐", "✍", "👣", "👀", "👂", "👃", "👅", "👄", "💋", "👓", "👔", "👕", "👖", "👗", "👘", "👙", "👛", "👜", "👝", "🎒", "💼", "👞", "👟", "👠", "👡", "👢", "👑", "👒", "🎩", "🎓", "💄", "💅", "💍", "🌂", "📶", "📳", "📴", "♻", "🏧", "🚮", "🚰", "♿", "🚹", "🚺", "🚻", "🚼", "🚾", "⚠", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "🔞", "💈", "🙈", "🙉", "🙊", "🐵", "🐒", "🐶", "🐕", "🐩", "🐺", "🐱", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🐈", "🐯", "🐅", "🐆", "🐴", "🐎", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🐘", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐻", "🐨", "🐼", "🐾", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🐸", "🐊", "🐢", "🐍", "🐲", "🐉", "🐳", "🐋", "🐬", "🐟", "🐠", "🐡", "🐙", "🐚", "🐌", "🐛", "🐜", "🐝", "🐞", "🦋", "💐", "🌸", "💮", "🌹", "🌺", "🌻", "🌼", "🌷", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃", "🌍", "🌎", "🌏", "🌐", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌙", "🌚", "🌛", "🌜", "☀", "🌝", "🌞", "⭐", "🌟", "🌠", "☁", "⛅", "☔", "⚡", "❄", "🔥", "💧", "🌊", "🍅", "🍆", "🌽", "🍄", "🌰", "🍞", "🍖", "🍗", "🍔", "🍟", "🍕", "🍳", "🍲", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🍡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "☕", "🍵", "🍶", "🍷", "🍸", "🍹", "🍺", "🍻", "🍴", "🎪", "🎭", "🎨", "🎰", "🚣", "🛀", "🎫", "🏆", "⚽", "⚾", "🏀", "🏈", "🏉", "🎾", "🎱", "🎳", "⛳", "🎣", "🎽", "🎿", "🏂", "🏄", "🏇", "🏊", "🚴", "🚵", "🎯", "🎮", "🎲", "🎷", "🎸", "🎺", "🎻", "🎬", "😈", "👿", "👹", "👺", "💀", "☠", "👻", "👽", "👾", "💣", "🌋", "🗻", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "⛲", "🌁", "🌃", "🌆", "🌇", "🌉", "🌌", "🎠", "🎡", "🎢", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚏", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚚", "🚛", "🚜", "🚲", "⛽", "🚨", "🚥", "🚦", "🚧", "⚓", "⛵", "🚤", "🚢", "✈", "💺", "🚁", "🚟", "🚠", "🚡", "🚀", "🎑", "🗿", "🛂", "🛃", "🛄", "🛅", "💌", "💎", "🔪", "💈", "🚪", "🚽", "🚿", "🛁", "⌛", "⏳", "⌚", "⏰", "🎈", "🎉", "🎊", "🎎", "🎏", "🎐", "🎀", "🎁", "📯", "📻", "📱", "📲", "☎", "📞", "📟", "📠", "🔋", "🔌", "💻", "💽", "💾", "💿", "📀", "🎥", "📺", "📷", "📹", "📼", "🔍", "🔎", "🔬", "🔭", "📡", "💡", "🔦", "🏮", "📔", "📕", "📖", "📗", "📘", "📙", "📚", "📓", "📃", "📜", "📄", "📰", "📑", "🔖", "💰", "💴", "💵", "💶", "💷", "💸", "💳", "✉", "📧", "📨", "📩", "📤", "📥", "📦", "📫", "📪", "📬", "📭", "📮", "✏", "✒📝", "📁", "📂", "📅", "📆", "📇", "📈", "📉", "📊", "📋", "📌", "📍", "📎📏📐", "✂", "🔒", "🔓", "🔏", "🔐", "🔑", "🔨", "🔫", "🔧", "🔩", "🔗", "💉", "💊", "🚬", "🔮", "🚩", "💦", "💨", "♠", "♥", "♦", "♣", "🀄", "🎴", "🔇", "🔈", "🔉", "🔊", "📢", "📣", "💤", "💢", "💬", "💭", "♨", "🌀", "🔔", "🔕", "✡", "✝", "🔯", "📛", "🔰", "🔱", "⭕", "✅", "☑", "✔", "✖", "❌", "❎", "➕", "➖", "➗", "➰", "➿", "〽", "✳", "✴", "❇", "‼", "⁉", "❓", "❔", "❕", "❗", "©", "®", "™", "🎦", "🔅", "🔆", "💯", "🔠", "🔡", "🔢", "🔣", "🔤", "🅰", "🆎", "🅱", "🆑", "🆒", "🆓", "ℹ🆔", "Ⓜ", "🆕", "🆖", "🅾", "🆗", "🅿", "🆘", "🆙", "🆚", "🈁", "🈂", "🈷", "🈶", "🈯", "🉐", "🈹", "🈚", "🈲", "🉑", "🈸", "🈴", "🈳", "㊗", "㊙", "🈺", "🈵", "▪", "▫", "◻", "◼", "◽", "◾", "⬛", "⬜", "🔶", "🔷", "🔸", "🔹", "🔺", "🔻", "💠", "🔲", "🔳", "⚪", "⚫", "🔴", "🔵", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "⛎", "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟", "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙", "🕥", "🕚", "🕦", "⏱", "⏲", "🕰", "💘", "❤", "💓", "💔", "💕", "💖", "💗", "💙", "💚", "💛", "💜", "💝", "💞", "💟", "❣", "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "⬆", "↗", "➡", "↘", "⬇", "↙", "⬅", "↖", "↕", "↔", "↩", "↪", "⤴", "⤵", "🔃", "🔄", "🔙", "🔚", "🔛", "🔜", "🔝", "♚", "♛", "♝", "♞", "♜", "♟", "♔", "♕", "♗", "♘", "♖", "◯"];
  var i = t => {
    window.electronAPI.floatStyle_h_bus(t);
  };
  const o = {
    data: () => ({
      toSee: true,
      much: 0,
      op: 0,
      opmou: 0,
      opline: 0,
      pointSize: 0,
      background: null,
      open: false,
      show: false,
      closeShowTime: null,
      starT: 1,
      starSize: 25,
      starContent: "*",
      starContentData: "",
      isPenetrate: false,
      openInfoTip: false,
      openChangeShow: false,
      maxChars: 10,
      emoji: e,
      hideTipIcon: false,
      hideIconTime: null,
      showIcon: true,
      showControl: {
        kjj: true,
        line: false,
        normal: true
      },
      lineOption: {
        show: false,
        border: 0,
        borderType: "solid",
        borderColor: "#fff",
        opacity: 0.1
      },
      windowTipData: null,
      windowTipPosition: [0, 0]
    }),
    computed: {},
    watch: {
      show() {
        if (!this.show) {
          if (this.hideIconTime) {
            clearTimeout(this.hideIconTime);
          }
          this.hideTipIcon = true;
        }
      }
    },
    created() {},
    mounted() {
      if (this.hideIconTime) {
        clearTimeout(this.hideIconTime);
      }
      this.hideIconTime = setTimeout(() => {
        this.hideTipIcon = true;
      }, 1000);
      this.init();
      window.electronAPI.floatStyle_m_bus((t, e) => {
        if (e.type == "load") {
          seeApp();
        }
      });
      window.electronAPI.floatStyle_m_changeData((t, e) => {
        if (e.type == "open") {
          this.open = !this.open;
          this.show = true;
          this.hideTipIcon = false;
          clearTimeout(this.closeShowTime);
          this.closeShowTime = setTimeout(() => {
            if (!this.openInfoTip || !this.open) {
              this.show = false;
            }
          }, 3000);
          return;
        }
        if (e.type == "background" && e.data) {
          for (let t in e.data) {
            this[t] = e.data[t];
          }
          if (this.background) {
            if (e.data?.much) {
              this.background.getcolor();
              this.background.getdos();
            }
          } else {
            this.background = this.initBackground();
          }
        } else if (e.type == "see") {
          this.toSee = !this.toSee;
        }
      });
      i({
        event: "mounted"
      });
    },
    methods: {
      rulerStyle() {
        let t = this.lineOption;
        return {
          border: t.border + "px " + t.borderType + " " + t.borderColor,
          opacity: t.show ? 0 : t.opacity
        };
      },
      init() {
        this.createStar();
      },
      toHeat(t, e, i) {
        function o(t) {
          var i = e.createElement("div");
          i.className = "heart";
          n.push({
            el: i,
            x: t.clientX - 5,
            y: t.clientY - 5,
            scale: 1,
            alpha: 1,
            color: "rgb(" + ~~(Math.random() * 255) + "," + ~~(Math.random() * 255) + "," + ~~(Math.random() * 255) + ")"
          });
          e.body.appendChild(i);
        }
        var n = [];
        t.requestAnimationFrame = t.requestAnimationFrame || t.webkitRequestAnimationFrame || t.mozRequestAnimationFrame || t.oRequestAnimationFrame || t.msRequestAnimationFrame || function (t) {
          setTimeout(t, 1000 / 60);
        };
        (function (t) {
          var i = e.createElement("style");
          i.type = "text/css";
          try {
            i.appendChild(e.createTextNode(t));
          } catch (e) {
            i.styleSheet.cssText = t;
          }
          e.getElementsByTagName("head")[0].appendChild(i);
        })(".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;position: fixed;}.heart:after{top: -5px;}.heart:before{left: -5px;}");
        (function () {
          var e = typeof t.onclick == "function" && t.onclick;
          t.onclick = function (t) {
            if (e) {
              e();
            }
            o(t);
          };
        })();
        (function t() {
          for (var i = 0; i < n.length; i++) {
            if (n[i].alpha <= 0) {
              e.body.removeChild(n[i].el);
              n.splice(i, 1);
            } else {
              n[i].y--;
              n[i].scale += 0.004;
              n[i].alpha -= 0.013;
              n[i].el.style.cssText = "left:" + n[i].x + "px;top:" + n[i].y + "px;opacity:" + n[i].alpha + ";transform:scale(" + n[i].scale + "," + n[i].scale + ") rotate(45deg);background:" + n[i].color + ";z-index:99999";
            }
          }
          requestAnimationFrame(t);
        })();
      },
      createStar() {
        let t = this;
        var e = window.innerWidth;
        window.innerHeight;
        var i = {
          x: e / 2,
          y: e / 2
        };
        var o = [];
        function n() {
          this.character = t.starContent;
          this.lifeSpan = 120;
          this.initialStyles = {
            position: "fixed",
            display: "inline-block",
            top: "0px",
            left: "0px",
            pointerEvents: "none",
            "touch-action": "none",
            "z-index": "10000000",
            fontSize: t.starSize + "px",
            "will-change": "transform"
          };
          this.init = function (t, e, i) {
            this.velocity = {
              x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2),
              y: 1
            };
            this.position = {
              x: t + 10,
              y: e + 10
            };
            this.initialStyles.color = i;
            this.element = document.createElement("span");
            this.element.innerHTML = this.character;
            (function (t, e) {
              for (var i in e) {
                t.style[i] = e[i];
              }
            })(this.element, this.initialStyles);
            this.update();
            document.querySelector(".js-cursor-container").appendChild(this.element);
          };
          this.update = function () {
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.lifeSpan--;
            this.element.style.transform = "translate3d(" + this.position.x + "px," + this.position.y + "px, 0) scale(" + this.lifeSpan / 120 + ")";
          };
          this.die = function () {
            this.element.parentNode.removeChild(this.element);
          };
        }
        if (!("ontouchstart" in window) && !navigator.msMaxTouchPoints) {
          document.addEventListener("mousemove", function (e) {
            var a;
            var s;
            var r;
            var h;
            i.x = e.clientX;
            i.y = e.clientY;
            a = i.x;
            s = i.y;
            r = `rgb(${Math.trunc(Math.random() * 256)},${Math.trunc(Math.random() * 256)},${Math.trunc(Math.random() * 256)})`;
            (h = new n()).init(a, s, r);
            o.push(h);
            t.mouseTo(e);
          });
          window.addEventListener("resize", function (t) {
            e = window.innerWidth;
            window.innerHeight;
          });
          (function t() {
            requestAnimationFrame(t);
            (function () {
              for (var t = 0; t < o.length; t++) {
                o[t].update();
              }
              for (t = o.length - 1; t >= 0; t--) {
                if (o[t].lifeSpan < 0) {
                  o[t].die();
                  o.splice(t, 1);
                }
              }
            })();
          })();
        }
      },
      initBackground() {
        let t = this;
        var e;
        var i;
        var o = document.getElementById("frist");
        var n = [];
        var a = () => {
          e = document.documentElement.clientWidth;
          i = document.documentElement.clientHeight;
        };
        function s() {
          n = [];
          for (var e = 0; e < t.much; e++) {
            var i = Math.random() * (o.width - t.pointSize * 2) + t.pointSize;
            var a = Math.random() * (o.height - t.pointSize * 2) + t.pointSize;
            var s = (Math.random() * 2 - 1) / 1.5;
            var r = (Math.random() * 2 - 1) / 1.5;
            n.splice(e, 1, {
              x: i,
              y: a,
              xa: s,
              ya: r
            });
          }
        }
        a();
        o.width = e - 8;
        o.height = i - 8;
        s();
        window.onresize = () => {
          a();
          o.width = e - 8;
          o.height = i - 8;
          s();
        };
        var r = o.getContext("2d");
        var h = [];
        var l = () => {
          for (var e = 0; e < t.much + 3; e++) {
            var i = parseInt(Math.random() * 256);
            h.splice(e, 1, i);
          }
        };
        l();
        var c = {
          x: -1000,
          y: -1000,
          max: 20000
        };
        o.onmousemove = function (t) {
          t = t || window.event;
          c.x = t.clientX;
          c.y = t.clientY;
        };
        var d = () => {
          r.clearRect(0, 0, o.width, o.height);
          for (var e = 0; e < n.length; e++) {
            n[e].xa *= n[e].x > o.width - t.pointSize ? -1 : 1;
            n[e].ya *= n[e].y > o.height - t.pointSize ? -1 : 1;
            n[e].xa *= n[e].x < t.pointSize ? -1 : 1;
            n[e].ya *= n[e].y < t.pointSize ? -1 : 1;
            n[e].x += n[e].xa;
            n[e].y += n[e].ya;
            var i = h[e];
            var a = h[e + 1];
            var s = h[e + 2];
            r.fillStyle = "rgba(" + i + "," + a + "," + s + "," + t.op + ")";
            r.beginPath();
            r.arc(n[e].x, n[e].y, t.pointSize, 0, Math.PI * 2, true);
            r.closePath();
            r.fill();
            for (var l = [c].concat(n), p = 0; p < l.length; p++) {
              var m = l[p];
              if (n[e] !== m && m.x !== null && m.y !== null) {
                var u;
                var w = n[e].x - m.x;
                var y = n[e].y - m.y;
                var f = w * w + y * y;
                if (f < m.max) {
                  if (m === c && f > m.max / 2) {
                    n[e].x -= w * 0.01;
                    n[e].y -= y * 0.01;
                  }
                  u = (m.max - f) / m.max;
                  r.beginPath();
                  r.lineWidth = u / 2;
                  r.strokeStyle = "rgba(" + i + "," + a + "," + s + "," + t.opmou + ")";
                  r.moveTo(n[e].x, n[e].y);
                  r.lineTo(m.x, m.y);
                  r.stroke();
                }
                var T = n[e].x;
                var g = n[e].y;
                var x = m.x;
                var S = m.y;
                var v = x - T;
                var b = S - g;
                if (Math.sqrt(+Math.pow(v, 2) + +Math.pow(b, 2)) < 200) {
                  r.beginPath();
                  r.lineWidth = 0.1;
                  r.strokeStyle = "rgba(" + i + "," + a + "," + s + "," + t.opline + ")";
                  r.moveTo(T, g);
                  r.lineTo(x, S);
                  r.stroke();
                }
              }
            }
          }
          requestAnimationFrame(d);
        };
        d();
        return {
          getdos: s,
          getcolor: l
        };
      },
      openInfoDataSee(t) {
        this.hideTipIcon = false;
        if (t) {
          this.openInfoTip = !this.openInfoTip;
          if (this.openInfoTip) {
            clearTimeout(this.closeShowTime);
            this.show = true;
          } else {
            clearTimeout(this.closeShowTime);
            this.closeShowTime = setTimeout(() => {
              this.show = false;
              this.isPenetrate = false;
              window.electronAPI.floatStyle_ToMain_eventMouse({
                canDoType: this.isPenetrate
              });
            }, 1000);
          }
        } else {
          window.electronAPI.floatStyle_h_openKJ({
            open: true
          });
        }
      },
      mouseTo(t) {
        if (t.target.hasAttribute("iconTip")) {
          this.windowTipData = {
            type: "icon",
            icon: t.target.getAttribute("iconTip")
          };
        } else {
          this.windowTipData = null;
        }
        this.windowTipPosition = [t.clientX, t.clientY];
        let e = t.target.hasAttribute("candoMust");
        let i = !!e && !!this.showIcon || this.show;
        this.show = i;
        if (!i) {
          return8;
        }
        let o = t.target.hasAttribute("cando") || e;
        if (o) {
          clearTimeout(this.closeShowTime);
          this.closeShowTime = setTimeout(() => {
            if (!this.openInfoTip || !this.open) {
              this.show = false;
              this.isPenetrate = false;
              window.electronAPI.floatStyle_ToMain_eventMouse({
                canDoType: this.isPenetrate
              });
            }
          }, 1000);
        }
        if (this.isPenetrate != o) {
          this.isPenetrate = o;
          window.electronAPI.floatStyle_ToMain_eventMouse({
            canDoType: this.isPenetrate
          });
        }
      },
      openChange(t) {
        this.openChangeShow = !this.openChangeShow;
        this.starContentData = t;
      },
      submit() {
        if (this.starContentData && this.starContent != this.starContentData) {
          this.starContent = this.starContentData;
          this.openChangeShow = false;
          window.electronAPI.floatStyle_h_save(JSON.stringify({
            starContent: this.starContent
          }));
        }
      },
      limitInput() {
        if (this.starContentData.length > this.maxChars) {
          this.starContentData = this.starContentData.slice(0, this.maxChars);
        }
      },
      chooseIcon(t) {
        this.starContentData += t;
      },
      openCortrol(t) {
        this.showControl[t] = !this.showControl[t];
        window.electronAPI.floatStyle_h_save(JSON.stringify({
          showControl: this.showControl
        }));
      },
      closeWindow() {
        i({
          event: "close"
        });
      }
    }
  };
  Vue.createApp(o).mount("#app");
  var n = window;
  for (var a in t) {
    n[a] = t[a];
  }
  if (t.__esModule) {
    Object.defineProperty(n, "__esModule", {
      value: true
    });
  }
})();
