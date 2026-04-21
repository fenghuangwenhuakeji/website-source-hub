# Python Agent - 架构设计文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Python Agent 架构                               │
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
│  │  Language   │    │   Library   │    │   Pattern   │               │
│  │  Features   │    │   Ecosystem │    │   Library   │               │
│  │  语言特性库  │    │   生态库     │    │   模式库     │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

#### 1.2.1 Parser 解析器

```python
class PythonRequirementParser:
    """Python需求解析器"""
    
    def parse(self, user_input: str) -> ParsedPythonRequirement:
        # 解析应用场景
        scenario = self._detect_scenario(user_input)
        
        # 解析Python版本
        python_version = self._detect_python_version(user_input)
        
        # 解析框架偏好
        framework = self._detect_framework(user_input)
        
        # 解析功能需求
        features = self._extract_features(user_input)
        
        # 解析异步需求
        async_required = self._detect_async_need(user_input)
        
        return ParsedPythonRequirement(
            scenario=scenario,
            python_version=python_version,
            framework=framework,
            features=features,
            async_required=async_required
        )
    
    def _detect_scenario(self, input_text: str) -> PythonScenario:
        scenarios = {
            'data_analysis': ['数据分析', 'pandas', 'numpy', '可视化'],
            'web_development': ['web', 'api', 'flask', 'fastapi', 'django'],
            'machine_learning': ['机器学习', 'sklearn', '模型', '训练'],
            'automation': ['自动化', '脚本', '定时任务', '爬虫'],
            'cli_tool': ['命令行', 'cli', '工具', '脚本']
        }
        
        for scenario, keywords in scenarios.items():
            if any(kw in input_text.lower() for kw in keywords):
                return PythonScenario(scenario)
        
        return PythonScenario.GENERAL
```

#### 1.2.2 Generator 生成器

```python
class PythonCodeGenerator:
    """Python代码生成器"""
    
    def generate(self, requirement: ParsedPythonRequirement) -> PythonProject:
        project = PythonProject()
        
        # 生成项目结构
        project.structure = self._generate_project_structure(requirement)
        
        # 生成依赖文件
        project.dependencies = self._generate_dependencies(requirement)
        
        # 生成核心代码
        project.source_files = self._generate_source_files(requirement)
        
        # 生成测试代码
        project.test_files = self._generate_test_files(requirement)
        
        # 生成配置文件
        project.config_files = self._generate_config_files(requirement)
        
        return project
    
    def _generate_dependencies(self, req: ParsedPythonRequirement) -> Dependencies:
        deps = Dependencies()
        
        # 根据场景添加依赖
        if req.scenario == PythonScenario.WEB_DEVELOPMENT:
            if req.framework == 'fastapi':
                deps.add('fastapi', '>=0.100.0')
                deps.add('uvicorn', '>=0.23.0')
                deps.add('pydantic', '>=2.0.0')
            elif req.framework == 'flask':
                deps.add('flask', '>=2.3.0')
                deps.add('flask-restful', '>=0.3.10')
        
        elif req.scenario == PythonScenario.DATA_ANALYSIS:
            deps.add('pandas', '>=2.0.0')
            deps.add('numpy', '>=1.24.0')
            deps.add('matplotlib', '>=3.7.0')
            deps.add('seaborn', '>=0.12.0')
        
        elif req.scenario == PythonScenario.MACHINE_LEARNING:
            deps.add('scikit-learn', '>=1.3.0')
            deps.add('pandas', '>=2.0.0')
            deps.add('numpy', '>=1.24.0')
            deps.add('joblib', '>=1.3.0')
        
        # 添加通用依赖
        deps.add('python-dotenv', '>=1.0.0')
        
        if req.async_required:
            deps.add('aiohttp', '>=3.8.0')
            deps.add('aiofiles', '>=23.0.0')
        
        return deps
```

#### 1.2.3 Optimizer 优化器

