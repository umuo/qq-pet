// 宠物工具扩展（pi-coding-agent ExtensionAPI）
//
// 重要：这些文件随 QQ 宠物程序一起发布，位于 src/extensions/ 目录，
// 与用户通过对话框“选择目录”设定的临时工作目录完全无关。
// 工具被注册后，仅代表“能力定义”；真正操作文件/命令时，由运行时把
// 用户选定的工作目录（agentDir）作为 cwd 与信任根传入，二者互不干扰。

const os = require("node:os");

// Typebox 的 Type 由 piAgent.js 在加载本扩展前写入 global.__piType，
// 避免本文件直接用 require 加载 ESM-only 的 @earendil-works/pi-ai。
const Type = global.__piType;
if (!Type) {
  throw new Error("[petTools] global.__piType 未初始化，请在 piAgent.js 中先 import @earendil-works/pi-ai");
}

function getPetInfoSafe() {
  return typeof global.getPetInfo === "function" ? global.getPetInfo() : { info: {}, maxInfo: {} };
}

function getLimits(petInfo) {
  const maxInfo = petInfo?.maxInfo || {};
  const num = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    hunger: num(maxInfo.hunger, 3100),
    clean: num(maxInfo.clean, 3100),
    mood: num(maxInfo.mood, 1000),
    health: num(maxInfo.health, 5)
  };
}

