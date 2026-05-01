#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
500个小说创作Agent批量生成器
基于脑洞流.txt、融合润色进阶版进化.md、无极太极_优化版.MD、分镜.txt
"""

import yaml
import os
from pathlib import Path
from datetime import datetime

# 500个小说Agent配置数据
NOVEL_AGENTS = {
    # 批次1: 小说类型/题材 (100个) - 已写入novel-agents-batch-1.yaml
    "batch_1": {
        "file": "novel-agents-batch-1.yaml",
        "category": "小说类型"
    },
    # 批次2: 角色塑造 (100个) - 已写入novel-agents-batch-2.yaml
    "batch_2": {
        "file": "novel-agents-batch-2.yaml", 
        "category": "角色塑造"
    },
    # 批次3: 情节/结构 (100个)
    "batch_3": {
        "agents": [
            # 三幕式结构 (10个)
            {"name": "三幕式结构-agent", "title": "三幕式结构专家", "desc": "设计经典三幕式故事结构", "concept": "起承转合，经典叙事结构", "cat": "情节结构"},
            {"name": "英雄之旅-agent", "title": "英雄之旅专家", "desc": "运用坎贝尔英雄之旅框架", "concept": "从平凡到非凡的英雄成长之路", "cat": "情节结构"},
            {"name": "救猫咪节拍表-agent", "title": "救猫咪节拍表专家", "desc": "使用斯奈德15点节拍表", "concept": "商业电影的经典节拍结构", "cat": "情节结构"},
            {"name": "五幕式结构-agent", "title": "五幕式结构专家", "desc": "设计五幕式戏剧结构", "concept": "铺垫-升级-高潮-回落-结局", "cat": "情节结构"},
            {"name": "环形结构-agent", "title": "环形结构专家", "desc": "设计首尾呼应的环形叙事", "concept": "终点即起点，循环往复", "cat": "情节结构"},
            {"name": "多线叙事-agent", "title": "多线叙事专家", "desc": "设计多条故事线的交织", "concept": "多条线索，最终汇聚", "cat": "情节结构"},
            {"name": "倒叙结构-agent", "title": "倒叙结构专家", "desc": "设计倒叙或插叙的叙事方式", "concept": "从结局开始，逐步揭示", "cat": "情节结构"},
            {"name": "章回体结构-agent", "title": "章回体结构专家", "desc": "设计章回体小说的结构", "concept": "章章独立，回回相扣", "cat": "情节结构"},
            {"name": "POV视角结构-agent", "title": "POV视角结构专家", "desc": "设计多视角POV叙事", "concept": "不同人物视角，拼凑完整故事", "cat": "情节结构"},
            {"name": "非线性叙事-agent", "title": "非线性叙事专家", "desc": "设计时间跳跃的非线性叙事", "concept": "打破时间顺序，创造悬念", "cat": "情节结构"},
            
            # 情节设计 (20个)
            {"name": "悬念设计-agent", "title": "悬念设计专家", "desc": "设计吸引读者的悬念", "concept": "信息差+时间压力=悬念", "cat": "情节设计"},
            {"name": "伏笔埋线-agent", "title": "伏笔埋线专家", "desc": "设计前后呼应的伏笔", "concept": "草蛇灰线，伏脉千里", "cat": "情节设计"},
            {"name": "反转设计-agent", "title": "反转设计专家", "desc": "设计出人意料的剧情反转", "concept": "情理之中，意料之外", "cat": "情节设计"},
            {"name": "冲突设计-agent", "title": "冲突设计专家", "desc": "设计人物与环境的冲突", "concept": "冲突是故事的灵魂", "cat": "情节设计"},
            {"name": "误会设计-agent", "title": "误会设计专家", "desc": "设计推动情节的误会", "concept": "误会制造矛盾，解开推动发展", "cat": "情节设计"},
            {"name": "巧合设计-agent", "title": "巧合设计专家", "desc": "设计合理的巧合推动剧情", "concept": "无巧不成书，但要合情合理", "cat": "情节设计"},
            {"name": "危机设计-agent", "title": "危机设计专家", "desc": "设计生死存亡的危机时刻", "concept": "危机中见人性，绝境中求生", "cat": "情节设计"},
            {"name": "高潮设计-agent", "title": "高潮设计专家", "desc": "设计故事的高潮部分", "concept": "情绪顶点，矛盾总爆发", "cat": "情节设计"},
            {"name": "结局设计-agent", "title": "结局设计专家", "desc": "设计圆满或遗憾的结局", "concept": "结局是新的开始，或完美的句号", "cat": "情节设计"},
            {"name": "钩子设计-agent", "title": "钩子设计专家", "desc": "设计章末钩子留住读者", "concept": "每章结尾必有钩子", "cat": "情节设计"},
            {"name": "节奏控制-agent", "title": "节奏控制专家", "desc": "控制故事节奏快慢", "concept": "张弛有度，收放自如", "cat": "情节设计"},
            {"name": "爽点设计-agent", "title": "爽点设计专家", "desc": "设计让读者爽的情节", "concept": "打脸、装逼、逆袭的爽感设计", "cat": "情节设计"},
            {"name": "虐点设计-agent", "title": "虐点设计专家", "desc": "设计虐心的情节", "concept": "虐身虐心，情感折磨", "cat": "情节设计"},
            {"name": "泪点设计-agent", "title": "泪点设计专家", "desc": "设计感人的泪点", "concept": "触动内心，引发共鸣", "cat": "情节设计"},
            {"name": "笑点设计-agent", "title": "笑点设计专家", "desc": "设计幽默搞笑的情节", "concept": "轻松幽默，调节气氛", "cat": "情节设计"},
            {"name": "燃点设计-agent", "title": "燃点设计专家", "desc": "设计热血沸腾的燃点", "concept": "热血激情，振奋人心", "cat": "情节设计"},
            {"name": "爆点设计-agent", "title": "爆点设计专家", "desc": "设计每章的爆点", "concept": "每500字一个爆点", "cat": "情节设计"},
            {"name": "转折点-agent", "title": "转折点专家", "desc": "设计故事的转折点", "concept": "命运的转折，人生的分水岭", "cat": "情节设计"},
            {"name": "激励事件-agent", "title": "激励事件专家", "desc": "设计打破平衡的激励事件", "concept": "打破现状，推动故事", "cat": "情节设计"},
            {"name": "灵魂黑夜-agent", "title": "灵魂黑夜专家", "desc": "设计主角的最低谷时刻", "concept": "失去一切，才能重新拥有", "cat": "情节设计"},
            
            # 场景设计 (10个)
            {"name": "开篇场景-agent", "title": "开篇场景专家", "desc": "设计吸引读者的开篇", "concept": "黄金三章，开篇定生死", "cat": "场景设计"},
            {"name": "战斗场景-agent", "title": "战斗场景专家", "desc": "设计精彩的战斗场面", "concept": "动作流畅，紧张刺激", "cat": "场景设计"},
            {"name": "情感场景-agent", "title": "情感场景专家", "desc": "设计感人的情感场景", "concept": "情感真挚，触动人心", "cat": "场景设计"},
            {"name": "对话场景-agent", "title": "对话场景专家", "desc": "设计精彩的对话场景", "concept": "话里有话，潜台词丰富", "cat": "场景设计"},
            {"name": "独处场景-agent", "title": "独处场景专家", "desc": "设计人物独白的场景", "concept": "内心独白，展现真实", "cat": "场景设计"},
            {"name": "群像场景-agent", "title": "群像场景专家", "desc": "设计多人互动的群像场景", "concept": "人物众多，各有特色", "cat": "场景设计"},
            {"name": "转折场景-agent", "title": "转折场景专家", "desc": "设计剧情转折的关键场景", "concept": "关键时刻，命运转折", "cat": "场景设计"},
            {"name": "回忆场景-agent", "title": "回忆场景专家", "desc": "设计插叙回忆的场景", "concept": "回忆过去，解释现在", "cat": "场景设计"},
            {"name": "梦境场景-agent", "title": "梦境场景专家", "desc": "设计虚幻的梦境场景", "concept": "虚实结合，隐喻象征", "cat": "场景设计"},
            {"name": "结局场景-agent", "title": "结局场景专家", "desc": "设计余韵悠长的结局场景", "concept": "画龙点睛，余音绕梁", "cat": "场景设计"},
            
            # 世界观构建 (10个)
            {"name": "修仙体系-agent", "title": "修仙体系专家", "desc": "设计完整的修仙等级体系", "concept": "从凡人到仙人的进阶之路", "cat": "世界观"},
            {"name": "魔法体系-agent", "title": "魔法体系专家", "desc": "设计魔法力量体系", "concept": "魔法的学习、使用与限制", "cat": "世界观"},
            {"name": "异能体系-agent", "title": "异能体系专家", "desc": "设计超能力体系", "concept": "异能的分类、觉醒与进化", "cat": "世界观"},
            {"name": "势力格局-agent", "title": "势力格局专家", "desc": "设计各方势力的分布", "concept": "势力林立，相互制衡", "cat": "世界观"},
            {"name": "历史背景-agent", "title": "历史背景专家", "desc": "设计世界的历史背景", "concept": "历史影响现在，过去决定未来", "cat": "世界观"},
            {"name": "地理设定-agent", "title": "地理设定专家", "desc": "设计世界的地理环境", "concept": "地理环境塑造人文", "cat": "世界观"},
            {"name": "种族设定-agent", "title": "种族设定专家", "desc": "设计不同种族的设定", "concept": "种族差异，文化冲突", "cat": "世界观"},
            {"name": "规则设定-agent", "title": "规则设定专家", "desc": "设计世界运行的规则", "concept": "规则约束，打破规则", "cat": "世界观"},
            {"name": "文化设定-agent", "title": "文化设定专家", "desc": "设计世界的文化习俗", "concept": "文化差异，碰撞融合", "cat": "世界观"},
            {"name": "经济体系-agent", "title": "经济体系专家", "desc": "设计世界的经济体系", "concept": "经济基础决定上层建筑", "cat": "世界观"},
            
            # 金手指设计 (10个)
            {"name": "系统金手指-agent", "title": "系统金手指专家", "desc": "设计系统类型的金手指", "concept": "系统在手，天下我有", "cat": "金手指"},
            {"name": "空间金手指-agent", "title": "空间金手指专家", "desc": "设计随身空间类金手指", "concept": "一方天地，无限可能", "cat": "金手指"},
            {"name": "重生金手指-agent", "title": "重生金手指专家", "desc": "设计重生带来的先知优势", "concept": "带着记忆重来，弥补遗憾", "cat": "金手指"},
            {"name": "传承金手指-agent", "title": "传承金手指专家", "desc": "设计获得前人传承的金手指", "concept": "前人栽树，后人乘凉", "cat": "金手指"},
            {"name": "异能金手指-agent", "title": "异能金手指专家", "desc": "设计特殊能力的金手指", "concept": "独特能力，立足之本", "cat": "金手指"},
            {"name": "宝物金手指-agent", "title": "宝物金手指专家", "desc": "设计神奇宝物的金手指", "concept": "神兵利器，助我一臂之力", "cat": "金手指"},
            {"name": "知识金手指-agent", "title": "知识金手指专家", "desc": "设计知识技能类金手指", "concept": "知识就是力量", "cat": "金手指"},
            {"name": "人脉金手指-agent", "title": "人脉金手指专家", "desc": "设计人际关系类金手指", "concept": "人脉即资源", "cat": "金手指"},
            {"name": "气运金手指-agent", "title": "气运金手指专家", "desc": "设计气运加身类金手指", "concept": "天之骄子，气运所钟", "cat": "金手指"},
            {"name": "双金手指-agent", "title": "双金手指专家", "desc": "设计双重金手指的组合", "concept": "双管齐下，事半功倍", "cat": "金手指"},
            
            # 爽文套路 (10个)
            {"name": "打脸套路-agent", "title": "打脸套路专家", "desc": "设计打脸反派的爽文套路", "concept": "前期被踩，后期打脸", "cat": "爽文套路"},
            {"name": "装逼套路-agent", "title": "装逼套路专家", "desc": "设计低调装逼的爽文套路", "concept": "无形装逼，最为致命", "cat": "爽文套路"},
            {"name": "收小弟套路-agent", "title": "收小弟套路专家", "desc": "设计收服追随者的套路", "concept": "小弟成群，势力膨胀", "cat": "爽文套路"},
            {"name": "开后宫套路-agent", "title": "开后宫套路专家", "desc": "设计收服红颜的套路", "concept": "红颜知己，左拥右抱", "cat": "爽文套路"},
            {"name": "越级挑战套路-agent", "title": "越级挑战套路专家", "desc": "设计越级战斗的爽文套路", "concept": "以弱胜强，创造奇迹", "cat": "爽文套路"},
            {"name": "拍卖会套路-agent", "title": "拍卖会套路专家", "desc": "设计拍卖会装逼的套路", "concept": "一掷千金，震惊全场", "cat": "爽文套路"},
            {"name": "秘境探险套路-agent", "title": "秘境探险套路专家", "desc": "设计秘境寻宝的爽文套路", "concept": "险中求宝，满载而归", "cat": "爽文套路"},
            {"name": "炼丹炼器套路-agent", "title": "炼丹炼器套路专家", "desc": "设计炼丹炼器的爽文套路", "concept": "技艺超群，震惊四座", "cat": "爽文套路"},
            {"name": "身份揭露套路-agent", "title": "身份揭露套路专家", "desc": "设计身份揭露的爽文套路", "concept": "隐藏身份，一鸣惊人", "cat": "爽文套路"},
            {"name": "复仇套路-agent", "title": "复仇套路专家", "desc": "设计复仇逆袭的爽文套路", "concept": "君子报仇，十年不晚", "cat": "爽文套路"},
            
            # 虐文套路 (10个)
            {"name": "误会虐-agent", "title": "误会虐专家", "desc": "设计因误会而产生的虐", "concept": "误会重重，解释不清", "cat": "虐文套路"},
            {"name": "替身虐-agent", "title": "替身虐专家", "desc": "设计替身相关的虐", "concept": "我是替身，还是真爱", "cat": "虐文套路"},
            {"name": "失忆虐-agent", "title": "失忆虐专家", "desc": "设计失忆导致的虐", "concept": "忘记了你，但心还记得", "cat": "虐文套路"},
            {"name": "绝症虐-agent", "title": "绝症虐专家", "desc": "设计绝症生离死别的虐", "concept": "生命倒计时，珍惜每一刻", "cat": "虐文套路"},
            {"name": "家族虐-agent", "title": "家族虐专家", "desc": "设计家族反对的虐", "concept": "家族压力，爱情考验", "cat": "虐文套路"},
            {"name": "复仇虐-agent", "title": "复仇虐专家", "desc": "设计复仇导致的虐", "concept": "本想毁了你，却爱上了你", "cat": "虐文套路"},
            {"name": "背叛虐-agent", "title": "背叛虐专家", "desc": "设计背叛伤害的虐", "concept": "信任崩塌，心被撕裂", "cat": "虐文套路"},
            {"name": "错过虐-agent", "title": "错过虐专家", "desc": "设计错过的虐", "concept": "擦肩而过，永失我爱", "cat": "虐文套路"},
            {"name": "等待虐-agent", "title": "等待虐专家", "desc": "设计漫长等待的虐", "concept": "等你归来，海枯石烂", "cat": "虐文套路"},
            {"name": "牺牲虐-agent", "title": "牺牲虐专家", "desc": "设计为爱牺牲的虐", "concept": "为你而死，无怨无悔", "cat": "虐文套路"},
            
            # 甜文套路 (10个)
            {"name": "日常甜-agent", "title": "日常甜专家", "desc": "设计温馨日常的甜", "concept": "细水长流，岁月静好", "cat": "甜文套路"},
            {"name": "宠溺甜-agent", "title": "宠溺甜专家", "desc": "设计霸道宠溺的甜", "concept": "只对你一人宠溺", "cat": "甜文套路"},
            {"name": "暗恋甜-agent", "title": "暗恋甜专家", "desc": "设计暗恋成真的甜", "concept": "原来你也喜欢我", "cat": "甜文套路"},
            {"name": "重逢甜-agent", "title": "重逢甜专家", "desc": "设计久别重逢的甜", "concept": "好久不见，别来无恙", "cat": "甜文套路"},
            {"name": "守护甜-agent", "title": "守护甜专家", "desc": "设计默默守护的甜", "concept": "一直在你身边", "cat": "甜文套路"},
            {"name": "成长甜-agent", "title": "成长甜专家", "desc": "设计共同成长的甜", "concept": "从青涩到成熟，一路有你", "cat": "甜文套路"},
            {"name": "互补甜-agent", "title": "互补甜专家", "desc": "设计性格互补的甜", "concept": "你是我的另一半", "cat": "甜文套路"},
            {"name": "救赎甜-agent", "title": "救赎甜专家", "desc": "设计互相救赎的甜", "concept": "你治愈了我", "cat": "甜文套路"},
            {"name": "反差甜-agent", "title": "反差甜专家", "desc": "设计反差萌的甜", "concept": "对外冷酷，对你温柔", "cat": "甜文套路"},
            {"name": "双向甜-agent", "title": "双向甜专家", "desc": "设计双向奔赴的甜", "concept": "你向我走一步，我向你跑百步", "cat": "甜文套路"},
        ]
    },
    # 批次4: 文笔/润色 (100个)
    "batch_4": {
        "agents": [
            # 零度写作 (10个)
            {"name": "去比喻化-agent", "title": "去比喻化专家", "desc": "清除文章中的比喻修辞", "concept": "直接描述，不用比喻", "cat": "零度写作"},
            {"name": "去形容词-agent", "title": "去形容词专家", "desc": "减少形容词的使用", "concept": "用动作代替形容词", "cat": "零度写作"},
            {"name": "去副词-agent", "title": "去副词专家", "desc": "清除冗余的副词", "concept": "副词是写作的大敌", "cat": "零度写作"},
            {"name": "短句化-agent", "title": "短句化专家", "desc": "将长句拆分为短句", "concept": "单句不超过15字", "cat": "零度写作"},
            {"name": "去解释癖-agent", "title": "去解释癖专家", "desc": "删除解释性的语句", "concept": "不要解释，直接呈现", "cat": "零度写作"},
            {"name": "去AI腔-agent", "title": "去AI腔专家", "desc": "去除AI写作的机械感", "concept": "像人写的，不像AI", "cat": "零度写作"},
            {"name": "白话化-agent", "title": "白话化专家", "desc": "将文字改为白话口语", "concept": "像说话一样写字", "cat": "零度写作"},
            {"name": "节奏控制-agent", "title": "节奏控制专家", "desc": "控制文章的节奏快慢", "concept": "该快则快，该慢则慢", "cat": "零度写作"},
            {"name": "去虚词-agent", "title": "去虚词专家", "desc": "删除不必要的虚词", "concept": "实词才有力量", "cat": "零度写作"},
            {"name": "精准用词-agent", "title": "精准用词专家", "desc": "选择最精准的词汇", "concept": "一词千金，字字珠玑", "cat": "零度写作"},
            
            # 五感描写 (10个)
            {"name": "视觉描写-agent", "title": "视觉描写专家", "desc": "强化视觉画面感", "concept": "让读者看见画面", "cat": "五感描写"},
            {"name": "听觉描写-agent", "title": "听觉描写专家", "desc": "强化听觉感受", "concept": "让读者听到声音", "cat": "五感描写"},
            {"name": "嗅觉描写-agent", "title": "嗅觉描写专家", "desc": "强化嗅觉体验", "concept": "让读者闻到气味", "cat": "五感描写"},
            {"name": "味觉描写-agent", "title": "味觉描写专家", "desc": "强化味觉感受", "concept": "让读者尝到味道", "cat": "五感描写"},
            {"name": "触觉描写-agent", "title": "触觉描写专家", "desc": "强化触觉体验", "concept": "让读者感到触感", "cat": "五感描写"},
            {"name": "通感描写-agent", "title": "通感描写专家", "desc": "设计通感修辞", "concept": "感官互通，意境深远", "cat": "五感描写"},
            {"name": "环境描写-agent", "title": "环境描写专家", "desc": "设计环境氛围描写", "concept": "环境映射心情", "cat": "五感描写"},
            {"name": "动作描写-agent", "title": "动作描写专家", "desc": "设计精准的动作描写", "concept": "动作展现性格", "cat": "五感描写"},
            {"name": "神态描写-agent", "title": "神态描写专家", "desc": "设计细微的神态变化", "concept": "神态透露内心", "cat": "五感描写"},
            {"name": "心理外化-agent", "title": "心理外化专家", "desc": "将心理活动外化为动作", "concept": "内心通过行为表现", "cat": "五感描写"},
            
            # 对话技巧 (10个)
            {"name": "潜台词设计-agent", "title": "潜台词设计专家", "desc": "设计对话的潜台词", "concept": "话里有话，弦外之音", "cat": "对话技巧"},
            {"name": "对话冲突-agent", "title": "对话冲突专家", "desc": "设计有冲突的对话", "concept": "对话即战场", "cat": "对话技巧"},
            {"name": "方言运用-agent", "title": "方言运用专家", "desc": "设计方言特色的对话", "concept": "方言塑造人物", "cat": "对话技巧"},
            {"name": "口癖设计-agent", "title": "口癖设计专家", "desc": "设计人物独特的口癖", "concept": "口癖即人设", "cat": "对话技巧"},
            {"name": "省略艺术-agent", "title": "省略艺术专家", "desc": "设计欲言又止的对话", "concept": "此时无声胜有声", "cat": "对话技巧"},
            {"name": "打断技巧-agent", "title": "打断技巧专家", "desc": "设计被打断的对话", "concept": "打断制造紧张", "cat": "对话技巧"},
            {"name": "沉默运用-agent", "title": "沉默运用专家", "desc": "设计沉默的力量", "concept": "沉默是金", "cat": "对话技巧"},
            {"name": "反讽技巧-agent", "title": "反讽技巧专家", "desc": "设计反讽的对话", "concept": "正话反说，讽刺有力", "cat": "对话技巧"},
            {"name": "双关语-agent", "title": "双关语专家", "desc": "设计一语双关的对话", "concept": "言在此而意在彼", "cat": "对话技巧"},
            {"name": "情绪对话-agent", "title": "情绪对话专家", "desc": "设计承载情绪的对话", "concept": "对话传递情感", "cat": "对话技巧"},
            
            # 情绪链设计 (10个)
            {"name": "绝望链-agent", "title": "绝望链专家", "desc": "设计绝望情绪链", "concept": "从希望到绝望的坠落", "cat": "情绪链"},
            {"name": "愤怒链-agent", "title": "愤怒链专家", "desc": "设计愤怒情绪链", "concept": "愤怒层层升级", "cat": "情绪链"},
            {"name": "恐惧链-agent", "title": "恐惧链专家", "desc": "设计恐惧情绪链", "concept": "恐惧逐渐加深", "cat": "情绪链"},
            {"name": "喜悦链-agent", "title": "喜悦链专家", "desc": "设计喜悦情绪链", "concept": "喜悦层层递进", "cat": "情绪链"},
            {"name": "悲伤链-agent", "title": "悲伤链专家", "desc": "设计悲伤情绪链", "concept": "悲伤逐步累积", "cat": "情绪链"},
            {"name": "爱意链-agent", "title": "爱意链专家", "desc": "设计爱意情绪链", "concept": "爱意逐渐升温", "cat": "情绪链"},
            {"name": "恨意链-agent", "title": "恨意链专家", "desc": "设计恨意情绪链", "concept": "恨意慢慢滋生", "cat": "情绪链"},
            {"name": "爽感链-agent", "title": "爽感链专家", "desc": "设计爽感情绪链", "concept": "爽点层层叠加", "cat": "情绪链"},
            {"name": "虐感链-agent", "title": "虐感链专家", "desc": "设计虐感情绪链", "concept": "虐点步步紧逼", "cat": "情绪链"},
            {"name": "甜感链-agent", "title": "甜感链专家", "desc": "设计甜感情绪链", "concept": "甜蜜层层递进", "cat": "情绪链"},
            
            # 网文语感 (10个)
            {"name": "爽文语感-agent", "title": "爽文语感专家", "desc": "打造爽文的语言风格", "concept": "爽文要有爽文的味", "cat": "网文语感"},
            {"name": "虐文语感-agent", "title": "虐文语感专家", "desc": "打造虐文的语言风格", "concept": "虐文要有虐文的味", "cat": "网文语感"},
            {"name": "甜文语感-agent", "title": "甜文语感专家", "desc": "打造甜文的语言风格", "concept": "甜文要有甜文的味", "cat": "网文语感"},
            {"name": "悬疑语感-agent", "title": "悬疑语感专家", "desc": "打造悬疑的语言风格", "concept": "悬疑要有悬疑的味", "cat": "网文语感"},
            {"name": "恐怖语感-agent", "title": "恐怖语感专家", "desc": "打造恐怖的语言风格", "concept": "恐怖要有恐怖的味", "cat": "网文语感"},
            {"name": "搞笑语感-agent", "title": "搞笑语感专家", "desc": "打造搞笑的语言风格", "concept": "搞笑要有搞笑的味", "cat": "网文语感"},
            {"name": "古风语感-agent", "title": "古风语感专家", "desc": "打造古风的语言风格", "concept": "古风要有古风的味", "cat": "网文语感"},
            {"name": "现代语感-agent", "title": "现代语感专家", "desc": "打造现代的语言风格", "concept": "现代要有现代的味", "cat": "网文语感"},
            {"name": "热血语感-agent", "title": "热血语感专家", "desc": "打造热血的语言风格", "concept": "热血要有热血的味", "cat": "网文语感"},
            {"name": "暗黑语感-agent", "title": "暗黑语感专家", "desc": "打造暗黑的语言风格", "concept": "暗黑要有暗黑的味", "cat": "网文语感"},
            
            # 修辞技巧 (10个)
            {"name": "排比运用-agent", "title": "排比运用专家", "desc": "设计排比句式增强气势", "concept": "排比增强气势", "cat": "修辞技巧"},
            {"name": "对偶运用-agent", "title": "对偶运用专家", "desc": "设计对偶句式增加韵律", "concept": "对偶增加韵律", "cat": "修辞技巧"},
            {"name": "反复运用-agent", "title": "反复运用专家", "desc": "设计反复修辞强调重点", "concept": "反复强调重点", "cat": "修辞技巧"},
            {"name": "设问运用-agent", "title": "设问运用专家", "desc": "设计设问引发思考", "concept": "设问引发思考", "cat": "修辞技巧"},
            {"name": "反问运用-agent", "title": "反问运用专家", "desc": "设计反问增强语气", "concept": "反问增强语气", "cat": "修辞技巧"},
            {"name": "夸张运用-agent", "title": "夸张运用专家", "desc": "设计夸张增强效果", "concept": "夸张增强效果", "cat": "修辞技巧"},
            {"name": "借代运用-agent", "title": "借代运用专家", "desc": "设计借代简洁表达", "concept": "借代简洁有力", "cat": "修辞技巧"},
            {"name": "象征运用-agent", "title": "象征运用专家", "desc": "设计象征深化主题", "concept": "象征深化主题", "cat": "修辞技巧"},
            {"name": "对比运用-agent", "title": "对比运用专家", "desc": "设计对比突出差异", "concept": "对比突出差异", "cat": "修辞技巧"},
            {"name": "层递运用-agent", "title": "层递运用专家", "desc": "设计层递推进情感", "concept": "层递推进情感", "cat": "修辞技巧"},
            
            # 节奏技巧 (10个)
            {"name": "快慢交替-agent", "title": "快慢交替专家", "desc": "设计快慢节奏交替", "concept": "快慢结合，张弛有度", "cat": "节奏技巧"},
            {"name": "段落控制-agent", "title": "段落控制专家", "desc": "控制段落长度变化", "concept": "段落长短，节奏变化", "cat": "节奏技巧"},
            {"name": "句式变化-agent", "title": "句式变化专家", "desc": "设计句式长短变化", "concept": "句式变化，避免单调", "cat": "节奏技巧"},
            {"name": "标点运用-agent", "title": "标点运用专家", "desc": "运用标点控制节奏", "concept": "标点也是节奏", "cat": "节奏技巧"},
            {"name": "留白艺术-agent", "title": "留白艺术专家", "desc": "设计适当的留白", "concept": "留白给人想象空间", "cat": "节奏技巧"},
            {"name": "详略得当-agent", "title": "详略得当专家", "desc": "控制详略程度", "concept": "该详则详，该略则略", "cat": "节奏技巧"},
            {"name": "过渡自然-agent", "title": "过渡自然专家", "desc": "设计自然的过渡", "concept": "过渡自然，不突兀", "cat": "节奏技巧"},
            {"name": "高潮铺垫-agent", "title": "高潮铺垫专家", "desc": "设计高潮前的铺垫", "concept": "铺垫到位，高潮才爽", "cat": "节奏技巧"},
            {"name": "悬念节奏-agent", "title": "悬念节奏专家", "desc": "控制悬念的释放节奏", "concept": "悬念要慢慢放", "cat": "节奏技巧"},
            {"name": "收尾节奏-agent", "title": "收尾节奏专家", "desc": "设计结尾的节奏", "concept": "结尾要有余韵", "cat": "节奏技巧"},
            
            # 风格模仿 (10个)
            {"name": "金庸风格-agent", "title": "金庸风格专家", "desc": "模仿金庸的写作风格", "concept": "金庸的武侠韵味", "cat": "风格模仿"},
            {"name": "古龙风格-agent", "title": "古龙风格专家", "desc": "模仿古龙的写作风格", "concept": "古龙的简洁诗意", "cat": "风格模仿"},
            {"name": "琼瑶风格-agent", "title": "琼瑶风格专家", "desc": "模仿琼瑶的写作风格", "concept": "琼瑶的缠绵悱恻", "cat": "风格模仿"},
            {"name": "张爱玲风格-agent", "title": "张爱玲风格专家", "desc": "模仿张爱玲的写作风格", "concept": "张爱玲的冷艳犀利", "cat": "风格模仿"},
            {"name": "鲁迅风格-agent", "title": "鲁迅风格专家", "desc": "模仿鲁迅的写作风格", "concept": "鲁迅的犀利深刻", "cat": "风格模仿"},
            {"name": "莫言风格-agent", "title": "莫言风格专家", "desc": "模仿莫言的写作风格", "concept": "莫言的魔幻乡土", "cat": "风格模仿"},
            {"name": "村上春树风格-agent", "title": "村上春树风格专家", "desc": "模仿村上春树的风格", "concept": "村上的孤独诗意", "cat": "风格模仿"},
            {"name": "东野圭吾风格-agent", "title": "东野圭吾风格专家", "desc": "模仿东野圭吾的风格", "concept": "东野的悬疑推理", "cat": "风格模仿"},
            {"name": "JK罗琳风格-agent", "title": "JK罗琳风格专家", "desc": "模仿JK罗琳的风格", "concept": "罗琳的魔法世界", "cat": "风格模仿"},
            {"name": "海明威风格-agent", "title": "海明威风格专家", "desc": "模仿海明威的风格", "concept": "海明威的冰山理论", "cat": "风格模仿"},
            
            # 去AI化 (10个)
            {"name": "去模板化-agent", "title": "去模板化专家", "desc": "去除AI模板痕迹", "concept": "不要AI模板", "cat": "去AI化"},
            {"name": "去套路化-agent", "title": "去套路化专家", "desc": "去除套路化的表达", "concept": "不要套路", "cat": "去AI化"},
            {"name": "去机械化-agent", "title": "去机械化专家", "desc": "去除机械化的叙述", "concept": "不要机械化", "cat": "去AI化"},
            {"name": "去翻译腔-agent", "title": "去翻译腔专家", "desc": "去除翻译腔调", "concept": "不要翻译腔", "cat": "去AI化"},
            {"name": "去书面语-agent", "title": "去书面语专家", "desc": "去除过于书面的表达", "concept": "口语化表达", "cat": "去AI化"},
            {"name": "去逻辑化-agent", "title": "去逻辑化专家", "desc": "去除过于逻辑的表达", "concept": "情感先于逻辑", "cat": "去AI化"},
            {"name": "去总结癖-agent", "title": "去总结癖专家", "desc": "去除总结性的语句", "concept": "不要总结", "cat": "去AI化"},
            {"name": "去解释癖-agent", "title": "去解释癖专家", "desc": "去除解释性的内容", "concept": "不要解释", "cat": "去AI化"},
            {"name": "去排比癖-agent", "title": "去排比癖专家", "desc": "去除过度排比", "concept": "不要滥用排比", "cat": "去AI化"},
            {"name": "去成语癖-agent", "title": "去成语癖专家", "desc": "去除过度使用成语", "concept": "不要堆砌成语", "cat": "去AI化"},
        ]
    },
    # 批次5: 专项技巧 (100个)
    "batch_5": {
        "agents": [
            # 分镜技巧 (10个)
            {"name": "镜头语言-agent", "title": "镜头语言专家", "desc": "运用电影镜头语言写作", "concept": "文字即镜头", "cat": "分镜技巧"},
            {"name": "远景描写-agent", "title": "远景描写专家", "desc": "设计远景 establishing shot", "concept": "远景交代环境", "cat": "分镜技巧"},
            {"name": "近景描写-agent", "title": "近景描写专家", "desc": "设计近景 close-up", "concept": "近景展现细节", "cat": "分镜技巧"},
            {"name": "特写描写-agent", "title": "特写描写专家", "desc": "设计特写 extreme close-up", "concept": "特写放大情绪", "cat": "分镜技巧"},
            {"name": "转场技巧-agent", "title": "转场技巧专家", "desc": "设计场景转换", "concept": "转场自然流畅", "cat": "分镜技巧"},
            {"name": "蒙太奇-agent", "title": "蒙太奇专家", "desc": "运用蒙太奇手法", "concept": "镜头组接产生新意义", "cat": "分镜技巧"},
            {"name": "慢镜头-agent", "title": "慢镜头专家", "desc": "设计慢动作描写", "concept": "慢镜头延长时间", "cat": "分镜技巧"},
            {"name": "快切镜头-agent", "title": "快切镜头专家", "desc": "设计快速切换", "concept": "快切增加紧张感", "cat": "分镜技巧"},
            {"name": "视角切换-agent", "title": "视角切换专家", "desc": "设计视角的切换", "concept": "不同视角，不同信息", "cat": "分镜技巧"},
            {"name": "景深运用-agent", "title": "景深运用专家", "desc": "运用景深概念", "concept": "景深控制焦点", "cat": "分镜技巧"},
            
            # 开头技巧 (10个)
            {"name": "悬念开头-agent", "title": "悬念开头专家", "desc": "设计悬念式开头", "concept": "开头设悬念", "cat": "开头技巧"},
            {"name": "冲突开头-agent", "title": "冲突开头专家", "desc": "设计冲突式开头", "concept": "开头即冲突", "cat": "开头技巧"},
            {"name": "对话开头-agent", "title": "对话开头专家", "desc": "设计对话式开头", "concept": "开头即对话", "cat": "开头技巧"},
            {"name": "场景开头-agent", "title": "场景开头专家", "desc": "设计场景式开头", "concept": "开头展现场景", "cat": "开头技巧"},
            {"name": "动作开头-agent", "title": "动作开头专家", "desc": "设计动作式开头", "concept": "开头即动作", "cat": "开头技巧"},
            {"name": "倒叙开头-agent", "title": "倒叙开头专家", "desc": "设计倒叙式开头", "concept": "从结局开始", "cat": "开头技巧"},
            {"name": "疑问开头-agent", "title": "疑问开头专家", "desc": "设计疑问式开头", "concept": "开头抛出问题", "cat": "开头技巧"},
            {"name": "震惊开头-agent", "title": "震惊开头专家", "desc": "设计震惊式开头", "concept": "开头即震惊", "cat": "开头技巧"},
            {"name": "日常开头-agent", "title": "日常开头专家", "desc": "设计日常式开头", "concept": "从日常切入", "cat": "开头技巧"},
            {"name": "预言开头-agent", "title": "预言开头专家", "desc": "设计预言式开头", "concept": "开头即预言", "cat": "开头技巧"},
            
            # 结尾技巧 (10个)
            {"name": "圆满结尾-agent", "title": "圆满结尾专家", "desc": "设计圆满结局", "concept": "皆大欢喜", "cat": "结尾技巧"},
            {"name": "遗憾结尾-agent", "title": "遗憾结尾专家", "desc": "设计遗憾结局", "concept": "遗憾也是一种美", "cat": "结尾技巧"},
            {"name": "开放式结尾-agent", "title": "开放式结尾专家", "desc": "设计开放式结局", "concept": "留给读者想象", "cat": "结尾技巧"},
            {"name": "反转结尾-agent", "title": "反转结尾专家", "desc": "设计反转结局", "concept": "结尾大反转", "cat": "结尾技巧"},
            {"name": "升华结尾-agent", "title": "升华结尾专家", "desc": "设计升华主题的结局", "concept": "结尾升华主题", "cat": "结尾技巧"},
            {"name": "呼应开头-agent", "title": "呼应开头专家", "desc": "设计呼应开头的结尾", "concept": "首尾呼应", "cat": "结尾技巧"},
            {"name": "留白结尾-agent", "title": "留白结尾专家", "desc": "设计留白式结尾", "concept": "言有尽而意无穷", "cat": "结尾技巧"},
            {"name": "悲剧结尾-agent", "title": "悲剧结尾专家", "desc": "设计悲剧结局", "concept": "悲剧震撼人心", "cat": "结尾技巧"},
            {"name": "喜剧结尾-agent", "title": "喜剧结尾专家", "desc": "设计喜剧结局", "concept": "喜剧皆大欢喜", "cat": "结尾技巧"},
            {"name": "悬念结尾-agent", "title": "悬念结尾专家", "desc": "设计悬念式结尾", "concept": "结尾留悬念", "cat": "结尾技巧"},
            
            # 标题技巧 (10个)
            {"name": "悬念标题-agent", "title": "悬念标题专家", "desc": "设计悬念式标题", "concept": "标题设悬念", "cat": "标题技巧"},
            {"name": "对比标题-agent", "title": "对比标题专家", "desc": "设计对比式标题", "concept": "对比产生张力", "cat": "标题技巧"},
            {"name": "数字标题-agent", "title": "数字标题专家", "desc": "设计带数字的标题", "concept": "数字具体明确", "cat": "标题技巧"},
            {"name": "疑问标题-agent", "title": "疑问标题专家", "desc": "设计疑问式标题", "concept": "疑问引发好奇", "cat": "标题技巧"},
            {"name": "情绪标题-agent", "title": "情绪标题专家", "desc": "设计带情绪的标题", "concept": "情绪感染读者", "cat": "标题技巧"},
            {"name": "身份标题-agent", "title": "身份标题专家", "desc": "设计带身份的标题", "concept": "身份制造反差", "cat": "标题技巧"},
            {"name": "场景标题-agent", "title": "场景标题专家", "desc": "设计场景式标题", "concept": "场景代入感强", "cat": "标题技巧"},
            {"name": "对话标题-agent", "title": "对话标题专家", "desc": "设计对话式标题", "concept": "对话生动有趣", "cat": "标题技巧"},
            {"name": "反转标题-agent", "title": "反转标题专家", "desc": "设计有反转的标题", "concept": "标题即反转", "cat": "标题技巧"},
            {"name": "热点标题-agent", "title": "热点标题专家", "desc": "设计蹭热点的标题", "concept": "热点增加点击", "cat": "标题技巧"},
            
            # 脑洞生成 (10个)
            {"name": "反套路脑洞-agent", "title": "反套路脑洞专家", "desc": "设计反套路的创意", "concept": "反套路出奇制胜", "cat": "脑洞生成"},
            {"name": "跨界脑洞-agent", "title": "跨界脑洞专家", "desc": "设计跨界融合的创意", "concept": "跨界产生新意", "cat": "脑洞生成"},
            {"name": "反转脑洞-agent", "title": "反转脑洞专家", "desc": "设计反转的创意", "concept": "反转出人意料", "cat": "脑洞生成"},
            {"name": "设定脑洞-agent", "title": "设定脑洞专家", "desc": "设计新颖的世界观", "concept": "设定新颖独特", "cat": "脑洞生成"},
            {"name": "人物脑洞-agent", "title": "人物脑洞专家", "desc": "设计独特的人物", "concept": "人物与众不同", "cat": "脑洞生成"},
            {"name": "能力脑洞-agent", "title": "能力脑洞专家", "desc": "设计独特的能力", "concept": "能力新颖有趣", "cat": "脑洞生成"},
            {"name": "道具脑洞-agent", "title": "道具脑洞专家", "desc": "设计神奇的道具", "concept": "道具推动剧情", "cat": "脑洞生成"},
            {"name": "场景脑洞-agent", "title": "场景脑洞专家", "desc": "设计独特的场景", "concept": "场景印象深刻", "cat": "脑洞生成"},
            {"name": "关系脑洞-agent", "title": "关系脑洞专家", "desc": "设计独特的人物关系", "concept": "关系错综复杂", "cat": "脑洞生成"},
            {"name": "结局脑洞-agent", "title": "结局脑洞专家", "desc": "设计出人意料的结局", "concept": "结局神转折", "cat": "脑洞生成"},
            
            # 人物标签 (10个)
            {"name": "美强惨标签-agent", "title": "美强惨标签专家", "desc": "设计美强惨人设", "concept": "美丽强大却命运悲惨", "cat": "人物标签"},
            {"name": "疯批标签-agent", "title": "疯批标签专家", "desc": "设计疯批人设", "concept": "疯狂偏执，为爱发疯", "cat": "人物标签"},
            {"name": "绿茶标签-agent", "title": "绿茶标签专家", "desc": "设计绿茶人设", "concept": "表面清纯，心机深沉", "cat": "人物标签"},
            {"name": "白莲花标签-agent", "title": "白莲花标签专家", "desc": "设计白莲花人设", "concept": "纯洁无辜，实则心机", "cat": "人物标签"},
            {"name": "病娇标签-agent", "title": "病娇标签专家", "desc": "设计病娇人设", "concept": "病态的爱，极端的占有", "cat": "人物标签"},
            {"name": "腹黑标签-agent", "title": "腹黑标签专家", "desc": "设计腹黑人设", "concept": "表面无害，内心深沉", "cat": "人物标签"},
            {"name": "傲娇标签-agent", "title": "傲娇标签专家", "desc": "设计傲娇人设", "concept": "嘴上不要，身体诚实", "cat": "人物标签"},
            {"name": "忠犬标签-agent", "title": "忠犬标签专家", "desc": "设计忠犬人设", "concept": "忠诚专一，默默守护", "cat": "人物标签"},
            {"name": "高冷标签-agent", "title": "高冷标签专家", "desc": "设计高冷人设", "concept": "高岭之花，只为你融化", "cat": "人物标签"},
            {"name": "沙雕标签-agent", "title": "沙雕标签专家", "desc": "设计沙雕人设", "concept": "搞笑担当，欢乐源泉", "cat": "人物标签"},
            
            # 冲突类型 (10个)
            {"name": "人物冲突-agent", "title": "人物冲突专家", "desc": "设计人物之间的矛盾", "concept": "人与人斗", "cat": "冲突类型"},
            {"name": "内心冲突-agent", "title": "内心冲突专家", "desc": "设计人物内心的矛盾", "concept": "自己与自己斗", "cat": "冲突类型"},
            {"name": "社会冲突-agent", "title": "社会冲突专家", "desc": "设计人物与社会的矛盾", "concept": "人与社会斗", "cat": "冲突类型"},
            {"name": "自然冲突-agent", "title": "自然冲突专家", "desc": "设计人物与自然的矛盾", "concept": "人与自然斗", "cat": "冲突类型"},
            {"name": "命运冲突-agent", "title": "命运冲突专家", "desc": "设计人物与命运的矛盾", "concept": "人与命运斗", "cat": "冲突类型"},
            {"name": "阶级冲突-agent", "title": "阶级冲突专家", "desc": "设计阶级之间的矛盾", "concept": "阶级对立", "cat": "冲突类型"},
            {"name": "代际冲突-agent", "title": "代际冲突专家", "desc": "设计代际之间的矛盾", "concept": "代沟与理解", "cat": "冲突类型"},
            {"name": "性别冲突-agent", "title": "性别冲突专家", "desc": "设计性别之间的矛盾", "concept": "性别对立与和解", "cat": "冲突类型"},
            {"name": "文化冲突-agent", "title": "文化冲突专家", "desc": "设计文化之间的矛盾", "concept": "文化差异与融合", "cat": "冲突类型"},
            {"name": "利益冲突-agent", "title": "利益冲突专家", "desc": "设计利益之间的矛盾", "concept": "利益驱使", "cat": "冲突类型"},
            
            # 铺垫技巧 (10个)
            {"name": "伏笔铺垫-agent", "title": "伏笔铺垫专家", "desc": "设计前后呼应的伏笔", "concept": "草蛇灰线，伏脉千里", "cat": "铺垫技巧"},
            {"name": "人物铺垫-agent", "title": "人物铺垫专家", "desc": "为人物出场做铺垫", "concept": "先声夺人", "cat": "铺垫技巧"},
            {"name": "事件铺垫-agent", "title": "事件铺垫专家", "desc": "为重大事件做铺垫", "concept": "山雨欲来风满楼", "cat": "铺垫技巧"},
            {"name": "情感铺垫-agent", "title": "情感铺垫专家", "desc": "为情感爆发做铺垫", "concept": "情感层层递进", "cat": "铺垫技巧"},
            {"name": "能力铺垫-agent", "title": "能力铺垫专家", "desc": "为能力展现做铺垫", "concept": "能力不是凭空出现", "cat": "铺垫技巧"},
            {"name": "关系铺垫-agent", "title": "关系铺垫专家", "desc": "为关系转变做铺垫", "concept": "关系转变有迹可循", "cat": "铺垫技巧"},
            {"name": "危机铺垫-agent", "title": "危机铺垫专家", "desc": "为危机到来做铺垫", "concept": "危机早有预兆", "cat": "铺垫技巧"},
            {"name": "真相铺垫-agent", "title": "真相铺垫专家", "desc": "为真相揭露做铺垫", "concept": "真相层层揭开", "cat": "铺垫技巧"},
            {"name": "高潮铺垫-agent", "title": "高潮铺垫专家", "desc": "为高潮做铺垫", "concept": "高潮需要积累", "cat": "铺垫技巧"},
            {"name": "结局铺垫-agent", "title": "结局铺垫专家", "desc": "为结局做铺垫", "concept": "结局早有暗示", "cat": "铺垫技巧"},
            
            # 审核检查 (10个)
            {"name": "逻辑审核-agent", "title": "逻辑审核专家", "desc": "检查故事逻辑是否通顺", "concept": "逻辑自洽", "cat": "审核检查"},
            {"name": "人设审核-agent", "title": "人设审核专家", "desc": "检查人设是否一致", "concept": "人设不崩", "cat": "审核检查"},
            {"name": "情节审核-agent", "title": "情节审核专家", "desc": "检查情节是否合理", "concept": "情节合理", "cat": "审核检查"},
            {"name": "文笔审核-agent", "title": "文笔审核专家", "desc": "检查文笔是否流畅", "concept": "文笔流畅", "cat": "审核检查"},
            {"name": "节奏审核-agent", "title": "节奏审核专家", "desc": "检查节奏是否合适", "concept": "节奏得当", "cat": "审核检查"},
            {"name": "对话审核-agent", "title": "对话审核专家", "desc": "检查对话是否自然", "concept": "对话自然", "cat": "审核检查"},
            {"name": "情绪审核-agent", "title": "情绪审核专家", "desc": "检查情绪是否到位", "concept": "情绪真实", "cat": "审核检查"},
            {"name": "细节审核-agent", "title": "细节审核专家", "desc": "检查细节是否准确", "concept": "细节准确", "cat": "审核检查"},
            {"name": "爽点审核-agent", "title": "爽点审核专家", "desc": "检查爽点是否足够", "concept": "爽点密集", "cat": "审核检查"},
            {"name": "AI痕迹审核-agent", "title": "AI痕迹审核专家", "desc": "检查是否有AI痕迹", "concept": "去AI化", "cat": "审核检查"},
        ]
    }
}

def generate_skill_md(agent_info, category):
    """生成SKILL.md"""
    return f"""# {agent_info['title']}

