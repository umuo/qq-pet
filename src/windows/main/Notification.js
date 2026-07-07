const _require = eval("require"),
  { Notification } = _require("electron"),
  windowSay = (_ = {}) => {
    new Notification(_).show();
  };
try {
  module && (module.exports = { windowSay });
} catch (_) {}
global.windowSay = windowSay;
