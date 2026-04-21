/**
 * RAG 上下文检索系统 - AI酒馆增强版
 * 
 * 参考 StoryForge 的知识图谱和向量检索
 * 
 * 特性:
 * - 语义分块
 * - 向量相似度检索
 * - 知识图谱构建
 * - 上下文增强
 */

import { dbManager } from '../core/db_manager.js';
import { eventBus } from '../core/event_bus.js';

class TextChunker {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 500;
        this.overlap = options.overlap || 50;
        this.minChunkSize = options.minChunkSize || 100;
    }

    chunk(text) {
        const chunks = [];
        const paragraphs = text.split(/\n\n+/);
        
        let currentChunk = '';
        let chunkIndex = 0;
        
        for (const para of paragraphs) {
            if (currentChunk.length + para.length > this.chunkSize && currentChunk.length >= this.minChunkSize) {
                chunks.push({
                    id: `chunk_${chunkIndex++}`,
                    content: currentChunk.trim(),
                    length: currentChunk.length
                });
                
                const overlapText = currentChunk.slice(-this.overlap);
                currentChunk = overlapText + para;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + para;
            }
        }
        
        if (currentChunk.trim().length >= this.minChunkSize) {
            chunks.push({
                id: `chunk_${chunkIndex}`,
                content: currentChunk.trim(),
                length: currentChunk.length
            });
        }
        
        return chunks;
    }

    chunkBySection(text, sectionMarkers = ['第', '章', '【', '##']) {
        const sections = [];
        let currentSection = { title: '开头', content: '' };
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            const isSectionStart = sectionMarkers.some(marker => 
                line.startsWith(marker) || line.includes(marker)
            );
            
            if (isSectionStart && currentSection.content.length > this.minChunkSize) {
                sections.push({ ...currentSection });
                currentSection = { title: line.trim(), content: '' };
            } else {
                currentSection.content += line + '\n';
            }
        }
        
        if (currentSection.content.trim()) {
            sections.push(currentSection);
        }
        
        return sections;
    }
}

class SimpleEmbedding {
    constructor() {
        this.vocab = new Map();
        this.dim = 128;
    }

    _tokenize(text) {
        const tokens = [];
        const words = text.toLowerCase().match(/[\u4e00-\u9fa5]|[a-z]+|\d+/g) || [];
        
        for (const word of words) {
            if (word.length === 1 && /[\u4e00-\u9fa5]/.test(word)) {
                tokens.push(word);
            } else if (word.length > 1) {
                for (let i = 0; i < word.length - 1; i++) {
                    tokens.push(word.slice(i, i + 2));
                }
            }
        }
        
        return tokens;
    }

    embed(text) {
        const tokens = this._tokenize(text);
        const embedding = new Array(this.dim).fill(0);
        
        for (const token of tokens) {
            const hash = this._hashToken(token);
            embedding[hash % this.dim] += 1;
        }
        
        const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
        return embedding.map(v => v / norm);
    }

    _hashToken(token) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash << 5) - hash) + token.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    similarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        
        let dotProduct = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
        }
        
        return dotProduct;
    }
}

class KnowledgeGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(id, type, data) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, { id, type, data, connections: [] });
        }
        return this.nodes.get(id);
    }

    addEdge(from, to, relation, weight = 1) {
        const fromNode = this.nodes.get(from);
        const toNode = this.nodes.get(to);
        
        if (fromNode && toNode) {
            this.edges.push({ from, to, relation, weight });
            fromNode.connections.push(to);
            toNode.connections.push(from);
        }
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getConnectedNodes(id, maxDepth = 2) {
        const visited = new Set();
        const result = [];
        const queue = [{ id, depth: 0 }];
        
        while (queue.length > 0) {
            const { id: currentId, depth } = queue.shift();
            
            if (visited.has(currentId) || depth > maxDepth) continue;
            visited.add(currentId);
            
            const node = this.nodes.get(currentId);
            if (node && depth > 0) {
                result.push(node);
            }
            
            if (node && depth < maxDepth) {
                for (const connectedId of node.connections) {
                    if (!visited.has(connectedId)) {
                        queue.push({ id: connectedId, depth: depth + 1 });
                    }
                }
            }
        }
        
        return result;
    }

    extractEntities(text) {
        const entities = [];
        
        const patterns = [
            { type: 'character', pattern: /[\u4e00-\u9fa5]{2,4}(说|道|想|看|走|跑|站|坐)/g },
            { type: 'location', pattern: /[在到去离回][\u4e00-\u9fa5]{2,8}[里外内前]/g },
            { type: 'item', pattern: /[一把一张一个][\u4e00-\u9fa5]{2,6}/g },
            { type: 'time', pattern: /\d+年|\d+月|\d+日|今天|明天|昨天|早上|晚上|中午/g }
        ];
        
        for (const { type, pattern } of patterns) {
            const matches = text.match(pattern) || [];
            for (const match of matches) {
                const name = match.replace(/[说想看走跑站坐在到去离回里外内前一把一张一个]/g, '').trim();
                if (name.length >= 2 && name.length <= 8) {
                    entities.push({ type, name, context: match });
                }
            }
        }
        
        return entities;
    }

    buildFromText(text, sourceId) {
        const entities = this.extractEntities(text);
        
        for (const entity of entities) {
            this.addNode(`${entity.type}_${entity.name}`, entity.type, {
                name: entity.name,
                sourceId,
                context: entity.context
            });
        }
        
        const entityNames = entities.map(e => e.name);
        for (let i = 0; i < entityNames.length; i++) {
            for (let j = i + 1; j < entityNames.length; j++) {
                const distance = Math.abs(text.indexOf(entities[i].context) - text.indexOf(entities[j].context));
                if (distance < 500) {
                    this.addEdge(
                        `${entities[i].type}_${entityNames[i]}`,
                        `${entities[j].type}_${entityNames[j]}`,
                        'co-occurrence',
                        1 / (distance + 1)
                    );
                }
            }
        }
        
        return entities;
    }

    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges
        };
    }

    static fromJSON(data) {
        const kg = new KnowledgeGraph();
        for (const node of data.nodes) {
            kg.nodes.set(node.id, node);
        }
        kg.edges = data.edges;
        return kg;
    }
}

