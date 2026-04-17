/**
 * 地图系统
 * 提供交互式世界地图，支持探索、导航、地点详情
 */

export default class MapSystem {
    constructor() {
        this.currentMap = null;
        this.playerPosition = { x: 0, y: 0 };
        this.discoveredLocations = new Set();
        this.mapHistory = [];
        this.maps = {};
        this.minimapEnabled = true;
        this.fogOfWar = true;
    }

    async initialize() {
        console.log('🗺️ 地图系统初始化...');
        await this.loadMaps();
        await this.loadProgress();
    }

    /**
     * 预定义地图数据
     */
    getDefaultMaps() {
        return {
            'world': {
                id: 'world',
                name: '艾尔特大陆',
                type: 'world',
                size: { width: 2000, height: 1500 },
                tileSize: 50,
                locations: [
                    {
                        id: 'tavern',
                        name: '冒险者酒馆',
                        x: 1000,
                        y: 750,
                        icon: '🍺',
                        type: 'hub',
                        description: '冒险者的聚集地，可以在这里接取任务、休息、与其他玩家交流。',
                        services: ['rest', 'trade', 'quest', 'social'],
                        connections: ['forest', 'town']
                    },
                    {
                        id: 'forest',
                        name: '迷雾森林',
                        x: 800,
                        y: 600,
                        icon: '🌲',
                        type: 'dungeon',
                        level: { min: 1, max: 10 },
                        description: '被迷雾笼罩的古老森林，隐藏着无数秘密和危险。',
                        dangers: ['wolf', 'goblin', 'forest_spirit'],
                        treasures: ['herb', 'ancient_relic']
                    },
                    {
                        id: 'town',
                        name: '黎明镇',
                        x: 1200,
                        y: 750,
                        icon: '🏰',
                        type: 'town',
                        description: '繁华的边境城镇，贸易枢纽。',
                        shops: ['weapon', 'armor', 'potion', 'magic'],
                        npcs: ['blacksmith', 'merchant', 'healer']
                    },
                    {
                        id: 'mountain',
                        name: '龙骨山脉',
                        x: 1400,
                        y: 500,
                        icon: '⛰️',
                        type: 'dungeon',
                        level: { min: 20, max: 40 },
                        description: '传说中的巨龙栖息之地，充满危险但也蕴含巨大宝藏。',
                        dangers: ['dragon', 'golem', 'elemental'],
                        boss: 'ancient_dragon'
                    },
                    {
                        id: 'ruins',
                        name: '古代遗迹',
                        x: 600,
                        y: 900,
                        icon: '🏛️',
                        type: 'dungeon',
                        level: { min: 10, max: 25 },
                        description: '上古文明留下的遗迹，可能隐藏着失落的魔法。',
                        puzzles: true,
                        treasures: ['artifact', 'spell_scroll']
                    },
                    {
                        id: 'swamp',
                        name: '毒沼泽',
                        x: 900,
                        y: 1000,
                        icon: '🐸',
                        type: 'wilderness',
                        level: { min: 15, max: 30 },
                        description: '充满毒气和怪物的沼泽地。',
                        statusEffects: ['poison', 'slow']
                    },
                    {
                        id: 'desert',
                        name: '炎沙沙漠',
                        x: 1600,
                        y: 800,
                        icon: '🏜️',
                        type: 'wilderness',
                        level: { min: 25, max: 45 },
                        description: '烈日炎炎的沙漠地带，只有强者能生存。',
                        statusEffects: ['heat', 'thirst']
                    },
                    {
                        id: 'ocean',
                        name: '风暴海域',
                        x: 1700,
                        y: 650,
                        icon: '🌊',
                        type: 'water',
                        level: { min: 30, max: 50 },
                        description: '神秘的海域，海底可能存在亚特兰蒂斯遗迹。',
                        requires: ['ship', 'diving_skill']
                    }
                ],
                regions: [
                    {
                        id: 'central',
                        name: '中央平原',
                        x: 1000,
                        y: 750,
                        radius: 300,
                        color: '#4CAF50',
                        description: '文明核心区域'
                    },
                    {
                        id: 'wild_north',
                        name: '荒野北境',
                        x: 1400,
                        y: 500,
                        radius: 250,
                        color: '#795548',
                        description: '危险的荒野地带'
                    }
                ],
                paths: [
                    { from: 'tavern', to: 'forest', type: 'road', difficulty: 1 },
                    { from: 'tavern', to: 'town', type: 'road', difficulty: 0.5 },
                    { from: 'town', to: 'mountain', type: 'trail', difficulty: 2 },
                    { from: 'forest', to: 'ruins', type: 'forest_path', difficulty: 1.5 },
                    { from: 'forest', to: 'swamp', type: 'danger_path', difficulty: 2.5 }
                ]
            },
            'interior_tavern': {
                id: 'interior_tavern',
                name: '酒馆内部',
                type: 'interior',
                parent: 'tavern',
                size: { width: 800, height: 600 },
                locations: [
                    {
                        id: 'bar_counter',
                        name: '吧台',
                        x: 100,
                        y: 300,
                        icon: '🍷',
                        type: 'npc',
                        description: '酒保老约翰在这里，可以购买酒水打探消息。',
                        npc: 'tavern_keeper'
                    },
                    {
                        id: 'quest_board',
                        name: '任务板',
                        x: 400,
                        y: 100,
                        icon: '📋',
                        type: 'quest',
                        description: '查看可接受的委托任务。'
                    },
                    {
                        id: 'fireplace',
                        name: '壁炉',
                        x: 700,
                        y: 500,
                        icon: '🔥',
                        type: 'rest',
                        description: '温暖的火炉，可以在这里休息和聆听故事。'
                    },
                    {
                        id: 'corner_table',
                        name: '角落桌位',
                        x: 700,
                        y: 200,
                        icon: '🪑',
                        type: 'social',
                        description: '安静的角落，适合私密交谈。'
                    }
                ]
            }
        };
    }

