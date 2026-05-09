# Web Minecraft 规格文档

## Why
在浏览器中实现一个完整的体素沙盒游戏，无需安装任何客户端，通过 WebGL 2.0 自研渲染器和 Web Worker 并行计算，提供接近原版 Minecraft 的游戏体验。

## What Changes
- 基于 WebGL 2.0 构建自研体素渲染器，含贪婪网格化、纹理图集、多通道光照着色器
- 实现区块（Chunk）系统：16×16×384 区块管理、邻接面剔除、视锥体剔除
- 三维噪声地形生成，含生物群系、洞穴、矿石、树木等结构
- 天空光与方块光双通道 BFS 光照传播系统
- Pointer Lock FPS 控制、AABB 碰撞检测、DDA 射线检测
- 物品栏、合成、熔炼等生存模式核心游戏逻辑
- 半透明方块渲染队列、水面动画、非全尺寸方块模型
- 昼夜循环、粒子系统、后期效果
- Web Audio API 3D 空间音效
- HTML/CSS + Canvas 混合 UI 系统
- IndexedDB 数据持久化与存档导入导出
- Web Worker 并行地形生成与网格构建
- TypeScript + Vite 工程体系

## Impact
- Affected specs: 全新项目，无既有规格
- Affected code: 全新代码库

## ADDED Requirements

### Requirement: WebGL 2.0 自研渲染器
系统 SHALL 基于 WebGL 2.0 构建自研渲染器，不依赖 Three.js 等通用引擎，针对体素世界优化面剔除和网格构建。

#### Scenario: 渲染器初始化
- **WHEN** 页面加载完成
- **THEN** 创建 WebGL 2.0 上下文，编译并链接自定义着色器程序，初始化纹理图集和帧缓冲

#### Scenario: 帧渲染
- **WHEN** 每帧调用渲染
- **THEN** 按不透明→半透明→后期处理顺序绘制，执行视锥体剔除，仅提交视口内区块

### Requirement: 区块网格生成与贪婪网格化
系统 SHALL 对每个 16×16×384 区块进行邻接可见面检测，剔除被相邻不透明方块完全遮盖的面，并使用贪婪网格化算法合并相邻同类型面片，减少 Draw Call。

#### Scenario: 区块网格构建
- **WHEN** 区块方块数据发生变化或区块首次加载
- **THEN** 遍历区块内所有方块，检测六面邻接可见性，对可见面执行贪婪网格化合并，生成顶点缓冲

#### Scenario: 面剔除
- **WHEN** 某方块的某面与不透明方块相邻
- **THEN** 该面不生成几何数据

### Requirement: 纹理图集与着色器 UV 偏移
系统 SHALL 将所有方块纹理打包到一张纹理图集中，着色器通过 UV 偏移选取对应方块纹理。

#### Scenario: 方块纹理渲染
- **WHEN** 渲染某方块面
- **THEN** 顶点数据包含纹理图集偏移量，片元着色器根据偏移量采样正确纹理区域

### Requirement: 多通道光照着色器
系统 SHALL 编写自定义着色器处理天空光、方块光和平滑光照，顶点着色器传递光照值，片元着色器根据邻近方块亮度进行插值。

#### Scenario: 光照渲染
- **WHEN** 渲染方块面
- **THEN** 顶点携带天空光和方块光值，片元着色器对光照进行双线性插值，输出最终颜色

### Requirement: 半透明方块渲染
系统 SHALL 为半透明方块（水、玻璃、树叶）维护单独渲染队列，按深度排序后关闭深度写入再绘制。

#### Scenario: 水面渲染
- **WHEN** 场景中存在水方块
- **THEN** 水方块在半透明队列中按深度排序后绘制，关闭深度写入，开启深度测试和 Alpha 混合

### Requirement: 水面动画
系统 SHALL 在着色器中基于时间偏移纹理坐标实现水面动画，并处理水下雾效和色彩渐变。

#### Scenario: 水面波动
- **WHEN** 渲染水面
- **THEN** 着色器根据时间对 UV 坐标施加正弦偏移，产生波纹效果

