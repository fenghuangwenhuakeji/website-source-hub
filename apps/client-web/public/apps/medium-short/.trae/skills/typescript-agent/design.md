# TypeScript Agent - 架构设计文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TypeScript Agent 架构                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Parser    │  │  Generator  │  │  Optimizer  │  │   Tester    │    │
│  │   解析器     │  │   生成器     │  │   优化器     │  │   测试器     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    │   Core Engine     │                               │
│                    │   核心引擎         │                               │
│                    └─────────┬─────────┘                               │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                    │
│         │                    │                    │                    │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐               │
│  │    Type     │    │   Library   │    │   Pattern   │               │
│  │   System    │    │   Ecosystem │    │   Library   │               │
│  │   类型系统   │    │    生态库    │    │   模式库     │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

#### 1.2.1 Parser 解析器

```typescript
interface TypeScriptRequirementParser {
  parse(userInput: string): ParsedTypeScriptRequirement;
}

class TypeScriptRequirementParserImpl implements TypeScriptRequirementParser {
  parse(userInput: string): ParsedTypeScriptRequirement {
    // 解析目标平台
    const target = this._detectTarget(userInput);
    
    // 解析框架
    const framework = this._detectFramework(userInput);
    
    // 解析类型严格程度
    const strictness = this._detectStrictness(userInput);
    
    // 解析构建工具
    const buildTool = this._detectBuildTool(userInput);
    
    return {
      target,
      framework,
      strictness,
      buildTool,
      features: this._extractFeatures(userInput)
    };
  }
  
  private _detectTarget(input: string): TargetPlatform {
    if (input.includes('node') || input.includes('后端')) {
      return TargetPlatform.NODE;
    }
    if (input.includes('browser') || input.includes('前端')) {
      return TargetPlatform.BROWSER;
    }
    return TargetPlatform.UNIVERSAL;
  }
  
  private _detectFramework(input: string): Framework | undefined {
    const frameworks: Record<string, Framework> = {
      'react': Framework.REACT,
      'vue': Framework.VUE,
      'angular': Framework.ANGULAR,
      'express': Framework.EXPRESS,
      'nestjs': Framework.NESTJS
    };
    
    for (const [key, value] of Object.entries(frameworks)) {
      if (input.toLowerCase().includes(key)) {
        return value;
      }
    }
    return undefined;
  }
}
```

#### 1.2.2 Generator 生成器

```typescript
interface TypeScriptCodeGenerator {
  generate(requirement: ParsedTypeScriptRequirement): TypeScriptProject;
}

class TypeScriptCodeGeneratorImpl implements TypeScriptCodeGenerator {
  generate(requirement: ParsedTypeScriptRequirement): TypeScriptProject {
    const project: TypeScriptProject = {
      name: '',
      files: [],
      config: {}
    };
    
    // 生成tsconfig.json
    project.config.tsconfig = this._generateTsConfig(requirement);
    
    // 生成package.json
    project.config.package = this._generatePackageJson(requirement);
    
    // 生成类型定义
    project.files.push(...this._generateTypeDefinitions(requirement));
    
    // 生成核心代码
    project.files.push(...this._generateSourceFiles(requirement));
    
    // 生成工具配置
    project.config.eslint = this._generateEslintConfig(requirement);
    project.config.prettier = this._generatePrettierConfig();
    
    return project;
  }
  
  private _generateTsConfig(req: ParsedTypeScriptRequirement): TsConfig {
    return {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        strict: req.strictness === Strictness.STRICT,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts']
    };
  }
}
```

#### 1.2.3 Optimizer 优化器

```typescript
class TypeScriptOptimizer {
  optimize(code: TypeScriptCode): OptimizedTypeScriptCode {
    // 类型优化
    code = this._optimizeTypes(code);
    
    // 导入优化
    code = this._optimizeImports(code);
    
    // 泛型优化
    code = this._optimizeGenerics(code);
    
    return code;
  }
  
  private _optimizeTypes(code: TypeScriptCode): TypeScriptCode {
    // 减少any使用
    code = this._replaceAnyWithUnknown(code);
    
    // 优化联合类型
    code = this._simplifyUnionTypes(code);
    
    // 提取重复类型
    code = this._extractCommonTypes(code);
    
    return code;
  }
}
```

## 2. 知识库设计

### 2.1 知识库结构

```
knowledge-base/
├── type-system/
│   ├── basic-types.json          # 基础类型
│   ├── advanced-types.json       # 高级类型
│   ├── generics.json             # 泛型
│   ├── type-guards.json          # 类型守卫
│   └── utility-types.json        # 工具类型
├── frameworks/
│   ├── react-types.json          # React类型
│   ├── vue-types.json            # Vue类型
│   ├── express-types.json        # Express类型
│   └── nestjs-types.json         # NestJS类型
├── patterns/
│   ├── design-patterns.json      # 设计模式
│   ├── react-patterns.json       # React模式
│   └── node-patterns.json        # Node.js模式
└── templates/
│   ├── react-component.json      # React组件模板
│   ├── express-api.json          # Express API模板
│   └── nestjs-module.json        # NestJS模块模板
```

### 2.2 类型模板示例