    /**
     * 加载地图数据
     */
    async loadMaps() {
        try {
            const savedMaps = localStorage.getItem('rpg_maps');
            if (savedMaps) {
                this.maps = JSON.parse(savedMaps);
            } else {
                this.maps = this.getDefaultMaps();
                await this.saveMaps();
            }

            // 加载当前地图
            const currentMapId = localStorage.getItem('rpg_current_map');
            if (currentMapId && this.maps[currentMapId]) {
                this.currentMap = this.maps[currentMapId];
            } else {
                this.currentMap = this.maps['world'];
            }
        } catch (e) {
            console.error('加载地图失败:', e);
            this.maps = this.getDefaultMaps();
            this.currentMap = this.maps['world'];
        }
    }

    /**
     * 保存地图数据
     */
    async saveMaps() {
        try {
            localStorage.setItem('rpg_maps', JSON.stringify(this.maps));
        } catch (e) {
            console.error('保存地图失败:', e);
        }
    }

    /**
     * 加载进度
     */
    async loadProgress() {
        try {
            const progress = localStorage.getItem('rpg_map_progress');
            if (progress) {
                const data = JSON.parse(progress);
                this.discoveredLocations = new Set(data.discoveredLocations || []);
                this.playerPosition = data.playerPosition || { x: 1000, y: 750 };
                this.mapHistory = data.mapHistory || [];
            } else {
                // 默认发现酒馆
                this.discoveredLocations.add('tavern');
                this.playerPosition = { x: 1000, y: 750 };
            }
        } catch (e) {
            console.error('加载地图进度失败:', e);
        }
    }

    /**
     * 保存进度
     */
    async saveProgress() {
        try {
            const progress = {
                discoveredLocations: Array.from(this.discoveredLocations),
                playerPosition: this.playerPosition,
                mapHistory: this.mapHistory,
                currentMapId: this.currentMap?.id
            };
            localStorage.setItem('rpg_map_progress', JSON.stringify(progress));
            localStorage.setItem('rpg_current_map', this.currentMap?.id || 'world');
        } catch (e) {
            console.error('保存地图进度失败:', e);
        }
    }

    /**
     * 切换地图
     */
    switchMap(mapId) {
        if (this.maps[mapId]) {
            this.mapHistory.push(this.currentMap.id);
            this.currentMap = this.maps[mapId];
            this.playerPosition = { x: this.currentMap.size.width / 2, y: this.currentMap.size.height / 2 };
            this.saveProgress();
            return { success: true, map: this.currentMap };
        }
        return { success: false, error: '地图不存在' };
    }

    /**
     * 返回上一张地图
     */
    returnToPreviousMap() {
        if (this.mapHistory.length > 0) {
            const previousMapId = this.mapHistory.pop();
            this.currentMap = this.maps[previousMapId];
            this.saveProgress();
            return { success: true, map: this.currentMap };
        }
        return { success: false, error: '没有上一张地图' };
    }

    /**
     * 移动到指定位置
     */
    moveTo(x, y) {
        // 边界检查
        const { width, height } = this.currentMap.size;
        x = Math.max(0, Math.min(width, x));
        y = Math.max(0, Math.min(height, y));

        this.playerPosition = { x, y };

        // 检查是否发现新地点
        this.checkLocationDiscovery(x, y);

        this.saveProgress();
        return { success: true, position: this.playerPosition };
    }

