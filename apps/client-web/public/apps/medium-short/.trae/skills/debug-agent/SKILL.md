---
name: "debug-agent"
description: "Intelligent debugging assistant. Automatically analyzes errors, locates root causes, and provides fix suggestions for multiple programming languages and frameworks. Supports TypeScript, Python, Java, C++, Go, Rust, Vue3, and more."
---

# Debug Agent - 智能调试助手

## 核心理念

**调试不是猜谜游戏。Debug Agent 通过系统化分析，快速定位问题根源。**

Debug Agent 是一个智能调试助手，自动分析错误、定位根因、提供修复建议。

## 核心工作流程

```
错误收集 → 分析定位 → 修复建议 → 验证测试 → 报告生成
```

## 支持的语言

| 语言 | 支持类型 |
|------|----------|
| TypeScript/JavaScript | 编译+运行时 |
| Python | 运行时 |
| Java | 编译+运行时 |
| C++ | 编译+运行时 |
| Go | 编译+运行时 |
| Rust | 编译+运行时 |
| C# | 编译+运行时 |
| Vue3 | 运行时 |
| React | 运行时 |

## 错误类型

### 编译错误
- 语法错误
- 类型错误
- 未定义引用
- 缺少依赖

### 运行时错误
- 空指针/空引用
- 数组越界
- 类型转换错误
- 资源未找到

### 逻辑错误
- 算法错误
- 边界条件
- 并发问题

## 调用触发条件

**立即调用此 Skill 当：**

- 代码编译失败
- 程序运行时出错
- 测试用例失败
- 需要分析错误日志
- 需要修复建议

## 执行示例

```
用户: "我的代码报错了: Cannot read property 'name' of undefined"

Debug Agent 分析:
┌────────────────────────────────────────────────────────────┐
│ [错误分析]                                                  │
│ 类型: 运行时错误 - 空引用                                   │
│ 位置: src/components/UserProfile.vue:42                     │
│ 原因: 访问未定义对象的属性                                  │
├────────────────────────────────────────────────────────────┤
│ [代码上下文]                                                │
│ 40: const user = fetchUser();                               │
│ 41: // user可能为null                                       │
│ 42: console.log(user.name);  // ← 错误位置                 │
├────────────────────────────────────────────────────────────┤
│ [修复建议]                                                  │
│ 方案1: 可选链操作符 (推荐)                                  │
│   console.log(user?.name);                                  │
│                                                             │
│ 方案2: 空值检查                                             │
│   if (user) {                                               │
│     console.log(user.name);                                 │
│   }                                                         │
├────────────────────────────────────────────────────────────┤
│ [预防措施]                                                  │
│ - 使用TypeScript严格模式                                    │
│ - 添加类型定义                                              │
│ - 使用可选链操作符                                          │
└────────────────────────────────────────────────────────────┘
```

## 输出保证

- [ ] 错误定位准确
- [ ] 修复建议可行
- [ ] 提供多种方案
- [ ] 解释修复原理

---

**记住：每个错误都是学习的机会！**
