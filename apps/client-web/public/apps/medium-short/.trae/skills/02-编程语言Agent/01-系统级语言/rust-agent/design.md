# Rust Agent 架构设计文档

## 1. 架构概述

### 1.1 设计目标

Rust Agent 采用模块化、可扩展的架构设计，旨在提供高质量的 Rust 代码生成能力。架构设计遵循以下原则：

- **模块化**: 各功能模块职责清晰，便于维护和扩展
- **可扩展**: 支持新的代码模板和设计模式
- **类型安全**: 充分利用 Rust 的类型系统确保代码质量
- **性能优先**: 生成高性能、零成本抽象的代码

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rust Agent                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Parser     │  │  Generator   │  │  Optimizer   │          │
│  │   Module     │──│   Module     │──│   Module     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   Knowledge Base                      │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │      │
│  │  │ Templates│ │ Patterns │ │ Best Prac│ │  Crates  │ │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │      │
│  └──────────────────────────────────────────────────────┘      │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   Tester Module                       │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │      │
│  │  │  Unit    │ │ Integration│ │ Benchmark│             │      │
│  │  └──────────┘ └──────────┘ └──────────┘             │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 核心模块设计

### 2.1 需求解析模块 (RequirementParser)

#### 2.1.1 职责

- 解析用户自然语言输入
- 识别应用类型和技术栈
- 提取功能需求和约束条件

#### 2.1.2 数据结构

```rust
/// 解析后的 Rust 需求
#[derive(Debug, Clone)]
pub struct ParsedRustRequirement {
    /// 应用类型
    pub app_type: ApplicationType,
    /// Web 框架
    pub web_framework: Option<WebFramework>,
    /// 数据库类型
    pub database: Option<DatabaseType>,
    /// 所需功能列表
    pub features: Vec<Feature>,
    /// 认证方式
    pub auth_type: Option<AuthType>,
    /// 项目元数据
    pub metadata: ProjectMetadata,
}

/// 应用类型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApplicationType {
    WebApi,           // Web API 服务
    CliTool,          // 命令行工具
    Library,          // 库 crate
    Binary,           // 二进制程序
    Embedded,         // 嵌入式应用
    WebAssembly,      // WebAssembly
}

/// Web 框架
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WebFramework {
    Axum,
    ActixWeb,
    Tide,
    Rocket,
}

/// 数据库类型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DatabaseType {
    PostgreSQL,
    MySQL,
    SQLite,
    MongoDB,
    Redis,
}

/// 功能特性
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Feature {
    Authentication,   // 认证
    Authorization,    // 授权
    Caching,          // 缓存
    Logging,          // 日志
    Metrics,          // 指标
    Validation,       // 验证
    Migration,        // 数据库迁移
}
```

#### 2.1.3 核心方法

```rust
impl RequirementParser {
    /// 解析用户输入
    pub fn parse(&self, input: &str) -> Result<ParsedRustRequirement, ParseError> {
        let app_type = self.detect_app_type(input);
        let framework = self.detect_web_framework(input);
        let database = self.detect_database(input);
        let features = self.extract_features(input);
        let auth_type = self.detect_auth_type(input);
        
        Ok(ParsedRustRequirement {
            app_type,
            web_framework: framework,
            database,
            features,
            auth_type,
            metadata: self.extract_metadata(input),
        })
    }

    /// 检测应用类型
    fn detect_app_type(&self, input: &str) -> ApplicationType {
        let input_lower = input.to_lowercase();
        
        if input_lower.contains("cli") || input_lower.contains("命令行") {
            ApplicationType::CliTool
        } else if input_lower.contains("web") || input_lower.contains("api") {
            ApplicationType::WebApi
        } else if input_lower.contains("library") || input_lower.contains("库") {
            ApplicationType::Library
        } else if input_lower.contains("embedded") || input_lower.contains("嵌入式") {
            ApplicationType::Embedded
        } else if input_lower.contains("wasm") || input_lower.contains("webassembly") {
            ApplicationType::WebAssembly
        } else {
            ApplicationType::Binary
        }
    }

    /// 检测 Web 框架
    fn detect_web_framework(&self, input: &str) -> Option<WebFramework> {
        let input_lower = input.to_lowercase();
        
        if input_lower.contains("axum") {
            Some(WebFramework::Axum)
        } else if input_lower.contains("actix") {
            Some(WebFramework::ActixWeb)
        } else if input_lower.contains("tide") {
            Some(WebFramework::Tide)
        } else if input_lower.contains("rocket") {
            Some(WebFramework::Rocket)
        } else {
            None
        }
    }
}
```

