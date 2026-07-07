const _require = eval("require"),
  request = _require("../request");
module.exports = {
  /* [CLEAN] 已禁用远程 API */ getLogs: () => Promise.resolve({}),
  getPetConfig: () => Promise.resolve({}),
  setQPetInfo: () => Promise.resolve({}),
};
