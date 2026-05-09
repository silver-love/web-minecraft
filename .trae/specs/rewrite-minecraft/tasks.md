# Tasks

- [ ] Task 1: 项目基础设施重置
  - [ ] 清空 src/ 目录，保留 style.css 和入口文件
  - [ ] 更新 index.html，移除多余 canvas，只保留一个 WebGL canvas
  - [ ] 更新 vite.config.ts，确认 base 和 worker 配置
  - [ ] 验证 TypeScript 编译通过

- [ ] Task 2: 核心工具类实现
  - [ ] 实现 utils/MathUtils.ts（mat4Perspective, mat4LookAt, mat4Multiply, mat4Identity）
  - [ ] 实现 utils/SimplexNoise.ts（2D/3D Simplex 噪声，octave FBM）
  - [ ] 验证：噪声输出范围 [-1, 1]，矩阵运算正确

- [ ] Task 3: 方块类型与区块数据结构
  - [ ] 实现 world/BlockType.ts（方块注册表：ID、名称、透明/固体/发光、纹理索引、per-face 纹理）
  - [ ] 实现 world/Chunk.ts（16×16×256，Uint16Array 方块数据，Uint8Array 光照数据，getBlock/setBlock）
  - [ ] 实现 world/World.ts（区块 Map，世界坐标↔区块坐标转换，getBlock/setBlock）
  - [ ] 验证：创建区块，设置/读取方块，跨区块坐标转换正确

- [ ] Task 4: WebGL 2.0 渲染器核心
  - [ ] 实现 renderer/Shader.ts（着色器编译、链接、uniform 获取）
  - [ ] 实现 renderer/Camera.ts（位置/视角/FOV，视图矩阵/投影矩阵/VP矩阵，视锥体平面提取）
  - [ ] 实现 renderer/Renderer.ts（初始化 GL 状态，设置相机，beginFrame/endFrame，渲染区块列表）
  - [ ] 实现 renderer/shaders/block.vert.glsl + block.frag.glsl（位置+UV+光照顶点属性，雾效）
  - [ ] 验证：编译着色器成功，清除颜色缓冲显示正确背景色

- [ ] Task 5: 纹理图集生成
  - [ ] 实现 renderer/TextureAtlas.ts（程序化生成 256×256 纹理图集，16×16 像素方块纹理）
  - [ ] 包含纹理：石头、泥土、草地顶/侧面、圆石、木板、沙子、水、玻璃、原木顶/侧面、树叶、煤矿/铁矿/金矿/钻石矿、基岩、火把
  - [ ] 上传为 WebGL 纹理，NEAREST 过滤
  - [ ] 验证：纹理图集生成无报错，WebGL 纹理绑定成功

- [ ] Task 6: Section 网格构建与渲染
  - [ ] 实现 ChunkMesher（遍历 Section 4096 方块，六面邻接可见性检测，生成顶点数据：位置+UV+光照）
  - [ ] 实现 SectionMesh（VAO/VBO/IBO 上传和 draw）
  - [ ] 实现 renderer/ChunkRenderer.ts（管理所有 Section 网格，视锥体剔除，按 Section 渲染）
  - [ ] 验证：手动创建一个 16×16×16 实心石块 Section，渲染出可见画面

- [ ] Task 7: 天空渲染
  - [ ] 实现 renderer/SkyRenderer.ts（渐变天空，太阳/月亮，昼夜颜色变化）
  - [ ] 验证：渲染天空背景，颜色随时间变化

- [ ] Task 8: 地形生成
  - [ ] 实现 world/Biome.ts（生物群系定义：温度/降雨/高度/表面方块/树木概率，基于噪声选择生物群系）
  - [ ] 实现 world/WorldGenerator.ts（3D 噪声高度图，海平面=62，生物群系高度，洞穴，矿石，树木）
  - [ ] 实现 world/Lighting.ts（天空光从顶向下传播，方块光 BFS 传播）
  - [ ] 验证：生成一个区块，检查地表高度在合理范围，海平面以下有水，洞穴存在

