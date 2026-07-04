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
      sessions: {
        chat: [],
        agent: []
      },
      inputQuery: "",
      isGenerating: false,
      showParamsModal: false,
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
            this.scrollToBottom();
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

        window.electronAPI.aiChat_m_onHistory((evt, data) => {
          if (data && data.mode && Array.isArray(data.history)) {
            const uiMode = data.mode.startsWith("agent|") ? "agent" : data.mode;
            this.sessions[uiMode] = data.history;
            this.scrollToBottom();
          }
        });

        window.electronAPI.aiChat_m_onStream((evt, event) => {
          this.handleStreamEvent(event);
        });

        window.electronAPI.aiChat_m_onSelectedDir((evt, dirPath) => {
          if (dirPath) {
            this.agentDir = dirPath;
            // 清空当前界面记录
            this.sessions.agent = [];
            // 请求新目录的历史记录
            window.electronAPI.aiChat_h_get_history(`agent|${this.agentDir}`);
          }
        });

        window.electronAPI.aiChat_h_bus({ event: "mounted" });
        window.electronAPI.aiChat_h_get_config();
        window.electronAPI.aiChat_h_get_history("chat");
        // 初始化时不自动获取 agent 历史，因为需要先选目录
      }
    },
    methods: {
      switchMode(newMode) {
        if (this.mode === newMode || this.isGenerating) return;
        this.mode = newMode;
        if (newMode === "chat") {
          window.electronAPI.aiChat_h_get_history("chat");
        } else if (newMode === "agent" && this.agentDir) {
          window.electronAPI.aiChat_h_get_history(`agent|${this.agentDir}`);
        }
        setTimeout(() => this.scrollToBottom(), 100);
      },
      selectAgentDir() {
        if (this.isGenerating) return;
        if (window.electronAPI && window.electronAPI.aiChat_h_select_dir) {
          window.electronAPI.aiChat_h_select_dir();
        }
      },
      saveCurrentHistory() {
        if (window.electronAPI && window.electronAPI.aiChat_h_save_history) {
          try {
            const plainMessages = JSON.parse(JSON.stringify(this.sessions[this.mode] || []));
            window.electronAPI.aiChat_h_save_history({
              mode: this.mode,
              messages: plainMessages
            });
          } catch (e) {
            console.warn('saveCurrentHistory serialize error:', e);
          }
        }
      },
      clearCurrentHistory() {
        if (this.isGenerating) return;
        if (confirm("确定要清空当前【" + (this.mode === 'chat' ? '闲聊模式' : 'Agent模式') + "】的所有对话记录吗？")) {
          this.sessions[this.mode] = [];
          if (window.electronAPI && window.electronAPI.aiChat_h_clear_history) {
            window.electronAPI.aiChat_h_clear_history(this.mode);
          }
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
          toolCalls: []
        });

        this.inputQuery = "";
        this.isGenerating = true;
        this.scrollToBottom();
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
              lastMsg.content = (lastMsg.content || "") + `\n\n> [!WARNING]\n> ⚠️ **生成错误**: ${event.error || "未知异常"}`;
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
          lastMsg.content = (lastMsg.content || "") + (event.delta || "");
          this.scrollToBottom();
        } else if (event.type === "tool_start") {
          if (!lastMsg.toolCalls) lastMsg.toolCalls = [];
          lastMsg.toolCalls.push({
            id: event.id || Math.random().toString(),
            name: event.name || "unknown_tool",
            args: event.args || {},
            status: "running",
            result: null
          });
          this.scrollToBottom();
        } else if (event.type === "tool_end") {
          if (lastMsg.toolCalls) {
            const tc = lastMsg.toolCalls.find(
              (c) => c.id === event.id || (c.name === event.name && c.status === "running")
            );
            if (tc) {
              tc.status = event.isError ? "error" : "completed";
              tc.result = event.result;
            }
          }
          this.scrollToBottom();
        }
      },
      renderMarkdown(text) {
        if (!text) return "";
        try {
          if (window.marked && typeof window.marked.parse === "function") {
            const renderer = new window.marked.Renderer();
            renderer.code = (arg1, arg2) => {
              let codeText = typeof arg1 === "object" && arg1 !== null ? arg1.text : arg1;
              let lang = typeof arg1 === "object" && arg1 !== null ? (arg1.lang || "") : (arg2 || "");
              
              let highlighted = codeText;
              try {
                if (window.electronAPI && window.electronAPI.highlightCode) {
                  highlighted = window.electronAPI.highlightCode(codeText, lang);
                }
              } catch (e) {
                console.error("Highlight error:", e);
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
            return window.marked.parse(text, { renderer });
          }
        } catch (e) {}
        return text.replace(/\n/g, "<br/>");
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
      scrollToBottom() {
        this.$nextTick(() => {
          const el = this.$refs.messageContainer;
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        });
      }
    }
  };

  const app = Vue.createApp(AppOptions);
  app.mount("#app");
})();
