# 鹭岛听音 v0.2 共享规格（美术重做 + 科普点 + 新场景）

所有子任务必须遵守本文件的常量与接口，保证并行开发后能直接拼接。

## 1. 尺寸与坐标
- 逻辑分辨率不变：480×270（`src/main.ts`）。
- 场景世界宽 `WORLD_W = 720`，高 270。`GROUND = 176`：y < 176 为背景（墙/建筑/天空），y ≥ 176 为可行走地面。
- 角色脚底中心为原点（origin 0.5, 1）。可行走范围 x 16–704，y 184–262。
- 角色尺寸：玩家约 22×38 像素；NPC 约 20–26 × 34–42。比旧版放大约 1.8 倍。
- 每个场景的固定布局槽位（脚底坐标）：
  - 科普点（knowledge 物件）：x = 70, 250, 430, 640；y = 194（贴着背墙前沿）。
  - 交互点：NPC A x=160 y=214；小游戏/第三交互 x=340 y=206；NPC B x=540 y=218。
  - 玩家出生：x=100 y=236。
  - 场景美术在这些槽位的正后方可画“呼应”的背景（例如 bashi 的 x≈340 处是头家娘海鲜摊的摊架、zhongshan 的 x≈340 是骑楼下的博饼桌、laocuo 的 x≈540 是阿公藤椅），但**不要**在 y ≥ 184 的地面上画会挡住这些槽位的大物件。

## 2. 场景（palette = 场景 id）
| id | 名称 | 台罗 | 风貌要点 | 时段默认氛围 |
|---|---|---|---|---|
| laocuo | 外妈老厝 | Guā-má ê lāu-tshù | 红砖燕尾脊大厝、出砖入石墙、天井、晒菜脯、龙眼树、功夫茶桌、古井 | 上午暖阳 |
| bashi | 八市 | Pat-tshī | 老菜市骑楼、海鲜摊、泡沫箱、水桶、红色塑料盆、吊灯、土笋冻/海蛎煎摊 | 清晨湿润 |
| zhongshan | 中山路 | Tiong-san-lōo | 南洋骑楼、拱窗、彩色招牌、沙茶面店、花生汤、远处鹭江 | 傍晚金色 |
| gulangyu | 鼓浪屿 | Kóo-lōng-sū | 万国建筑洋楼、三角梅、钢琴声、日光岩远景、榕树、海边礁石、红瓦 | 午后明亮 |
| zengcuoan | 曾厝垵 | Tsan-tshù-uann | 渔村石厝+文艺小店、窄巷、灯笼、烧肉粽/姜母鸭小吃、王船、石敢当、海边 | 黄昏到夜 |
| nanputuo | 南普陀 | Lâm-phóo-tô | 寺庙黄墙红柱、燕尾脊殿顶、香炉、放生池荷花、五老峰远山、“佛”字石刻、素饼店 | 早晨清幽 |

## 3. 美术规范（正式美术方向）
- 像素风，整数坐标；所有角色与物件 1px 深色描边 `#2b1d16`（或同色相深色），三阶明暗（亮/中/暗）+ 少量高光。
- 主色：红砖 `#b5432f/#8e2f22/#c9603f`；白灰 `#e9d3a1/#f6eeda`；海蓝 `#2f6f9f/#214f74/#7fb6d6`；三角梅 `#c2447a/#e07aa6`；金 `#d9a441`；榕叶 `#3f7d4a/#2c5c37/#6fa35b`；墨 `#2b1d16/#4a3629`。
- 场景：天空 → 远景（scrollFactor≈0.2–0.4）→ 中景（≈0.6–0.8）→ 主景（1.0）→ 地面（1.0）→ 少量前景（1.0，depth 25，只放在 y ≥ 255 的画面最底边或 x 两端，不能挡住槽位）。
- 场景内要“满”：每个场景除 4 个科普物件外，至少 12 处非交互小细节（盆栽、晾衣、招牌字、门联、灯笼、猫、自行车、电线、鸟、水桶、竹凳……）。
- 性能：每一层先画进 `scene.make.graphics(..., false)`，再 `generateTexture(key)` 烘焙成贴图（以 palette 为缓存 key，已存在则直接复用），用 `scene.add.image` 显示。不要每帧重绘几千个矩形。