### 2.2 代码生成模块 (CodeGenerator)

#### 2.2.1 职责

- 生成项目结构和配置文件
- 生成领域模型和业务逻辑
- 生成数据访问层和 API 处理器
- 生成错误处理和中间件

#### 2.2.2 代码模板系统

```rust
/// 代码模板管理器
pub struct TemplateManager {
    templates: HashMap<String, String>,
}

impl TemplateManager {
    /// Axum 主文件模板
    const AXUM_MAIN_TEMPLATE: &'static str = r#"
use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    config::Config,
    handler::*,
    middleware::auth,
    service::{{ServiceName}},
    state::AppState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 加载配置
    let config = Config::from_env()?;

    // 初始化服务
    let service = Arc::new({{ServiceName}}::new(&config).await?);

    // 应用状态
    let state = AppState {
        service,
        config: config.clone(),
    };

    // 构建路由
    let app = Router::new()
        {{routes}}
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive())
                {{auth_middleware}}
        )
        .with_state(state);

    // 启动服务器
    let addr: SocketAddr = config.server_addr.parse()?;
    let listener = TcpListener::bind(&addr).await?;
    
    tracing::info!("Server listening on {}", addr);
    
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("shutdown signal received, starting graceful shutdown");
}
"#;

    /// 错误类型模板
    const ERROR_TEMPLATE: &'static str = r#"
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

/// 应用错误类型
#[derive(Error, Debug)]
pub enum Error {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            Error::NotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            Error::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            Error::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            Error::Forbidden => (StatusCode::FORBIDDEN, self.to_string()),
            Error::Database(_) | Error::Internal(_) => {
                tracing::error!("Internal error: {}", self);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
            _ => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
        };

        let body = Json(json!({
            "error": error_message,
            "status": status.as_u16(),
        }));

        (status, body).into_response()
    }
}
"#;

    /// 领域模型模板
    const DOMAIN_TEMPLATE: &'static str = r#"
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// {{EntityName}} 实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct {{EntityName}} {
    pub id: Uuid,
    {{fields}}
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// {{EntityName}} 状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum {{EntityName}}Status {
    Active,
    Inactive,
}

impl {{EntityName}} {
    /// 创建新的 {{EntityName}}
    pub fn new({{constructor_params}}) -> Self {
        Self {
            id: Uuid::new_v4(),
            {{field_inits}}
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    /// 检查是否活跃
    pub fn is_active(&self) -> bool {
        matches!(self.status, {{EntityName}}Status::Active)
    }
}
"#;
}
```

#### 2.2.3 代码生成器

