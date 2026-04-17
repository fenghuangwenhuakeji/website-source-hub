/**
 * 领域层 (Domain Layer) - 核心业务领域
 * 包含所有业务实体、值对象和领域规则
 */

// ============================================
// 用户领域 (User Domain)
// ============================================
export { User } from './user/User.js';
export { UserProfile } from './user/UserProfile.js';
export { AgeGroup } from './user/AgeGroup.js';
export { ParentAccount } from './user/ParentAccount.js';

// ============================================
// 星座领域 (Constellation Domain)
// ============================================
export { Sign } from './constellation/Sign.js';
export { Horoscope } from './constellation/Horoscope.js';
export { Compatibility } from './constellation/Compatibility.js';
export { LuckyElements } from './constellation/LuckyElements.js';

// ============================================
// 心理测评领域 (Psychology Domain)
// ============================================
export { Test } from './psychology/Test.js';
export { Question } from './psychology/Question.js';
export { TestResult } from './psychology/TestResult.js';
export { PersonalityType } from './psychology/PersonalityType.js';

// ============================================
// 占卜领域 (Divination Domain)
// ============================================
export { TarotCard } from './divination/TarotCard.js';
export { TarotSpread } from './divination/TarotSpread.js';
export { BaziChart } from './divination/BaziChart.js';
export { Wuxing } from './divination/Wuxing.js';
export { AstroChart } from './divination/AstroChart.js';

// ============================================
// 社交领域 (Social Domain)
// ============================================
export { Post } from './social/Post.js';
export { Comment } from './social/Comment.js';
export { Follow } from './social/Follow.js';

// ============================================
// 安全领域 (Safety Domain)
// ============================================
export { SafetyRule } from './safety/SafetyRule.js';
export { BlockList } from './safety/BlockList.js';
export { CrisisProtocol } from './safety/CrisisProtocol.js';

// ============================================
// 内容领域 (Content Domain)
// ============================================
export { DailyQuote } from './content/DailyQuote.js';
export { Article } from './content/Article.js';