#### Scenario: 水下视野
- **WHEN** 玩家摄像机位于水面以下
- **THEN** 应用水下雾效，视野距离缩短，色调偏蓝绿

### Requirement: 非全尺寸方块模型
系统 SHALL 支持楼梯、半砖、栅栏、花、火把等非全尺寸方块，使用自定义体素模型定义几何和碰撞盒。

#### Scenario: 楼梯渲染与碰撞
- **WHEN** 放置楼梯方块
- **THEN** 渲染楼梯的自定义几何模型，碰撞检测使用对应的阶梯形 AABB

### Requirement: 视锥体剔除
系统 SHALL 实施视锥体剔除，只提交视口内区块的绘制命令。

#### Scenario: 视口外区块剔除
- **WHEN** 区块完全在摄像机视锥体外
- **THEN** 跳过该区块的绘制调用

### Requirement: 区块 LOD
系统 SHOULD 实现区块 LOD，远处区块合并为低细节网格以减少远景区块面数。

#### Scenario: 远景区块简化
- **WHEN** 区块距玩家超过 LOD 阈值
- **THEN** 使用低细节网格渲染该区块

### Requirement: Instanced Rendering
系统 SHALL 使用 Instanced Rendering 绘制掉落物、粒子等大量重复物体。

#### Scenario: 掉落物渲染
- **WHEN** 场景中存在多个同类掉落物
- **THEN** 使用一次 Instanced Draw Call 绘制所有同类掉落物

### Requirement: 天空盒与昼夜循环
系统 SHALL 实现动态天空盒，随游戏时间改变天空颜色、太阳/月亮位置和环境光强度。

#### Scenario: 昼夜更替
- **WHEN** 游戏时间推进
- **THEN** 天空颜色渐变，太阳/月亮位置移动，环境光强度随之变化

### Requirement: 后期效果
系统 SHALL 实现泛光和色调映射后期效果，使用全屏四边形处理。

#### Scenario: 泛光效果
- **WHEN** 场景中存在高亮区域（如太阳、发光方块）
- **THEN** 提取高亮区域进行模糊后叠加，产生泛光效果

### Requirement: 粒子系统
系统 SHALL 实现方块破坏粒子、行走扬尘、爆炸烟雾、雨雪等粒子效果，粒子运动使用简单物理，批量更新 GPU 缓冲区。

#### Scenario: 方块破坏粒子
- **WHEN** 玩家破坏方块
- **THEN** 在方块位置生成若干粒子，颜色匹配方块纹理，粒子受重力影响并逐渐消失

### Requirement: 第一人称手持物品渲染
系统 SHALL 使用单独相机渲染第一人称手持物品或方块，置于前景层。

#### Scenario: 手持方块显示
- **WHEN** 玩家手持某方块
- **THEN** 在屏幕右下角渲染该方块的 3D 模型，使用独立相机和光照

### Requirement: 三维噪声地形生成
系统 SHALL 使用三维噪声（3D Simplex 或 OpenSimplex）生成基础地形高度和密度场。

#### Scenario: 区块地形生成
- **WHEN** 新区块进入加载范围
- **THEN** 使用世界种子和三维噪声函数生成该区块的地形高度图和密度场

### Requirement: 生物群系系统
系统 SHALL 根据温度和湿度噪声决定生物群系，影响地形高度、方块类型、树木和植被生成。

#### Scenario: 沙漠群系生成
- **WHEN** 区块的温度噪声高、湿度噪声低
- **THEN** 地表方块为沙子，生成仙人掌而非树木

### Requirement: 洞穴与矿道生成
系统 SHALL 使用额外噪声阈值生成地下空洞，混合峡谷等结构。

#### Scenario: 洞穴生成
- **WHEN** 地下某位置噪声值超过洞穴阈值
- **THEN** 该位置生成空气方块，形成洞穴空间

### Requirement: 矿石分布
系统 SHALL 在地下按深度和概率放置煤矿、铁矿、钻石等矿石方块。

#### Scenario: 钻石矿生成
- **WHEN** 区块 Y 坐标低于 16 且钻石噪声值超过阈值
- **THEN** 在对应位置放置钻石矿石方块

