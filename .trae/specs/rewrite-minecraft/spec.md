# Web Minecraft 完全重写规格

## Why
当前实现存在严重的架构缺陷：渲染管线不工作、地形生成参数错误、无加载界面、无菜单系统、无游戏状态管理、全局变量散乱。参考 Eaglercraft 的架构设计，完全重写项目，确保游戏从启动到游玩的完整流程可用。

## What Changes
- **BREAKING**: 完全重写整个项目架构，采用 Game 类状态机管理游戏生命周期
- **BREAKING**: 重写渲染管线，采用分层渲染架构（天空盒→不透明方块→半透明方块→HUD）
- **BREAKING**: 重写区块系统，CHUNK_HEIGHT=256，每区块分 16 个 Section（16×16×16），按 Section 构建网格
- **BREAKING**: 重写地形生成，采用正确的海平面(62)和生物群系高度参数
- **BREAKING**: 重写纹理系统，使用 16×16 像素风格纹理图集，所有纹理程序化生成但视觉效果接近原版
- 新增：加载界面，显示资源加载进度
- 新增：主菜单界面，含"单人游戏"、"设置"按钮
- 新增：暂停菜单（ESC 触发）
- 新增：游戏内 HUD（准星、快捷栏、血量、饥饿值）
- 新增：F3 调试信息
- 新增：聊天系统（T 键打开）
- 重写：玩家物理系统，正确的重力和碰撞
- 重写：Pointer Lock 输入管理
- 重写：IndexedDB 存档系统
- 保留：TypeScript + Vite 工程体系

## Impact
- Affected specs: 替换原 web-minecraft 规格全部内容
- Affected code: 重写所有源文件

## 架构设计（参考 Eaglercraft）

### 核心架构原则
1. **Game 状态机**: 单一 Game 类管理所有子系统，通过状态机控制游戏流程（LOADING→MENU→PLAYING→PAUSED）
2. **分层渲染**: 天空盒→不透明方块（按 Section）→半透明方块→方块高亮→HUD
3. **Section 级网格**: 每个区块分为 16 个 Section，按 Section 构建和上传 GPU 网格，避免全区块重建
4. **异步加载**: 资源加载和地形生成通过 requestIdleCallback 分帧执行，不阻塞主线程
5. **事件驱动输入**: InputManager 统一管理键盘/鼠标/Pointer Lock 事件

### 目录结构
```
src/
├── main.ts              # 入口，创建 Game 实例
├── Game.ts              # 游戏主类，状态机，主循环
├── renderer/
│   ├── Renderer.ts      # 渲染器主类，管理所有渲染通道
│   ├── Camera.ts        # 相机，视图/投影矩阵，视锥体
│   ├── Shader.ts        # 着色器编译/链接工具
│   ├── TextureAtlas.ts  # 纹理图集生成与上传
│   ├── ChunkRenderer.ts # 区块 Section 渲染管理
│   ├── SkyRenderer.ts   # 天空盒渲染
│   ├── HUDRenderer.ts   # Canvas 2D HUD 渲染
│   └── shaders/
│       ├── block.vert.glsl
│       └── block.frag.glsl
├── world/
│   ├── BlockType.ts     # 方块类型定义（透明/固体/发光/纹理索引）
│   ├── Chunk.ts         # 16×16×256 区块数据
│   ├── Section.ts       # 16×16×16 子区块
│   ├── World.ts         # 世界管理，方块读写
│   ├── ChunkManager.ts  # 区块加载/卸载/网格重建
│   ├── WorldGenerator.ts # 地形生成（噪声+生物群系+洞穴+矿石+树木）
│   ├── Biome.ts         # 生物群系定义与选择
│   └── Lighting.ts      # 天空光+方块光 BFS 传播
├── player/
│   ├── Player.ts        # 玩家位置/速度/碰撞/物理
│   └── InputManager.ts  # 键盘/鼠标/Pointer Lock 管理
├── ui/
│   ├── Screen.ts        # 屏幕基类
│   ├── MainMenu.ts      # 主菜单
│   ├── PauseMenu.ts     # 暂停菜单
│   ├── LoadingScreen.ts # 加载界面
│   ├── HUD.ts           # 游戏内 HUD
│   └── DebugOverlay.ts  # F3 调试信息
├── game/
│   ├── Inventory.ts     # 物品栏
│   ├── GameManager.ts   # 游戏模式/时间/生命/饥饿
│   └── SaveManager.ts   # IndexedDB 存档
└── utils/
    ├── SimplexNoise.ts  # 3D Simplex 噪声
    └── MathUtils.ts     # 矩阵运算
```

## ADDED Requirements

### Requirement: Game 状态机
系统 SHALL 通过 Game 类状态机管理游戏生命周期，状态包括 LOADING、MENU、PLAYING、PAUSED。

#### Scenario: 游戏启动
- **WHEN** 页面加载完成
- **THEN** 创建 Game 实例，进入 LOADING 状态，初始化 WebGL2 上下文、编译着色器、生成纹理图集，完成后进入 MENU 状态

#### Scenario: 从主菜单开始游戏
- **WHEN** 用户在主菜单点击"单人游戏"
- **THEN** 进入 LOADING 状态显示加载进度，生成初始区块，完成后进入 PLAYING 状态并锁定鼠标

#### Scenario: 暂停与恢复
- **WHEN** 用户在 PLAYING 状态按 ESC
- **THEN** 进入 PAUSED 状态，显示暂停菜单，释放鼠标锁定
- **WHEN** 用户点击"返回游戏"
- **THEN** 回到 PLAYING 状态，重新锁定鼠标

