# 📂 Agent 分类说明

## 分类目录结构

```
Agent合集/
│
├── 📂 01-核心功能Agent/          # 4个Agent
│   ├── agent-generator/          # Agent制造生成器
│   ├── plan-agent/               # 规划Agent
│   ├── spec-agent/               # 规格Agent
│   └── debug-agent/              # 调试Agent
│
├── 📂 02-编程语言Agent/           # 11个Agent
│   ├── 📂 01-系统级语言/          # 4个
│   │   ├── c-agent/              # C语言
│   │   ├── cpp-agent/            # C++
│   │   ├── rust-agent/           # Rust
│   │   └── go-agent/             # Go
│   │
│   ├── 📂 02-企业级语言/          # 3个
│   │   ├── java-agent/           # Java
│   │   ├── kotlin-agent/         # Kotlin
│   │   └── csharp-agent/         # C#
│   │
│   └── 📂 03-脚本动态语言/        # 3个
│       ├── python-agent/         # Python
│       ├── javascript-agent/     # JavaScript
│       └── typescript-agent/     # TypeScript
│
├── 📂 03-前端框架Agent/           # 3个Agent
│   ├── vue3-agent/               # Vue3
│   ├── react-agent/              # React
│   └── flutter-agent/            # Flutter
│
├── 📂 04-游戏开发Agent/           # 6个Agent
│   ├── godot-gdscript-agent/     # Godot GDScript
│   ├── godot-csharp-agent/       # Godot C#
│   ├── godot-asset-agent/        # Godot资源
│   ├── godot-asset-script-agent/ # Godot程序化资源
│   ├── godot-scene-agent/        # Godot场景
│   └── GodotGame/                # 示例项目
│
├── 📂 05-内容创作Agent/           # 5个Agent
│   ├── brainstorm-agent/         # 头脑风暴
│   ├── outline-agent/            # 大纲设计
│   ├── narrative-engine-agent/   # 叙事引擎
│   ├── polish-agent/             # 润色优化
│   └── storyboard-agent/         # 分镜设计
│
├── 📂 06-AI创作Agent/             # 6个Agent
│   ├── nanobanana-asset-agent/   # NanoBanana资源
│   ├── nanobanana-grid-agent/    # NanoBanana宫格
│   ├── suno-music-agent/         # Suno音乐
│   ├── comic-creator-agent/      # 漫画创作
│   ├── script-creator-agent/     # 剧本创作
│   └── animation-creator-agent/  # 动画创作
│
├── 📂 07-工具辅助Agent/           # 1个Agent
│   └── language-selector-agent/  # 语言选择器
│
└── 📂 99-其他/                    # 其他文件
    └── [其他非Agent文件]
```

---

## 📋 Agent 分类清单

### 01-核心功能Agent (4个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| agent-generator | `agent-generator/` | `01-核心功能Agent/agent-generator/` | Agent制造生成器 |
| plan-agent | `plan-agent/` | `01-核心功能Agent/plan-agent/` | 规划Agent |
| spec-agent | `spec-agent/` | `01-核心功能Agent/spec-agent/` | 规格Agent |
| debug-agent | `debug-agent/` | `01-核心功能Agent/debug-agent/` | 调试Agent |

### 02-编程语言Agent (11个)

#### 系统级语言 (4个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| c-agent | `c-agent/` | `02-编程语言Agent/01-系统级语言/c-agent/` | C语言 |
| cpp-agent | `cpp-agent/` | `02-编程语言Agent/01-系统级语言/cpp-agent/` | C++ |
| rust-agent | `rust-agent/` | `02-编程语言Agent/01-系统级语言/rust-agent/` | Rust |
| go-agent | `go-agent/` | `02-编程语言Agent/01-系统级语言/go-agent/` | Go |