```rust
/// 代码生成器
pub struct CodeGenerator {
    template_manager: TemplateManager,
    knowledge_base: Arc<KnowledgeBase>,
}

impl CodeGenerator {
    /// 生成完整项目
    pub async fn generate_project(
        &self,
        requirement: &ParsedRustRequirement,
    ) -> Result<GeneratedProject, GenerationError> {
        let mut project = GeneratedProject::new(&requirement.metadata.name);
        
        // 生成配置文件
        project.add_file("Cargo.toml", self.generate_cargo_toml(requirement)?);
        project.add_file(".env", self.generate_env_file(requirement)?);
        
        // 生成源代码
        project.add_file("src/main.rs", self.generate_main_file(requirement)?);
        project.add_file("src/lib.rs", self.generate_lib_file(requirement)?);
        project.add_file("src/config.rs", self.generate_config_file(requirement)?);
        project.add_file("src/error.rs", self.generate_error_file(requirement)?);
        project.add_file("src/state.rs", self.generate_state_file(requirement)?);
        
        // 生成模块
        project.add_file("src/domain/mod.rs", self.generate_domain_module(requirement)?);
        project.add_file("src/service/mod.rs", self.generate_service_module(requirement)?);
        project.add_file("src/handler/mod.rs", self.generate_handler_module(requirement)?);
        project.add_file("src/repository/mod.rs", self.generate_repository_module(requirement)?);
        project.add_file("src/middleware/mod.rs", self.generate_middleware_module(requirement)?);
        
        // 生成测试
        project.add_file("tests/integration_test.rs", self.generate_integration_tests(requirement)?);
        
        Ok(project)
    }

    /// 生成 Cargo.toml
    fn generate_cargo_toml(&self, req: &ParsedRustRequirement) -> Result<String, GenerationError> {
        let mut dependencies = vec![
            ("tokio", r#"{ version = "1", features = ["full"] }"#),
            ("serde", r#"{ version = "1", features = ["derive"] }"#),
            ("serde_json", "1"),
            ("thiserror", "1"),
            ("anyhow", "1"),
            ("tracing", "0.1"),
            ("tracing-subscriber", r#"{ version = "0.3", features = ["env-filter"] }"#),
            ("chrono", r#"{ version = "0.4", features = ["serde"] }"#),
            ("uuid", r#"{ version = "1", features = ["v4", "serde"] }"#),
            ("config", "0.14"),
            ("dotenvy", "0.15"),
        ];
        
        // 根据需求添加依赖
        if let Some(framework) = &req.web_framework {
            match framework {
                WebFramework::Axum => dependencies.push(("axum", "0.7")),
                WebFramework::ActixWeb => dependencies.push(("actix-web", "4")),
                WebFramework::Tide => dependencies.push(("tide", "0.16")),
                WebFramework::Rocket => dependencies.push(("rocket", "0.5")),
            }
            dependencies.push(("tower", "0.4"));
            dependencies.push(("tower-http", r#"{ version = "0.5", features = ["cors", "trace"] }"#));
        }
        
        if let Some(db) = &req.database {
            match db {
                DatabaseType::PostgreSQL => {
                    dependencies.push(("sqlx", r#"{ version = "0.7", features = ["runtime-tokio", "postgres"] }"#));
                }
                DatabaseType::MySQL => {
                    dependencies.push(("sqlx", r#"{ version = "0.7", features = ["runtime-tokio", "mysql"] }"#));
                }
                DatabaseType::SQLite => {
                    dependencies.push(("sqlx", r#"{ version = "0.7", features = ["runtime-tokio", "sqlite"] }"#));
                }
                _ => {}
            }
        }
        
        if req.features.contains(&Feature::Authentication) {
            dependencies.push(("jsonwebtoken", "9"));
            dependencies.push(("argon2", "0.5"));
        }
        
        if req.features.contains(&Feature::Validation) {
            dependencies.push(("validator", r#"{ version = "0.16", features = ["derive"] }"#));
        }
        
        // 构建 Cargo.toml 内容
        let deps_str = dependencies
            .iter()
            .map(|(name, version)| format!("{} = {}", name, version))
            .collect::<Vec<_>>()
            .join("\n");
        
        Ok(format!(r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"
rust-version = "1.70"

[dependencies]
{}

[dev-dependencies]
tokio-test = "0.4"
"#, req.metadata.name, deps_str))
    }
}
```

### 2.3 知识库模块 (KnowledgeBase)

#### 2.3.1 职责

- 存储和管理代码模板
- 维护设计模式库
- 记录最佳实践

#### 2.3.2 设计模式库

```rust
/// 设计模式库
pub struct PatternLibrary {
    patterns: HashMap<String, Box<dyn Pattern>>,
}

impl PatternLibrary {
    pub fn new() -> Self {
        let mut patterns: HashMap<String, Box<dyn Pattern>> = HashMap::new();
        
        // 类型状态模式
        patterns.insert(
            "type_state".to_string(),
            Box::new(TypeStatePattern),
        );
        
        // 构建器模式
        patterns.insert(
            "builder".to_string(),
            Box::new(BuilderPattern),
        );
        
        // 访问者模式
        patterns.insert(
            "visitor".to_string(),
            Box::new(VisitorPattern),
        );
        
        // 策略模式
        patterns.insert(
            "strategy".to_string(),
            Box::new(StrategyPattern),
        );
        
        Self { patterns }
    }
}

/// 类型状态模式实现
pub struct TypeStatePattern;

impl Pattern for TypeStatePattern {
    fn generate(&self, params: &PatternParams) -> String {
        format!(r#"
/// 使用类型状态模式确保编译时安全
pub struct Connection<State> {{
    state: State,
}}

/// 未连接状态
pub struct Disconnected;

/// 已连接状态
pub struct Connected {{
    stream: TcpStream,
}}

impl Connection<Disconnected> {{
    pub fn new() -> Self {{
        Self {{ state: Disconnected }}
    }}

    pub fn connect(self, addr: &str) -> Result<Connection<Connected>, Error> {{
        let stream = TcpStream::connect(addr)?;
        Ok(Connection {{ state: Connected {{ stream }} }})
    }}
}}

impl Connection<Connected> {{
    pub fn send(&mut self, data: &[u8]) -> Result<(), Error> {{
        self.state.stream.write_all(data)?;
        Ok(())
    }}

    pub fn disconnect(self) -> Connection<Disconnected> {{
        Connection {{ state: Disconnected }}
    }}
}}
"#)
    }
}

/// 构建器模式实现
pub struct BuilderPattern;

impl Pattern for BuilderPattern {
    fn generate(&self, params: &PatternParams) -> String {
        format!(r#"
/// 构建器模式实现
pub struct {name}Builder {{
    {fields}
}}

impl {name}Builder {{
    pub fn new() -> Self {{
        Self {{
            {default_fields}
        }}
    }}

    {setters}

    pub fn build(self) -> Result<{name}, BuilderError> {{
        {validation}
        
        Ok({name} {{
            {field_assignments}
        }})
    }}
}}

impl Default for {name}Builder {{
    fn default() -> Self {{
        Self::new()
    }}
}}
"#, name = params.struct_name,
   fields = params.fields.iter().map(|f| format!("{}: Option<{}>,", f.name, f.ty)).collect::<Vec<_>>().join("\n    "),
   default_fields = params.fields.iter().map(|f| format!("{}: None,", f.name)).collect::<Vec<_>>().join("\n            "),
   setters = params.fields.iter().map(|f| format!(
       "pub fn {}(mut self, {}: {}) -> Self {{\n        self.{} = Some({});\n        self\n    }}",
       f.name, f.name, f.ty, f.name, f.name
   )).collect::<Vec<_>>().join("\n\n    "),
   validation = params.validation_code,
   field_assignments = params.fields.iter().map(|f| format!("{}: self.{}.unwrap(),", f.name, f.name)).collect::<Vec<_>>().join("\n            "))
    }
}
```