const toolDefs = [
  {
    name: "get_pet_status",
    label: "读取宠物属性",
    description: "获取当前QQ宠物的各项属性值（饥饿度、清洁度、心情值、元宝数、健康值、等级等）。",
    parameters: Type.Object({}),
    execute: async () => {
      const info = getPetInfoSafe();
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }], details: info };
    }
  },
  {
    name: "feed_pet",
    label: "给宠物喂食",
    description: "给小企鹅喂食物，大幅提升饥饿度和心情值。当主人让喂食或企鹅饿了时调用。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const info = getPetInfoSafe();
        const curInfo = info.info || {};
        const limits = getLimits(info);
        curInfo.hunger = Math.min(limits.hunger, (Number(curInfo.hunger) || 0) + 3000);
        curInfo.mood = Math.min(limits.mood, (Number(curInfo.mood) || 0) + 1500);
        if (typeof global.setPetInfo === "function") global.setPetInfo({ info: curInfo });
        if (typeof global.openSpeak === "function") {
          global.openSpeak({ data: { type: "text", data: "啊呜！好吃！谢谢主人的投食~", submitText: "吃饱饱" }, nextActiveStr: "eat" });
        }
        return { content: [{ type: "text", text: `喂食成功！当前饥饿度: ${curInfo.hunger}/${limits.hunger}, 心情值: ${curInfo.mood}/${limits.mood}` }], details: curInfo };
      } catch (e) {
        return { content: [{ type: "text", text: "喂食失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "clean_pet",
    label: "帮宠物洗澡",
    description: "帮小企鹅洗个香喷喷的泡泡浴，大幅提升清洁度和心情值。当主人让洗澡或企鹅脏了时调用。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const info = getPetInfoSafe();
        const curInfo = info.info || {};
        const limits = getLimits(info);
        curInfo.clean = Math.min(limits.clean, (Number(curInfo.clean) || 0) + 4000);
        curInfo.mood = Math.min(limits.mood, (Number(curInfo.mood) || 0) + 2000);
        if (typeof global.setPetInfo === "function") global.setPetInfo({ info: curInfo });
        if (typeof global.openSpeak === "function") {
          global.openSpeak({ data: { type: "text", data: "噜啦啦噜啦啦~洗个香喷喷的泡泡浴！", submitText: "真干净" }, nextActiveStr: "clean" });
        }
        return { content: [{ type: "text", text: `洗澡成功！当前清洁度: ${curInfo.clean}/${limits.clean}, 心情值: ${curInfo.mood}/${limits.mood}` }], details: curInfo };
      } catch (e) {
        return { content: [{ type: "text", text: "洗澡失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "cure_pet",
    label: "给宠物喂药看病",
    description: "给生病的宠物吃药看病，恢复健康值。当企鹅生病或健康值低下时调用。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const info = getPetInfoSafe();
        const curInfo = info.info || {};
        const limits = getLimits(info);
        curInfo.health = limits.health;
        if (typeof global.setPetInfo === "function") global.setPetInfo({ info: curInfo });
        if (typeof global.openSpeak === "function") {
          global.openSpeak({ data: { type: "text", data: "吃完药病都好啦，我又充满活力了！", submitText: "健康第一" }, nextActiveStr: "happy" });
        }
        return { content: [{ type: "text", text: `看病成功！健康值已恢复满值 (${limits.health}/${limits.health})` }], details: curInfo };
      } catch (e) {
        return { content: [{ type: "text", text: "治疗失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "pet_speak",
    label: "控制桌面宠物冒泡说话",
    description: "让桌面企鹅在屏幕上冒泡说出一句指定的话。当需要主动向主人汇报或打招呼时使用。",
    parameters: Type.Object({
      text: Type.String({ description: "企鹅说的话（建议20字以内，活泼俏皮）" }),
      btnText: Type.Optional(Type.String({ description: "气泡下方主人回应按钮的文字（建议4字以内）" }))
    }),
    execute: async (_id, params) => {
      try {
        if (typeof global.openSpeak === "function") {
          global.openSpeak({ data: { type: "text", data: params.text, submitText: params.btnText || "好的" }, nextActiveStr: "speak" });
        }
        return { content: [{ type: "text", text: `已成功在桌面上播报: "${params.text}"` }], details: params };
      } catch (e) {
        return { content: [{ type: "text", text: "播报失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "get_system_stats",
    label: "监控系统资源负载",
    description: "读取主机的计算机系统性能监控数据，包括 CPU 使用率、剩余内存与总内存、运行时间等。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        const cpus = os.cpus();
        const cpuModel = cpus?.[0]?.model || "Unknown CPU";
        const loadAvg = os.loadavg().map((n) => n.toFixed(2)).join(", ");
        const stats = {
          platform: os.platform(),
          arch: os.arch(),
          cpuModel,
          cpuCores: cpus.length,
          totalMemory: totalMem,
          freeMemory: freeMem,
          loadAverage: loadAvg,
          uptimeHours: (os.uptime() / 3600).toFixed(1) + " h"
        };
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }], details: stats };
      } catch (e) {
        return { content: [{ type: "text", text: "读取系统监控失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "perform_workout",
    label: "带企鹅做健身操",
    description: "让企鹅执行一套包含多个动作的健身连招组合（跑动、洗澡等），能够提升健康值和消耗饥饿度。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const info = getPetInfoSafe();
        const curInfo = info.info || {};
        const limits = getLimits(info);
        curInfo.hunger = Math.max(0, (Number(curInfo.hunger) || 0) - 1000);
        curInfo.health = Math.min(limits.health, (Number(curInfo.health) || 0) + 2);
        if (typeof global.setPetInfo === "function") global.setPetInfo({ info: curInfo });
        if (typeof global.playPetAnimation === "function") {
          global.playPetAnimation("play");
          setTimeout(() => global.playPetAnimation("clean"), 3000);
          setTimeout(() => global.playPetAnimation("eat"), 6000);
        }
        return { content: [{ type: "text", text: "已开始带领企鹅做健身连招！健康值提升，饥饿度下降。" }], details: curInfo };
      } catch (e) {
        return { content: [{ type: "text", text: "健身失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "do_window_effect",
    label: "触发企鹅物理特效",
    description: "让企鹅所在的窗口产生物理特效，支持 shake (颤抖) 和 float (失重飘浮)。",
    parameters: Type.Object({
      effect: Type.String({ description: "特效名称: shake 或 float" })
    }),
    execute: async (_id, params) => {
      try {
        if (typeof global.doWindowEffect === "function") global.doWindowEffect(params.effect);
        return { content: [{ type: "text", text: `已触发窗口特效: ${params.effect}` }], details: params };
      } catch (e) {
        return { content: [{ type: "text", text: "特效执行失败: " + e.message }], details: {} };
      }
    }
  },
  {
    name: "open_swf_viewer",
    label: "打开动作展览馆 (SWF Viewer)",
    description: "打开隐藏的动作预览大厅，可以查看所有的企鹅动画（包括上百个隐藏动作）。",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        if (global.toolWindow && global.toolWindow.viewSwf) {
          global.toolWindow.viewSwf.cleate();
          return { content: [{ type: "text", text: "动作展览馆 (SWF Viewer) 已经成功打开！" }], details: {} };
        } else {
          throw new Error("工具模块尚未初始化");
        }
      } catch (e) {
        return { content: [{ type: "text", text: "打开展览馆失败: " + e.message }], details: {} };
      }
    }
  }
];

// 以 pi-coding-agent 的 ExtensionAPI 注册所有宠物工具
module.exports = function (pi) {
  for (const def of toolDefs) {
    pi.registerTool(def);
  }
};
