/**
 * LoadingScreen - 加载屏幕
 * V2.0 核心UI组件
 * 显示资源加载进度和游戏状态
 */

export class LoadingScreen {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.loading = false;
        this.progress = 0;

        this.createUI();
    }

    /**
     * 创建UI
     */
    createUI() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'loading-screen';
            document.body.appendChild(this.container);
        }

        this.container.innerHTML = `
            <div class="loading-screen">
                <div class="loading-background"></div>
                <div class="loading-content">
                    <div class="loading-logo">
                        <h1>⚔️ TAVERN</h1>
                        <p>V2.0</p>
                    </div>

                    <div class="loading-bar-container">
                        <div class="loading-bar">
                            <div class="loading-progress" id="loading-progress">
                                <div class="loading-progress-glow"></div>
                            </div>
                        </div>
                        <div class="loading-text" id="loading-text">
                            准备中... 0%
                        </div>
                    </div>

                    <div class="loading-details" id="loading-details">
                        <div class="loading-item" id="loading-item">
                            <span class="loading-icon">📦</span>
                            <span class="loading-label">加载游戏资源...</span>
                        </div>
                    </div>

                    <div class="loading-tips" id="loading-tips">
                        <p>💡 提示: 在酒馆中可以招募伙伴、购买装备、接受任务</p>
                    </div>
                </div>
            </div>
        `;

        this.progressElement = document.getElementById('loading-progress');
        this.textElement = document.getElementById('loading-text');
        this.detailsElement = document.getElementById('loading-details');
        this.tipsElement = document.getElementById('loading-tips');
    }

    /**
     * 显示加载屏幕
     */
    show() {
        this.container.style.display = 'flex';
        this.loading = true;
        this.progress = 0;
        this.updateProgress(0);
    }

    /**
     * 隐藏加载屏幕
     */
    hide() {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.style.opacity = '1';
        }, 500);
        this.loading = false;
    }

    /**
     * 更新进度
     */
    updateProgress(progress, text) {
        this.progress = progress;

        // 更新进度条
        this.progressElement.style.width = `${progress}%`;

        // 更新文本
        if (text) {
            this.textElement.textContent = text;
        } else {
            this.textElement.textContent = `加载中... ${Math.floor(progress)}%`;
        }

        // 根据进度更新颜色
        if (progress < 30) {
            this.progressElement.style.background = 'linear-gradient(90deg, #ff6b6b, #ff8787)';
        } else if (progress < 60) {
            this.progressElement.style.background = 'linear-gradient(90deg, #ffd43b, #ffe066)';
        } else if (progress < 90) {
            this.progressElement.style.background = 'linear-gradient(90deg, #4dabf7, #74c0fc)';
        } else {
            this.progressElement.style.background = 'linear-gradient(90deg, #51cf66, #69db7c)';
        }
    }

    /**
     * 更新加载详情
     */
    updateDetails(icon, label) {
        const item = document.createElement('div');
        item.className = 'loading-item loading-item-new';
        item.innerHTML = `
            <span class="loading-icon">${icon}</span>
            <span class="loading-label">${label}</span>
        `;

        this.detailsElement.insertBefore(item, this.detailsElement.firstChild);

        // 限制显示的条目数量
        while (this.detailsElement.children.length > 5) {
            this.detailsElement.removeChild(this.detailsElement.lastChild);
        }
    }

    /**
     * 设置提示信息
     */
    setTip(tip) {
        this.tipsElement.innerHTML = `<p>💡 提示: ${tip}</p>`;
    }

    /**
     * 随机提示
     */
    randomTip() {
        const tips = [
            '在酒馆中可以招募伙伴、购买装备、接受任务',
            '卡牌可以增强战斗能力，合理搭配卡组很重要',
            '完成任务可以获得经验和奖励',
            '升级可以提升角色的各项属性',
            '不同的武器有不同的攻击特效',
            '探索地图可以发现隐藏的宝藏',
            '与NPC对话可以获得有用的信息',
            '好感度越高，NPC提供的服务越优惠'
        ];

        const randomIndex = Math.floor(Math.random() * tips.length);
        this.setTip(tips[randomIndex]);
    }

    /**
     * 显示完成状态
     */
    showComplete() {
        this.updateProgress(100, '加载完成！');
        this.updateDetails('✅', '所有资源已加载');

        setTimeout(() => {
            this.hide();
        }, 1000);
    }

    /**
     * 显示错误状态
     */
    showError(message) {
        this.textElement.textContent = `加载失败: ${message}`;
        this.textElement.style.color = '#ff6b6b';
        this.progressElement.style.background = '#ff6b6b';
    }
}

// 默认导出
export default LoadingScreen;