### 2.4 优化模块 (Optimizer)

#### 2.4.1 职责

- 代码审查和优化建议
- 性能分析
- 内存安全检查

#### 2.4.2 代码审查器

```rust
/// 代码审查器
pub struct CodeReviewer {
    rules: Vec<Box<dyn ReviewRule>>,
}

impl CodeReviewer {
    pub fn new() -> Self {
        let rules: Vec<Box<dyn ReviewRule>> = vec![
            Box::new(OwnershipRule),
            Box::new(LifetimeRule),
            Box::new(ErrorHandlingRule),
            Box::new(AsyncRule),
            Box::new(PerformanceRule),
        ];
        
        Self { rules }
    }

    pub fn review(&self, code: &str) -> Vec<ReviewIssue> {
        let mut issues = Vec::new();
        
        for rule in &self.rules {
            issues.extend(rule.check(code));
        }
        
        issues
    }
}

/// 所有权检查规则
pub struct OwnershipRule;

impl ReviewRule for OwnershipRule {
    fn check(&self, code: &str) -> Vec<ReviewIssue> {
        let mut issues = Vec::new();
        
        // 检查不必要的 clone
        if code.contains(".clone()") && !code.contains("// TODO") {
            issues.push(ReviewIssue {
                severity: Severity::Warning,
                message: "Consider using references instead of cloning".to_string(),
                line: None,
                suggestion: Some("Use &T instead of T.clone() where possible".to_string()),
            });
        }
        
        // 检查可能的内存泄漏
        if code.contains("std::mem::forget") {
            issues.push(ReviewIssue {
                severity: Severity::Warning,
                message: "Using std::mem::forget can cause memory leaks".to_string(),
                line: None,
                suggestion: Some("Consider using ManuallyDrop or restructuring the code".to_string()),
            });
        }
        
        issues
    }
}

/// 异步代码检查规则
pub struct AsyncRule;

impl ReviewRule for AsyncRule {
    fn check(&self, code: &str) -> Vec<ReviewIssue> {
        let mut issues = Vec::new();
        
        // 检查阻塞操作
        if code.contains("std::thread::sleep") {
            issues.push(ReviewIssue {
                severity: Severity::Error,
                message: "Blocking sleep in async context".to_string(),
                line: None,
                suggestion: Some("Use tokio::time::sleep instead".to_string()),
            });
        }
        
        // 检查未使用 await
        if code.contains("async fn") && code.contains(".await") == false {
            issues.push(ReviewIssue {
                severity: Severity::Warning,
                message: "Async function may be missing .await calls".to_string(),
                line: None,
                suggestion: None,
            });
        }
        
        issues
    }
}
```

### 2.5 测试模块 (Tester)

#### 2.5.1 职责

- 生成单元测试
- 生成集成测试
- 生成基准测试

#### 2.5.2 测试生成器

