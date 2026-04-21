# TypeScript Agent - 检查清单

## 1. 开发前检查清单

### 1.1 需求理解
- [ ] 明确目标平台（浏览器/Node.js/通用）
- [ ] 确定前端框架（React/Vue/Angular）
- [ ] 确定后端框架（Express/NestJS）
- [ ] 选择构建工具（Vite/Webpack/Rollup）
- [ ] 确定类型严格程度
- [ ] 识别状态管理需求
- [ ] 确认路由方案

### 1.2 环境准备
- [ ] Node.js版本检查（16+）
- [ ] TypeScript安装（5.0+）
- [ ] 包管理器选择（npm/yarn/pnpm）
- [ ] IDE配置（VS Code + 插件）
- [ ] Git初始化

### 1.3 项目初始化
- [ ] 创建package.json
- [ ] 配置tsconfig.json
- [ ] 安装TypeScript依赖
- [ ] 安装类型定义文件（@types/*）
- [ ] 配置ESLint + Prettier
- [ ] 配置.gitignore

## 2. 代码生成检查清单

### 2.1 TypeScript配置检查
- [ ] target设置合理（ES2020+）
- [ ] module设置（ESNext/CommonJS）
- [ ] strict模式启用
- [ ] noImplicitAny启用
- [ ] strictNullChecks启用
- [ ] esModuleInterop启用
- [ ] sourceMap启用
- [ ] declaration启用（库项目）

### 2.2 类型定义检查
- [ ] Interface定义清晰
- [ ] Type Alias使用恰当
- [ ] 枚举（Enum）定义完整
- [ ] 泛型参数命名规范（T, K, V等）
- [ ] 联合类型使用正确
- [ ] 交叉类型使用正确
- [ ] 类型守卫实现
- [ ] 类型断言使用恰当

### 2.3 代码风格检查
- [ ] 命名规范
  - [ ] 接口名（PascalCase）
  - [ ] 类型别名（PascalCase）
  - [ ] 函数（camelCase）
  - [ ] 常量（UPPER_SNAKE_CASE）
- [ ] 导入排序
- [ ] 导出组织
- [ ] 注释完整

### 2.4 React项目检查
- [ ] 组件Props类型定义
- [ ] FC类型使用正确
- [ ] Hooks类型推断
- [ ] 事件处理器类型
- [ ] Ref类型定义
- [ ] Context类型定义
- [ ] 高阶组件类型

### 2.5 Vue项目检查
- [ ] defineComponent使用
- [ ] Props类型定义
- [ ] Emits类型定义
- [ ] Ref/Reactive类型
- [ ] Computed类型推断
- [ ] 组合式函数类型

### 2.6 Node.js项目检查
- [ ] Request/Response类型
- [ ] 中间件类型定义
- [ ] 错误处理类型
- [ ] 环境变量类型
- [ ] 数据库模型类型

## 3. 代码质量检查清单

### 3.1 类型安全
- [ ] 无隐式any
- [ ] 无隐式this
- [ ] 严格函数类型检查
- [ ] 严格属性初始化
- [ ] 无未使用变量

### 3.2 类型推断
- [ ] 利用类型推断减少冗余
- [ ] as const使用恰当
- [ ] ReturnType使用
- [ ] Parameters使用

### 3.3 泛型使用
- [ ] 泛型约束合理
- [ ] 泛型默认参数
- [ ] 泛型条件类型
- [ ] 映射类型使用

## 4. 项目结构检查清单

### 4.1 标准项目结构
```
project/
├── src/
│   ├── types/           # 全局类型
│   ├── interfaces/      # 接口定义
│   ├── models/          # 数据模型
│   ├── utils/           # 工具函数
│   ├── components/      # 组件（前端）
│   ├── services/        # 服务层
│   └── index.ts         # 入口
├── tests/
│   ├── unit/
│   └── integration/
├── dist/                # 编译输出
├── tsconfig.json
├── package.json
└── .eslintrc.js
```

### 4.2 配置文件检查
- [ ] tsconfig.json完整
- [ ] package.json脚本配置
- [ ] ESLint配置正确
- [ ] Prettier配置正确
- [ ] .gitignore完整

## 5. 工具链检查清单

### 5.1 构建工具
- [ ] Vite配置正确
- [ ] Webpack配置正确
- [ ] Rollup配置正确
- [ ] 路径别名配置
- [ ] 环境变量配置

### 5.2 代码质量工具
- [ ] ESLint规则配置
- [ ] Prettier规则配置
- [ ] Husky pre-commit钩子
- [ ] lint-staged配置

### 5.3 测试工具
- [ ] Jest/Vitest配置
- [ ] 测试类型支持
- [ ] 覆盖率配置
- [ ] Mock类型定义

## 6. 安全审查清单

### 6.1 类型安全
- [ ] 无any类型滥用
- [ ] 无类型断言滥用
- [ ] 输入数据类型验证
- [ ] API响应类型定义

### 6.2 配置安全
- [ ] 敏感类型不暴露
- [ ] 环境变量类型安全
- [ ] 构建配置安全

## 7. 性能优化检查清单

### 7.1 编译优化
- [ ] skipLibCheck启用
- [ ] 增量编译配置
- [ ] 项目引用配置
- [ ] 类型声明文件分离

### 7.2 代码优化
- [ ] 类型导入使用import type
- [ ]  barrel exports优化
- [ ] 循环依赖检查

## 8. 文档检查清单

### 8.1 代码文档
- [ ] README.md完整
- [ ] 类型注释完整
- [ ] 复杂类型说明
- [ ] 示例代码

### 8.2 类型文档
- [ ] 公共API类型导出
- [ ] d.ts文件生成
- [ ] JSDoc注释

## 9. 最终审查清单

### 9.1 功能完整性
- [ ] 所有P0功能实现
- [ ] 类型检查通过
- [ ] 编译成功
- [ ] 测试通过

### 9.2 质量指标
- [ ] 无TypeScript错误
- [ ] 无ESLint错误
- [ ] 测试覆盖率>80%
- [ ] 类型覆盖率>95%

### 9.3 交付物
- [ ] 源代码完整
- [ ] 类型声明文件
- [ ] 测试套件
- [ ] 文档齐全

## 10. 常用检查命令

```bash
# 类型检查
tsc --noEmit

# ESLint检查
eslint src/ --ext .ts,.tsx

# 代码格式化检查
prettier --check "src/**/*.{ts,tsx}"

# 测试运行
jest --coverage

# 构建测试
npm run build
```
