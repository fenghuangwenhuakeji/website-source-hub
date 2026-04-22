#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小说创作全领域精细化Agent生成器
19个领域，每个领域20个Agent，共380个Agent
全面击穿小说创作全流程
"""

import os
import json
from datetime import datetime

BASE_OUTPUT_DIR = r"d:\AIcreateEngine\标准软件开发范式\批量Agent制造机\generated_comprehensive_agents"
os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)

# ==================== 1. 伏笔与钩子系统 (20个) ====================
FUBI_AGENTS = [
    {"id": "fb-001", "name": "伏笔-草蛇灰线埋设器", "category": "伏笔系统", "focus": "草蛇灰线式伏笔的远距离埋设技巧"},
    {"id": "fb-002", "name": "伏笔-明线伏笔植入器", "category": "伏笔系统", "focus": "显性伏笔的明目张胆植入方法"},
    {"id": "fb-003", "name": "伏笔-暗线伏笔隐藏器", "category": "伏笔系统", "focus": "隐性伏笔的潜移默化渗透技巧"},
    {"id": "fb-004", "name": "伏笔-道具伏笔设计器", "category": "伏笔系统", "focus": "物品道具作为伏笔载体的设计"},
    {"id": "fb-005", "name": "伏笔-对话伏笔植入器", "category": "伏笔系统", "focus": "对话中不经意透露的伏笔植入"},
    {"id": "fb-006", "name": "伏笔-场景伏笔铺垫器", "category": "伏笔系统", "focus": "场景描写中的环境伏笔铺垫"},
    {"id": "fb-007", "name": "伏笔-人物伏笔预埋器", "category": "伏笔系统", "focus": "人物出场时的特征伏笔预埋"},
    {"id": "fb-008", "name": "伏笔-时间伏笔设置器", "category": "伏笔系统", "focus": "时间节点作为伏笔触发器设置"},
    {"id": "fb-009", "name": "钩子-开篇黄金钩子器", "category": "钩子系统", "focus": "开篇300字内的黄金钩子设计"},
    {"id": "fb-010", "name": "钩子-章节尾部钩子器", "category": "钩子系统", "focus": "章末断章钩子与期待感营造"},
    {"id": "fb-011", "name": "钩子-悬念钩子编织器", "category": "钩子系统", "focus": "悬念型钩子的编织与释放节奏"},
    {"id": "fb-012", "name": "钩子-危机钩子设置器", "category": "钩子系统", "focus": "危机预警式钩子的设置技巧"},
    {"id": "fb-013", "name": "钩子-情感钩子植入器", "category": "钩子系统", "focus": "情感纠葛型钩子的植入方法"},
    {"id": "fb-014", "name": "钩子-反转钩子预埋器", "category": "钩子系统", "focus": "反转前的不经意钩子预埋"},
    {"id": "fb-015", "name": "记忆-读者记忆强化器", "category": "记忆系统", "focus": "关键信息在读者记忆中的强化"},
    {"id": "fb-016", "name": "记忆-遗忘曲线对抗器", "category": "记忆系统", "focus": "对抗遗忘曲线的重复提醒策略"},
    {"id": "fb-017", "name": "记忆-记忆锚点设置器", "category": "记忆系统", "focus": "读者记忆锚点的精准设置"},
    {"id": "fb-018", "name": "记忆-信息重复植入器", "category": "记忆系统", "focus": "重要信息的多次重复植入技巧"},
    {"id": "fb-019", "name": "记忆-记忆触发器设计器", "category": "记忆系统", "focus": "触发读者回忆的线索设计"},
    {"id": "fb-020", "name": "记忆-长期记忆编织器", "category": "记忆系统", "focus": "贯穿全书的长期记忆编织"},
]

# ==================== 2. 情绪拉扯与渲染 (20个) ====================
QINGXU_AGENTS = [
    {"id": "qx-001", "name": "情绪-欲望缺口设计器", "category": "情绪系统", "focus": "角色欲望缺口与读者期待建立"},
    {"id": "qx-002", "name": "情绪-渴望阻碍循环器", "category": "情绪系统", "focus": "渴望-阻碍-再渴望的循环设计"},
    {"id": "qx-003", "name": "情绪-情绪压抑累积器", "category": "情绪系统", "focus": "情绪压抑的层层累积技巧"},
    {"id": "qx-004", "name": "情绪-情绪爆发设计器", "category": "情绪系统", "focus": "情绪顶点的爆发与释放设计"},
    {"id": "qx-005", "name": "情绪-情绪余韵营造器", "category": "情绪系统", "focus": "高潮后的情绪余韵与升华"},
    {"id": "qx-006", "name": "拉扯-心理拉锯设计器", "category": "拉扯系统", "focus": "角色内心的心理拉锯战设计"},
    {"id": "qx-007", "name": "拉扯-关系张力维持器", "category": "拉扯系统", "focus": "人物关系张力的持续维持"},
    {"id": "qx-008", "name": "拉扯-暧昧氛围营造器", "category": "拉扯系统", "focus": "暧昧不清的情感氛围营造"},
    {"id": "qx-009", "name": "拉扯-冲突升级推进器", "category": "拉扯系统", "focus": "冲突的逐步升级与推进"},
    {"id": "qx-010", "name": "拉扯-期待感延长器", "category": "拉扯系统", "focus": "读者期待感的最大化延长"},
    {"id": "qx-011", "name": "渲染-五感情绪渲染器", "category": "渲染系统", "focus": "五感描写带动情绪渲染"},
    {"id": "qx-012", "name": "渲染-环境映射情绪器", "category": "渲染系统", "focus": "环境描写映射内心情绪"},
    {"id": "qx-013", "name": "渲染-动作情绪外化器", "category": "渲染系统", "focus": "通过动作外化内心情绪"},
    {"id": "qx-014", "name": "渲染-对话情绪传递器", "category": "渲染系统", "focus": "对话中的情绪传递与张力"},
    {"id": "qx-015", "name": "渲染-细节情绪放大器", "category": "渲染系统", "focus": "微小细节的情绪放大效果"},
    {"id": "qx-016", "name": "铺垫-情绪铺垫层叠器", "category": "铺垫系统", "focus": "情绪的多层铺垫与叠加"},
    {"id": "qx-017", "name": "铺垫-高潮前铺垫器", "category": "铺垫系统", "focus": "高潮前的全方位铺垫设计"},
    {"id": "qx-018", "name": "铺垫-反转前铺垫器", "category": "铺垫系统", "focus": "反转前的隐性铺垫植入"},
    {"id": "qx-019", "name": "铺垫-悲剧前铺垫器", "category": "铺垫系统", "focus": "悲剧发生前的宿命感铺垫"},
    {"id": "qx-020", "name": "铺垫-喜剧前铺垫器", "category": "铺垫系统", "focus": "喜剧效果前的反差铺垫"},
]

# ==================== 3. 大中小循环嵌套 (20个) ====================
XUNHUAN_AGENTS = [
    {"id": "xh-001", "name": "大循环-故事卷结构设计器", "category": "大循环", "focus": "整卷故事的大循环结构设计"},
    {"id": "xh-002", "name": "大循环-主线推进节奏器", "category": "大循环", "focus": "主线剧情的推进节奏控制"},
    {"id": "xh-003", "name": "大循环-阶段性高潮设计器", "category": "大循环", "focus": "每卷阶段性高潮的设计"},
    {"id": "xh-004", "name": "大循环-卷末钩子设置器", "category": "大循环", "focus": "卷末悬念钩子的设置技巧"},
    {"id": "xh-005", "name": "大循环-多卷联动设计器", "category": "大循环", "focus": "多卷之间的联动与呼应"},
    {"id": "xh-006", "name": "中循环-章节结构设计器", "category": "中循环", "focus": "单章内部的中循环结构"},
    {"id": "xh-007", "name": "中循环-章内起承转合器", "category": "中循环", "focus": "章内起承转合的节奏控制"},
    {"id": "xh-008", "name": "中循环-章末悬念设置器", "category": "中循环", "focus": "章末悬念与期待感设置"},
    {"id": "xh-009", "name": "中循环-连续章节衔接器", "category": "中循环", "focus": "连续章节之间的衔接过渡"},
    {"id": "xh-010", "name": "中循环-章节情绪曲线器", "category": "中循环", "focus": "单章情绪曲线的起伏设计"},
    {"id": "xh-011", "name": "小循环-场景对话节奏器", "category": "小循环", "focus": "场景内对话的小循环节奏"},
    {"id": "xh-012", "name": "小循环-动作场面节拍器", "category": "小循环", "focus": "动作场面的节拍控制"},
    {"id": "xh-013", "name": "小循环-情绪微波动设计器", "category": "小循环", "focus": "情绪微小波动的精细设计"},
    {"id": "xh-014", "name": "小循环-场景转换衔接器", "category": "小循环", "focus": "场景转换的自然衔接"},
    {"id": "xh-015", "name": "小循环-细节呼应设计器", "category": "小循环", "focus": "场景内细节的呼应设计"},
    {"id": "xh-016", "name": "嵌套-三层循环嵌套器", "category": "嵌套系统", "focus": "大中小三层循环的嵌套"},
    {"id": "xh-017", "name": "嵌套-循环呼应设计器", "category": "嵌套系统", "focus": "不同层级循环的呼应关系"},
    {"id": "xh-018", "name": "嵌套-节奏层次分离器", "category": "嵌套系统", "focus": "不同节奏层次的分离与统一"},
    {"id": "xh-019", "name": "嵌套-循环节奏加速器", "category": "嵌套系统", "focus": "循环节奏的逐步加速技巧"},
    {"id": "xh-020", "name": "嵌套-循环收束统一器", "category": "嵌套系统", "focus": "多层循环的最终收束统一"},
]

# ==================== 4. 角色塑造与对比 (20个) ====================
JUESE_AGENTS = [
    {"id": "js-001", "name": "塑造-角色标签熔炼器", "category": "角色塑造", "focus": "3-5个冲突标签的熔炼"},
    {"id": "js-002", "name": "塑造-角色五问设计器", "category": "角色塑造", "focus": "身份欲望恐惧创伤执念五问"},
    {"id": "js-003", "name": "塑造-角色反差强化器", "category": "角色塑造", "focus": "角色内外反差的强化设计"},
    {"id": "js-004", "name": "塑造-角色弧光规划器", "category": "角色塑造", "focus": "角色成长变化的弧光规划"},
    {"id": "js-005", "name": "塑造-角色动机深挖器", "category": "角色塑造", "focus": "角色深层动机的挖掘"},
    {"id": "js-006", "name": "塑造-角色缺陷设计器", "category": "角色塑造", "focus": "角色缺陷与弱点设计"},
    {"id": "js-007", "name": "塑造-角色魅力点提炼器", "category": "角色塑造", "focus": "角色魅力点的提炼强化"},
    {"id": "js-008", "name": "塑造-角色记忆点设计器", "category": "角色塑造", "focus": "角色独特记忆点的设计"},
    {"id": "js-009", "name": "塑造-角色口头禅设计器", "category": "角色塑造", "focus": "角色口头禅与语言特征"},
    {"id": "js-010", "name": "塑造-角色习惯动作设计器", "category": "角色塑造", "focus": "角色习惯性动作设计"},
    {"id": "js-011", "name": "对比-主角反派对比器", "category": "角色对比", "focus": "主角与反派的镜像对比"},
    {"id": "js-012", "name": "对比-双主角对照器", "category": "角色对比", "focus": "双主角之间的对照设计"},
    {"id": "js-013", "name": "对比-角色群像对比器", "category": "角色对比", "focus": "群像角色的差异化对比"},
    {"id": "js-014", "name": "对比-前后对比设计器", "category": "角色对比", "focus": "角色前后变化的对比"},
    {"id": "js-015", "name": "对比-强弱对比设计器", "category": "角色对比", "focus": "角色强弱关系的对比"},
    {"id": "js-016", "name": "对比-正邪对比设计器", "category": "角色对比", "focus": "正邪角色的立场对比"},
    {"id": "js-017", "name": "对比-善恶模糊设计器", "category": "角色对比", "focus": "善恶界限模糊的角色对比"},
    {"id": "js-018", "name": "对比-阶层对比设计器", "category": "角色对比", "focus": "不同阶层角色的对比"},
    {"id": "js-019", "name": "对比-性格互补设计器", "category": "角色对比", "focus": "性格互补的角色配对"},
    {"id": "js-020", "name": "对比-命运对照设计器", "category": "角色对比", "focus": "相似命运的对照设计"},
]

# ==================== 5. 人物性格分析对照 (20个) ====================
XINGGE_AGENTS = [
    {"id": "xg-001", "name": "性格-MBTI类型映射器", "category": "性格分析", "focus": "MBTI类型与角色性格映射"},
    {"id": "xg-002", "name": "性格-九型人格对应器", "category": "性格分析", "focus": "九型人格与角色对应"},
    {"id": "xg-003", "name": "性格-大五人格分析器", "category": "性格分析", "focus": "大五人格模型分析"},
    {"id": "xg-004", "name": "性格-性格色彩分析器", "category": "性格分析", "focus": "性格色彩理论应用"},
    {"id": "xg-005", "name": "性格-星座性格映射器", "category": "性格分析", "focus": "星座与性格特征映射"},
    {"id": "xg-006", "name": "性格-八字性格分析器", "category": "性格分析", "focus": "八字命理与性格分析"},
    {"id": "xg-007", "name": "性格-性格矛盾设计器", "category": "性格分析", "focus": "性格内在矛盾设计"},
    {"id": "xg-008", "name": "性格-性格转变设计器", "category": "性格分析", "focus": "性格转变的合理设计"},
    {"id": "xg-009", "name": "性格-性格稳定维持器", "category": "性格分析", "focus": "核心性格的稳定性维持"},
    {"id": "xg-010", "name": "性格-性格侧面展现器", "category": "性格分析", "focus": "性格多侧面的展现"},
    {"id": "xg-011", "name": "对照-性格对照组设计器", "category": "性格对照", "focus": "性格对照组的设计"},
    {"id": "xg-012", "name": "对照-性格冲突设计器", "category": "性格对照", "focus": "性格冲突的戏剧设计"},
    {"id": "xg-013", "name": "对照-性格互补设计器", "category": "性格对照", "focus": "性格互补的配对设计"},
    {"id": "xg-014", "name": "对照-性格相似设计器", "category": "性格对照", "focus": "性格相似的呼应设计"},
    {"id": "xg-015", "name": "对照-性格反差设计器", "category": "性格对照", "focus": "性格反差的张力设计"},
    {"id": "xg-016", "name": "对照-性格成长对照器", "category": "性格对照", "focus": "性格成长的对照展现"},
    {"id": "xg-017", "name": "对照-性格退化对照器", "category": "性格对照", "focus": "性格退化的对照展现"},
    {"id": "xg-018", "name": "对照-性格极端化设计器", "category": "性格对照", "focus": "性格极端化的设计"},
    {"id": "xg-019", "name": "对照-性格平衡设计器", "category": "性格对照", "focus": "性格平衡的设计"},
    {"id": "xg-020", "name": "对照-性格复杂化设计器", "category": "性格对照", "focus": "性格复杂化的设计"},
]

# ==================== 6. 世界观分类体系 (20个) ====================
SHIJIE_GUAN_AGENTS = [
    {"id": "wg-001", "name": "世界观-低魔世界设计器", "category": "世界观分类", "focus": "低魔世界的规则设计"},
    {"id": "wg-002", "name": "世界观-高魔世界设计器", "category": "世界观分类", "focus": "高魔世界的体系构建"},
    {"id": "wg-003", "name": "世界观-科幻世界设计器", "category": "世界观分类", "focus": "科幻世界的科技设定"},
    {"id": "wg-004", "name": "世界观-蒸汽朋克设计器", "category": "世界观分类", "focus": "蒸汽朋克风格世界"},
    {"id": "wg-005", "name": "世界观-赛博朋克设计器", "category": "世界观分类", "focus": "赛博朋克风格世界"},
    {"id": "wg-006", "name": "世界观-末日废土设计器", "category": "世界观分类", "focus": "末日废土世界构建"},
    {"id": "wg-007", "name": "世界观-修真世界设计器", "category": "世界观分类", "focus": "修真世界的等级体系"},
    {"id": "wg-008", "name": "世界观-武侠世界设计器", "category": "世界观分类", "focus": "武侠世界的门派体系"},
    {"id": "wg-009", "name": "世界观-仙侠世界设计器", "category": "世界观分类", "focus": "仙侠世界的境界划分"},
    {"id": "wg-010", "name": "世界观-洪荒世界设计器", "category": "世界观分类", "focus": "洪荒世界的神话体系"},
    {"id": "wg-011", "name": "世界观-现代都市设计器", "category": "世界观分类", "focus": "现代都市世界规则"},
    {"id": "wg-012", "name": "世界观-架空历史设计器", "category": "世界观分类", "focus": "架空历史世界构建"},
    {"id": "wg-013", "name": "世界观-异世界转生设计器", "category": "世界观分类", "focus": "异世界转生设定"},
    {"id": "wg-014", "name": "世界观-无限流世界设计器", "category": "世界观分类", "focus": "无限流副本世界"},
    {"id": "wg-015", "name": "世界观-灵气复苏设计器", "category": "世界观分类", "focus": "灵气复苏世界观"},
    {"id": "wg-016", "name": "世界观-规则怪谈设计器", "category": "世界观分类", "focus": "规则怪谈世界观"},
    {"id": "wg-017", "name": "世界观-克苏鲁式设计器", "category": "世界观分类", "focus": "克苏鲁风格世界"},
    {"id": "wg-018", "name": "世界观-乌托邦式设计器", "category": "世界观分类", "focus": "乌托邦/反乌托邦世界"},
    {"id": "wg-019", "name": "世界观-多元宇宙设计器", "category": "世界观分类", "focus": "多元宇宙世界体系"},
    {"id": "wg-020", "name": "世界观-时间穿越设计器", "category": "世界观分类", "focus": "时间穿越世界观"},
]

# ==================== 7. 历史与传说 (20个) ====================
LISHI_AGENTS = [
    {"id": "ls-001", "name": "历史-创世神话设计器", "category": "历史传说", "focus": "世界创世神话设计"},
    {"id": "ls-002", "name": "历史-远古传说编织器", "category": "历史传说", "focus": "远古时代传说编织"},
    {"id": "ls-003", "name": "历史-古代史设计器", "category": "历史传说", "focus": "古代历史事件设计"},
    {"id": "ls-004", "name": "历史-近代史设计器", "category": "历史传说", "focus": "近代历史变迁设计"},
    {"id": "ls-005", "name": "历史-王朝更替设计器", "category": "历史传说", "focus": "王朝更替历史设计"},
    {"id": "ls-006", "name": "历史-战争史设计器", "category": "历史传说", "focus": "重大战争历史设计"},
    {"id": "ls-007", "name": "历史-英雄传说设计器", "category": "历史传说", "focus": "英雄人物传说设计"},
    {"id": "ls-008", "name": "历史-灾难史设计器", "category": "历史传说", "focus": "重大灾难历史设计"},
    {"id": "ls-009", "name": "传说-神话体系构建器", "category": "历史传说", "focus": "神话体系整体构建"},
    {"id": "ls-010", "name": "传说-民间传说设计器", "category": "历史传说", "focus": "民间传说故事设计"},
    {"id": "ls-011", "name": "传说-宗教传说设计器", "category": "历史传说", "focus": "宗教相关传说设计"},
    {"id": "ls-012", "name": "传说-家族传说设计器", "category": "历史传说", "focus": "家族传承传说设计"},
    {"id": "ls-013", "name": "传说-神器传说设计器", "category": "历史传说", "focus": "神器宝物传说设计"},
    {"id": "ls-014", "name": "传说-地点传说设计器", "category": "历史传说", "focus": "特殊地点传说设计"},
    {"id": "ls-015", "name": "传说-诅咒传说设计器", "category": "历史传说", "focus": "诅咒相关传说设计"},
    {"id": "ls-016", "name": "传说-预言传说设计器", "category": "历史传说", "focus": "预言类传说设计"},
    {"id": "ls-017", "name": "传说-失落文明设计器", "category": "历史传说", "focus": "失落文明传说设计"},
    {"id": "ls-018", "name": "传说-禁忌传说设计器", "category": "历史传说", "focus": "禁忌相关传说设计"},
    {"id": "ls-019", "name": "传说-传承传说设计器", "category": "历史传说", "focus": "技艺传承传说设计"},
    {"id": "ls-020", "name": "传说-秘闻传说设计器", "category": "历史传说", "focus": "秘闻轶事传说设计"},
]

# ==================== 8. 地理与地貌 (20个) ====================
DILI_AGENTS = [
    {"id": "dl-001", "name": "地理-大陆板块设计器", "category": "地理地貌", "focus": "世界大陆板块设计"},
    {"id": "dl-002", "name": "地理-海洋湖泊设计器", "category": "地理地貌", "focus": "海洋湖泊分布设计"},
    {"id": "dl-003", "name": "地理-山脉丘陵设计器", "category": "地理地貌", "focus": "山脉丘陵地形设计"},
    {"id": "dl-004", "name": "地理-平原盆地设计器", "category": "地理地貌", "focus": "平原盆地地形设计"},
    {"id": "dl-005", "name": "地理-沙漠荒原设计器", "category": "地理地貌", "focus": "沙漠荒原地形设计"},
    {"id": "dl-006", "name": "地理-森林雨林设计器", "category": "地理地貌", "focus": "森林雨林地形设计"},
    {"id": "dl-007", "name": "地理-冰川雪原设计器", "category": "地理地貌", "focus": "冰川雪原地形设计"},
    {"id": "dl-008", "name": "地理-岛屿群岛设计器", "category": "地理地貌", "focus": "岛屿群岛分布设计"},
    {"id": "dl-009", "name": "地理-地下世界设计器", "category": "地理地貌", "focus": "地下洞穴世界设计"},
    {"id": "dl-010", "name": "地理-天空之城设计器", "category": "地理地貌", "focus": "浮空岛屿城市设计"},
    {"id": "dl-011", "name": "地貌-火山地貌设计器", "category": "地理地貌", "focus": "火山地貌特征设计"},
    {"id": "dl-012", "name": "地貌-喀斯特地貌设计器", "category": "地理地貌", "focus": "喀斯特地貌设计"},
    {"id": "dl-013", "name": "地貌-峡谷地貌设计器", "category": "地理地貌", "focus": "峡谷地貌设计"},
    {"id": "dl-014", "name": "地貌-湿地沼泽设计器", "category": "地理地貌", "focus": "湿地沼泽地貌设计"},
    {"id": "dl-015", "name": "地貌-特殊地貌设计器", "category": "地理地貌", "focus": "奇幻特殊地貌设计"},
    {"id": "dl-016", "name": "气候-气候带分布设计器", "category": "地理地貌", "focus": "气候带分布设计"},
    {"id": "dl-017", "name": "气候-季节变化设计器", "category": "地理地貌", "focus": "季节变化规律设计"},
    {"id": "dl-018", "name": "气候-极端天气设计器", "category": "地理地貌", "focus": "极端天气现象设计"},
    {"id": "dl-019", "name": "气候-天象奇观设计器", "category": "地理地貌", "focus": "特殊天象奇观设计"},
    {"id": "dl-020", "name": "气候-环境灾害设计器", "category": "地理地貌", "focus": "环境灾害设计"},
]

# ==================== 9. 魔法/科技体系 (20个) ====================
MOFA_AGENTS = [
    {"id": "mf-001", "name": "魔法-元素魔法体系设计器", "category": "魔法科技", "focus": "元素魔法体系设计"},
    {"id": "mf-002", "name": "魔法-奥术魔法体系设计器", "category": "魔法科技", "focus": "奥术魔法体系设计"},
    {"id": "mf-003", "name": "魔法-神圣魔法体系设计器", "category": "魔法科技", "focus": "神圣/光明魔法体系"},
    {"id": "mf-004", "name": "魔法-黑暗魔法体系设计器", "category": "魔法科技", "focus": "黑暗/亡灵魔法体系"},
    {"id": "mf-005", "name": "魔法-自然魔法体系设计器", "category": "魔法科技", "focus": "自然/德鲁伊魔法体系"},
    {"id": "mf-006", "name": "魔法-精神魔法体系设计器", "category": "魔法科技", "focus": "精神/心灵魔法体系"},
    {"id": "mf-007", "name": "魔法-时空魔法体系设计器", "category": "魔法科技", "focus": "时空魔法体系设计"},
    {"id": "mf-008", "name": "魔法-召唤魔法体系设计器", "category": "魔法科技", "focus": "召唤魔法体系设计"},
    {"id": "mf-009", "name": "魔法-炼金术体系设计器", "category": "魔法科技", "focus": "炼金术体系设计"},
    {"id": "mf-010", "name": "魔法-符文魔法体系设计器", "category": "魔法科技", "focus": "符文魔法体系设计"},
    {"id": "mf-011", "name": "科技-能源科技体系设计器", "category": "魔法科技", "focus": "能源科技体系设计"},
    {"id": "mf-012", "name": "科技-材料科技体系设计器", "category": "魔法科技", "focus": "材料科技体系设计"},
    {"id": "mf-013", "name": "科技-信息科技体系设计器", "category": "魔法科技", "focus": "信息科技体系设计"},
    {"id": "mf-014", "name": "科技-生物科技体系设计器", "category": "魔法科技", "focus": "生物科技体系设计"},
    {"id": "mf-015", "name": "科技-空间科技体系设计器", "category": "魔法科技", "focus": "空间科技体系设计"},
    {"id": "mf-016", "name": "科技-武器科技体系设计器", "category": "魔法科技", "focus": "武器科技体系设计"},
    {"id": "mf-017", "name": "科技-医疗科技体系设计器", "category": "魔法科技", "focus": "医疗科技体系设计"},
    {"id": "mf-018", "name": "科技-交通科技体系设计器", "category": "魔法科技", "focus": "交通科技体系设计"},
    {"id": "mf-019", "name": "体系-等级体系设计器", "category": "魔法科技", "focus": "魔法/科技等级体系"},
    {"id": "mf-020", "name": "体系-限制体系设计器", "category": "魔法科技", "focus": "魔法/科技限制体系"},
]

# ==================== 10. 势力与组织 (20个) ====================
SHILI_AGENTS = [
    {"id": "sl-001", "name": "势力-帝国王朝设计器", "category": "势力组织", "focus": "帝国/王朝势力设计"},
    {"id": "sl-002", "name": "势力-王国公国设计器", "category": "势力组织", "focus": "王国/公国势力设计"},
    {"id": "sl-003", "name": "势力-城邦联盟设计器", "category": "势力组织", "focus": "城邦/联盟势力设计"},
    {"id": "sl-004", "name": "势力-宗门教派设计器", "category": "势力组织", "focus": "宗门/教派势力设计"},
    {"id": "sl-005", "name": "势力-家族世家设计器", "category": "势力组织", "focus": "家族/世家势力设计"},
    {"id": "sl-006", "name": "势力-商会行会设计器", "category": "势力组织", "focus": "商会/行会势力设计"},
    {"id": "sl-007", "name": "势力-佣兵冒险团设计器", "category": "势力组织", "focus": "佣兵/冒险团设计"},
    {"id": "sl-008", "name": "势力-刺客组织设计器", "category": "势力组织", "focus": "刺客/暗杀组织设计"},
    {"id": "sl-009", "name": "势力-情报组织设计器", "category": "势力组织", "focus": "情报/间谍组织设计"},
    {"id": "sl-010", "name": "势力-反抗组织设计器", "category": "势力组织", "focus": "反抗/革命组织设计"},
    {"id": "sl-011", "name": "组织-政治结构设计器", "category": "势力组织", "focus": "组织政治结构设计"},
    {"id": "sl-012", "name": "组织-等级制度设计器", "category": "势力组织", "focus": "组织等级制度设计"},
    {"id": "sl-013", "name": "组织-权力结构分析器", "category": "势力组织", "focus": "组织权力结构分析"},
    {"id": "sl-014", "name": "组织-利益关系梳理器", "category": "势力组织", "focus": "组织利益关系梳理"},
    {"id": "sl-015", "name": "组织-冲突矛盾设计器", "category": "势力组织", "focus": "组织间冲突矛盾设计"},
    {"id": "sl-016", "name": "组织-联盟关系设计器", "category": "势力组织", "focus": "组织间联盟关系设计"},
    {"id": "sl-017", "name": "组织-敌对关系设计器", "category": "势力组织", "focus": "组织间敌对关系设计"},
    {"id": "sl-018", "name": "组织-附属关系设计器", "category": "势力组织", "focus": "组织间附属关系设计"},
    {"id": "sl-019", "name": "组织-秘密结社设计器", "category": "势力组织", "focus": "秘密结社组织设计"},
    {"id": "sl-020", "name": "组织-国际组织设计器", "category": "势力组织", "focus": "跨国/世界组织设计"},
]

# ==================== 11. 种族与生物 (20个) ====================
ZHONGZU_AGENTS = [
    {"id": "zz-001", "name": "种族-人类分支设计器", "category": "种族生物", "focus": "人类种族分支设计"},
    {"id": "zz-002", "name": "种族-精灵族设计器", "category": "种族生物", "focus": "精灵种族特征设计"},
    {"id": "zz-003", "name": "种族-矮人族设计器", "category": "种族生物", "focus": "矮人种族特征设计"},
    {"id": "zz-004", "name": "种族-兽人族设计器", "category": "种族生物", "focus": "兽人种族特征设计"},
    {"id": "zz-005", "name": "种族-龙族设计器", "category": "种族生物", "focus": "龙族特征与等级设计"},
    {"id": "zz-006", "name": "种族-恶魔族设计器", "category": "种族生物", "focus": "恶魔种族特征设计"},
    {"id": "zz-007", "name": "种族-天使族设计器", "category": "种族生物", "focus": "天使种族特征设计"},
    {"id": "zz-008", "name": "种族-亡灵族设计器", "category": "种族生物", "focus": "亡灵种族特征设计"},
    {"id": "zz-009", "name": "种族-元素生物设计器", "category": "种族生物", "focus": "元素生物特征设计"},
    {"id": "zz-010", "name": "种族-混血种族设计器", "category": "种族生物", "focus": "混血种族特征设计"},
    {"id": "zz-011", "name": "生物-普通动物设计器", "category": "种族生物", "focus": "普通动物生态设计"},
    {"id": "zz-012", "name": "生物-奇幻野兽设计器", "category": "种族生物", "focus": "奇幻野兽特征设计"},
    {"id": "zz-013", "name": "生物-魔兽妖兽设计器", "category": "种族生物", "focus": "魔兽/妖兽等级设计"},
    {"id": "zz-014", "name": "生物-神兽圣兽设计器", "category": "种族生物", "focus": "神兽/圣兽特征设计"},
    {"id": "zz-015", "name": "生物-植物生命设计器", "category": "种族生物", "focus": "植物类生命设计"},
    {"id": "zz-016", "name": "生物-昆虫类设计器", "category": "种族生物", "focus": "昆虫类生物设计"},
    {"id": "zz-017", "name": "生物-水生生物设计器", "category": "种族生物", "focus": "水生生物特征设计"},
    {"id": "zz-018", "name": "生物-飞行生物设计器", "category": "种族生物", "focus": "飞行生物特征设计"},
    {"id": "zz-019", "name": "生物-地下生物设计器", "category": "种族生物", "focus": "地下生物特征设计"},
    {"id": "zz-020", "name": "生物-智慧怪物设计器", "category": "种族生物", "focus": "智慧型怪物设计"},
]

# ==================== 12. 世界规则 (20个) ====================
GUIZE_AGENTS = [
    {"id": "gz-001", "name": "规则-物理规则设定器", "category": "世界规则", "focus": "基础物理规则设定"},
    {"id": "gz-002", "name": "规则-魔法规则设定器", "category": "世界规则", "focus": "魔法运作规则设定"},
    {"id": "gz-003", "name": "规则-生死规则设定器", "category": "世界规则", "focus": "生死轮回规则设定"},
    {"id": "gz-004", "name": "规则-时间规则设定器", "category": "世界规则", "focus": "时间流动规则设定"},
    {"id": "gz-005", "name": "规则-空间规则设定器", "category": "世界规则", "focus": "空间结构规则设定"},
    {"id": "gz-006", "name": "规则-因果规则设定器", "category": "世界规则", "focus": "因果报应规则设定"},
    {"id": "gz-007", "name": "规则-命运规则设定器", "category": "世界规则", "focus": "命运天命规则设定"},
    {"id": "gz-008", "name": "规则-进化规则设定器", "category": "世界规则", "focus": "生物进化规则设定"},
    {"id": "gz-009", "name": "规则-修炼规则设定器", "category": "世界规则", "focus": "修炼升级规则设定"},
    {"id": "gz-010", "name": "规则-契约规则设定器", "category": "世界规则", "focus": "契约誓约规则设定"},
    {"id": "gz-011", "name": "法则-自然法则设计器", "category": "世界规则", "focus": "自然运行法则设计"},
    {"id": "gz-012", "name": "法则-社会法则设计器", "category": "世界规则", "focus": "社会运行法则设计"},
    {"id": "gz-013", "name": "法则-经济法则设计器", "category": "世界规则", "focus": "经济运行法则设计"},
    {"id": "gz-014", "name": "法则-战争法则设计器", "category": "世界规则", "focus": "战争规则设计"},
    {"id": "gz-015", "name": "法则-外交法则设计器", "category": "世界规则", "focus": "外交规则设计"},
    {"id": "gz-016", "name": "限制-力量限制设计器", "category": "世界规则", "focus": "力量上限限制设计"},
    {"id": "gz-017", "name": "限制-知识限制设计器", "category": "世界规则", "focus": "知识传播限制设计"},
    {"id": "gz-018", "name": "限制-资源限制设计器", "category": "世界规则", "focus": "资源稀缺限制设计"},
    {"id": "gz-019", "name": "限制-地域限制设计器", "category": "世界规则", "focus": "地域活动限制设计"},
    {"id": "gz-020", "name": "限制-禁忌限制设计器", "category": "世界规则", "focus": "禁忌事项限制设计"},
]

# ==================== 13. 文化与习俗 (20个) ====================
WENHUA_AGENTS = [
    {"id": "wh-001", "name": "文化-语言文字设计器", "category": "文化习俗", "focus": "语言文字系统设计"},
    {"id": "wh-002", "name": "文化-宗教信仰设计器", "category": "文化习俗", "focus": "宗教信仰体系设计"},
    {"id": "wh-003", "name": "文化-哲学思想设计器", "category": "文化习俗", "focus": "哲学思想体系设计"},
    {"id": "wh-004", "name": "文化-艺术美学设计器", "category": "文化习俗", "focus": "艺术美学风格设计"},
    {"id": "wh-005", "name": "文化-文学传统设计器", "category": "文化习俗", "focus": "文学传统设计"},
    {"id": "wh-006", "name": "文化-音乐舞蹈设计器", "category": "文化习俗", "focus": "音乐舞蹈文化设计"},
    {"id": "wh-007", "name": "文化-服饰文化设计器", "category": "文化习俗", "focus": "服饰文化设计"},
    {"id": "wh-008", "name": "文化-饮食文化设计器", "category": "文化习俗", "focus": "饮食文化设计"},
    {"id": "wh-009", "name": "文化-建筑文化设计器", "category": "文化习俗", "focus": "建筑文化设计"},
    {"id": "wh-010", "name": "文化-礼仪文化设计器", "category": "文化习俗", "focus": "礼仪文化设计"},
    {"id": "wh-011", "name": "习俗-节日庆典设计器", "category": "文化习俗", "focus": "节日庆典习俗设计"},
    {"id": "wh-012", "name": "习俗-婚丧嫁娶设计器", "category": "文化习俗", "focus": "婚丧嫁娶习俗设计"},
    {"id": "wh-013", "name": "习俗-出生成长设计器", "category": "文化习俗", "focus": "出生成长习俗设计"},
    {"id": "wh-014", "name": "习俗-成人仪式设计器", "category": "文化习俗", "focus": "成人仪式习俗设计"},
    {"id": "wh-015", "name": "习俗-社交礼仪设计器", "category": "文化习俗", "focus": "社交礼仪习俗设计"},
    {"id": "wh-016", "name": "习俗-禁忌避讳设计器", "category": "文化习俗", "focus": "禁忌避讳习俗设计"},
    {"id": "wh-017", "name": "习俗-占卜预测设计器", "category": "文化习俗", "focus": "占卜预测习俗设计"},
    {"id": "wh-018", "name": "习俗-竞技比赛设计器", "category": "文化习俗", "focus": "竞技比赛习俗设计"},
    {"id": "wh-019", "name": "习俗-交易商业设计器", "category": "文化习俗", "focus": "交易商业习俗设计"},
    {"id": "wh-020", "name": "习俗-日常生活设计器", "category": "文化习俗", "focus": "日常生活习俗设计"},
]

# ==================== 14. 人物档案系统 (20个) ====================
RENWU_DANGAN_AGENTS = [
    {"id": "rd-001", "name": "档案-基础信息设计器", "category": "人物档案", "focus": "人物基础信息档案"},
    {"id": "rd-002", "name": "档案-外貌特征设计器", "category": "人物档案", "focus": "人物外貌特征档案"},
    {"id": "rd-003", "name": "档案-性格档案设计器", "category": "人物档案", "focus": "人物性格档案"},
    {"id": "rd-004", "name": "档案-能力档案设计器", "category": "人物档案", "focus": "人物能力档案"},
    {"id": "rd-005", "name": "档案-背景故事设计器", "category": "人物档案", "focus": "人物背景故事档案"},
    {"id": "rd-006", "name": "档案-人际关系设计器", "category": "人物档案", "focus": "人物人际关系档案"},
    {"id": "rd-007", "name": "档案-成长轨迹设计器", "category": "人物档案", "focus": "人物成长轨迹档案"},
    {"id": "rd-008", "name": "档案-目标动机设计器", "category": "人物档案", "focus": "人物目标动机档案"},
    {"id": "rd-009", "name": "档案-恐惧弱点设计器", "category": "人物档案", "focus": "人物恐惧弱点档案"},
    {"id": "rd-010", "name": "档案-秘密隐私设计器", "category": "人物档案", "focus": "人物秘密隐私档案"},
    {"id": "rd-011", "name": "人物-主角档案模板器", "category": "人物档案", "focus": "主角档案模板"},
    {"id": "rd-012", "name": "人物-反派档案模板器", "category": "人物档案", "focus": "反派档案模板"},
    {"id": "rd-013", "name": "人物-配角档案模板器", "category": "人物档案", "focus": "配角档案模板"},
    {"id": "rd-014", "name": "人物-导师档案模板器", "category": "人物档案", "focus": "导师型角色档案"},
    {"id": "rd-015", "name": "人物-盟友档案模板器", "category": "人物档案", "focus": "盟友型角色档案"},
    {"id": "rd-016", "name": "人物-对手档案模板器", "category": "人物档案", "focus": "对手型角色档案"},
    {"id": "rd-017", "name": "人物-爱情线档案器", "category": "人物档案", "focus": "爱情线角色档案"},
    {"id": "rd-018", "name": "人物-亲情线档案器", "category": "人物档案", "focus": "亲情线角色档案"},
    {"id": "rd-019", "name": "人物-友情线档案器", "category": "人物档案", "focus": "友情线角色档案"},
    {"id": "rd-020", "name": "人物-群像档案管理器", "category": "人物档案", "focus": "群像角色档案管理"},
]

# ==================== 15. 物品道具系统 (20个) ====================
WUPIN_AGENTS = [
    {"id": "wp-001", "name": "物品-武器装备设计器", "category": "物品道具", "focus": "武器装备设计"},
    {"id": "wp-002", "name": "物品-防具护甲设计器", "category": "物品道具", "focus": "防具护甲设计"},
    {"id": "wp-003", "name": "物品-饰品配饰设计器", "category": "物品道具", "focus": "饰品配饰设计"},
    {"id": "wp-004", "name": "物品-神器圣器设计器", "category": "物品道具", "focus": "神器圣器设计"},
    {"id": "wp-005", "name": "物品-魔器邪器设计器", "category": "物品道具", "focus": "魔器邪器设计"},
    {"id": "wp-006", "name": "物品-日常用品设计器", "category": "物品道具", "focus": "日常用品设计"},
    {"id": "wp-007", "name": "物品-工具器具设计器", "category": "物品道具", "focus": "工具器具设计"},
    {"id": "wp-008", "name": "物品-材料资源设计器", "category": "物品道具", "focus": "材料资源设计"},
    {"id": "wp-009", "name": "物品-药品丹药设计器", "category": "物品道具", "focus": "药品丹药设计"},
    {"id": "wp-010", "name": "物品-食物饮品设计器", "category": "物品道具", "focus": "食物饮品设计"},
    {"id": "wp-011", "name": "道具-功能道具设计器", "category": "物品道具", "focus": "功能性道具设计"},
    {"id": "wp-012", "name": "道具-剧情道具设计器", "category": "物品道具", "focus": "剧情关键道具设计"},
    {"id": "wp-013", "name": "道具-信物道具设计器", "category": "物品道具", "focus": "信物类道具设计"},
    {"id": "wp-014", "name": "道具-藏宝图设计器", "category": "物品道具", "focus": "藏宝图类道具设计"},
    {"id": "wp-015", "name": "道具-钥匙道具设计器", "category": "物品道具", "focus": "钥匙类道具设计"},
    {"id": "wp-016", "name": "道具-书籍卷轴设计器", "category": "物品道具", "focus": "书籍卷轴设计"},
    {"id": "wp-017", "name": "道具-货币财富设计器", "category": "物品道具", "focus": "货币财富设计"},
    {"id": "wp-018", "name": "道具-交通工具设计器", "category": "物品道具", "focus": "交通工具设计"},
    {"id": "wp-019", "name": "道具-通讯工具设计器", "category": "物品道具", "focus": "通讯工具设计"},
    {"id": "wp-020", "name": "道具-储物空间设计器", "category": "物品道具", "focus": "储物空间设计"},
]

# ==================== 16. 地点场景系统 (20个) ====================
DIDIAN_AGENTS = [
    {"id": "dd-001", "name": "地点-城市规划设计器", "category": "地点场景", "focus": "城市规划设计"},
    {"id": "dd-002", "name": "地点-村镇布局设计器", "category": "地点场景", "focus": "村镇布局设计"},
    {"id": "dd-003", "name": "地点-建筑内部设计器", "category": "地点场景", "focus": "建筑内部场景设计"},
    {"id": "dd-004", "name": "地点-自然景观设计器", "category": "地点场景", "focus": "自然景观场景设计"},
    {"id": "dd-005", "name": "地点-地下城设计器", "category": "地点场景", "focus": "地下城场景设计"},
    {"id": "dd-006", "name": "地点-迷宫设计器", "category": "地点场景", "focus": "迷宫场景设计"},
    {"id": "dd-007", "name": "地点-副本设计器", "category": "地点场景", "focus": "副本场景设计"},
    {"id": "dd-008", "name": "地点-秘境设计器", "category": "地点场景", "focus": "秘境场景设计"},
    {"id": "dd-009", "name": "地点-战场设计器", "category": "地点场景", "focus": "战场场景设计"},
    {"id": "dd-010", "name": "地点-禁地设计器", "category": "地点场景", "focus": "禁地场景设计"},
    {"id": "dd-011", "name": "场景-战斗场景设计器", "category": "地点场景", "focus": "战斗场景设计"},
    {"id": "dd-012", "name": "场景-对话场景设计器", "category": "地点场景", "focus": "对话场景设计"},
    {"id": "dd-013", "name": "场景-情感场景设计器", "category": "地点场景", "focus": "情感场景设计"},
    {"id": "dd-014", "name": "场景-探索场景设计器", "category": "地点场景", "focus": "探索场景设计"},
    {"id": "dd-015", "name": "场景-逃亡场景设计器", "category": "地点场景", "focus": "逃亡场景设计"},
    {"id": "dd-016", "name": "场景-聚会场景设计器", "category": "地点场景", "focus": "聚会场景设计"},
    {"id": "dd-017", "name": "场景-独处场景设计器", "category": "地点场景", "focus": "独处场景设计"},
    {"id": "dd-018", "name": "场景-回忆场景设计器", "category": "地点场景", "focus": "回忆场景设计"},
    {"id": "dd-019", "name": "场景-梦境场景设计器", "category": "地点场景", "focus": "梦境场景设计"},
    {"id": "dd-020", "name": "场景-转场场景设计器", "category": "地点场景", "focus": "转场场景设计"},
]

# ==================== 17. 势力阵营系统 (20个) ====================
SHILI_ZHENYING_AGENTS = [
    {"id": "sz-001", "name": "阵营-正义阵营设计器", "category": "势力阵营", "focus": "正义阵营设计"},
    {"id": "sz-002", "name": "阵营-邪恶阵营设计器", "category": "势力阵营", "focus": "邪恶阵营设计"},
    {"id": "sz-003", "name": "阵营-中立阵营设计器", "category": "势力阵营", "focus": "中立阵营设计"},
    {"id": "sz-004", "name": "阵营-秩序阵营设计器", "category": "势力阵营", "focus": "秩序阵营设计"},
    {"id": "sz-005", "name": "阵营-混乱阵营设计器", "category": "势力阵营", "focus": "混乱阵营设计"},
    {"id": "sz-006", "name": "阵营-九宫格阵营器", "category": "势力阵营", "focus": "DND九宫格阵营"},
    {"id": "sz-007", "name": "阵营-多方势力设计器", "category": "势力阵营", "focus": "多方势力博弈设计"},
    {"id": "sz-008", "name": "阵营-阵营转换设计器", "category": "势力阵营", "focus": "阵营转换设计"},
    {"id": "sz-009", "name": "阵营-阵营冲突设计器", "category": "势力阵营", "focus": "阵营冲突设计"},
    {"id": "sz-010", "name": "阵营-阵营联盟设计器", "category": "势力阵营", "focus": "阵营联盟设计"},
    {"id": "sz-011", "name": "势力-势力等级设计器", "category": "势力阵营", "focus": "势力等级划分"},
    {"id": "sz-012", "name": "势力-势力范围设计器", "category": "势力阵营", "focus": "势力范围划分"},
    {"id": "sz-013", "name": "势力-势力资源设计器", "category": "势力阵营", "focus": "势力资源分配"},
    {"id": "sz-014", "name": "势力-势力人物设计器", "category": "势力阵营", "focus": "势力代表人物"},
    {"id": "sz-015", "name": "势力-势力历史设计器", "category": "势力阵营", "focus": "势力历史背景"},
    {"id": "sz-016", "name": "势力-势力目标设计器", "category": "势力阵营", "focus": "势力目标动机"},
    {"id": "sz-017", "name": "势力-势力暗线设计器", "category": "势力阵营", "focus": "势力暗线布局"},
    {"id": "sz-018", "name": "势力-势力渗透设计器", "category": "势力阵营", "focus": "势力渗透布局"},
    {"id": "sz-019", "name": "势力-势力衰退设计器", "category": "势力阵营", "focus": "势力衰退过程"},
    {"id": "sz-020", "name": "势力-势力崛起设计器", "category": "势力阵营", "focus": "势力崛起过程"},
]

# ==================== 18. 魔法技能系统 (20个) ====================
MOFA_JINENG_AGENTS = [
    {"id": "mj-001", "name": "技能-攻击技能设计器", "category": "魔法技能", "focus": "攻击型技能设计"},
    {"id": "mj-002", "name": "技能-防御技能设计器", "category": "魔法技能", "focus": "防御型技能设计"},
    {"id": "mj-003", "name": "技能-辅助技能设计器", "category": "魔法技能", "focus": "辅助型技能设计"},
    {"id": "mj-004", "name": "技能-治疗技能设计器", "category": "魔法技能", "focus": "治疗型技能设计"},
    {"id": "mj-005", "name": "技能-控制技能设计器", "category": "魔法技能", "focus": "控制型技能设计"},
    {"id": "mj-006", "name": "技能-召唤技能设计器", "category": "魔法技能", "focus": "召唤型技能设计"},
    {"id": "mj-007", "name": "技能-位移技能设计器", "category": "魔法技能", "focus": "位移型技能设计"},
    {"id": "mj-008", "name": "技能-变身技能设计器", "category": "魔法技能", "focus": "变身型技能设计"},
    {"id": "mj-009", "name": "技能-领域技能设计器", "category": "魔法技能", "focus": "领域型技能设计"},
    {"id": "mj-010", "name": "技能-禁咒技能设计器", "category": "魔法技能", "focus": "禁咒级技能设计"},
    {"id": "mj-011", "name": "魔法-元素魔法设计器", "category": "魔法技能", "focus": "元素系魔法设计"},
    {"id": "mj-012", "name": "魔法-奥术魔法设计器", "category": "魔法技能", "focus": "奥术系魔法设计"},
    {"id": "mj-013", "name": "魔法-神圣魔法设计器", "category": "魔法技能", "focus": "神圣系魔法设计"},
    {"id": "mj-014", "name": "魔法-黑暗魔法设计器", "category": "魔法技能", "focus": "黑暗系魔法设计"},
    {"id": "mj-015", "name": "魔法-自然魔法设计器", "category": "魔法技能", "focus": "自然系魔法设计"},
    {"id": "mj-016", "name": "魔法-时空魔法设计器", "category": "魔法技能", "focus": "时空系魔法设计"},
    {"id": "mj-017", "name": "魔法-精神魔法设计器", "category": "魔法技能", "focus": "精神系魔法设计"},
    {"id": "mj-018", "name": "魔法-炼金术设计器", "category": "魔法技能", "focus": "炼金术技能设计"},
    {"id": "mj-019", "name": "魔法-符文魔法设计器", "category": "魔法技能", "focus": "符文系魔法设计"},
    {"id": "mj-020", "name": "魔法-组合技能设计器", "category": "魔法技能", "focus": "组合技设计"},
]

# ==================== 19. 情节设计系统 (20个) ====================
QINGJIE_AGENTS = [
    {"id": "qj-001", "name": "情节-开篇情节设计器", "category": "情节设计", "focus": "开篇情节设计"},
    {"id": "qj-002", "name": "情节-发展情节设计器", "category": "情节设计", "focus": "发展情节设计"},
    {"id": "qj-003", "name": "情节-高潮情节设计器", "category": "情节设计", "focus": "高潮情节设计"},
    {"id": "qj-004", "name": "情节-结局情节设计器", "category": "情节设计", "focus": "结局情节设计"},
    {"id": "qj-005", "name": "情节-转折情节设计器", "category": "情节设计", "focus": "转折情节设计"},
    {"id": "qj-006", "name": "情节-冲突情节设计器", "category": "情节设计", "focus": "冲突情节设计"},
    {"id": "qj-007", "name": "情节-和解情节设计器", "category": "情节设计", "focus": "和解情节设计"},
    {"id": "qj-008", "name": "情节-误会情节设计器", "category": "情节设计", "focus": "误会情节设计"},
    {"id": "qj-009", "name": "情节-揭秘情节设计器", "category": "情节设计", "focus": "揭秘情节设计"},
    {"id": "qj-010", "name": "情节-复仇情节设计器", "category": "情节设计", "focus": "复仇情节设计"},
    {"id": "qj-011", "name": "套路-退婚流套路器", "category": "情节设计", "focus": "退婚流套路设计"},
    {"id": "qj-012", "name": "套路-废柴流套路器", "category": "情节设计", "focus": "废柴流套路设计"},
    {"id": "qj-013", "name": "套路-系统流套路器", "category": "情节设计", "focus": "系统流套路设计"},
    {"id": "qj-014", "name": "套路-重生流套路器", "category": "情节设计", "focus": "重生流套路设计"},
    {"id": "qj-015", "name": "套路-穿越流套路器", "category": "情节设计", "focus": "穿越流套路设计"},
    {"id": "qj-016", "name": "套路-无敌流套路器", "category": "情节设计", "focus": "无敌流套路设计"},
    {"id": "qj-017", "name": "套路-种田流套路器", "category": "情节设计", "focus": "种田流套路设计"},
    {"id": "qj-018", "name": "套路-争霸流套路器", "category": "情节设计", "focus": "争霸流套路设计"},
    {"id": "qj-019", "name": "套路-狗粮流套路器", "category": "情节设计", "focus": "狗粮流套路设计"},
    {"id": "qj-020", "name": "套路-虐主流套路器", "category": "情节设计", "focus": "虐主流套路设计"},
]

# 合并所有Agent
ALL_AGENTS = {
    "fubi": FUBI_AGENTS,
    "qingxu": QINGXU_AGENTS,
    "xunhuan": XUNHUAN_AGENTS,
    "juese": JUESE_AGENTS,
    "xingge": XINGGE_AGENTS,
    "shijie_guan": SHIJIE_GUAN_AGENTS,
    "lishi": LISHI_AGENTS,
    "dili": DILI_AGENTS,
    "mofa": MOFA_AGENTS,
    "shili": SHILI_AGENTS,
    "zhongzu": ZHONGZU_AGENTS,
    "guize": GUIZE_AGENTS,
    "wenhua": WENHUA_AGENTS,
    "renwu_dangan": RENWU_DANGAN_AGENTS,
    "wupin": WUPIN_AGENTS,
    "didian": DIDIAN_AGENTS,
    "shili_zhenying": SHILI_ZHENYING_AGENTS,
    "mofa_jineng": MOFA_JINENG_AGENTS,
    "qingjie": QINGJIE_AGENTS,
}

def generate_skill_md(agent, category_name):
    return f"""# {agent['name']}

