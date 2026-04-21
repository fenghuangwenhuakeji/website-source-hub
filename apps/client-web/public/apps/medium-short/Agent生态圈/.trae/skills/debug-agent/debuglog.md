# Debug Agent - 调试会话日志 (Debuglog)

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-14 |
| 最后更新 | 2026-03-14 |
| 文档状态 | 初始版本 |

---

## 调试会话索引

| 会话ID | 日期 | 语言 | 问题类型 | 状态 | 结果 |
|--------|------|------|----------|------|------|
| - | - | - | - | - | - |

---

## 调试会话记录模板

```markdown
## DEBUG-[编号]: [会话标题]

### 会话元数据
| 属性 | 内容 |
|------|------|
| 会话ID | DEBUG-YYYYMMDD-NNN |
| 开始时间 | YYYY-MM-DD HH:MM:SS |
| 结束时间 | YYYY-MM-DD HH:MM:SS |
| 持续时间 | XX 分钟 |
| 语言/框架 | JavaScript/Python/C++/Vue3 |
| 问题类型 | 编译错误/运行时错误/逻辑错误/性能问题 |
| 状态 | 进行中/已解决/无法复现/需要更多信息 |
| 处理者 | [姓名] |

### 问题描述
[详细描述遇到的问题]

### 环境信息
| 项目 | 内容 |
|------|------|
| 操作系统 | [OS版本] |
| 运行时版本 | [Node/Python/C++版本] |
| 项目版本 | [版本号] |
| IDE/编辑器 | [名称和版本] |
| 相关依赖 | [关键依赖版本] |

### 初始错误信息
```
[粘贴原始错误信息/堆栈追踪]
```

### 调试过程

#### 步骤 1: [步骤名称]
- **时间**: HH:MM
- **操作**: [描述执行的操作]
- **命令**: `[执行的命令]`
- **结果**: [操作结果]
- **发现**: [发现的信息]

#### 步骤 2: [步骤名称]
- **时间**: HH:MM
- **操作**: [描述执行的操作]
- **命令**: `[执行的命令]`
- **结果**: [操作结果]
- **发现**: [发现的信息]

...

### 根因分析
[问题的根本原因分析]

### 解决方案
[最终采用的解决方案]

### 验证结果
- [ ] 问题已解决
- [ ] 测试通过
- [ ] 无副作用

### 经验总结
[本次调试的经验教训和最佳实践]

### 相关信息
- 相关 Bug: [Bug ID]
- 相关 Commit: [Commit Hash]
- 相关文档: [文档链接]
```

---

## 调试会话示例

### DEBUG-20260314-001: Node.js 模块导入错误排查

#### 会话元数据
| 属性 | 内容 |
|------|------|
| 会话ID | DEBUG-20260314-001 |
| 开始时间 | 2026-03-14 10:00:00 |
| 结束时间 | 2026-03-14 10:30:00 |
| 持续时间 | 30 分钟 |
| 语言/框架 | JavaScript/Node.js |
| 问题类型 | 运行时错误 |
| 状态 | 已解决 |
| 处理者 | Debug Agent |

#### 问题描述
运行 Node.js 应用时出现模块导入错误，提示找不到自定义模块。

#### 环境信息
| 项目 | 内容 |
|------|------|
| 操作系统 | Windows 11 |
| 运行时版本 | Node.js v20.10.0 |
| 项目版本 | 1.0.0 |
| IDE/编辑器 | VS Code 1.85 |
| 相关依赖 | esm 模块 |

#### 初始错误信息
```
Error: Cannot find module './utils/helper'
Require stack:
- /project/src/services/user.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)
    at Module._load (node:internal/modules/cjs/loader:922:27)
    at Module.require (node:internal/modules/cjs/loader:1143:19)
```

#### 调试过程

##### 步骤 1: 检查文件结构
- **时间**: 10:05
- **操作**: 检查项目目录结构
- **命令**: `ls -la src/utils/`
- **结果**: 发现 utils 目录下没有 helper.js 文件
- **发现**: 文件实际名为 helpers.js (复数形式)

##### 步骤 2: 检查导入语句
- **时间**: 10:10
- **操作**: 检查导入语句拼写
- **命令**: `grep -r "require.*helper" src/`
- **结果**: 发现多处导入语句使用了错误的文件名
- **发现**: 共有 5 个文件使用了错误的导入路径