### Requirement: 区块动态加载与卸载
系统 SHALL 以玩家为中心动态加载/卸载区块，维护区块映射表，超出视距的区块序列化后保存，进入视距的区块异步生成。

#### Scenario: 区块加载
- **WHEN** 玩家移动使新区块进入视距范围
- **THEN** 异步生成该区块地形，构建网格后加入渲染列表

#### Scenario: 区块卸载
- **WHEN** 区块超出视距范围
- **THEN** 序列化区块数据，销毁 GPU 缓冲区，从渲染列表移除

### Requirement: 区块数据结构
系统 SHALL 使用一维 Uint16Array 存储方块 ID，索引计算 y * 256 + z * 16 + x，以节省内存。

#### Scenario: 方块读写
- **WHEN** 需要读取或设置某坐标的方块
- **THEN** 通过公式计算一维索引，直接访问 TypedArray 元素

### Requirement: Web Worker 并行计算
系统 SHALL 使用 Web Worker 进行地形生成、光照计算和网格构建，避免阻塞主线程。

#### Scenario: 地形生成在 Worker 中执行
- **WHEN** 主线程请求生成新区块
- **THEN** 将生成任务发送到 Worker 池，Worker 完成后通过 Transferable 对象返回结果

### Requirement: 结构自然分布
系统 SHALL 生成时处理树木、仙人掌等结构的自然分布，使用规则或结构蓝图放置。

#### Scenario: 树木生成
- **WHEN** 区块地表为草方块且生物群系支持树木
- **THEN** 按概率在地表放置树木结构蓝图

### Requirement: 无限世界与种子可重现
系统 SHALL 实现无限世界边界，使用世界种子保证地形可重现。

#### Scenario: 同种子世界一致
- **WHEN** 使用相同种子生成两个世界
- **THEN** 两个世界在相同坐标产生完全一致的地形

### Requirement: 双通道光照系统
系统 SHALL 维护天空光和方块光两个独立光照通道，使用 BFS 传播算法计算光照值。

#### Scenario: 天空光传播
- **WHEN** 方块上方无遮挡
- **THEN** 天空光值为最大值 15，每向下或穿过不透明方块衰减一级

#### Scenario: 方块光传播
- **WHEN** 放置发光方块（如火把）
- **THEN** 从发光方块发起 BFS，向相邻空气方块传播方块光，每级衰减一

### Requirement: 光照增量更新
系统 SHALL 当方块改变时重新计算所在区块及周边区块的光照值，并引发相邻区块更新。

#### Scenario: 挖掘方块触发光照更新
- **WHEN** 玩家挖掘一个不透明方块
- **THEN** 重新计算该方块所在区块及相邻区块的天空光和方块光

### Requirement: 平滑光照
系统 SHALL 逐顶点或逐面片混合光照值，实现平滑过渡。

#### Scenario: 光照过渡
- **WHEN** 相邻方块光照值不同
- **THEN** 共享顶点的光照值为相邻方块光照的平均，渲染时插值产生平滑过渡

### Requirement: 阳光衰减
系统 SHALL 实现阳光衰减，每下降一格天空光减弱一定量，直到完全黑暗。

#### Scenario: 地下光照
- **WHEN** 方块上方有多层不透明方块遮挡
- **THEN** 天空光逐层衰减至 0

### Requirement: Pointer Lock FPS 视角控制
系统 SHALL 使用 Pointer Lock API 锁定鼠标，实现 FPS 视角控制。

#### Scenario: 鼠标控制视角
- **WHEN** 玩家点击画布并锁定鼠标
- **THEN** 鼠标移动控制摄像机偏航和俯仰角

### Requirement: 键盘输入管理
系统 SHALL 管理 WASD 移动、空格跳跃、Shift 潜行、E 背包、数字键快捷栏等输入，处理按键组合。

#### Scenario: WASD 移动
- **WHEN** 玩家按住 W 键
- **THEN** 角色沿摄像机朝向前进方向移动

### Requirement: 重力与运动
系统 SHALL 实现恒定重力加速度，处理跳跃初速度，空中和水中运动参数不同。潜行防止从边缘掉落。