```python
class PythonOptimizer:
    """Python代码优化器"""
    
    def optimize(self, code: PythonCode) -> OptimizedCode:
        optimized = OptimizedCode()
        
        # 应用Pythonic优化
        optimized.code = self._apply_pythonic_patterns(code.code)
        
        # 添加类型注解
        optimized.code = self._add_type_hints(optimized.code)
        
        # 优化导入语句
        optimized.code = self._optimize_imports(optimized.code)
        
        # 异步代码优化
        if code.is_async:
            optimized.code = self._optimize_async_patterns(optimized.code)
        
        return optimized
    
    def _apply_pythonic_patterns(self, code: str) -> str:
        # 列表推导式优化
        code = self._convert_to_list_comprehension(code)
        
        # 生成器表达式优化
        code = self._convert_to_generator_expression(code)
        
        # 使用内置函数
        code = self._use_builtin_functions(code)
        
        # 海象运算符优化
        code = self._apply_walrus_operator(code)
        
        return code
```

## 2. 知识库设计

### 2.1 知识库结构

```
knowledge-base/
├── language/
│   ├── python38-features.json      # Python 3.8特性
│   ├── python39-features.json      # Python 3.9特性
│   ├── python310-features.json     # Python 3.10特性
│   ├── python311-features.json     # Python 3.11特性
│   ├── type-hints.json             # 类型提示
│   └── async-patterns.json         # 异步模式
├── frameworks/
│   ├── flask-patterns.json         # Flask模式
│   ├── fastapi-patterns.json       # FastAPI模式
│   ├── django-patterns.json        # Django模式
│   └── sqlalchemy-patterns.json    # SQLAlchemy模式
├── data-science/
│   ├── pandas-patterns.json        # Pandas模式
│   ├── numpy-patterns.json         # NumPy模式
│   ├── matplotlib-patterns.json    # 可视化模式
│   └── sklearn-patterns.json       # 机器学习模式
├── patterns/
│   ├── design-patterns.json        # 设计模式
│   ├── pythonic-patterns.json      # Pythonic模式
│   └── concurrency-patterns.json   # 并发模式
└── templates/
    ├── web-api-template.json       # Web API模板
│   ├── data-analysis-template.json # 数据分析模板
│   ├── ml-project-template.json    # ML项目模板
│   └── cli-tool-template.json      # CLI工具模板
```

### 2.2 模板系统

```python
class PythonTemplateEngine:
    """Python模板引擎"""
    
    def render_fastapi_project(self, context: TemplateContext) -> str:
        template = '''
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="{{project_name}}",
    description="{{project_description}}",
    version="{{version}}"
)

# 数据模型
{% for model in models %}
class {{model.name}}(BaseModel):
    {% for field in model.fields %}
    {{field.name}}: {{field.type}}{% if field.optional %} = None{% endif %}
    {% endfor %}
    
    class Config:
        from_attributes = True
{% endfor %}

# 依赖注入
{% for dependency in dependencies %}
{{dependency.code}}
{% endfor %}

# API端点
{% for endpoint in endpoints %}
@app.{{endpoint.method}}("{{endpoint.path}}")
async def {{endpoint.function_name}}({{endpoint.parameters}}):
    """
    {{endpoint.description}}
    """
    {{endpoint.implementation}}
{% endfor %}

if __name__ == "__main__":
    uvicorn.run(app, host="{{host}}", port={{port}})
'''
        return self._render(template, context)
```

## 3. 代码生成流程

### 3.1 生成流程图

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  用户输入 │────▶│ 需求解析  │────▶│ 架构设计  │────▶│ 代码生成  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                         ┌──────────────────────────────┘
                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  输出交付 │◀────│ 质量检查  │◀────│ 代码优化  │◀────│ 测试生成  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3.2 详细流程

```python
class PythonGenerationPipeline:
    """Python代码生成流程管道"""
    
    async def execute(self, request: GenerationRequest) -> GenerationResult:
        # 1. 需求解析
        requirement = self.parser.parse(request.user_input)
        
        # 2. 架构设计
        architecture = self.architecture_designer.design(requirement)
        
        # 3. 代码生成
        generated_code = self.generator.generate(requirement, architecture)
        
        # 4. 测试生成
        tests = self.test_generator.generate_tests(generated_code)
        
        # 5. 代码优化
        optimized_code = self.optimizer.optimize(generated_code)
        
        # 6. 质量检查
        quality_report = self.quality_checker.check(optimized_code)
        
        # 7. 组装输出
        return GenerationResult(
            code=optimized_code,
            tests=tests,
            architecture=architecture,
            quality_report=quality_report
        )
```

