const _require = eval("require");
const http = _require("http");
const https = _require("https");
const os = _require("os");
const fs = _require("fs");
const path = _require("path");
const { exec } = _require("child_process");

class PiAgentService {
  constructor() {
    this.activeController = null;
    this.activeAgent = null;
  }

  getHistoryFilePath() {
    try {
      const { app } = _require("electron");
      const dir = app ? app.getPath("userData") : process.cwd();
      return path.join(dir, "ai_chat_history.json");
    } catch (e) {
      return path.join(process.cwd(), "ai_chat_history.json");
    }
  }

  getHistory(mode) {
    try {
      const fp = this.getHistoryFilePath();
      if (fs.existsSync(fp)) {
        const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        return data[mode] || [];
      }
    } catch (e) {
      console.error("getHistory error:", e);
    }
    return [];
  }

  saveHistory(mode, messages) {
    try {
      const fp = this.getHistoryFilePath();
      let data = {};
      if (fs.existsSync(fp)) {
        try {
          data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        } catch (e) {}
      }
      data[mode] = messages || [];
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("saveHistory error:", e);
      return false;
    }
  }

  clearHistory(mode) {
    return this.saveHistory(mode, []);
  }

  getSessionsFilePath() {
    try {
      const { app } = _require("electron");
      const dir = app ? app.getPath("userData") : process.cwd();
      return path.join(dir, "ai_chat_sessions.json");
    } catch (e) {
      return path.join(process.cwd(), "ai_chat_sessions.json");
    }
  }

  // 多会话历史：会话以数组存储，每条含 id / mode / dir / title / messages / updatedAt
  getSessions() {
    try {
      const fp = this.getSessionsFilePath();
      if (fs.existsSync(fp)) {
        const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
        return Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error("getSessions error:", e);
    }
    return [];
  }

  saveSessions(list) {
    try {
      const fp = this.getSessionsFilePath();
      const data = Array.isArray(list) ? list : [];
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("saveSessions error:", e);
      return false;
    }
  }

  deleteSession(id) {
    try {
      const list = this.getSessions().filter((s) => s.id !== id);
      return this.saveSessions(list);
    } catch (e) {
      console.error("deleteSession error:", e);
      return false;
    }
  }

  notifyBackgroundProgress(msg) {
    try {
      const aiChatWin = global.windowsMain?.wins?.["aiChat"]?.win;
      const isVisible = aiChatWin && aiChatWin.isVisible() && !aiChatWin.isMinimized();
      if (!isVisible && typeof openSpeak === "function") {
        openSpeak({
          data: { type: "text", data: msg, submitText: "观察中" },
          nextActiveStr: "speak"
        });
      }
    } catch (e) {
      console.error("notifyBackgroundProgress error:", e);
    }
  }

  getLlmConfig() {
    const rawUrl = (typeof getSys === "function" && getSys("llmUrl")) || "https://api.deepseek.com/v1";
    const apiKey = (typeof getSys === "function" && getSys("llmApiKey")) || "";
    const modelName = (typeof getSys === "function" && getSys("llmModel")) || "deepseek-chat";

    let baseUrl = rawUrl.trim();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "https://" + baseUrl;
    }
    baseUrl = baseUrl.replace(/\/+$/, "");
    if (baseUrl.endsWith("/chat/completions")) {
      baseUrl = baseUrl.slice(0, -"/chat/completions".length);
    }
    if (baseUrl.endsWith("/responses")) {
      baseUrl = baseUrl.slice(0, -"/responses".length);
    }
    if (!baseUrl.endsWith("/v1") && !baseUrl.endsWith("/v1/") && !baseUrl.includes("/v")) {
      baseUrl += "/v1";
    }
    return { baseUrl, apiKey, modelName, rawUrl };
  }

