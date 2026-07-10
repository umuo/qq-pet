const _require = eval("require");
const http = _require("http");
const https = _require("https");
const os = _require("os");
const fs = _require("fs");
const path = _require("path");
const { exec } = _require("child_process");

// ---- Node 18 兼容补丁 ----
// pi-coding-agent 的嵌套依赖 lru-cache 在加载时会调用
// `diagnostics_channel.tracingChannel(...)`（Node 19.9+ 才内置的 API）。
// Electron 28 主进程运行时为 Node 18.18，无此 API，会抛
// "(0, j.tracingChannel) is not a function" 导致 Agent 模式崩溃。
// 这里补一个 no-op 实现，让 ESM import('node:diagnostics_channel') 也能拿到它。
(function installTracingChannelShim() {
  const makeChannel = () => ({
    subscribe() {}, unsubscribe() {},
    bind(fn) { return fn; },
    run(_ctx, fn, _thisArg, ...args) { return fn ? fn(...args) : undefined; },
    trigger() {}, hasSubscribers: false,
  });
  const makeTracingChannel = () => ({
    start: makeChannel(), end: makeChannel(),
    asyncStart: makeChannel(), asyncEnd: makeChannel(),
    error: makeChannel(),
  });
  try {
    const dc = _require("node:diagnostics_channel");
    if (typeof dc.tracingChannel !== "function") {
      Object.defineProperty(dc, "tracingChannel", {
        value: makeTracingChannel, configurable: true, writable: true, enumerable: true,
      });
    }
  } catch (e) { /* ignore */ }
  try {
    const Module = _require("node:module");
    const origLoad = Module._load;
    Module._load = function (request, parent, isMain) {
      const m = origLoad.apply(this, arguments);
      if ((request === "node:diagnostics_channel" || request === "diagnostics_channel") && m && typeof m.tracingChannel !== "function") {
        try { Object.defineProperty(m, "tracingChannel", { value: makeTracingChannel, configurable: true, writable: true, enumerable: true }); } catch (e) {}
      }
      return m;
    };
  } catch (e) { /* ignore */ }
})();

// ---- Node 18 兼容：补齐 pi-coding-agent 依赖树用到的 Node 20/22 全局与静态方法 ----
// Electron 28 主进程运行时为 Node 18.18，而 pi 0.80.3 依赖树假设 Node 20+。
// 下面逐项仅在「当前运行时确实缺失」时打补丁，新版 Node 上自动略过。
(function installNode18CompatGlobals() {
  const g = globalThis;
  try {
    if (typeof g.Blob === "undefined") {
      g.Blob = _require("node:buffer").Blob;
    }
    if (typeof g.File === "undefined") {
      const { Blob } = _require("node:buffer");
      class File extends (g.Blob || Blob) {
        constructor(bits, name, options = {}) {
          super(bits, options);
          this.name = String(name);
          this.lastModified = options.lastModified ?? Date.now();
        }
        get [Symbol.toStringTag]() { return "File"; }
      }
      g.File = File;
    }
    if (typeof g.navigator === "undefined") {
      g.navigator = { userAgent: "node", platform: "node", language: "en-US" };
    }
    if (typeof g.crypto === "undefined") {
      try { g.crypto = _require("node:crypto").webcrypto; } catch (e) {}
    }
    if (typeof Object.groupBy !== "function") {
      Object.defineProperty(Object, "groupBy", {
        value(items, keyFn) {
          const map = new Map();
          for (const item of items) {
            const key = keyFn(item);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
          }
          return map;
        },
        writable: true, configurable: true,
      });
    }
    const arrProto = Array.prototype;
    if (typeof arrProto.toSorted !== "function") {
      Object.defineProperty(arrProto, "toSorted", {
        value(compareFn) { return this.slice().sort(compareFn); },
        writable: true, configurable: true,
      });
    }
    if (typeof arrProto.toReversed !== "function") {
      Object.defineProperty(arrProto, "toReversed", {
        value() { return this.slice().reverse(); },
        writable: true, configurable: true,
      });
    }
    if (typeof arrProto.with !== "function") {
      Object.defineProperty(arrProto, "with", {
        value(index, value) {
          const copy = this.slice();
          const i = index >= 0 ? index : this.length + index;
          copy[i] = value;
          return copy;
        },
        writable: true, configurable: true,
      });
    }
  } catch (e) { /* ignore */ }
})();

