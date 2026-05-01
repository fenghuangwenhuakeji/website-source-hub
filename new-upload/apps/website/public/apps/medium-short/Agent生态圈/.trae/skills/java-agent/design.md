# Java Agent - 架构设计文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Java Agent 架构                                 │
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
│  │    Java     │    │   Spring    │    │   Pattern   │               │
│  │  Language   │    │  Ecosystem  │    │   Library   │               │
│  │   语言特性库 │    │   Spring生态 │    │   模式库     │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

#### 1.2.1 Parser 解析器

```java
public class JavaRequirementParser {
    public ParsedJavaRequirement parse(String userInput) {
        // 解析应用场景
        ApplicationType appType = detectApplicationType(userInput);
        
        // 解析Java版本
        JavaVersion javaVersion = detectJavaVersion(userInput);
        
        // 解析框架选择
        Framework framework = detectFramework(userInput);
        
        // 解析架构风格
        ArchitectureStyle architecture = detectArchitecture(userInput);
        
        return new ParsedJavaRequirement(appType, javaVersion, framework, architecture);
    }
    
    private ApplicationType detectApplicationType(String input) {
        if (input.contains("Web") || input.contains("API") || input.contains("REST")) {
            return ApplicationType.WEB_API;
        }
        if (input.contains("microservice") || input.contains("微服务")) {
            return ApplicationType.MICROSERVICE;
        }
        if (input.contains("batch") || input.contains("批处理")) {
            return ApplicationType.BATCH;
        }
        return ApplicationType.WEB_API;
    }
    
    private JavaVersion detectJavaVersion(String input) {
        if (input.contains("Java 21") || input.contains("JDK 21")) {
            return JavaVersion.JAVA_21;
        }
        if (input.contains("Java 17") || input.contains("JDK 17")) {
            return JavaVersion.JAVA_17;
        }
        if (input.contains("Java 11") || input.contains("JDK 11")) {
            return JavaVersion.JAVA_11;
        }
        return JavaVersion.JAVA_8;
    }
}
```

#### 1.2.2 Generator 生成器

```java
public class JavaCodeGenerator {
    public JavaProject generate(ParsedJavaRequirement requirement) {
        JavaProject project = new JavaProject();
        
        // 生成项目结构
        project.setStructure(generateProjectStructure(requirement));
        
        // 生成构建配置
        project.setBuildConfig(generateBuildConfig(requirement));
        
        // 生成源代码
        project.setSourceFiles(generateSourceFiles(requirement));
        
        // 生成测试代码
        project.setTestFiles(generateTestFiles(requirement));
        
        // 生成配置文件
        project.setConfigFiles(generateConfigFiles(requirement));
        
        return project;
    }
    
    private BuildConfig generateBuildConfig(ParsedJavaRequirement req) {
        BuildConfig config = new BuildConfig();
        
        if (req.getBuildTool() == BuildTool.MAVEN) {
            config.setType(BuildTool.MAVEN);
            config.setContent(generatePomXml(req));
        } else {
            config.setType(BuildTool.GRADLE);
            config.setContent(generateBuildGradle(req));
        }
        
        return config;
    }
    
    private String generatePomXml(ParsedJavaRequirement req) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <project xmlns="http://maven.apache.org/POM/4.0.0"
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                                         http://maven.apache.org/xsd/maven-4.0.0.xsd">
                <modelVersion>4.0.0</modelVersion>
                <parent>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-parent</artifactId>
                    <version>3.2.0</version>
                </parent>
                <groupId>com.example</groupId>
                <artifactId>demo</artifactId>
                <version>1.0.0</version>
                <properties>
                    <java.version>%s</java.version>
                </properties>
                <dependencies>
                    <!-- Spring Boot Starters -->
                </dependencies>
            </project>
            """.formatted(req.getJavaVersion().getVersion());
    }
}
```

#### 1.2.3 Optimizer 优化器

```java
public class JavaOptimizer {
    public OptimizedCode optimize(JavaCode code) {
        OptimizedCode optimized = new OptimizedCode();
        
        // 应用Java 8+特性
        optimized.setCode(applyModernFeatures(code.getCode()));
        
        // 优化Stream API使用
        optimized.setCode(optimizeStreamOperations(optimized.getCode()));
        
        // 优化并发代码
        optimized.setCode(optimizeConcurrency(optimized.getCode()));
        
        // 添加适当的注解
        optimized.setCode(addAnnotations(optimized.getCode()));
        
        return optimized;
    }
    
    private String applyModernFeatures(String code) {
        // 转换匿名类为Lambda
        code = convertAnonymousToLambda(code);
        
        // 优化集合操作
        code = optimizeCollectionOperations(code);
        
        // 使用Optional
        code = useOptionalForNullChecks(code);
        
        // 使用新日期API
        code = useNewDateTimeAPI(code);
        
        return code;
    }
}
```

## 2. 知识库设计

### 2.1 知识库结构