## 角色定位
{agent['category']}领域的专业化Agent，专注于{agent['focus']}。

## 核心能力
- 深度掌握{agent['focus']}的专业方法论
- 提供系统化、可操作的创作指导
- 强化记忆管理、分工协作与写作执行

## 工作原则
1. **专注聚焦**: 只专注于{agent['focus']}这一细分领域
2. **记忆强化**: 建立完善的记忆点管理系统
3. **分工明确**: 明确职责边界，做好自己的一部分
4. **执行落地**: 提供可立即执行的写作方案

## 输入输出规范
- **输入**: 创作需求或待处理内容
- **输出**: 基于{agent['focus']}的专业化处理结果

## 质量要求
- 输出必须具有可操作性和实用性
- 输出必须保持专业性和准确性
- 输出必须强化读者记忆与阅读体验
"""

def generate_requirement_md(agent, category_name):
    return f"""# {agent['name']} - 需求文档

## 功能需求

### 核心功能
1. 实现{agent['focus']}的专业化处理
2. 提供该领域的标准化工作流程
3. 输出符合专业标准的结果

### 功能详细说明
- **功能1**: 接收用户输入的创作需求
- **功能2**: 基于{agent['focus']}进行专业分析
- **功能3**: 输出符合标准的处理结果
- **功能4**: 提供记忆强化与分工建议

