# 架构映射文档

本项目的架构严格映射自 `WriterCenterArchon`。

## 核心映射表

| WriterCenterArchon | 星语心伴 (StarWhispers) | 职责描述 |
| :--- | :--- | :--- |
| `Core` | `js/core/` | **应用内核**：负责生命周期管理、模块加载、全局状态管理。 |
| `Modules` | `js/modules/` | **业务领域**：
- `chat`: 对话系统
- `analysis`: NPTI 测评
- `horoscope`: 星座服务 |
| `Security` | `js/security/` | **安全防线**：
- `ContentFilter`: 敏感词过滤
- `AgeGuard`: 年龄分级风控 |
| `UI` | `js/ui/` | **视图层**：负责 DOM 操作和组件渲染，与业务逻辑解耦。 |
| `Theme` | `css/variables.css` | **自适应引擎**：通过 CSS 变量实现年龄段 UI 切换。 |

## 数据流向

1. **用户交互** -> `UI Layer` (捕获事件)
2. **事件分发** -> `Core Layer` (EventBus)
3. **业务处理** -> `Modules Layer` (调用 LLM/算法)
4. **安全检查** -> `Security Layer` (输入/输出过滤)
5. **状态更新** -> `UI Layer` (渲染响应)
