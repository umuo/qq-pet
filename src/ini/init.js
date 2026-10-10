const _require = eval("require");
_require("../windows/util/aes.js");
_require("./tool.js");
_require("./store.js");
if (!initData?.NODE_TOOL) {
  _require("../service/gameplay/save").applyPending(global.$Store, _require("electron").app.getPath("userData"));
}
_require("./sys.js");
_require("./screen.js");
_require("./safe.js");
if (!initData?.NODE_TOOL) {
  _require("./pet.js");
}
