# C# Agent - 架构设计文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           C# Agent 架构                                  │
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
│  │  Language   │    │   .NET      │    │   Pattern   │               │
│  │  Features   │    │  Ecosystem  │    │   Library   │               │
│  │  语言特性库  │    │  生态系统库  │    │   模式库     │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

#### 1.2.1 Parser 解析器
```csharp
public interface IRequirementParser
{
    ParsedRequirement Parse(string userInput);
}

public class CSharpRequirementParser : IRequirementParser
{
    public ParsedRequirement Parse(string userInput)
    {
        // 解析应用类型
        var appType = DetectAppType(userInput);
        
        // 解析.NET版本
        var dotnetVersion = DetectDotNetVersion(userInput);
        
        // 解析功能需求
        var features = ExtractFeatures(userInput);
        
        // 解析架构风格
        var architecture = DetectArchitecture(userInput);
        
        return new ParsedRequirement
        {
            AppType = appType,
            DotNetVersion = dotnetVersion,
            Features = features,
            Architecture = architecture
        };
    }
    
    private AppType DetectAppType(string input)
    {
        if (input.Contains("Web API") || input.Contains("API"))
            return AppType.WebApi;
        if (input.Contains("WPF") || input.Contains("桌面"))
            return AppType.Wpf;
        if (input.Contains("WinForms") || input.Contains("Windows窗体"))
            return AppType.WinForms;
        if (input.Contains("控制台") || input.Contains("CLI"))
            return AppType.Console;
        if (input.Contains("Blazor"))
            return AppType.Blazor;
        return AppType.WebApi; // 默认
    }
}
```

#### 1.2.2 Generator 生成器
```csharp
public interface ICodeGenerator
{
    GeneratedProject Generate(ParsedRequirement requirement);
}

public class CSharpCodeGenerator : ICodeGenerator
{
    private readonly ITemplateEngine _templateEngine;
    private readonly IArchitectureFactory _architectureFactory;
    
    public GeneratedProject Generate(ParsedRequirement requirement)
    {
        var project = new GeneratedProject();
        
        // 生成项目文件
        project.ProjectFile = GenerateProjectFile(requirement);
        
        // 生成Program.cs
        project.EntryPoint = GenerateEntryPoint(requirement);
        
        // 生成架构层
        project.Layers = _architectureFactory.CreateLayers(requirement);
        
        // 生成实体和DTO
        project.Models = GenerateModels(requirement);
        
        // 生成服务
        project.Services = GenerateServices(requirement);
        
        // 生成控制器/视图
        project.Controllers = GenerateControllers(requirement);
        
        return project;
    }
    
    private string GenerateProjectFile(ParsedRequirement req)
    {
        return $@"<Project Sdk=""Microsoft.NET.Sdk"">

  <PropertyGroup>
    <OutputType>{GetOutputType(req.AppType)}</OutputType>
    <TargetFramework>net{req.DotNetVersion}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    {GetPackageReferences(req)}
  </ItemGroup>

</Project>";
    }
}
```

#### 1.2.3 Optimizer 优化器
```csharp
public interface ICodeOptimizer
{
    OptimizedCode Optimize(GeneratedCode code);
}

public class CSharpOptimizer : ICodeOptimizer
{
    public OptimizedCode Optimize(GeneratedCode code)
    {
        var optimized = new OptimizedCode();
        
        // 应用C# 10/11/12新特性
        optimized.Code = ApplyModernFeatures(code.Code);
        
        // 优化异步模式
        optimized.Code = OptimizeAsyncPatterns(optimized.Code);
        
        // 优化LINQ查询
        optimized.Code = OptimizeLinqQueries(optimized.Code);
        
        // 优化内存使用
        optimized.Code = OptimizeMemoryUsage(optimized.Code);
        
        // 添加可空引用类型注解
        optimized.Code = AddNullableAnnotations(optimized.Code);
        
        return optimized;
    }
    
    private string ApplyModernFeatures(string code)
    {
        // 转换记录类型
        code = ConvertToRecords(code);
        
        // 使用模式匹配
        code = ApplyPatternMatching(code);
        
        // 使用原始字符串字面量
        code = UseRawStringLiterals(code);
        
        return code;
    }
}
```

## 2. 知识库设计

### 2.1 知识库结构

