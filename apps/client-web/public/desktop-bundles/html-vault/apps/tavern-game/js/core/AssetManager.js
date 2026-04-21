/**
 * AssetManager - 资源管理器
 * V2.0 核心引擎组件
 * 负责加载、缓存和管理游戏资源（图片、音频、数据等）
 */

export class AssetManager {
    constructor(engine) {
        this.engine = engine;
        this.version = '2.0.0';

        // 资源缓存
        this.cache = new Map();

        // 资源清单
        this.manifest = {
            images: [],
            audio: [],
            data: []
        };

        // 加载状态
        this.loading = false;
        this.loadedCount = 0;
        this.totalCount = 0;
        this.loadProgress = 0;

        // 加载回调
        this.progressCallbacks = [];
        this.completeCallbacks = [];

        // 资源统计
        this.stats = {
            images: 0,
            audio: 0,
            data: 0,
            totalSize: 0,
            hits: 0,
            misses: 0
        };

        console.log('✅ 资源管理器已创建 (V2.0)');
    }

    /**
     * 初始化资源管理器
     */
    async initialize() {
        console.log('📦 初始化资源管理器...');

        try {
            // 加载资源清单
            await this.loadManifest();

            console.log('✅ 资源管理器初始化完成');
            return { success: true };
        } catch (error) {
            console.error('❌ 资源管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载资源清单
     */
    async loadManifest() {
        try {
            const response = await fetch('/assets/manifest.json');
            if (response.ok) {
                this.manifest = await response.json();
                console.log('📋 资源清单加载成功:', this.manifest);
            } else {
                console.warn('⚠️ 资源清单文件未找到，使用默认清单');
                this.createDefaultManifest();
            }
        } catch (error) {
            console.warn('⚠️ 加载资源清单失败，使用默认清单:', error);
            this.createDefaultManifest();
        }

        // 更新统计
        this.stats.images = this.manifest.images.length;
        this.stats.audio = this.manifest.audio.length;
        this.stats.data = this.manifest.data.length;
        this.totalCount = this.stats.images + this.stats.audio + this.stats.data;
    }

    /**
     * 创建默认资源清单
     */
    createDefaultManifest() {
        this.manifest = {
            images: [
                { id: 'tavern_bg', path: '/assets/images/tavern/bg.png', priority: 1 },
                { id: 'player_idle', path: '/assets/images/characters/player_idle.png', priority: 1 },
                { id: 'npc1', path: '/assets/images/characters/npc1.png', priority: 1 },
                { id: 'icon_sword', path: '/assets/images/icons/sword.png', priority: 2 },
                { id: 'icon_potion', path: '/assets/images/icons/potion.png', priority: 2 },
                { id: 'icon_card', path: '/assets/images/icons/card.png', priority: 2 }
            ],
            audio: [
                { id: 'bgm_main', path: '/assets/audio/bgm/main.mp3', type: 'music', priority: 1 },
                { id: 'bgm_battle', path: '/assets/audio/bgm/battle.mp3', type: 'music', priority: 2 },
                { id: 'sfx_attack', path: '/assets/audio/sfx/attack.wav', type: 'sfx', priority: 1 },
                { id: 'sfx_hit', path: '/assets/audio/sfx/hit.wav', type: 'sfx', priority: 1 },
                { id: 'sfx_victory', path: '/assets/audio/sfx/victory.wav', type: 'sfx', priority: 2 }
            ],
            data: [
                { id: 'items', path: '/assets/data/items.json', priority: 1 },
                { id: 'skills', path: '/assets/data/skills.json', priority: 1 },
                { id: 'enemies', path: '/assets/data/enemies.json', priority: 2 }
            ]
        };
    }

    /**
     * 加载所有资源
     */
    async loadAll() {
        if (this.loading) {
            console.warn('⚠️ 资源正在加载中');
            return;
        }

        this.loading = true;
        this.loadedCount = 0;
        this.loadProgress = 0;

        console.log(`📥 开始加载 ${this.totalCount} 个资源...`);

        try {
            // 按优先级加载
            const priority1Assets = [
                ...this.manifest.images.filter(i => i.priority === 1),
                ...this.manifest.audio.filter(a => a.priority === 1),
                ...this.manifest.data.filter(d => d.priority === 1)
            ];

            const priority2Assets = [
                ...this.manifest.images.filter(i => i.priority === 2),
                ...this.manifest.audio.filter(a => a.priority === 2),
                ...this.manifest.data.filter(d => d.priority === 2)
            ];

            // 加载P1资源
            await this.loadAssets(priority1Assets);

            // 加载P2资源
            await this.loadAssets(priority2Assets);

            this.loading = false;
            this.loadProgress = 100;

            // 触发完成回调
            this.completeCallbacks.forEach(callback => callback(this.stats));

            console.log('✅ 所有资源加载完成:', this.stats);
            return { success: true, stats: this.stats };
        } catch (error) {
            this.loading = false;
            console.error('❌ 资源加载失败:', error);
            throw error;
        }
    }

    /**
     * 加载资源列表
     */
    async loadAssets(assets) {
        const promises = assets.map(asset => this.loadAsset(asset));
        await Promise.all(promises);
    }

    /**
     * 加载单个资源
     */
    async loadAsset(asset) {
        try {
            let resource;

            if (this.manifest.images.find(i => i.id === asset.id)) {
                resource = await this.loadImage(asset);
            } else if (this.manifest.audio.find(a => a.id === asset.id)) {
                resource = await this.loadAudio(asset);
            } else if (this.manifest.data.find(d => d.id === asset.id)) {
                resource = await this.loadData(asset);
            }

            // 添加到缓存
            this.cache.set(asset.id, {
                resource: resource,
                type: asset.type,
                path: asset.path,
                loadedAt: Date.now(),
                size: this.estimateSize(resource)
            });

            this.loadedCount++;
            this.updateProgress();
            this.stats.totalSize += this.estimateSize(resource);

            console.log(`✅ [${this.loadedCount}/${this.totalCount}] ${asset.id} 加载完成`);
        } catch (error) {
            console.error(`❌ 资源 ${asset.id} 加载失败:`, error);
        }
    }

    /**
     * 加载图片
     */
    async loadImage(asset) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                console.log(`🖼️ 图片加载成功: ${asset.id}`);
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`⚠️ 图片加载失败: ${asset.id}`);
                // 返回占位图
                resolve(this.createPlaceholderImage(64, 64, '#888'));
            };

            img.src = asset.path;
        });
    }

    /**
     * 加载音频
     */
    async loadAudio(asset) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();

            audio.oncanplaythrough = () => {
                console.log(`🎵 音频加载成功: ${asset.id}`);
                resolve(audio);
            };

            audio.onerror = () => {
                console.warn(`⚠️ 音频加载失败: ${asset.id}`);
                resolve(null);
            };

            audio.src = asset.path;
            audio.preload = 'auto';
        });
    }

    /**
     * 加载数据
     */
    async loadData(asset) {
        try {
            const response = await fetch(asset.path);
            if (response.ok) {
                const data = await response.json();
                console.log(`📄 数据加载成功: ${asset.id}`);
                return data;
            } else {
                console.warn(`⚠️ 数据加载失败: ${asset.id}`);
                return {};
            }
        } catch (error) {
            console.error(`❌ 数据加载错误: ${asset.id}`, error);
            return {};
        }
    }

    /**
     * 创建占位图片
     */
    createPlaceholderImage(width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    }

    /**
     * 获取资源
     */
    get(id) {
        const cached = this.cache.get(id);

        if (cached) {
            this.stats.hits++;
            return cached.resource;
        } else {
            this.stats.misses++;
            console.warn(`⚠️ 资源未找到: ${id}`);
            return null;
        }
    }

    /**
     * 预加载资源
     */
    async preload(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id).resource;
        }

        // 在清单中查找资源
        let asset;
        asset = this.manifest.images.find(i => i.id === id);
        if (!asset) asset = this.manifest.audio.find(a => a.id === id);
        if (!asset) asset = this.manifest.data.find(d => d.id === id);

        if (asset) {
            await this.loadAsset(asset);
            return this.cache.get(id).resource;
        }

        return null;
    }

    /**
     * 释放资源
     */
    release(id) {
        const cached = this.cache.get(id);

        if (cached) {
            // 如果是图片，释放引用
            if (cached.resource instanceof HTMLImageElement) {
                cached.resource.src = '';
            }
            // 如果是音频，暂停并释放
            if (cached.resource instanceof HTMLAudioElement) {
                cached.resource.pause();
                cached.resource.src = '';
            }

            this.cache.delete(id);
            console.log(`🗑️ 资源已释放: ${id}`);
        }
    }

    /**
     * 释放所有缓存
     */
    releaseAll() {
        this.cache.forEach((_, id) => {
            this.release(id);
        });
        console.log('🗑️ 所有资源已释放');
    }

    /**
     * 更新进度
     */
    updateProgress() {
        this.loadProgress = Math.floor((this.loadedCount / this.totalCount) * 100);
        this.progressCallbacks.forEach(callback => {
            callback({
                loaded: this.loadedCount,
                total: this.totalCount,
                progress: this.loadProgress
            });
        });
    }

    /**
     * 注册进度回调
     */
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    /**
     * 注册完成回调
     */
    onComplete(callback) {
        this.completeCallbacks.push(callback);
    }

    /**
     * 估算资源大小
     */
    estimateSize(resource) {
        if (resource instanceof HTMLImageElement) {
            return resource.width * resource.height * 4; // 假设RGBA
        } else if (resource instanceof HTMLAudioElement) {
            return 1024 * 100; // 假设100KB
        } else if (typeof resource === 'object') {
            return JSON.stringify(resource).length;
        }
        return 0;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }

    /**
     * 导出缓存信息
     */
    exportCacheInfo() {
        const info = [];

        this.cache.forEach((value, key) => {
            info.push({
                id: key,
                type: value.type,
                path: value.path,
                loadedAt: new Date(value.loadedAt).toISOString(),
                size: value.size
            });
        });

        return info;
    }

    /**
     * 保存资源清单
     */
    async saveManifest() {
        try {
            const manifestData = JSON.stringify(this.manifest, null, 2);
            const blob = new Blob([manifestData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'manifest.json';
            a.click();

            URL.revokeObjectURL(url);
            console.log('💾 资源清单已保存');
        } catch (error) {
            console.error('❌ 保存资源清单失败:', error);
        }
    }

    /**
     * 关闭资源管理器
     */
    shutdown() {
        console.log('🛑 关闭资源管理器...');
        this.releaseAll();
        this.progressCallbacks = [];
        this.completeCallbacks = [];
        console.log('✅ 资源管理器已关闭');
    }
}

// 默认导出
export default AssetManager;