#### 企业级语言 (3个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| java-agent | `java-agent/` | `02-编程语言Agent/02-企业级语言/java-agent/` | Java |
| kotlin-agent | `kotlin-agent/` | `02-编程语言Agent/02-企业级语言/kotlin-agent/` | Kotlin |
| csharp-agent | `csharp-agent/` | `02-编程语言Agent/02-企业级语言/csharp-agent/` | C# |

#### 脚本动态语言 (3个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| python-agent | `python-agent/` | `02-编程语言Agent/03-脚本动态语言/python-agent/` | Python |
| javascript-agent | `javascript-agent/` | `02-编程语言Agent/03-脚本动态语言/javascript-agent/` | JavaScript |
| typescript-agent | `typescript-agent/` | `02-编程语言Agent/03-脚本动态语言/typescript-agent/` | TypeScript |

### 03-前端框架Agent (3个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| vue3-agent | `vue3-agent/` | `03-前端框架Agent/vue3-agent/` | Vue3 |
| react-agent | `react-agent/` | `03-前端框架Agent/react-agent/` | React |
| flutter-agent | `flutter-agent/` | `03-前端框架Agent/flutter-agent/` | Flutter |

### 04-游戏开发Agent (6个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| godot-gdscript-agent | `godot-gdscript-agent/` | `04-游戏开发Agent/godot-gdscript-agent/` | Godot GDScript |
| godot-csharp-agent | `godot-csharp-agent/` | `04-游戏开发Agent/godot-csharp-agent/` | Godot C# |
| godot-asset-agent | `godot-asset-agent/` | `04-游戏开发Agent/godot-asset-agent/` | Godot资源 |
| godot-asset-script-agent | `godot-asset-script-agent/` | `04-游戏开发Agent/godot-asset-script-agent/` | Godot程序化资源 |
| godot-scene-agent | `godot-scene-agent/` | `04-游戏开发Agent/godot-scene-agent/` | Godot场景 |
| GodotGame | `GodotGame/` | `04-游戏开发Agent/GodotGame/` | 示例项目 |

### 05-内容创作Agent (5个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| brainstorm-agent | `brainstorm-agent/` | `05-内容创作Agent/brainstorm-agent/` | 头脑风暴 |
| outline-agent | `outline-agent/` | `05-内容创作Agent/outline-agent/` | 大纲设计 |
| narrative-engine-agent | `narrative-engine-agent/` | `05-内容创作Agent/narrative-engine-agent/` | 叙事引擎 |
| polish-agent | `polish-agent/` | `05-内容创作Agent/polish-agent/` | 润色优化 |
| storyboard-agent | `storyboard-agent/` | `05-内容创作Agent/storyboard-agent/` | 分镜设计 |

### 06-AI创作Agent (6个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| nanobanana-asset-agent | `nanobanana-asset-agent/` | `06-AI创作Agent/nanobanana-asset-agent/` | NanoBanana资源 |
| nanobanana-grid-agent | `nanobanana-grid-agent/` | `06-AI创作Agent/nanobanana-grid-agent/` | NanoBanana宫格 |
| suno-music-agent | `suno-music-agent/` | `06-AI创作Agent/suno-music-agent/` | Suno音乐 |
| comic-creator-agent | `comic-creator-agent/` | `06-AI创作Agent/comic-creator-agent/` | 漫画创作 |
| script-creator-agent | `script-creator-agent/` | `06-AI创作Agent/script-creator-agent/` | 剧本创作 |
| animation-creator-agent | `animation-creator-agent/` | `06-AI创作Agent/animation-creator-agent/` | 动画创作 |

### 07-工具辅助Agent (1个)

| Agent | 原路径 | 目标路径 | 说明 |
|-------|--------|----------|------|
| language-selector-agent | `language-selector-agent/` | `07-工具辅助Agent/language-selector-agent/` | 语言选择器 |

---

## 🚀 快速复制命令

### PowerShell 批量复制脚本

创建 `copy-agents.ps1`:

