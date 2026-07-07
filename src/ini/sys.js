const _require = eval("require");
let winObject = _require("../windows/window.js");
global.windowsMain = new winObject();
global.mylog = function () {
  console.log("---------" + tool.getTime());
  for (let e in arguments) {
    console.log(arguments[e]);
  }
  console.log("---------");
};
global.setSay = function () {
  console.log("----html----" + tool.getTime());
  for (let e in arguments) {
    console.log(arguments[e]);
  }
  console.log("---------");
};
/* [CLEAN] 已移除 node-machine-id 和系统信息采集 */
global.machineId = "local-only";
global.windowInfo = "{}";
const v8 = require("v8");
const useMB = 1048576;
global.getV8Result = e => {
  const o = v8.getHeapStatistics();
  for (let e in o) {
    if (+o[e] == +o[e]) {
      o[e] = o[e] / useMB;
    }
  }
  if (e) {
    return o[e];
  } else {
    return o;
  }
};
module.exports = {};
