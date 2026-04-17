#!/usr/bin/env node
/**
 * AI酒馆 RPG - Node.js 快速启动脚本
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;
const DIRECTORY = __dirname;

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // 启用CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 解析URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index_full.html';
    }

    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，尝试添加.html扩展名
                fs.readFile(filePath + '.html', (error2, content2) => {
                    if (error2) {
                        // 404错误
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 Not Found</h1>', 'utf-8');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content2, 'utf-8');
                    }
                });
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // 成功响应
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🎮 AI酒馆 RPG 游戏服务器');
    console.log('='.repeat(50));
    console.log(`📂 工作目录: ${DIRECTORY}`);
    console.log(`🌐 服务器地址: http://localhost:${PORT}`);
    console.log(`📄 游戏页面: http://localhost:${PORT}/index_full.html`);
    console.log('='.repeat(50));
    console.log('💡 提示: 按 Ctrl+C 停止服务器');
    console.log();

    // 自动打开浏览器
    const url = `http://localhost:${PORT}/index_full.html`;
    let command;
    const platform = process.platform;

    if (platform === 'darwin') {
        command = 'open';
    } else if (platform === 'win32') {
        command = 'start';
    } else {
        command = 'xdg-open';
    }

    exec(`${command} ${url}`, (error) => {
        if (error) {
            console.log('⚠️  无法自动打开浏览器，请手动访问上述地址');
        } else {
            console.log('✅ 已自动打开浏览器');
        }
    });

    console.log();
    console.log('🚀 服务器启动中...');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.log('');
        console.log(`❌ 错误: 端口 ${PORT} 已被占用`);
        console.log('请尝试:');
        console.log('  1. 关闭占用该端口的程序');
        console.log('  2. 或修改此脚本中的 PORT 变量');
    } else {
        console.log(`❌ 服务器错误: ${error}`);
    }
    process.exit(1);
});
