# Rust Agent 质量检查清单

## 使用说明

本文档用于确保 Rust Agent 生成的代码符合 Rust 最佳实践和质量标准。在执行代码生成任务时，请逐项检查以下清单。

---

## 1. 项目结构检查

### 1.1 目录结构

- [ ] 项目使用标准 Cargo 目录结构
- [ ] `src/main.rs` 或 `src/lib.rs` 存在
- [ ] `Cargo.toml` 配置正确
- [ ] `.gitignore` 文件包含标准 Rust 忽略项
- [ ] `README.md` 包含项目说明

### 1.2 模块组织

- [ ] 模块使用合理的分层结构
- [ ] `mod.rs` 文件正确导出子模块
- [ ] 公开 API 使用 `pub` 正确标记
- [ ] 内部模块使用 `pub(crate)` 限制可见性

---

## 2. 代码风格检查

### 2.1 命名规范

- [ ] 结构体使用大驼峰命名 (PascalCase)
- [ ] 函数和变量使用蛇形命名 (snake_case)
- [ ] 常量使用全大写下划线命名 (SCREAMING_SNAKE_CASE)
- [ ] Trait 命名使用形容词或名词
- [ ] 类型别名清晰表达意图

### 2.2 代码格式化

- [ ] 代码通过 `rustfmt` 格式化
- [ ] 行长度不超过 100 字符
- [ ] 适当的空行分隔逻辑块
- [ ] 缩进使用 4 个空格

### 2.3 文档注释

- [ ] 所有公开项有文档注释 (`///`)
- [ ] 模块有模块级文档 (`//!`)
- [ ] 复杂函数包含示例代码
- [ ] Panic 情况在文档中说明
- [ ] Safety 要求对 unsafe 代码进行说明

---

## 3. 所有权与借用检查

### 3.1 所有权管理

- [ ] 避免不必要的 `.clone()` 调用
- [ ] 优先使用引用而非所有权转移
- [ ] 使用 `Cow` 进行写时复制优化
- [ ] 智能指针使用恰当（Box、Rc、Arc）

### 3.2 生命周期

- [ ] 生命周期标注清晰明确
- [ ] 避免过度复杂的生命周期约束
- [ ] 使用 `'static` 仅当真正需要
- [ ] 考虑使用生命周期省略规则

### 3.3 借用规则

- [ ] 没有同时存在的可变和不可变借用
- [ ] 借用不超出被借用值的生命周期
- [ ] 使用 `RefCell` 仅在必要时

---

## 4. 错误处理检查

### 4.1 错误类型

- [ ] 使用 `thiserror` 定义自定义错误
- [ ] 错误类型实现 `std::error::Error`
- [ ] 错误信息清晰有用
- [ ] 使用 `#[from]` 自动转换错误

### 4.2 错误传播

- [ ] 使用 `?` 运算符传播错误
- [ ] 使用 `anyhow` 进行快速错误处理
- [ ] 在错误添加上下文信息
- [ ] 避免使用 `.unwrap()` 和 `.expect()`

### 4.3 Option 处理

- [ ] 使用 `?` 传播 Option
- [ ] 使用 `ok_or`/`ok_or_else` 转换错误
- [ ] 使用 `map`/`and_then` 链式处理
- [ ] 避免使用 `.unwrap()` 提取 Option

---

## 5. 异步编程检查

### 5.1 异步运行时

- [ ] 使用 Tokio 作为异步运行时
- [ ] 正确配置 Tokio 特性（full/rt-multi-thread）
- [ ] 使用 `#[tokio::main]` 标记入口

### 5.2 异步代码规范

- [ ] 异步函数使用 `async fn`
- [ ] 调用异步函数使用 `.await`
- [ ] 避免在异步上下文中使用阻塞操作
- [ ] 使用 `tokio::time::sleep` 而非 `std::thread::sleep`

### 5.3 并发控制

- [ ] 使用 `Arc` 共享状态
- [ ] 使用 `RwLock` 或 `Mutex` 保护可变状态
- [ ] 使用 `Semaphore` 限制并发
- [ ] 使用 `mpsc` channel 进行任务通信

---

## 6. 类型系统检查

### 6.1 泛型使用

