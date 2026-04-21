【如何修复 App is not defined / CORS 错误】

原因：
现代浏览器出于安全考虑，禁止直接双击 HTML 文件（file:// 协议）加载模块化的 JavaScript 代码。

解决方法：
请不要直接双击 index.html。
请双击运行本目录下的 "start_server.bat" 脚本。

该脚本会自动启动一个本地服务器（依赖 Python 或 Node.js），并自动打开浏览器访问，从而完美解决报错。