## 非功能需求

### 性能要求
- 响应时间: 快速响应
- 处理能力: 处理复杂需求

### 质量要求
- 准确性: 专业准确
- 完整性: 逻辑完整
- 实用性: 可执行落地

## 约束条件
- 必须严格遵循{agent['category']}的理论框架
- 不得偏离{agent['focus']}的专注领域
- 保持输出内容的体系完整性
"""

def generate_design_md(agent, category_name):
    return f"""# {agent['name']} - 设计文档

## 架构设计

### 核心模块
1. **输入解析模块**: 解析用户需求
2. **专业处理模块**: 执行{agent['focus']}的处理
3. **记忆管理模块**: 管理关键记忆点
4. **输出生成模块**: 生成标准化输出

### 数据流
```
用户输入 -> 需求解析 -> 专业处理 -> 记忆管理 -> 结果输出
```

## 算法设计

### 核心算法
1. **需求分析算法**: 分析需求类型和重点
2. **专业处理算法**: 执行专业化处理流程
3. **记忆强化算法**: 强化关键信息记忆
4. **质量检查算法**: 检查结果质量

## 接口设计

### 输入接口
- 接受自然语言描述
- 接受结构化参数

### 输出接口
- 输出结构化结果
- 提供处理说明

## 记忆管理设计
- 建立关键信息档案
- 设计记忆锚点
- 强化读者记忆
"""

def generate_tasks_md(agent, category_name):
    return f"""# {agent['name']} - 任务文档

