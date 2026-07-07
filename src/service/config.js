(() => {
  var r = {
    868: (r, e, t) => {
      r = t.nmd(r);
      try {
        if (r) {
          /* [CLEAN] 已禁用远程 API 地址 */r.exports = {
            baseUrl: "http://127.0.0.1:33051",
            baseUrlFile: ""
          };
        }
      } catch (r) {}
    }
  };
  var e = {};
  function t(s) {
    var a = e[s];
    if (a !== undefined) {
      return a.exports;
    }
    var o = e[s] = {
      id: s,
      loaded: false,
      exports: {}
    };
    r[s](o, o.exports, t);
    o.loaded = true;
    return o.exports;
  }
  t.nmd = r => {
    r.paths = [];
    r.children ||= [];
    return r;
  };
  var s = t(868);
  module.exports = s;
})();