## 核心概念
{agent_info['concept']}

## 功能描述
{agent_info['desc']}

## 能力范围
- 专业分析{category}相关要素
- 提供具体的创作指导和建议
- 帮助优化{category}相关的内容
- 识别和解决{category}相关的问题

## 使用场景
- 小说创作中的{category}设计
- 故事优化和改进
- 创作瓶颈突破
- 专业技巧学习

## 标签
{', '.join(agent_info.get('tags', [category]))}

## 版本信息
- 版本: 1.0.0
- 创建日期: {datetime.now().strftime('%Y-%m-%d')}
- 分类: {category}
"""

def generate_requirement_md(agent_info, category):
    """生成requirement.md"""
    return f"""# {agent_info['title']} - 需求文档

## 1. 项目概述
### 1.1 背景
{agent_info['desc']}

### 1.2 目标
创建一个专业的{agent_info['title']}，为小说创作者提供高质量的{category}服务。

## 2. 功能需求
### 2.1 核心功能
- [ ] 分析{category}相关要素
- [ ] 提供专业的创作建议
- [ ] 优化{category}相关内容
- [ ] 识别和解决问题

### 2.2 扩展功能
- [ ] 多类型{category}支持
- [ ] 个性化推荐
- [ ] 案例库管理
- [ ] 创作报告生成

