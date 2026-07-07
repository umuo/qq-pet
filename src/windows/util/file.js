const _require = eval("require");
const fs = _require("fs");
const iconv = _require("iconv-lite");
const doFiles = (e, r, t, l) => {
  let s = t == "move" ? moveFile : copyFile;
  let n = r => {
    fs.access(r, fs.constants.F_OK | fs.constants.W_OK, function (o) {
      if (o) {
        if (o.code === "ENOENT") {
          addFolder(r, e => {
            if (e.msg == "success") {
              n(r);
            } else {
              l({
                event: "error",
                msg: e.msg
              });
            }
          });
        } else {
          l({
            event: "error",
            msg: "没有该文件夹权限"
          });
        }
      } else {
        (() => {
          for (let n in e) {
            try {
              let t = r + "/" + e[n].name;
              let o = () => {
                s(e[n], t, l);
              };
              if (fs.existsSync(t)) {
                l({
                  event: "error",
                  msg: "该文件已存在",
                  val: e[n]
                });
              } else {
                o();
              }
            } catch (r) {
              l({
                event: "error",
                msg: t == "move" ? "文件移动错误" : "文件复制错误",
                val: {
                  ...e[n],
                  error: r
                }
              });
            }
          }
        })();
      }
    });
  };
  n(r);
};
const moveFile = (e, r, t) => {
  fs.rename(e.path, r, r => {
    t(r ? {
      event: "error",
      msg: "文件移动失败",
      val: e
    } : {
      event: "success",
      msg: "文件移动成功",
      val: e
    });
  });
};
const copyFile = (e, r, t) => {
  let l = fs.readFileSync(e.path);
  t(fs.writeFileSync(r, l) ? {
    event: "error",
    msg: "文件复制失败",
    val: e
  } : {
    event: "success",
    msg: "文件复制成功",
    val: e
  });
};
const nameAddOnce = e => {
  let r = e.split("（");
  let t = r[r[r.length - 1]];
  if (!t) {
    return e + "（1）";
  }
  if (t.split("）")[1] || arrNo[1] == null) {
    return e + "（1）";
  }
  {
    let t = +arrNo[0];
    if (t != t) {
      return e + "（1）";
    }
    r[r[r.length - 1]] = `（${+t + 1}）`;
  }
};
const getAllFolder = function (e, r, t) {
  let l = e.replace(/\\/g, "/");
  let s = l.split("/");
  let n = "";
  if (s[s.length - 1]) {
    if (!t) {
      s.splice(s.length - 1, 1);
    }
    l = s.join("/");
  }
  fs.readdir(l, function (e, s) {
    var n = [];
    (function e(o) {
      if (s && s.length) {
        if (o != s.length) {
          fs.stat(l + "/" + s[o], function (c, a) {
            try {
              if (t?.outFile == "add") {
                n.push({
                  name: s[o],
                  isDirectory: a.isDirectory(),
                  router: l,
                  ownRouter: l + "/",
                  fillRouter: l + "/" + s[o]
                });
              } else if (t || a.isDirectory()) {
                if (t?.outFile) {
                  if (t?.iconv) {
                    let e = fs.readFileSync(l + "/" + s[o], {
                      encoding: "binary"
                    });
                    n.push(iconv.decode(new Buffer(e, "binary"), "GBK"));
                  } else {
                    let e = fs.readFileSync(l + "/" + s[o], t?.fileType || "utf-8");
                    n.push(e);
                  }
                } else {
                  n.push(s[o]);
                }
              }
              e(o + 1);
            } catch {
              r([]);
            }
          });
        } else {
          r(n, l);
        }
      } else {
        r([]);
      }
    })(0);
  });
};
const addFolder = function (e, r) {
  let t = e.replace(/\\/g, "/");
  let l = t.split("/");
  if (l[l.length - 1]) {
    l.push("");
    t = l.join("/");
  }
  let s = [];
  let n = l.length;
  let o = 0;
  for (let e = n - 1; e >= 0; e--) {
    let r = l.slice(0, e).join("/");
    fs.access(r, function (t, l) {
      if (t) {
        if (t.code === "ENOENT") {
          if (e != 0) {
            s.unshift(r);
          }
        } else {
          console.log(" not pass");
        }
      }
      o++;
      if (o == n) {
        c(s);
      }
    });
  }
  let c = e => {
    let t = 0;
    let l = e.length;
    let s = [];
    let n = (o = 0) => {
      if (e[o]) {
        fs.mkdir(e[o], function (c) {
          if (c) {
            s.push(e[o]);
          }
          t++;
          if (t == l) {
            r({
              event: "addFolders",
              msg: s.length == 0 ? "success" : s
            });
          } else {
            n(t);
          }
        });
      }
    };
    n();
  };
};
const reFileNames = function (e, r) {
  for (let t in e) {
    reFileName(e[t], r);
  }
};
const reFileName = function (e, r) {
  let t = e.path.replace(/\\/g, "/");
  let l = t.replace("/" + e.oldName, "/" + e.newName);
  let s = {
    ...e,
    path: t,
    newPathIs: l,
    newNameIs: e.name.replace(e.oldName, e.newName)
  };
  let n = () => {
    fs.rename(e.path, l, function (e) {
      r(e ? {
        event: "rename",
        msg: "重命名失败",
        val: s
      } : {
        event: "rename",
        msg: "success",
        val: s
      });
    });
  };
  if (fs.existsSync(l)) {
    r({
      event: "error",
      msg: "该文件已存在",
      val: s
    });
  } else {
    try {
      n();
    } catch (e) {
      n();
    }
  }
};
try {
  if (module) {
    module.exports = {
      doFiles,
      getAllFolder,
      reFileNames
    };
  }
} catch (e) {}
