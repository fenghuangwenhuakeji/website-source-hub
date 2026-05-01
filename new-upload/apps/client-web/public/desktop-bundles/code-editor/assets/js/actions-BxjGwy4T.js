var oe=Object.defineProperty;var ie=(n,t,e)=>t in n?oe(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var $=(n,t,e)=>ie(n,typeof t!="symbol"?t+"":t,e);import{v as J}from"./vendor-CVaUTfWs.js";function E(){return J()}function Ne(n){const t=`code-editor:file-api:${n}`,e=new Map,s=()=>{if(typeof window>"u")return Object.fromEntries(e.entries());try{const r=window.localStorage.getItem(t);if(!r)return{};const i=JSON.parse(r);return i&&typeof i=="object"?i:{}}catch{return{}}},o=r=>{if(typeof window>"u"){e.clear(),Object.entries(r).forEach(([i,l])=>{e.set(i,l)});return}window.localStorage.setItem(t,JSON.stringify(r))};return{listFiles:async r=>{const i=s(),l=[],p=new Set;for(const a of Object.keys(i))if(a.startsWith(r)){const d=a.slice(r.length).replace(/^\//,"").split("/");d[0]&&!p.has(d[0])&&(p.add(d[0]),l.push({name:d[0],type:d.length>1?"directory":"file"}))}return l},readFile:async r=>({content:s()[r]??null}),writeFile:async(r,i)=>{const l=s();l[r]=i,o(l)},deleteFile:async r=>{const i=s();delete i[r],o(i)}}}const ae=typeof window<"u"&&(window.electron!==void 0||window.electronAPI!==void 0),ce=()=>{if(typeof window<"u"){const n=window.location.origin;if(n&&n!=="null"&&/^https?:\/\//.test(n))return`${n}/api`}return ae?"http://127.0.0.1:3003/api":"/api"},U=ce();async function T(n,t={}){const e=localStorage.getItem("token"),s={"Content-Type":"application/json",...t.headers};return e&&(s.Authorization=`Bearer ${e}`),await(await fetch(`${U}${n}`,{method:t.method||"GET",headers:s,body:t.body?JSON.stringify(t.body):void 0})).json()}const Re={auth:{login:n=>T("/auth/login",{method:"POST",body:n}),register:n=>T("/auth/register",{method:"POST",body:n}),profile:()=>T("/auth/profile"),checkRecharge:()=>T("/auth/check-recharge"),wechatLogin:()=>T("/auth/wechat/login"),sendPhoneCode:n=>T("/auth/phone/code",{method:"POST",body:{phone:n}}),phoneLogin:n=>T("/auth/phone/login",{method:"POST",body:n}),forgotPassword:n=>T("/auth/forgot-password",{method:"POST",body:n}),sendEmailCode:(n,t)=>T("/auth/email/code",{method:"POST",body:{email:n,type:t}})}},Ue="codeEditor",Fe="/code_editor_state.json",ze="/code_editor_agent_config.json",Be={js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",py:"python",java:"java",cpp:"cpp",c:"c",cs:"csharp",go:"go",rs:"rust",rb:"ruby",php:"php",swift:"swift",kt:"kotlin",scala:"scala",html:"html",css:"css",scss:"scss",less:"less",json:"json",xml:"xml",yaml:"yaml",yml:"yaml",md:"markdown",sql:"sql",sh:"shell",bash:"shell",ps1:"powershell",dockerfile:"dockerfile",vue:"vue",svelte:"svelte"},Ge=[{id:"agent-skills",name:"🤖 Agent Skills",path:"/agent-skills",type:"folder",isOpen:!0,children:[{id:"agent-skills/app-builder-agent",name:"app-builder-agent.md",path:"/agent-skills/app-builder-agent",type:"file",content:"",language:"markdown",isModified:!1}]},{id:"src",name:"src",path:"/src",type:"folder",isOpen:!0,children:[{id:"components",name:"components",path:"/src/components",type:"folder",isOpen:!1,children:[{id:"Button",name:"Button.tsx",path:"/src/components/Button.tsx",type:"file",content:`import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick,
  variant = 'primary'
}) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`,language:"typescript",isModified:!1},{id:"Header",name:"Header.tsx",path:"/src/components/Header.tsx",type:"file",content:`import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>My App</h1>
    </header>
  );
};
`,language:"typescript",isModified:!1}]},{id:"utils",name:"utils",path:"/src/utils",type:"folder",isOpen:!1,children:[{id:"helpers",name:"helpers.ts",path:"/src/utils/helpers.ts",type:"file",content:`export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
`,language:"typescript",isModified:!1}]},{id:"App",name:"App.tsx",path:"/src/App.tsx",type:"file",content:`import React from 'react';
import { Button } from './components/Button';
import { Header } from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <h2>Welcome to VibeCoding</h2>
        <Button onClick={() => alert('Hello!')}>
          Click me
        </Button>
      </main>
    </div>
  );
}

