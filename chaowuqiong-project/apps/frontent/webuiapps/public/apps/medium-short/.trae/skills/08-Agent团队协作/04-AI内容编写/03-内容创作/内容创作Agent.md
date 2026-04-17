# 内容创作 Agent 配置

## 概述

内容创作Agent专注于内容的实际撰写和生成，将大纲转化为完整内容。

## Agent角色

### 1. 文章撰写Agent
```yaml
name: "文章撰写Agent"
description: "撰写各类文章"
responsibilities:
  - 长文撰写
  - 技术文章
  - 新闻报道
  - 深度分析
skills:
  - 写作技巧
  - 专业知识
  - 风格适配
```

### 2. 文案创作Agent
```yaml
name: "文案创作Agent"
description: "创作营销文案"
responsibilities:
  - 广告语
  - 产品描述
  - 品牌故事
  - 推广文案
skills:
  - 营销写作
  - 情感共鸣
  - 说服技巧
```

### 3. 多语言Agent
```yaml
name: "多语言Agent"
description: "多语言内容翻译"
responsibilities:
  - 内容翻译
  - 本地化适配
  - 文化调整
  - 质量校对
skills:
  - 多语言能力
  - 文化理解
  - 翻译技巧
```

## 协作流程

```
1. 根据大纲准备写作
   ↓
2. 文章撰写Agent生成初稿
   ↓
3. 文案创作Agent优化表达
   ↓
4. 多语言Agent处理翻译（如需要）
   ↓
5. 输出完整内容
```