#### Scenario: 跳跃
- **WHEN** 玩家在地面按空格
- **THEN** 角色获得向上初速度，随后受重力影响下落

#### Scenario: 潜行防掉落
- **WHEN** 玩家在边缘潜行
- **THEN** 角色不会从方块边缘掉落

### Requirement: AABB 碰撞检测
系统 SHALL 使用轴对齐包围盒（AABB）进行碰撞检测，玩家高 1.8 格宽 0.6 格，运动分解为三轴逐一检测，实现沿墙滑动。

#### Scenario: 墙壁碰撞
- **WHEN** 玩家水平移动撞到墙壁
- **THEN** 阻止该轴方向的移动，其他轴方向不受影响

### Requirement: 游泳与飞行
系统 SHALL 实现游泳和飞行模式，飞行无重力、速度增加，碰撞逻辑切换。

#### Scenario: 创造模式飞行
- **WHEN** 玩家双击空格进入飞行模式
- **THEN** 角色不受重力影响，空格上升、Shift 下降

### Requirement: 实体通用物理
系统 SHALL 使掉落物、生物等实体受重力和碰撞影响，沙子、砂砾无支撑时受重力下落并变成掉落实体。

#### Scenario: 沙子下落
- **WHEN** 沙子方块下方无支撑
- **THEN** 沙子方块变为掉落实体，受重力下落直到落地变为方块

### Requirement: DDA 射线检测与方块交互
系统 SHALL 使用 DDA 体素遍历算法从玩家视线发射射线，检测指向方块及相邻面。破坏方块有挖掘时间。

#### Scenario: 指向方块
- **WHEN** 玩家注视某方块
- **THEN** 高亮显示该方块轮廓线

#### Scenario: 破坏方块
- **WHEN** 玩家对指向方块持续左键点击
- **THEN** 经过挖掘时间后方块被破坏，生成掉落物或破坏粒子

### Requirement: 放置方块实体碰撞检查
系统 SHALL 放置方块时检查实体碰撞，防止重叠。

#### Scenario: 放置方块
- **WHEN** 玩家右键点击相邻面
- **THEN** 在相邻位置放置方块，若与玩家 AABB 重叠则阻止放置

### Requirement: 生存模式核心循环
系统 SHALL 实现生命值、饥饿值、盔甲值系统，饥饿影响生命恢复或消耗。

#### Scenario: 饥饿消耗生命
- **WHEN** 饥饿值降至 0
- **THEN** 生命值持续下降

#### Scenario: 饱食恢复生命
- **WHEN** 饥饿值满且生命值未满
- **THEN** 生命值缓慢恢复

### Requirement: 物品栏系统
系统 SHALL 实现 36 格物品栏加快捷栏、装备栏、副手，物品堆叠逻辑和最大堆叠数。

#### Scenario: 物品堆叠
- **WHEN** 拾起与快捷栏已有物品相同的掉落物
- **THEN** 物品堆叠数增加，不超过最大堆叠数

### Requirement: 合成系统
系统 SHALL 提供 2×2 和 3×3 合成网格，根据配方生成结果。

#### Scenario: 工作台合成
- **WHEN** 玩家在工作台界面按配方摆放原料
- **THEN** 输出格显示合成结果，点击取出

### Requirement: 熔炼系统
系统 SHALL 实现熔炉界面，含燃料和原料槽，计算烧炼进度。

#### Scenario: 熔炼铁矿
- **WHEN** 玩家将铁矿石和煤炭放入熔炉
- **THEN** 烧炼进度条推进，完成后产出铁锭

### Requirement: 生物 AI
系统 SHOULD 实现僵尸、骷髅等敌对生物和牛、羊等被动生物，基本行为包括漫游、检测玩家攻击或逃离、三维寻路。

#### Scenario: 僵尸追踪玩家
- **WHEN** 僵尸检测到附近玩家
- **THEN** 向玩家方向移动并攻击

### Requirement: 战斗系统
系统 SHALL 实现攻击冷却、伤害计算、无敌时间和击退效果。

#### Scenario: 攻击冷却
- **WHEN** 玩家连续攻击
- **THEN** 攻击伤害随冷却时间恢复，快速连击伤害降低

