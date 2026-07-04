# QQ 宠物 macOS 干净版

> 本项目移植/搬运自原开源仓库：[xuemian168/qqpet_automation](https://github.com/xuemian168/qqpet_automation)

这是一个为 macOS 打造的 QQ 宠物桌面应用。基于 Electron 构建，移除了不必要的遥测和设备指纹采集，并内置了基于 AI 的智能体 (Agent) 模式，可以让企鹅不仅是桌面挂件，还是你的个人智能助手！

## 核心特性
* 桌面宠物互动（喂食、洗澡、看病等）
* 干净无广告，移除流氓行为和指纹采集
* 内置 AI 聊天模式
* 强大的 Agent 智能体模式，支持直接让企鹅帮你执行终端命令、查询系统状态等自动化操作！

## 开发与运行
### macOS 安装提示
由于本项目开源且未进行 Apple 开发者证书签名，首次打开下载的 `.dmg` 安装包中的应用时，macOS 可能会提示“已损坏，无法打开”或“无法验证开发者”。
安装后，请在终端 (Terminal) 中运行以下命令来绕过安全限制：
```bash
sudo xattr -rd com.apple.quarantine /Applications/QQ宠物.app
```

### 本地开发
确保你已经安装了 Node.js (推荐 v18+)。

```bash
# 安装依赖
npm install

# 本地运行开发环境
npm run dev

# 打包为 macOS dmg 应用
npm run build:dmg
```

## AI Agent 模式说明
Agent 模式使用强大的大语言模型，赋予企鹅执行复杂任务的能力。
* **安全沙箱**：自带基于工作目录的沙箱隔离和高危命令拦截（如 `rm -rf`, `sudo` 等），保护系统安全。
* **自定义工具**：可以在 `src/service/piAgent.js` 中的 `createTools` 里扩展宠物的更多自动化能力。

## 详细文档
关于项目的深层机制和特殊玩法，请查阅以下文档：
* 🎥 [Flash 动画库详解及调用机制](file:///Users/gitsilence/github/qq-pet/docs/animations.md)
* 🏗️ [整体架构与模块设计](file:///Users/gitsilence/github/qq-pet/docs/architecture.md)
* ⌨️ [开发者快捷键与隐藏作弊码](file:///Users/gitsilence/github/qq-pet/docs/shortcuts.md)
