/**
 * UIComponent - UI组件基类
 * V2.0 核心UI组件
 * 所有UI组件的基础类
 */

export class UIComponent {
    constructor(options = {}) {
        // 基础属性
        this.id = options.id || 'component_' + Date.now();
        this.type = options.type || 'component';
        this.parent = options.parent || null;
        this.children = [];

        // 位置和大小
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 100;
        this.height = options.height || 40;

        // 样式
        this.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        this.borderColor = options.borderColor || 'rgba(255, 255, 255, 0.2)';
        this.borderWidth = options.borderWidth !== undefined ? options.borderWidth : 1;
        this.borderRadius = options.borderRadius !== undefined ? options.borderRadius : 8;
        this.color = options.color || '#ffffff';
        this.fontSize = options.fontSize || 14;
        this.fontFamily = options.fontFamily || 'Arial';

        // 状态
        this.visible = options.visible !== undefined ? options.visible : true;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.hovered = false;
        this.focused = false;

        // 交互
        this.onClick = options.onClick || null;
        this.onHover = options.onHover || null;
        this.onFocus = options.onFocus || null;

        // 动画
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.scale = options.scale || 1;
        this.rotation = options.rotation || 0;

        // 主题
        this.theme = options.theme || 'default';
    }

    /**
     * 添加子组件
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    /**
     * 移除子组件
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    /**
     * 显示
     */
    show() {
        this.visible = true;
    }

    /**
     * 隐藏
     */
    hide() {
        this.visible = false;
    }

    /**
     * 启用
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用
     */
    disable() {
        this.enabled = false;
        this.focused = false;
    }

    /**
     * 获取绝对位置
     */
    getAbsolutePosition() {
        let x = this.x;
        let y = this.y;

        let current = this.parent;
        while (current) {
            x += current.x;
            y += current.y;
            current = current.parent;
        }

        return { x, y };
    }

    /**
     * 检查点是否在组件内
     */
    containsPoint(x, y) {
        const pos = this.getAbsolutePosition();
        return x >= pos.x && x <= pos.x + this.width &&
               y >= pos.y && y <= pos.y + this.height;
    }

    /**
     * 更新
     */
    update(deltaTime) {
        this.children.forEach(child => {
            if (child.visible) {
                child.update(deltaTime);
            }
        });
    }

    /**
     * 渲染
     */
    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        // 应用变换
        const pos = this.getAbsolutePosition();
        ctx.translate(pos.x + this.width / 2, pos.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.width / 2, -this.height / 2);
        ctx.globalAlpha = this.opacity;

        // 渲染背景
        this.renderBackground(ctx);

        // 渲染边框
        this.renderBorder(ctx);

        // 渲染内容
        this.renderContent(ctx);

        // 渲染子组件
        ctx.translate(-pos.x, -pos.y);
        this.children.forEach(child => {
            child.render(ctx);
        });

        ctx.restore();
    }

    /**
     * 渲染背景
     */
    renderBackground(ctx) {
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(0, 0, this.width, this.height, this.borderRadius);
            ctx.fill();
        }
    }

    /**
     * 渲染边框
     */
    renderBorder(ctx) {
        if (this.borderWidth > 0) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            ctx.beginPath();
            ctx.roundRect(0, 0, this.width, this.height, this.borderRadius);
            ctx.stroke();
        }
    }

    /**
     * 渲染内容
     */
    renderContent(ctx) {
        // 子类覆盖
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(x, y) {
        const wasHovered = this.hovered;
        this.hovered = this.containsPoint(x, y) && this.enabled;

        if (this.hovered !== wasHovered) {
            if (this.onHover) {
                this.onHover(this, this.hovered);
            }
        }

        // 传递给子组件
        this.children.forEach(child => {
            child.handleMouseMove(x, y);
        });
    }

    /**
     * 处理点击
     */
    handleClick(x, y) {
        if (this.containsPoint(x, y) && this.enabled) {
            if (this.onClick) {
                this.onClick(this);
            }
            return true;
        }

        // 检查子组件
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].handleClick(x, y)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        this.theme = theme;
        this.applyTheme();
    }

    /**
     * 应用主题
     */
    applyTheme() {
        // 子类覆盖
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.children.forEach(child => {
            child.destroy();
        });
        this.children = [];
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

export class Button extends UIComponent {
    constructor(options = {}) {
        super({
            ...options,
            type: 'button'
        });

        this.text = options.text || 'Button';
        this.hoverColor = options.hoverColor || 'rgba(77, 171, 247, 0.8)';
        this.normalColor = options.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        this.clickColor = options.clickColor || 'rgba(77, 171, 247, 1.0)';
        this.isPressed = false;
    }

    handleMouseMove(x, y) {
        super.handleMouseMove(x, y);
        if (this.hovered && !this.isPressed) {
            this.backgroundColor = this.hoverColor;
        } else if (!this.isPressed) {
            this.backgroundColor = this.normalColor;
        }
    }

    handleClick(x, y) {
        if (this.containsPoint(x, y) && this.enabled) {
            this.isPressed = true;
            this.backgroundColor = this.clickColor;

            setTimeout(() => {
                this.isPressed = false;
                this.backgroundColor = this.hovered ? this.hoverColor : this.normalColor;
            }, 150);

            if (this.onClick) {
                this.onClick(this);
            }
            return true;
        }
        return false;
    }

    renderContent(ctx) {
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.width / 2, this.height / 2);
    }
}

export class DialogueBox extends UIComponent {
    constructor(options = {}) {
        super({
            ...options,
            type: 'dialogue',
            width: options.width || 600,
            height: options.height || 150
        });

        this.text = options.text || '';
        this.speaker = options.speaker || '';
        this.avatar = options.avatar || null;
        this.autoHide = options.autoHide !== undefined ? options.autoHide : false;
        this.autoHideDelay = options.autoHideDelay || 3000;
        this.showTimer = 0;
    }

    show() {
        super.show();
        if (this.autoHide) {
            this.showTimer = this.autoHideDelay;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        if (this.autoHide && this.visible) {
            this.showTimer -= deltaTime;
            if (this.showTimer <= 0) {
                this.hide();
            }
        }
    }

    renderContent(ctx) {
        // 渲染头像
        if (this.avatar && this.engine.assetManager) {
            const avatarImage = this.engine.assetManager.get(this.avatar);
            if (avatarImage) {
                ctx.drawImage(avatarImage, 20, 20, 80, 80);
            }
        }

        // 渲染说话人
        if (this.speaker) {
            ctx.font = `bold ${this.fontSize + 4}px ${this.fontFamily}`;
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(this.speaker, 110, 20);
        }

        // 渲染对话文本
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.text, 110, 50, this.width - 130);
    }
}

export class Tooltip extends UIComponent {
    constructor(options = {}) {
        super({
            ...options,
            type: 'tooltip',
            width: options.width || 200,
            height: options.height || 'auto'
        });

        this.text = options.text || '';
        this.target = options.target || null;
        this.showDelay = options.showDelay || 500;
        this.timer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);

        if (this.target && this.target.hovered) {
            this.timer += deltaTime;
            if (this.timer >= this.showDelay && !this.visible) {
                this.show();
            }
        } else {
            this.timer = 0;
            this.hide();
        }
    }

    renderContent(ctx) {
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.text, 10, 10, this.width - 20);
    }
}

export default UIComponent;