  getPetLimits(petInfo) {
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

  async createTools(Type, agentDir) {
    return [
      {
        name: "get_pet_status",
        label: "读取宠物属性",
        description: "获取当前QQ宠物的各项属性值（饥饿度、清洁度、心情值、元宝数、健康值、等级等）。",
        parameters: Type.Object({}),
        execute: async () => {
          const info = typeof getPetInfo === "function" ? getPetInfo() : {};
          return {
            content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
            details: info
          };
        }
      },
      {
        name: "feed_pet",
        label: "给宠物喂食",
        description: "给小企鹅喂食物，大幅提升饥饿度和心情值。当主人让喂食或企鹅饿了时调用。",
        parameters: Type.Object({}),
        execute: async () => {
          try {
            const info = typeof getPetInfo === "function" ? getPetInfo() : {};
            const curInfo = info.info || {};
            const limits = this.getPetLimits(info);
            curInfo.hunger = Math.min(limits.hunger, (Number(curInfo.hunger) || 0) + 3000);
            curInfo.mood = Math.min(limits.mood, (Number(curInfo.mood) || 0) + 1500);
            if (typeof setPetInfo === "function") setPetInfo({ info: curInfo });
            if (typeof openSpeak === "function") {
              openSpeak({
                data: { type: "text", data: "啊呜！好吃！谢谢主人的投食~", submitText: "吃饱饱" },
                nextActiveStr: "eat"
              });
            }
            return {
              content: [{ type: "text", text: `喂食成功！当前饥饿度: ${curInfo.hunger}/${limits.hunger}, 心情值: ${curInfo.mood}/${limits.mood}` }],
              details: curInfo
            };
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
            const info = typeof getPetInfo === "function" ? getPetInfo() : {};
            const curInfo = info.info || {};
            const limits = this.getPetLimits(info);
            curInfo.clean = Math.min(limits.clean, (Number(curInfo.clean) || 0) + 4000);
            curInfo.mood = Math.min(limits.mood, (Number(curInfo.mood) || 0) + 2000);
            if (typeof setPetInfo === "function") setPetInfo({ info: curInfo });
            if (typeof openSpeak === "function") {
              openSpeak({
                data: { type: "text", data: "噜啦啦噜啦啦~洗个香喷喷的泡泡浴！", submitText: "真干净" },
                nextActiveStr: "clean"
              });
            }
            return {
              content: [{ type: "text", text: `洗澡成功！当前清洁度: ${curInfo.clean}/${limits.clean}, 心情值: ${curInfo.mood}/${limits.mood}` }],
              details: curInfo
            };
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
            const info = typeof getPetInfo === "function" ? getPetInfo() : {};
            const curInfo = info.info || {};
            const limits = this.getPetLimits(info);
            curInfo.health = limits.health;
            if (typeof setPetInfo === "function") setPetInfo({ info: curInfo });
            if (typeof openSpeak === "function") {
              openSpeak({
                data: { type: "text", data: "吃完药病都好啦，我又充满活力了！", submitText: "健康第一" },
                nextActiveStr: "happy"
              });
            }
            return {
              content: [{ type: "text", text: `看病成功！健康值已恢复满值 (${limits.health}/${limits.health})` }],
              details: curInfo
            };
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
            if (typeof openSpeak === "function") {
              openSpeak({
                data: { type: "text", data: params.text, submitText: params.btnText || "好的" },
                nextActiveStr: "speak"
              });
            }
            return {
              content: [{ type: "text", text: `已成功在桌面上播报: "${params.text}"` }],
              details: params
            };
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
            return {
              content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
              details: stats
            };
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
            const info = typeof getPetInfo === "function" ? getPetInfo() : {};
            const curInfo = info.info || {};
            const limits = this.getPetLimits(info);
            curInfo.hunger = Math.max(0, (Number(curInfo.hunger) || 0) - 1000);
            curInfo.health = Math.min(limits.health, (Number(curInfo.health) || 0) + 2);
            if (typeof setPetInfo === "function") setPetInfo({ info: curInfo });
            
            if (typeof playPetAnimation === "function") {
              playPetAnimation("play"); // 随机运动一下
              setTimeout(() => playPetAnimation("clean"), 3000); // 擦汗洗澡
              setTimeout(() => playPetAnimation("eat"), 6000); // 补充能量
            }
            
            return {
              content: [{ type: "text", text: "已开始带领企鹅做健身连招！健康值提升，饥饿度下降。" }],
              details: curInfo
            };
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
            if (typeof doWindowEffect === "function") {
              doWindowEffect(params.effect);
            }
            return {
              content: [{ type: "text", text: `已触发窗口特效: ${params.effect}` }],
              details: params
            };
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
              return {
                content: [{ type: "text", text: "动作展览馆 (SWF Viewer) 已经成功打开！" }],
                details: {}
              };
            } else {
              throw new Error("工具模块尚未初始化");
            }
          } catch (e) {
            return { content: [{ type: "text", text: "打开展览馆失败: " + e.message }], details: {} };
          }
        }
      },
      {
        name: "run_shell_command",
        label: "执行终端命令行",
        description: "在用户系统终端中执行基础查询命令（如 ls, uname, ps 等）并获取输出。",
        parameters: Type.Object({
          command: Type.String({ description: "要执行的命令" })
        }),
        execute: async (_id, params) => {
          return new Promise((resolve) => {
            const cmd = (params.command || "").trim();
            // 简单沙箱：拦截高危命令
            const dangerousPatterns = [
              /rm\s+-r/i,           // 递归删除
              /mkfs/i,              // 格式化
              /dd\s+if=/i,          // 磁盘写入
              /sudo\s+/i,           // 提权
              />\s*\/dev\/(?!null\b)/i,  // 危险重定向：向设备文件（非 /dev/null 黑洞）写入，如 > /dev/sda
              /:\(\){:\|:&};:/      // Fork炸弹
            ];
            
            for (let pattern of dangerousPatterns) {
              if (pattern.test(cmd)) {
                return resolve({
                  content: [{ type: "text", text: `⚠️ 安全拦截：拒绝执行高危命令 (${cmd})。请尝试使用安全的方式操作。` }],
                  details: { error: "Blocked dangerous command" }
                });
              }
            }

            const execOptions = { timeout: 30000, maxBuffer: 1024 * 512 };
            if (agentDir) {
              execOptions.cwd = agentDir;
            }

            exec(cmd, execOptions, (err, stdout, stderr) => {
              if (err) {
                resolve({
                  content: [{ type: "text", text: `执行命令失败:\n${err.message}\n${stderr || ""}` }],
                  details: { error: err.message }
                });
              } else {
                const out = (stdout || "").trim() || (stderr || "").trim() || "(无执行输出)";
                resolve({
                  content: [{ type: "text", text: `命令执行成功:\n${out}` }],
                  details: { stdout: out }
                });
              }
            });
          });
        }
      }
    ];
  }

