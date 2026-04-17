# QuantAlpha Pro - 量化金融工作台

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**AI驱动的量化交易开发平台**

[功能特性](#功能特性) • [快速开始](#快速开始) • [模块说明](#模块说明) • [技术架构](#技术架构)

</div>

---

## 📊 功能特性

### 核心功能

- **📈 策略工作台** - 量化策略的开发、管理和编辑
- **⏱️ 回测引擎** - 历史数据验证策略有效性
- **🔬 数据分析** - 市场数据导入、处理和可视化
- **🧬 因子研究** - 因子挖掘、测试和分析
- **📦 组合管理** - 投资组合优化与再平衡
- **🛡️ 风控系统** - 风险指标监控与预警

### AI 能力

- **🤖 AI量化助手** - 智能策略生成与优化建议
- **📝 代码解释** - 自动解释量化代码逻辑
- **📊 策略分析** - AI驱动的策略评估报告

### 技术特性

- **离线可用** - 纯前端实现，数据存储在本地
- **多工作空间** - 支持多个独立项目环境
- **响应式设计** - 支持桌面端和移动端
- **实时同步** - 可选的本地文件系统同步

---

## 🚀 快速开始

### 方式一：直接打开

双击 `index.html` 文件即可在浏览器中打开使用。

### 方式二：本地服务器

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 然后访问 http://localhost:8080
```

### 首次配置

1. 点击左侧导航栏的 **系统设置**
2. 配置 AI 服务的 API Key（支持 OpenAI、DeepSeek 等）
3. 选择或创建工作空间

---

## 📋 模块说明

### 策略工作台 (Strategy)

策略开发与管理的核心模块：

- 创建、编辑、删除策略
- Python 风格的策略代码编写
- AI 辅助策略分析
- 策略状态管理

```python
# 策略代码示例
def initialize(context):
    context.stock = 'AAPL'
    
def handle_data(context, data):
    ma5 = data.history(context.stock, 'close', 5, '1d').mean()
    ma20 = data.history(context.stock, 'close', 20, '1d').mean()
    
    if ma5 > ma20:
        order_target_percent(context.stock, 1.0)
    else:
        order_target_percent(context.stock, 0)
```

### 回测引擎 (Backtest)

策略历史数据验证：

- 选择策略进行回测
- 设置时间范围和初始资金
- 生成收益曲线和K线图
- 计算夏普比率、最大回撤等指标

### 数据分析 (Data Analysis)

市场数据处理：

- 支持导入 CSV/JSON 格式数据
- 自动生成演示数据
- 数据表格预览
- 价格走势可视化

### 因子研究 (Factors)

因子挖掘与测试：

- 自定义因子公式
- IC/ICIR 等指标计算
- 分组回测分析
- AI 因子分析

### AI 量化助手

智能策略生成：

- 描述策略需求，AI 自动生成代码
- 支持多种策略风格（趋势、均值回归、套利等）
- Markdown 格式输出

---

## 🏗️ 技术架构

```
量化金融/
├── index.html              # 入口文件
├── css/
│   ├── style.css          # 核心样式
│   ├── mobile.css         # 移动端适配
│   └── all.min.css        # Font Awesome 图标
├── js/
│   ├── core/
│   │   ├── db.js          # IndexedDB 数据库
│   │   ├── utils.js       # 工具函数
│   │   ├── ui.js          # UI 组件
│   │   ├── ai.js          # AI 服务
│   │   ├── base.js        # 模块基座
│   │   └── app.js         # 应用入口
│   └── vendor/
│       ├── echarts.min.js  # 图表库
│       ├── marked.min.js   # Markdown 解析
│       └── tailwindcss.js  # CSS 框架
└── README.md
```

### 技术栈

- **前端框架**: 原生 JavaScript + Tailwind CSS
- **数据可视化**: ECharts
- **数据存储**: IndexedDB + localStorage
- **AI 服务**: OpenAI / DeepSeek / Anthropic API
- **图标**: Font Awesome 6

---

## 💡 使用技巧

### 工作空间管理

- 系统默认使用虚拟工作空间（纯浏览器存储）
- 可选绑定本地文件夹实现文件同步
- 切换工作空间 = 切换独立数据集

### 数据持久化

所有数据自动保存在浏览器中：
- 策略代码
- 回测配置
- API 配置（加密存储）
- 用户设置

### 键盘快捷键

- `Ctrl + S` - 保存当前编辑
- `Esc` - 关闭弹窗

---

## 🔧 API 配置

支持多种 AI 服务商：

| 服务商 | Base URL | 默认模型 |
|--------|----------|----------|
| OpenAI | https://api.openai.com/v1 | gpt-4o-mini |
| DeepSeek | https://api.deepseek.com/v1 | deepseek-chat |
| Anthropic | https://api.anthropic.com | claude-3-sonnet |
| Google | https://generativelanguage.googleapis.com/v1beta | gemini-pro |
| 自定义 | 任意兼容 OpenAI 格式的 API | - |

---

## 📈 量化指标说明

### 收益指标

- **总收益率** - 策略期间的总收益百分比
- **年化收益** - 折算为年度的收益率
- **超额收益** - 相对基准的超额部分

### 风险指标

- **最大回撤** - 从峰值到谷底的最大跌幅
- **波动率** - 收益率的标准差
- **夏普比率** - 风险调整后收益 (Sharpe > 1 为佳)

### 因子指标

- **IC (Information Coefficient)** - 因子与收益的相关性
- **ICIR** - IC 的稳定性指标
- **t统计量** - 因子显著性检验

---

## 📝 更新日志

### v1.0.0 (2024-01)

- ✅ 初始版本发布
- ✅ 策略工作台模块
- ✅ 回测引擎模块
- ✅ 数据分析模块
- ✅ 因子研究模块
- ✅ AI 量化助手
- ✅ 多工作空间支持

---

## 📄 许可证

MIT License - 可自由使用、修改和分发。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**QuantAlpha Pro** - 让量化交易更简单

Made with ❤️ for Quant Traders

</div>