```
knowledge-base/
├── language/
│   ├── csharp-10-features.json      # C# 10特性
│   ├── csharp-11-features.json      # C# 11特性
│   ├── csharp-12-features.json      # C# 12特性
│   ├── async-patterns.json          # 异步模式
│   └── pattern-matching.json        # 模式匹配
├── dotnet/
│   ├── aspnet-core-patterns.json    # ASP.NET Core模式
│   ├── ef-core-patterns.json        # EF Core模式
│   ├── di-patterns.json             # 依赖注入模式
│   └── middleware-patterns.json     # 中间件模式
├── desktop/
│   ├── winforms-patterns.json       # WinForms模式
│   ├── wpf-patterns.json            # WPF模式
│   └── mvvm-patterns.json           # MVVM模式
├── architecture/
│   ├── clean-architecture.json      # 整洁架构
│   ├── ddd-patterns.json            # DDD模式
│   ├── microservices.json           # 微服务
│   └── layered-architecture.json    # 分层架构
└── templates/
    ├── webapi-template.json         # Web API模板
    ├── wpf-template.json            # WPF模板
    ├── console-template.json        # 控制台模板
    └── classlib-template.json       # 类库模板
```

### 2.2 模板系统

```csharp
public class TemplateEngine
{
    private readonly Dictionary<string, CodeTemplate> _templates;
    
    public string Render(string templateName, TemplateContext context)
    {
        var template = _templates[templateName];
        var result = template.Content;
        
        // 替换变量
        foreach (var variable in context.Variables)
        {
            result = result.Replace($"{{{{{variable.Key}}}}}", variable.Value);
        }
        
        // 处理条件块
        result = ProcessConditionals(result, context);
        
        // 处理循环
        result = ProcessLoops(result, context);
        
        return result;
    }
}

// Web API控制器模板示例
public const string WebApiControllerTemplate = @"
[ApiController]
[Route(""api/[controller]"")]
{{#if RequiresAuth}}
[Authorize]
{{/if}}
public class {{ControllerName}}Controller : ControllerBase
{
    private readonly I{{ServiceName}} _{{ServiceNameCamel}};
    private readonly ILogger<{{ControllerName}}Controller> _logger;
    
    public {{ControllerName}}Controller(
        I{{ServiceName}} {{ServiceNameCamel}},
        ILogger<{{ControllerName}}Controller> logger)
    {
        _{{ServiceNameCamel}} = {{ServiceNameCamel}};
        _logger = logger;
    }
    
    {{#each Actions}}
    [Http{{Method}}]
    {{#if Route}}
    [Route(""{{Route}}"")]
    {{/if}}
    public async Task<ActionResult<{{ReturnType}}>> {{Name}}({{Parameters}})
    {
        _logger.LogInformation(""执行 {{Name}}"");
        {{Body}}
    }
    {{/each}}
}";
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
│  输出结果 │◀────│ 质量检查  │◀────│ 代码优化  │◀────│ 测试生成  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3.2 详细流程

```csharp
public class CodeGenerationPipeline
{
    public async Task<GenerationResult> ExecuteAsync(GenerationRequest request)
    {
        // 1. 需求解析
        var requirement = await _parser.ParseAsync(request.UserInput);
        
        // 2. 架构设计
        var architecture = _architectureDesigner.Design(requirement);
        
        // 3. 代码生成
        var generatedCode = _generator.Generate(requirement, architecture);
        
        // 4. 测试生成
        var tests = _testGenerator.GenerateTests(generatedCode);
        
        // 5. 代码优化
        var optimizedCode = _optimizer.Optimize(generatedCode);
        
        // 6. 质量检查
        var qualityReport = _qualityChecker.Check(optimizedCode);
        
        // 7. 组装输出
        return new GenerationResult
        {
            Code = optimizedCode,
            Tests = tests,
            Architecture = architecture,
            QualityReport = qualityReport
        };
    }
}
```

## 4. 架构模式库

### 4.1 分层架构

```csharp
// 分层架构配置
public class LayeredArchitectureConfig
{
    public List<Layer> Layers { get; set; } = new()
    {
        new Layer
        {
            Name = "Presentation",
            Projects = new[] { "WebApi", "Wpf", "WinForms" },
            References = new[] { "Application" }
        },
        new Layer
        {
            Name = "Application",
            Projects = new[] { "Application" },
            References = new[] { "Domain" }
        },
        new Layer
        {
            Name = "Domain",
            Projects = new[] { "Domain" },
            References = Array.Empty<string>()
        },
        new Layer
        {
            Name = "Infrastructure",
            Projects = new[] { "Infrastructure", "Persistence" },
            References = new[] { "Domain", "Application" }
        }
    };
}
```

### 4.2 依赖注入配置

```csharp
public class DependencyInjectionConfig
{
    public void ConfigureServices(IServiceCollection services, AppType appType)
    {
        // 注册数据库上下文
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Default")));
        
        // 注册仓储
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        
        // 注册服务
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IOrderService, OrderService>();
        
        // 注册缓存
        services.AddSingleton<ICacheService, MemoryCacheService>();
        
        // 注册日志
        services.AddLogging(builder =>
        {
            builder.AddConsole();
            builder.AddDebug();
        });
        
        // 根据应用类型注册特定服务
        switch (appType)
        {
            case AppType.WebApi:
                ConfigureWebApiServices(services);
                break;
            case AppType.Wpf:
                ConfigureWpfServices(services);
                break;
        }
    }
}
```

## 5. 数据模型

### 5.1 核心领域模型

```csharp
// 代码生成请求
public class GenerationRequest
{
    public string UserInput { get; set; } = string.Empty;
    public GenerationOptions Options { get; set; } = new();
}