```powershell
# Agent合集目录
$sourceDir = "D:\AIcreateEngine\标准软件开发范式\Agent合集"

# 01-核心功能Agent
Copy-Item -Path "$sourceDir\agent-generator" -Destination "$sourceDir\01-核心功能Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\plan-agent" -Destination "$sourceDir\01-核心功能Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\spec-agent" -Destination "$sourceDir\01-核心功能Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\debug-agent" -Destination "$sourceDir\01-核心功能Agent\" -Recurse -Force

# 02-编程语言Agent - 系统级语言
Copy-Item -Path "$sourceDir\c-agent" -Destination "$sourceDir\02-编程语言Agent\01-系统级语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\cpp-agent" -Destination "$sourceDir\02-编程语言Agent\01-系统级语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\rust-agent" -Destination "$sourceDir\02-编程语言Agent\01-系统级语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\go-agent" -Destination "$sourceDir\02-编程语言Agent\01-系统级语言\" -Recurse -Force

# 02-编程语言Agent - 企业级语言
Copy-Item -Path "$sourceDir\java-agent" -Destination "$sourceDir\02-编程语言Agent\02-企业级语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\kotlin-agent" -Destination "$sourceDir\02-编程语言Agent\02-企业级语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\csharp-agent" -Destination "$sourceDir\02-编程语言Agent\02-企业级语言\" -Recurse -Force

# 02-编程语言Agent - 脚本动态语言
Copy-Item -Path "$sourceDir\python-agent" -Destination "$sourceDir\02-编程语言Agent\03-脚本动态语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\javascript-agent" -Destination "$sourceDir\02-编程语言Agent\03-脚本动态语言\" -Recurse -Force
Copy-Item -Path "$sourceDir\typescript-agent" -Destination "$sourceDir\02-编程语言Agent\03-脚本动态语言\" -Recurse -Force

# 03-前端框架Agent
Copy-Item -Path "$sourceDir\vue3-agent" -Destination "$sourceDir\03-前端框架Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\react-agent" -Destination "$sourceDir\03-前端框架Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\flutter-agent" -Destination "$sourceDir\03-前端框架Agent\" -Recurse -Force

# 04-游戏开发Agent
Copy-Item -Path "$sourceDir\godot-gdscript-agent" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\godot-csharp-agent" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\godot-asset-agent" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\godot-asset-script-agent" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\godot-scene-agent" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\GodotGame" -Destination "$sourceDir\04-游戏开发Agent\" -Recurse -Force

# 05-内容创作Agent
Copy-Item -Path "$sourceDir\brainstorm-agent" -Destination "$sourceDir\05-内容创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\outline-agent" -Destination "$sourceDir\05-内容创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\narrative-engine-agent" -Destination "$sourceDir\05-内容创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\polish-agent" -Destination "$sourceDir\05-内容创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\storyboard-agent" -Destination "$sourceDir\05-内容创作Agent\" -Recurse -Force

# 06-AI创作Agent
Copy-Item -Path "$sourceDir\nanobanana-asset-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\nanobanana-grid-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\suno-music-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\comic-creator-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\script-creator-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force
Copy-Item -Path "$sourceDir\animation-creator-agent" -Destination "$sourceDir\06-AI创作Agent\" -Recurse -Force

# 07-工具辅助Agent
Copy-Item -Path "$sourceDir\language-selector-agent" -Destination "$sourceDir\07-工具辅助Agent\" -Recurse -Force

Write-Host "所有Agent复制完成！" -ForegroundColor Green
```

运行脚本:
```powershell
.\copy-agents.ps1
```

---

## 📊 分类统计

| 分类 | 数量 | 占比 |
|------|------|------|
| 01-核心功能 | 4 | 10.8% |
| 02-编程语言 | 11 | 29.7% |
| 03-前端框架 | 3 | 8.1% |
| 04-游戏开发 | 6 | 16.2% |
| 05-内容创作 | 5 | 13.5% |
| 06-AI创作 | 6 | 16.2% |
| 07-工具辅助 | 1 | 2.7% |
| **总计** | **37** | **100%** |

---

**分类目录已创建，可以直接复制Agent到对应文件夹！** 📂
