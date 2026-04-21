# Shared Assets - 共享资源文件夹

此文件夹包含两个版本（GDScript 和 C#）共享的游戏资源。

## 📁 文件夹说明

### sprites/
存放角色精灵图、物品图标、特效动画等。

**命名规范**:
- `player_idle_01.png` - 玩家待机动画第1帧
- `enemy_slime_run_02.png` - 史莱姆敌人跑步动画第2帧
- `item_coin.png` - 金币道具
- `effect_explosion_01.png` - 爆炸特效第1帧

**推荐尺寸**:
- 角色: 32×32 或 64×64
- 物品: 16×16 或 32×32
- 特效: 32×32 或 64×64

### tilesets/
存放瓦片集资源，用于构建游戏地图。

**命名规范**:
- `tileset_ground_16px.png` - 16px 地面瓦片集
- `tileset_wall_32px.png` - 32px 墙壁瓦片集
- `tileset_decorations.png` - 装饰瓦片集

**推荐尺寸**:
- 瓦片大小: 16×16 或 32×32
- 瓦片集宽度: 256px 或 512px

### audio/music/
存放背景音乐文件。

**命名规范**:
- `music_main_theme.ogg` - 主菜单音乐
- `music_level_1.ogg` - 关卡1音乐
- `music_boss_battle.ogg` - Boss战音乐

**格式要求**:
- 格式: OGG Vorbis
- 采样率: 44100 Hz
- 循环播放: 是

### audio/sfx/
存放音效文件。

**命名规范**:
- `sfx_jump.wav` - 跳跃音效
- `sfx_attack.wav` - 攻击音效
- `sfx_coin.wav` - 收集金币音效
- `sfx_hit.wav` - 受伤音效

**格式要求**:
- 格式: WAV (PCM)
- 采样率: 44100 Hz
- 位深度: 16-bit

### fonts/
存放字体文件。

**推荐字体**:
- 像素字体: `pixel_font.ttf`
- 等宽字体: `monospace_font.ttf`

### shaders/
存放自定义着色器。

**命名规范**:
- `shader_pixelate.gdshader` - 像素化效果
- `shader_outline.gdshader` - 描边效果
- `shader_glow.gdshader` - 发光效果

## 🎨 资源制作规范

### 像素艺术

1. **调色板限制**: 使用 8/16/32 色调色板
2. **抗锯齿**: 禁用，保持硬边缘
3. **对齐**: 像素对齐，避免半像素
4. **一致性**: 保持相同的光源方向

### 音频

1. **音乐**: 
   - 使用 OGG 格式
   - 设置循环点
   - 音量标准化到 -12dB

2. **音效**:
   - 使用 WAV 格式
   - 保持简短（< 2秒）
   - 音量标准化到 -6dB

## 📥 导入 Godot

### 方法1: 符号链接（推荐）

在 Godot 项目中创建符号链接：

```bash
# Windows (以管理员身份运行)
mklink /D "D:\AIcreateEngine\标准软件开发范式\GodotGame\GDScript_Version\assets\shared" "D:\AIcreateEngine\标准软件开发范式\GodotGame\Shared_Assets"

mklink /D "D:\AIcreateEngine\标准软件开发范式\GodotGame\CSharp_Version\assets\shared" "D:\AIcreateEngine\标准软件开发范式\GodotGame\Shared_Assets"
```

### 方法2: 复制资源

直接将资源复制到各自项目的 assets 文件夹中。

## 🔧 Godot 导入设置

### 精灵图导入设置

```ini
[params]
compress/mode=0
compress/high_quality=false
compress/lossy_quality=0.7
compress/hdr_compression=1
compress/normal_map=0
compress/channel_pack=0
mipmaps/generate=false
mipmaps/limit=-1
roughness/mode=0
roughness/src_normal=""
process/fix_alpha_border=true
process/premult_alpha=false
process/normal_map_invert_y=false
process/hdr_as_srgb=false
process/hdr_clamp_exposure=false
process/size_limit=0
detect_3d/compress_to=1
```

### 音频导入设置

**音乐 (OGG)**:
- 循环: 启用
- 压缩模式: 有损
- 质量: 0.7

**音效 (WAV)**:
- 循环: 禁用
- 压缩模式: 无损

## 📦 资源列表模板

### 角色动画
- [ ] 待机 (2-4帧)
- [ ] 行走 (4-8帧)
- [ ] 跳跃 (1-2帧)
- [ ] 下落 (1-2帧)
- [ ] 攻击 (4-6帧)
- [ ] 受伤 (2-3帧)
- [ ] 死亡 (4-8帧)

### 瓦片集
- [ ] 地面 (草地、泥土、石头)
- [ ] 墙壁 (砖墙、石墙)
- [ ] 平台 (浮动平台)
- [ ] 装饰 (植物、岩石)
- [ ] 水体 (动画)

### 音效
- [ ] 跳跃
- [ ] 攻击
- [ ] 受伤
- [ ] 死亡
- [ ] 收集金币
- [ ] 收集道具
- [ ] 爆炸
- [ ] 脚步声

### 音乐
- [ ] 主菜单
- [ ] 关卡1
- [ ] 关卡2
- [ ] Boss战
- [ ] 胜利
- [ ] 失败

---

**注意**: 将资源添加到此文件夹后，记得在 Godot 中重新导入！
