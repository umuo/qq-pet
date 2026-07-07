(() => {
  var e = {};
  window.move = class {
    constructor(e) {
      this.moveDom = e.id ? document.getElementById(e.id) : null;
      this.isDown = false;
      this.isMoveIn = false;
      this.isMoveInOnce = false;
      this.start = [0, 0];
      this.next = [0, 0];
      this.callBack = {
        contextmenu: e.contextmenu || null,
        mousedown: e.mousedown || null,
        mousemove: e.mousemove || null,
        mouseup: e.mouseup || null,
        mouseout: e.mouseout || null,
        keydown: e.keydown || null
      };
      this.state = false;
      this.size = [this.moveDom.clientWidth, this.moveDom.clientHeight];
      return this;
    }
    init(e = {}) {
      if (e.id) {
        this.destroy();
        this.moveDom = document.getElementById(e.id);
        this.size = [this.moveDom.clientWidth, this.moveDom.clientHeight];
      }
      if (this.moveDom) {
        if (this.callBack.contextmenu) {
          this.BindContextmenuFn = this.contextmenuFn.bind(this);
        }
        if (this.callBack.mousedown) {
          this.BindmousedownFn = this.mousedownFn.bind(this);
        }
        if (this.callBack.mousemove) {
          this.BindmousemoveFn = this.mousemoveFn.bind(this);
        }
        if (this.callBack.mouseup) {
          this.BindmouseupFn = this.mouseupFn.bind(this);
        }
        if (this.callBack.mouseout) {
          this.BindmouseoutFn = this.mouseoutFn.bind(this);
        }
        if (this.callBack.keydown) {
          this.BindkeydownFn = this.keydownFn.bind(this);
        }
        if (this.callBack.contextmenu) {
          this.moveDom.addEventListener("contextmenu", this.BindContextmenuFn);
        }
        if (this.callBack.mousedown) {
          this.moveDom.addEventListener("mousedown", this.BindmousedownFn);
        }
        if (this.callBack.mousemove) {
          document.addEventListener("mousemove", this.BindmousemoveFn);
        }
        if (this.callBack.mouseup) {
          document.addEventListener("mouseup", this.BindmouseupFn);
        }
        if (this.callBack.mouseout) {
          this.moveDom.addEventListener("mouseout", this.BindmouseoutFn);
        }
        if (this.callBack.keydown) {
          document.addEventListener("keydown", this.BindkeydownFn);
        }
        this.state = true;
        return this;
      } else {
        return this;
      }
    }
    contextmenuFn(e) {
      e.preventDefault();
      this.callBack.contextmenu(e);
    }
    mousedownFn(e) {
      if (e.which == 1) {
        this.start = [e.clientX, e.clientY];
        this.isDown = true;
      } else if (e.which != 2) {
        e.which;
      }
      this.callBack.mousedown(e);
    }
    mousemoveFn(e) {
      this.isMoveIn = true;
      if (this.isMoveInOnce != "clicked" && this.isMoveInOnce != "click") {
        this.isMoveInOnce = "click";
      } else {
        this.isMoveInOnce = "clicked";
      }
      this.next = null;
      if (this.isDown) {
        this.next = [this.start[0] - e.clientX, this.start[1] - e.clientY];
      }
      this.callBack.mousemove(e, {
        next: this.next,
        isMoveIn: this.isMoveIn,
        isMoveInOnce: this.isMoveInOnce
      });
    }
    mouseupFn(e) {
      this.callBack.mouseup(e, {
        isDown: this.isDown
      });
      this.isDown &&= false;
    }
    mouseoutFn(e) {
      this.callBack.mouseout(e, {
        isDown: this.isDown,
        isMoveIn: this.isMoveIn,
        isMoveInOnce: "clicked"
      });
      this.isMoveIn &&= false;
      if (this.isMoveInOnce == "clicked" || this.isMoveInOnce == "click") {
        this.isMoveInOnce = false;
      }
    }
    keydownFn(e) {
      console.log("e :>> ", e);
      this.callBack.keydown(e, {
        key: e.key,
        code: e.code,
        type: e.type,
        keyCode: e.keyCode
      });
    }
    destroy() {
      if (this.state) {
        console.log("销毁");
        if (this.callBack.contextmenu) {
          this.moveDom.removeEventListener("contextmenu", this.BindContextmenuFn);
        }
        if (this.callBack.mousedown) {
          this.moveDom.removeEventListener("mousedown", this.BindmousedownFn);
        }
        if (this.callBack.mousemove) {
          document.removeEventListener("mousemove", this.BindmousemoveFn);
        }
        if (this.callBack.mouseup) {
          document.removeEventListener("mouseup", this.BindmouseupFn);
        }
        if (this.callBack.mouseout) {
          this.moveDom.removeEventListener("mouseout", this.BindmouseoutFn);
        }
        if (this.callBack.keydown) {
          document.removeEventListener("keydown", this.BindkeydownFn);
        }
        this.state = false;
      }
    }
    getSize() {
      return this.size;
    }
  };
  var t = window;
  for (var s in e) {
    t[s] = e[s];
  }
  if (e.__esModule) {
    Object.defineProperty(t, "__esModule", {
      value: true
    });
  }
})();