// 生成选项
public class GenerationOptions
{
    public string DotNetVersion { get; set; } = "8.0";
    public bool UseNullable { get; set; } = true;
    public bool UseImplicitUsings { get; set; } = true;
    public bool GenerateTests { get; set; } = true;
    public ArchitectureStyle Architecture { get; set; } = ArchitectureStyle.Layered;
}

// 解析后的需求
public class ParsedRequirement
{
    public AppType AppType { get; set; }
    public string DotNetVersion { get; set; } = "8.0";
    public List<FeatureRequirement> Features { get; set; } = new();
    public ArchitectureStyle Architecture { get; set; }
    public List<string> Entities { get; set; } = new();
}

// 生成的项目
public class GeneratedProject
{
    public string Name { get; set; } = string.Empty;
    public string ProjectFile { get; set; } = string.Empty;
    public string EntryPoint { get; set; } = string.Empty;
    public List<GeneratedFile> Files { get; set; } = new();
    public List<string> PackageReferences { get; set; } = new();
}

// 生成的文件
public class GeneratedFile
{
    public string Path { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public FileType Type { get; set; }
}
```

## 6. 接口设计

### 6.1 外部接口

```csharp
// Agent主接口
public interface ICSharpAgent
{
    Task<GenerationResult> GenerateProjectAsync(GenerationRequest request);
    Task<string> GenerateCodeSnippetAsync(string description);
    Task<ArchitectureSuggestion> SuggestArchitectureAsync(string requirements);
    Task<CodeReviewResult> ReviewCodeAsync(string code);
}

// 代码生成接口
public interface IProjectGenerator
{
    Task<GeneratedProject> GenerateAsync(ParsedRequirement requirement);
}

// 架构建议接口
public interface IArchitectureAdvisor
{
    Task<ArchitectureSuggestion> SuggestAsync(string requirements);
}
```

### 6.2 内部接口

```csharp
// 解析器接口
public interface IInputParser<TInput, TOutput>
{
    TOutput Parse(TInput input);
}

// 优化器接口
public interface ICodeOptimizer
{
    string Optimize(string code);
}

// 验证器接口
public interface ICodeValidator
{
    ValidationResult Validate(string code);
}
```

## 7. 部署架构

### 7.1 本地部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  csharp-agent:
    build: .
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - DOTNET_VERSION=8.0
    volumes:
      - ./knowledge-base:/app/knowledge-base
      - ./templates:/app/templates
```

### 7.2 云服务部署

```csharp
// Azure Functions部署
public class CSharpAgentFunction
{
    private readonly ICSharpAgent _agent;
    
    public CSharpAgentFunction(ICSharpAgent agent)
    {
        _agent = agent;
    }
    
    [FunctionName("GenerateProject")]
    public async Task<IActionResult> GenerateProject(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req)
    {
        var request = await req.ReadFromJsonAsync<GenerationRequest>();
        var result = await _agent.GenerateProjectAsync(request);
        return new OkObjectResult(result);
    }
}
```

## 8. 性能优化

### 8.1 代码生成优化

```csharp
public class PerformanceOptimizer
{
    // 缓存编译结果
    private readonly IMemoryCache _cache;
    
    public async Task<string> GenerateWithCache(string template, object model)
    {
        var cacheKey = ComputeHash(template, model);
        
        if (_cache.TryGetValue(cacheKey, out string? cached))
        {
            return cached!;
        }
        
        var result = await GenerateAsync(template, model);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(10));
        
        return result;
    }
    
    // 并行生成
    public async Task<GeneratedProject> GenerateParallelAsync(
        ParsedRequirement requirement)
    {
        var project = new GeneratedProject();
        
        var tasks = new List<Task>
        {
            Task.Run(() => project.Models = GenerateModels(requirement)),
            Task.Run(() => project.Services = GenerateServices(requirement)),
            Task.Run(() => project.Controllers = GenerateControllers(requirement)),
            Task.Run(() => project.Tests = GenerateTests(requirement))
        };
        
        await Task.WhenAll(tasks);
        
        return project;
    }
}
```

## 9. 安全设计

### 9.1 代码安全

```csharp
public class SecurityAnalyzer
{
    public SecurityReport Analyze(string code)
    {
        var report = new SecurityReport();
        
        // 检查SQL注入
        if (ContainsSqlInjectionRisk(code))
        {
            report.AddIssue(SecurityIssue.SqlInjection);
        }
        
        // 检查XSS漏洞
        if (ContainsXssRisk(code))
        {
            report.AddIssue(SecurityIssue.Xss);
        }
        
        // 检查敏感数据暴露
        if (ContainsSensitiveDataExposure(code))
        {
            report.AddIssue(SecurityIssue.SensitiveDataExposure);
        }
        
        return report;
    }
    
    private bool ContainsSqlInjectionRisk(string code)
    {
        // 检查字符串拼接SQL
        var riskyPatterns = new[]
        {
            @"\.Execute\s*\(\s*[^)]*\+",
            @"\.Query\s*\(\s*[^)]*\+",
            @"string\.Format\s*\(\s*[^)]*SELECT",
            @"\$""[^""]*SELECT[^""]*\{[^}]+\}"
        };
        
        return riskyPatterns.Any(p => Regex.IsMatch(code, p));
    }
}
```

## 10. 扩展性设计

### 10.1 插件系统

```csharp
public interface ICodeGenerationPlugin
{
    string Name { get; }
    bool CanHandle(AppType appType);
    Task<GeneratedFile> GenerateAsync(ParsedRequirement requirement);
}

public class PluginManager
{
    private readonly List<ICodeGenerationPlugin> _plugins = new();
    
    public void RegisterPlugin(ICodeGenerationPlugin plugin)
    {
        _plugins.Add(plugin);
    }
    
    public async Task<GeneratedFile?> ExecutePluginAsync(
        AppType appType, ParsedRequirement requirement)
    {
        var plugin = _plugins.FirstOrDefault(p => p.CanHandle(appType));
        
        if (plugin != null)
        {
            return await plugin.GenerateAsync(requirement);
        }
        
        return null;
    }
}
```

## 11. 监控与日志

### 11.1 日志系统

```csharp
public class AgentLogger
{
    private readonly ILogger<AgentLogger> _logger;
    
    public void LogGenerationStart(GenerationRequest request)
    {
        _logger.LogInformation(
            "开始代码生成: AppType={AppType}, Version={Version}",
            request.AppType,
            request.DotNetVersion);
    }
    
    public void LogGenerationComplete(GenerationResult result, TimeSpan duration)
    {
        _logger.LogInformation(
            "代码生成完成: Files={FileCount}, Duration={Duration}ms, Quality={Quality}",
            result.Files.Count,
            duration.TotalMilliseconds,
            result.QualityReport.Score);
    }
    
    public void LogError(Exception ex, string operation)
    {
        _logger.LogError(ex, "代码生成错误: {Operation}", operation);
    }
}
```

## 12. 版本管理

### 12.1 版本兼容性

```csharp
public class VersionManager
{
    public bool IsCompatible(string targetVersion, string feature)
    {
        var version = Version.Parse(targetVersion);
        
        return feature switch
        {
            "Records" => version >= new Version(9, 0),
            "GlobalUsings" => version >= new Version(10, 0),
            "RequiredMembers" => version >= new Version(11, 0),
            "PrimaryConstructors" => version >= new Version(12, 0),
            _ => false
        };
    }
    
    public string GetFeatureFallback(string feature, string targetVersion)
    {
        if (!IsCompatible(targetVersion, feature))
        {
            return feature switch
            {
                "Records" => "使用传统类+相等性实现",
                "GlobalUsings" => "在每个文件添加using语句",
                "RequiredMembers" => "使用构造函数验证",
                _ => feature
            };
        }
        
        return feature;
    }
}
```
