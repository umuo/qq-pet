const _require = eval("require");
const {
  Notification
} = _require("electron");
const windowSay = (_ = {}) => {
  new Notification(_).show();
};
try {
  if (module) {
    module.exports = {
      windowSay
    };
  }
} catch (_) {}
global.windowSay = windowSay;
