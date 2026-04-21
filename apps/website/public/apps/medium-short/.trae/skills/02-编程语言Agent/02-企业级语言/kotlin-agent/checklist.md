# Kotlin Agent - 检查清单

## 1. 开发前检查清单

### 1.1 需求理解
- [ ] 明确目标平台（Android/JVM/Multiplatform）
- [ ] 确定框架（Jetpack Compose/Ktor/Spring）
- [ ] 识别架构风格（MVVM/MVI/MVP）
- [ ] 确认协程使用场景
- [ ] 了解空安全要求
- [ ] 确定Kotlin版本（1.8/1.9/2.0）

### 1.2 环境准备
- [ ] JDK安装（17+）
- [ ] Kotlin安装
- [ ] IntelliJ IDEA/Android Studio配置
- [ ] Gradle配置
- [ ] Git初始化

### 1.3 项目初始化
- [ ] 创建Gradle项目
- [ ] 配置build.gradle.kts
- [ ] 添加Kotlin插件
- [ ] 配置依赖
- [ ] 设置.gitignore

## 2. 代码生成检查清单

### 2.1 Kotlin语言特性检查

#### 空安全
- [ ] 可空类型使用正确（String?）
- [ ] 非空类型使用正确（String）
- [ ] 安全调用运算符（?.）
- [ ] Elvis运算符（?:）
- [ ] 非空断言（!!）避免滥用
- [ ] let函数处理可空类型

#### 函数式特性
- [ ] 高阶函数使用
- [ ] Lambda表达式
- [ ] 扩展函数定义
- [ ] 作用域函数选择正确
  - [ ] let：转换结果
  - [ ] run：对象配置并返回结果
  - [ ] with：对象配置
  - [ ] apply：对象配置并返回自身
  - [ ] also：副作用操作

#### 类与对象
- [ ] 数据类（data class）使用
- [ ] 密封类（sealed class）使用
- [ ] 伴生对象（companion object）
- [ ] 对象声明（object）
- [ ] 接口默认实现

#### 协程
- [ ] suspend函数
- [ ] launch启动协程
- [ ] async/await
- [ ] withContext切换调度器
- [ ] Flow冷流使用
- [ ] 异常处理（try/catch或CoroutineExceptionHandler）

### 2.2 Android开发检查

#### Jetpack Compose
- [ ] @Composable函数
- [ ] remember状态管理
- [ ] mutableStateOf使用
- [ ] 副作用处理（LaunchedEffect/SideEffect）
- [ ] 主题配置

#### 架构组件
- [ ] ViewModel使用
- [ ] StateFlow/SharedFlow
- [ ] Hilt依赖注入
- [ ] Navigation组件
- [ ] Room数据库

### 2.3 后端开发检查

#### Ktor
- [ ] 路由定义
- [ ] 请求参数处理
- [ ] 响应序列化
- [ ] 异常处理
- [ ] 认证授权

#### 数据访问
- [ ] Exposed DSL
- [ ] 事务处理
- [ ] 连接池配置

## 3. 代码质量检查清单

### 3.1 代码风格
- [ ] 命名规范
  - [ ] 类名（PascalCase）
  - [ ] 函数/变量（camelCase）
  - [ ] 常量（UPPER_SNAKE_CASE）
- [ ] 缩进（4空格）
- [ ] 行长度（< 120字符）
- [ ] 导入组织

### 3.2 文档注释
- [ ] KDoc注释
- [ ] 类文档
- [ ] 函数文档
- [ ] 参数说明
- [ ] 返回值说明

### 3.3 错误处理
- [ ] Result类型使用
- [ ] runCatching使用
- [ ] 异常链保留
- [ ] 日志记录

## 4. 项目结构检查清单

### 4.1 标准项目结构
```
project/
├── src/
│   ├── main/
│   │   └── kotlin/
│   │       └── com/example/
│   │           ├── ui/              # UI层（Android）
│   │           ├── viewmodel/       # ViewModel
│   │           ├── repository/      # Repository
│   │           ├── model/           # 数据模型
│   │           ├── di/              # 依赖注入
│   │           └── util/            # 工具类
│   └── test/
│       └── kotlin/
├── build.gradle.kts
└── settings.gradle.kts
```

### 4.2 配置文件检查
- [ ] build.gradle.kts完整
- [ ] 依赖版本正确
- [ ] 插件配置正确
- [ ] .gitignore完整

## 5. 测试检查清单

### 5.1 单元测试
- [ ] JUnit 5配置
- [ ] MockK使用
- [ ] 协程测试（kotlinx-coroutines-test）
- [ ] Flow测试（Turbine）
- [ ] 覆盖率>80%

### 5.2 集成测试
- [ ] @SpringBootTest（后端）
- [ ] Hilt测试
- [ ] 数据库集成测试

## 6. 安全审查清单

### 6.1 输入验证
- [ ] 参数校验
- [ ] SQL注入防护
- [ ] XSS防护

### 6.2 认证授权
- [ ] JWT安全
- [ ] 权限控制

## 7. 性能优化检查清单

### 7.1 协程优化
- [ ] 调度器选择正确
  - [ ] Dispatchers.Main（UI）
  - [ ] Dispatchers.IO（IO操作）
  - [ ] Dispatchers.Default（CPU密集型）
- [ ] 避免阻塞主线程
- [ ] 协程作用域管理

### 7.2 内存优化
- [ ] 避免内存泄漏
- [ ] 资源及时释放
- [ ] 大对象优化

## 8. 部署检查清单

### 8.1 容器化
- [ ] Dockerfile编写
- [ ] 多阶段构建
- [ ] 镜像体积优化

### 8.2 配置管理
- [ ] 环境变量配置
- [ ] 配置文件分离

## 9. 文档检查清单

### 9.1 代码文档
- [ ] README.md完整
- [ ] 架构文档
- [ ] API文档

### 9.2 注释规范
- [ ] 复杂逻辑注释
- [ ] TODO标记

## 10. 最终审查清单

### 10.1 功能完整性
- [ ] 所有P0功能实现
- [ ] 用户场景覆盖
- [ ] 边界情况处理
- [ ] 错误处理完善

### 10.2 质量指标
- [ ] ktlint检查通过
- [ ] 测试全部通过
- [ ] 覆盖率达标
- [ ] 编译成功

### 10.3 交付物
- [ ] 源代码完整
- [ ] 测试套件
- [ ] 文档齐全
- [ ] 部署配置

## 11. 常用检查命令

```bash
# 编译检查
./gradlew compileKotlin

# 代码风格检查
./gradlew ktlintCheck

# 测试运行
./gradlew test

# 覆盖率检查
./gradlew jacocoTestReport

# 构建
./gradlew build
```
