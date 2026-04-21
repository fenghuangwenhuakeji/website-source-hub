interface NavItem {
    id: string;
    icon: string;
    title: string;
    sub: string;
    color: string;
    agentName?: string;
}

interface ModuleInterface {
    render: () => string;
    init?: () => void;
}

interface AgentConfig {
    id: string;
    name: string;
    agentName: string;
    category: string;
    icon: string;
    color: string;
    description: string;
}

interface AgentConfigsInterface {
    categories: Record<string, { name: string; icon: string; description: string }>;
    agents: Record<string, AgentConfig>;
    getAgentsByCategory: (category: string) => AgentConfig[];
    getAllAgents: () => AgentConfig[];
}

declare const Modules: Record<string, ModuleInterface | undefined>;

declare const AgentConfigs: AgentConfigsInterface;

const homeModule: ModuleInterface = {
    render: (): string => {
        const coreItems: NavItem[] = [
            { id: 'novella_writer', icon: 'fa-pen-nib', title: '中篇创作', sub: '中篇小说创作系统', color: 'indigo-500' },
            { id: 'rag_context', icon: 'fa-magnifying-glass-chart', title: 'RAG 上下文', sub: '文档索引与语义检索', color: 'teal-500' },
            { id: 'memory_system', icon: 'fa-brain', title: '三层记忆', sub: '短期·长期·永久记忆', color: 'rose-500' },
            { id: 'reader_center', icon: 'fa-book-open', title: '阅读中心', sub: '沉浸阅读与智能排版', color: 'amber-500' },
            { id: 'settings', icon: 'fa-gear', title: '系统设置', sub: 'API配置与数据管理', color: 'gray-500' }
        ];

        const getAgentsFromConfig = (categoryKey: string): NavItem[] => {
            if (typeof AgentConfigs === 'undefined') return [];
            return AgentConfigs.getAgentsByCategory(categoryKey).map(agent => ({
                id: agent.id,
                icon: agent.icon,
                title: agent.name,
                sub: agent.description,
                color: agent.color,
                agentName: agent.agentName
            }));
        };

        const narrativeAgents = getAgentsFromConfig('narrative');
        const characterAgents = getAgentsFromConfig('character');
        const worldAgents = getAgentsFromConfig('world');
        const creativeAgents = getAgentsFromConfig('creative');
        const scriptAgents = getAgentsFromConfig('script');
        const audioAgents = getAgentsFromConfig('audio');
        const visualAgents = getAgentsFromConfig('visual');

        const renderGrid = (items: NavItem[]): string => {
            return items.map(item => `
                <div class="agent-card group" onclick="App.nav('${item.id}')">
                    <div class="agent-card-inner">
                        <div class="agent-icon-wrapper" style="--card-color: var(--${item.color})">
                            <i class="fa-solid ${item.icon}"></i>
                            <div class="agent-icon-glow"></div>
                        </div>
                        <div class="agent-content">
                            <h4 class="agent-title">${item.title}</h4>
                            <p class="agent-subtitle">${item.sub}</p>
                        </div>
                        <div class="agent-arrow">
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                    </div>
                    <div class="agent-card-border"></div>
                </div>
            `).join('');
        };

        const renderSection = (title: string, items: NavItem[], icon: string): string => {
            if (items.length === 0) return '';
            return `
                <div class="agent-section">
                    <div class="section-header">
                        <div class="section-icon">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <h3 class="section-title">${title}</h3>
                        <div class="section-line"></div>
                        <span class="section-count">${items.length}</span>
                    </div>
                    <div class="agent-grid">${renderGrid(items)}</div>
                </div>
            `;
        };

        const getCategoryIcon = (categoryKey: string): string => {
            const icons: Record<string, string> = {
                narrative: 'fa-book',
                character: 'fa-users',
                world: 'fa-globe',
                creative: 'fa-lightbulb',
                script: 'fa-clapperboard',
                audio: 'fa-music',
                visual: 'fa-images'
            };
            return icons[categoryKey] || 'fa-folder';
        };

        const renderAgentSections = (): string => {
            if (typeof AgentConfigs === 'undefined') return '';
            
            const categoryOrder = ['narrative', 'character', 'world', 'creative', 'script', 'audio', 'visual'];
            const categoryNames: Record<string, string> = {
                narrative: '叙事结构',
                character: '角色系统',
                world: '世界观与冲突',
                creative: '创意工具',
                script: '剧本创作',
                audio: '音频创作',
                visual: '视觉创作'
            };

            return categoryOrder.map(cat => {
                const agents = getAgentsFromConfig(cat);
                return renderSection(categoryNames[cat], agents, getCategoryIcon(cat));
            }).join('');
        };

        return `
        <div class="home-container">
            <!-- 动态背景 -->
            <div class="home-bg">
                <div class="bg-gradient-orb orb-1"></div>
                <div class="bg-gradient-orb orb-2"></div>
                <div class="bg-gradient-orb orb-3"></div>
                <div class="bg-grid"></div>
            </div>
            
            <!-- 头部区域 -->
            <header class="home-header">
                <div class="header-content">
                    <div class="logo-section">
                        <div class="logo-wrapper">
                            <img src="assets/images/phoenix.png" class="logo-img" alt="创世旗舰版">
                            <div class="logo-glow"></div>
                        </div>
                        <div class="title-section">
                            <h1 class="main-title">
                                <span class="title-gradient">创世旗舰版</span>
                                <span class="version-badge">2.0</span>
                            </h1>
                            <p class="subtitle">
                                <span class="subtitle-highlight">Genesis Archon Ultimate</span>
                                <span class="subtitle-divider">·</span>
                                <span>AI写作Agent集群</span>
                            </p>
                        </div>
                    </div>
                    <div class="header-stats">
                        <div class="stat-item">
                            <span class="stat-number">${typeof AgentConfigs !== 'undefined' ? AgentConfigs.getAllAgents().length : 39}</span>
                            <span class="stat-label">写作Agent</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-number">${typeof AgentConfigs !== 'undefined' ? Object.keys(AgentConfigs.categories).length : 8}</span>
                            <span class="stat-label">功能分类</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- 主内容区域 -->
            <main class="home-main">
                <div class="main-content">
                    ${renderSection('核心功能', coreItems, 'fa-star')}
                    ${renderAgentSections()}
                </div>
            </main>
            
            <!-- 底部装饰 -->
            <footer class="home-footer">
                <div class="footer-line"></div>
                <p class="footer-text">Powered by AI Agent Ecosystem</p>
            </footer>
        </div>`;
    }
};

const Modules: Record<string, ModuleInterface | undefined> = {
    home: homeModule
};

(window as any).Modules = Modules;