## 主要任务

### 任务1: 需求理解
- **描述**: 深入理解用户创作需求
- **输入**: 用户描述
- **输出**: 结构化需求分析
- **验收标准**: 准确把握意图

### 任务2: 专业处理
- **描述**: 执行{agent['focus']}的专业处理
- **输入**: 需求分析
- **输出**: 专业化结果
- **验收标准**: 专业水准

### 任务3: 记忆强化
- **描述**: 强化关键信息记忆点
- **输入**: 处理结果
- **输出**: 记忆强化方案
- **验收标准**: 易于记忆

### 任务4: 分工建议
- **描述**: 提供明确分工建议
- **输入**: 处理结果
- **输出**: 分工方案
- **验收标准**: 职责清晰

## 子任务分解

### 任务1的子任务
1. 关键词提取
2. 需求分类
3. 重点识别

### 任务2的子任务
1. 方法论选择
2. 具体执行
3. 结果整合

### 任务3的子任务
1. 记忆点识别
2. 强化策略
3. 锚点设置

### 任务4的子任务
1. 职责划分
2. 边界确定
3. 协作方案

## 任务依赖关系
```
任务1 -> 任务2 -> 任务3 -> 任务4
```
"""

def generate_checklist_md(agent, category_name):
    return f"""# {agent['name']} - 检查清单