    /**
     * 检查地点发现
     */
    checkLocationDiscovery(x, y) {
        for (const location of this.currentMap.locations) {
            const distance = Math.sqrt(
                Math.pow(x - location.x, 2) + Math.pow(y - location.y, 2)
            );

            if (distance < 100 && !this.discoveredLocations.has(location.id)) {
                this.discoveredLocations.add(location.id);
                return { discovered: true, location };
            }
        }
        return { discovered: false };
    }

    /**
     * 获取当前位置附近的地点
     */
    getNearbyLocations(radius = 150) {
        return this.currentMap.locations.filter(location => {
            const distance = Math.sqrt(
                Math.pow(this.playerPosition.x - location.x, 2) +
                Math.pow(this.playerPosition.y - location.y, 2)
            );
            return distance < radius;
        });
    }

    /**
     * 获取指定地点详情
     */
    getLocationDetails(locationId) {
        const location = this.currentMap.locations.find(l => l.id === locationId);
        if (location) {
            const discovered = this.discoveredLocations.has(locationId);
            return {
                ...location,
                discovered,
                canAccess: discovered || !this.fogOfWar
            };
        }
        return null;
    }

    /**
     * 计算两点间的距离
     */
    calculateDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2)
        );
    }

    /**
     * 查找路径（简化版）
     */
    findPath(fromId, toId) {
        const path = this.currentMap.paths.find(p =>
            (p.from === fromId && p.to === toId) ||
            (p.to === fromId && p.from === toId)
        );

        if (path) {
            const from = this.currentMap.locations.find(l => l.id === fromId);
            const to = this.currentMap.locations.find(l => l.id === toId);
            const distance = this.calculateDistance(from, to);

            return {
                path,
                distance,
                estimatedTime: Math.ceil(distance / 50 * path.difficulty)
            };
        }
        return null;
    }

    /**
     * 获取地图渲染数据
     */
    getRenderData() {
        return {
            map: this.currentMap,
            playerPosition: this.playerPosition,
            discoveredLocations: Array.from(this.discoveredLocations),
            fogOfWar: this.fogOfWar,
            minimapEnabled: this.minimapEnabled
        };
    }

    /**
     * 切换迷雾模式
     */
    toggleFogOfWar() {
        this.fogOfWar = !this.fogOfWar;
        this.saveProgress();
        return this.fogOfWar;
    }

    /**
     * 切换小地图
     */
    toggleMinimap() {
        this.minimapEnabled = !this.minimapEnabled;
        return this.minimapEnabled;
    }

    /**
     * 添加自定义地点
     */
    addLocation(location) {
        this.currentMap.locations.push(location);
        this.saveMaps();
        return { success: true, location };
    }

    /**
     * 创建新地图
     */
    createMap(mapData) {
        const map = {
            id: mapData.id || `custom_${Date.now()}`,
            name: mapData.name,
            type: mapData.type || 'custom',
            size: mapData.size || { width: 1000, height: 800 },
            tileSize: mapData.tileSize || 50,
            locations: mapData.locations || [],
            regions: mapData.regions || [],
            paths: mapData.paths || []
        };

        this.maps[map.id] = map;
        this.saveMaps();
        return { success: true, map };
    }

    /**
     * 导出地图数据
     */
    exportMaps() {
        return JSON.stringify(this.maps, null, 2);
    }

    /**
     * 导入地图数据
     */
    async importMaps(mapData) {
        try {
            const maps = typeof mapData === 'string' ? JSON.parse(mapData) : mapData;
            this.maps = { ...this.maps, ...maps };
            await this.saveMaps();
            return { success: true };
        } catch (e) {
            return { success: false, error: '导入失败: ' + e.message };
        }
    }

    /**
     * 保存游戏数据
     */
    async save() {
        await this.saveProgress();
        await this.saveMaps();
        return {
            discoveredLocations: Array.from(this.discoveredLocations),
            playerPosition: this.playerPosition,
            currentMapId: this.currentMap?.id
        };
    }

    /**
     * 加载游戏数据
     */
    async load(data) {
        if (data) {
            this.discoveredLocations = new Set(data.discoveredLocations || []);
            this.playerPosition = data.playerPosition || { x: 0, y: 0 };
            if (data.currentMapId) {
                this.currentMap = this.maps[data.currentMapId] || this.maps['world'];
            }
        }
    }
}
