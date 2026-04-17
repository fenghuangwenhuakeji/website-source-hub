/**
 * Renderer - 渲染器
 * V2.0 核心引擎组件
 * 负责2D游戏的渲染、摄像机控制和图层管理
 */

export class Renderer {
    constructor(engine) {
        this.engine = engine;
        this.version = '2.0.0';

        // Canvas元素
        this.canvas = null;
        this.ctx = null;

        // 渲染状态
        this.initialized = false;
        this.running = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // 摄像机
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            target: null,
            followSpeed: 0.1,
            shake: { x: 0, y: 0, duration: 0 }
        };

        // 图层系统
        this.layers = [];
        this.activeLayers = new Set();

        // 渲染队列
        this.renderQueue = [];

        // 性能监控
        this.stats = {
            drawCalls: 0,
            objectsRendered: 0,
            frameTime: 0,
            maxFrameTime: 0
        };

        // 响应式设计
        this.resizeObserver = null;
        this.canvasSize = { width: 0, height: 0 };

        console.log('✅ 渲染器已创建 (V2.0)');
    }

    /**
     * 初始化渲染器
     */
    async initialize(canvasId) {
        console.log('🎨 初始化渲染器...');

        try {
            // 创建或获取Canvas
            if (canvasId) {
                this.canvas = document.getElementById(canvasId);
            }

            if (!this.canvas) {
                this.canvas = this.createCanvas();
            }

            // 获取上下文
            this.ctx = this.canvas.getContext('2d', {
                alpha: false,
                willReadFrequently: false
            });

            if (!this.ctx) {
                throw new Error('无法创建Canvas 2D上下文');
            }

            // 设置初始大小
            this.resize();

            // 设置响应式监听
            this.setupResponsive();

            // 初始化默认图层
            this.initializeDefaultLayers();

            // 启用所有默认图层
            this.activeLayers.add('background');
            this.activeLayers.add('ground');
            this.activeLayers.add('objects');
            this.activeLayers.add('characters');
            this.activeLayers.add('effects');
            this.activeLayers.add('ui');

            this.initialized = true;
            this.running = true;

            console.log('✅ 渲染器初始化完成');
            return { success: true };
        } catch (error) {
            console.error('❌ 渲染器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 创建Canvas元素
     */
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        document.body.appendChild(canvas);
        return canvas;
    }

    /**
     * 设置响应式设计
     */
    setupResponsive() {
        const resize = () => {
            this.resize();
        };

        window.addEventListener('resize', resize);

        // 使用ResizeObserver监听容器变化
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resize();
            });

            if (this.canvas.parentElement) {
                this.resizeObserver.observe(this.canvas.parentElement);
            }
        }
    }

    /**
     * 调整Canvas大小
     */
    resize() {
        if (!this.canvas) return;

        const parent = this.canvas.parentElement || document.body;
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        // 设置Canvas实际大小
        this.canvas.width = width;
        this.canvas.height = height;

        // 设置CSS大小
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.canvasSize = { width, height };

        console.log(`📐 Canvas大小调整为: ${width}x${height}`);
    }

    /**
     * 初始化默认图层
     */
    initializeDefaultLayers() {
        this.layers = [
            { name: 'background', zIndex: 0, visible: true, objects: [] },
            { name: 'ground', zIndex: 1, visible: true, objects: [] },
            { name: 'objects', zIndex: 2, visible: true, objects: [] },
            { name: 'characters', zIndex: 3, visible: true, objects: [] },
            { name: 'effects', zIndex: 4, visible: true, objects: [] },
            { name: 'ui', zIndex: 100, visible: true, objects: [] }
        ];
    }

    /**
     * 添加图层
     */
    addLayer(name, zIndex = 0) {
        if (this.layers.find(l => l.name === name)) {
            console.warn(`图层 ${name} 已存在`);
            return;
        }

        this.layers.push({
            name,
            zIndex,
            visible: true,
            objects: []
        });

        // 按zIndex排序
        this.layers.sort((a, b) => a.zIndex - b.zIndex);

        console.log(`✅ 图层已添加: ${name} (zIndex: ${zIndex})`);
    }

    /**
     * 移除图层
     */
    removeLayer(name) {
        const index = this.layers.findIndex(l => l.name === name);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.activeLayers.delete(name);
            console.log(`✅ 图层已移除: ${name}`);
        }
    }

    /**
     * 显示图层
     */
    showLayer(name) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) {
            layer.visible = true;
            this.activeLayers.add(name);
        }
    }

    /**
     * 隐藏图层
     */
    hideLayer(name) {
        const layer = this.layers.find(l => l.name === name);
        if (layer) {
            layer.visible = false;
            this.activeLayers.delete(name);
        }
    }

    /**
     * 添加渲染对象
     */
    addObject(object, layerName = 'objects') {
        const layer = this.layers.find(l => l.name === layerName);
        if (layer) {
            layer.objects.push(object);
        }
    }

    /**
     * 移除渲染对象
     */
    removeObject(object) {
        this.layers.forEach(layer => {
            const index = layer.objects.indexOf(object);
            if (index !== -1) {
                layer.objects.splice(index, 1);
            }
        });
    }

    /**
     * 主渲染循环
     */
    render() {
        if (!this.running || !this.ctx) return;

        const startTime = performance.now();

        // 清空画布
        this.clear();

        // 更新摄像机
        this.updateCamera();

        // 重置统计
        this.stats.drawCalls = 0;
        this.stats.objectsRendered = 0;

        // 渲染所有激活的图层
        this.layers.forEach(layer => {
            if (layer.visible && this.activeLayers.has(layer.name)) {
                this.renderLayer(layer);
            }
        });

        // 计算FPS
        this.calculateFPS(startTime);

        // 计算帧时间
        this.stats.frameTime = performance.now() - startTime;
        if (this.stats.frameTime > this.stats.maxFrameTime) {
            this.stats.maxFrameTime = this.stats.frameTime;
        }
    }

    /**
     * 清空画布
     */
    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * 更新摄像机
     */
    updateCamera() {
        // 跟随目标
        if (this.camera.target) {
            const targetX = this.camera.target.x;
            const targetY = this.camera.target.y;

            // 平滑移动
            this.camera.x += (targetX - this.camera.x) * this.camera.followSpeed;
            this.camera.y += (targetY - this.camera.y) * this.camera.followSpeed;
        }

        // 摄像机震动
        if (this.camera.shake.duration > 0) {
            this.camera.shake.x = (Math.random() - 0.5) * 10;
            this.camera.shake.y = (Math.random() - 0.5) * 10;
            this.camera.shake.duration--;
        } else {
            this.camera.shake.x = 0;
            this.camera.shake.y = 0;
        }
    }

    /**
     * 渲染图层
     */
    renderLayer(layer) {
        this.ctx.save();

        // 应用摄像机变换（UI层除外）
        if (layer.name !== 'ui') {
            this.ctx.translate(
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(
                -this.camera.x + this.camera.shake.x,
                -this.camera.y + this.camera.shake.y
            );
        }

        // 渲染该层的所有对象
        layer.objects.forEach(object => {
            this.renderObject(object);
        });

        this.ctx.restore();
    }

    /**
     * 渲染单个对象
     */
    renderObject(object) {
        if (!object.visible) return;

        this.ctx.save();

        // 应用对象变换
        if (object.x !== undefined && object.y !== undefined) {
            this.ctx.translate(object.x, object.y);
        }

        if (object.rotation !== undefined) {
            this.ctx.rotate(object.rotation);
        }

        if (object.scaleX !== undefined && object.scaleY !== undefined) {
            this.ctx.scale(object.scaleX, object.scaleY);
        }

        if (object.opacity !== undefined) {
            this.ctx.globalAlpha = object.opacity;
        }

        // 渲染
        if (object.image) {
            this.drawImage(object);
        } else if (object.text) {
            this.drawText(object);
        } else if (object.shape) {
            this.drawShape(object);
        }

        this.ctx.restore();

        this.stats.drawCalls++;
        this.stats.objectsRendered++;
    }

    /**
     * 绘制图片
     */
    drawImage(object) {
        const { image, x, y, width, height, frameX, frameY, frameWidth, frameHeight } = object;

        if (frameWidth && frameHeight) {
            // 精灵图
            this.ctx.drawImage(
                image,
                frameX, frameY, frameWidth, frameHeight,
                x - width / 2, y - height / 2, width, height
            );
        } else {
            // 完整图片
            this.ctx.drawImage(
                image,
                x - width / 2, y - height / 2, width, height
            );
        }
    }

    /**
     * 绘制文本
     */
    drawText(object) {
        const { text, font = '16px Arial', color = '#fff', align = 'center' } = object;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, 0, 0);
    }

    /**
     * 绘制形状
     */
    drawShape(object) {
        const { shape, width, height, color, stroke, lineWidth } = object;

        this.ctx.beginPath();

        if (shape === 'rectangle') {
            this.ctx.rect(-width / 2, -height / 2, width, height);
        } else if (shape === 'circle') {
            this.ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
        } else if (shape === 'triangle') {
            this.ctx.moveTo(0, -height / 2);
            this.ctx.lineTo(-width / 2, height / 2);
            this.ctx.lineTo(width / 2, height / 2);
            this.ctx.closePath();
        }

        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = lineWidth || 2;
            this.ctx.stroke();
        }
    }

    /**
     * 计算FPS
     */
    calculateFPS(startTime) {
        this.frameCount++;

        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            // 性能警告
            if (this.fps < 30) {
                console.warn(`⚠️ FPS过低: ${this.fps}`);
            }
        }
    }

    /**
     * 摄像机跟随
     */
    follow(target, speed = 0.1) {
        this.camera.target = target;
        this.camera.followSpeed = speed;
    }

    /**
     * 摄像机震动
     */
    shake(duration, intensity = 10) {
        this.camera.shake.duration = duration;
        this.camera.shake.x = intensity;
        this.camera.shake.y = intensity;
    }

    /**
     * 设置摄像机缩放
     */
    setZoom(zoom) {
        this.camera.zoom = Math.max(0.1, Math.min(zoom, 5));
    }

    /**
     * 移动摄像机
     */
    moveCamera(x, y) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.target = null;
    }

    /**
     * 获取摄像机位置
     */
    getCameraPosition() {
        return {
            x: this.camera.x,
            y: this.camera.y,
            zoom: this.camera.zoom
        };
    }

    /**
     * 获取性能统计
     */
    getStats() {
        return {
            fps: this.fps,
            drawCalls: this.stats.drawCalls,
            objectsRendered: this.stats.objectsRendered,
            frameTime: this.stats.frameTime,
            maxFrameTime: this.stats.maxFrameTime,
            canvasSize: this.canvasSize
        };
    }

    /**
     * 截屏
     */
    screenshot() {
        const dataURL = this.canvas.toDataURL('image/png');
        return dataURL;
    }

    /**
     * 暂停渲染
     */
    pause() {
        this.running = false;
    }

    /**
     * 恢复渲染
     */
    resume() {
        this.running = true;
    }

    /**
     * 关闭渲染器
     */
    shutdown() {
        console.log('🛑 关闭渲染器...');

        this.running = false;
        this.layers.forEach(layer => {
            layer.objects = [];
        });

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        console.log('✅ 渲染器已关闭');
    }
}

// 默认导出
export default Renderer;
