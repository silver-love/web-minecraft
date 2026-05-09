# Tasks

## Phase 1: 项目初始化与渲染基础

- [x] Task 1: 初始化 TypeScript + Vite 项目结构
  - [x] SubTask 1.1: 创建 Vite + TypeScript 项目，配置 tsconfig.json
  - [x] SubTask 1.2: 配置 WebGL 2.0 Canvas 和全屏布局
  - [x] SubTask 1.3: 建立目录结构：src/renderer, src/world, src/player, src/game, src/ui, src/audio, src/workers, src/data, src/utils
  - [x] SubTask 1.4: 配置 Vite 支持 Web Worker 和 WASM 导入

- [x] Task 2: 实现 WebGL 2.0 渲染器核心
  - [x] SubTask 2.1: 创建 Renderer 类，初始化 WebGL2 上下文、视口、混合模式
  - [x] SubTask 2.2: 编写着色器加载与编译工具函数
  - [x] SubTask 2.3: 实现基础不透明方块着色器（顶点位置 + UV + 光照）
  - [x] SubTask 2.4: 实现纹理图集加载器和 UV 偏移计算
  - [x] SubTask 2.5: 实现基础渲染循环（requestAnimationFrame）

- [x] Task 3: 实现区块数据结构与网格生成
  - [x] SubTask 3.1: 定义 Chunk 类，使用 Uint16Array 存储方块 ID（16×16×384）
  - [x] SubTask 3.2: 实现方块 ID 到属性的映射表（JSON 数据驱动）
  - [x] SubTask 3.3: 实现邻接可见面检测算法
  - [x] SubTask 3.4: 实现贪婪网格化算法，合并同类型相邻面片
  - [x] SubTask 3.5: 生成顶点缓冲（位置、UV、光照、法线）并上传 GPU

- [x] Task 4: 实现视锥体剔除与区块渲染
  - [x] SubTask 4.1: 实现摄像机类（投影矩阵、视图矩阵、视锥体平面提取）
  - [x] SubTask 4.2: 实现视锥体与 AABB 相交测试
  - [x] SubTask 4.3: 渲染循环中仅提交视锥体内区块的绘制命令

- [x] Task 5: 创建测试地形与渲染验证
  - [ ] SubTask 5.1: 手动创建测试区块数据（各种方块类型）
  - [ ] SubTask 5.2: 验证贪婪网格化输出正确性
  - [ ] SubTask 5.3: 验证纹理图集 UV 偏移渲染正确
  - [ ] SubTask 5.4: 验证视锥体剔除效果

## Phase 2: 地形生成与区块管理

- [x] Task 6: 实现三维噪声地形生成
  - [x] SubTask 6.1: 移植/实现 3D Simplex 噪声函数
  - [x] SubTask 6.2: 实现基于噪声的地形高度图和密度场生成
  - [x] SubTask 6.3: 实现世界种子系统，保证可重现性

- [x] Task 7: 实现生物群系系统
  - [x] SubTask 7.1: 实现温度和湿度噪声层
  - [x] SubTask 7.2: 定义生物群系类型（沙漠、平原、森林、雪山等）及其属性
  - [x] SubTask 7.3: 根据生物群系决定地表方块、植被类型和地形高度修正

- [x] Task 8: 实现洞穴与矿石生成
  - [x] SubTask 8.1: 使用噪声阈值生成地下洞穴
  - [x] SubTask 8.2: 按深度和概率分布矿石（煤、铁、金、钻石等）

- [x] Task 9: 实现结构生成
  - [x] SubTask 9.1: 定义树木结构蓝图（橡树、桦树、云杉等）
  - [x] SubTask 9.2: 实现地表结构放置逻辑（树木、仙人掌、花等）

- [x] Task 10: 实现区块动态加载与卸载
  - [x] SubTask 10.1: 实现区块映射表（Map<string, Chunk>）
  - [x] SubTask 10.2: 以玩家为中心计算视距内区块坐标
  - [x] SubTask 10.3: 实现新区块异步生成队列
  - [x] SubTask 10.4: 实现超出视距区块的卸载与序列化

- [x] Task 11: Web Worker 并行地形生成
  - [x] SubTask 11.1: 创建地形生成 Worker 脚本
  - [x] SubTask 11.2: 实现主线程与 Worker 的消息通信协议
  - [x] SubTask 11.3: 使用 Transferable 对象传递区块数据
  - [x] SubTask 11.4: 实现 Worker 池管理

## Phase 3: 光照系统

- [x] Task 12: 实现双通道光照数据结构
  - [x] SubTask 12.1: 在区块数据中增加天空光和方块光存储（各 4 位）
  - [x] SubTask 12.2: 实现天空光初始化：从顶部向下传播

