// ========== 地图系统 ==========

class MapSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentLocation = 'tavern';
        this.playerPosition = { x: 400, y: 300 };
        this.mapScale = 1;
        this.isInitialized = false;
        this.animationId = null;
        this.particles = [];
    }

    // 初始化地图
    init() {
        this.canvas = document.getElementById('map-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // 添加事件监听
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.isInitialized = true;
        this.startAnimation();
        this.updateLocationInfo();
    }

    // 调整画布大小
    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // 开始动画循环
    startAnimation() {
        const animate = () => {
            this.render();
            this.updateParticles();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    // 渲染地图
    render() {
        if (!this.ctx) return;

        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.drawBackground();

        // 绘制连接线
        this.drawConnections();

        // 绘制位置
        this.drawLocations();

        // 绘制玩家
        this.drawPlayer();

        // 绘制粒子效果
        this.drawParticles();
    }

    // 绘制背景
    drawBackground() {
        // 绘制网格
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // 绘制装饰性元素
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 137) % this.canvas.width;
            const y = (i * 89) % this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 绘制连接线
    drawConnections() {
        const locations = Object.values(GameData.locations);
        const center = this.getCenter();

        this.ctx.strokeStyle = 'rgba(116, 185, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // 连接所有位置到中心
        locations.forEach(loc => {
            const x = this.scaleX(loc.x);
            const y = this.scaleY(loc.y);
            
            this.ctx.beginPath();
            this.ctx.moveTo(center.x, center.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        });

        this.ctx.setLineDash([]);
    }

    // 绘制位置
    drawLocations() {
        const locations = Object.values(GameData.locations);
        const time = Date.now() / 1000;

        locations.forEach(loc => {
            const x = this.scaleX(loc.x);
            const y = this.scaleY(loc.y);
            const isCurrent = loc.icon === GameData.locations[this.currentLocation]?.icon;
            const pulseSize = Math.sin(time * 2 + loc.x) * 5;

            // 绘制光晕效果（当前位置）
            if (isCurrent) {
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 50);
                gradient.addColorStop(0, 'rgba(116, 185, 255, 0.4)');
                gradient.addColorStop(1, 'rgba(116, 185, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 50 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // 绘制位置背景
            this.ctx.fillStyle = isCurrent ? '#74b9ff' : 'rgba(45, 52, 54, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制位置边框
            this.ctx.strokeStyle = isCurrent ? '#fff' : '#636e72';
            this.ctx.lineWidth = isCurrent ? 3 : 2;
            this.ctx.stroke();

            // 绘制图标
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(loc.icon, x, y);

            // 绘制名称
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = isCurrent ? '#74b9ff' : '#b2bec3';
            this.ctx.fillText(loc.name, x, y + 45);
        });
    }

    // 绘制玩家
    drawPlayer() {
        const x = this.scaleX(this.playerPosition.x);
        const y = this.scaleY(this.playerPosition.y);
        const time = Date.now() / 1000;

        // 玩家光晕
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 40);
        gradient.addColorStop(0, 'rgba(240, 147, 251, 0.4)');
        gradient.addColorStop(1, 'rgba(240, 147, 251, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // 玩家图标
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('🧙', x, y);
    }

    // 绘制粒子
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 更新粒子
    updateParticles() {
        this.particles = this.particles.filter(p => p.alpha > 0);
        this.particles.forEach(p => {
            p.y -= p.speed;
            p.alpha -= 0.01;
            p.x += Math.sin(p.y * 0.05) * 0.5;
        });
    }

    // 添加粒子
    addParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + Math.random() * 20 - 10,
                y: y + Math.random() * 20 - 10,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                alpha: 1,
                color: '116, 185, 255'
            });
        }
    }

    // 处理点击事件
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // 检查是否点击了某个位置
        Object.entries(GameData.locations).forEach(([id, loc]) => {
            const x = this.scaleX(loc.x);
            const y = this.scaleY(loc.y);
            const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);

            if (distance < 30) {
                this.travelTo(id);
                this.addParticles(x, y, 10);
                audioSystem.playSound('click');
            }
        });
    }

    // 旅行到指定位置
    travelTo(locationId) {
        const location = GameData.locations[locationId];
        if (!location) return;

        this.currentLocation = locationId;
        this.playerPosition = { x: location.x, y: location.y };

        // 更新UI
        this.updateLocationInfo();

        // 播放音效
        audioSystem.playSound('click');

        // 显示通知
        game.showNotification(`到达 ${location.name}`, 'info');

        // 根据位置执行不同操作
        this.handleLocationAction(location);
    }

    // 处理位置动作
    handleLocationAction(location) {
        if (location.actions.includes('shop')) {
            // 商店位置
        }
        if (location.actions.includes('explore')) {
            // 探索位置
            this.exploreLocation(location);
        }
    }

    // 探索位置
    exploreLocation(location) {
        // 随机遭遇怪物
        if (location.monsters && Math.random() < 0.3) {
            const monsterId = location.monsters[Math.floor(Math.random() * location.monsters.length)];
            battleSystem.startBattle(monsterId);
        }
    }

    // 更新位置信息显示
    updateLocationInfo() {
        const location = GameData.locations[this.currentLocation];
        const infoElement = document.getElementById('location-info');
        if (infoElement && location) {
            infoElement.innerHTML = `
                <h3>${location.icon} ${location.name}</h3>
                <p>${location.description}</p>
            `;
        }
    }

    // 缩放X坐标
    scaleX(x) {
        return (x / 800) * this.canvas.width;
    }

    // 缩放Y坐标
    scaleY(y) {
        return (y / 600) * this.canvas.height;
    }

    // 获取中心点
    getCenter() {
        return {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
    }
}

// 创建全局地图系统实例
const mapSystem = new MapSystem();
