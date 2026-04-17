#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一酒馆游戏 - 本地服务器启动脚本
"""
import os
import sys
import webbrowser
import http.server
import socketserver
from pathlib import Path

# 设置控制台编码为UTF-8
if sys.platform == "win32":
    try:
        os.system("chcp 65001 >nul")
    except:
        pass

def safe_print(text):
    """安全打印，避免编码错误"""
    try:
        print(text)
    except UnicodeEncodeError:
        # 如果UTF-8失败，尝试GBK编码
        try:
            print(text.encode('gbk', errors='ignore').decode('gbk'))
        except:
            print(text.encode('ascii', errors='ignore').decode('ascii'))

def start_server():
    """启动本地HTTP服务器"""
    safe_print("=" * 40)
    safe_print("[酒馆] 统一酒馆游戏 - 本地服务器")
    safe_print("=" * 40)
    safe_print("")
    safe_print("正在启动本地服务器...")
    safe_print("浏览器将自动打开 http://localhost:8086")
    safe_print("")
    safe_print("按 Ctrl+C 可以停止服务器")
    safe_print("=" * 40)
    safe_print("")

    # 获取当前脚本所在目录
    current_dir = Path(__file__).parent.resolve()
    
    # 切换到项目目录
    os.chdir(current_dir)

    PORT = 8080
    
    class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        """自定义请求处理器，减少控制台输出"""
        def log_message(self, format, *args):
            # 只记录基本请求信息
            print(f"[请求] {self.address_string()} - {self.path}")

    try:
        with socketserver.TCPServer(("", PORT), QuietHTTPRequestHandler) as httpd:
            safe_print(f"[OK] 服务器已启动在端口 {PORT}")
            safe_print(f"[DIR] 工作目录: {current_dir}")
            safe_print("")
            
            # 延迟2秒后打开浏览器
            import threading
            
            def open_browser():
                import time
                time.sleep(2)
                webbrowser.open(f"http://localhost:{PORT}")
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            safe_print("服务器运行中，按 Ctrl+C 停止...")
            safe_print("")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        safe_print("\n\n[STOP] 服务器已停止")
    except OSError as e:
        if e.errno == 10048:  # 端口已被占用
            safe_print(f"[ERROR] 端口 {PORT} 已被占用")
            safe_print("请关闭其他使用该端口的程序，或修改端口号")
        else:
            safe_print(f"[ERROR] {e}")
        sys.exit(1)
    except Exception as e:
        safe_print(f"[ERROR] 未知错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # 检查Python版本
    if sys.version_info < (3, 6):
        print("❌ 需要 Python 3.6 或更高版本")
        sys.exit(1)
    
    start_server()
