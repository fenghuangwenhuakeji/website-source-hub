# Java Agent - 检查清单

## 1. 开发前检查清单

### 1.1 需求理解
- [ ] 明确应用场景（Web API/微服务/批处理）
- [ ] 确定Java版本（8/11/17/21）
- [ ] 选择框架（Spring Boot/Quarkus/Micronaut）
- [ ] 确定架构风格（单体/微服务）
- [ ] 识别数据库需求
- [ ] 确认安全需求
- [ ] 了解性能要求

### 1.2 环境准备
- [ ] JDK安装（目标版本）
- [ ] Maven/Gradle安装
- [ ] IDE配置（IntelliJ IDEA/Eclipse）
- [ ] 数据库安装
- [ ] Git初始化

### 1.3 项目初始化
- [ ] 创建Maven/Gradle项目
- [ ] 配置Spring Boot Parent
- [ ] 添加起步依赖
- [ ] 配置application.yml
- [ ] 配置.gitignore

## 2. 代码生成检查清单

### 2.1 Java语言特性检查

#### Java 8特性
- [ ] Lambda表达式使用
- [ ] Stream API操作
- [ ] Optional空值处理
- [ ] 新日期时间API
- [ ] 接口默认方法

#### Java 11+特性
- [ ] 新HTTP Client
- [ ] var类型推断
- [ ] 字符串增强方法

#### Java 17+特性
- [ ] 密封类（sealed）
- [ ] 模式匹配（instanceof）
- [ ] 记录类（record）

#### Java 21特性
- [ ] 虚拟线程（Virtual Threads）
- [ ] 序列集合

### 2.2 Spring Boot检查

#### 项目结构
- [ ] 分层架构正确
- [ ] 包命名规范
- [ ] 主类位置正确

#### 依赖注入
- [ ] 构造函数注入
- [ ] @Autowired使用恰当
- [ ] Bean生命周期管理

#### 配置管理
- [ ] application.yml配置
- [ ] Profile配置
- [ ] 环境变量使用

### 2.3 Spring MVC检查

#### RESTful API
- [ ] @RestController使用
- [ ] 请求映射正确
- [ ] HTTP方法恰当
- [ ] 状态码正确

#### 参数处理
- [ ] @RequestBody使用
- [ ] @PathVariable使用
- [ ] @RequestParam使用
- [ ] 参数校验（@Valid）

#### 异常处理
- [ ] @ControllerAdvice
- [ ] 全局异常处理
- [ ] 自定义异常

### 2.4 Spring Data检查

#### JPA实体
- [ ] @Entity注解
- [ ] @Id主键
- [ ] 关联关系正确
- [ ] 懒加载配置

#### Repository
- [ ] 接口继承正确
- [ ] 查询方法命名
- [ ] @Query使用
- [ ] 分页排序

### 2.5 Spring Security检查

#### 认证
- [ ] JWT配置
- [ ] 登录接口
- [ ] Token刷新

#### 授权
- [ ] 角色配置
- [ ] 权限注解
- [ ] 方法级安全

## 3. 代码质量检查清单

### 3.1 代码规范
- [ ] 遵循Google Java Style
- [ ] 命名规范
  - [ ] 类名（PascalCase）
  - [ ] 方法名（camelCase）
  - [ ] 常量（UPPER_SNAKE_CASE）
- [ ] 缩进（4空格）
- [ ] 行长度（< 120字符）

### 3.2 文档注释
- [ ] 类Javadoc
- [ ] 方法Javadoc
- [ ] 参数说明
- [ ] 返回值说明
- [ ] 异常说明

### 3.3 异常处理
- [ ] 自定义异常
- [ ] 异常链保留
- [ ] 日志记录
- [ ] 用户友好消息

## 4. 项目结构检查清单

### 4.1 标准项目结构
```
project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── entity/
│   │   │       ├── dto/
│   │   │       ├── config/
│   │   │       └── util/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── static/
│   └── test/
├── pom.xml
└── README.md
```

### 4.2 配置文件检查
- [ ] pom.xml/build.gradle完整
- [ ] application.yml配置正确
- [ ] 日志配置
- [ ] .gitignore完整

## 5. 测试检查清单

### 5.1 单元测试
- [ ] JUnit 5配置
- [ ] Mockito使用
- [ ] 测试覆盖率>80%
- [ ] 边界条件测试

### 5.2 集成测试
- [ ] @SpringBootTest
- [ ] 数据库集成
- [ ] API端点测试

## 6. 安全审查清单

### 6.1 输入验证
- [ ] SQL注入防护
- [ ] XSS防护
- [ ] CSRF防护
- [ ] 参数校验

### 6.2 认证授权
- [ ] JWT安全
- [ ] 密码加密
- [ ] 会话管理
- [ ] 权限控制

## 7. 性能优化检查清单

### 7.1 JVM优化
- [ ] 堆内存配置
- [ ] GC策略选择
- [ ] 启动参数优化

### 7.2 应用优化
- [ ] 缓存使用
- [ ] 连接池配置
- [ ] 异步处理
- [ ] 数据库优化

## 8. 部署检查清单

### 8.1 容器化
- [ ] Dockerfile编写
- [ ] 多阶段构建
- [ ] 镜像体积优化

### 8.2 Kubernetes
- [ ] Deployment配置
- [ ] Service配置
- [ ] ConfigMap/Secret

## 9. 文档检查清单

### 9.1 代码文档
- [ ] README.md完整
- [ ] API文档（OpenAPI）
- [ ] 架构文档
- [ ] 部署文档

### 9.2 注释规范
- [ ] 复杂逻辑注释
- [ ] TODO标记
- [ ] 配置说明

## 10. 最终审查清单

### 10.1 功能完整性
- [ ] 所有P0功能实现
- [ ] 用户场景覆盖
- [ ] 边界情况处理
- [ ] 错误处理完善

### 10.2 质量指标
- [ ] 代码规范检查通过
- [ ] 测试全部通过
- [ ] 覆盖率达标
- [ ] 安全扫描通过

### 10.3 交付物
- [ ] 源代码完整
- [ ] 测试套件
- [ ] 文档齐全
- [ ] 部署配置

## 11. 常用检查命令

```bash
# Maven构建
mvn clean compile

# 测试运行
mvn test

# 代码质量检查
mvn checkstyle:check
mvn spotbugs:check

# 测试覆盖率
mvn jacoco:report

# 打包
mvn clean package

# Docker构建
docker build -t myapp .
```
