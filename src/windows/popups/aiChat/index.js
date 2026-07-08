(() => {
  window.copyCodeText = (btn) => {
    try {
      const code = decodeURIComponent(btn.getAttribute("data-code") || "");
      let copied = false;
      if (window.electronAPI && window.electronAPI.copyText) {
        copied = window.electronAPI.copyText(code);
      }
      if (!copied && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
        copied = true;
      }
      if (!copied) {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copied = true;
      }
      const origHtml = btn.innerHTML;
      btn.innerHTML = "✅ 复制成功";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.classList.remove("copied");
      }, 2000);
    } catch (err) {
      console.error("Copy code error:", err);
      btn.innerHTML = "❌ 复制失败";
    }
  };

  const AppOptions = {
    data: () => ({
      mode: "agent",
      agentDir: "",
      // 当前各模式的实时会话消息数组（引用历史列表中的同一条目，编辑即同步）
      sessions: {
        chat: [],
        agent: []
      },
      // 当前各模式正在编辑的会话 id（null 表示尚未落库，将在首次发送时新建）
      activeId: {
        chat: null,
        agent: null
      },
      // 全部已保存会话（含闲聊与 Agent，按 mode 区分）
      historyList: [],
      inputQuery: "",
      isGenerating: false,
      showParamsModal: false,
      showHistory: false,
      isFullscreen: false,
      autoFollow: true,
      genParams: {
        temperature: 0.7,
        topP: 1.0,
        maxTokens: 4096
      },
      config: {
        baseUrl: "",
        modelName: ""
      }
    }),
    computed: {
      messages() {
        return this.sessions[this.mode] || [];
      },
      // 按模式分组的会话（用于历史面板展示）
      groupedSessions() {
        const groups = { chat: [], agent: [] };
        for (const s of this.historyList) {
          if (groups[s.mode]) groups[s.mode].push(s);
        }
        for (const k of ["chat", "agent"]) {
          groups[k].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }
        return groups;
      }
    },
    mounted() {
      window.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
          const selectedText = window.getSelection().toString();
          if (selectedText && window.electronAPI && window.electronAPI.copyText) {
            window.electronAPI.copyText(selectedText);
          }
        }
      });

      if (window.electronAPI) {
        window.electronAPI.aiChat_m_onBus((evt, data) => {
          if (data?.type === "load") {
            if (typeof seeApp === "function") seeApp();
            this.scrollToBottom(true);
          }
        });

        window.electronAPI.aiChat_m_onConfig((evt, cfg) => {
          if (cfg) {
            this.config = {
              baseUrl: cfg.baseUrl || "",
              modelName: cfg.modelName || ""
            };
          }
        });

        // 历史会话列表初始化
        window.electronAPI.aiChat_m_onSessions((evt, list) => {
          this.historyList = Array.isArray(list) ? list : [];
          this.initLiveFromHistory();
          this.scrollToBottom(true);
        });

        window.electronAPI.aiChat_m_onStream((evt, event) => {
          this.handleStreamEvent(event);
        });

        window.electronAPI.aiChat_m_onSelectedDir((evt, dirPath) => {
          if (dirPath) {
            this.agentDir = dirPath;
            // 切换工作目录时，载入该目录下最近的 Agent 会话（不丢失其它目录的历史）
            const match = this.historyList
              .filter((s) => s.mode === "agent" && s.dir === dirPath)
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
            if (match) {
              this.sessions.agent = match.messages;
              this.activeId.agent = match.id;
            } else {
              this.sessions.agent = [];
              this.activeId.agent = null;
            }
            this.scrollToBottom(true);
          }
        });

        // 主进程同步全屏状态（用户用系统手势进入/退出全屏时也同步图标）
        window.electronAPI.aiChat_m_onFullscreen((evt, data) => {
          this.isFullscreen = !!(data && data.isFullscreen);
        });

        window.electronAPI.aiChat_h_bus({ event: "mounted" });
        window.electronAPI.aiChat_h_get_config();
        window.electronAPI.aiChat_h_get_sessions();
      }

      // 跟踪用户是否停留在底部附近：仅在贴底时自动跟随流式滚动，
      // 用户上翻查看历史时停止硬拉，避免滚动抖动
      const el = this.$refs.messageContainer;
      if (el) {
        el.addEventListener("scroll", () => {
          const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
          this.autoFollow = distance < 48;
        });
      }
    },
    methods: {
      // 从已保存历史中恢复各模式的「当前会话」，切换模式时不再清空
      initLiveFromHistory() {
        const chatMatch = this.historyList
          .filter((s) => s.mode === "chat")
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
        if (chatMatch) {
          this.sessions.chat = chatMatch.messages;
          this.activeId.chat = chatMatch.id;
        }
        if (this.agentDir) {
          const agentMatch = this.historyList
            .filter((s) => s.mode === "agent" && s.dir === this.agentDir)
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
          if (agentMatch) {
            this.sessions.agent = agentMatch.messages;
            this.activeId.agent = agentMatch.id;
          }
        }
      },
      switchMode(newMode) {
        if (this.mode === newMode || this.isGenerating) return;
        // 仅切换显示，保留各模式的内存会话，不再从磁盘重载覆盖
        this.mode = newMode;
        this.scrollToBottom(true);
      },
      selectAgentDir() {
        if (this.isGenerating) return;
        if (window.electronAPI && window.electronAPI.aiChat_h_select_dir) {
          window.electronAPI.aiChat_h_select_dir();
        }
      },
      toggleHistory() {
        this.showHistory = !this.showHistory;
      },
      deriveTitle(messages) {
        const firstUser = messages.find((m) => m.role === "user");
        const raw = firstUser ? (typeof firstUser.content === "string" ? firstUser.content : "") : "";
        const text = (raw || "新会话").replace(/\s+/g, " ").trim();
        return text.length > 18 ? text.slice(0, 18) + "…" : (text || "新会话");
      },
      // 把当前实时会话落库到历史列表并持久化
      saveCurrentHistory() {
        const mode = this.mode;
        const msgs = this.sessions[mode] || [];
        if (!this.activeId[mode]) {
          if (msgs.length === 0) return; // 空会话无需保存
          const id = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
          this.historyList.push({
            id,
            mode,
            dir: mode === "agent" ? this.agentDir : "",
            title: this.deriveTitle(msgs),
            messages: msgs,
            updatedAt: Date.now()
          });
          this.activeId[mode] = id;
        } else {
          const sess = this.historyList.find((s) => s.id === this.activeId[mode]);
          if (sess) {
            sess.messages = msgs;
            sess.updatedAt = Date.now();
            if (!sess.title) sess.title = this.deriveTitle(msgs);
          } else {
            // activeId 悬空，重建条目
            const id = this.activeId[mode];
            this.historyList.push({
              id,
              mode,
              dir: mode === "agent" ? this.agentDir : "",
              title: this.deriveTitle(msgs),
              messages: msgs,
              updatedAt: Date.now()
            });
          }
        }
        this.persistSessions();
      },
      persistSessions() {
        if (window.electronAPI && window.electronAPI.aiChat_h_save_sessions) {
          try {
            window.electronAPI.aiChat_h_save_sessions(
              JSON.parse(JSON.stringify(this.historyList))
            );
          } catch (e) {
            console.warn("persistSessions serialize error:", e);
          }
        }
      },
      // 新建当前模式的空白会话（旧会话仍保留在历史中）
      newSession() {
        if (this.isGenerating) return;
        this.sessions[this.mode] = [];
        this.activeId[this.mode] = null;
        this.showHistory = false;
        this.scrollToBottom(true);
      },
      // 载入历史中的某条会话
      loadSession(sess) {
        if (this.isGenerating) return;
        this.sessions[sess.mode] = sess.messages;
        this.activeId[sess.mode] = sess.id;
        this.mode = sess.mode;
        if (sess.mode === "agent") this.agentDir = sess.dir || this.agentDir;
        this.showHistory = false;
        this.scrollToBottom(true);
      },
      deleteSession(sess) {
        this.historyList = this.historyList.filter((s) => s.id !== sess.id);
        if (this.activeId[sess.mode] === sess.id) {
          this.sessions[sess.mode] = [];
          this.activeId[sess.mode] = null;
        }
        this.persistSessions();
      },
      clearCurrentHistory() {
        if (this.isGenerating) return;
        if (confirm("确定要清空当前【" + (this.mode === 'chat' ? '闲聊模式' : 'Agent模式') + "】的所有对话记录吗？")) {
          // 从历史中移除当前会话并清空实时消息
          if (this.activeId[this.mode]) {
            this.historyList = this.historyList.filter((s) => s.id !== this.activeId[this.mode]);
          }
          this.sessions[this.mode] = [];
          this.activeId[this.mode] = null;
          this.persistSessions();
          this.scrollToBottom(true);
        }
      },
      toggleParamsModal() {
        this.showParamsModal = !this.showParamsModal;
      },
      resetParams() {
        this.genParams = {
          temperature: 0.7,
          topP: 1.0,
          maxTokens: 4096
        };
      },
      closeWindow() {
        if (this.isGenerating) this.abortGeneration();
        this.saveCurrentHistory();
        if (window.electronAPI) {
          window.electronAPI.aiChat_h_bus({ event: "close" });
        }
      },
      minimizeWindow() {
        if (window.electronAPI) {
          window.electronAPI.aiChat_h_bus({ event: "minimize" });
        }
      },
      toggleFullscreen() {
        if (window.electronAPI) {
          window.electronAPI.aiChat_h_bus({ event: "fullscreen" });
        }
      },
      abortGeneration() {
        this.isGenerating = false;
        if (window.electronAPI) {
          window.electronAPI.aiChat_h_abort();
        }
      },
      handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      },
      sendMessage() {
        const query = (this.inputQuery || "").trim();
        if (!query || this.isGenerating) return;

        if (!this.sessions[this.mode]) this.sessions[this.mode] = [];

        this.sessions[this.mode].push({
          role: "user",
          content: query
        });

        this.sessions[this.mode].push({
          role: "assistant",
          content: "",
          toolCalls: [],
          blocks: [] // 有序块：文本块与工具块按真实时间线交错，解决渲染顺序错乱
        });

        this.inputQuery = "";
        this.isGenerating = true;
        this.scrollToBottom(true);
        this.saveCurrentHistory();

        if (window.electronAPI) {
          const historyToSend = this.sessions[this.mode].slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content
          }));
          const plainParams = JSON.parse(JSON.stringify(this.genParams));
          window.electronAPI.aiChat_h_send({
            mode: this.mode,
            agentDir: this.agentDir,
            messages: historyToSend,
            params: plainParams
          });
        }
      },
      handleStreamEvent(event) {
        if (!event) return;
        if (event.type === "done") {
          this.isGenerating = false;
          this.scrollToBottom();
          this.saveCurrentHistory();
          return;
        } else if (event.type === "error") {
          this.isGenerating = false;
          const curList = this.sessions[this.mode];
          if (curList && curList.length > 0) {
            const lastMsg = curList[curList.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              const errText = `\n\n> [!WARNING]\n> ⚠️ **生成错误**: ${event.error || "未知异常"}`;
              lastMsg.content = (lastMsg.content || "") + errText;
              if (!lastMsg.blocks) lastMsg.blocks = [];
              const lastBlock = lastMsg.blocks[lastMsg.blocks.length - 1];
              if (lastBlock && lastBlock.type === "text") lastBlock.text += errText;
              else lastMsg.blocks.push({ type: "text", text: errText });
            }
          }
          this.scrollToBottom();
          this.saveCurrentHistory();
          return;
        }

        const curList = this.sessions[this.mode];
        if (!curList || curList.length === 0) return;
        const lastMsg = curList[curList.length - 1];
        if (!lastMsg || lastMsg.role !== "assistant") return;

        if (event.type === "text_delta") {
          const delta = event.delta || "";
          if (!lastMsg.blocks) lastMsg.blocks = [];
          const lastBlock = lastMsg.blocks[lastMsg.blocks.length - 1];
          if (lastBlock && lastBlock.type === "text") {
            lastBlock.text += delta;
          } else {
            lastMsg.blocks.push({ type: "text", text: delta });
          }
          // 同步 content 字段，供历史存档兼容
          lastMsg.content = lastMsg.blocks
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");
          this.scrollToBottom();
        } else if (event.type === "tool_start") {
          if (!lastMsg.blocks) lastMsg.blocks = [];
          if (!lastMsg.toolCalls) lastMsg.toolCalls = [];
          const toolBlock = {
            type: "tool",
            id: event.id || Math.random().toString(),
            name: event.name || "unknown_tool",
            args: event.args || {},
            status: "running",
            result: null
          };
          // blocks 与 toolCalls 持有同一对象引用，更新其一即可同步
          lastMsg.blocks.push(toolBlock);
          lastMsg.toolCalls.push(toolBlock);
          this.scrollToBottom();
        } else if (event.type === "tool_end") {
          if (!lastMsg.blocks) lastMsg.blocks = [];
          if (!lastMsg.toolCalls) lastMsg.toolCalls = [];
          let tc = lastMsg.blocks.find(
            (b) => b.type === "tool" && (b.id === event.id || (b.name === event.name && b.status === "running"))
          );
          if (!tc) {
            tc = lastMsg.toolCalls.find(
              (c) => c.id === event.id || (c.name === event.name && c.status === "running")
            );
          }
          if (tc) {
            tc.status = event.isError ? "error" : "completed";
            tc.result = event.result;
          }
          this.scrollToBottom();
        }
      },
      // 流式渲染时对未闭合的围栏做容错，避免「普通文本 ↔ 代码块」的布局突变抖动
      _balanceFences(text) {
        const lines = String(text).split("\n");
        const fences = [];
        for (const line of lines) {
          const m = line.match(/^\s*(`{3,}|~{3,})/);
          if (m) fences.push(m[1][0]);
        }
        if (fences.length % 2 === 1) {
          const last = fences[fences.length - 1];
          const marker = last === "~" ? "~~~" : "```";
          return text + "\n" + marker;
        }
        return text;
      },
      renderMarkdown(text, streaming) {
        if (!text) return "";
        let src = text;
        if (streaming) {
          // 补全未闭合的代码围栏，让 marked 始终输出 <pre>，不再来回切换渲染形态
          src = this._balanceFences(src);
        }
        try {
          if (window.marked && typeof window.marked.parse === "function") {
            const renderer = new window.marked.Renderer();
            renderer.code = (arg1, arg2) => {
              let codeText = typeof arg1 === "object" && arg1 !== null ? arg1.text : arg1;
              let lang = typeof arg1 === "object" && arg1 !== null ? (arg1.lang || "") : (arg2 || "");

              let highlighted = codeText;
              if (streaming) {
                // 流式阶段不做语法高亮：不完整代码反复高亮会闪烁跳动，
                // 待本轮生成结束（streaming=false）后一次性高亮更稳定
                highlighted = codeText
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;");
              } else {
                try {
                  if (window.electronAPI && window.electronAPI.highlightCode) {
                    highlighted = window.electronAPI.highlightCode(codeText, lang);
                  }
                } catch (e) {
                  console.error("Highlight error:", e);
                }
              }

              const safeCode = encodeURIComponent(codeText || "");
              const displayLang = lang ? lang.toUpperCase() : "CODE";
              return `<div class="code-block-wrapper not_drag">
                <div class="code-block-header fcb">
                  <span class="code-lang">${displayLang}</span>
                  <button class="copy-code-btn focusPress" onclick="window.copyCodeText(this)" data-code="${safeCode}">
                    📋 一键复制
                  </button>
                </div>
                <pre><code class="hljs ${lang ? 'language-' + lang : ''}">${highlighted}</code></pre>
              </div>`;
            };
            return window.marked.parse(src, { renderer });
          }
        } catch (e) {}
        return src.replace(/\n/g, "<br/>");
      },
      getToolIcon(name) {
        const map = {
          get_pet_status: "📊",
          feed_pet: "🍔",
          clean_pet: "🛁",
          cure_pet: "💊",
          pet_speak: "💬",
          get_system_stats: "🖥️",
          run_shell_command: "⌨️"
        };
        return map[name] || "🔧";
      },
      getToolLabel(name) {
        const map = {
          get_pet_status: "读取企鹅属性状态",
          feed_pet: "投食喂养企鹅",
          clean_pet: "给企鹅洗香香",
          cure_pet: "给企鹅吃药看病",
          pet_speak: "控制企鹅冒泡说话",
          get_system_stats: "监控电脑系统负载",
          run_shell_command: "执行终端命令行"
        };
        return map[name] || name;
      },
      getModeBadge(mode) {
        return mode === "agent" ? "⚡ Agent" : "💬 闲聊";
      },
      formatTime(ts) {
        if (!ts) return "";
        const d = new Date(ts);
        const pad = (n) => (n < 10 ? "0" + n : "" + n);
        return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      },
      formatResult(res) {
        if (!res) return "(无数据)";
        if (typeof res === "string") return res;
        try {
          if (res.content && Array.isArray(res.content)) {
            return res.content.map((c) => c.text || JSON.stringify(c)).join("\n");
          }
          return JSON.stringify(res, null, 2);
        } catch (e) {
          return String(res);
        }
      },
      // force=true 时无论如何滚到底（用户主动操作 / 载入会话等）；
      // 否则仅在 autoFollow（用户停留在底部附近）时跟随，避免流式过程中
      // 反复硬拉滚动条造成抖动，也允许用户上翻查看历史。
      scrollToBottom(force) {
        if (!force && !this.autoFollow) return;
        const el = this.$refs.messageContainer;
        if (!el) return;
        requestAnimationFrame(() => {
          const el2 = this.$refs.messageContainer;
          if (!el2) return;
          // 跟随滚动必须瞬时（auto）：若用 smooth，scrollTop 在追赶动画中持续触发
          // scroll 事件，会把 autoFollow 误判为「用户滚上去了」而停止跟随
          el2.style.scrollBehavior = "auto";
          el2.scrollTop = el2.scrollHeight;
          requestAnimationFrame(() => { el2.style.scrollBehavior = ""; });
        });
      },
    }
  };

  const app = Vue.createApp(AppOptions);
  app.mount("#app");
})();