##### 步骤 3: 修复导入路径
- **时间**: 10:15
- **操作**: 批量修复导入路径
- **命令**: `sed -i "s/helper'/helpers'/g" src/**/*.js`
- **结果**: 所有导入路径已更新
- **发现**: 修复成功

##### 步骤 4: 验证修复
- **时间**: 10:25
- **操作**: 重新运行应用
- **命令**: `npm start`
- **结果**: 应用正常启动
- **发现**: 问题已解决

#### 根因分析
开发者在创建文件时使用了复数命名 `helpers.js`，但在导入时使用了单数形式 `helper`。由于 JavaScript 模块系统对路径大小写和拼写敏感，导致找不到模块。

#### 解决方案
1. 统一文件命名为单数形式 `helper.js`
2. 或修改所有导入语句使用正确的复数形式

最终采用方案 2，修改导入语句以匹配现有文件名。

#### 验证结果
- [x] 问题已解决
- [x] 测试通过
- [x] 无副作用

#### 经验总结
1. 项目应建立统一的命名规范
2. 使用 IDE 的自动导入功能可减少此类错误
3. 可以配置 module alias 简化导入路径

---

## 按语言分类的调试记录

### JavaScript/TypeScript 调试记录

暂无记录

### Python 调试记录

暂无记录

### C++ 调试记录

暂无记录

### Vue3 调试记录

暂无记录

---

## 调试技巧库

### JavaScript/TypeScript 调试技巧

#### 技巧 1: 使用 console.table() 查看对象

```javascript
// 适用于查看数组对象
console.table(users);
console.table(users, ['id', 'name', 'email']);
```

#### 技巧 2: 使用 console.time() 测量性能

```javascript
console.time('operation');
// 执行操作
console.timeEnd('operation');
```

#### 技巧 3: 使用 debugger 语句

```javascript
function debugMe() {
  debugger; // 代码会在此处暂停
  // ...
}
```

#### 技巧 4: 使用 Node.js inspect 模式

```bash
node --inspect script.js
node --inspect-brk script.js  # 在第一行暂停
```

#### 技巧 5: 捕获未处理的 Promise 拒绝

```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
```

### Python 调试技巧

#### 技巧 1: 使用 pdb 调试器

```python
import pdb

def debug_function():
    pdb.set_trace()  # 代码会在此处暂停
    # ...
```

#### 技巧 2: 使用 breakpoint() (Python 3.7+)

```python
def debug_function():
    breakpoint()  # 更简洁的断点方式
    # ...
```

#### 技巧 3: 使用 pprint 格式化输出

```python
from pprint import pprint

pprint(complex_dict)  # 格式化打印复杂数据结构
```

#### 技巧 4: 使用 logging 模块

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logging.debug('Debug message')
logging.info('Info message')
```

#### 技巧 5: 使用 sys.excepthook 捕获异常

```python
import sys

def exception_hook(exc_type, exc_value, exc_traceback):
    print(f'Exception: {exc_type.__name__}: {exc_value}')
    # 可以添加更多处理逻辑

sys.excepthook = exception_hook
```

### C++ 调试技巧

#### 技巧 1: 使用 GDB 调试

```bash
g++ -g program.cpp -o program
gdb ./program

# GDB 命令 break main     # 设置断点 run            # 运行程序 next           # 单步执行 print var      # 打印变量 backtrace      # 查看调用栈
```

#### 技巧 2: 使用 AddressSanitizer 检测内存问题

```bash
g++ -fsanitize=address -g program.cpp -o program
./program
```

#### 技巧 3: 使用 Valgrind 检测内存泄漏

```bash
valgrind --leak-check=full ./program
```

#### 技巧 4: 使用静态断言

```cpp
static_assert(sizeof(int) == 4, "int must be 4 bytes");
```

#### 技巧 5: 使用 RAII 管理资源

```cpp
class ResourceGuard {
public:
    ResourceGuard() { /* 获取资源 */ }
    ~ResourceGuard() { /* 释放资源 */ }
};
```

### Vue3 调试技巧

#### 技巧 1: 使用 Vue DevTools

```
1. 安装 Vue DevTools 浏览器扩展
2. 打开开发者工具，切换到 Vue 标签
3. 查看组件树、状态、事件等
```

#### 技巧 2: 使用 watchEffect 追踪响应式依赖

```javascript
import { watchEffect } from 'vue';