## 4. 架构模式库

### 4.1 项目结构模式

```python
# Web API项目结构
WEB_API_STRUCTURE = {
    'app/': {
        '__init__.py': '',
        'main.py': 'FastAPI应用入口',
        'config.py': '配置管理',
        'models/': {
            '__init__.py': '',
            'base.py': '基础模型',
        },
        'routers/': {
            '__init__.py': '',
            'api.py': 'API路由',
        },
        'services/': {
            '__init__.py': '',
            'base_service.py': '基础服务',
        },
        'utils/': {
            '__init__.py': '',
            'helpers.py': '工具函数',
        }
    },
    'tests/': {
        '__init__.py': '',
        'conftest.py': 'pytest配置',
        'test_api.py': 'API测试',
    },
    'requirements.txt': '依赖文件',
    'pyproject.toml': '项目配置',
}

# 数据分析项目结构
DATA_ANALYSIS_STRUCTURE = {
    'notebooks/': {
        'exploration.ipynb': '数据探索',
        'analysis.ipynb': '数据分析',
    },
    'src/': {
        '__init__.py': '',
        'data/': {
            'loaders.py': '数据加载',
            'cleaners.py': '数据清洗',
        },
        'analysis/': {
            'statistics.py': '统计分析',
            'visualization.py': '可视化',
        },
        'utils/': {
            'helpers.py': '工具函数',
        }
    },
    'data/': {
        'raw/': '原始数据',
        'processed/': '处理后数据',
    },
    'outputs/': {
        'figures/': '图表输出',
        'reports/': '报告输出',
    },
}
```

### 4.2 代码模式库

```python
# 异步上下文管理器模式
ASYNC_CONTEXT_MANAGER = '''
from contextlib import asynccontextmanager

@asynccontextmanager
async def managed_resource():
    """异步上下文管理器"""
    resource = await create_resource()
    try:
        yield resource
    finally:
        await resource.close()
'''

# 依赖注入模式
DEPENDENCY_INJECTION = '''
from typing import TypeVar, Generic

T = TypeVar('T')

class Container:
    """依赖注入容器"""
    
    def __init__(self):
        self._services = {}
    
    def register(self, interface: type, implementation: T):
        """注册服务"""
        self._services[interface] = implementation
    
    def resolve(self, interface: type) -> T:
        """解析服务"""
        return self._services.get(interface)
'''

# 单例模式
SINGLETON_PATTERN = '''
from functools import wraps

def singleton(cls):
    """单例装饰器"""
    instances = {}
    
    @wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    
    return get_instance

@singleton
class Database:
    """数据库单例"""
    def __init__(self):
        self.connection = None
'''
```

## 5. 数据模型

### 5.1 核心领域模型

```python
@dataclass
class GenerationRequest:
    """代码生成请求"""
    user_input: str
    python_version: str = "3.11"
    scenario: Optional[str] = None
    framework: Optional[str] = None
    async_required: bool = False

@dataclass
class ParsedPythonRequirement:
    """解析后的Python需求"""
    scenario: PythonScenario
    python_version: str
    framework: Optional[str]
    features: List[str]
    async_required: bool
    database_required: bool = False
    auth_required: bool = False

@dataclass
class PythonProject:
    """Python项目"""
    name: str
    structure: Dict[str, Any]
    source_files: List[PythonFile]
    test_files: List[PythonFile]
    config_files: List[ConfigFile]
    dependencies: Dependencies

@dataclass
class PythonFile:
    """Python文件"""
    path: str
    content: str
    imports: List[str]
    classes: List[str]
    functions: List[str]
```

## 6. 接口设计

### 6.1 外部接口

