/**
 * 心理测试服务 (TestService)
 * 提供测试题库、评分、报告生成功能
 */

import { Test } from '../domain/psychology/Test.js';
import { Question } from '../domain/psychology/Question.js';
import { TestResult } from '../domain/psychology/TestResult.js';
import { PersonalityType } from '../domain/psychology/PersonalityType.js';

export class TestService {
    constructor() {
        this.tests = new Map();
        this.results = new Map();
        this.loadTests();
    }

    /**
     * 加载测试题库
     */
    loadTests() {
        // 预定义测试
        this.registerTest(this.createMBTITest());
        this.registerTest(this.createNPTITest());
    }

    /**
     * 注册测试
     */
    registerTest(test) {
        this.tests.set(test.id, test);
    }

    /**
     * 获取所有测试
     */
    getAllTests() {
        return Array.from(this.tests.values());
    }

    /**
     * 获取测试
     */
    getTest(testId) {
        return this.tests.get(testId);
    }

    /**
     * 获取测试题目
     */
    getQuestions(testId) {
        const test = this.tests.get(testId);
        return test ? test.questions : [];
    }

    /**
     * 提交答案并计算结果
     */
    submitTest(testId, userId, answers) {
        const test = this.tests.get(testId);
        if (!test) return null;

        const result = this.calculateResult(test, answers);
        result.testId = testId;
        result.userId = userId;

        this.results.set(result.id, result);
        return result;
    }

    /**
     * 计算结果
     */
    calculateResult(test, answers) {
        const dimensionScores = {};

        // 计算各维度分数
        test.questions.forEach((question, index) => {
            const answer = answers[index];
            const score = question.calculateScore(answer);
            const dimension = question.dimension || 'general';
            
            if (!dimensionScores[dimension]) {
                dimensionScores[dimension] = 0;
            }
            dimensionScores[dimension] += score;
        });

        // 根据测试类型生成结果
        const resultType = this.determineResultType(test.type, dimensionScores);
        const personalityType = PersonalityType.createMBTI(resultType);

        return new TestResult({
            dimensionScores,
            resultType,
            description: personalityType ? personalityType.name : '',
            analysis: {
                strengths: personalityType?.traits || [],
                weaknesses: [],
                advice: '',
                traits: personalityType?.traits || []
            }
        });
    }

    /**
     * 确定结果类型
     */
    determineResultType(testType, scores) {
        if (testType === 'mbti') {
            return this.determineMBTI(scores);
        }
        return 'unknown';
    }

    /**
     * 确定MBTI类型
     */
    determineMBTI(scores) {
        let type = '';
        type += (scores.E || 0) > (scores.I || 0) ? 'E' : 'I';
        type += (scores.S || 0) > (scores.N || 0) ? 'S' : 'N';
        type += (scores.T || 0) > (scores.F || 0) ? 'T' : 'F';
        type += (scores.J || 0) > (scores.P || 0) ? 'J' : 'P';
        return type;
    }

    /**
     * 创建MBTI测试
     */
    createMBTITest() {
        const test = new Test({
            id: 'test_mbti',
            title: 'MBTI性格测试',
            description: '探索你的性格类型，了解你的优势与成长方向',
            category: 'personality',
            type: 'mbti',
            duration: 15,
            isFree: true
        });

        // 简化的MBTI问题
        const questions = [
            { text: '在社交场合，你更倾向于主动与人交谈', dimension: 'E', options: [{ text: '同意', score: 5 }, { text: '不确定', score: 2 }, { text: '不同意', score: 0 }] },
            { text: '你更喜欢深入思考抽象概念', dimension: 'N', options: [{ text: '同意', score: 5 }, { text: '不确定', score: 2 }, { text: '不同意', score: 0 }] },
            { text: '做决定时，你更看重逻辑而非感受', dimension: 'T', options: [{ text: '同意', score: 5 }, { text: '不确定', score: 2 }, { text: '不同意', score: 0 }] },
            { text: '你喜欢有计划地安排生活', dimension: 'J', options: [{ text: '同意', score: 5 }, { text: '不确定', score: 2 }, { text: '不同意', score: 0 }] }
        ];

        questions.forEach(q => {
            const question = new Question({ text: q.text, dimension: q.dimension, type: 'single' });
            q.options.forEach(o => question.addOption(o.text, o.score));
            test.addQuestion(question);
        });

        return test;
    }

    /**
     * 创建NPTI测试
     */
    createNPTITest() {
        return new Test({
            id: 'test_npti',
            title: 'NPTI人格测试',
            description: '基于五行理论的中华人格测评系统',
            category: 'personality',
            type: 'npti',
            duration: 20,
            isFree: true
        });
    }

    /**
     * 获取用户测试历史
     */
    getUserHistory(userId) {
        return Array.from(this.results.values())
            .filter(r => r.userId === userId);
    }
}