- [ ] Task 9: 区块管理器
  - [ ] 实现 world/ChunkManager.ts（按玩家位置加载/卸载区块，生成队列按距离排序，每帧生成 4 个区块，Section 级网格重建）
  - [ ] 验证：玩家移动时区块正确加载和卸载

- [ ] Task 10: 玩家控制与物理
  - [ ] 实现 player/InputManager.ts（键盘/鼠标事件，Pointer Lock，按键状态追踪）
  - [ ] 实现 player/Player.ts（位置/速度/视角，WASD 移动，鼠标旋转，重力/跳跃，AABB 碰撞检测，逐轴解析）
  - [ ] 验证：玩家可以移动、跳跃、碰撞、旋转视角

- [ ] Task 11: Game 状态机与主循环
  - [ ] 实现 Game.ts（状态机：LOADING→MENU→PLAYING→PAUSED，主循环 requestAnimationFrame，tick/render 分离）
  - [ ] 实现 main.ts（创建 Game 实例，启动主循环）
  - [ ] 验证：游戏启动，状态切换正常

- [ ] Task 12: UI 系统
  - [ ] 实现 ui/LoadingScreen.ts（进度条 + 状态文字，Canvas 2D 绘制）
  - [ ] 实现 ui/MainMenu.ts（标题 + 按钮，Canvas 2D 绘制，鼠标点击检测）
  - [ ] 实现 ui/PauseMenu.ts（按钮列表，Canvas 2D 绘制）
  - [ ] 实现 ui/HUD.ts（准星、快捷栏、血量、饥饿值，Canvas 2D 绘制）
  - [ ] 实现 ui/DebugOverlay.ts（F3 切换，FPS/坐标/朝向/区块数，Canvas 2D 绘制）
  - [ ] 验证：各 UI 界面正确显示和响应

- [ ] Task 13: 游戏逻辑
  - [ ] 实现 game/Inventory.ts（36 格物品栏，堆叠，选中格，序列化/反序列化）
  - [ ] 实现 game/GameManager.ts（游戏模式、时间、生命、饥饿、方块破坏/放置）
  - [ ] 实现 game/SaveManager.ts（IndexedDB 存档/读档/自动保存）
  - [ ] 验证：物品栏操作正确，存档/读档正常

- [ ] Task 14: 方块交互
  - [ ] 实现 DDA 射线检测（从玩家眼睛位置沿视线方向检测最近实体方块）
  - [ ] 实现左键破坏方块（0.25 秒冷却，重建 Section 网格）
  - [ ] 实现右键放置方块（0.25 秒冷却，重建 Section 网格）
  - [ ] 实现方块高亮渲染（目标方块线框）
  - [ ] 验证：可以破坏和放置方块，高亮显示正确

- [ ] Task 15: 集成测试与部署
  - [ ] 完整游戏流程测试：启动→加载→主菜单→进入游戏→移动→破坏/放置方块→暂停→返回→退出
  - [ ] 确认 TypeScript 编译通过，Vite 构建成功
  - [ ] 推送到 GitHub，确认 GitHub Actions 部署成功
  - [ ] 在 GitHub Pages 上验证游戏可玩

# Task Dependencies
- Task 2 → Task 4, Task 8（工具类被渲染器和地形生成依赖）
- Task 3 → Task 6, Task 8（区块数据结构被网格构建和地形生成依赖）
- Task 4 → Task 5, Task 6, Task 7（渲染器核心被纹理/网格/天空依赖）
- Task 5 → Task 6（纹理图集被网格构建依赖）
- Task 6 → Task 9, Task 14（Section 网格被区块管理和方块交互依赖）
- Task 8 → Task 9（地形生成被区块管理器依赖）
- Task 10 → Task 11（玩家控制被 Game 主循环依赖）
- Task 11 → Task 12, Task 13, Task 14（Game 状态机被 UI/游戏逻辑/交互依赖）
- Task 12 → Task 15（UI 被集成测试依赖）
- Task 13 → Task 14（物品栏被方块交互依赖）
