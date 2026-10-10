`travel.json`、`china.json` 和 `album.json` 来自 AnkioTomas/qqpet，Git 快照 `6e2c8bf`，对应 `src/renderer/pet/data/` 中的同名文件。参考项目代码许可证为 GPL-3.0。这里只迁入目的地故事、地图和照片配置，未修改其参考工作区。

旅行明信片中的奇幻见闻属于游戏故事。照片和原版游戏素材是独立资源；旅行只选择已经下载的照片，资源缺失时仍可寄送文字明信片。

`src/windows/popups/desktopGames/index.js` 的多播放器窗口桥接改编自同一快照的 `src/renderer/ui/smallgame.ts`，保留其窗口管理、RemoteCall、防重入和 TICKLE 调用思路，改接当前 Electron IPC、宠物状态与存档。GPL-3.0 许可证副本位于 `src/assets/reference/LICENSE.reference-code.txt`；原版 SWF 的来源记录另见资源清单。

`gameplay/harvest.js` 的闭场灾害概率和新增数量提醒规则改编自同一快照的 `ui/farm.ts`、`pet/harvest.ts`；成熟时间直接读取已取得的 Crop.xml，鱼的成熟判断沿用当前项目鱼塘规则。通知基线和节流时间改为随宠物保存，便于重启后避免重复提示。

新增玩法台词借鉴同一快照 `pet/ai.ts` 的“保留事实，只改表达，失败回原句”规则，接入本项目已有 `llmService`，不另存端点或密钥。`gameplay/speech.js` 校验数字/单位、地点、引号内物品和关键玩法词，并保留按钮及动作数据；只有通过校验的文字可以显示，规则失败或请求超时保留原台词。

`greet.json` 的 14 条本地入场问候和六个时段来自同一快照 `pet/data/greet.ts`（GPL-3.0）。当前接入主窗口 enter，增加随宠物保存的同日同段去重和回拨保护；免打扰、活动中、暂停或不健康时跳过，不消耗可用问候。AI 关闭或失败时完全使用本地台词。

`pool.json` 来自同一快照 `pet/data/pool.json`，`loot.js` 沿用 `pet/loot.ts` 的三档权重与随机抽取规则（GPL-3.0），当前筛选到本仓库已有、可消费的 food/commodity 与新增 toy 目录。邮件在投递时固定抽取结果，领取时按原背包 `_id-数量` 格式入库，元宝/背包/领取标记通过同一次 Electron Store 写入保存。

`toys.json` 从同一快照 `pet/data/goods.json` 的 toy 分类迁入，共 8 种。`toys.js` 使用原价格、等级/粉钻购买条件、心情与属性效果；对应 `pet/items.ts` 使用说话反馈，不另造专属玩具动画。笔记本的 60 分钟/每小时额外 10 成长通过当前 GrowUp 的在线成长 tick 推进，与成长值同次保存；暂停、离线不扣时长，重新使用另一件时效玩具会替换当前效果，沿用参考 `pet/goods.ts` 的同类物品规则。

节日额外任务借鉴同一快照 `pet/tasks.ts` 的玩具 5 次、100 元宝和两次随机抽取规则（GPL-3.0）。当前邮件与任务共用离线六节日判定，任务仍按本地早上 6 点刷新；它尚未接入参考联网日历的调休/连续假期规则。额外任务使用独立 ID，但共享实际 Toy 使用计数，领取保存背包/元宝/标记并保留独立日期账本。

旅行显示直接改编自同一快照 `ui/travel.ts`、`ui/css/travel.css`、`ui/box.ts`、`style.css` 和 `base.css`（GPL-3.0）：独立窗口保留原边框、橙色地图与按钮、旅行/相簿页，使用经哈希校验的 windowTip SVG、背景和旅行徽章。活动数据接现有 Travel 服务；参考项目不隐藏旅行中的桌面企鹅，本仓库也去掉自制旅行提示框与隐藏逻辑。参考花费 8888 元宝完成旅游成就并重开地图已接入：全部 35 个目的地点亮后显示入口，确认后扣款与 visits 清空、tours 累计同次保存；照片、明信片、纪念品和正在进行的旅行保留。确认期间防重复请求，按完成次数拒绝旧确认请求；徽章按完成次数点亮，次数随存档导入导出。参考 Travel2 专属里程碑任务仍需接入。

待机姿态对齐参考 `pet/router.ts`：高心情使用 happy/Stand，移除旧仓库随机进入持久 prostrate 与相应自动 Etoj/Jtoc 切换；保留原姿态素材及其他心情状态资源，并沿用参考 20～60 秒随机小动作/闲聊节奏。

农场窗口关闭时异步读取 SOL 并结算；新增应用 before-quit 衔接，等待关闭完成后继续 app.quit，避免窗口的 preventDefault 取消整个退出流程。四个真实测试进程验证正常 app.quit/下一进程恢复，以及 SIGKILL 中断/下一进程凭保存会话与 SOL 恢复；测试目录完全独立于用户存档。

贴心宝贝自动照料参照同一快照 `pet/pet.ts` selfCare 的 60% 阈值与饥饿、清洁、心情优先级，每轮只使用一件已有物品。修复本仓库 GrowUp.sweetHeartAuto 空实现和缺少调用，食物/清洁接已有 Goods/State，玩具接 Toys；首次刷新/unGrow/暂停/死亡不执行，自动消耗的背包立即保存。当前保留本仓库免费开关，不改成参考 300 元宝/天的托管付费和到期制度。

`travel-milestones.json` 固定目标与物品奖励来自同一参考快照的 `pet/tasks.ts` Travel2 任务，保留原物品 ID、数量与元宝，接入当前背包及跨日领取记录。

`backgrounds.json` 为参考快照 `pet/data/goods.json` 的背景目录，保留额外成长和持续时间；使用当前已有背包与在线成长计时。

逗逗我每日五档任务取自同一固定快照 src/renderer/pet/tasks.ts ddw：5/10/15次固定食物、20/25次随机1/2件，06:00重置。pokeMilestones.js 适配当前 Amusing 计数、统一背包事务和按日领奖账本，不将每日任务改成终生成就。

普通游戏每天最多计奖60分钟保持参考规则。当前适配增加按06:00日期持久化的 gameRewardDays，防止切换日期后回拨旧日期重新开放已用预算；奖励与记录仍由同一宠物写入提交。

为保持参考每日任务一次生成/冻结奖品/领取一次的规则，当前 dailyHistory 记录06:00日期切换时的完整任务状态；回拨到已出现过的日期恢复原记录，不再次生成任务或发放已领取奖励。
