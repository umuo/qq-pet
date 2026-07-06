const os = require('os');
const { getPetInfo, setPetInfo } = require('../windows/util/pet/petIndex');

function getCpuLoadAverage(callback) {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;
  for (let i = 0, len = cpus.length; i < len; i++) {
    const cpu = cpus[i];
    for (const type in cpu.times) {
      totalMs += cpu.times[type];
    }
    idleMs += cpu.times.idle;
  }
  
  setTimeout(() => {
    const endCpus = os.cpus();
    let endIdleMs = 0;
    let endTotalMs = 0;
    for (let i = 0, len = endCpus.length; i < len; i++) {
      const cpu = endCpus[i];
      for (const type in cpu.times) {
        endTotalMs += cpu.times[type];
      }
      endIdleMs += cpu.times.idle;
    }
    
    const idleDifference = endIdleMs - idleMs;
    const totalDifference = endTotalMs - totalMs;
    const percentageCpu = 100 - ~~(100 * idleDifference / totalDifference);
    callback(percentageCpu);
  }, 1000);
}

function startSystemWatcher() {
  setInterval(() => {
    const hour = new Date().getHours();
    // 凌晨 1点 到 6点 强制变成睡觉状态
    if (hour >= 1 && hour < 6) {
      const info = typeof getPetInfo === "function" ? getPetInfo() : {};
      if (info && info.info && info.info.mood > 500) {
        info.info.mood = 400; // 降低心情强制让其看起来慵懒/趴下睡觉
        if (typeof setPetInfo === "function") setPetInfo({ info: info.info });
      }
    }
    
    getCpuLoadAverage((cpuLoad) => {
      if (cpuLoad > 80) {
        // CPU 过载，触发颤抖和难受
        if (typeof global.doWindowEffect === 'function') {
          global.doWindowEffect('shake');
        }
        if (typeof global.playPetAnimation === 'function') {
          global.playPetAnimation('sick'); // 或者 play/upset
        }
        
        // 降低心情值
        const info = typeof getPetInfo === "function" ? getPetInfo() : {};
        if (info && info.info) {
          info.info.mood = Math.max(0, (Number(info.info.mood) || 0) - 200);
          if (typeof setPetInfo === "function") setPetInfo({ info: info.info });
        }
      }
    });
  }, 15000); // 每15秒检测一次，避免过度消耗资源
}

module.exports = {
  startSystemWatcher
};