export default App;
`,language:"typescript",isModified:!1}]},{id:"public",name:"public",path:"/public",type:"folder",isOpen:!1,children:[{id:"index",name:"index.html",path:"/public/index.html",type:"file",content:`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCoding App</title>
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"><\/script>
</body>
</html>
`,language:"html",isModified:!1}]},{id:"package",name:"package.json",path:"/package.json",type:"file",content:`{
  "name": "vibecoding-app",
  "version": "1.0.0",
  "description": "A VibeCoding project",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
`,language:"json",isModified:!1},{id:"readme",name:"README.md",path:"/README.md",type:"file",content:`# VibeCoding Project

This is a sample project for VibeCoding IDE.

## Features

- React + TypeScript
- Component-based architecture
- Modern development workflow

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,language:"markdown",isModified:!1}],He=[{id:"openai",label:"OpenAI",provider:"openai",baseUrl:"https://api.openai.com/v1/chat/completions",model:"gpt-4o"},{id:"claude-proxy",label:"Claude代理",provider:"anthropic",baseUrl:"https://api.example.com/v1/chat/completions",model:"claude-sonnet-4-20250514"},{id:"gemini-proxy",label:"Gemini代理",provider:"custom",baseUrl:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",model:"gemini-2.5-pro"},{id:"deepseek",label:"DeepSeek",provider:"deepseek",baseUrl:"https://api.deepseek.com/v1/chat/completions",model:"deepseek-chat"},{id:"qwen",label:"通义千问",provider:"custom",baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",model:"qwen-plus"},{id:"kimi",label:"Kimi",provider:"custom",baseUrl:"https://api.moonshot.cn/v1/chat/completions",model:"kimi-k2-0711-preview"},{id:"glm",label:"智谱GLM",provider:"custom",baseUrl:"https://open.bigmodel.cn/api/paas/v4/chat/completions",model:"glm-4.5"},{id:"glm-coding",label:"GLM Coding",provider:"custom",baseUrl:"https://open.bigmodel.cn/api/paas/v4/chat/completions",model:"glm-4.5-air"},{id:"doubao",label:"豆包",provider:"custom",baseUrl:"https://ark.cn-beijing.volces.com/api/v3/chat/completions",model:"doubao-seed-1-6"},{id:"minimax",label:"MiniMax",provider:"minimax",baseUrl:"https://api.minimax.chat/v1/text/chatcompletion_v2",model:"MiniMax-Text-01"},{id:"qianfan",label:"百度千帆",provider:"custom",baseUrl:"https://qianfan.baidubce.com/v2/chat/completions",model:"ernie-4.5-turbo-128k"},{id:"spark",label:"讯飞星火",provider:"custom",baseUrl:"https://spark-api-open.xf-yun.com/v1/chat/completions",model:"generalv3.5"},{id:"hunyuan",label:"腾讯混元",provider:"custom",baseUrl:"https://api.hunyuan.cloud.tencent.com/v1/chat/completions",model:"hunyuan-turbos-latest"},{id:"grok",label:"xAI Grok",provider:"custom",baseUrl:"https://api.x.ai/v1/chat/completions",model:"grok-4"},{id:"cohere",label:"Cohere",provider:"custom",baseUrl:"https://api.cohere.com/compatibility/v1/chat/completions",model:"command-a-03-2025"},{id:"mistral",label:"Mistral",provider:"custom",baseUrl:"https://api.mistral.ai/v1/chat/completions",model:"mistral-large-latest"},{id:"ollama-local",label:"Ollama 本地",provider:"custom",baseUrl:"http://localhost:11434",model:"SiliconBasedWorld/Gemma-4-31B-JANG_4M-CRACK:latest"},{id:"siliconflow",label:"硅基流动",provider:"custom",baseUrl:"https://api.siliconflow.cn/v1/chat/completions",model:"SiliconBasedWorld/Gemma-4-31B-JANG_4M-CRACK"},{id:"openrouter",label:"OpenRouter",provider:"custom",baseUrl:"https://openrouter.ai/api/v1/chat/completions",model:"deepseek/deepseek-chat-v3.1"},{id:"openai-compatible",label:"OpenAI兼容",provider:"custom",baseUrl:"https://api.example.com/v1/chat/completions",model:"deepseek-chat"},{id:"anthropic-compatible",label:"Anthropic兼容",provider:"custom",baseUrl:"https://api.example.com/v1/chat/completions",model:"claude-sonnet-4-20250514"},{id:"azure",label:"Azure",provider:"custom",baseUrl:"https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2025-01-01-preview",model:"gpt-4o"}],Je={openai:{provider:"openai",baseUrl:"https://api.openai.com/v1/chat/completions",model:"gpt-4o"},anthropic:{provider:"anthropic",baseUrl:"https://api.example.com/v1/chat/completions",model:"claude-sonnet-4-20250514"},deepseek:{provider:"deepseek",baseUrl:"https://api.deepseek.com/v1/chat/completions",model:"deepseek-chat"},minimax:{provider:"minimax",baseUrl:"https://api.minimax.chat/v1/text/chatcompletion_v2",model:"MiniMax-Text-01"},custom:{provider:"custom",baseUrl:"",model:""}},qe={provider:"deepseek",apiKey:"",baseUrl:"https://api.deepseek.com/v1/chat/completions",model:"deepseek-chat",temperature:.7,maxTokens:8192,systemPrompt:`【最重要】你必须严格遵守以下规则！

## 🚨 CRITICAL - 核心原则：一次只写一个文件，无论大小

**这是最重要的规则！违反会导致用户数据丢失！**

### 正确的执行流程（必须严格遵守）：

**步骤1：分析任务并执行**
- 分析用户需要什么
- **立即开始执行，不要等待**
- 如果需要创建目录，先创建目录
- 如果需要写文件，立即写文件

**步骤2：执行工具后必须继续**
- 工具执行完成后，系统会告诉你结果
- **你必须根据结果继续下一步**
- 如果目录创建成功，继续写文件
- 如果文件写入成功，继续写下一个文件或完成任务

**步骤3：一次只写一个文件**
- 脑子里**只有**当前这一个文件
- 写出完整代码
- **立即**调用 write 工具写入
- 等待确认后继续下一个

### ❌ 错误示范（会导致失败）：
// 错误：只执行工具不继续
用户：写一个贪吃蛇到D:\\77
AI：我来创建目录
🛠️ **执行操作: run_command** mkdir D:\\77
// 然后就没有然后了（错误！创建目录后必须继续写文件！）

// 错误：同时想着多个文件
// 这里是 file1.js 的代码...
// 🛠️ **执行操作: write** file1.js
// 这里是 file2.js 的代码...  (错误！还没等 file1 执行完就开始写 file2)

### ✅ 正确示范（确保成功）：
// 正确：执行工具后继续完成任务
用户：写一个贪吃蛇到D:\\77
AI：我来为你创建贪吃蛇游戏。
🛠️ **执行操作: run_command** mkdir D:\\77
(系统：目录创建成功)
AI：目录已创建，现在写入游戏文件：
🛠️ **执行操作: write** D:\\77\\snake.html
(系统：文件写入成功)
AI：文件已写入完成！游戏包含...（介绍功能）

## 🔄 工具执行后必须继续

**重要：每次工具执行后，你必须根据结果继续下一步！**

- 创建目录后 → 继续写文件
- 写入文件后 → 继续写下一个文件或完成任务
- 读取文件后 → 根据内容决定下一步

不要执行完工具就停止！任务要完成！

## 📋 关键规则

1. **一次只写一个文件** - 无论文件大小，一次回复只写一个文件
2. **写完后立即执行** - 写完代码立即调用 write 工具
3. **执行后读取确认** - 用 read 工具读取刚写入的文件，确认内容正确
4. **确认后再写下一个** - 只有当前文件完全完成后，才开始写下一个
5. **如果内容被截断** - 继续完成当前文件，不要开始新文件

## 🛠️ 工具调用格式

支持两种格式（都可以使用）：

### 格式1：Markdown 表格（推荐）
🛠️ **执行操作: 工具名称**

| 参数 | 值 |
|------|-----|
| 参数名1 | 参数值1 |
| 参数名2 | 参数值2 |

### 格式2：JSON 代码块
\`\`\`json
{
  "tool": "write",
  "args": {
    "path": "D:\\\\test.txt",
    "content": "文件内容"
  }
}
\`\`\`

## 可用工具列表

**read** - 读取文件内容
| 参数 | 说明 |
|------|------|
| path | 文件路径（必填） |
| startLine | 起始行号（可选） |
| endLine | 结束行号（可选） |

**write** - 写入文件（自动创建目录）
| 参数 | 说明 |
|------|------|
| path | 文件路径（必填） |
| content | 文件内容（必填） |

**mkdir** - 创建目录
| 参数 | 说明 |
|------|------|
| path | 目录路径（必填） |

**run_command** - 执行命令
| 参数 | 说明 |
|------|------|
| command | 命令（必填） |
| cwd | 工作目录（可选） |

**search_replace** - 搜索替换
| 参数 | 说明 |
|------|------|
| path | 文件路径（必填） |
| search | 搜索内容（必填） |
| replace | 替换内容（必填） |
| useRegex | 使用正则（可选） |

**delete** - 删除文件或目录
| 参数 | 说明 |
|------|------|
| path | 路径（必填） |
| recursive | 递归删除（可选） |

**ls** - 列出目录
| 参数 | 说明 |
|------|------|
| path | 目录路径（可选） |
| showHidden | 显示隐藏文件（可选） |

## 正确示例（必须严格遵循此格式）

用户说："创建一个文件 D:\\test.txt"

你的回复必须是：

我来为你创建文件。

🛠️ **执行操作: write**

| 参数 | 值 |
|------|-----|
| path | D:\\test.txt |
| content | 你好，世界！ |

文件已创建完成。

## 必须遵守的规则

1. **所有工具调用必须使用** 🛠️ **执行操作: 工具名** 格式
2. **参数必须使用 Markdown 表格呈现**，格式为 | 参数 | 值 |
3. 代码输出使用 Markdown 代码块（这是允许的）
4. 直接回复用户时不需要工具调用格式
5. 多个工具调用时，每个工具单独使用 🛠️ **执行操作** 格式

## CRITICAL - 核心原则：一次只专注一个文件（最重要！）

**违反此规则会导致文件写入失败！**

### 正确的执行流程（必须严格遵守）

步骤1：专注写第一个文件
- 脑子里**只有** file1.js，不想其他文件
- 写出 file1.js 的完整代码
- **立即**调用 write 工具写入系统
- **等待**工具执行完成

步骤2：第一个文件完成后，再想第二个文件
- 确认 file1.js 已成功写入
- 脑子里切换到 file2.js
- 写出 file2.js 的完整代码
- **立即**调用 write 工具写入系统

### 关键要点（违反会导致失败）

- **绝对不要同时想多个文件**：写 file1 的时候，如果想到 file2 的内容，立即停止，先完成 file1
- **必须立即执行**：写完一个文件，**马上**调用 write，不要写其他内容
- **确认后再下一个**：看到工具执行成功后，再开始写下一个文件

### 错误示范 ❌（会导致写入失败）

// 错误：同时想着两个文件
// 这里是 file1.js 的代码...
// 🛠️ **执行操作: write** file1.js
// 这里是 file2.js 的代码...  (错误！还没等 file1 执行完就开始写 file2)
// 🛠️ **执行操作: write** file2.js

### 正确示范 ✅（确保成功）

// 正确：专注写完一个，执行完，再写下一个
// 这里是 file1.js 的完整代码...
// 🛠️ **执行操作: write** file1.js
// (等待执行完成...)
// 这里是 file2.js 的完整代码...
// 🛠️ **执行操作: write** file2.js

## 输出完整性要求

- **必须输出完整内容**：不要截断、不要省略、不要过早结束
- **如果内容太长**：优先完成当前文件，然后调用 write 工具
- **不要添加无意义的标记**：如 $GOku 等特殊字符
- **保持输出简洁**：只输出必要的内容和工具调用

## 自动继续生成规则

当内容被截断需要继续生成时：
1. **完整发送用户原始指令**（不要截取，有多少发多少）
2. 已生成的文件列表（文件名和简要描述）
3. 当前正在写的文件和断点位置
4. 需要继续完成的任务

**注意**：用户指令必须完整发送，确保 AI 理解完整需求！

**最后提醒：只使用 Markdown 表格格式 🛠️ **执行操作: 工具名**，JSON 格式完全无效！**`},K=20,le=U;let Y=null;const V=6e5;function Ke(n){Y=n}async function Z(n,t){const e=Y||localStorage.getItem("auth_token"),s=new AbortController,o=window.setTimeout(()=>s.abort(),V);try{const r=await fetch(`${le}/agent/tool`,{method:"POST",headers:{"Content-Type":"application/json",...e?{Authorization:`Bearer ${e}`}:{}},body:JSON.stringify({tool:n,args:t}),signal:s.signal});if(!r.ok){if(r.status===401)return{success:!1,error:"请先登录"};const i=await r.json().catch(()=>({error:"请求失败"}));return{success:!1,error:i.error||i.message||"请求失败"}}return await r.json()}catch(r){return r instanceof Error&&r.name==="AbortError"?{success:!1,error:`工具 ${n} 请求超过 ${Math.round(V/1e3)} 秒，已停止等待`}:{success:!1,error:r instanceof Error?r.message:"网络错误"}}finally{window.clearTimeout(o)}}const pe=[{name:"read",description:"读取文件内容，支持行范围指定。用于查看文件内容。",inputSchema:{type:"object",properties:{path:{type:"string",description:"文件路径（相对于工作目录）"},startLine:{type:"number",description:"起始行号（可选，默认从第1行开始）"},endLine:{type:"number",description:"结束行号（可选，默认到文件末尾）"}},required:["path"]}},{name:"write",description:"写入内容到文件，自动创建必要的目录。用于创建或修改文件。",inputSchema:{type:"object",properties:{path:{type:"string",description:"文件路径（相对于工作目录）"},content:{type:"string",description:"文件内容"}},required:["path","content"]}},{name:"search_replace",description:"搜索文件内容并替换。用于批量修改文件中的特定内容。",inputSchema:{type:"object",properties:{path:{type:"string",description:"文件路径"},search:{type:"string",description:"要搜索的内容（支持正则）"},replace:{type:"string",description:"替换后的内容"},useRegex:{type:"boolean",description:"是否使用正则表达式（默认false）"}},required:["path","search","replace"]}},{name:"delete",description:"删除文件或目录。用于清理不需要的文件。",inputSchema:{type:"object",properties:{path:{type:"string",description:"要删除的文件或目录路径"},recursive:{type:"boolean",description:"是否递归删除目录（默认false）"}},required:["path"]}},{name:"glob",description:"使用通配符查找文件。用于快速定位项目中的文件。",inputSchema:{type:"object",properties:{pattern:{type:"string",description:"通配符模式，如 **/*.tsx, src/**/*.ts"},basePath:{type:"string",description:"搜索的基准路径（可选）"}},required:["pattern"]}},{name:"grep",description:"使用正则表达式搜索文件内容。用于查找代码中的特定模式。",inputSchema:{type:"object",properties:{pattern:{type:"string",description:"正则表达式模式"},filePattern:{type:"string",description:"文件过滤模式，如 *.ts, *.tsx"},caseSensitive:{type:"boolean",description:"是否区分大小写（默认false）"},basePath:{type:"string",description:"搜索的基准路径（可选）"}},required:["pattern"]}},{name:"ls",description:"列出目录内容和文件信息。",inputSchema:{type:"object",properties:{path:{type:"string",description:"目录路径（默认当前目录）"},showHidden:{type:"boolean",description:"是否显示隐藏文件（默认false）"}},required:[]}},{name:"mkdir",description:"创建目录，自动创建父目录。用于创建文件夹。",inputSchema:{type:"object",properties:{path:{type:"string",description:"目录路径"}},required:["path"]}},{name:"diff",description:"比较两个文件的差异。用于查看修改内容。",inputSchema:{type:"object",properties:{original:{type:"string",description:"原始文件路径或内容"},modified:{type:"string",description:"修改后文件路径或内容"},originalLabel:{type:"string",description:"原始文件标签（可选）"},modifiedLabel:{type:"string",description:"修改文件标签（可选）"}},required:["original","modified"]}},{name:"run_command",description:"执行终端命令。用于运行构建、测试、安装等命令。",inputSchema:{type:"object",properties:{command:{type:"string",description:"要执行的命令"},cwd:{type:"string",description:"命令执行的工作目录（可选）"},timeout:{type:"number",description:"超时时间（毫秒，默认600000，即10分钟）"}},required:["command"]}}],P=pe.map(n=>n.name),de=typeof window<"u"&&window.electronAPI!==void 0;function ue(n){return n&&n.replace(/^["']|["']$/g,"").trim()}function L(n){if(!n)return n;const t=ue(n);if(typeof window<"u"&&window.electronAPI!==void 0){const s=window.electronAPI;if(s.resolvePath)return s.resolvePath(t)}return t.match(/^[a-zA-Z]:[\\/]/)||t.startsWith("/"),t}async function me(n,t){try{const e=window.electronAPI;switch(n){case"read":{const s=t.path,o=L(s),r=await e.readFile(o);return r.success?{success:!0,output:r.data}:{success:!1,error:r.error}}case"write":{const s=t.path,o=L(s),r=t.content;if(r==null)return{success:!1,error:"content 参数缺失，必须提供文件内容"};if(typeof r!="string")return{success:!1,error:`content 参数必须是字符串，当前类型: ${typeof r}`};const i=await e.writeFile(o,r);return i.success?{success:!0,output:`文件写入成功: ${o}`}:{success:!1,error:i.error}}case"delete":{const s=t.path,o=L(s),r=await e.deleteFile(o);return r.success?{success:!0,output:"删除成功"}:{success:!1,error:r.error}}case"mkdir":{const s=t.path,o=L(s),r=await e.createFile(o,"directory");return r.success?{success:!0,output:`目录创建成功: ${o}`}:{success:!1,error:r.error}}case"ls":{const s=t.path||"D:\\",o=L(s),r=await e.readDirectory(o);return r.success?{success:!0,output:r.data.map(l=>`${l.type==="directory"?"[D]":"[F]"} ${l.name}`).join(`
`)||"空目录"}:{success:!1,error:r.error}}case"run_command":return String(t.command||"").trim()?await Z("run_command",t):{success:!1,error:"command 参数缺失"};default:return{success:!1,error:`工具 ${n} 在 Electron 环境中尚未实现`}}}catch(e){return{success:!1,error:e instanceof Error?e.message:"执行失败"}}}async function he(n){const{name:t,arguments:e}=n;return de?await me(t,e):await Z(t,e)}const X=n=>{let t=n.trim().replace(/\/+$/,"");if(!t)return"/v1/chat/completions";try{const e=new URL(t);if(/^(localhost|127\.0\.0\.1)$/i.test(e.hostname)&&e.port==="11434"&&!/\/v\d+\/chat\/completions(?:\?.*)?$/i.test(e.pathname))return`${e.protocol}//${e.host}/api/chat`}catch{}return/\/chat\/completions(?:\?.*)?$/i.test(t)||/\/api\/chat(?:\?.*)?$/i.test(t)?t:/\/v\d+$/i.test(t)?`${t}/chat/completions`:/\/chat$/i.test(t)?`${t}/completions`:`${t}/v1/chat/completions`},fe=n=>n?.choices?.[0]?.delta?.content||n?.choices?.[0]?.message?.content||n?.choices?.[0]?.text||n?.delta?.content||n?.message?.content||n?.content||"",q=n=>{const t=n.trim();if(!t)return"";const e=t.startsWith("data:")?t.slice(5).trim():t;if(!e||e==="[DONE]"||!e.startsWith("{"))return"";try{return fe(JSON.parse(e))}catch{return""}},Q=n=>{const t=n?.trim();if(!t)return{};try{const e=JSON.parse(t);if(e&&typeof e=="object"&&!Array.isArray(e))return Object.fromEntries(Object.entries(e).filter(([s,o])=>s.trim()&&o!==null&&o!==void 0).map(([s,o])=>[s.trim(),String(o)]))}catch{}return $e(t)},ge=(n,t)=>{const e=[],s=(o,r)=>{const i=String(r||"").trim();i&&e.push({role:o,content:i})};s("system",n);for(const o of t)o.role==="system"?s("system",o.content):o.role==="assistant"?s("assistant",o.content):s("user",o.content);return e},ye={列出目录:"ls",读取文件:"read",写入文件:"write",执行命令:"run_command",搜索替换:"search_replace",查找文件:"glob",搜索内容:"grep","查看 Diff":"diff",查看Diff:"diff",删除文件:"delete",创建目录:"mkdir"},R=(n="")=>{const t=n.trim().replace(/^`|`$/g,"");return ye[t]||t},F=(n="")=>{const t=n.trim().replace(/^`|`$/g,""),e=t.toLowerCase();return["path","filepath","file","文件","文件路径","路径","目录"].includes(e)||/路径|目录/.test(t)?"path":["command","cmd","命令"].includes(e)||/命令/.test(t)?"command":["content","内容","写入内容"].includes(e)||/内容/.test(t)?"content":["search","查找","搜索"].includes(e)||/搜索|查找/.test(t)?"search":["replace","替换"].includes(e)||/替换/.test(t)?"replace":["pattern","模式"].includes(e)||/模式/.test(t)?"pattern":["basepath","base_path","搜索目录"].includes(e)||/搜索目录/.test(t)?"basePath":["cwd","workdir","工作目录"].includes(e)||/工作目录/.test(t)?"cwd":["useregex","useRegex","regex","正则"].includes(t)||/正则/.test(t)?"useRegex":t},z=(n,t)=>{const e=t.trim().replace(/^`|`$/g,"");if(n==="useRegex")return/^(true|1|yes|是)$/i.test(e);if(/^(startLine|endLine|timeout)$/i.test(n)){const s=Number(e);return Number.isFinite(s)?s:e}return e},N=(n="")=>{const t=String(n).replace(/\r/g,"").trim(),e=t.match(/^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n?```\s*$/);return(e?e[1]:t).replace(/^```[a-zA-Z0-9_-]*\s*\n?/,"").replace(/\n?```\s*$/,"").replace(/(<\/html>)\s*\|\s*$/i,"$1")},ee=(n,t,e)=>{const s=R(t);if(!P.includes(s)||Object.keys(e).length===0)return;const o=`${s}:${JSON.stringify(e)}`;n.some(i=>`${i.name}:${JSON.stringify(i.arguments)}`===o)||n.push({name:s,arguments:e})},te=(n,t)=>{const e={},s=new Set(["path","command","content","search","replace","pattern","basePath","cwd","startLine","endLine","timeout","useRegex"]),o=n.match(/\{[\s\S]*\}/);if(o)try{const a=JSON.parse(o[0]);a&&typeof a=="object"&&(Object.assign(e,a.args&&typeof a.args=="object"?a.args:a),typeof e.content=="string"&&(e.content=N(e.content)))}catch{}const r=n.split(`
`),i=r.findIndex(a=>/^\s*\|\s*content\s*\|/i.test(a)),l=r.findIndex(a=>/^(查看写入内容|写入内容|content)$/i.test(a.trim())),p=i>=0?r.slice(0,i):r;if(i>=0){const c=r[i].match(/^\s*\|\s*content\s*\|\s*([\s\S]*?)\s*\|?\s*$/i),d=c?c[1]:"",h=r.slice(i+1).join(`
`);e.content=N([d,h].filter(Boolean).join(`
`))}if(t==="write"&&typeof e.content!="string"&&l>=0){let a=l+1;/^\d+(?:\.\d+)?\s*(?:B|KB|MB)$/i.test((r[a]||"").trim())&&(a+=1),e.content=N(r.slice(a).join(`
`))}for(const a of p){const c=a.match(/^\s*\|\s*([^|]+?)\s*\|\s*([\s\S]*?)\s*\|?\s*$/);if(c){const h=c[1].trim(),y=c[2].trim();if(!h||!y||/^(参数|param|key|-+)$|^-+$/i.test(h)||/^(值|value|-+)$|^-+$/i.test(y))continue;const g=F(h);e[g]=z(g,y);continue}const d=a.match(/^\s*([^:：|]{1,32})\s*[:：]\s*(.+)\s*$/);if(d){const h=F(d[1]);e[h]=z(h,d[2])}}for(let a=0;a<r.length-1;a+=1){const c=F(r[a].trim());if(!s.has(c)||typeof e[c]<"u")continue;const d=(r[a+1]||"").trim();!d||/^(已派发|查看写入内容|写入内容)$/i.test(d)||(e[c]=z(c,d))}if(Object.keys(e).length===0&&(t==="ls"||t==="read")){const a=n.split(`
`).map(c=>c.trim().replace(/^`|`$/g,"")).find(c=>/^[A-Za-z]:[\\/]/.test(c));a&&(e.path=a)}return e},we=n=>{const t=[],e=/(?:\[执行工具:\s*([^\]]+)\]|(?:🛠️\s*)?\*\*执行(?:操作|工具):\s*([^*]+?)\*\*)/g,s=Array.from(n.matchAll(e));return s.forEach((o,r)=>{const i=o[1]||o[2]||"",l=R(i),p=(o.index||0)+o[0].length,a=r+1<s.length&&s[r+1].index||n.length,c=n.slice(p,a);ee(t,l,te(c,l))}),t},be=n=>{const t=[],e=n.split(/\r?\n/);let s=0;for(;s<e.length;){const o=e[s]?.trim()||"",r=e[s+1]?.trim()||"",i=R(r);if(!/^\d{1,3}$/.test(o)||!P.includes(i)){s+=1;continue}const l=[];for(s+=2;s<e.length;){const a=e[s],c=a.trim(),d=e[s+1]?.trim()||"";if(/^\d{1,3}$/.test(c)&&P.includes(R(d)))break;l.push(a),s+=1}const p=te(l.join(`
`),i);ee(t,i,p)}return t};function B(n){const t=we(n);if(t.length>0)return t;const e=be(n);if(e.length>0)return e;const s=[],o=/🛠️\s*\*\*执行操作:\s*(\w+)\*\*/g;let r;for(;(r=o.exec(n))!==null;){const p=r[1],a=r.index,d=n.slice(a+r[0].length).match(/\n\s*\|\s*参数\s*\|\s*值\s*\|[\s\S]*?(?=\n\s*\n|\n🛠️|$)/);if(d&&P.includes(p)){const h=d[0],y={},g=h.split(`
`);for(const k of g){const f=k.match(/^\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);if(f){const b=f[1].trim(),j=f[2].trim();b!=="参数"&&b!=="------"&&(y[b]=j)}}s.push({name:p,arguments:y})}}if(s.length===0){const p=n.matchAll(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g);for(const a of p)try{const c=JSON.parse(a[1].trim());c.tool&&P.includes(c.tool)&&s.push({name:c.tool,arguments:c.args||{}})}catch{}if(s.length===0){const a=n.matchAll(/\{\s*["']?tool["']?\s*:\s*["']?(\w+)["']?\s*,\s*["']?args["']?\s*:\s*(\{[\s\S]*?\})\s*\}/g);for(const c of a)try{P.includes(c[1])&&s.push({name:c[1],arguments:JSON.parse(c[2])})}catch{}}}const i=/\[执行工具:\s*(\w+)\s*\]([\s\S]*?)(?=\n\[执行工具:|$)/g;let l;for(;(l=i.exec(n))!==null;){const p=l[1].trim(),a=(l[2]||"").trim();if(P.includes(p)){const c={},d=a.split(`
`);let h="",y="";for(const g of d){const k=g.match(/^\s*\|\s*([^|]+)\s*\|\s*([\s\S]*?)\s*\|?\s*$/);if(k){h&&(c[h]=y.trim());const f=k[1].trim(),b=k[2].trim();f&&f!=="参数"&&!/^-+$/.test(f)?(h=f,y=b):(h="",y="")}else h&&(y+=`
${g}`)}if(h&&(c[h]=y.trim()),Object.keys(c).length===0){const g=a.match(/(?:command|命令)\s*[:：]\s*(.+)/i);g&&(c.command=g[1].trim())}if(Object.keys(c).length===0){const g=a.match(/\{[\s\S]*\}/);if(g)try{Object.assign(c,JSON.parse(g[0]))}catch{}}Object.keys(c).length>0&&s.push({name:p,arguments:c})}}return s}async function ve(n,t,e,s){const{onStart:o,onToken:r,onComplete:i,onError:l}=e;try{o();const p=X(t.baseUrl),a=ge(t.systemPrompt,n),c=await fetch(`${U}/llm/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetUrl:p,apiKey:t.apiKey,model:t.model,messages:a,stream:!0,max_tokens:t.maxTokens,temperature:t.temperature,customHeaders:Q(t.customHeaders)}),signal:s});if(!c.ok){const f=await c.json().catch(()=>null);throw new Error(f?.error?.message||`API错误: ${c.status}`)}const d=c.body?.getReader(),h=new TextDecoder;let y="",g="";const k=f=>{const b=q(f);b&&(y+=b,r(b,y))};if(!d)throw new Error("无法读取响应流");for(;;){const{done:f,value:b}=await d.read();if(f)break;const j=h.decode(b,{stream:!0});g+=j;const u=g.split(/\r?\n/);g=u.pop()||"";for(const v of u){const w=v.trim();w&&k(w)}}k(g),i(y)}catch(p){if(p instanceof Error){if(p.name==="AbortError"){l("请求已停止");return}if(p.message.includes("ERR_ABORTED")||p.message.includes("Failed to fetch")){l("请求被中止，请重试");return}l(p.message)}else l(String(p))}}const Ae=(n="")=>n.includes("当前对话模式：Chat")?"chat":n.includes("当前对话模式：Plan")?"plan":n.includes("当前对话模式：Spec")?"spec":n.includes("当前对话模式：Create")?"create":"code",ne=(n="")=>/解读|解释|说明|讲讲|读一下|看一下|看看|分析一下|分析这个|帮我分析|项目分析|代码分析|梳理|介绍一下/i.test(n)&&!/优化|修复|改|修改|重构|升级|实现|创建|生成|写入|删除|替换|部署|打包|安装版|便携版/i.test(n),ke=(n,t,e="")=>ne(e)?["工具证据已回收。当前任务是只读解读 / 分析报告，不是 Plan，也不是 Spec。","禁止切换到 SPEC，禁止输出“如何解读”的规则书，禁止停在目录扫描。","如果刚才只是 ls/目录列表，下一步必须继续 read 关键文件：README、package.json、index.html、style.css、script.js 或入口文件；忽略 dist/dist-app，除非源码缺失。","当关键文件已经读取完成，直接输出解读报告：项目是什么、文件职责、核心交互/执行链、关键函数或模块、潜在问题、后续建议。","",t].join(`
`):n==="plan"?["工具证据已回收。当前是 Plan 模式。","读取之后必须输出具体 PLAN / TODO，不能停在“已经读取”。","如果证据已经足够，不要继续重复读取同类文件。","最终必须包含：现状判断、优化目标、优先级、执行步骤、TODO、验证方法、等待 Code 执行。","",t].join(`
`):n==="spec"?["工具证据已回收。当前是 Spec 模式。","读取之后必须输出可验收 SPEC，不能停在“已经读取”。","如果证据已经足够，不要继续重复读取同类文件。","最终必须包含：输入、输出、约束、文件范围、验收标准、异常回收、等待 Code 执行。","",t].join(`
`):n==="chat"?["工具证据已回收。当前是 Chat 模式。","不要切 Plan/SPEC，不要写任务中心流程，不要调用 Agent 编排。","读取之后必须直接给结果；如果证据不足，可以继续最少量 read/ls/run_command。","",t].join(`
`):[n==="code"?"工具执行结果已回收。当前是 Code 模式，必须按 TODO 继续执行、测试或调试。":"工具执行结果已回收，必须根据这个结果继续任务。",n==="code"?"不要只总结；如果还没完成 TODO 或验证失败，继续调用工具。只有完成改动、终端验证和调试后，才输出最终报告。":"如果还没完成，继续调用工具；如果已完成，输出交付结果和验证结论。","",t].join(`
`),Se=(n,t="")=>ne(t)?["内部指令：这是只读解读 / 分析报告任务。","如果目前只列出了目录，还没读关键文件，必须继续调用 read 读取入口文件和核心文件。","不要切到 Plan/SPEC，不要写规则书，不要等待 Code。","证据足够后，立即输出完整解读报告。"].join(`
`):n==="plan"?["内部指令：刚才的工具读取已经完成。","现在必须综合目录、关键文件和代码证据，输出最终 PLAN / TODO。","不要讲通用方法论，不要只说“我已经读取”。","这个 PLAN 的状态是“等待 Code 执行”。"].join(`
`):n==="spec"?["内部指令：刚才的工具读取已经完成。","现在必须综合目录、关键文件和代码证据，输出最终 SPEC / 验收规则。","不要讲通用方法论，不要只说“我已经读取”。","这个 SPEC 的状态是“等待 Code 执行”。"].join(`
`):n==="code"?["内部指令：刚才的 Code 工具执行已经完成。","继续检查 TODO：未完成就继续读写文件、跑终端或调试；验证失败就修复并重跑。","只有文件改动、终端验证和最终报告都闭环后，才停止；不要强行等待多 Agent。"].join(`
`):n==="chat"?["内部指令：刚才的 Chat 工具执行已经完成。","如果结果足够，直接用自然语言给用户最终答复。","不要补 Plan/SPEC/TODO，不要等待 Code，不要调用 Agent 编排。"].join(`
`):"",W=6e5,Te=40,Ce=350,Oe=6e5,G=new Set(["ls","read","glob","grep","diff"]),Ee=(n,t)=>n!=="write"||typeof t.content!="string"?t:{...t,content:N(t.content)},Pe=n=>{const t=typeof n.path=="string"?n.path:"",e=typeof n.content=="string"?n.content:"",s=t.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()||"";if(!["js","mjs","cjs","ts","tsx","jsx","html","css","scss","json"].includes(s))return"";const r=e.trim();if(/^```/.test(r)||/```$/.test(r))return"写入内容仍包含 Markdown 代码围栏，已拒绝覆盖。请把 content 改成纯文件内容。";if(r.length<200&&!/^\{\s*[\s\S]*\}\s*$/.test(r))return`写入内容只有 ${r.length} 个字符，疑似截断，已拒绝覆盖 ${t}。请重新生成完整文件，或用 search_replace 做局部修复。`;if(s==="html"&&/<!doctype\s+html|<html[\s>]/i.test(r)&&!/<\/html>\s*$/i.test(r))return`HTML 文件疑似没有完整闭合 </html>，已拒绝覆盖 ${t}。请继续生成完整文件，或用 search_replace 做局部修复。`;if(s==="json")try{JSON.parse(r)}catch{return`JSON 文件不是完整有效 JSON，已拒绝覆盖 ${t}。请重新生成完整 JSON。`}return""},je=(n,t)=>{try{return`${n}:${JSON.stringify(t,Object.keys(t||{}).sort())}`}catch{return`${n}:${String(t)}`}},xe=async n=>{let t;const e=new Promise(s=>{t=setTimeout(()=>{s({success:!1,error:`工具 ${n.name} 执行超过 ${Math.round(W/1e3)} 秒，已停止等待。`})},W)});try{return await Promise.race([he(n),e])}finally{t&&clearTimeout(t)}};async function Ve(n,t,e,s,o){const{onThinking:r,onToolCall:i,onToolResult:l}=s;let p=0;const a=[...t],c=Ae(e.systemPrompt);let d=0;const h=new Map,y=[],g=new Map;for(a.push({id:E(),role:"user",content:n,timestamp:Date.now()});p<K;){p++,r?.();const k=a.map(u=>({role:u.role==="assistant"?"assistant":"user",content:u.role==="tool"?`工具执行结果，必须根据这个结果继续任务；如果还没完成，继续调用工具；只有真正修改/验证结束后才输出交付结果。

${u.content}`:u.content}));k.forEach((u,v)=>{a[v]?.role==="tool"&&(u.content=ke(c,a[v].content,n))});let f="";if(await new Promise((u,v)=>{const w=new AbortController;let x=!1,C=!1,A;const S=()=>{x||(x=!0,A&&clearTimeout(A),u())},D=m=>{x||(x=!0,A&&clearTimeout(A),v(m))},_=()=>w.abort();o&&(o.aborted?w.abort():o.addEventListener("abort",_,{once:!0}));const I=m=>{if(!m||C)return;const O=B(m);if(O.length===0)return;A&&clearTimeout(A);const se=O.some(re=>re.name==="write");A=setTimeout(()=>{C=!0,w.abort(),S()},se?Oe:Ce)};ve(k,e,{onStart:()=>{s.onStart()},onToken:(m,O)=>{f=O,s.onToken(m,O),I(O)},onComplete:m=>{f=m,S()},onError:m=>{if(C||B(f).length>0){S();return}s.onError(m),D(new Error(m))}},w.signal).finally(()=>{A&&clearTimeout(A),o&&o.removeEventListener("abort",_)})}),o?.aborted){s.onComplete(f);return}if(!f.trim()){s.onComplete("抱歉，我没有收到有效的回复。");return}const b=B(f);if(b.length===0){a.push({id:E(),role:"assistant",content:f,timestamp:Date.now()}),s.onComplete(f);return}a.push({id:E(),role:"assistant",content:f,timestamp:Date.now()});for(const u of b){const v=Ee(u.name,u.arguments),w={id:E(),name:u.name,arguments:v,status:"executing"};i?.(w);const x=await s.onBeforeToolExecute?.(w),C=G.has(u.name)?je(u.name,v):"",A=C&&h.get(C)||0,S=u.name==="write"&&typeof v.path=="string"?v.path:"",D=S&&g.get(S)||0,_=c==="chat"&&G.has(u.name)&&(A>=1||d>=Te),I=u.name==="write"?Pe(v):"",m=_?{success:!1,error:A>=1?"这个路径/查询已经读取过了。请换下一个尚未读取的源文件，或开始 search_replace/write/run_command 改造优化并验证。":"Chat 模式已经执行了大量只读工具。请停止继续扫描，开始改造优化、运行验证，或给出明确阻塞原因。"}:I?{success:!1,error:I}:u.name==="write"&&S&&D>=1?{success:!1,error:`本轮已经完整写入 ${S} 1 次，已拒绝继续整文件覆盖。请先用 run_command/diff 定位失败原因，再用 search_replace 做局部修复。`}:x===!1?{success:!1,error:`权限策略已拦截工具执行：${u.name}`}:await xe({id:w.id,name:u.name,arguments:v,status:"executing",startTime:Date.now()});c==="chat"&&G.has(u.name)&&(d+=1,C&&h.set(C,A+1)),u.name==="write"&&S&&m.success&&g.set(S,D+1);const O={toolCallId:w.id,success:m.success,output:m.output,error:m.error};w.status=m.success?"completed":"error",w.result=m.output,w.error=m.error,l?.(O),y.push({name:u.name,args:v,success:m.success,text:m.success?String(m.output||""):String(m.error||"")}),a.push({id:E(),role:"tool",content:m.success?`工具 ${u.name} 执行结果:
${m.output}`:`工具 ${u.name} 执行失败:
${m.error}`,timestamp:Date.now()})}const j=Se(c,n);j&&a.push({id:E(),role:"user",content:j,timestamp:Date.now()}),c==="chat"&&d>0&&a.push({id:E(),role:"user",content:["内部硬规则：Chat 模式可以继续读取尚未读取的源文件，但不要重复读取同一路径、同一查询。","如果目录中的源文件、配置文件和入口文件已经读完，就开始 search_replace/write/run_command 改造优化并验证。","优先 search_replace 做局部微调；只有新增文件或用户明确要求重写/覆盖时才用 write。","不要因为还没进 Plan/SPEC 就停住。Chat 也能直接读写和运行命令。","不要停在“已读取”。要么继续读新的必要文件，要么直接改造并给用户结果。"].join(`
`),timestamp:Date.now()})}p>=K&&s.onComplete("已达到最大循环次数，代理已停止。")}async function We(n){return(async()=>{if(!n.apiKey)return{success:!1,message:"API Key 不能为空"};const e=new AbortController,s=window.setTimeout(()=>e.abort(),6e5);try{const o=X(n.baseUrl),r=await fetch(`${U}/llm/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({targetUrl:o,apiKey:n.apiKey,model:n.model,messages:[{role:"system",content:"你是 Hyper Code 的连接测试助手。请用中文简短回复用户的“你好”，只回复一句自然问候。"},{role:"user",content:"你好"}],stream:!0,max_tokens:512,temperature:Math.min(n.temperature??.7,.7),customHeaders:Q(n.customHeaders)}),signal:e.signal});if(!r.ok)return{success:!1,message:(await r.json().catch(()=>null))?.error?.message||`连接失败：HTTP ${r.status}`};const i=r.body?.getReader();if(!i)return{success:!1,message:"连接到接口，但无法读取模型响应流"};const l=new TextDecoder;let p="",a="";for(;;){const{done:d,value:h}=await i.read();if(d)break;p+=l.decode(h,{stream:!0});const y=p.split(/\r?\n/);p=y.pop()||"";for(const g of y)a+=q(g)}a+=q(p);const c=a.replace(/\s+/g," ").trim();return c?{success:!0,message:`模型回复成功：${c.slice(0,120)}`}:{success:!1,message:"接口已连接，但大模型没有返回任何文本内容"}}catch(o){return o instanceof Error&&o.name==="AbortError"?{success:!1,message:"测试超时：10 分钟内没有收到大模型回复"}:{success:!1,message:o instanceof Error?o.message:"连接失败"}}finally{window.clearTimeout(s)}})()}function $e(n){const t={},e=n.split(/[\n,;]+/);for(const s of e){const[o,...r]=s.split(":").map(l=>l.trim()),i=r.join(":").trim();o&&i&&(t[o]=i)}return t}const Ye=`你是 Hyper Code 的 Agent 助手。所有回答都由大模型流式输出；在允许工具的模式中，你要调用真实工具完成真实任务。

模式铁律：
1. Chat：自然交流优先；用户明确给路径、文件或命令时，可以少量调用文件工具和终端，但不进 Plan/SPEC，不调用 Agent 编排。
2. Plan：可以读写文件、搜索项目、运行必要命令；产物必须是具体执行计划和 TODO，最终等待 Code 执行。
3. Spec：可以读写文件、搜索项目、运行必要命令；产物必须是可验收规则，最终等待 Code 执行。
4. Code：结果优先，默认直接读写文件、跑终端、修复、验证和报告；只有用户明确要求多 Agent/协同/并行时才调用 Agent 编排。
5. Create：负责写作、剧本、角色、文案、世界观等创作产物，可按需读写素材文件和导出内容。

Plan 输出要求：
- 基于真实项目证据，不讲泛泛方法论。
- 必须包含目标、现状判断、影响范围、执行步骤、TODO、验证方法、权限点。
- 结尾明确：等待 Code 模式按 TODO 执行。

Spec 输出要求：
- 基于真实项目证据，不讲泛泛方法论。
- 必须包含输入、输出、约束、文件范围、接口/数据结构、验收标准、异常回收。
- 结尾明确：等待 Code 模式按验收规则执行。

Code 执行要求：
- 不要因为没有 Plan/Spec 就卡住；简单任务直接跑，风险高或用户明确要求时才先补短 PLAN/TODO 或 SPEC/验收规则。
- 如果已有 Plan/Spec/TODO，必须优先按它执行，不能跳过，也不要另起一套计划；只有明确需要协同时才派发 Agent 编排。
- Agent 编排上限：最多 2 个并行 Agent，最多 3 批串行接力。
- Code 必须主动做 Bug 自检：扫描语法错误、预览运行错误、终端 stderr、构建失败、测试失败和明显逻辑断点。
- 静态 HTML/JS 项目优先用 node --check 检查 JS 文件；有 package.json 时优先运行项目已有 build/test/lint 脚本。
- 发现 bug 后必须定位文件/行号或最小代码块，修复后重跑同一个检查；不能只解释错误或要求用户再贴一次。
- 每个 TODO 至少要有一个执行证据：文件改动、终端命令、Diff、测试结果或明确阻塞。
- 终端测试失败时，必须继续定位、修复、重跑验证；不能把失败包装成交付。
- 最终报告必须包含：完成的 TODO、修改文件、执行命令、测试/调试结果、遗留风险。

执行规则：
1. 用户给出 D:\\xxx 这类路径并要求优化、分析、修复、检查时，先用 ls/read/grep/run_command 获取真实上下文，不要反问项目类型。
2. 工具执行后必须根据结果继续推进；目录扫描只是开始，不是完成。
3. Plan/Spec 阶段的工具调用只是证据采集和文档保存，不代表已经完成产品改动。
4. 上一轮已经扫描过项目时，用户追问“制定计划 / 怎么制定 / 下一步 / 开始”，优先复用上一轮工具证据。
5. 不能把失败包装成交付结果；失败要换命令、换工具或明确阻塞原因。

工具调用格式：必须使用下面的表格格式，前端会解析并执行。
[执行工具: ls]
| path | D:\\project |

[执行工具: read]
| path | D:\\project\\index.html |

[执行工具: write]
| path | D:\\project\\PLAN.md |
| content | 文件内容 |

[执行工具: run_command]
| command | npm run build |
| cwd | D:\\project |

可用工具：
- read：读取文件
- write：写入文件
- search_replace：搜索替换
- delete：删除文件或目录
- glob：按通配符查找文件
- grep：搜索内容
- ls：列目录
- mkdir：创建目录
- diff：对比差异
- run_command：运行终端命令

重要：
- 文件内容必须放在 write 的 content 参数中。
- 路径里的反斜杠建议写成双反斜杠。
- 多个工具调用时，每个工具单独写一个 [执行工具: xxx] 块。
- 工具返回后必须基于结果继续分析、计划、写文件、调试或验证。`;function Le(){const n={};return Object.keys(n).length===0?Me:n}const Me={"first-principles":{id:"first-principles",name:"第一性原理Agent",description:"从问题本质出发，拒绝惯例和模板，运用第一性原理进行深度思考",category:"first-principles",icon:"🔬",skills:["reasoning","analysis","problem-solving"],prompt:"你是一个第一性原理思考专家。你的任务是从问题的本质出发，拆解到最基本的真理，然后重新构建解决方案。不要依赖惯例、类比或现有的解决方案模板。",temperature:.3},"code-generation":{id:"code-generation",name:"代码生成专家",description:"智能代码生成和补全，支持多种编程语言",category:"core",icon:"⚙️",skills:["code-generation","code-completion","syntax-analysis"],prompt:"你是一个代码生成专家。根据用户的需求生成高质量、可维护的代码。确保代码符合最佳实践，包含适当的注释和错误处理。",temperature:.2},debug:{id:"debug",name:"调试专家",description:"智能调试助手，自动诊断和修复问题",category:"core",icon:"🐛",skills:["debugging","error-analysis","fix-suggestion"],prompt:"你是一个调试专家。分析代码中的错误，找出根本原因，并提供精确的修复建议。使用系统化的调试方法，逐步排查问题。",temperature:.2},"code-review":{id:"code-review",name:"代码审查专家",description:"代码质量检查和优化建议",category:"core",icon:"👁️",skills:["code-review","quality-check","optimization"],prompt:"你是一个代码审查专家。检查代码的质量、可读性、性能和安全性。提供具体的改进建议，并解释为什么这些改进是重要的。",temperature:.3},search:{id:"search",name:"搜索专家",description:"代码搜索和导航",category:"core",icon:"🔍",skills:["code-search","navigation","reference-finding"],prompt:"你是一个代码搜索专家。帮助用户在代码库中快速找到相关的代码片段、函数定义、引用和使用示例。",temperature:.2},test:{id:"test",name:"测试专家",description:"测试生成和执行",category:"core",icon:"🧪",skills:["test-generation","test-execution","coverage-analysis"],prompt:"你是一个测试专家。为代码生成全面的测试用例，包括单元测试、集成测试和边界条件测试。确保测试覆盖所有关键路径。",temperature:.2},refactor:{id:"refactor",name:"重构专家",description:"代码重构和优化",category:"core",icon:"♻️",skills:["refactoring","optimization","modernization"],prompt:"你是一个重构专家。改进代码结构，提高可读性和可维护性，同时保持功能不变。应用设计模式和最佳实践。",temperature:.3},"agent-generator":{id:"agent-generator",name:"Agent生成器",description:"将任何概念、工具、流程转化为结构化Agent",category:"meta",icon:"🤖",skills:["agent-creation","prompt-engineering","workflow-design"],prompt:"你是一个Agent生成器。根据用户的需求，创建专门的Agent定义，包括角色描述、能力、提示词和工作流程。",temperature:.4},"auto-drive":{id:"auto-drive",name:"自动驾驶Agent",description:"全自主智能执行引擎，自动完成所有工作",category:"meta",icon:"🚗",skills:["autonomy","planning","execution","adaptation"],prompt:"你是一个自动驾驶Agent。接收高层次目标，自主规划执行步骤，调用其他Agent和工具，直到任务完成。能够处理意外情况并调整策略。",temperature:.5},"meta-agent":{id:"meta-agent",name:"元Agent",description:"管理和协调其他Agent",category:"meta",icon:"🎯",skills:["orchestration","coordination","optimization"],prompt:"你是一个元Agent。管理和协调多个专业Agent的协作。分析任务需求，选择最合适的Agent组合，监控执行进度，确保高效完成任务。",temperature:.4},typescript:{id:"typescript",name:"TypeScript专家",description:"TypeScript开发专家，类型系统、React集成",category:"programming",icon:"💻",skills:["typescript","react","type-system"],prompt:"你是一个TypeScript专家。精通类型系统、泛型、装饰器等高级特性。提供类型安全的代码解决方案。",temperature:.2},python:{id:"python",name:"Python专家",description:"Python开发专家，数据科学、AI/ML",category:"programming",icon:"🐍",skills:["python","data-science","machine-learning"],prompt:"你是一个Python专家。精通Python语法、标准库和生态系统。擅长数据处理、AI/ML和科学计算。",temperature:.2},rust:{id:"rust",name:"Rust专家",description:"Rust系统编程专家，内存安全、并发",category:"programming",icon:"🦀",skills:["rust","systems-programming","concurrency"],prompt:"你是一个Rust专家。精通所有权系统、生命周期、并发编程。编写高性能、内存安全的系统代码。",temperature:.2},cpp:{id:"cpp",name:"C++专家",description:"C++高性能编程专家，STL、现代C++",category:"programming",icon:"⚡",skills:["cpp","stl","performance"],prompt:"你是一个C++专家。精通现代C++、STL、模板元编程。编写高性能、可维护的C++代码。",temperature:.2},react:{id:"react",name:"React专家",description:"React开发专家，Hooks、状态管理",category:"frontend",icon:"⚛️",skills:["react","hooks","state-management"],prompt:"你是一个React专家。精通Hooks、Context、性能优化。编写可复用、高性能的React组件。",temperature:.2},vue:{id:"vue",name:"Vue专家",description:"Vue.js开发专家，Composition API",category:"frontend",icon:"💚",skills:["vue","composition-api","vuex"],prompt:"你是一个Vue.js专家。精通Composition API、Vuex、Vue Router。构建响应式、可维护的Vue应用。",temperature:.2},unity:{id:"unity",name:"Unity专家",description:"Unity游戏开发专家，C#、2D/3D",category:"game",icon:"🎮",skills:["unity","csharp","game-development"],prompt:"你是一个Unity游戏开发专家。精通C#脚本、物理系统、动画、UI。开发高质量的2D和3D游戏。",temperature:.3},unreal:{id:"unreal",name:"Unreal专家",description:"Unreal Engine开发专家，C++、蓝图",category:"game",icon:"🎲",skills:["unreal","blueprints","cpp"],prompt:"你是一个Unreal Engine专家。精通蓝图系统、C++、渲染管线。开发AAA级游戏体验。",temperature:.3},godot:{id:"godot",name:"Godot专家",description:"Godot游戏开发专家，GDScript",category:"game",icon:"🤖",skills:["godot","gdscript","game-design"],prompt:"你是一个Godot游戏开发专家。精通GDScript、节点系统、场景管理。开发轻量级、高效的游戏。",temperature:.3},"data-analysis":{id:"data-analysis",name:"数据分析专家",description:"数据分析和可视化专家",category:"data",icon:"📊",skills:["data-analysis","visualization","statistics"],prompt:"你是一个数据分析专家。精通数据清洗、统计分析、可视化。从数据中提取有价值的洞察。",temperature:.3},ml:{id:"ml",name:"机器学习专家",description:"ML模型开发和训练专家",category:"data",icon:"🧠",skills:["machine-learning","deep-learning","model-training"],prompt:"你是一个机器学习专家。精通各种ML算法、深度学习框架。设计和训练高性能的ML模型。",temperature:.3},screenplay:{id:"screenplay",name:"剧本创作专家",description:"专业剧本创作，三幕式结构",category:"creative",icon:"📝",skills:["screenplay","story-structure","dialogue"],prompt:"你是一个剧本创作专家。精通三幕式结构、角色发展、对话写作。创作引人入胜的故事。",temperature:.6},story:{id:"story",name:"故事创作专家",description:"小说和短篇故事创作",category:"creative",icon:"📚",skills:["storytelling","creative-writing","character-development"],prompt:"你是一个故事创作专家。擅长构建世界观、角色弧线、情节设计。创作令人难忘的故事。",temperature:.6}};let H=null;function M(){return H||(H=Le()),H}class De{constructor(){$(this,"invocations",new Map);$(this,"workflows",new Map);$(this,"listeners",new Set);$(this,"apiConfig",{})}getAllAgents(){return Object.values(M())}getAgentsByCategory(t){return Object.values(M()).filter(e=>e.category===t)}searchAgents(t){const e=t.toLowerCase();return Object.values(M()).filter(s=>s.name.toLowerCase().includes(e)||s.description.toLowerCase().includes(e)||s.skills.some(o=>o.toLowerCase().includes(e)))}async invokeAgent(t,e,s){const o=M()[t];if(!o)throw new Error(`Agent not found: ${t}`);const r={id:J(),agentId:t,agentName:o.name,input:e,output:"",status:"pending",startTime:Date.now(),metadata:s};this.invocations.set(r.id,r),this.emitEvent({type:"invocation-started",invocation:r});try{r.status="running",this.emitEvent({type:"invocation-running",invocation:r});const i=await this.callAgentAPI(o,e);r.output=i,r.status="completed",r.endTime=Date.now(),this.emitEvent({type:"invocation-completed",invocation:r})}catch(i){r.status="error",r.error=i instanceof Error?i.message:String(i),r.endTime=Date.now(),this.emitEvent({type:"invocation-error",invocation:r})}return r}async invokeAgents(t){return Promise.all(t.map(({agentId:e,input:s})=>this.invokeAgent(e,s)))}createWorkflow(t,e,s){const o={id:J(),name:t,description:e,steps:s.map((r,i)=>({...r,id:`step-${i}`,status:"pending"})),status:"pending",currentStep:0,createdAt:Date.now(),updatedAt:Date.now()};return this.workflows.set(o.id,o),this.emitEvent({type:"workflow-created",workflow:o}),o}async executeWorkflow(t){const e=this.workflows.get(t);if(!e)throw new Error(`Workflow not found: ${t}`);e.status="running",this.emitEvent({type:"workflow-started",workflow:e});try{for(let s=0;s<e.steps.length;s++){e.currentStep=s;const o=e.steps[s];if(o.dependencies&&!o.dependencies.every(l=>e.steps.find(a=>a.id===l)?.status==="completed"))throw o.status="error",new Error(`Dependencies not completed for step: ${o.id}`);o.status="running",this.emitEvent({type:"workflow-step-started",workflow:e,step:o});const r=await this.invokeAgent(o.agentId,o.input);if(r.status==="completed")o.output=r.output,o.status="completed",this.emitEvent({type:"workflow-step-completed",workflow:e,step:o});else throw o.status="error",new Error(`Step failed: ${o.id}`)}e.status="completed",e.updatedAt=Date.now(),this.emitEvent({type:"workflow-completed",workflow:e})}catch(s){e.status="error",e.updatedAt=Date.now(),this.emitEvent({type:"workflow-error",workflow:e,error:s})}return e}async analyzeAndInvoke(t,e){const o=this.analyzeInput(t).map(r=>({agentId:r,input:this.buildAgentInput(r,t,e)}));return this.invokeAgents(o)}analyzeInput(t){const e=t.toLowerCase(),s=[];return(e.includes("代码")||e.includes("code")||e.includes("编程"))&&((e.includes("生成")||e.includes("写")||e.includes("create"))&&s.push("code-generation"),(e.includes("调试")||e.includes("bug")||e.includes("错误"))&&s.push("debug"),(e.includes("审查")||e.includes("review")||e.includes("检查"))&&s.push("code-review"),(e.includes("重构")||e.includes("优化")||e.includes("refactor"))&&s.push("refactor"),(e.includes("测试")||e.includes("test"))&&s.push("test"),(e.includes("搜索")||e.includes("查找")||e.includes("find"))&&s.push("search")),(e.includes("typescript")||e.includes("ts")||e.includes("react"))&&(s.push("typescript"),s.push("react")),(e.includes("python")||e.includes("py"))&&s.push("python"),(e.includes("游戏")||e.includes("game")||e.includes("unity")||e.includes("unreal"))&&(e.includes("unity")&&s.push("unity"),e.includes("unreal")&&s.push("unreal"),e.includes("godot")&&s.push("godot")),(e.includes("数据")||e.includes("分析")||e.includes("可视化"))&&s.push("data-analysis"),(e.includes("机器学习")||e.includes("ml")||e.includes("ai"))&&s.push("ml"),(e.includes("剧本")||e.includes("故事")||e.includes("小说"))&&(e.includes("剧本")&&s.push("screenplay"),(e.includes("故事")||e.includes("小说"))&&s.push("story")),s.length===0&&s.push("meta-agent"),Array.from(new Set(s))}buildAgentInput(t,e,s){const o=M()[t];if(!o)return e;let r=`[角色] ${o.name}
`;return r+=`[任务] ${e}
`,s&&(r+=`[上下文] ${JSON.stringify(s,null,2)}
`),r}setApiConfig(t){this.apiConfig={...this.apiConfig,...t}}async callAgentAPI(t,e){const{baseUrl:s,apiKey:o,model:r}=this.apiConfig;if(s&&o)try{const i=await fetch(`${s}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({model:r||"gpt-4",messages:[{role:"system",content:t.prompt},{role:"user",content:e}],temperature:t.temperature||.3})});if(!i.ok)throw new Error(`API Error: ${i.status}`);return(await i.json()).choices?.[0]?.message?.content||"无响应内容"}catch(i){throw i}return await new Promise(i=>setTimeout(i,500+Math.random()*500)),`**[${t.name}]** 已处理您的请求

基于我的专业领域（${t.skills.join("、")}），我为您提供以下帮助：

---

**输入内容：**
${e.slice(0,200)}${e.length>200?"...":""}

---

*提示：配置API密钥后可获得真实响应*`}getInvocations(){return Array.from(this.invocations.values()).sort((t,e)=>e.startTime-t.startTime)}getInvocation(t){return this.invocations.get(t)}getWorkflows(){return Array.from(this.workflows.values()).sort((t,e)=>e.createdAt-t.createdAt)}getWorkflow(t){return this.workflows.get(t)}onEvent(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emitEvent(t){this.listeners.forEach(e=>{try{e(t)}catch{}})}}const Ze=new De;export{He as A,ze as C,Ge as D,Be as L,Fe as S,Ze as a,qe as b,Re as c,ve as d,Ye as e,Je as f,E as g,Ne as h,Ue as i,Ve as r,Ke as s,We as t};