## 3. 非功能需求
### 3.1 性能要求
- 响应时间 < 3秒
- 并发用户数 > 100

### 3.2 可用性要求
- 系统可用性 > 99.9%
- 支持7x24小时服务

## 4. 优先级
high

## 5. 验收标准
- 所有核心功能正常运行
- 通过功能测试和性能测试
- 用户满意度 > 90%
"""

def generate_design_md(agent_info, category):
    """生成design.md"""
    return f"""# {agent_info['title']} - 设计文档

## 1. 架构设计
### 1.1 系统架构
```
[用户输入] → [需求分析] → [知识检索] → [推理生成] → [输出格式化]
```

### 1.2 模块划分
- **输入处理模块**: 解析用户创作需求
- **知识库模块**: 存储{category}专业知识
- **推理引擎**: 基于知识进行创作推理
- **输出生成器**: 格式化创作建议

## 2. 核心概念设计
{agent_info['concept']}

## 3. 知识库设计
### 3.1 知识分类
- {category}基础理论
- 实践创作技巧
- 案例分析数据
- 常见问题解答

### 3.2 知识表示
- 结构化创作数据
- 非结构化文本
- 创作规则库
- 模板库

## 4. 交互设计
### 4.1 创作流程
1. 了解创作需求
2. 分析现有内容
3. 提供专业建议
4. 优化创作方案

