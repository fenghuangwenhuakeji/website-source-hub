/**
 * 心理测试模块 - Psychological Test Module
 * 对标测测App的心理测试功能
 */

import { TestRepository } from './TestRepository.js';
import { TestEngine } from './TestEngine.js';
import { ReportGenerator } from './ReportGenerator.js';

export class TestModule {
    constructor() {
        this.repository = new TestRepository();
        this.engine = new TestEngine();
        this.reportGenerator = new ReportGenerator();
        this.currentSession = null;
        this.history = [];
    }

    /**
     * 获取测试分类
     */
    getCategories() {
        return this.repository.getCategories();
    }

    /**
     * 获取测试列表
     * @param {string} categoryId - 分类ID (可选)
     */
    getTestList(categoryId = null) {
        return this.repository.getTestList(categoryId);
    }

    /**
     * 获取测试详情
     * @param {string} testId - 测试ID
     */
    getTest(testId) {
        return this.repository.getTest(testId);
    }

    /**
     * 开始测试
     * @param {string} testId - 测试ID
     */
    startTest(testId) {
        const test = this.repository.getTest(testId);
        if (!test) {
            throw new Error('测试不存在');
        }

        this.currentSession = {
            testId,
            test,
            answers: [],
            startTime: new Date().toISOString(),
            currentQuestion: 0
        };

        return {
            testId,
            title: test.title,
            description: test.description,
            totalQuestions: test.questions.length,
            firstQuestion: test.questions[0]
        };
    }

    /**
     * 提交答案
     * @param {number} questionIndex - 问题索引
     * @param {any} answer - 答案
     */
    submitAnswer(questionIndex, answer) {
        if (!this.currentSession) {
            throw new Error('没有进行中的测试');
        }

        this.currentSession.answers[questionIndex] = {
            questionIndex,
            answer,
            timestamp: new Date().toISOString()
        };

        // 移动到下一题
        this.currentSession.currentQuestion = questionIndex + 1;

        // 检查是否完成
        const isComplete = this.currentSession.currentQuestion >= this.currentSession.test.questions.length;

        return {
            isComplete,
            nextQuestion: isComplete ? null : this.currentSession.test.questions[questionIndex + 1],
            progress: {
                current: this.currentSession.currentQuestion,
                total: this.currentSession.test.questions.length,
                percentage: Math.round((this.currentSession.currentQuestion / this.currentSession.test.questions.length) * 100)
            }
        };
    }

    /**
     * 完成测试并生成报告
     */
    async completeTest() {
        if (!this.currentSession) {
            throw new Error('没有进行中的测试');
        }

        const { testId, test, answers } = this.currentSession;

        // 计算分数
        const scoreResult = this.engine.calculateScore(test, answers);

        // 生成报告
        const report = await this.reportGenerator.generate(test, scoreResult);

        // 构建结果
        const result = {
            id: this.generateId(),
            testId,
            testTitle: test.title,
            testCategory: test.category,
            answers,
            score: scoreResult,
            report,
            completedAt: new Date().toISOString()
        };

        // 保存历史
        this.saveToHistory(result);

        // 清除当前会话
        this.currentSession = null;

        return result;
    }

    /**
     * 获取当前进度
     */
    getCurrentProgress() {
        if (!this.currentSession) {
            return null;
        }

        return {
            testId: this.currentSession.testId,
            testTitle: this.currentSession.test.title,
            currentQuestion: this.currentSession.currentQuestion,
            totalQuestions: this.currentSession.test.questions.length,
            percentage: Math.round((this.currentSession.currentQuestion / this.currentSession.test.questions.length) * 100)
        };
    }

    /**
     * 取消测试
     */
    cancelTest() {
        this.currentSession = null;
    }

    /**
     * 获取历史记录
     */
    getHistory(limit = 20) {
        return this.history.slice(0, limit);
    }

    /**
     * 获取测试结果
     */
    getResult(resultId) {
        return this.history.find(h => h.id === resultId);
    }

    /**
     * 保存历史
     */
    saveToHistory(result) {
        this.history.unshift(result);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        this.persistHistory();
    }

    /**
     * 持久化
     */
    persistHistory() {
        try {
            localStorage.setItem('test_history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('测试历史保存失败:', e);
        }
    }

    /**
     * 加载历史
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('test_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('测试历史加载失败:', e);
        }
    }

    /**
     * 生成ID
     */
    generateId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 导出单例
export const testModule = new TestModule();