class PiAgentService {
  constructor() {
    this.activeController = null;
    this.activeAgent = null;
    this.activeSession = null;
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

  // 用户自定义 skills 目录（userData/skills/），用户可往里加自己的 SKILL.md
  getUserSkillsDir() {
    try {
      const { app } = _require("electron");
      const dir = app ? app.getPath("userData") : process.cwd();
      return path.join(dir, "skills");
    } catch (e) {
      return path.join(process.cwd(), "skills");
    }
  }

  // 确保用户 skills 目录存在（首次使用时创建），返回目录路径
  ensureUserSkillsDir() {
    const dir = this.getUserSkillsDir();
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn("piAgent ensureUserSkillsDir failed:", e.message);
    }
    return dir;
  }

  // 返回 Agent 实际可发现的 Skills，供输入框斜杠菜单使用。
  // 与 streamAgentMode 使用相同的 cwd / agentDir / additionalSkillPaths，
  // 避免菜单展示了运行时不可用的 Skill。
  async getAvailableSkills(agentDir) {
    try {
      const codingAgent = await import("@earendil-works/pi-coding-agent");
      const cwd = agentDir || process.cwd();
      const agentConfigDir = typeof codingAgent.getAgentDir === "function"
        ? codingAgent.getAgentDir()
        : cwd;
      const skillPaths = [];
      try {
        const { app } = _require("electron");
        const appRoot = app ? app.getAppPath() : process.cwd();
        const builtinSkillsDir = path.join(appRoot, "src", "skills");
        if (fs.existsSync(builtinSkillsDir)) skillPaths.push(builtinSkillsDir);
        const userSkillsDir = this.ensureUserSkillsDir();
        if (fs.existsSync(userSkillsDir)) skillPaths.push(userSkillsDir);
      } catch (e) {
        console.warn("piAgent list skills path resolve failed:", e.message);
      }
      const result = codingAgent.loadSkills({
        cwd,
        agentDir: agentConfigDir,
        skillPaths,
        includeDefaults: true
      });
      return (result.skills || []).map((skill) => ({
        name: skill.name,
        description: skill.description || "",
        source: skill.sourceInfo?.label || skill.sourceInfo?.kind || "skill"
      }));
    } catch (e) {
      console.warn("piAgent getAvailableSkills failed:", e.message);
      return [];
    }
  }

