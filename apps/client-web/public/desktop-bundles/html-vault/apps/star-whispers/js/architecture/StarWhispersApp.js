/**
 * 星语心伴主应用入口 (StarWhispersApp)
 * 对标测测App架构
 */

import { HoroscopeService } from './services/HoroscopeService.js';
import { TestService } from './services/TestService.js';
import { TarotService } from './services/TarotService.js';
import { BaziService } from './services/BaziService.js';
import { ChatService } from './services/ChatService.js';
import { CommunityService } from './services/CommunityService.js';
import { UserService } from './services/UserService.js';
import { ContentService } from './services/ContentService.js';
import { SafetyService } from './services/SafetyService.js';
import { LLMAdapter } from './infrastructure/LLMAdapter.js';
import { StorageService } from './infrastructure/StorageService.js';
import { CacheService } from './infrastructure/CacheService.js';

export class StarWhispersApp {
    static instance = null;

    constructor(config = {}) {
        // 单例模式
        if (StarWhispersApp.instance) {
            return StarWhispersApp.instance;
        }
        StarWhispersApp.instance = this;

        // 配置
        this.config = config;
        this.version = '1.0.0';
        this.name = '星语心伴';

        // 初始化基础设施层
        this.llmAdapter = new LLMAdapter(config.llm);
        this.storage = new StorageService();
        this.cache = new CacheService();

        // 初始化服务层
        this.services = {
            horoscope: new HoroscopeService(),
            test: new TestService(),
            tarot: new TarotService(),
            bazi: new BaziService(),
            chat: new ChatService(this.llmAdapter),
            community: new CommunityService(),
            user: new UserService(),
            content: new ContentService(),
            safety: new SafetyService()
        };

        // 当前用户
        this.currentUser = null;

        console.log(`${this.name} v${this.version} 初始化完成`);
    }

    /**
     * 获取应用实例
     */
    static getInstance(config) {
        if (!StarWhispersApp.instance) {
            StarWhispersApp.instance = new StarWhispersApp(config);
        }
        return StarWhispersApp.instance;
    }

    /**
     * 初始化应用
     */
    async init() {
        // 加载用户数据
        this.currentUser = this.storage.get('currentUser');
        
        // 应用主题
        this.applyTheme();
        
        console.log('应用初始化完成');
        return this;
    }

    /**
     * 设置当前用户
     */
    setCurrentUser(user) {
        this.currentUser = user;
        this.storage.set('currentUser', user);
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 应用主题
     */
    applyTheme() {
        if (this.currentUser?.ageGroup) {
            const theme = this.currentUser.ageGroup.getTheme();
            document.documentElement.style.setProperty('--primary-color', theme.primary);
            document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        }
    }

    /**
     * 获取服务
     */
    getService(name) {
        return this.services[name];
    }

    /**
     * 快捷方法 - 获取运势
     */
    getHoroscope(sign, period) {
        return this.services.horoscope.getHoroscope(sign, period);
    }

    /**
     * 快捷方法 - 获取测试列表
     */
    getTests() {
        return this.services.test.getAllTests();
    }

    /**
     * 快捷方法 - 塔罗占卜
     */
    tarotReading(spreadType, question) {
        return this.services.tarot.performReading(spreadType, question);
    }

    /**
     * 快捷方法 - AI聊天
     */
    async chat(message) {
        return this.services.chat.sendMessage(
            this.currentUser?.id || 'guest',
            message
        );
    }

    /**
     * 快捷方法 - 八字分析
     */
    baziAnalysis(birthDate, birthTime, gender) {
        return this.services.bazi.calculateBazi(birthDate, birthTime, gender);
    }

    /**
     * 快捷方法 - 内容安全检查
     */
    checkSafety(content) {
        return this.services.safety.checkContent(content);
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            name: this.name,
            version: this.version,
            currentUser: this.currentUser,
            services: Object.keys(this.services)
        };
    }
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.StarWhispersApp = StarWhispersApp;
}