## 4. 贴图 key 约定（BootScene 中 `generateTextures` 生成）
- 玩家：`player`、`player-walk`（2 帧即可，可加 `player-walk2`）。
- NPC：`npc-<sprite>`。sprite 名：`ama`、`akong`、`uncle`（卖鱼阿伯）、`boss`（头家娘）、`tourist`、`pianist`（鼓浪屿弹琴阿姐）、`islander`（鼓浪屿老岛民阿伯）、`vendor`（曾厝垵卖烧肉粽阿伯）、`fisher`（曾厝垵渔家阿姐）、`monk`（南普陀师父）、`pilgrim`（南普陀拜拜阿婶）、`noodle`（中山路沙茶面头家）。
- 小游戏物件：`obj-bobing`（博饼碗桌）、`obj-stall`（可选，海鲜摊台）。
- 科普物件：`prop-<prop>`，底部中心原点，宽 ≤ 40、高 ≤ 44，见第 5 节。
- 其他：`wave`（声波）、`spark`（闪光）、`know-mark`（科普点上方的小“书/灯”标记，12×12）。

## 5. 科普点清单（每场景 4 个，prop 名固定）
| 场景 | x=70 | x=250 | x=430 | x=640 |
|---|---|---|---|---|
| laocuo | `tea` 功夫茶 | `wall` 出砖入石 | `well` 天井古井 | `caipo` 晒菜脯 |
| bashi | `tusundong` 土笋冻 | `oyster` 海蛎煎 | `scale` 杆秤 | `fishball` 鱼丸 |
| zhongshan | `shacha` 沙茶面 | `qilou` 骑楼柱廊 | `peanut` 花生汤 | `bianshi` 扁食/馅饼（`pia`） |
| gulangyu | `piano` 钢琴之岛 | `villa` 万国建筑 | `bougain` 三角梅 | `sunrock` 日光岩 |
| zengcuoan | `zongzi` 烧肉粽 | `shigandang` 石敢当 | `wangchuan` 送王船 | `gingerduck` 姜母鸭 |
| nanputuo | `supia` 素饼 | `censer` 香炉与敬香 | `lotus` 放生池 | `fostone` “佛”字石刻 |

注：zhongshan 的 x=640 prop 名统一为 `pia`（馅饼）。

## 6. 内容数据接口
- `content/scenes.json`：`scenes[]` 6 个；`hotspots[]` 字段 `{ id, label, x, y, w, h, action, sprite?, npcLine?, dialogue? }`，其中 x,y 是**脚底坐标**（按第 1 节槽位）；`upcoming` 置为 `[]`。
- `content/knowledge.json`：数组，元素 `{ id, sceneId, title, tailo, category, prop, x, y, summary, body: string[], words?: [{hanzi,tailo,mandarin}] }`；category ∈ `food|architecture|custom|craft|nature`。
- `content/sounds/<sceneId>.json`：每场景 20 条；pos.x ∈ [30,690]，pos.y ∈ [184,256]。
- 解锁门槛：laocuo 0、bashi 6、zhongshan 14、gulangyu 24、zengcuoan 34、nanputuo 46。

## 7. 插画接口（DOM 侧，Canvas 2D 绘制后转 dataURL，模块内缓存）
- `src/art/portraits.ts`：`export function portrait(sprite: string): string | null` → 半身立绘 dataURL，画布 96×128（像素风，CSS 放大）。sprite 名同第 4 节，另含 `player`。
- `src/art/illustrations.ts`：
  - `export function sceneBackdrop(sceneId: string): string` → 对话背景插画 dataURL，画布 480×270，近景构图（与行走场景不同的“特写机位”）。
  - `export function knowledgeArt(prop: string): string` → 科普卡插图 dataURL，画布 200×120。
- 所有绘制函数纯前端、无外部图片、无网络请求。

## 8. 不展示的文字
界面不再出现“占位合成音”“待方言顾问核对”“v0.1”等内部说明（内容层 `reviewStatus` 字段保留，仅供校验脚本使用）。