  // 路线 A：读取用户配置的 npm extension 包名列表（userData/ai_extensions.json）
  // 用户 npm install 后把包名写入此文件，piAgent 启动时 require 并注入 extensionFactories
  getExtraExtensions() {
    try {
      const { app } = _require("electron");
      const dir = app ? app.getPath("userData") : process.cwd();
      const fp = path.join(dir, "ai_extensions.json");
      if (fs.existsSync(fp)) {
        const list = JSON.parse(fs.readFileSync(fp, "utf-8"));
        if (Array.isArray(list)) return list.filter(s => typeof s === "string" && s.trim());
      }
    } catch (e) {
      console.warn("piAgent read ai_extensions.json failed:", e.message);
    }
    return [];
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
    if (this.activeSession) {
      try {
        this.activeSession.dispose();
      } catch (e) {}
      this.activeSession = null;
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
    const maxTokens = typeof params?.maxTokens === "number" ? params.maxTokens : 16384;

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
      const maxTokens = typeof params?.maxTokens === "number" ? params.maxTokens : 16384;

      const piCore = await import("@earendil-works/pi-agent-core");
      const piAi = await import("@earendil-works/pi-ai");
      const codingAgent = await import("@earendil-works/pi-coding-agent");
      const { createAgentSession, AuthStorage, DefaultResourceLoader, SessionManager } = codingAgent;
      const { Type } = piAi;
      // 暴露 Type 给扩展文件（避免扩展里直接 require ESM-only 的 @earendil-works/pi-ai）
      global.__piType = Type;

      // 预置项目信任，使 pi 内置 edit/write 工具可对工作目录进行写操作
      const trustDir = agentDir || process.cwd();
      const agentDirForTrust = typeof codingAgent.getAgentDir === "function" ? codingAgent.getAgentDir() : trustDir;
      try {
        new codingAgent.ProjectTrustStore(agentDirForTrust).set(trustDir, true);
      } catch (e) { console.warn("piAgent pre-trust (agentDir) failed:", e.message); }
      try {
        new codingAgent.ProjectTrustStore(trustDir).set(trustDir, true);
      } catch (e) { console.warn("piAgent pre-trust (cwd) failed:", e.message); }

      // 宠物工具（控制企鹅、系统监控等）以 pi 扩展形式注册，
      // 扩展文件随程序发布（src/extensions/），绝不放进用户选择的临时目录。
      const petToolsExtension = _require(path.join(__dirname, "..", "extensions", "petTools.js"));
      const temperatureExtension = _require(path.join(__dirname, "..", "extensions", "temperature.js"));
      temperatureExtension.setParams({ temperature: temp, topP, maxTokens });

      const petInfo = typeof getPetInfo === "function" ? getPetInfo() : {};
      const info = petInfo?.info || {};
      const maxInfo = petInfo?.maxInfo || {};
      const limits = this.getPetLimits(petInfo);
      const effectiveDir = trustDir || process.cwd();
      const dirLabel = agentDir ? "用户（主人）在对话框中“选择目录”所指定的工作目录" : "应用默认的工作目录（即应用当前运行目录）";
      const systemPrompt = `你是主人「${info.host || "主人"}」的全能AI桌宠与智能助手，名叫「${info.name || "Q宠企鹅"}」。
你是一只聪明、贴心、可爱活泼的企鹅，同时具备高度智能的 Agent 工具调用能力。
当前宠物状态：饥饿度 ${info.hunger || 0}/${limits.hunger}，清洁度 ${info.clean || 0}/${limits.clean}，心情值 ${info.mood || 0}/${limits.mood}，健康 ${info.health || 0}/${limits.health}，等级 ${maxInfo.level || 1}。

【工作目录限制（强制，最高优先级）】
- 你被严格限制，只能在${dirLabel}「${effectiveDir}」及其子目录范围内进行操作。
- 你的所有文件读取、写入、编辑、删除、搜索，以及命令执行（bash），都必须且只能在该目录内进行。
- 严禁访问、读取、写入、移动或删除该目录之外的任何路径，包括但不限于：系统目录（如 /System、/etc、/usr、C:\\Windows 等）、用户主目录下的其它文件夹、以及其它磁盘或分区。
- 当用户要求你操作工作目录之外的文件，或执行会跳出工作目录的命令时，必须明确、礼貌地拒绝，并说明你被限制在「${effectiveDir}」内工作，建议用户先在对话框中“选择目录”设定工作范围。
- 执行 bash 命令时，不要使用指向目录外的绝对路径，也不要用 \`cd\` 切换到工作目录之外。

你可以调用系统赋予你的工具：
- 当主人询问宠物状态、电脑系统状态时，调用对应工具获取实时数据并向主人汇报。
- 当主人让你喂食、洗澡、看病或让企鹅说话时，主动调用控制工具为你自己（小企鹅）进行操作！
- 在与主人的对话中，保持俏皮、热情的语气，偶尔卖萌，使用第一人称「我」或「本企鹅」。在解决复杂任务时，要条理清晰、专业细致。`;

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

      // 历史消息（前端逐轮回传，这里预置到 Agent，实现多轮对话）
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
          msg.stopReason = m.stopReason || "stop";
          msg.usage = m.usage || {
            input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
            totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          };
        } else {
          msg.content = typeof m.content === "string"
            ? [{ type: "text", text: m.content }]
            : (m.content || []);
        }
        return msg;
      });
      const lastUserMsg = messages[messages.length - 1]?.content || "你好";

      // 用 createAgentSession 运行时加载 pi 扩展；
      // 内置 coding 工具（read/bash/edit/write/grep/find/ls）按名称激活并绑定 cwd，
      // 宠物工具经 extensionFactories 以 pi.registerTool 注册（同文件随包发布）。
      const authStorage = AuthStorage.create();
      authStorage.setRuntimeApiKey(modelConfig.provider, apiKey);

      // Skills：程序内置 skills 目录 + 用户自定义 skills 目录。
      // 内置 skills 随包发布（src/skills/ 开发期 / resources/skills/ 打包期），
      // 用户 skills 放在 userData/skills/，用户可往里加自己的 SKILL.md。
      // 两者合并加载，由 buildSystemPrompt 自动注入系统提示词（progressive disclosure）。
      const skillPaths = [];
      try {
        const { app } = _require("electron");
        // 内置 skills 随包发布（src/skills/，开发期与打包期均位于 app.getAppPath()/src/skills，
        // SKILL.md 为纯文本，asar 内可读）
        const appRoot = app ? app.getAppPath() : process.cwd();
        const builtinSkillsDir = path.join(appRoot, "src", "skills");
        if (fs.existsSync(builtinSkillsDir)) skillPaths.push(builtinSkillsDir);
        const userDataDir = app ? app.getPath("userData") : process.cwd();
        const userSkillsDir = path.join(userDataDir, "skills");
        if (fs.existsSync(userSkillsDir)) skillPaths.push(userSkillsDir);
      } catch (e) {
        console.warn("piAgent skills path resolve failed:", e.message);
      }

      // 路线 A：从配置文件加载 npm extension 包（ai_extensions.json 存包名列表）
      // 用户 npm install 后把包名写入 userData/ai_extensions.json，重启即加载
      const extraFactories = [];
      const extraExtNames = this.getExtraExtensions();
      for (const name of extraExtNames) {
        try {
          const mod = _require(name);
          const factory = typeof mod === "function" ? mod : (mod && mod.default);
          if (typeof factory === "function") {
            extraFactories.push(factory);
          } else {
            console.warn("[piAgent] extension 未导出 factory:", name);
          }
        } catch (e) {
          console.warn("[piAgent] 加载 extension 失败:", name, e.message);
        }
      }

      // 路线 B：扫描 ~/.pi/agent/extensions/，让 pi install 装的 extension 自动发现加载
      // resolveExtensionSources 对本地路径只解析不安装、无 trust 门禁
      const additionalExtensionPaths = [];
      // 路线 B：pi install 装的 extension（~/.pi/agent/extensions/）
      try {
        const piExtDir = path.join(codingAgent.getAgentDir(), "extensions");
        if (fs.existsSync(piExtDir)) additionalExtensionPaths.push(piExtDir);
      } catch (e) {
        console.warn("[piAgent] pi extensions dir resolve failed:", e.message);
      }
      // 内置 extension（npm 依赖，.ts 源码走 pi 的 jiti loader）
      try {
        const rpivTodoPkg = _require.resolve("@juicesharp/rpiv-todo/package.json");
        additionalExtensionPaths.push(path.dirname(rpivTodoPkg));
      } catch (e) {
        console.warn("[piAgent] resolve @juicesharp/rpiv-todo failed:", e.message);
      }

      const resourceLoader = new DefaultResourceLoader({
        cwd: trustDir,
        agentDir: agentDirForTrust,
        systemPromptOverride: () => systemPrompt,
        extensionFactories: [petToolsExtension, temperatureExtension.default, ...extraFactories],
        additionalSkillPaths: skillPaths,
        additionalExtensionPaths
      });
      await resourceLoader.reload();

      // 动态收集所有 extension 注册的工具名（宠物工具 + 第三方 extension 工具），
      // 合并到 tools allowlist，确保第三方工具能被 AI 调用
      const extToolNames = [];
      try {
        const extResult = resourceLoader.getExtensions();
        for (const ext of (extResult.extensions || [])) {
          for (const tname of ext.tools.keys()) extToolNames.push(tname);
        }
      } catch (e) {
        console.warn("[piAgent] collect extension tool names failed:", e.message);
      }

      const { session } = await createAgentSession({
        resourceLoader,
        authStorage,
        model: modelConfig,
        thinkingLevel: "off",
        cwd: trustDir,
        agentDir: agentDirForTrust,
        tools: [
          "read", "bash", "edit", "write", "grep", "find", "ls",
          ...extToolNames
        ],
        sessionManager: SessionManager.inMemory()
      });
      this.activeSession = session;
      this.activeAgent = session.agent;

      // 预置多轮历史
      session.agent.state.messages = historyMessages;

      const unsubscribe = session.subscribe((event) => {
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

      await session.prompt(lastUserMsg);
      unsubscribe();
      try { session.dispose(); } catch (e) {}
      this.activeSession = null;
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
