(() => {
  function t(t) {
    this.url = t || "";
    this.ws = "";
    this.ourControl = true;
    this.state = false;
    this.timeIntval = false;
    this.timeIntvalTime = 5000;
    this.WebSocketValue = "";
    this.backValue = function (t) {
      console.log(t, "未设置msg返回函数");
    };
    this.getws = function (t) {
      return t;
    };
    this.Data = "";
    this.heartBeat = "";
    this.loginData = "";
    this.ids = "";
    this.states = {
      0: "CONNECTING-正在连接",
      1: "OPEN-连接成功",
      2: "CLOSING-正在关闭",
      3: "CLOSED-表示连接已经关闭，或者打开连接失败"
    };
    return this;
  }
  t.prototype.$callBack = function (t, e, a, s) {
    this.backValue = function (a) {
      if (t || e) {
        if (t && a.data) {
          t(a.data);
        }
        if (e && a.state) {
          e(this.state);
        }
      } else {
        console.log(a, "未设置msg返回函数");
      }
    };
    this.getws = a || this.getws;
    this.ids = s;
    return this;
  };
  t.prototype.$connect = function (t) {
    this.ourControl = true;
    let e = this;
    this.Data = t;
    this.loginData = {
      con: this.ids,
      router: "login"
    };
    this.heartBeat = {
      router: "heartbeat"
    };
    this.ws = new WebSocket(e.url);
    this.ws.onopen = function (t) {
      try {
        if (e.ws.readyState == 0 || e.ws.readyState == 1) {
          e.ws.send(JSON.stringify(e.loginData));
          if (e.state == 0) {
            e.state = true;
            e.backValue({
              state: true
            });
          }
        }
      } catch (t) {
        e.state = false;
        e.backValue({
          state: true
        });
      }
    };
    this.ws.onmessage = function (t) {
      if (e.state == 0) {
        e.state = true;
        e.backValue({
          state: true
        });
      }
      let a = t.data;
      try {
        a = JSON.parse(t.data);
      } catch (t) {}
      e.backValue({
        data: a
      });
    };
    this.ws.onclose = function (t) {
      e.state = false;
      e.backValue({
        state: true
      });
      if (e.timeIntval) {
        clearInterval(e.timeIntval);
      }
      e.timeIntval = setTimeout(() => {
        e.$connect(e.Data);
      }, e.timeIntvalTime);
    };
    this.getws(this.ws);
    return this;
  };
  t.prototype.send = function (t = {}) {
    if (this.ws.send) {
      try {
        t = JSON.stringify(t);
      } catch (t) {}
      this.ws.send(t);
    }
  };
  t.prototype.$heartbeat = function () {
    let t = this;
    if (t.timeIntval) {
      clearInterval(t.timeIntval);
    }
    t.timeIntval = setInterval(() => {
      if (this.ourControl) {
        if (t.state) {
          clearInterval(t.timeIntval);
        } else {
          console.log("重新连接");
          t.$connect(t.Data);
        }
      }
    }, t.timeIntvalTime);
  };
  t.prototype.$outws = function () {
    this.ourControl = false;
    clearInterval(this.timeIntval);
    this.timeIntval = false;
    this.WebSocketValue = {};
    this.state = false;
  };
  module.exports = {};
})();