```typescript
// React组件模板
interface ReactComponentTemplate {
  props: string;
  state?: string;
  render: string;
}

const FUNCTIONAL_COMPONENT_TEMPLATE = `
import React from 'react';

interface {{ComponentName}}Props {
  {{props}}
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({
  {{propNames}}
}) => {
  return (
    <div>
      {{content}}
    </div>
  );
};
`;

// Express路由模板
const EXPRESS_ROUTE_TEMPLATE = `
import { Router, Request, Response } from 'express';

const router = Router();

interface {{RouteName}}Request {
  {{requestBody}}
}

interface {{RouteName}}Response {
  {{responseBody}}
}

router.{{method}}('{{path}}', async (
  req: Request<{}, {}, {{RouteName}}Request>,
  res: Response<{{RouteName}}Response>
) => {
  try {
    {{implementation}}
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
`;
```

## 3. 代码生成流程

### 3.1 生成流程图

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  用户输入 │────▶│ 需求解析  │────▶│ 类型设计  │────▶│ 代码生成  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                         ┌──────────────────────────────┘
                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  输出交付 │◀────│ 类型检查  │◀────│ 代码优化  │◀────│ 测试生成  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3.2 详细流程

```typescript
class TypeScriptGenerationPipeline {
  async execute(request: GenerationRequest): Promise<GenerationResult> {
    // 1. 需求解析
    const requirement = this.parser.parse(request.userInput);
    
    // 2. 类型设计
    const typeDefinitions = this.typeDesigner.design(requirement);
    
    // 3. 代码生成
    const generatedCode = this.generator.generate(requirement, typeDefinitions);
    
    // 4. 测试生成
    const tests = this.testGenerator.generateTests(generatedCode);
    
    // 5. 代码优化
    const optimizedCode = this.optimizer.optimize(generatedCode);
    
    // 6. 类型检查
    const typeCheckResult = await this.typeChecker.check(optimizedCode);
    
    // 7. 组装输出
    return {
      code: optimizedCode,
      tests,
      typeDefinitions,
      typeCheckResult
    };
  }
}
```

## 4. 架构模式库

### 4.1 类型设计模式

```typescript
// 品牌类型模式（Nominal Typing）
type Brand<K, T> = K & { __brand: T };
type UserId = Brand<number, 'UserId'>;
type OrderId = Brand<number, 'OrderId'>;

// 结果类型模式
interface Ok<T> {
  type: 'ok';
  value: T;
}

interface Err<E> {
  type: 'error';
  error: E;
}

type Result<T, E> = Ok<T> | Err<E>;

// 异步结果类型
type AsyncResult<T, E> = Promise<Result<T, E>>;

// 工厂类型模式
interface Factory<T, Args extends any[]> {
  create(...args: Args): T;
}

// 构建器模式类型
interface Builder<T> {
  build(): T;
}
```

### 4.2 React类型模式

```typescript
// 通用组件Props
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// 受控组件Props
interface ControlledComponentProps<T> {
  value: T;
  onChange: (value: T) => void;
}

// 异步数据状态
type AsyncDataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Hook返回类型
interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

## 5. 数据模型

```typescript
interface GenerationRequest {
  userInput: string;
  targetPlatform?: TargetPlatform;
  strictness?: Strictness;
}

interface ParsedTypeScriptRequirement {
  target: TargetPlatform;
  framework?: Framework;
  strictness: Strictness;
  buildTool?: BuildTool;
  features: string[];
}

interface TypeScriptProject {
  name: string;
  files: TypeScriptFile[];
  config: {
    tsconfig: TsConfig;
    package: PackageJson;
    eslint?: EslintConfig;
    prettier?: PrettierConfig;
  };
}

interface TypeScriptFile {
  path: string;
  content: string;
  isDeclaration?: boolean;
}
```

## 6. 接口设计

```typescript
interface ITypeScriptAgent {
  generateProject(request: GenerationRequest): Promise<TypeScriptProject>;
  generateTypes(description: string): Promise<string>;
  migrateFromJavaScript(jsCode: string): Promise<string>;
  suggestImprovements(tsCode: string): Promise<Suggestion[]>;
}

interface ITypeGenerator {
  generateInterface(description: string): string;
  generateGenericType<T>(baseType: T): string;
  generateUnionType(types: string[]): string;
}
```

## 7. 部署架构

```yaml
# docker-compose.yml
version: '3.8'
services:
  typescript-agent:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - TYPESCRIPT_VERSION=5.0
    volumes:
      - ./knowledge-base:/app/knowledge-base
```

## 8. 质量保障

```typescript
class TypeScriptQualityChecker {
  check(code: TypeScriptCode): QualityReport {
    const report: QualityReport = {
      issues: [],
      score: 100
    };
    
    // 检查any使用
    const anyCount = this._countAnyUsage(code);
    if (anyCount > 0) {
      report.issues.push({
        type: 'warning',
        message: `Found ${anyCount} 'any' types`,
        severity: 'medium'
      });
    }
    
    // 检查类型导出
    if (!this._hasTypeExports(code)) {
      report.issues.push({
        type: 'warning',
        message: 'No type exports found',
        severity: 'low'
      });
    }
    
    return report;
  }
}
```