- [x] Task 13: 实现 BFS 光照传播
  - [x] SubTask 13.1: 实现天空光 BFS 传播算法
  - [x] SubTask 13.2: 实现方块光 BFS 传播算法（从发光方块发起）
  - [x] SubTask 13.3: 实现光照增量更新：方块变化时重新计算受影响区域

- [x] Task 14: 实现平滑光照与着色器集成
  - [x] SubTask 14.1: 计算逐顶点光照值（相邻方块光照平均）
  - [x] SubTask 14.2: 顶点着色器传递光照值，片元着色器插值
  - [x] SubTask 14.3: 实现阳光衰减逻辑

## Phase 4: 玩家控制与物理

- [x] Task 15: 实现 Pointer Lock FPS 控制
  - [x] SubTask 15.1: 实现 Pointer Lock API 鼠标锁定
  - [x] SubTask 15.2: 鼠标移动控制偏航和俯仰角
  - [x] SubTask 15.3: 滚轮切换快捷栏选中格

- [x] Task 16: 实现键盘输入管理
  - [x] SubTask 16.1: 实现按键状态管理器（按下/释放/持续按住）
  - [x] SubTask 16.2: WASD 移动、空格跳跃、Shift 潜行、E 背包、数字键快捷栏

- [x] Task 17: 实现重力与运动系统
  - [x] SubTask 17.1: 恒定重力加速度，跳跃初速度
  - [x] SubTask 17.2: 空中和水中运动参数区分
  - [x] SubTask 17.3: 潜行防止边缘掉落逻辑

- [x] Task 18: 实现 AABB 碰撞检测
  - [x] SubTask 18.1: 定义玩家 AABB（高 1.8，宽 0.6）
  - [x] SubTask 18.2: 运动分解为三轴逐一检测与方块 AABB 求交
  - [x] SubTask 18.3: 迭代修正位置，实现沿墙滑动

- [x] Task 19: 实现 DDA 射线检测与方块交互
  - [x] SubTask 19.1: 实现 DDA 体素遍历算法
  - [x] SubTask 19.2: 检测指向方块及相邻面，高亮显示
  - [x] SubTask 19.3: 实现方块破坏（含挖掘时间）和放置逻辑
  - [x] SubTask 19.4: 放置方块时检查实体碰撞

- [x] Task 20: 实现游泳与飞行
  - [x] SubTask 20.1: 水中游泳：重力减小，移动速度降低
  - [x] SubTask 20.2: 创造模式飞行：双击空格切换，无重力

- [x] Task 21: 实现实体通用物理
  - [x] SubTask 21.1: 掉落物实体：受重力、碰撞、拾取范围检测
  - [x] SubTask 21.2: 受重力方块（沙子、砂砾）下落逻辑

## Phase 5: 高级渲染

- [x] Task 22: 实现半透明方块渲染
  - [x] SubTask 22.1: 维护半透明方块渲染队列
  - [x] SubTask 22.2: 按深度排序，关闭深度写入，开启 Alpha 混合
  - [x] SubTask 22.3: 水面着色器动画（时间偏移 UV）
  - [x] SubTask 22.4: 水下雾效和色彩渐变

- [x] Task 23: 实现非全尺寸方块模型
  - [x] SubTask 23.1: 定义自定义体素模型格式（楼梯、半砖、栅栏、花、火把等）
  - [x] SubTask 23.2: 为非全尺寸方块生成自定义几何数据
  - [x] SubTask 23.3: 实现非全尺寸方块的碰撞检测盒

- [x] Task 24: 实现天空盒与昼夜循环
  - [x] SubTask 24.1: 实现动态天空盒渲染
  - [x] SubTask 24.2: 太阳/月亮位置随游戏时间变化
  - [x] SubTask 24.3: 天空颜色和环境光强度随昼夜变化

- [x] Task 25: 实现后期效果
  - [x] SubTask 25.1: 实现全屏四边形渲染通道
  - [x] SubTask 25.2: 实现泛光效果（亮度提取 + 高斯模糊 + 叠加）
  - [x] SubTask 25.3: 实现色调映射

- [x] Task 26: 实现粒子系统
  - [x] SubTask 26.1: 定义粒子数据结构和生命周期
  - [x] SubTask 26.2: 实现方块破坏粒子生成
  - [x] SubTask 26.3: 实现行走扬尘粒子
  - [x] SubTask 26.4: 批量更新 GPU 缓冲区，Instanced Rendering 绘制

- [x] Task 27: 实现第一人称手持物品渲染
  - [x] SubTask 27.1: 创建独立相机渲染手持物品
  - [x] SubTask 27.2: 根据快捷栏选中项渲染对应 3D 模型