watchEffect(() => {
  console.log('count changed:', count.value);
});
```

#### 技巧 3: 使用 toRaw 查看原始对象

```javascript
import { toRaw } from 'vue';

console.log(toRaw(reactiveObject));
```

#### 技巧 4: 使用 onErrorCaptured 捕获组件错误

```javascript
import { onErrorCaptured } from 'vue';

onErrorCaptured((err, instance, info) => {
  console.error('Component error:', err);
  return false; // 阻止错误继续传播
});
```

#### 技巧 5: 使用 Vue warn handler

```javascript
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Vue warning:', msg);
  console.warn('Component trace:', trace);
};
```

---

## 调试工具速查表

### JavaScript/TypeScript 工具

| 工具 | 用途 | 安装/使用 |
|------|------|-----------|
| Chrome DevTools | 浏览器调试 | F12 |
| Node Inspector | Node.js 调试 | `node --inspect` |
| VS Code Debugger | IDE 调试 | 内置 |
| ESLint | 代码检查 | `npm install eslint` |
| TypeScript | 类型检查 | `tsc --noEmit` |

### Python 工具

| 工具 | 用途 | 安装/使用 |
|------|------|-----------|
| pdb | 调试器 | 内置 |
| ipdb | 增强调试器 | `pip install ipdb` |
| mypy | 类型检查 | `pip install mypy` |
| pylint | 代码检查 | `pip install pylint` |
| memory_profiler | 内存分析 | `pip install memory_profiler` |

### C++ 工具

| 工具 | 用途 | 安装/使用 |
|------|------|-----------|
| GDB | 调试器 | 系统包管理器 |
| LLDB | 调试器 | 系统包管理器 |
| Valgrind | 内存检查 | 系统包管理器 |
| AddressSanitizer | 内存检查 | 编译器内置 |
| clang-tidy | 代码检查 | 系统包管理器 |

### Vue3 工具

| 工具 | 用途 | 安装/使用 |
|------|------|-----------|
| Vue DevTools | 浏览器调试 | 浏览器扩展 |
| Vite DevTools | 构建调试 | Vite 内置 |
| Vue Test Utils | 组件测试 | `npm install @vue/test-utils` |
| Cypress | E2E 测试 | `npm install cypress` |

---

## 调试会话统计

### 按语言统计

| 语言 | 会话数 | 平均时长 | 解决率 |
|------|--------|----------|--------|
| JavaScript | 0 | - | - |
| Python | 0 | - | - |
| C++ | 0 | - | - |
| Vue3 | 0 | - | - |

### 按问题类型统计

| 问题类型 | 会话数 | 平均时长 |
|----------|--------|----------|
| 编译错误 | 0 | - |
| 运行时错误 | 0 | - |
| 逻辑错误 | 0 | - |
| 性能问题 | 0 | - |
| 配置问题 | 0 | - |

---

## 调试最佳实践

### 通用原则

1. **先复现，后调试**
   - 确保能够稳定复现问题
   - 记录复现步骤

2. **二分法定位**
   - 通过注释代码缩小问题范围
   - 逐步排除无关代码

3. **日志先行**
   - 添加足够的日志输出
   - 使用不同日志级别

4. **假设验证**
   - 提出可能的假设
   - 逐一验证排除

5. **文档记录**
   - 记录调试过程
   - 总结经验教训

### 语言特定建议

#### JavaScript/TypeScript
- 使用 TypeScript 增强类型安全
- 善用 async/await 处理异步
- 注意 this 绑定问题

#### Python
- 使用虚拟环境隔离依赖
- 注意缩进和编码问题
- 使用类型提示提高代码质量

#### C++
- 使用智能指针管理内存
- 启用编译器警告
- 使用静态分析工具

#### Vue3
- 理解响应式系统原理
- 正确使用生命周期钩子
- 注意组件通信方式

---

## 附录

### 会话ID生成规则

```
DEBUG-YYYYMMDD-NNN

YYYYMMDD: 日期
NNN: 当日序号 (001-999)

示例: DEBUG-20260314-001
```

### 相关文档链接

- [requirement.md](./requirement.md) - 需求文档
- [design.md](./design.md) - 设计文档
- [tasks.md](./tasks.md) - 任务文档
- [checklist.md](./checklist.md) - 检查清单
- [changelog.md](./changelog.md) - 变更日志
- [buglog.md](./buglog.md) - 缺陷日志