### Requirement: 加载界面
系统 SHALL 在资源加载和地形生成期间显示加载界面，包含进度条和状态文字。

#### Scenario: 资源加载
- **WHEN** 游戏初始化
- **THEN** 显示"加载资源中..."，进度条从 0% 到 100%，完成后切换到主菜单

#### Scenario: 世界生成
- **WHEN** 用户开始新游戏
- **THEN** 显示"生成世界中..."，进度条反映已生成区块数/总需生成区块数

### Requirement: 主菜单
系统 SHALL 提供主菜单界面，包含游戏标题和功能按钮。

#### Scenario: 主菜单显示
- **WHEN** 游戏进入 MENU 状态
- **THEN** 显示"Minecraft"标题、"单人游戏"按钮、"设置"按钮，背景渲染旋转的世界

### Requirement: WebGL 2.0 渲染管线
系统 SHALL 基于 WebGL 2.0 构建分层渲染管线，天空盒→不透明方块→半透明方块→HUD。

#### Scenario: 帧渲染
- **WHEN** 每帧渲染
- **THEN** 清除帧缓冲→渲染天空盒→渲染不透明区块 Section（视锥体剔除）→渲染半透明方块→渲染方块高亮→渲染 HUD

#### Scenario: Section 级网格
- **WHEN** 区块内某个方块改变
- **THEN** 仅重建该方块所在 Section 及相邻 Section 的网格，而非整个区块

### Requirement: 区块系统
系统 SHALL 实现 16×16×256 区块，每个区块分为 16 个 Section（16×16×16），按 Section 构建和渲染网格。

#### Scenario: 区块数据
- **WHEN** 创建区块
- **THEN** 使用 Uint16Array(16×16×256) 存储方块 ID，Uint8Array(16×16×256) 存储天空光和方块光

#### Scenario: Section 网格构建
- **WHEN** Section 内方块变化或 Section 首次加载
- **THEN** 遍历 Section 内 4096 个方块，对每个非空方块检查六面邻接可见性，生成顶点数据（位置、UV、光照），上传 GPU

### Requirement: 地形生成
系统 SHALL 使用 3D Simplex 噪声生成地形，海平面高度为 62，生物群系决定地表方块和高度范围。

#### Scenario: 生物群系高度
- **WHEN** 生成地形
- **THEN** 海洋 baseHeight≈30, 平原≈64, 沙漠≈63, 森林≈66, 山地≈80, 沼泽≈61, 针叶林≈68, 冻原≈64

#### Scenario: 海平面填充
- **WHEN** 地表高度低于海平面(62)
- **THEN** 在地表以上到海平面之间填充水方块

#### Scenario: 洞穴生成
- **WHEN** 地下方块位置
- **THEN** 使用 3D 噪声判断是否为洞穴空间，洞穴范围 Y=2~55

### Requirement: 纹理图集
系统 SHALL 程序化生成 256×256 纹理图集，包含 16×16 像素方块纹理，视觉效果接近原版 Minecraft。

#### Scenario: 纹理生成
- **WHEN** 游戏初始化
- **THEN** 在 Canvas 上程序化绘制所有方块纹理（石头、泥土、草地、沙子、水、原木、树叶、矿石等），上传为 WebGL 纹理，使用 NEAREST 过滤

### Requirement: 玩家控制
系统 SHALL 实现 Pointer Lock FPS 控制，WASD 移动，空格跳跃，Shift 潜行，鼠标旋转视角。

#### Scenario: 鼠标锁定
- **WHEN** 用户点击游戏画面进入 PLAYING 状态
- **THEN** 请求 Pointer Lock，鼠标移动控制视角旋转（灵敏度 0.002）

#### Scenario: 移动与碰撞
- **WHEN** 玩家按 WASD
- **THEN** 根据视角方向计算移动向量，应用 AABB 碰撞检测，逐轴解析碰撞

#### Scenario: 重力与跳跃
- **WHEN** 玩家在地面按空格
- **THEN** 给予向上初速度，重力持续向下加速，着地时速度归零

### Requirement: HUD
系统 SHALL 在游戏画面上叠加 Canvas 2D HUD，显示准星、快捷栏、血量、饥饿值。

#### Scenario: 准星
- **WHEN** 游戏在 PLAYING 状态
- **THEN** 屏幕中央显示白色十字准星

#### Scenario: 快捷栏
- **WHEN** 游戏在 PLAYING 状态
- **THEN** 屏幕底部显示 9 格快捷栏，当前选中格高亮，显示物品图标和数量

### Requirement: 存档系统
系统 SHALL 使用 IndexedDB 持久化世界数据，支持自动保存和手动保存。

#### Scenario: 自动保存
- **WHEN** 游戏运行每 5 分钟
- **THEN** 将所有已加载区块数据和玩家数据序列化写入 IndexedDB

#### Scenario: 加载存档
- **WHEN** 用户开始游戏
- **THEN** 检查 IndexedDB 是否有存档，有则加载，无则生成新世界

### Requirement: 方块交互
系统 SHALL 支持左键破坏方块、右键放置方块，使用 DDA 射线检测确定目标方块。

#### Scenario: 破坏方块
- **WHEN** 玩家锁定鼠标后按住左键
- **THEN** 射线检测目标方块，0.25 秒冷却后移除方块，重建受影响 Section 网格

#### Scenario: 放置方块
- **WHEN** 玩家锁定鼠标后右键
- **THEN** 射线检测目标方块的相邻空气位置，放置当前选中物品，重建受影响 Section 网格

## MODIFIED Requirements
（无，这是全新重写）

## REMOVED Requirements
（无，这是全新重写，旧规格全部替换）
