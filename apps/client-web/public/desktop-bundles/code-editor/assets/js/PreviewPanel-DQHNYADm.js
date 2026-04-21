import{r as p,j as t,l as z,X as g,K as E,N as B,O as F,Q as C,y as D}from"./react-vendor-CzYU1_kB.js";const I="_container_11ons_1",S="_header_11ons_8",R="_title_11ons_18",A="_deviceBtn_11ons_42",W="_active_11ons_62",M="_previewArea_11ons_75",H="_iframe_11ons_95",n={container:I,header:S,title:R,deviceBtn:A,active:W,previewArea:M,iframe:H},N=typeof window<"u"&&window.electronAPI!==void 0,P=async c=>{const r=new Map;try{let s;if(N){const e=await window.electronAPI.readDirectory(c);if(!e.success)throw new Error(e.error);s=e.data}else{const e=await fetch(`http://localhost:3003/api/fs/list?path=${encodeURIComponent(c)}`);if(!e.ok)throw new Error("Failed to load directory");const i=await e.json();if(!i.success||!i.data)return r;s=i.data}for(const e of s)if(e.type==="file")try{let i;if(N){const a=await window.electronAPI.readFile(e.path);a.success&&(i=a.data)}else{const a=await fetch(`http://localhost:3003/api/fs/read?path=${encodeURIComponent(e.path)}`);if(a.ok){const o=await a.json();o.success&&o.data!==void 0&&(i=o.data)}}i!==void 0&&r.set(e.name,i)}catch{}}catch{}return r},O=c=>{const r=new Map,s=(e,i="")=>{const a=i?`${i}/${e.name}`:e.name;e.type==="file"&&e.content!==void 0&&r.set(e.name,{content:e.content,path:a}),e.children&&e.children.forEach(o=>s(o,a))};return c.forEach(e=>s(e)),r},T=c=>{const r=["index.html","main.html","app.html","demo.html"];for(const s of r)if(c.has(s))return s;for(const[s]of c)if(s.endsWith(".html"))return s;return null},U=(c,r)=>{if(r.size===0)return c;let s=c;return s=s.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,(e,i)=>{if(i.startsWith("http")||i.startsWith("//")||i.startsWith("data:"))return e;const a=i.split("/").pop().split("\\").pop().split("?")[0],o=r.get(a);return o?`<style>/* ${a} */
${o.content}</style>`:e}),s=s.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>(?:<\/script>)?/gi,(e,i)=>{if(i.startsWith("http")||i.startsWith("//")||i.startsWith("data:"))return e;const a=i.split("/").pop().split("\\").pop().split("?")[0],o=r.get(a);return o?`<script>/* ${a} */
${o.content}<\/script>`:e}),s},Q=({code:c,language:r,folderPath:s,files:e,onClose:i})=>{const[a,o]=p.useState("desktop"),[v,b]=p.useState(0),[x,_]=p.useState(""),[K,w]=p.useState(!1),y={desktop:{width:"100%",height:"100%"},tablet:{width:"768px",height:"100%"},mobile:{width:"375px",height:"100%"}},f=p.useMemo(()=>{if(!s)return"";const m=s.replace(/\\/g,"/").lastIndexOf("/");return m>0?s.substring(0,m):""},[s]);p.useEffect(()=>{(async()=>{w(!0);try{let l=new Map;if(f){const h=await P(f);for(const[j,$]of h)l.set(j,{content:$,path:`${f}/${j}`})}l.size===0&&(e&&e.length>0?l=O(e):c&&l.set("index.html",{content:c,path:"index.html"}));let d="";if(l.has("index.html"))d=l.get("index.html")?.content||"";else if(s){const h=s.split(/[/\\]/).pop();h&&l.has(h)&&(d=l.get(h)?.content||"")}if(!d){const h=T(l);h&&(d=l.get(h)?.content||"")}!d&&c&&(d=c);let u="";d?u=U(d,l):u=`
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: #1a1a1a;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  color: #888;
                }
                .empty { text-align: center; }
                .empty-icon { font-size: 48px; margin-bottom: 16px; }
              </style>
            </head>
            <body>
              <div class="empty">
                <div class="empty-icon">📄</div>
                <div>暂无内容可预览</div>
              </div>
            </body>
            </html>
          `,_(u)}catch{}finally{w(!1)}})()},[f,s,c,e,v]);const k=()=>{b(m=>m+1)};return r==="html"||r==="htm"||x.includes("<html")?t.jsxs("div",{className:n.container,children:[t.jsxs("div",{className:n.header,children:[t.jsxs("div",{className:n.title,children:[t.jsx(E,{size:16}),t.jsx("span",{children:"预览"})]}),t.jsxs("div",{className:n.controls,children:[t.jsxs("div",{className:n.deviceToggle,children:[t.jsx("button",{className:`${n.deviceBtn} ${a==="desktop"?n.active:""}`,onClick:()=>o("desktop"),title:"桌面",children:t.jsx(B,{size:14})}),t.jsx("button",{className:`${n.deviceBtn} ${a==="tablet"?n.active:""}`,onClick:()=>o("tablet"),title:"平板",children:t.jsx(F,{size:14})}),t.jsx("button",{className:`${n.deviceBtn} ${a==="mobile"?n.active:""}`,onClick:()=>o("mobile"),title:"手机",children:t.jsx(C,{size:14})})]}),t.jsx("button",{className:n.refreshBtn,onClick:k,title:"刷新",children:t.jsx(D,{size:14})}),i&&t.jsx("button",{className:n.closeBtn,onClick:i,children:t.jsx(g,{size:16})})]})]}),t.jsx("div",{className:n.previewArea,children:t.jsx("div",{className:n.deviceFrame,style:{width:y[a].width,height:y[a].height},children:t.jsx("iframe",{srcDoc:x,className:n.iframe,sandbox:"allow-scripts",title:"Preview"},v)})})]}):t.jsxs("div",{className:n.container,children:[t.jsxs("div",{className:n.header,children:[t.jsxs("div",{className:n.title,children:[t.jsx(z,{size:16}),t.jsx("span",{children:"文件预览"})]}),i&&t.jsx("button",{className:n.closeBtn,onClick:i,children:t.jsx(g,{size:16})})]}),t.jsxs("div",{className:n.unsupported,children:[t.jsx("div",{className:n.unsupportedIcon,children:"📄"}),t.jsx("p",{children:"此文件类型不支持预览"}),t.jsx("p",{className:n.hint,children:"您可以下载或在外部程序中打开此文件"})]})]})};export{Q as default};
