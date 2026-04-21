/**
 * 上下文系统 — 已拆分为独立模块
 * 
 * 拆分后的文件结构:
 *   memory.js        → MemorySystem (三层记忆系统)
 *   rag.js           → RAGSystem (RAG检索引擎)
 *   fusion_helper.js → FusionBookSystem + ContextHelper (拆书系统 + 上下文助手)
 *   fusion_book.js   → Modules.fusion_book (融合拆书 UI)
 *   rag_ui.js        → Modules.rag_context (RAG上下文 UI)
 *   memory_ui.js     → Modules.memory_system (三层记忆 UI)
 * 
 * 此文件已废弃，请直接引入上述子模块。
 * 如果你看到这个文件被加载，说明 index.html 还没更新。
 */
console.warn('[context.js] 此文件已拆分为6个子模块，请检查 index.html 是否已更新引入路径。');
