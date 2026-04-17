# 星语心伴 (StarWhispers)

基于标准软件开发范式构建的**全年龄段 AI 心理陪伴平台**。

> 全面对标「测测」App，融合心理学、星座文化与AI技术

## ✨ 核心功能

### 🔮 塔罗占卜模块
- **78张完整塔罗牌库**：22张大阿尔卡纳 + 56张小阿尔卡纳
- **10+种牌阵系统**：单张指引、时间之流、凯尔特十字、爱情牌阵等
- **AI智能解读**：元素分析、趋势预测、建议生成

### 📜 八字命理模块
- **四柱八字计算**：年柱、月柱、日柱、时柱
- **五行分析**：金木水火土分布、平衡度评分、缺失提示
- **十神分析**：正财、偏财、正官、七杀等
- **大运推算**：十年大运走势

### 🧠 心理测试模块
- **25+测试类型**：
  - 性格测试：MBTI、大五人格、九型人格、DISC、NPTI
  - 情感测试：爱的语言、依恋类型、情商EQ
  - 职业测试：霍兰德、职业价值观、领导力
  - 心理健康：焦虑自评、抑郁自评、压力测试
  - 趣味测试：心理年龄、潜意识、色彩心理
- **多维评分引擎**：支持各类测试的专业计算
- **可视化报告**：图表展示、详细解读、建议生成

### 💬 AI对话模块
- 深度AI心理陪伴
- 多角色AI人格
- 情感分析与危机干预

## 📁 目录结构

```
星语心伴/
├── index.html              # 单页应用入口
├── css/
│   ├── variables.css       # 三套主题变量 (Child/Teen/Adult)
│   ├── reset.css          # 样式重置
│   └── main.css           # 全局布局
├── js/
│   ├── core/              # 核心框架（路由、状态）
│   ├── modules/           # 业务模块
│   │   ├── tarot/         # 塔罗占卜 ⭐ NEW
│   │   │   ├── index.js
│   │   │   ├── TarotDeck.js
│   │   │   ├── TarotSpreads.js
│   │   │   └── TarotInterpreter.js
│   │   ├── bazi/          # 八字命理 ⭐ NEW
│   │   │   ├── index.js
│   │   │   ├── BaziCalculator.js
│   │   │   ├── WuxingAnalyzer.js
│   │   │   └── BaziInterpreter.js
│   │   ├── test/          # 心理测试 ⭐ NEW
│   │   │   ├── index.js
│   │   │   ├── TestRepository.js
│   │   │   ├── TestEngine.js
│   │   │   └── ReportGenerator.js
│   │   ├── chat/          # AI对话
│   │   ├── horoscope/     # 星座运势
│   │   ├── npti/          # NPTI人格
│   │   └── user/          # 用户管理
│   ├── services/          # 服务层
│   ├── security/          # 安全过滤
│   └── ui/                # 界面渲染
├── docs/
│   └── 测测对标改造计划书.md  # 详细改造计划
└── assets/                # 静态资源
```

## 🎯 与「测测」对标

| 功能模块 | 测测 | 星语心伴 | 状态 |
|---------|------|---------|------|
| 星座运势 | ✅ | ✅ | 已有 |
| 心理测试 | ✅ 1000+ | ✅ 25+类型 | ⭐ 已实现 |
| 塔罗占卜 | ✅ | ✅ 78张牌+10牌阵 | ⭐ 已实现 |
| 八字命理 | ✅ | ✅ 四柱+五行+十神 | ⭐ 已实现 |
| 星盘分析 | ✅ | 🚧 | 待开发 |
| AI对话 | 基础 | ✅ 深度陪伴 | ✅ 领先 |
| 社区功能 | ✅ | 🚧 | 待开发 |
| 全年龄适配 | ❌ | ✅ 6岁+ | ✅ 独特 |

## 🚀 快速开始

```bash
# 克隆项目
cd 星语心伴

# 启动开发服务器
npx serve .

# 或使用 VS Code Live Server 插件
```

## 📖 开发指南

1. **样式规范**：所有样式必须使用 `var(--variable-name)` 引用变量，以支持年龄自适应主题
2. **模块化开发**：业务逻辑应解耦，通过 `js/core` 进行调度
3. **导入模块**：
```javascript
// 塔罗模块
import { tarotModule } from './js/modules/tarot/index.js';
const result = await tarotModule.divine('three', '我的感情走向?');

// 八字模块
import { baziModule } from './js/modules/bazi/index.js';
const bazi = baziModule.calculate({ year: 1990, month: 5, day: 15, hour: 10 });

// 测试模块
import { testModule } from './js/modules/test/index.js';
const tests = testModule.getTestList('personality');
```

## 🛡️ 安全机制

- 敏感词过滤
- 危机干预
- 未成年人保护
- 数据加密存储

## 📄 License

MIT License