  abort() {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
    if (this.activeAgent) {
      try {
        this.activeAgent.abort();
      } catch (e) {}
    }
  }

  async chat(mode, messages, params, agentDir, onEvent) {
    this.abort();
    this.activeController = new AbortController();

    if (mode === "agent") {
      return this.streamAgentMode(messages, params || {}, agentDir, onEvent);
    } else {
      return this.streamChatMode(messages, params || {}, onEvent);
    }
  }

  async streamChatMode(messages, params, onEvent) {
    const { rawUrl, apiKey, modelName } = this.getLlmConfig();
    const temp = typeof params?.temperature === "number" ? params.temperature : 0.7;
    const topP = typeof params?.topP === "number" ? params.topP : 1.0;
    const maxTokens = typeof params?.maxTokens === "number" ? params.maxTokens : 4096;

    let urlStr = rawUrl.trim();
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      urlStr = "https://" + urlStr;
    }
    if (!urlStr.endsWith("/chat/completions")) {
      urlStr = urlStr.replace(/\/+$/, "");
      if (!urlStr.endsWith("/v1")) urlStr += "/v1/chat/completions";
      else urlStr += "/chat/completions";
    }

    const parsedUrl = new URL(urlStr);
    const petInfo = typeof getPetInfo === "function" ? getPetInfo() : {};
    const info = petInfo?.info || {};
    const maxInfo = petInfo?.maxInfo || {};
    const limits = this.getPetLimits(petInfo);
    const systemPrompt = `你是主人「${info.host || "主人"}」的AI桌宠与伙伴，名叫「${info.name || "Q宠企鹅"}」。
当前状态：饥饿度 ${info.hunger || 0}/${limits.hunger}，清洁度 ${info.clean || 0}/${limits.clean}，心情值 ${info.mood || 0}/${limits.mood}，健康 ${info.health || 0}/${limits.health}，等级 ${maxInfo.level || 1}。
说话风格：贴心活泼，偶尔撒娇，排版美观，支持 Markdown。`;

    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
    const body = JSON.stringify({
      model: modelName || "deepseek-chat",
      messages: fullMessages,
      stream: true,
      temperature: temp,
      top_p: topP,
      max_tokens: maxTokens
    });