- [x] Task 28: 实现 Instanced Rendering
  - [x] SubTask 28.1: 掉落物 Instanced Rendering
  - [x] SubTask 28.2: 粒子 Instanced Rendering

- [x] Task 29: 实现区块 LOD（可选）
  - [x] SubTask 29.1: 远处区块低细节网格生成
  - [x] SubTask 29.2: 根据距离切换 LOD 级别

## Phase 6: 游戏逻辑

- [x] Task 30: 实现物品栏系统
  - [x] SubTask 30.1: 定义物品栏数据结构（36 格 + 装备栏 + 副手）
  - [x] SubTask 30.2: 实现物品堆叠逻辑和最大堆叠数
  - [x] SubTask 30.3: 实现物品拖拽、右键分割、Shift 快捷移动

- [x] Task 31: 实现合成系统
  - [x] SubTask 31.1: 定义合成配方表（JSON 数据驱动）
  - [x] SubTask 31.2: 实现 2×2 和 3×3 合成网格匹配算法
  - [x] SubTask 31.3: 合成界面交互逻辑

- [x] Task 32: 实现熔炼系统
  - [x] SubTask 32.1: 熔炉界面（原料、燃料、输出槽）
  - [x] SubTask 32.2: 烧炼进度计算和燃料消耗

- [x] Task 33: 实现生存模式核心循环
  - [x] SubTask 33.1: 生命值、饥饿值、盔甲值系统
  - [x] SubTask 33.2: 饥饿影响生命恢复或消耗
  - [x] SubTask 33.3: 伤害来源：坠落、溺水、怪物攻击、饥饿

- [x] Task 34: 实现日夜循环与怪物生成
  - [x] SubTask 34.1: 基于游戏刻的昼夜更替
  - [x] SubTask 34.2: 黑暗区域怪物生成逻辑
  - [x] SubTask 34.3: 白天僵尸骷髅燃烧

- [x] Task 35: 实现方块更新与计划刻
  - [x] SubTask 35.1: 水流动逻辑
  - [x] SubTask 35.2: 熔岩流动逻辑
  - [x] SubTask 35.3: 植物生长和农作物成熟
  - [x] SubTask 35.4: 火蔓延逻辑

- [x] Task 36: 实现创造模式
  - [x] SubTask 36.1: 无限方块、飞行、无伤害
  - [x] SubTask 36.2: 瞬间破坏方块
  - [x] SubTask 36.3: 物品栏可挑选所有方块

- [x] Task 37: 实现生物 AI（基础）
  - [x] SubTask 37.1: 被动生物（牛、羊、猪）：漫游行为
  - [x] SubTask 37.2: 敌对生物（僵尸、骷髅）：检测玩家、追踪攻击
  - [x] SubTask 37.3: 基础三维寻路（A* 或流场）

- [x] Task 38: 实现战斗系统
  - [x] SubTask 38.1: 攻击冷却与伤害计算
  - [x] SubTask 38.2: 无敌时间和击退效果

- [x] Task 39: 实现红石系统（高级，可选）
  - [x] SubTask 39.1: 红石粉连线与信号传输
  - [x] SubTask 39.2: 红石火把、中继器、比较器逻辑
  - [x] SubTask 39.3: Tick 系统更新红石网络

## Phase 7: 音频系统

- [x] Task 40: 实现 Web Audio API 音效系统
  - [x] SubTask 40.1: 创建音频管理器，加载音频缓冲区
  - [x] SubTask 40.2: 方块破坏/放置音效
  - [x] SubTask 40.3: 脚步声音效（根据脚下方块类型）
  - [x] SubTask 40.4: 环境音效和生物叫声
  - [x] SubTask 40.5: 3D 空间音效（PannerNode 距离衰减和方向）
  - [x] SubTask 40.6: 背景音乐播放列表，淡入淡出

## Phase 8: 用户界面

- [x] Task 41: 实现 HUD
  - [x] SubTask 41.1: 十字准星
  - [x] SubTask 41.2: 快捷栏（9 格 + 选中框）
  - [x] SubTask 41.3: 血量、饱食度、盔甲条、氧气条
  - [x] SubTask 41.4: 经验条

- [x] Task 42: 实现物品栏界面
  - [x] SubTask 42.1: 物品栏网格渲染（DOM + Canvas 混合）
  - [x] SubTask 42.2: 拖拽物品交互
  - [x] SubTask 42.3: 右键分割物品
  - [x] SubTask 42.4: Shift 快捷移动

- [x] Task 43: 实现合成界面
  - [x] SubTask 43.1: 2×2 合成网格（玩家背包内）
  - [x] SubTask 43.2: 3×3 合成网格（工作台）
  - [x] SubTask 43.3: 配方输出显示与取出

