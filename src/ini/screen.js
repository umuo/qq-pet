const _require = eval("require");
const {
  screen
} = _require("electron");
let size = null;
let oneSize = [0, 0];
global.getScreenSize = (e = false, r = false) => size && !e ? size : r ? oneSize : changeScreenSize();
const changeScreenSize = () => {
  let e = screen.getAllDisplays();
  let r = 0;
  let i = 0;
  for (let n in e) {
    if (n == 0) {
      oneSize[0] = e[n].workAreaSize.width;
      oneSize[1] = e[n].workAreaSize.height;
    }
    r += e[n].workAreaSize.width;
    i += e[n].workAreaSize.height;
  }
  size = [r, i];
  return size;
};
getScreenSize();
