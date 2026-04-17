# 🏰 统一酒馆游戏 - 本地服务器启动指南

## 问题说明

如果你直接双击 `index.html` 打开游戏，会遇到以下错误：

```
Access to script at 'file:///...' has been blocked by CORS policy
Uncaught ReferenceError: UI is not defined
```

这是因为浏览器出于安全考虑，禁止从 `file://` 协议加载 ES6 模块。

## 解决方案：使用本地服务器

### 方法一：Windows 用户（推荐）

1. 双击运行 `start-server.bat` 文件
2. 服务器会自动启动并打开浏览器访问 `http://localhost:8080`
3. 现在游戏可以正常运行了！

### 方法二：Mac/Linux 用户

1. 在终端中运行：`bash start-server.sh`
2. 服务器会自动启动并打开浏览器访问 `http://localhost:8080`

### 方法三：手动启动 Python 服务器

如果你已安装 Python：

```bash
# Python 3
python -m http.server 8080

# 或 Python 2
python -m SimpleHTTPServer 8080
```

然后在浏览器访问：`http://localhost:8080`

### 方法四：手动启动 Node.js 服务器

如果你已安装 Node.js：

```bash
# 全局安装 http-server（只需安装一次）
npm install -g http-server

# 启动服务器
http-server -p 8080
```

然后在浏览器访问：`http://localhost:8080`

### 方法五：使用 VS Code Live Server 扩展

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"
4. 游戏会自动在浏览器中打开

## 如何停止服务器

在命令行窗口按 `Ctrl + C` 即可停止服务器。

## 为什么需要本地服务器？

ES6 模块系统（`import`/`export`）需要通过 HTTP 协议加载，而不能直接从文件系统加载。这是浏览器的安全限制。使用本地服务器可以模拟真实的 Web 环境，让你的游戏正常运行。

## 临时解决方案（不推荐）

如果你实在无法使用本地服务器，需要将所有 JS 文件改为非模块化格式（移除 `export`/`import`），但这会失去模块化的优势，不推荐这样做。

## 快速测试

启动服务器后，在浏览器中点击以下链接测试：

- 游戏大厅（默认）
- 地图探索
- 酒馆
- 战斗系统
- 等等...

祝游戏愉快！🎮