- [x] Task 44: 实现容器界面
  - [x] SubTask 44.1: 箱子界面
  - [x] SubTask 44.2: 熔炉界面
  - [x] SubTask 44.3: 共享物品槽逻辑

- [x] Task 45: 实现聊天与命令系统
  - [x] SubTask 45.1: 聊天输入框和消息记录显示
  - [x] SubTask 45.2: 命令解析器（/tp, /give, /gamemode 等）

- [x] Task 46: 实现设置菜单
  - [x] SubTask 46.1: 音量、图形选项、视距设置
  - [x] SubTask 46.2: 按键绑定配置
  - [x] SubTask 46.3: 设置保存到 localStorage

## Phase 9: 数据持久化

- [x] Task 47: 实现 IndexedDB 存档系统
  - [x] SubTask 47.1: IndexedDB 数据库和对象仓库初始化
  - [x] SubTask 47.2: 区块数据二进制序列化（可压缩）
  - [x] SubTask 47.3: 世界元数据保存（种子、模式、时间、难度、玩家位置和背包）
  - [x] SubTask 47.4: 定期自动保存和退出时完整保存
  - [x] SubTask 47.5: 存档导入导出（File API）

## Phase 10: 性能优化与工程完善

- [x] Task 48: 性能优化
  - [x] SubTask 48.1: 对象池技术（区块、实体、粒子）
  - [x] SubTask 48.2: Tick 与渲染分离（20 tps 逻辑 + 渲染插值）
  - [x] SubTask 48.3: 区块加载优先级排序
  - [x] SubTask 48.4: Web Worker 网格构建 + Transferable 传回
  - [x] SubTask 48.5: 显存管理：区块卸载时销毁 GPU 缓冲区

- [x] Task 49: WASM 加速（可选）
  - [x] SubTask 49.1: 使用 WASM 编写地形生成模块
  - [x] SubTask 49.2: 使用 WASM 编写光照传播模块
  - [x] SubTask 49.3: 使用 WASM 编写压缩模块

- [x] Task 50: PWA 离线支持
  - [x] SubTask 50.1: 编写 Service Worker 缓存策略
  - [x] SubTask 50.2: 创建 manifest.json

- [x] Task 51: 调试工具
  - [x] SubTask 51.1: F3 调试覆盖层（FPS、区块坐标、实体数量）
  - [x] SubTask 51.2: 区块边界显示
  - [x] SubTask 51.3: 渲染通道开关

- [x] Task 52: 资源管线与构建
  - [x] SubTask 52.1: 自动将方块纹理打包为图集的脚本
  - [x] SubTask 52.2: 生成纹理坐标和方块属性的 JSON 元数据
  - [x] SubTask 52.3: 生产构建配置与优化

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2, Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 3]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 9] depends on [Task 7]
- [Task 10] depends on [Task 6]
- [Task 11] depends on [Task 10]
- [Task 12] depends on [Task 3]
- [Task 13] depends on [Task 12]
- [Task 14] depends on [Task 13, Task 2]
- [Task 15] depends on [Task 1]
- [Task 16] depends on [Task 15]
- [Task 17] depends on [Task 16]
- [Task 18] depends on [Task 17]
- [Task 19] depends on [Task 18]
- [Task 20] depends on [Task 18]
- [Task 21] depends on [Task 18]
- [Task 22] depends on [Task 4]
- [Task 23] depends on [Task 3]
- [Task 24] depends on [Task 2]
- [Task 25] depends on [Task 2]
- [Task 26] depends on [Task 2]
- [Task 27] depends on [Task 2]
- [Task 28] depends on [Task 2]
- [Task 29] depends on [Task 4]
- [Task 30] depends on [Task 19]
- [Task 31] depends on [Task 30]
- [Task 32] depends on [Task 30]
- [Task 33] depends on [Task 18, Task 30]
- [Task 34] depends on [Task 24, Task 37]
- [Task 35] depends on [Task 3]
- [Task 36] depends on [Task 18, Task 30]
- [Task 37] depends on [Task 18]
- [Task 38] depends on [Task 37]
- [Task 39] depends on [Task 35]
- [Task 40] depends on [Task 1]
- [Task 41] depends on [Task 30]
- [Task 42] depends on [Task 41]
- [Task 43] depends on [Task 42, Task 31]
- [Task 44] depends on [Task 42]
- [Task 45] depends on [Task 1]
- [Task 46] depends on [Task 1]
- [Task 47] depends on [Task 10, Task 30]
- [Task 48] depends on [Task 11]
- [Task 49] depends on [Task 48]
- [Task 50] depends on [Task 52]
- [Task 51] depends on [Task 4]
- [Task 52] depends on [Task 1]
