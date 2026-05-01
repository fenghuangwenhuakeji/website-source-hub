import{r as u,j as e,q as k,X as B,aj as $,ak as O,al as W,am as K,E as q,J as z}from"./react-vendor-6cv96oWn.js";const G="_container_1hea9_1",J="_header_1hea9_11",X="_title_1hea9_22",Y="_controls_1hea9_50",Q="_deviceToggle_1hea9_58",V="_deviceBtn_1hea9_69",Z="_openBtn_1hea9_70",ee="_refreshBtn_1hea9_71",te="_closeBtn_1hea9_72",se="_active_1hea9_117",ne="_previewArea_1hea9_146",re="_deviceFrame_1hea9_159",ie="_tablet_1hea9_172",ae="_mobile_1hea9_172",oe="_browserChrome_1hea9_177",ce="_chromeDot_1hea9_188",le="_addressBar_1hea9_202",de="_viewport_1hea9_229",he="_iframe_1hea9_236",pe="_loadingLayer_1hea9_245",me="_unsupported_1hea9_262",ue="_hint_1hea9_284",r={container:G,header:J,title:X,controls:Y,deviceToggle:Q,deviceBtn:V,openBtn:Z,refreshBtn:ee,closeBtn:te,active:se,previewArea:ne,deviceFrame:re,tablet:ie,mobile:ae,browserChrome:oe,chromeDot:ce,addressBar:le,viewport:de,iframe:he,loadingLayer:pe,unsupported:me,hint:ue},C=typeof window<"u"&&window.electronAPI!==void 0,w=t=>t.replace(/\\/g,"/").replace(/^\.\/+/,"").toLowerCase(),D=t=>{const a=t.split(/[?#]/)[0].replace(/\\/g,"/");return a.split("/").pop()||a},y=(t,a,s,n)=>{const i=w(s),o=w(a);t.set(i,{content:n,path:s}),t.set(o,{content:n,path:s})},ve=async t=>{const a=new Map;try{let s=[];if(C){const n=await window.electronAPI.readDirectory(t);if(!n.success)throw new Error(n.error);s=n.data}else{const n=await fetch(`/api/fs/list?path=${encodeURIComponent(t)}`);if(!n.ok)throw new Error("Failed to load directory");const i=await n.json();if(!i.success||!i.data)return a;s=i.data}for(const n of s)if(n.type==="file")try{let i;if(C){const o=await window.electronAPI.readFile(n.path);o.success&&(i=o.data)}else{const o=await fetch(`/api/fs/read?path=${encodeURIComponent(n.path)}`);if(o.ok){const d=await o.json();d.success&&d.data!==void 0&&(i=d.data)}}i!==void 0&&y(a,n.name,`${t}/${n.name}`,i)}catch{}}catch{}return a},fe=t=>{const a=new Map,s=(n,i="")=>{const o=i?`${i}/${n.name}`:n.name;n.type==="file"&&n.content!==void 0&&y(a,n.name,o,n.content),n.children?.forEach(d=>s(d,o))};return t.forEach(n=>s(n)),a},E=(t,a)=>{const s=w(a.split(/[?#]/)[0]);return t.get(s)||t.get(w(D(s)))},we=t=>{const a=["index.html","main.html","app.html","demo.html"];for(const s of a)if(t.has(s))return s;for(const[s]of t)if(s.endsWith(".html")||s.endsWith(".htm"))return s;return null},xe=t=>t.replace(/<\/script/gi,"<\\/script"),_e=t=>t.replace(/<\/style/gi,"<\\/style"),je=t=>t.replace(/\\/g,"/").replace(/\s+/g,"%20"),F=`
<script data-hyper-preview-error-bridge>
(() => {
  const send = (payload) => {
    try {
      window.parent.postMessage({ type: 'hyper-preview-error', payload }, '*');
    } catch (_) {}
  };

  window.addEventListener('error', (event) => {
    send({
      message: event.message || 'Preview runtime error',
      source: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      stack: event.error && event.error.stack ? String(event.error.stack) : '',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    send({
      message: reason && reason.message ? String(reason.message) : String(reason || 'Unhandled promise rejection'),
      source: '',
      lineno: 0,
      colno: 0,
      stack: reason && reason.stack ? String(reason.stack) : '',
    });
  });
})();
<\/script>`,ye=t=>t.includes("data-hyper-preview-error-bridge")?t:/<head[^>]*>/i.test(t)?t.replace(/<head[^>]*>/i,a=>`${a}
${F}`):`${F}
${t}`,be=(t,a)=>{if(a.size===0)return t;let s=t;return s=s.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,(n,i)=>{if(/^(https?:)?\/\//i.test(i)||i.startsWith("data:"))return n;const o=E(a,i);return o?`<style data-preview-inline="${i}">
${_e(o.content)}
</style>`:n}),s=s.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>(?:<\/script>)?/gi,(n,i)=>{if(/^(https?:)?\/\//i.test(i)||i.startsWith("data:"))return n;const o=E(a,i);return o?`<script data-preview-inline="${i}">
${xe(o.content)}
//# sourceURL=${je(o.path)}
<\/script>`:n}),s},L=`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      color: #7c8798;
      background: #f7f8fb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .empty {
      padding: 24px;
      text-align: center;
      border: 1px solid #d9e0ea;
      border-radius: 8px;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="empty">暂无可预览内容</div>
</body>
</html>`,Ne=({code:t,language:a,folderPath:s,files:n,onClose:i})=>{const[o,d]=u.useState("desktop"),[x,S]=u.useState(0),[h,b]=u.useState(""),[R,g]=u.useState(!1),N={desktop:{width:"100%",height:"100%"},tablet:{width:"820px",height:"min(100%, 1040px)"},mobile:{width:"390px",height:"min(100%, 860px)"}},_=u.useMemo(()=>{if(!s)return"";const l=s.replace(/\\/g,"/").lastIndexOf("/");return l>0?s.substring(0,l):""},[s]),p=u.useMemo(()=>s&&D(s)||"index.html",[s]);u.useEffect(()=>{let c=!1;return(async()=>{g(!0);try{let m=new Map;_&&(m=await ve(_)),n&&n.length>0&&fe(n).forEach((M,H)=>m.set(H,M)),t&&y(m,p,s||p,t);const v=/\.(html?|xhtml)$/i.test(p)||a==="html"||a==="htm";let f="";if(v&&t)f=t;else{const j=we(m);f=j&&m.get(j)?.content||""}!f&&t&&(f=t);const A=f?ye(be(f,m)):L;c||b(A)}catch{c||b(L)}finally{c||g(!1)}})(),()=>{c=!0}},[_,p,s,t,n,x,a]);const I=()=>{S(c=>c+1)},U=()=>{if(!h)return;const c=new Blob([h],{type:"text/html;charset=utf-8"}),l=URL.createObjectURL(c);if(!window.open(l,"_blank","noopener,noreferrer")){const v=document.createElement("a");v.href=l,v.target="_blank",v.rel="noopener noreferrer",v.click()}window.setTimeout(()=>URL.revokeObjectURL(l),6e4)},P=a==="html"||a==="htm"||h.includes("<html"),T=u.useMemo(()=>{let c=0;for(let l=0;l<h.length;l+=1)c=(c<<5)-c+h.charCodeAt(l)|0;return`${x}-${o}-${p}-${c}`},[p,o,x,h]);return P?e.jsxs("div",{className:r.container,children:[e.jsxs("div",{className:r.header,children:[e.jsxs("div",{className:r.title,children:[e.jsx($,{size:16}),e.jsx("span",{children:"预览"}),e.jsx("small",{children:p})]}),e.jsxs("div",{className:r.controls,children:[e.jsxs("div",{className:r.deviceToggle,children:[e.jsxs("button",{className:`${r.deviceBtn} ${o==="desktop"?r.active:""}`,onClick:()=>d("desktop"),title:"PC",type:"button",children:[e.jsx(O,{size:14}),e.jsx("span",{children:"PC"})]}),e.jsxs("button",{className:`${r.deviceBtn} ${o==="tablet"?r.active:""}`,onClick:()=>d("tablet"),title:"平板",type:"button",children:[e.jsx(W,{size:14}),e.jsx("span",{children:"平板"})]}),e.jsxs("button",{className:`${r.deviceBtn} ${o==="mobile"?r.active:""}`,onClick:()=>d("mobile"),title:"移动端",type:"button",children:[e.jsx(K,{size:14}),e.jsx("span",{children:"移动"})]})]}),e.jsxs("button",{className:r.openBtn,onClick:U,disabled:!h,title:"在浏览器打开",type:"button",children:[e.jsx(q,{size:14}),e.jsx("span",{children:"浏览器"})]}),e.jsx("button",{className:r.refreshBtn,onClick:I,title:"刷新",type:"button",children:e.jsx(z,{size:14})}),i&&e.jsx("button",{className:r.closeBtn,onClick:i,title:"关闭",type:"button",children:e.jsx(B,{size:16})})]})]}),e.jsx("div",{className:r.previewArea,children:e.jsxs("div",{className:`${r.deviceFrame} ${o==="tablet"?r.tablet:o==="mobile"?r.mobile:""}`,style:{width:N[o].width,height:N[o].height},children:[e.jsxs("div",{className:r.browserChrome,children:[e.jsx("span",{className:r.chromeDot}),e.jsx("span",{className:r.chromeDot}),e.jsx("span",{className:r.chromeDot}),e.jsxs("div",{className:r.addressBar,children:[e.jsx($,{size:12}),e.jsx("span",{children:p})]})]}),e.jsxs("div",{className:r.viewport,children:[e.jsx("iframe",{srcDoc:h,className:r.iframe,sandbox:"allow-scripts allow-same-origin allow-forms allow-popups",title:"Preview"},T),R&&e.jsxs("div",{className:r.loadingLayer,children:[e.jsx(z,{size:18}),e.jsx("span",{children:"刷新中"})]})]})]})})]}):e.jsxs("div",{className:r.container,children:[e.jsxs("div",{className:r.header,children:[e.jsxs("div",{className:r.title,children:[e.jsx(k,{size:16}),e.jsx("span",{children:"文件预览"})]}),i&&e.jsx("button",{className:r.closeBtn,onClick:i,title:"关闭",children:e.jsx(B,{size:16})})]}),e.jsxs("div",{className:r.unsupported,children:[e.jsx(k,{size:42}),e.jsx("p",{children:"当前文件不支持网页预览"}),e.jsx("p",{className:r.hint,children:"切到 HTML 入口文件，或在运行面板打开当前文件。"})]})]})};export{Ne as default};