```rust
/// 测试生成器
pub struct TestGenerator;

impl TestGenerator {
    /// 为函数生成单元测试
    pub fn generate_unit_test(&self, function: &Function) -> String {
        let test_name = format!("test_{}", function.name);
        let params = function.params.iter()
            .map(|p| self.generate_test_value(&p.ty))
            .collect::<Vec<_>>()
            .join(", ");
        
        if function.is_async {
            format!(r#"
#[tokio::test]
async fn {}() {{
    // Arrange
    {}

    // Act
    let result = {}({}).await;

    // Assert
    assert!(result.is_ok());
}}
"#, test_name, self.generate_arrange_code(function), function.name, params)
        } else {
            format!(r#"
#[test]
fn {}() {{
    // Arrange
    {}

    // Act
    let result = {}({});

    // Assert
    assert!(result.is_ok());
}}
"#, test_name, self.generate_arrange_code(function), function.name, params)
        }
    }

    /// 生成集成测试
    pub fn generate_integration_test(&self, requirement: &ParsedRustRequirement) -> String {
        format!(r#"
use axum::{{
    body::Body,
    http::{{Request, StatusCode}},
}};
use tower::ServiceExt;

use {app_name}::create_app;

#[tokio::test]
async fn test_health_endpoint() {{
    let app = create_app().await;
    
    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}}

#[tokio::test]
async fn test_{entity}_crud() {{
    let app = create_app().await;
    
    // Test create
    let create_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/{entities}")
                .header("content-type", "application/json")
                .body(Body::from(r#"{create_json}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(create_response.status(), StatusCode::CREATED);
}}
"#, app_name = requirement.metadata.name,
   entity = requirement.metadata.main_entity.to_lowercase(),
   entities = requirement.metadata.main_entity.to_lowercase() + "s",
   create_json = self.generate_create_json(&requirement.entities))
    }

    /// 生成基准测试
    pub fn generate_benchmark(&self, function: &Function) -> String {
        format!(r#"
use criterion::{{black_box, criterion_group, criterion_main, Criterion}};

fn benchmark_{name}(c: &mut Criterion) {{
    c.bench_function("{name}", |b| {{
        b.iter(|| {{
            {name}(black_box({params}))
        }})
    }});
}}

criterion_group!(benches, benchmark_{name});
criterion_main!(benches);
"#, name = function.name, params = self.generate_benchmark_params(function))
    }
}
```

## 3. 数据流设计

### 3.1 代码生成流程

```
用户输入
    │
    ▼
┌─────────────────┐
│  Parser Module  │ ──→ ParsedRustRequirement
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Knowledge     │ ──→ 查询模板和模式
│     Base        │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Generator     │ ──→ GeneratedProject
│    Module       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Optimizer     │ ──→ 优化建议和修复
│    Module       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│    Tester       │ ──→ 生成测试代码
│    Module       │
└─────────────────┘
    │
    ▼
输出项目代码
```

## 4. 扩展点设计

### 4.1 模板扩展

```rust
/// 模板扩展接口
pub trait TemplateExtension {
    fn name(&self) -> &str;
    fn template(&self) -> &str;
    fn parameters(&self) -> Vec<TemplateParam>;
}

/// 自定义模板注册
pub struct TemplateRegistry {
    extensions: Vec<Box<dyn TemplateExtension>>,
}

impl TemplateRegistry {
    pub fn register(&mut self, extension: Box<dyn TemplateExtension>) {
        self.extensions.push(extension);
    }
}
```

### 4.2 规则扩展

```rust
/// 自定义审查规则
pub trait ReviewRule {
    fn name(&self) -> &str;
    fn check(&self, code: &str) -> Vec<ReviewIssue>;
}

/// 规则注册
pub struct RuleRegistry {
    rules: Vec<Box<dyn ReviewRule>>,
}
```

## 5. 错误处理设计

### 5.1 错误类型

```rust
/// Agent 错误类型
#[derive(Error, Debug)]
pub enum AgentError {
    #[error("Parse error: {0}")]
    Parse(String),
    
    #[error("Generation error: {0}")]
    Generation(String),
    
    #[error("Template error: {0}")]
    Template(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type AgentResult<T> = Result<T, AgentError>;
```

## 6. 配置设计

### 6.1 Agent 配置

```rust
/// Agent 配置
#[derive(Debug, Clone, Deserialize)]
pub struct AgentConfig {
    /// 代码生成风格
    pub code_style: CodeStyle,
    /// 是否生成测试
    pub generate_tests: bool,
    /// 是否生成文档
    pub generate_docs: bool,
    /// 异步运行时
    pub async_runtime: AsyncRuntime,
    /// 错误处理库
    pub error_handling: ErrorHandlingLib,
    /// 日志级别
    pub log_level: String,
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub enum CodeStyle {
    Idiomatic,    // 地道 Rust 风格
    Functional,   // 函数式风格
    Imperative,   // 命令式风格
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub enum AsyncRuntime {
    Tokio,
    AsyncStd,
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub enum ErrorHandlingLib {
    ThisError,
    Anyhow,
}
```