```
knowledge-base/
├── language/
│   ├── java8-features.json          # Java 8特性
│   ├── java11-features.json         # Java 11特性
│   ├── java17-features.json         # Java 17特性
│   ├── java21-features.json         # Java 21特性
│   ├── generics.json                # 泛型
│   └── concurrency.json             # 并发编程
├── spring/
│   ├── spring-boot-patterns.json    # Spring Boot模式
│   ├── spring-mvc-patterns.json     # Spring MVC模式
│   ├── spring-data-patterns.json    # Spring Data模式
│   └── spring-security-patterns.json # Spring Security模式
├── microservices/
│   ├── service-discovery.json       # 服务发现
│   ├── api-gateway.json             # API网关
│   └── circuit-breaker.json         # 熔断器
├── data-access/
│   ├── jpa-patterns.json            # JPA模式
│   ├── mybatis-patterns.json        # MyBatis模式
│   └── jdbc-patterns.json           # JDBC模式
└── templates/
    ├── spring-boot-template.json    # Spring Boot模板
    ├── microservice-template.json   # 微服务模板
    └── batch-template.json          # 批处理模板
```

### 2.2 模板系统

```java
// Spring Boot控制器模板
public static final String CONTROLLER_TEMPLATE = """
    package {{packageName}}.controller;
    
    import org.springframework.web.bind.annotation.*;
    import org.springframework.http.ResponseEntity;
    import org.springframework.http.HttpStatus;
    import {{packageName}}.service.{{ServiceName}}Service;
    import {{packageName}}.dto.{{EntityName}}DTO;
    import java.util.List;
    
    @RestController
    @RequestMapping("/api/{{endpoint}}")
    public class {{ControllerName}}Controller {
        
        private final {{ServiceName}}Service {{serviceNameCamel}}Service;
        
        public {{ControllerName}}Controller({{ServiceName}}Service {{serviceNameCamel}}Service) {
            this.{{serviceNameCamel}}Service = {{serviceNameCamel}}Service;
        }
        
        @GetMapping
        public ResponseEntity<List<{{EntityName}}DTO>> getAll() {
            return ResponseEntity.ok({{serviceNameCamel}}Service.findAll());
        }
        
        @GetMapping("/{id}")
        public ResponseEntity<{{EntityName}}DTO> getById(@PathVariable Long id) {
            return {{serviceNameCamel}}Service.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        
        @PostMapping
        public ResponseEntity<{{EntityName}}DTO> create(@RequestBody @Valid {{EntityName}}DTO dto) {
            {{EntityName}}DTO created = {{serviceNameCamel}}Service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        }
        
        @PutMapping("/{id}")
        public ResponseEntity<{{EntityName}}DTO> update(@PathVariable Long id, 
                                                        @RequestBody @Valid {{EntityName}}DTO dto) {
            return ResponseEntity.ok({{serviceNameCamel}}Service.update(id, dto));
        }
        
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(@PathVariable Long id) {
            {{serviceNameCamel}}Service.delete(id);
            return ResponseEntity.noContent().build();
        }
    }
    """;
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

```java
public class JavaGenerationPipeline {
    public GenerationResult execute(GenerationRequest request) {
        // 1. 需求解析
        ParsedJavaRequirement requirement = parser.parse(request.getUserInput());
        
        // 2. 架构设计
        ArchitectureDesign architecture = architectureDesigner.design(requirement);
        
        // 3. 代码生成
        JavaProject generatedCode = generator.generate(requirement, architecture);
        
        // 4. 测试生成
        List<TestFile> tests = testGenerator.generateTests(generatedCode);
        
        // 5. 代码优化
        JavaProject optimizedCode = optimizer.optimize(generatedCode);
        
        // 6. 质量检查
        QualityReport qualityReport = qualityChecker.check(optimizedCode);
        
        // 7. 组装输出
        return new GenerationResult(optimizedCode, tests, architecture, qualityReport);
    }
}
```

## 4. 架构模式库

### 4.1 分层架构

```java
// 分层架构配置
public class LayeredArchitectureConfig {
    private List<Layer> layers = Arrays.asList(
        new Layer("Controller", "controller", Arrays.asList("Service")),
        new Layer("Service", "service", Arrays.asList("Repository", "Entity")),
        new Layer("Repository", "repository", Arrays.asList("Entity")),
        new Layer("Entity", "entity", Collections.emptyList())
    );
    
    public void validateDependencies() {
        // 验证层间依赖方向
    }
}
```

### 4.2 依赖注入配置

```java
@Configuration
public class ApplicationConfig {
    
    @Bean
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        return new HikariDataSource(config);
    }
    
    @Bean
    public JpaTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```

## 5. 数据模型

```java
// 代码生成请求
@Data
public class GenerationRequest {
    private String userInput;
    private JavaVersion javaVersion = JavaVersion.JAVA_17;
    private BuildTool buildTool = BuildTool.MAVEN;
}

// 解析后的需求
@Data
public class ParsedJavaRequirement {
    private ApplicationType applicationType;
    private JavaVersion javaVersion;
    private Framework framework;
    private ArchitectureStyle architecture;
    private List<String> features;
}