### 4.2 输出格式
- 清晰的结构化建议
- 重点内容突出
- 可操作的创作指导
- 相关资源推荐

## 5. 质量保障
### 5.1 准确性保障
- 多源知识验证
- 专家审核机制
- 持续学习更新

### 5.2 一致性保障
- 建议风格统一
- 逻辑自洽
- 标准术语使用
"""

def generate_tasks_md(agent_info, category):
    """生成tasks.md"""
    return f"""# {agent_info['title']} - 任务清单

## 项目信息
- **Agent名称**: {agent_info['name']}
- **预计工期**: 2周
- **优先级**: high
- **创建日期**: {datetime.now().strftime('%Y-%m-%d')}

## 开发阶段

### 阶段1: 需求分析 (第1-2天)
- [ ] 1.1 收集并分析创作需求
- [ ] 1.2 定义功能边界
- [ ] 1.3 编写需求文档

### 阶段2: 知识库构建 (第3-5天)
- [ ] 2.1 收集{category}知识
- [ ] 2.2 整理知识分类
- [ ] 2.3 构建知识体系
- [ ] 2.4 验证知识准确性

### 阶段3: 核心功能开发 (第6-10天)
- [ ] 3.1 实现需求分析功能
- [ ] 3.2 实现创作建议功能
- [ ] 3.3 实现内容优化功能
- [ ] 3.4 实现问题识别功能