### Requirement: 日夜循环与怪物生成
系统 SHALL 基于游戏刻实现昼夜更替，控制怪物生成，白天燃烧僵尸骷髅。

#### Scenario: 夜晚怪物生成
- **WHEN** 游戏进入夜晚
- **THEN** 在黑暗区域生成敌对生物

### Requirement: 方块更新与计划刻
系统 SHALL 实现水流动、熔岩流动、植物生长、农作物成熟、火蔓延等随机刻和计划更新。

#### Scenario: 水流动
- **WHEN** 水方块旁边有空气方块且下方为空气或可流动位置
- **THEN** 水向低处和水平方向流动

### Requirement: 创造模式
系统 SHALL 实现创造模式：无限方块、飞行、无伤害、瞬间破坏、物品栏可挑选所有方块。

#### Scenario: 创造模式瞬间破坏
- **WHEN** 玩家在创造模式左键点击方块
- **THEN** 方块立即被破坏，无挖掘时间

### Requirement: Web Audio API 音效系统
系统 SHALL 使用 Web Audio API 播放音效，管理多个音频缓冲区。

#### Scenario: 方块破坏音效
- **WHEN** 方块被破坏
- **THEN** 播放对应方块类型的破坏音效

### Requirement: 脚步声音效
系统 SHALL 根据玩家脚下方块类型选择脚步声音效。

#### Scenario: 草地行走
- **WHEN** 玩家在草方块上行走
- **THEN** 播放草地脚步声

### Requirement: 3D 空间音效
系统 SHALL 根据声源位置和玩家朝向，使用 PannerNode 实现左右声道和距离衰减。

#### Scenario: 生物叫声方向感
- **WHEN** 僵尸在玩家左侧发出声音
- **THEN** 左声道音量高于右声道，距离越远音量越低

### Requirement: 背景音乐
系统 SHALL 实现背景音乐播放列表循环或随机，支持淡入淡出。

#### Scenario: 音乐切换
- **WHEN** 当前曲目播放完毕
- **THEN** 淡出当前曲目，淡入下一首

### Requirement: HUD 界面
系统 SHALL 显示十字准星、快捷栏、血量、饱食度、盔甲条、氧气条（水下）。

#### Scenario: 快捷栏显示
- **WHEN** 游戏运行中
- **THEN** 屏幕底部显示快捷栏 9 格物品和选中框

### Requirement: 物品栏界面
系统 SHALL 实现拖拽物品、右键分割、移动物品、Shift 快捷移动。

#### Scenario: 拖拽物品
- **WHEN** 玩家在物品栏界面点击某格物品并拖动
- **THEN** 物品跟随鼠标，释放时放入目标格

### Requirement: 合成界面
系统 SHALL 显示配方输出，允许原料放入合成网格。

#### Scenario: 配方匹配
- **WHEN** 玩家在合成网格中摆放原料
- **THEN** 输出格自动显示匹配的合成结果

### Requirement: 容器界面
系统 SHALL 实现箱子、熔炉、附魔台等容器界面，共享物品槽逻辑。

#### Scenario: 打开箱子
- **WHEN** 玩家右键点击箱子
- **THEN** 显示箱子物品栏界面，玩家物品栏和箱子物品栏同时可见

### Requirement: 聊天与命令系统
系统 SHALL 支持文本输入、命令（/tp, /give, /gamemode 等）和消息记录。

#### Scenario: 执行传送命令
- **WHEN** 玩家输入 /tp 100 64 200
- **THEN** 玩家被传送到坐标 (100, 64, 200)

### Requirement: 设置菜单
系统 SHALL 提供音量、控制、图形选项、视距、按键绑定设置，保存到 localStorage。

#### Scenario: 调整视距
- **WHEN** 玩家在设置中调整视距滑块
- **THEN** 渲染距离立即更新，设置值保存到 localStorage

### Requirement: IndexedDB 数据持久化
系统 SHALL 将游戏存档存放在 IndexedDB 中，每个存档对应一个数据库。