class RAGSystem {
    constructor(dbManager) {
        this.db = dbManager;
        this.chunker = new TextChunker();
        this.embedder = new SimpleEmbedding();
        this.knowledgeGraph = new KnowledgeGraph();
        this.vectorStore = new Map();
        this.documentStore = new Map();
        this._initialized = false;
    }

    async init() {
        try {
            await this._loadStoredData();
            this._initialized = true;
            console.log('RAG System initialized');
        } catch (e) {
            console.warn('RAG init warning:', e);
        }
    }

    async _loadStoredData() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.db.db.name, this.db.db.version + 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('rag_chunks')) {
                    db.createObjectStore('rag_chunks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('rag_documents')) {
                    db.createObjectStore('rag_documents', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('rag_knowledge_graph')) {
                    db.createObjectStore('rag_knowledge_graph', { keyPath: 'id' });
                }
            };
            request.onsuccess = async () => {
                try {
                    const chunks = await this._getAllFromStore('rag_chunks');
                    for (const chunk of chunks) {
                        this.vectorStore.set(chunk.id, {
                            embedding: chunk.embedding,
                            content: chunk.content,
                            metadata: chunk.metadata
                        });
                    }
                    
                    const docs = await this._getAllFromStore('rag_documents');
                    for (const doc of docs) {
                        this.documentStore.set(doc.id, doc);
                    }
                    
                    const kgData = await this._getAllFromStore('rag_knowledge_graph');
                    if (kgData.length > 0) {
                        this.knowledgeGraph = KnowledgeGraph.fromJSON(kgData[0].data);
                    }
                    
                    resolve();
                } catch (e) {
                    reject(e);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async _getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async _putToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async indexDocument(docId, content, metadata = {}) {
        const chunks = this.chunker.chunk(content);
        const docData = {
            id: docId,
            content,
            metadata,
            chunkCount: chunks.length,
            indexedAt: Date.now()
        };
        
        this.documentStore.set(docId, docData);
        await this._putToStore('rag_documents', docData);
        
        for (const chunk of chunks) {
            const chunkId = `${docId}_${chunk.id}`;
            const embedding = this.embedder.embed(chunk.content);
            
            const chunkData = {
                id: chunkId,
                docId,
                content: chunk.content,
                embedding: Array.from(embedding),
                metadata: { ...metadata, length: chunk.length }
            };
            
            this.vectorStore.set(chunkId, {
                embedding,
                content: chunk.content,
                metadata: chunkData.metadata
            });
            
            await this._putToStore('rag_chunks', chunkData);
            
            this.knowledgeGraph.buildFromText(chunk.content, chunkId);
        }
        
        await this._putToStore('rag_knowledge_graph', {
            id: 'main_graph',
            data: this.knowledgeGraph.toJSON()
        });
        
        eventBus.emit('rag-indexed', { docId, chunkCount: chunks.length });
        
        return { docId, chunkCount: chunks.length };
    }

    async search(query, options = {}) {
        const topK = options.topK || 5;
        const minScore = options.minScore || 0.3;
        const includeContext = options.includeContext !== false;
        
        const queryEmbedding = this.embedder.embed(query);
        
        const scored = [];
        for (const [id, data] of this.vectorStore) {
            const score = this.embedder.similarity(queryEmbedding, data.embedding);
            if (score >= minScore) {
                scored.push({ id, score, ...data });
            }
        }
        
        scored.sort((a, b) => b.score - a.score);
        const topResults = scored.slice(0, topK);
        
        if (includeContext) {
            for (const result of topResults) {
                const relatedEntities = this.knowledgeGraph.extractEntities(result.content);
                result.entities = relatedEntities;
            }
        }
        
        return topResults;
    }

    async getContext(query, maxTokens = 2000) {
        const results = await this.search(query, { topK: 10 });
        
        let context = '';
        let totalTokens = 0;
        
        for (const result of results) {
            const chunkTokens = Math.ceil(result.content.length / 2);
            
            if (totalTokens + chunkTokens <= maxTokens) {
                context += `\n【相关片段 (相似度: ${result.score.toFixed(2)})】\n${result.content}\n`;
                totalTokens += chunkTokens;
            } else {
                break;
            }
        }
        
        return {
            context,
            sources: results.map(r => ({
                id: r.id,
                score: r.score,
                preview: r.content.slice(0, 100) + '...'
            })),
            totalTokens
        };
    }

    async getRelatedEntities(query) {
        const results = await this.search(query, { topK: 3, includeContext: false });
        const allEntities = new Map();
        
        for (const result of results) {
            const entities = this.knowledgeGraph.extractEntities(result.content);
            for (const entity of entities) {
                const key = `${entity.type}_${entity.name}`;
                if (!allEntities.has(key)) {
                    allEntities.set(key, { ...entity, occurrences: 0 });
                }
                allEntities.get(key).occurrences++;
            }
        }
        
        return Array.from(allEntities.values())
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 10);
    }

    async deleteDocument(docId) {
        const doc = this.documentStore.get(docId);
        if (!doc) return false;
        
        for (let i = 0; i < doc.chunkCount; i++) {
            const chunkId = `${docId}_chunk_${i}`;
            this.vectorStore.delete(chunkId);
        }
        
        this.documentStore.delete(docId);
        
        return true;
    }

    getStats() {
        return {
            documentCount: this.documentStore.size,
            chunkCount: this.vectorStore.size,
            nodeCount: this.knowledgeGraph.nodes.size,
            edgeCount: this.knowledgeGraph.edges.length
        };
    }

    async clear() {
        this.vectorStore.clear();
        this.documentStore.clear();
        this.knowledgeGraph = new KnowledgeGraph();
        
        const stores = ['rag_chunks', 'rag_documents', 'rag_knowledge_graph'];
        for (const store of stores) {
            try {
                await this._clearStore(store);
            } catch (e) {
                console.warn(`Clear store ${store} error:`, e);
            }
        }
    }

    async _clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}

class ContextEnhancer {
    constructor(ragSystem, memorySystem) {
        this.rag = ragSystem;
        this.memory = memorySystem;
        this.maxContextTokens = 4000;
    }

    async enhancePrompt(userInput, gameContext = {}) {
        const parts = [];
        
        if (gameContext.systemPrompt) {
            parts.push({ role: 'system', content: gameContext.systemPrompt, priority: 10 });
        }
        
        if (gameContext.worldSetting) {
            parts.push({ role: 'system', content: `【世界观】\n${gameContext.worldSetting}`, priority: 8 });
        }
        
        const ragContext = await this.rag.getContext(userInput, 1000);
        if (ragContext.context) {
            parts.push({ role: 'system', content: `【相关知识】\n${ragContext.context}`, priority: 6 });
        }
        
        const memoryContext = this.memory.getContext(1500);
        parts.push(...memoryContext.map(m => ({
            role: m.role,
            content: m.content,
            priority: 5
        })));
        
        parts.sort((a, b) => b.priority - a.priority);
        
        let totalTokens = 0;
        const enhanced = [];
        
        for (const part of parts) {
            const tokens = Math.ceil(part.content.length / 2);
            if (totalTokens + tokens <= this.maxContextTokens) {
                enhanced.push({ role: part.role, content: part.content });
                totalTokens += tokens;
            }
        }
        
        enhanced.push({ role: 'user', content: userInput });
        
        return {
            messages: enhanced,
            stats: {
                totalTokens,
                ragSources: ragContext.sources.length,
                memoryItems: memoryContext.length
            }
        };
    }

    async learnFromInteraction(userInput, aiResponse, metadata = {}) {
        await this.rag.indexDocument(
            `interaction_${Date.now()}`,
            `用户: ${userInput}\nAI: ${aiResponse}`,
            { type: 'interaction', ...metadata }
        );
        
        this.memory.addMessage(aiResponse, 'assistant', {
            tags: metadata.tags || [],
            persistent: metadata.important || false
        });
    }
}

export {
    RAGSystem,
    ContextEnhancer,
    TextChunker,
    SimpleEmbedding,
    KnowledgeGraph
};