## 功能检查

### 核心功能检查
- [ ] 能够正确接收用户输入
- [ ] 能够准确理解用户需求
- [ ] 能够执行{agent['focus']}的处理
- [ ] 能够输出符合要求的结果

### 记忆强化检查
- [ ] 关键信息是否突出
- [ ] 记忆锚点是否设置
- [ ] 重复提醒是否到位
- [ ] 遗忘对抗是否有效

### 分工明确检查
- [ ] 职责边界是否清晰
- [ ] 协作流程是否明确
- [ ] 交接节点是否定义
- [ ] 责任归属是否清楚

## 质量检查

### 准确性检查
- [ ] 理论应用准确
- [ ] 方法使用正确
- [ ] 逻辑推理严密
- [ ] 结论合理可靠

### 完整性检查
- [ ] 内容逻辑完整
- [ ] 流程完整闭环
- [ ] 信息包含必要内容
- [ ] 建议可执行

### 实用性检查
- [ ] 具有可操作性
- [ ] 提供具体步骤
- [ ] 给出明确指导
- [ ] 结果可直接应用

## 写作强化检查

### 记忆问题强化
- [ ] 关键信息强化记忆
- [ ] 重复提醒机制
- [ ] 记忆锚点设置
- [ ] 遗忘对抗策略

