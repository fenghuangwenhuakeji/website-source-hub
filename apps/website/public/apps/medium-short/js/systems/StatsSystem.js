export default class StatsSystem {
    constructor(app) {
        this.app = app;
        this.chartInstance = null;
    }

    async init() {
        this.app.eventBus.on('layout:ready', () => this.render());
    }

    render() {
        const containerId = this.app.state.device === 'mobile' ? 'view-tools' : 'aux-panel';
        const container = document.getElementById(containerId);
        if (!container) return;

        // 注入图表容器
        const chartContainer = document.createElement('div');
        chartContainer.style.height = '300px';
        chartContainer.style.width = '100%';
        container.appendChild(chartContainer);

        this.initChart(chartContainer);
    }

    initChart(dom) {
        if (typeof echarts === 'undefined') return;
        
        this.chartInstance = echarts.init(dom, 'dark', { renderer: 'canvas' });
        const option = {
            backgroundColor: 'transparent',
            title: {
                text: '创作维度分析',
                left: 'center',
                textStyle: { color: '#888', fontSize: 14 }
            },
            radar: {
                indicator: [
                    { name: '剧情', max: 100 },
                    { name: '人设', max: 100 },
                    { name: '节奏', max: 100 },
                    { name: '文笔', max: 100 },
                    { name: '更新', max: 100 }
                ],
                shape: 'circle',
                splitArea: {
                    areaStyle: {
                        color: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                    }
                }
            },
            series: [{
                type: 'radar',
                data: [
                    {
                        value: [80, 90, 70, 85, 60],
                        name: '当前作品',
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(255, 215, 0, 0.5)' },
                                { offset: 1, color: 'rgba(255, 215, 0, 0.1)' }
                            ])
                        },
                        lineStyle: { color: '#ffd700' },
                        itemStyle: { color: '#ffd700' }
                    }
                ]
            }]
        };
        this.chartInstance.setOption(option);

        // 响应窗口大小变化
        window.addEventListener('resize', () => this.chartInstance.resize());
    }
}