const { app, dialog } = require('electron');
const fs = require('node:fs'), path = require('node:path');
const { randomUUID } = require('node:crypto');
const save = require('./save');
let busy = false;
async function settleWindows() {
  await require('../../windows/popups/farm/main').close();
  const names = ['desktopGames','smallGame','backRoom','fishing'];
  for (const name of names) {
    const win = global.windowsMain?.wins[name]?.win;
    if (!win || win.isDestroyed()) continue;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { win.removeListener('closed',done); reject(Error('游戏窗口未能关闭，请先退出游戏后重试。')); },5000);
      function done() {clearTimeout(timer);resolve();}
      win.once('closed',done);win.close();
    });
    if (name==='fishing' && require('../../windows/popups/fishing/main').lastSaveError) throw require('../../windows/popups/fishing/main').lastSaveError;
  }
}
async function run(action, parent) {
  if (busy || !['exportSave','importSave'].includes(action)) return;
  busy = true;
  try {
    if (action === 'exportSave') {
      const result = await dialog.showSaveDialog(parent,{title:'导出宠物存档（会先关闭农场和游戏）',defaultPath:'QQ宠物存档.json',filters:[{name:'QQ 宠物存档',extensions:['json']}]});
      if (result.canceled || !result.filePath) return;
      await settleWindows();
      save.write(result.filePath,save.snapshot());
      openSpeak({data:{type:'text',data:'宠物存档导出成功，任务、旅行、照片、农场和背包都保存好了~'},active:'speak'});
    } else {
      const result = await dialog.showOpenDialog(parent,{title:'导入宠物存档',properties:['openFile'],filters:[{name:'QQ 宠物存档',extensions:['json']}]});
      if (result.canceled || !result.filePaths[0]) return;
      const file = result.filePaths[0];
      if (fs.statSync(file).size > save.LIMIT) throw Error('存档超过 16 MB，无法导入。');
      const incoming = save.parse(fs.readFileSync(file,'utf8'));
      const confirmation = await dialog.showMessageBox(parent,{type:'question',title:'导入宠物存档',message:`导入“${incoming.pet.info.name || '企鹅'}”的存档？`,detail:`元宝：${incoming.pet.info.yb}\n照片：${incoming.pet.playroom?.travel?.photos?.length || 0} 张\n当前宠物会先备份到应用数据目录，随后关闭游戏并重启。导入文件不会包含或替换本机 AI 密钥。`,buttons:['取消','备份并导入'],defaultId:0,cancelId:0,noLink:true});
      if (confirmation.response !== 1) return;
      await settleWindows();
      const dir = app.getPath('userData'), backups = path.join(dir,'pet-backups');
      fs.mkdirSync(backups,{recursive:true});
      save.write(path.join(backups,`${Date.now()}-${randomUUID()}.json`),save.snapshot());
      save.write(path.join(dir,'pending-pet-import.json'),{...incoming,importId:randomUUID()});
      // Apply on the next boot, before runtime/watchers start. Old windows must
      // never write their cached pet over the imported snapshot.
      app.relaunch();
      app.exit(0);
    }
  } catch (error) {
    await dialog.showMessageBox(parent,{type:'error',title:'存档操作未完成',message:error.message,buttons:['知道了']});
  } finally {busy = false;}
}
module.exports = {run,settleWindows};
