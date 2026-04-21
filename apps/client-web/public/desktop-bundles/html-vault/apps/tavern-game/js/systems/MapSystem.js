/**
 * 地图系统
 * 管理游戏地图、位置和移动
 */

export class MapSystem {
    constructor(engine) {
        this.engine = engine;
        this.mapCanvas = null;
        this.ctx = null;
        this.playerPosition = { x: 50, y: 50 };
        this.locations = [];
        this.currentLocation = 'tavern';
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[MapSystem] 初始化地图系统...');

        // 初始化地图画布
        this.mapCanvas = document.getElementById('map-canvas');
        if (this.mapCanvas) {
            this.ctx = this.mapCanvas.getContext('2d');
            this.setupCanvas();
        }

        // 初始化位置数据
        this.initializeLocations();

        this.isInitialized = true;
        console.log('[MapSystem] 地图系统初始化完成');

        // 开始绘制地图
        this.render();
    }

    // 设置画布
    setupCanvas() {
        if (!this.mapCanvas) return;

        const parent = this.mapCanvas.parentElement;
        this.mapCanvas.width = parent.clientWidth;
        this.mapCanvas.height = parent.clientHeight;

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.mapCanvas.width = parent.clientWidth;
            this.mapCanvas.height = parent.clientHeight;
            this.render();
        });
    }

    // 初始化位置数据
    initializeLocations() {
        this.locations = [
            {
                id: 'tavern',
                name: '冒险者酒馆',
                x: 100,
                y: 150,
                type: 'city',
                description: '冒险者们的聚集地，可以在这里休息、购买物品和接取任务。',
                connections: ['forest', 'village']
            },
            {
                id: 'forest',
                name: '迷雾森林',
                x: 300,
                y: 100,
                type: 'danger',
                description: '神秘的森林中充满了危险，但也有许多宝藏。',
                connections: ['tavern', 'mountain']
            },
            {
                id: 'village',
                name: '宁静村庄',
                x: 100,
                y: 300,
                type: 'city',
                description: '一个和平的小村庄，村民们友善好客。',
                connections: ['tavern', 'temple']
            },
            {
                id: 'mountain',
                name: '龙骨山脉',
                x: 400,
                y: 200,
                type: 'danger',
                description: '险峻的山脉，传说中龙族的栖息地。',
                connections: ['forest', 'cave']
            },
            {
                id: 'temple',
                name: '古神神庙',
                x: 200,
                y: 400,
                type: 'city',
                description: '古老的祭司们守护着神庙，可以学习神圣魔法。',
                connections: ['village', 'ruins']
            },
            {
                id: 'cave',
                name: '黑暗洞穴',
                x: 500,
                y: 300,
                type: 'danger',
                description: '幽深的洞穴中隐藏着未知的危险。',
                connections: ['mountain', 'dungeon']
            },
            {
                id: 'ruins',
                name: '古代遗迹',
                x: 350,
                y: 450,
                type: 'danger',
                description: '古代文明的遗迹，也许能找到强大的神器。',
                connections: ['temple', 'cave']
            },
            {
                id: 'dungeon',
                name: '深渊地牢',
                x: 600,
                y: 400,
                type: 'danger',
                description: '最深层的地牢，传说中的魔王就在这里。',
                connections: ['cave']
            }
        ];

        // 更新玩家位置到当前位置
        const currentLoc = this.locations.find(l => l.id === this.currentLocation);
        if (currentLoc) {
            this.playerPosition = { x: currentLoc.x, y: currentLoc.y };
        }
    }

    // 渲染地图
    render() {
        if (!this.ctx || !this.mapCanvas) return;

        const width = this.mapCanvas.width;
        const height = this.mapCanvas.height;

        // 清空画布
        this.ctx.clearRect(0, 0, width, height);

        // 绘制背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, width, height);

        // 绘制连接线
        this.drawConnections();

        // 绘制位置点
        this.locations.forEach(location => {
            this.drawLocation(location);
        });

        // 绘制玩家
        this.drawPlayer();
    }

    // 绘制连接线
    drawConnections() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;

        this.locations.forEach(location => {
            location.connections.forEach(connectionId => {
                const connected = this.locations.find(l => l.id === connectionId);
                if (connected) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(location.x, location.y);
                    this.ctx.lineTo(connected.x, connected.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    // 绘制位置
    drawLocation(location) {
        const isCurrent = location.id === this.currentLocation;

        // 根据类型选择颜色
        let color;
        switch (location.type) {
            case 'city':
                color = '#4CAF50';
                break;
            case 'danger':
                color = '#e53935';
                break;
            default:
                color = '#FFC107';
        }

        // 绘制位置点
        this.ctx.beginPath();
        this.ctx.arc(location.x, location.y, isCurrent ? 15 : 10, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // 当前位置添加光晕效果
        if (isCurrent) {
            this.ctx.beginPath();
            this.ctx.arc(location.x, location.y, 20, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // 绘制名称
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(location.name, location.x, location.y + 25);
    }

    // 绘制玩家
    drawPlayer() {
        const currentLoc = this.locations.find(l => l.id === this.currentLocation);
        if (!currentLoc) return;

        // 在当前位置上方绘制玩家标记
        this.ctx.beginPath();
        this.ctx.arc(currentLoc.x, currentLoc.y - 25, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFC107';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // 移动到指定位置
    moveTo(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) {
            console.warn(`[MapSystem] 位置 "${locationId}" 不存在`);
            return false;
        }

        // 检查是否可以从当前位置到达目标位置
        const currentLoc = this.locations.find(l => l.id === this.currentLocation);
        if (!currentLoc.connections.includes(locationId)) {
            console.warn(`[MapSystem] 无法从 "${currentLoc.name}" 移动到 "${location.name}"`);
            return false;
        }

        // 更新当前位置
        this.currentLocation = locationId;
        this.playerPosition = { x: location.x, y: location.y };

        // 更新UI
        this.updateLocationInfo();

        // 触发事件
        if (window.game) {
            game.emit('location-changed', { location: location });
        }

        console.log(`[MapSystem] 移动到: ${location.name}`);
        return true;
    }

    // 获取当前位置描述
    getCurrentLocationDescription() {
        const location = this.locations.find(l => l.id === this.currentLocation);
        if (!location) return '未知位置';

        return `当前位置: ${location.name}\n\n${location.description}\n\n可前往: ${
            location.connections.map(id => {
                const loc = this.locations.find(l => l.id === id);
                return loc ? loc.name : id;
            }).join(', ')
        }`;
    }

    // 更新位置信息显示
    updateLocationInfo() {
        const location = this.locations.find(l => l.id === this.currentLocation);
        if (!location) return;

        // 更新当前位置显示
        const locationEl = document.getElementById('current-location');
        if (locationEl) {
            locationEl.textContent = location.name;
        }

        // 更新地图上的位置信息
        const locationInfoEl = document.getElementById('location-info');
        if (locationInfoEl) {
            locationInfoEl.innerHTML = `
                <div style="padding: 15px; background: rgba(0,0,0,0.5); border-radius: 8px; margin-top: 15px;">
                    <h3 style="color: var(--accent); margin-bottom: 10px;">${location.name}</h3>
                    <p style="font-size: 14px; line-height: 1.6;">${location.description}</p>
                    <div style="margin-top: 15px;">
                        <strong>可前往:</strong>
                        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                            ${location.connections.map(id => {
                                const loc = this.locations.find(l => l.id === id);
                                return loc ? `<button class="btn" onclick="mapSystem.moveTo('${id}')">${loc.name}</button>` : '';
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // 重新渲染地图
        this.render();
    }

    // 获取所有位置
    getLocations() {
        return this.locations;
    }

    // 获取当前位置
    getCurrentLocation() {
        return this.locations.find(l => l.id === this.currentLocation);
    }
}