- [ ] 泛型参数命名清晰（T、E、K、V）
- [ ] 使用 Trait Bound 约束类型
- [ ] 避免过度泛化
- [ ] 考虑使用关联类型

### 6.2 Trait 设计

- [ ] Trait 方法签名清晰
- [ ] 使用 `#[async_trait]` 支持异步方法
- [ ] Trait 对象使用 `dyn` 标记
- [ ] 考虑 Trait 的孤儿规则

### 6.3 类型安全

- [ ] 使用 newtype 模式增强类型安全
- [ ] 使用类型状态模式防止无效状态
- [ ] 使用 PhantomData 标记泛型关系
- [ ] 避免使用裸指针

---

## 7. 内存安全与性能

### 7.1 内存安全

- [ ] 避免使用 `unsafe` 除非必要
- [ ] `unsafe` 代码有详细的安全注释
- [ ] 使用 `ManuallyDrop` 替代 `mem::forget`
- [ ] 检查可能的内存泄漏

### 7.2 性能优化

- [ ] 使用 `with_capacity` 预分配集合
- [ ] 使用迭代器而非循环
- [ ] 避免在热路径上分配内存
- [ ] 使用 `const fn` 进行编译期计算

### 7.3 零成本抽象

- [ ] 使用枚举而非 trait 对象（当类型已知）
- [ ] 使用泛型单态化
- [ ] 内联小函数
- [ ] 使用 `#[inline]` 谨慎

---

## 8. Web 开发检查 (Axum/Actix)

### 8.1 路由设计

- [ ] 路由路径使用 RESTful 规范
- [ ] 路由参数类型安全
- [ ] 使用嵌套路由组织 API
- [ ] 版本控制（/api/v1/）

### 8.2 Handler 实现

- [ ] Handler 函数签名正确
- [ ] 使用 `State` 提取共享状态
- [ ] 使用 `Json` 提取请求体
- [ ] 使用 `Path`/`Query` 提取参数

### 8.3 中间件

- [ ] 认证中间件正确实现
- [ ] 日志中间件记录请求信息
- [ ] CORS 配置正确
- [ ] 错误处理中间件统一处理

### 8.4 响应处理

- [ ] 响应状态码正确
- [ ] 错误响应格式统一
- [ ] 使用 `IntoResponse` trait
- [ ] 设置适当的 Content-Type

---

## 9. 数据库访问检查 (SQLx)

### 9.1 查询安全

- [ ] 使用参数化查询（`$1`, `$2`）
- [ ] 避免 SQL 注入风险
- [ ] 查询使用 `query_as!` 宏进行编译时检查
- [ ] 正确处理可选结果

### 9.2 事务处理

- [ ] 使用事务保证数据一致性
- [ ] 正确提交或回滚事务
- [ ] 事务范围最小化
- [ ] 使用 `?` 传播事务错误

### 9.3 连接管理

- [ ] 使用连接池
- [ ] 连接字符串安全存储
- [ ] 处理连接错误
- [ ] 设置连接超时

---

## 10. 测试检查

### 10.1 单元测试

- [ ] 测试函数使用 `#[test]` 标记
- [ ] 异步测试使用 `#[tokio::test]`
- [ ] 测试覆盖主要功能路径
- [ ] 使用 `assert!`、`assert_eq!`、`assert_ne!`

### 10.2 集成测试

- [ ] 集成测试放在 `tests/` 目录
- [ ] 测试完整的 API 流程
- [ ] 使用测试数据库或 mock
- [ ] 清理测试数据

### 10.3 Mock 使用

- [ ] 使用 `mockall` 创建 mock
- [ ] Mock 对象正确配置期望
- [ ] 验证 mock 调用
- [ ] 测试边界条件

---

## 11. 配置与部署

### 11.1 配置管理

- [ ] 使用环境变量存储敏感信息
- [ ] 使用 `config` crate 管理配置
- [ ] 提供 `.env.example` 文件
- [ ] 配置有合理的默认值

### 11.2 日志记录

- [ ] 使用 `tracing` 进行结构化日志
- [ ] 适当的日志级别（debug、info、warn、error）
- [ ] 包含上下文信息（request_id、user_id）
- [ ] 错误日志包含堆栈信息

### 11.3 可观测性