```python
class IPythonAgent:
    async def generate_project(self, request: GenerationRequest) -> PythonProject:
        """生成完整项目"""
        pass
    
    async def generate_script(self, description: str) -> str:
        """生成独立脚本"""
        pass
    
    async def suggest_improvements(self, code: str) -> List[Suggestion]:
        """代码改进建议"""
        pass
    
    async def explain_code(self, code: str) -> str:
        """解释代码"""
        pass
```

### 6.2 内部接口

```python
class ICodeGenerator:
    def generate(self, requirement: ParsedPythonRequirement) -> PythonCode:
        pass

class ICodeOptimizer:
    def optimize(self, code: PythonCode) -> OptimizedCode:
        pass

class IQualityChecker:
    def check(self, code: PythonCode) -> QualityReport:
        pass
```

## 7. 部署架构

### 7.1 本地部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  python-agent:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHON_ENV=production
      - PYTHON_VERSION=3.11
    volumes:
      - ./knowledge-base:/app/knowledge-base
      - ./templates:/app/templates
```

### 7.2 云服务部署

```python
# FastAPI部署
from fastapi import FastAPI

app = FastAPI()
agent = PythonAgent()

@app.post("/api/v1/generate-project")
async def generate_project(request: GenerationRequest):
    result = await agent.generate_project(request)
    return result

@app.post("/api/v1/generate-script")
async def generate_script(description: str):
    script = await agent.generate_script(description)
    return {"script": script}
```

## 8. 性能优化

### 8.1 代码生成优化

```python
class PerformanceOptimizer:
    def optimize_with_caching(self):
        # 缓存常用模板
        self.template_cache = {}
        
    def parallel_generation(self, modules: List[str]):
        # 并行生成多个模块
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(self.generate_module, m) for m in modules]
            return [f.result() for f in futures]
```

## 9. 安全设计

### 9.1 代码安全

```python
class SecurityAnalyzer:
    def analyze(self, code: str) -> SecurityReport:
        report = SecurityReport()
        
        # 检查SQL注入
        if self._contains_sql_injection_risk(code):
            report.add_issue(SecurityIssue.SQL_INJECTION)
        
        # 检查命令注入
        if self._contains_command_injection_risk(code):
            report.add_issue(SecurityIssue.COMMAND_INJECTION)
        
        # 检查不安全的反序列化
        if self._contains_unsafe_deserialization(code):
            report.add_issue(SecurityIssue.UNSAFE_DESERIALIZATION)
        
        return report
```

## 10. 扩展性设计

### 10.1 插件系统

```python
class PluginManager:
    def __init__(self):
        self.generators: List[ICodeGeneratorPlugin] = []
        self.optimizers: List[ICodeOptimizerPlugin] = []
    
    def register_generator_plugin(self, plugin: ICodeGeneratorPlugin):
        self.generators.append(plugin)
    
    def apply_generator_plugins(self, code: PythonCode) -> PythonCode:
        for plugin in self.generators:
            code = plugin.process(code)
        return code
```

## 11. 监控与日志

### 11.1 日志系统

```python
class AgentLogger:
    def __init__(self):
        self.logger = logging.getLogger('python-agent')
    
    def log_generation_start(self, request: GenerationRequest):
        self.logger.info(f"开始生成: {request.scenario}, Python {request.python_version}")
    
    def log_generation_complete(self, result: GenerationResult, duration: float):
        self.logger.info(f"生成完成: 质量评分 {result.quality_report.score}, 耗时 {duration:.2f}s")
```

## 12. 版本管理

### 12.1 Python版本兼容性

```python
class PythonVersionManager:
    def is_feature_compatible(self, feature: str, version: str) -> bool:
        feature_versions = {
            'walrus_operator': '3.8',
            'positional_only_params': '3.8',
            'f_string_debug': '3.8',
            'dict_merge': '3.9',
            'type_hinting_generics': '3.9',
            'pattern_matching': '3.10',
            'union_types': '3.10',
            'exception_groups': '3.11',
        }
        
        required_version = feature_versions.get(feature)
        if not required_version:
            return True
        
        return self._compare_versions(version, required_version) >= 0
```