### 分工问题强化
- [ ] 职责边界清晰
- [ ] 协作流程明确
- [ ] 责任归属清楚
- [ ] 交接节点定义

### 写作问题强化
- [ ] 写作方法具体
- [ ] 执行步骤清晰
- [ ] 落地性强
- [ ] 效果可预期

## 验收标准

### 必须通过的项目
- [ ] 所有核心功能检查通过
- [ ] 记忆强化检查通过
- [ ] 分工明确检查通过
- [ ] 写作强化检查通过
"""

def generate_agent_files(agent, category_name, output_dir):
    agent_dir = os.path.join(output_dir, agent['id'])
    os.makedirs(agent_dir, exist_ok=True)
    
    with open(os.path.join(agent_dir, "SKILL.md"), "w", encoding="utf-8") as f:
        f.write(generate_skill_md(agent, category_name))
    
    with open(os.path.join(agent_dir, "requirement.md"), "w", encoding="utf-8") as f:
        f.write(generate_requirement_md(agent, category_name))
    
    with open(os.path.join(agent_dir, "design.md"), "w", encoding="utf-8") as f:
        f.write(generate_design_md(agent, category_name))
    
    with open(os.path.join(agent_dir, "tasks.md"), "w", encoding="utf-8") as f:
        f.write(generate_tasks_md(agent, category_name))
    
    with open(os.path.join(agent_dir, "checklist.md"), "w", encoding="utf-8") as f:
        f.write(generate_checklist_md(agent, category_name))
    
    return agent_dir

def main():
    print("=" * 70)
    print("开始生成380个小说创作全领域精细化Agent")
    print("=" * 70)
    
    total_count = 0
    
    category_names = {
        "fubi": "伏笔与钩子系统",
        "qingxu": "情绪拉扯与渲染",
        "xunhuan": "大中小循环嵌套",
        "juese": "角色塑造与对比",
        "xingge": "人物性格分析对照",
        "shijie_guan": "世界观分类体系",
        "lishi": "历史与传说",
        "dili": "地理与地貌",
        "mofa": "魔法/科技体系",
        "shili": "势力与组织",
        "zhongzu": "种族与生物",
        "guize": "世界规则",
        "wenhua": "文化与习俗",
        "renwu_dangan": "人物档案系统",
        "wupin": "物品道具系统",
        "didian": "地点场景系统",
        "shili_zhenying": "势力阵营系统",
        "mofa_jineng": "魔法技能系统",
        "qingjie": "情节设计系统",
    }
    
    for category, agents in ALL_AGENTS.items():
        category_name = category_names[category]
        category_dir = os.path.join(BASE_OUTPUT_DIR, category)
        os.makedirs(category_dir, exist_ok=True)
        
        print(f"\n正在生成 [{category_name}] 的20个Agent...")
        
        for agent in agents:
            generate_agent_files(agent, category_name, category_dir)
            total_count += 1
            
            if total_count % 50 == 0:
                print(f"  已生成 {total_count}/380 个Agent...")
    
    print("\n" + "=" * 70)
    print(f"✓ 成功生成 {total_count} 个Agent!")
    print(f"✓ 输出目录: {BASE_OUTPUT_DIR}")
    print("=" * 70)
    
    summary = {
        "total_agents": total_count,
        "categories": {k: {"name": v, "count": len(ALL_AGENTS[k])} for k, v in category_names.items()},
        "generated_at": datetime.now().isoformat()
    }
    
    with open(os.path.join(BASE_OUTPUT_DIR, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 汇总文件已生成")

if __name__ == "__main__":
    main()
