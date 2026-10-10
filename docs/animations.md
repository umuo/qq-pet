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
3. **prostrate** (趴下/慵懒，保留素材，不再随机用作默认待机)
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
核心加载逻辑位于 `src/windows/util/pet/swfPet.js`。
系统通过状态机控制，当调用 `this.swfPet.changeSwf('play')` 时，系统会自动判断当前的性别 (`GG`/`MM`)、年龄阶段 (`Egg`/`Kid`/`Adult`) 和心情 (`happy`/`peaceful`...)，并从对应的 `play` 文件夹中**随机抽取**一个编号（比如 `happy` 状态下就在 `1~47` 之间随机抽取），拼装成类似 `src/assets/Action/GG/Adult/happy/play/P15.swf` 的路径进行渲染播放。


## Ruffle 下的待机和鼠标互动

宠物控制器显式创建 Ruffle 播放器，用 SWF 元数据的帧数、帧率和播放时间估算根时间轴进度，抵达最后一帧后保持该值。Ruffle 没有旧 Flash 的 `CurrentFrame()` / `TotalFrames()` 接口；直接调用会使状态机无法完成动作切换。估算适用于根时间轴的动作调度，不读取动画内部子时间轴，也不提供真正的跳帧功能。

成年企鹅高心情时固定使用 happy/Stand，沿用参考项目默认站立行为；删除旧实现每十次待机抽取一次、50% 进入 prostrate 的持久趴姿逻辑。低心情的状态选择仍按当前养成规则；随机小动作本身可以包含短暂趴下，结束后回到对应 Stand。

进入普通待机后等待 20～60 秒，80% 概率播放当前年龄、性别、心情对应的小动作，20% 概率触发闲聊。动作结束后重新开始计时。贴边隐藏、小游戏和其他动作不触发这轮待机计时。加载下一动作时保留旧画面，待新播放器加载并绘制后再替换。

主进程每 50 毫秒检查全局鼠标位置，变化时向宠物窗口发送相对坐标；渲染层通过 `API.GetCursorPosition` / `API.GetWindowRect` 提供给原版 SWF。支持该接口的待机素材可以跟随窗口外的鼠标；其他素材仍按自身脚本播放。企鹅播放器保持鼠标穿透，由外层 `#move` 接收拖动和右键菜单事件；眼睛跟随通过上述坐标接口实现，避免 Ruffle 吞掉鼠标事件。

回归验证：`node tests/pet-animation.test.cjs`。真实 Ruffle 鼠标输入验证：`node_modules/.bin/electron tests/pet-pointer.electron.cjs`，使用隐藏窗口和临时存档目录，检查拖动、右键菜单事件以及鼠标坐标查询。

高心情站立原生验证：`node_modules/.bin/electron tests/pet-standing.electron.cjs`，实际 GG/MM Ruffle 动作自然播放结束后回到 happy/Stand，并截图确认。连续 12 次动作与旧趴姿恢复由规则测试覆盖；原生测试各验证一个真实动作，不能替代所有动作的视觉验收。

## 透明像素验证

`node_modules/.bin/electron tests/pet-transparency.electron.cjs` 使用隔离的原生透明窗口加载 GG/MM 成年 happy/Stand 和 GG 蛋阶段 Stand，读取 NativeImage 的 BGRA/alpha，检查窗口四角透明且保留可见企鹅。GG 成年素材底层命中轮廓的颜色变换为 RGB 乘数 256、alpha 乘数 3（除以 256）；其矩形内、企鹅轮廓外的像素 alpha 为 3/255，不能把截图预览中显眼的白色区域解释为不透明窗口背景。

固定参考提交 `6e2c8bf976d66192382f86065fdeb76528f6716c` 的同名素材（SHA-256 `7ffc1d8235d3d2755db9b114fb19eb98c05c6ad819915863953073f95e15c23f`）原生播放也有相同的低 alpha 命中区域，替换该素材并不能消除此区域。诊断中仅在临时副本去掉过底层图层；生产素材未修改。生产主窗口截图也读得相同 BGRA `[3,3,3,3]`。此测试验证像素透明度，不代替不同桌面背景、全部动作的视觉检查。