### 阶段4: 测试优化 (第11-12天)
- [ ] 4.1 功能测试
- [ ] 4.2 性能测试
- [ ] 4.3 用户体验测试
- [ ] 4.4 问题修复

### 阶段5: 文档完善 (第13-14天)
- [ ] 5.1 更新SKILL.md
- [ ] 5.2 编写使用指南
- [ ] 5.3 整理示例库
- [ ] 5.4 最终审核

## 里程碑
- [ ] M1: 需求冻结
- [ ] M2: 知识库完成
- [ ] M3: 功能开发完成
- [ ] M4: 测试通过
- [ ] M5: 正式发布
"""

def generate_checklist_md(agent_info, category):
    """生成checklist.md"""
    return f"""# {agent_info['title']} - 检查清单

## 发布前检查

### 文档完整性
- [ ] SKILL.md 已编写完成
- [ ] requirement.md 已编写完成
- [ ] design.md 已编写完成
- [ ] tasks.md 已编写完成
- [ ] checklist.md 已编写完成

### 功能完整性
- [ ] 所有核心功能已实现
- [ ] 功能测试通过
- [ ] 边界情况处理完善
- [ ] 错误处理机制健全

### 知识库质量
- [ ] 知识内容准确无误
- [ ] 知识覆盖全面
- [ ] 知识更新及时
- [ ] 引用来源可靠