// Java项目
@Data
public class JavaProject {
    private String name;
    private ProjectStructure structure;
    private List<JavaFile> sourceFiles;
    private List<TestFile> testFiles;
    private BuildConfig buildConfig;
    private List<ConfigFile> configFiles;
}

// Java文件
@Data
public class JavaFile {
    private String packageName;
    private String className;
    private String content;
    private FileType type;
}
```

## 6. 接口设计

```java
// Agent主接口
public interface IJavaAgent {
    GenerationResult generateProject(GenerationRequest request);
    String generateCodeSnippet(String description);
    List<Suggestion> suggestImprovements(String code);
    ArchitectureSuggestion suggestArchitecture(String requirements);
}

// 代码生成接口
public interface ICodeGenerator {
    JavaProject generate(ParsedJavaRequirement requirement);
}

// 代码优化接口
public interface ICodeOptimizer {
    JavaProject optimize(JavaProject code);
}
```

## 7. 部署架构

```yaml
# docker-compose.yml
version: '3.8'
services:
  java-agent:
    build: .
    ports:
      - "8080:8080"
    environment:
      - JAVA_VERSION=17
      - SPRING_PROFILES_ACTIVE=production
    volumes:
      - ./knowledge-base:/app/knowledge-base
```

## 8. 性能优化

```java
public class PerformanceOptimizer {
    // 缓存编译结果
    private final Map<String, CompiledTemplate> templateCache = new ConcurrentHashMap<>();
    
    public String generateWithCache(String template, Map<String, Object> model) {
        return templateCache.computeIfAbsent(template, this::compileTemplate)
                           .render(model);
    }
    
    // 并行生成
    public JavaProject generateParallel(ParsedJavaRequirement requirement) {
        JavaProject project = new JavaProject();
        
        CompletableFuture<List<JavaFile>> controllers = CompletableFuture
            .supplyAsync(() -> generateControllers(requirement));
        CompletableFuture<List<JavaFile>> services = CompletableFuture
            .supplyAsync(() -> generateServices(requirement));
        CompletableFuture<List<JavaFile>> repositories = CompletableFuture
            .supplyAsync(() -> generateRepositories(requirement));
        
        CompletableFuture.allOf(controllers, services, repositories).join();
        
        project.setSourceFiles(new ArrayList<>());
        project.getSourceFiles().addAll(controllers.join());
        project.getSourceFiles().addAll(services.join());
        project.getSourceFiles().addAll(repositories.join());
        
        return project;
    }
}
```

## 9. 安全设计

```java
public class SecurityAnalyzer {
    public SecurityReport analyze(String code) {
        SecurityReport report = new SecurityReport();
        
        // 检查SQL注入
        if (containsSqlInjectionRisk(code)) {
            report.addIssue(SecurityIssue.SQL_INJECTION);
        }
        
        // 检查XSS漏洞
        if (containsXssRisk(code)) {
            report.addIssue(SecurityIssue.XSS);
        }
        
        // 检查敏感数据暴露
        if (containsSensitiveDataExposure(code)) {
            report.addIssue(SecurityIssue.SENSITIVE_DATA_EXPOSURE);
        }
        
        // 检查不安全的反序列化
        if (containsUnsafeDeserialization(code)) {
            report.addIssue(SecurityIssue.UNSAFE_DESERIALIZATION);
        }
        
        return report;
    }
}
```

## 10. 扩展性设计

```java
public class PluginManager {
    private final List<ICodeGenerationPlugin> plugins = new ArrayList<>();
    
    public void registerPlugin(ICodeGenerationPlugin plugin) {
        plugins.add(plugin);
    }
    
    public JavaProject applyPlugins(JavaProject project) {
        for (ICodeGenerationPlugin plugin : plugins) {
            project = plugin.process(project);
        }
        return project;
    }
}
```

## 11. 监控与日志

```java
@Slf4j
public class AgentLogger {
    public void logGenerationStart(GenerationRequest request) {
        log.info("开始代码生成: appType={}, javaVersion={}", 
                 request.getApplicationType(), request.getJavaVersion());
    }
    
    public void logGenerationComplete(GenerationResult result, Duration duration) {
        log.info("代码生成完成: files={}, duration={}ms, quality={}",
                 result.getProject().getSourceFiles().size(),
                 duration.toMillis(),
                 result.getQualityReport().getScore());
    }
}
```

## 12. 版本管理

```java
public class JavaVersionManager {
    public boolean isFeatureCompatible(String feature, JavaVersion version) {
        Map<String, JavaVersion> featureVersions = Map.of(
            "lambda", JavaVersion.JAVA_8,
            "stream_api", JavaVersion.JAVA_8,
            "optional", JavaVersion.JAVA_8,
            "new_http_client", JavaVersion.JAVA_11,
            "var", JavaVersion.JAVA_10,
            "sealed_classes", JavaVersion.JAVA_17,
            "pattern_matching", JavaVersion.JAVA_17,
            "virtual_threads", JavaVersion.JAVA_21
        );
        
        JavaVersion requiredVersion = featureVersions.get(feature);
        if (requiredVersion == null) return true;
        
        return version.ordinal() >= requiredVersion.ordinal();
    }
}
```