#### Scenario: 保存游戏
- **WHEN** 触发自动保存或手动保存
- **THEN** 区块数据、世界元数据、玩家数据写入 IndexedDB

### Requirement: 区块二进制序列化
系统 SHALL 将区块数据序列化为二进制格式（可压缩），便于存储和读取。

#### Scenario: 区块保存
- **WHEN** 区块卸载时需要保存
- **THEN** 将 Uint16Array 方块数据序列化为二进制并压缩后存入 IndexedDB

### Requirement: 世界元数据保存
系统 SHALL 保存种子、游戏模式、时间、难度、玩家位置和背包等世界元数据。

#### Scenario: 退出保存
- **WHEN** 玩家退出游戏
- **THEN** 完整保存所有世界元数据和区块数据

### Requirement: 存档导入导出
系统 SHALL 支持导入导出存档为文件，使用 File API。

#### Scenario: 导出存档
- **WHEN** 玩家点击导出存档
- **THEN** 将 IndexedDB 数据打包为文件下载

### Requirement: TypedArray 与对象池优化
系统 SHALL 全盘使用 TypedArray 和 ArrayBuffer，使用对象池技术管理区块、实体、粒子，避免 GC 卡顿。

#### Scenario: 区块对象复用
- **WHEN** 区块卸载后
- **THEN** 区块对象归还对象池，下次加载新区块时复用

### Requirement: Tick 与渲染分离
系统 SHALL 使用 requestAnimationFrame 渲染循环，逻辑 tick 定频 20 tps，渲染插值剩余帧。

#### Scenario: 低帧率逻辑稳定
- **WHEN** 渲染帧率降至 30fps
- **THEN** 逻辑 tick 仍以 20 tps 稳定运行

### Requirement: 区块加载优先级
系统 SHALL 优先加载玩家视野中心的区块，使用队列和 Worker 池。

#### Scenario: 视野中心优先
- **WHEN** 多个区块同时需要加载
- **THEN** 距玩家最近的区块优先分配 Worker 处理

### Requirement: Web Worker 网格构建
系统 SHALL 将网格构建放在 Web Worker 中，构建完毕传回主线程的 Transferable 对象，直接上传 GPU。

#### Scenario: 网格构建异步
- **WHEN** 区块方块数据就绪
- **THEN** 在 Worker 中构建网格，通过 Transferable 传回主线程

### Requirement: 浏览器兼容性
系统 SHALL 基于 WebGL 2.0 确保主流现代浏览器兼容。

#### Scenario: Chrome 运行
- **WHEN** 用户在最新版 Chrome 中打开游戏
- **THEN** 游戏正常运行，无 WebGL 错误

### Requirement: 原创资源与版权合规
系统 SHALL 使用原创或开源资源包，代码实现完全独立，不抄袭 Minecraft 原版纹理。

#### Scenario: 纹理资源
- **WHEN** 加载方块纹理
- **THEN** 使用原创或开源纹理，不包含 Minecraft 原版资源

### Requirement: PWA 离线支持
系统 SHOULD 实现 Service Worker 缓存，允许游戏离线运行。

#### Scenario: 离线运行
- **WHEN** 用户断网后打开游戏
- **THEN** Service Worker 从缓存加载游戏资源，可正常游玩

### Requirement: TypeScript 与 Vite 工程体系
系统 SHALL 使用 TypeScript 编写代码，使用 Vite 构建，处理 Worker 和资源导入。

#### Scenario: 开发构建
- **WHEN** 运行 vite dev
- **THEN** 启动开发服务器，支持热更新和 TypeScript 类型检查

### Requirement: 数据驱动方块与物品定义
系统 SHALL 方块和物品使用 JSON 数据驱动注册，方便扩展。

#### Scenario: 添加新方块
- **WHEN** 在 JSON 中注册新方块定义
- **THEN** 游戏自动加载新方块的纹理、属性和模型

### Requirement: 调试工具
系统 SHOULD 提供内置调试 UI 显示区块边界、FPS、帧时间、实体计数，可开关渲染通道。

#### Scenario: 显示调试信息
- **WHEN** 按下 F3 键
- **THEN** 屏幕显示 FPS、区块坐标、实体数量等调试信息
