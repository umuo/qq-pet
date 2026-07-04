# QQ 宠物架构说明 (Architecture)

本项目基于标准的 Electron + Vue 3 架构，但为了复刻经典的 QQ 宠物体验，我们在其中融合了大量的老旧 Flash 技术和现代的 AI 技术。

## 核心技术栈
- **核心框架**: `Electron` (负责桌面级权限、托盘、多窗口交互等)
- **前端渲染**: `Vue 3` + 原生 DOM 操作 (无需复杂框架，保持轻量)
- **动画引擎**: `Ruffle` (基于 WebAssembly 的开源 Flash 播放器，取代了已被淘汰的 Pepper Flash Plugin)
- **数据持久化**: `Electron Store` / `fs` 写入本地 JSON

## 目录结构设计
```text
qq-pet/
├── main.js                  # Electron 主进程入口 (初始化、崩溃保护)
├── src/
│   ├── ini/                 # 主进程业务逻辑模块
│   │   ├── doMain.js        # 核心启动流程
│   │   ├── pet.js           # 企鹅的核心数据模型 (Mood, Growth, Health, Hunger等)
│   │   └── sys.js           # 系统级状态和快捷键
│   ├── service/
│   │   └── piAgent.js       # AI Agent 智能体沙箱，执行终端命令及提供工具
│   ├── windows/             # 所有渲染进程 (UI 窗口)
│   │   ├── main/            # 企鹅本体渲染窗口
│   │   ├── popups/          # 右键菜单、设置、聊天气泡、资料卡等弹窗
│   │   ├── tool/            # 其他工具窗口
│   │   └── util/            
│   │       ├── pet/swfPet.js # Flash 动画控制器 (极其重要，控制状态转移)
│   │       └── communication/# 对话和文本气泡生成逻辑
│   └── assets/              # 所有本地静态资源
│       └── Action/          # 上百个原版企鹅 swf 动画
└── docs/                    # 项目相关文档
```

## 核心交互机制
### 1. 窗口通信 (IPC)
企鹅的本体 (`main` 窗口) 与其他的弹窗 (如 `rightMenu`, `aiChat`) 完全是独立的 Electron BrowserWindow。它们之间的数据通信通过 Electron 的 `ipcMain` 和 `ipcRenderer` 实现。为了方便，封装了 `window.electronAPI` 挂载在预加载脚本 (`preload.js`) 中。

### 2. Flash 动画控制 (`swfPet.js`)
企鹅的视觉表现全部由 `src/windows/util/pet/swfPet.js` 接管。
通过维护一个复杂的状态机 (State Machine)，系统会根据企鹅的**年龄 (age)**、**健康 (health)**、**心情 (mood)**，自动拼接并加载 `assets/Action/` 目录下的相应 `.swf` 动画，并通过 `RufflePlayer` 进行渲染。

### 3. AI 智能体注入 (`piAgent.js`)
我们在应用中注入了 AI 工具链。
当你对企鹅下达指令（如“帮我写个脚本”或者“查看当前目录”），`aiChat` 窗口会调用后台的 LLM，并将 `piAgent.js` 提供的受限执行环境暴露给大模型。沙箱拦截了高危指令，并确保所有终端操作仅限定在指定的工作目录下执行。