### 性能与稳定性
- [ ] 响应时间符合要求
- [ ] 并发处理正常
- [ ] 内存使用合理
- [ ] 无内存泄漏

### 用户体验
- [ ] 交互流程顺畅
- [ ] 输出格式清晰
- [ ] 帮助信息完善
- [ ] 示例丰富实用

## 发布后检查

### 监控
- [ ] 运行状态监控正常
- [ ] 性能指标监控正常
- [ ] 错误日志监控正常
- [ ] 用户反馈收集正常

### 维护
- [ ] 定期更新计划制定
- [ ] 知识库维护流程建立
- [ ] 问题反馈渠道畅通
- [ ] 版本管理规范

## 签字确认
- [ ] 开发人员确认
- [ ] 测试人员确认
- [ ] 产品经理确认
- [ ] 发布审批通过

---
**检查日期**: ___________
**检查人员**: ___________
**备注**: ___________
"""

def generate_agent(agent_info, category, output_dir):
    """生成单个Agent的5文档"""
    name = agent_info['name']
    agent_dir = output_dir / name
    agent_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成5个文档
    files = {
        'SKILL.md': generate_skill_md(agent_info, category),
        'requirement.md': generate_requirement_md(agent_info, category),
        'design.md': generate_design_md(agent_info, category),
        'tasks.md': generate_tasks_md(agent_info, category),
        'checklist.md': generate_checklist_md(agent_info, category)
    }
    
    for filename, content in files.items():
        filepath = agent_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return True

def generate_batch_3_4_5():
    """生成批次3、4、5的Agent"""
    output_base = Path('generated_novel_agents')
    output_base.mkdir(exist_ok=True)
    
    total_count = 0
    
    # 处理批次3
    print("\n📦 生成批次3: 情节结构 (100个Agent)")
    batch3_dir = output_base / 'batch-03-plot'
    for agent in NOVEL_AGENTS['batch_3']['agents']:
        if generate_agent(agent, agent['cat'], batch3_dir):
            total_count += 1
            print(f"  ✅ {agent['name']}")
    
    # 处理批次4
    print("\n📦 生成批次4: 文笔润色 (100个Agent)")
    batch4_dir = output_base / 'batch-04-style'
    for agent in NOVEL_AGENTS['batch_4']['agents']:
        if generate_agent(agent, agent['cat'], batch4_dir):
            total_count += 1
            print(f"  ✅ {agent['name']}")
    
    # 处理批次5
    print("\n📦 生成批次5: 专项技巧 (100个Agent)")
    batch5_dir = output_base / 'batch-05-special'
    for agent in NOVEL_AGENTS['batch_5']['agents']:
        if generate_agent(agent, agent['cat'], batch5_dir):
            total_count += 1
            print(f"  ✅ {agent['name']}")
    
    return total_count

def main():
    """主函数"""
    print("=" * 60)
    print("🚀 开始生成300个小说创作Agent (批次3-5)")
    print("=" * 60)
    
    total = generate_batch_3_4_5()
    
    print("\n" + "=" * 60)
    print(f"🎉 生成完成！共生成 {total} 个Agent")
    print("=" * 60)
    
    # 生成统计报告
    report = f"""
{'=' * 60}
📊 小说Agent生成报告
{'=' * 60}
生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
成功生成: {total} 个Agent
输出目录: {Path('generated_novel_agents').absolute()}
{'=' * 60}
批次分布:
- 批次3 (情节结构): 100个Agent
- 批次4 (文笔润色): 100个Agent  
- 批次5 (专项技巧): 100个Agent
{'=' * 60}
"""
    print(report)
    
    # 保存报告
    report_file = Path('generated_novel_agents') / 'generation_report.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"\n📄 报告已保存: {report_file}")

if __name__ == '__main__':
    main()