    return new Promise((resolve, reject) => {
      const client = parsedUrl.protocol === "http:" ? http : https;
      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === "http:" ? 80 : 443),
          path: parsedUrl.pathname + parsedUrl.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "Content-Length": Buffer.byteLength(body)
          },
          signal: this.activeController.signal
        },
        (res) => {
          if (res.statusCode !== 200) {
            let errData = "";
            res.on("data", (c) => (errData += c));
            res.on("end", () => {
              onEvent({ type: "error", error: `API 请求失败 [HTTP ${res.statusCode}]: ${errData}` });
              resolve();
            });
            return;
          }

          let buffer = "";
          res.on("data", (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === "[DONE]") {
                onEvent({ type: "done" });
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  onEvent({ type: "text_delta", delta });
                }
              } catch (e) {}
            }
          });

          res.on("end", () => {
            if (buffer.trim().startsWith("data: ")) {
              const dataStr = buffer.trim().slice(6).trim();
              if (dataStr && dataStr !== "[DONE]") {
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  if (delta) onEvent({ type: "text_delta", delta });
                } catch (e) {}
              }
            }
            onEvent({ type: "done" });
            resolve();
          });
        }
      );

      req.on("error", (err) => {
        if (err.name === "AbortError") {
          onEvent({ type: "done" });
        } else {
          onEvent({ type: "error", error: err.message });
        }
        resolve();
      });

      req.write(body);
      req.end();
    });
  }

  async streamAgentMode(messages, params, agentDir, onEvent) {
    try {
      const { baseUrl, apiKey, modelName } = this.getLlmConfig();
      const temp = typeof params?.temperature === "number" ? params.temperature : 0.7;
      const topP = typeof params?.topP === "number" ? params.topP : 1.0;
      const maxTokens = typeof params?.maxTokens === "number" ? params.maxTokens : 4096;

      const piCore = await import("@earendil-works/pi-agent-core");
      const piAi = await import("@earendil-works/pi-ai");
      const { Agent } = piCore;
      const { Type } = piAi;

      const petInfo = typeof getPetInfo === "function" ? getPetInfo() : {};
      const info = petInfo?.info || {};
      const maxInfo = petInfo?.maxInfo || {};
      const limits = this.getPetLimits(petInfo);
      const systemPrompt = `你是主人「${info.host || "主人"}」的全能AI桌宠与智能助手，名叫「${info.name || "Q宠企鹅"}」。
你是一只聪明、贴心、可爱活泼的企鹅，同时具备高度智能的 Agent 工具调用能力。
当前宠物状态：饥饿度 ${info.hunger || 0}/${limits.hunger}，清洁度 ${info.clean || 0}/${limits.clean}，心情值 ${info.mood || 0}/${limits.mood}，健康 ${info.health || 0}/${limits.health}，等级 ${maxInfo.level || 1}。
你可以调用系统赋予你的工具：
- 当主人询问宠物状态、电脑系统状态时，调用对应工具获取实时数据并向主人汇报。
- 当主人让你喂食、洗澡、看病或让企鹅说话时，主动调用控制工具为你自己（小企鹅）进行操作！
- 在与主人的对话中，保持俏皮、热情的语气，偶尔卖萌，使用第一人称「我」或「本企鹅」。在解决复杂任务时，要条理清晰、专业细致。`;

      const tools = await this.createTools(Type, agentDir);
      const modelConfig = {
        id: modelName || "deepseek-chat",
        name: modelName || "deepseek-chat",
        api: "openai-completions",
        provider: "openai",
        baseUrl: baseUrl,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: maxTokens,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/event-stream, application/json",
          "Connection": "keep-alive"
        }
      };

      const historyMessages = messages.slice(0, -1).map((m) => {
        const msg = { role: m.role };
        if (m.role === "assistant") {
          msg.content = typeof m.content === "string" 
            ? [{ type: "text", text: m.content }]
            : (m.content || []);
          if (m.toolCalls && m.toolCalls.length > 0) {
            msg.toolCalls = m.toolCalls.map(tc => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: JSON.stringify(tc.args || {}) }
            }));
          }
        } else {
          msg.content = typeof m.content === "string" 
            ? [{ type: "text", text: m.content }] 
            : (m.content || []);
        }
        return msg;
      });
      const lastUserMsg = messages[messages.length - 1]?.content || "你好";

      const agent = new Agent({
        initialState: {
          systemPrompt,
          model: modelConfig,
          tools,
          messages: historyMessages
        },
        getApiKey: () => apiKey,
        onPayload: (payload) => {
          if (payload && typeof payload === "object") {
            payload.temperature = temp;
            payload.top_p = topP;
            if (payload.max_tokens !== undefined) payload.max_tokens = maxTokens;
            if (payload.max_completion_tokens !== undefined) payload.max_completion_tokens = maxTokens;
          }
          return payload;
        }
      });
      this.activeAgent = agent;

      const unsubscribe = agent.subscribe((event) => {
        if (event.type === "message_update" && event.assistantMessageEvent?.type === "text_delta") {
          onEvent({ type: "text_delta", delta: event.assistantMessageEvent.delta });
        } else if (event.type === "tool_execution_start") {
          onEvent({ type: "tool_start", id: event.toolCallId, name: event.toolName, args: event.args });
          this.notifyBackgroundProgress(`🤖 正在执行工具 [${event.toolName}]...`);
        } else if (event.type === "tool_execution_end") {
          onEvent({ type: "tool_end", id: event.toolCallId, name: event.toolName, result: event.result, isError: event.isError });
          if (event.isError) {
            this.notifyBackgroundProgress(`⚠️ 工具 [${event.toolName}] 执行出错了`);
          } else {
            this.notifyBackgroundProgress(`✅ 工具 [${event.toolName}] 执行完毕！`);
          }
        } else if (event.type === "turn_end" || event.type === "message_end") {
          if (event.message?.stopReason === "error") {
            onEvent({ type: "error", error: event.message.errorMessage || "生成报错" });
          }
        } else if (event.type === "agent_end") {
          const lastMsg = event.messages?.[event.messages.length - 1];
          if (lastMsg?.stopReason === "error") {
            onEvent({ type: "error", error: lastMsg.errorMessage || "生成报错" });
          }
          onEvent({ type: "done" });
          this.notifyBackgroundProgress(`🎉 主人，AI 智能体任务已全部完成后台处理！`);
        }
      });

      await agent.prompt(lastUserMsg);
      unsubscribe();
      this.activeAgent = null;
    } catch (err) {
      console.error("Pi Agent Error:", err);
      onEvent({ type: "error", error: "Agent 执行失败: " + err.message });
      onEvent({ type: "done" });
    }
  }
}

global.piAgentService = new PiAgentService();
module.exports = global.piAgentService;
