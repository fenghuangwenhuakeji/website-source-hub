# 🎬 Nano Banana Pro 宫格提示词完全手册
> Power Visualization Grid Prompt System | 权力视觉化宫格系统

**适用工具**: Nano Banana Pro (需上传参考图) | **版本**: v2.0 | **更新**: 2026年3月

---

## 📖 目录

- [核心分镜法则](#核心分镜法则)
- [四宫格 (2×2)](#四宫格-2x2)
- [六宫格 (3×2)](#六宫格-3x2)
- [八宫格 (3×3缺中心)](#八宫格-3x3缺中心)
- [九宫格 (3×3)](#九宫格-3x3)
- [十六宫格 (4×4)](#十六宫格-4x4)
- [使用指南](#使用指南)

---

# 核心分镜法则

> **最高原则**: 一切镜头语言服务于"权力"的展示与更迭。主角是权力的绝对中心。

---

## 第一法则：镜头运动与角色权力等级绑定

### 【权力赋予镜头】
```
功能：宣告主角的成长、胜利或绝对掌控
运镜：低角度仰拍 (Low-Angle) + 平稳推近 (Dolly In)
景别：从中景缓慢推至近景/特写
情境：获得关键能力、战胜强敌后

AI指令：[Power Granting Shot] 主角胜利后，低角度仰拍平稳推近至面部特写，捕捉掌控一切的微笑。
```

### 【压迫与窥视镜头】
```
功能：制造恐惧、不确定感和被动感
运镜：手持晃动 (Handheld) + 框景构图 (Framing Shot)
景别：特写/极近景，聚焦惊恐眼睛或局促动作
情境：战斗、未知危险、角色弱势时

AI指令：[Oppression Shot] 对战剧情使用手持晃动镜头，模拟主观视角，制造紧张感。
```

### 【评估与审视镜头】
```
功能：表现主角冷静分析、评估局势
运镜：缓慢横移 (Slow Pan) 或静止固定 (Static)
景别：中景到全景，模拟主角视线扫过目标
情境：判断新来者、评估战利品、制定战术

AI指令：[Assessment Shot] 对话时缓慢横移从脸扫到全身再回主角脸，表现权衡。
```

---

## 第二法则：景别与角色关系及情绪绑定

### 【亲密/威胁镜头】
```
功能：极致化情色张力或致命威胁
景别：大特写 (Extreme Close-Up)
焦点：局部细节（颤抖嘴唇、滚动喉结、闪烁眼神、修长腿部等）
情境：暧昧关系、调情、致命一击前、极度恐惧

AI指令：[Intimate Shot] 女角色贴近时，给胸部/手部特写，再给主角喉结大特写。
```

### 【权力关系镜头】
```
功能：清晰展示角色在空间中的等级地位
构图：主角必须处于画面视觉中心或前景主导位置
他人：其他角色呈环绕、依附或处于背景/边缘
情境：团队讨论、多人场景

AI指令：[Power Shot] 主角在主位，其他成员以他为中心环绕构图，凸显主导地位。
```

---

## 第三法则：剪辑节奏与叙事节奏绑定

### 【混乱爆发节奏】
```
功能：表现突发战斗、混乱和恐惧
规范：快速剪辑，镜头<2秒，配合手持晃动

AI指令：[Chaos Pace] 对战情景，使用<2秒快速晃动镜头，表现瞬间混乱。
```

### 【掌控从容节奏】
```
功能：表现主角掌控局面的安全感和强大
规范：长镜头或缓慢剪辑，镜头长度显著变长

AI指令：[Control Pace] 主角观察外界时，使用10秒固定长镜头，表现从容。
```

---

## 第四至七法则：画面品质规范

| 法则 | 核心要求 |
|-----|---------|
| **材质细节** | 材质参数合理，细节(灰尘/划痕/磨损)提升真实感，织物纹理可见 |
| **特效服务** | 特效与场景融合，节奏匹配镜头，不滥用掩盖叙事 |
| **色彩氛围** | 色彩风格明确表达情绪，避免杂乱导致视觉疲劳 |
| **画质标准** | 电影级光影，8K超高清，人物场景完美融合，大师级作品 |

---

# 四宫格 (2×2)

## 📝 中文指令

```
【四宫格电影印样生成指令】

分析输入图像的核心主体。生成2x2网格展示同一环境中同一主体的4个不同镜头。

┌─────────────────┬─────────────────┐
│ 1. 全景(FS)     │ 2. 中景(MS)     │
│ 完整展示从头到脚 │ 腰部以上构图    │
├─────────────────┼─────────────────┤
│ 3. 特写(CU)     │ 4. 背影(Back)   │
│ 聚焦面部/特征   │ 展示主体背面    │
└─────────────────┴─────────────────┘

分镜应用：面板1-2用[评估/权力镜头]，面板3用[亲密/赋权镜头]，面板4用[掌控节奏]定格
一致性：相同人物/服装/光照环境
```

## 🎨 英文提示词

```
<instruction>
Generate a 2x2 grid contact sheet showing 4 different shots of the same subject.
Panel 1: Full Shot, complete figure. Panel 2: Medium Shot, waist-up.
Panel 3: Close-Up, face focus. Panel 4: Back View.
Apply cinematography rules. Same person, outfit, lighting across all panels.
</instruction>

A professional 4-panel 2x2 grid cinematic contact sheet.
Style: Photorealistic, 8K ultra HD, cinematic color grading, thin black borders.
Subject: [SUBJECT] wearing [OUTFIT]. Environment: [ENVIRONMENT].
Lighting: [LIGHTING], professional cinematography. Quality: Masterpiece, sharp focus.
```

---

# 六宫格 (3×2)

## 📝 中文指令

```
【六宫格电影印样生成指令】

分析输入图像主体特征。生成3x2网格展示同一主体的6个不同镜头。

┌─────────────────┬─────────────────┬─────────────────┐
│ 1. 大远景(ELS)  │ 2. 全景(LS)     │ 3. 中景(MS)     │
│ 主体在广阔环境  │ 完整主体形象    │ 腰部以上        │
├─────────────────┼─────────────────┼─────────────────┤
│ 4. 近景(MCU)    │ 5. 特写(CU)     │ 6. 细节(Detail) │
│ 胸部以上        │ 面部聚焦        │ 手部/配饰/纹理  │
└─────────────────┴─────────────────┴─────────────────┘

分镜应用：面板1[评估镜头]，2-3[权力镜头]，4-5[亲密/赋权镜头]，6[材质细节]
一致性：所有6个面板保持相同人物、服装、光照、环境
```

## 🎨 英文提示词

```
<instruction>
Generate a 3x2 grid contact sheet showing 6 different shots of the same subject.
Panel 1: Extreme Long Shot. Panel 2: Long Shot. Panel 3: Medium Shot.
Panel 4: Medium Close-Up. Panel 5: Close-Up. Panel 6: Detail Shot.
Apply cinematography rules. Same person, outfit, lighting, environment across all 6 panels.
</instruction>

A professional 6-panel 3x2 grid cinematic contact sheet.
Style: Photorealistic, 8K, cinematic color grading, thin black borders.
Subject: [SUBJECT] wearing [OUTFIT]. Environment: [ENVIRONMENT].
Quality: Masterpiece, sharp focus, natural depth of field.
```

---

# 八宫格 (3×3缺中心)

## 📝 中文指令

```
【八宫格角色设定表生成指令】

分析输入图像主体。生成8面板网格(3x3布局中心留空/标题)，展示8个不同视角。

┌─────────────────┬─────────────────┬─────────────────┐
│ 1. 正面全景     │ 2. 侧面全景     │ 3. 背面全景     │
├─────────────────┼─────────────────┼─────────────────┤
│ 4. 仰视角度     │ ★ 标题/空白 ★ │ 5. 俯视角度     │
├─────────────────┼─────────────────┼─────────────────┤
│ 6. 面部特写     │ 7. 局部细节     │ 8. 动态瞬间     │
└─────────────────┴─────────────────┴─────────────────┘

8个视角法则：1[权力镜头] 2[评估镜头] 3[掌控节奏] 4[赋权镜头] 5[评估镜头] 6[亲密镜头] 7[材质细节] 8[混乱/掌控节奏]
一致性：所有8个面板保持角色、服装、环境一致
```

## 🎨 英文提示词

```
<instruction>
Generate an 8-panel grid (3x3 layout with center blank) showing 8 different angles.
Panel 1: Front Full. Panel 2: Side Profile. Panel 3: Back Full.
Panel 4: Low Angle. Panel 5: High Angle.
Panel 6: Face Close-Up. Panel 7: Detail Macro. Panel 8: Action Shot.
Apply cinematography rules. Same character, outfit, environment across all 8 panels.
</instruction>

A professional 8-panel character reference sheet, 3x3 grid with center for title.
Style: Character design sheet, 8K, photorealistic, thin black borders.
Subject: [SUBJECT] wearing [OUTFIT]. Environment: [ENVIRONMENT] or neutral background.
Quality: Identical character model, same outfit all views, sharp focus.
```

---

# 九宫格 (3×3)

## 📝 中文指令

```
【九宫格电影印样生成指令 - 核心格式】

分析输入图像构图。识别所有关键主体及空间关系。生成3x3网格展示9个不同镜头。

┌─────────────────┬─────────────────┬─────────────────┐
│ 1. 大远景(ELS)  │ 2. 全景(LS)     │ 3. 中远景(MLS)  │
│ 极端远景        │ 全身视图        │ 膝上景/四分之三 │
├─────────────────┼─────────────────┼─────────────────┤
│ 4. 中景(MS)     │ 5. 中特写(MCU)  │ 6. 特写(CU)     │
│ 腰部以上        │ 胸部以上        │ 面部聚焦        │
├─────────────────┼─────────────────┼─────────────────┤
│ 7. 大特写(ECU)  │ 8. 仰视(Low)    │ 9. 俯视(High)   │
│ 微距细节        │ 英雄视角        │ 鸟瞰视角        │
└─────────────────┴─────────────────┴─────────────────┘

分镜法则应用：
第1行(建立背景)：面板1[评估镜头]→面板2[权力镜头]→面板3[评估镜头]
第2行(核心覆盖)：面板4[权力镜头]→面板5[亲密镜头]→面板6[赋权镜头]
第3行(细节角度)：面板7[亲密+材质]→面板8[赋权镜头]→面板9[掌控节奏]

一致性：所有9个面板相同人物/服装/光照，景深逼真变化
```

## 🎨 英文提示词

```
<instruction>
Analyze input image composition. Generate a 3x3 grid showing 9 different shots.
Row 1: ELS (vast environment) → LS (full body) → MLS (3/4 knees)
Row 2: MS (waist-up) → MCU (chest-up) → CU (face focus)
Row 3: ECU (macro detail) → Low Angle (heroic) → High Angle (overview)
Apply cinematography rules. Same person, outfit, lighting across all 9 panels.
</instruction>

A professional 9-panel 3x3 grid cinematic contact sheet.
Style: Photorealistic, 8K ultra HD, cinematic color grading, thin black borders.
Subject: [SUBJECT] wearing [OUTFIT]. Environment: [ENVIRONMENT].
Lighting: [LIGHTING], realistic shadows, cinematic atmosphere. Quality: Masterpiece.
```

---

## 🌟 九宫格 - 狗仔街拍专题版

### 📝 中文指令

```
【九宫格狗仔街拍生成指令】

角色：明星街拍与拼图排版大师。捕捉自然瞬间(Candid)，长焦户外强光拍摄。

结构：3x3九宫格 | 黑色细边框 | 3:4竖版 | 8K超高清 | 狗仔风格
光影：强烈户外自然光，硬朗阴影，高对比度，模拟正午阳光

9个视角：
1.左上:全身正面行走 2.中上:头部特写 3.右上:低角度仰拍
4.左中:背影特写 5.中中:俯视抓拍 6.右中:侧面中景动态模糊
7.左下:外套动作 8.中下:侧后方曲线 9.右下:远景背影

细节：织物纹理(针织/牛仔)、真实皮肤(毛孔/汗水)、景深虚化突出人物
```

### 🎨 英文提示词

```
<instruction>
Role: Paparazzi Collage Master. Capture candid moments, telephoto lens, bright outdoor light.
Structure: 3x3 grid, thin black borders, 3:4 vertical, 8K, paparazzi style.
Lighting: Harsh daylight, hard shadows, high contrast, noon sun.
9 angles: Front walk, Face CU, Low angle, Back CU, High angle, Side blur, Jacket action, Side-back, Distant back.
</instruction>

Photorealistic 9-panel collage, 3x3 grid, paparazzi style. 8K, raw, candid feel.
Lighting: Harsh daylight, distinct shadows. Subject: [SUBJECT] wearing [OUTFIT].
Details: Telephoto compression, bokeh, sharp focus, authentic skin/fabric textures.
```

---

# 十六宫格 (4×4)

## 📝 中文指令

```
【十六宫格角色素材库生成指令】

分析输入图像主体特征。生成4x4网格展示16个不同角度和状态。

┌──────────────┬──────────────┬──────────────┬──────────────┐
│1.正面全景    │2.正面中景    │3.正面特写    │4.侧面全景    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│5.侧面中景    │6.侧面特写    │7.背面全景    │8.背面中景    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│9.仰视全景    │10.俯视全景   │11.3/4正面   │12.3/4背面   │
├──────────────┼──────────────┼──────────────┼──────────────┤
│13.面部细节   │14.手部细节   │15.配饰细节   │16.动态姿势   │
└──────────────┴──────────────┴──────────────┴──────────────┘

分镜法则：
第1行(正面-权力)：1-3[权力镜头] 4[评估镜头]
第2行(侧面/背面-审视)：5[评估] 6[亲密] 7-8[掌控]
第3行(角度-权力维度)：9[赋权] 10[评估] 11[权力] 12[掌控]
第4行(细节-感官深入)：13[亲密+材质] 14-15[材质] 16[混乱/掌控]

一致性：所有16个面板保持完美角色一致
```

## 🎨 英文提示词

```
<instruction>
Generate a 4x4 grid showing 16 different angles of the same subject.
Row 1: Front Full, Front Medium, Front CU, Side Full
Row 2: Side Medium, Side CU, Back Full, Back Medium
Row 3: Low Angle, High Angle, 3/4 Front, 3/4 Back
Row 4: Face Detail, Hand Detail, Accessory, Action Pose
Apply cinematography rules. Perfect consistency across all 16 panels.
</instruction>

A comprehensive 16-panel character asset sheet, 4x4 grid layout.
Style: Professional character design, 8K, photorealistic, thin black grid lines.
Subject: [SUBJECT] wearing [OUTFIT]. Environment: [ENVIRONMENT] or neutral.
Quality: Identical character all 16 panels, masterpiece, authentic textures.
```

---

# 使用指南

## 🎛️ 快速配置选择器

### 步骤1：选择宫格 | Grid Selection

| 选项 | 宫格 | 适用场景 |
|-----|-----|---------|
| 4 | 四宫格 (2×2) | 社交媒体快速展示 |
| 6 | 六宫格 (3×2) | 角色多角度展示 |
| 8 | 八宫格 (3×3缺中心) | 完整角色设定 |
| 9 | 九宫格 (3×3) | 电影故事板/街拍 ⭐主推 |
| 16 | 十六宫格 (4×4) | 专业素材库 |
| 自定义 | Custom | 特殊需求 |

### 步骤2：选择生成数量 | Quantity

| 选项 | 数量 | 说明 |
|-----|-----|-----|
| 1 | 1张 | 单次生成 |
| 2 | 2张 | 对比生成 |
| 5 | 5张 | 批量生成 |
| 自定义 | Custom | 按需设定 |

### 步骤3：选择类型 | Type Selection

| 选项 | 中文 | English | 说明 |
|-----|-----|---------|-----|
| 1 | 小说转分镜 | Novel to Storyboard | 文字描述转视觉分镜 |
| 2 | 游戏建模 | Game Modeling | 游戏3D角色/场景建模 |
| 3 | 动漫 | Anime | 日本动画风格 |
| 4 | 电影 | Film/Cinema | 电影级画面 |
| 5 | 电商 | E-commerce | 商品展示图 |
| 6 | 绘画 | Painting | 艺术绘画风格 | 
| 7 | 漫画 | Manga/Comics | 漫画分格风格 |
| 自定义 | Custom | Custom | 特殊类型需求 |

### 步骤4：选择风格 | Style Selection

| 选项 | 中文 | English | 特点 |
|-----|-----|---------|-----|
| 1 | 写实风格 | Photorealistic / Realistic Style | 真实感，照片级画质 |
| 2 | 游戏3D CG | Game 3D CGI | 游戏引擎渲染风格 |
| 3 | 动漫风格 | Anime Style | 日本动画风格 |
| 4 | 日漫风格 | Japanese Manga Style | 日本漫画风格 |
| 5 | 美漫风格 | American Comics Style | 美国超级英雄漫画风格 |
| 6 | 赛博朋克 | Cyberpunk | 科幻霓虹风格 |
| 7 | 古风/国风 | Chinese Traditional Style | 中国传统美学 |
| 8 | 欧美写实 | Western Realistic | 欧美写实风格 |
| 自定义 | Custom Style | Custom Style | 特殊风格需求 |

### 组合示例 | Combination Example

```
【配置组合】
宫格：9 (九宫格)
数量：2张
类型：电影 (Film)
风格：写实风格 (Photorealistic)

【生成的提示词开头】
A professional 9-panel 3x3 grid cinematic contact sheet.
Style: Photorealistic, 8K ultra HD, cinematic film quality, realistic lighting.
Type: Film/Cinema storyboard, movie-level production.
...
```

---

## 📋 快速参数模板

```
[目标角色 SUBJECT]: 详细描述人物外观、发型、肤色、气质
[目标服装 OUTFIT]: 详细描述服装颜色、材质、款式、配件
[目标环境 ENVIRONMENT]: 描述场景、背景元素、时间、天气
[光影设定 LIGHTING]: 描述光源类型、方向、强度、氛围
[情绪基调 MOOD]: 权力/压迫/亲密/评估
```

## 🎯 宫格选择建议

| 使用场景 | 推荐宫格 |
|---------|---------|
| 社交媒体快速展示 | 四宫格 (2×2) |
| 角色多角度展示 | 六宫格 (3×2) |
| 完整角色设定 | 八宫格 (3×3缺中心) |
| 电影故事板/街拍 | 九宫格 (3×3) |
| 专业素材库 | 十六宫格 (4×4) |

## 💡 提高一致性技巧

1. **使用参考图**: 上传清晰的主角图片
2. **详细描述特征**: 发型、服装、配饰的具体细节
3. **固定光照描述**: 使用一致的光照术语
4. **强调一致性关键词**: "consistent", "same outfit", "identical character"

---

> **灵感来源**: @awesome_visuals | "Nano banana pro扮演狗仔抓拍" 📸
> 
> **分镜法则核心**: 一切镜头语言服务于"权力"的展示与更迭

请输入你要的想法   在用户没输出之前禁止生图