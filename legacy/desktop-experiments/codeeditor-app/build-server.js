const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, '..', '待打包', 'CodeEditor', 'server');
const outputDir = path.join(__dirname, 'server-dist');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 复制 package.json 到输出目录（用于获取依赖信息）
const sourcePackageJson = path.join(__dirname, '..', '待打包', 'CodeEditor', 'package.json');
const targetPackageJson = path.join(outputDir, 'package.json');
if (fs.existsSync(sourcePackageJson)) {
  fs.copyFileSync(sourcePackageJson, targetPackageJson);
}

// 使用 esbuild 打包服务器代码
async function buildServer() {
  try {
    await esbuild.build({
      entryPoints: [path.join(serverDir, 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(outputDir, 'server.mjs'),
      format: 'esm',
      external: [
        // 这些模块需要原生绑定，不能打包
        'bcrypt',
        'sqlite3',
        'better-sqlite3',
        'node-gyp',
      ],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      minify: true,
      sourcemap: false,
    });

    console.log('✅ Server built successfully!');
    console.log('Output:', path.join(outputDir, 'server.mjs'));
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildServer();