- [ ] 暴露健康检查端点
- [ ] 提供指标收集（可选）
- [ ] 支持分布式追踪（可选）
- [ ]  graceful shutdown 处理

---

## 12. 安全检查

### 12.1 输入验证

- [ ] 验证所有用户输入
- [ ] 使用 `validator` crate 进行验证
- [ ] 防止整数溢出
- [ ] 检查字符串长度限制

### 12.2 认证授权

- [ ] 使用安全的密码哈希（Argon2、bcrypt）
- [ ] JWT 使用安全的算法（HS256、RS256）
- [ ] 实现适当的权限检查
- [ ] 使用 HTTPS

### 12.3 依赖安全

- [ ] 定期更新依赖
- [ ] 使用 `cargo audit` 检查漏洞
- [ ] 锁定依赖版本
- [ ] 审查第三方 crate

---

## 13. 静态分析检查

### 13.1 Clippy 检查

运行以下命令并修复所有警告：

```bash
# 运行 clippy
cargo clippy --all-targets --all-features -- -D warnings

# 检查常见模式
cargo clippy -- -W clippy::all -W clippy::pedantic -W clippy::nursery
```

- [ ] 无 Clippy warnings
- [ ] 无 Clippy errors
- [ ] 遵循 Clippy 建议的优化

### 13.2 格式化检查

```bash
# 检查格式化
cargo fmt -- --check

# 自动格式化
cargo fmt
```

- [ ] 代码通过格式化检查
- [ ] 使用统一的格式化风格

### 13.3 编译检查

```bash
# 检查所有目标
cargo check --all-targets --all-features

# 发布模式检查
cargo check --release
```

- [ ] Debug 模式编译通过
- [ ] Release 模式编译通过
- [ ] 无编译器 warnings

---

## 14. 文档检查

### 14.1 代码文档

- [ ] 所有公开 API 有文档注释
- [ ] 文档包含使用示例
- [ ] 复杂的算法有实现说明
- [ ] 文档测试通过（`cargo test --doc`）

### 14.2 项目文档

- [ ] README 包含项目介绍
- [ ] 有快速开始指南
- [ ] 有 API 文档链接
- [ ] 有贡献指南（CONTRIBUTING.md）

### 14.3 生成文档

```bash
# 生成并打开文档
cargo doc --open --no-deps

# 检查文档链接
cargo doc --document-private-items
```

- [ ] 文档生成成功
- [ ] 文档链接有效
- [ ] 私有文档完整（可选）

---

## 15. 发布前检查

### 15.1 版本管理

- [ ] 版本号符合语义化版本规范
- [ ] CHANGELOG 已更新
- [ ] Git tag 已创建
- [ ] 版本兼容性已测试

### 15.2 发布检查

```bash
# 打包检查
cargo package --allow-dirty --list

# 发布检查（dry run）
cargo publish --dry-run
```

- [ ] 打包文件正确
- [ ] 发布检查通过
- [ ] 包含必要的文件（LICENSE、README）
- [ ] 排除不必要的文件

### 15.3 最终验证

- [ ] 所有测试通过（`cargo test`）
- [ ] 基准测试通过（如有）
- [ ] 示例代码可运行
- [ ] 文档完整准确

---

## 检查清单使用流程

1. **开发阶段**: 完成每个功能后，检查对应的项目
2. **代码审查**: 审查者使用此清单进行审查
3. **发布前**: 完整运行所有检查项
4. **定期审查**: 每月回顾并更新清单

## 自动化检查脚本

```bash
#!/bin/bash
# run_checks.sh

echo "Running Rust checks..."

# 格式化检查
echo "Checking formatting..."
cargo fmt -- --check || exit 1

# Clippy 检查
echo "Running Clippy..."
cargo clippy --all-targets --all-features -- -D warnings || exit 1

# 编译检查
echo "Checking compilation..."
cargo check --all-targets --all-features || exit 1

# 测试
echo "Running tests..."
cargo test --all-features || exit 1

# 文档测试
echo "Running doc tests..."
cargo test --doc || exit 1

# 文档生成
echo "Building documentation..."
cargo doc --no-deps || exit 1

echo "All checks passed!"
```

---

## 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0.0 | 2026-03-18 | 初始版本 |
