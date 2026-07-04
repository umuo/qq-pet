# QQ Pet Animations (Flash / SWF)

本项目包含大量从原版 QQ 宠物提取的 Flash 动画（.swf）。所有的动画都存放在 `src/assets/Action` 目录下。

## 目录结构
动画资源按照 **性别**、**年龄阶段** 和 **当前心情状态** 进行了详细分类：

- **性别**：
  - `GG` (公企鹅)
  - `MM` (母企鹅)
- **年龄段**：
  - `Egg` (蛋阶段)
  - `Kid` (幼年期)
  - `Adult` (成年期)

## 全局基础动画 (所有状态下通用)
- **诞生与成长**：`Enter1.swf` ~ `Enter3.swf` (登场), `First.swf` (初次见面), `LevUp.swf` (升级)
- **退出与隐藏**：`Exit1.swf` ~ `Exit4.swf` (退出), `Hide_left.swf`, `Hide_right.swf` (贴边隐藏)
- **日常生活**：`Clean1.swf`, `Clean2.swf` (洗澡), `Eat1.swf`, `Eat2.swf` (吃饭)
- **生病与治疗**：`Sick1.swf`, `Sick2.swf` (生病), `Cure1.swf`, `Cure2.swf` (吃药), `Dying.swf` (濒死), `Die.swf` (死亡), `Bury.swf` (埋葬), `Revival.swf` (复活)
- **其他功能**：`game/Game.swf` (小游戏), `Etoj.swf` / `Jtoc.swf` (特殊姿态转换)

## 按心情状态划分的动作 (以成年期为例)
成年期（Adult）在日常待机时，会根据心情进入不同的状态文件夹。每个状态下都会有配套的 `Stand` (待机)、`Speak` (说话) 以及大量的 `play` (随机小动作)。

1. **peaceful** (平静)
   - 包含多达 **100 种** 休闲小动作 (`play/P1.swf` ~ `P100.swf`)
2. **happy** (开心)
   - 包含 **47 种** 休闲小动作 (`play/P1.swf` ~ `P47.swf`)
3. **prostrate** (趴下/慵懒)
   - 包含 **46 种** 休闲小动作 (`play/P1.swf` ~ `P46.swf`)
4. **upset** (心烦意乱)
   - 包含 **23 种** 休闲小动作 (`play/P1.swf` ~ `P23.swf`)
5. **sad** (伤心)
   - 包含 **22 种** 休闲小动作 (`play/P1.swf` ~ `P22.swf`)

### 心情专属动作
每个心情文件夹内除了丰富的 `play` 动作库，通常还会固定包含：
- `Appear.swf` (弹出)
- `Hide.swf` (隐藏)
- `Speak.swf` (说话表情)
- `Stand.swf` (默认待机动作)
- `interact/` (鼠标互动动作库)

## 代码调用机制
核心加载逻辑位于 [`src/windows/util/pet/swfPet.js`](file:///Users/gitsilence/github/qq-pet/src/windows/util/pet/swfPet.js)。
系统通过状态机控制，当调用 `this.swfPet.changeSwf('play')` 时，系统会自动判断当前的性别 (`GG`/`MM`)、年龄阶段 (`Egg`/`Kid`/`Adult`) 和心情 (`happy`/`peaceful`...)，并从对应的 `play` 文件夹中**随机抽取**一个编号（比如 `happy` 状态下就在 `1~47` 之间随机抽取），拼装成类似 `src/assets/Action/GG/Adult/happy/play/P15.swf` 的路径进行渲染播放。
