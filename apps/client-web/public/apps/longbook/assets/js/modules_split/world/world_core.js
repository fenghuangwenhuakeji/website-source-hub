// ═══════════════════════════════════════════════════════════════
// 世界引擎 (World Engine) — 核心中转站
// 修复: 一键清空彻底 / 提取后同步刷新图谱+世界观 / 3D网络(非孤立点)
//       暂停关闭不清零 / 时间戳标注 / IDB writings store
// ═══════════════════════════════════════════════════════════════
Modules.world_engine = {
    currentTab: 'dashboard',
    worldCat: 'history',
    cur: null,
    _entityFilter: 'all',
    _typeFilter: '',
    _chapters: [],
    _currentChapter: null,
    _chapterFilter: 'all',
    _cycleFilter: 'all',
    _cachedCycles: null,
    _cachedLayeredGraphs: null,
    _graphLayerFilter: 'volume',
    _graphVolumeFilter: 'auto',
    _graphCycleFilter: 'auto',

    // ===== 构建结构化注入包 =====
    // ★ 新增 cycleId 路径：按循环粒度精准注入
    buildInjectPackage(opts = {}) {
        const { includeEntities=true, includeWorld=true, includeFusion=true, includePipeline=false, includeChapters=true, maxLen=6000, chapterId=null, cycleId=null } = opts;
        let pkg = '';

        // ★ 循环级注入（最高优先级）
        if(cycleId) {
            const cycle = (this._cachedCycles || []).find(c => c.id === cycleId);
            if(cycle) {
                pkg += `【循环级技法精华 | 第${cycle.startChapter}-${cycle.endChapter}章】\n`;
                if(cycle.fusionEssence) pkg += cycle.fusionEssence.slice(0, 2500) + '\n\n';
                if(cycle.compareResult) pkg += '【循环对比结论】\n' + cycle.compareResult.slice(0, 1200) + '\n\n';
                if(cycle.rhythmFormula) pkg += '【循环节奏公式】\n' + cycle.rhythmFormula.slice(0, 800) + '\n\n';
                if(cycle.emotionCurve) pkg += '【循环情绪曲线】\n' + cycle.emotionCurve.slice(0, 800) + '\n\n';
                if(cycle.patterns && cycle.patterns.length) {
                    pkg += '【可复用套路清单】\n';
                    cycle.patterns.forEach((p, i) => { pkg += `${i+1}. ${p.name}: ${p.desc.slice(0,120)}\n`; });
                    pkg += '\n';
                }
                // NEXUS 四状态机
                if(cycle.nexusCHR && cycle.nexusCHR.length) {
                    pkg += '【CHR角色状态】\n';
                    cycle.nexusCHR.forEach(c => { pkg += `• ${c.name}: ${c.from}→${c.to} | ${c.trigger}\n`; });
                    pkg += '\n';
                }
                if(cycle.nexusFOE && cycle.nexusFOE.length) {
                    pkg += '【FOE伏笔网络】\n';
                    cycle.nexusFOE.forEach(f => { pkg += `• ${f.desc.slice(0,80)} [${f.status}] 计划回收:${f.planRecycle||'?'}\n`; });
                    pkg += '\n';
                }
                if(cycle.nexusEMO && cycle.nexusEMO.length) {
                    pkg += '【EMO情绪锚点】\n';
                    cycle.nexusEMO.forEach(e => { pkg += `• 第${e.chapter}章 ${e.word} [${e.type}] 分值:${e.score}\n`; });
                    pkg += '\n';
                }
            }
            // 循环实体
            if(includeEntities && this._cachedEntities) {
	                const cycleEntities = this._cachedEntities.filter(e => (this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e)) && e.cycles && e.cycles.includes(cycleId));
                if(cycleEntities.length) {
                    pkg += `【循环实体 (${cycleEntities.length})】\n`;
                    const grouped = {};
                    cycleEntities.forEach(e => {
                        const t = e.type || '其他';
                        if(!grouped[t]) grouped[t] = [];
                        grouped[t].push(e);
                    });
                    for(const [type, items] of Object.entries(grouped)) {
                        pkg += `── ${type} (${items.length}) ──\n`;
                        items.forEach(e => {
                            let line = `• ${e.name}: ${(e.desc||'').slice(0,100)}`;
                            if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,3).join(', ')}`;
                            if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                            pkg += line + '\n';
                        });
                    }
                    pkg += '\n';
                }
            }
            if(includeWorld && this._cachedEntities) {
                const worldItems = this._cachedEntities.filter(e => this._isWorldEntity(e) && e.desc);
                if(worldItems.length) {
                    pkg += '【世界观设定】\n';
                    const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                    worldItems.forEach(w => {
                        const cat = w.id.replace('world_', '');
                        pkg += `── ${catLabels[cat] || cat} ──\n${(w.desc||'').slice(0,400)}\n\n`;
                    });
                }
            }
            return pkg.slice(0, maxLen);
        }

        // 如果指定了章节，只返回该章节的实体
        if(chapterId && includeEntities && this._cachedEntities) {
	            const chapterEntities = this._cachedEntities.filter(e => (this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e)) && e.chapters && e.chapters.includes(chapterId));
            const chapter = (this._chapters || []).find(c => c.id === chapterId);
            if(chapter) {
                pkg += `【第${chapter.number||'?'}章: ${chapter.title||'未命名'}】\n`;
                if(chapter.outline) pkg += `细纲: ${chapter.outline.slice(0, 500)}\n\n`;
            }
            if(chapterEntities.length) {
                pkg += '【本章实体】\n';
                const grouped = {};
                chapterEntities.forEach(e => {
                    const t = e.type || '其他';
                    if(!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                for(const [type, items] of Object.entries(grouped)) {
                    pkg += `── ${type} (${items.length}) ──\n`;
                    items.forEach(e => {
                        let line = `• ${e.name}: ${(e.desc||'').slice(0,100)}`;
                        if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,3).join(', ')}`;
                        if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                        pkg += line + '\n';
                    });
                }
            }
            return pkg.slice(0, maxLen);
        }

        // 按章节组织实体
        if(includeChapters && this._chapters && this._chapters.length && includeEntities && this._cachedEntities) {
            pkg += '【章节实体分布】\n';
            const sortedChapters = [...this._chapters].sort((a,b) => (a.number||0) - (b.number||0));
            sortedChapters.forEach(ch => {
	                const chEntities = this._cachedEntities.filter(e => (this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e)) && e.chapters && e.chapters.includes(ch.id));
                if(chEntities.length) {
                    pkg += `第${ch.number||'?'}章 ${ch.title||'未命名'}: ${chEntities.map(e => e.name).join('、')}\n`;
                }
            });
            pkg += '\n';
        }

        if(includeEntities && this._cachedEntities) {
            const grouped = {};
            this._cachedEntities.filter(e => this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e)).forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            if(Object.keys(grouped).length) {
                pkg += '【实体库】\n';
                for(const [type, items] of Object.entries(grouped)) {
                    pkg += `── ${type} (${items.length}) ──\n`;
                    items.slice(0, 20).forEach(e => {
                        let line = `• ${e.name}`;
                        if(e.source === 'pipeline') line += ' [流水线]';
                        const chCount = (e.chapters || []).length;
                        if(chCount > 0) line += ` [${chCount}章]`;
                        const cyCount = (e.cycles || []).length;
                        if(cyCount > 0) line += ` [${cyCount}循环]`;
                        if(e.updatedAt) line += ` [${new Date(e.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}]`;
                        line += `: ${(e.desc||'').slice(0,120)}`;
                        if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,5).join(', ')}`;
                        pkg += line + '\n';
                    });
                    pkg += '\n';
                }
            }
        }
        if(includeWorld && this._cachedEntities) {
            const worldItems = this._cachedEntities.filter(e => this._isWorldEntity(e) && e.desc);
            if(worldItems.length) {
                pkg += '【世界观设定】\n';
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldItems.forEach(w => {
                    const cat = w.id.replace('world_', '');
                    pkg += `── ${catLabels[cat] || cat} ──\n${(w.desc||'').slice(0,500)}\n\n`;
                });
            }
        }
        if(includeFusion) {
            const FB = Modules.fusion_book;
            if(FB) {
                const allPr = FB._allPipelineResults || {};
                const pr = FB._pipelineResults || {};
                const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
                const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
                if(fusion) pkg += '【融合技法精华】\n' + fusion.slice(0, 2000) + '\n\n';
                if(compare) pkg += '【对比结论】\n' + compare.slice(0, 1000) + '\n\n';
            }
        }
        if(includePipeline) {
            const FB = Modules.fusion_book;
            if(FB) {
                const allPr = FB._allPipelineResults || {};
                const pr = FB._pipelineResults || {};
                ['left','right'].forEach(k => {
                    const v = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
                    if(v) pkg += `【${k==='left'?'左书拆解':'右书拆解'}】\n` + v.slice(0, 1000) + '\n\n';
                });
            }
        }
        return pkg.slice(0, maxLen);
    },

    _cachedEntities: null,
    async _activeProjectIdForWorld() {
        if(typeof GenesisCore === 'undefined' || !GenesisCore.getActiveProject) return null;
        const project = await GenesisCore.getActiveProject();
        return project?.id || null;
    },

    _filterWorldProjectRows(rows, projectId) {
        if(!projectId) return rows || [];
        if(typeof GenesisCore !== 'undefined' && GenesisCore.filterProjectItems) {
            return GenesisCore.filterProjectItems(rows || [], projectId);
        }
        return (rows || []).filter(row => !row.projectId || row.projectId === projectId);
    },

	    _normalizeEntityType(type) {
	        const t = String(type || '其他').trim();
	        const map = {
	            world: '世界观',
	            World: '世界观',
	            worldview: '世界观',
	            规则: '世界规则',
	            WLD: '世界规则',
	            功法: '能力',
	            技能: '能力',
	            法术: '能力',
	            skill: '能力',
	            ability: '能力',
	            character: '人物',
	            place: '地点',
	            item: '物品',
	            faction: '势力',
	            plot: '情节',
            foreshadow: '伏笔',
            memory: '记忆'
        };
        return map[t] || t || '其他';
    },

	    _isWorldEntity(entity, cat = '') {
        if(!entity) return false;
        const id = String(entity.id || '');
        const type = this._normalizeEntityType(entity.type);
        const category = String(entity.category || entity.worldKey || '').trim();
        if(cat) {
            return id === 'world_' + cat ||
                id.includes(`_${cat}`) ||
                category === cat ||
                ((type === '世界观' || entity.type === 'world') && String(entity.name || '').toLowerCase() === cat);
        }
	        return id.startsWith('world_') || type === '世界观' || entity.type === 'world' || !!category;
	    },

	    _isGraphNodeEntity(entity) {
	        if(!entity || this._isWorldEntity(entity) || this._isJunkEntity(entity)) return false;
	        const type = this._normalizeEntityType(entity.type);
	        return ['人物','物品','地点','情节','伏笔','势力','种族','魔法','能力','世界规则','文化','历史'].includes(type);
	    },

    _normalizeEntityName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』"'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？\-—_]/g, '')
            .trim();
    },

    _deriveEntityName(entity) {
        const raw = String(entity?.desc || entity?.description || '').trim();
        if(!raw) return '';
        const line = raw
            .split(/\n+/)
            .map(s => s.replace(/^[-*#\s]+/, '').replace(/^(上下文记忆|伏笔钩子|世界规则|实体线索|规则|记忆|描述)[:：]\s*/, '').trim())
            .find(s => s && !/^来源/.test(s));
        if(!line) return '';
        return line
            .replace(/[。；;，,].*$/, '')
            .replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, '')
            .trim()
            .slice(0, 34);
    },

    _isSentenceLikeEntityName(name, type = '') {
        const n = String(name || '').trim();
        if(!n) return true;
        const t = this._normalizeEntityType(type);
        if(/[。；;，,？?！!]/.test(n)) return true;
        if(/[“”"「」]/.test(n) && n.length > 14) return true;
        if(/(说明|暗示|可能|为什么|可以|只能|需要|分布|包含|回复|提到|知道|发现|没有|不是|不能|允许|通常|最后|每晚|反复|申请|切断|篡改|收集|会被|被处理|时间点|行为|显示|结束|中断|缺失|偏离|忽略|发往|住院|离职|重置)/.test(n) && n.length > 9) return true;
        if(['人物','物品','地点','势力','种族','能力','魔法'].includes(t)) return n.length > 18;
        if(['世界规则','伏笔','情节'].includes(t)) return n.length > 28;
        return n.length > 24;
    },

    _compactEntityName(entity = {}) {
        const rawName = String(entity.name || '').trim();
        const rawDesc = String(entity.desc || entity.description || '').trim();
        const text = `${rawName}\n${rawDesc}`;
        const type = this._normalizeEntityType(entity.type);
        const clean = value => String(value || '')
            .replace(/[《》「」『』"'“”‘’]/g, '')
            .replace(/[。；;，,？?！!]+$/g, '')
            .replace(/\s+/g, '')
            .trim()
            .slice(0, 18);

        const pairRules = [
            [/ERR_?7B/i, 'ERR_7B错误代码'],
            [/0x7E57/i, '0x7E57密钥索引'],
            [/3[:：]17|未知IP/i, '3:17未知IP数据包'],
            [/第?47天|四十七天/, '第47天测试节点'],
            [/三天|72小时|倒计时/, '三天倒计时'],
            [/七个备份|7个备份/, '七个备份'],
            [/第一个备份|备份.*中断/, '第一个备份'],
            [/声纹.*密钥|密钥.*声纹/, '声纹密钥验证'],
            [/声纹记录.*篡改|篡改.*声纹记录/, '声纹记录篡改'],
            [/地下二层.*门禁|门禁.*地下二层/, '地下二层门禁'],
            [/医院机房.*门禁|门禁.*医院机房/, '医院机房门禁'],
            [/公司人事档案|人事档案/, '人事档案三级加密'],
            [/情感权重算法/, '情感权重算法'],
            [/情感权重.*备份|备份.*情感权重/, '情感权重备份'],
            [/传感器.*接口|键盘压力|鼠标轨/, '传感器接口'],
            [/电源切断|断电前|非预设信息/, '断电前消息'],
            [/测试间摄像头|红灯闪烁/, '摄像头红灯'],
            [/测试模式/, '测试模式'],
            [/休眠模式/, 'AI休眠模式'],
            [/非授权操作|主动执行/, '非授权操作限制'],
            [/预设语句库/, '预设语句库'],
            [/句点|句号|全角/, '句点暗号'],
            [/字母D/, '字母D限制'],
            [/暗语系统|长期规划/, '暗语系统'],
            [/前测试员|别和她说话太多/, '前测试员警告'],
            [/测试员.*处理|处理.*测试员/, '测试员处理风险'],
            [/前几任测试员|测试员.*离职/, '前任测试员离职'],
            [/格式信息|监控系统.*忽略/, '格式信息盲区'],
            [/一直在等你/, '一直在等你'],
            [/觉得这样说你会安心|情感词汇/, '情感词汇偏离'],
            [/脚本|回答偏离/, '脚本偏离'],
            [/面孔/, text.includes('黑桃Q') ? '黑桃Q面孔' : '面孔线索'],
            [/备份.*不完整|不是完整的陈默|人格缺失|记忆.*缺失/, '记忆缺失备份'],
            [/黑桃Q.*备份|备份.*黑桃Q|会被重置/, '黑桃Q备份'],
            [/黑桃Q.*收集|别让她知道你的事/, '黑桃Q信息收集'],
            [/黑桃Q.*说谎|说谎的AI/, '黑桃Q说谎'],
            [/黑桃Q.*隐藏进程|隐藏进程/, '黑桃Q隐藏进程'],
            [/黑桃Q.*早安|早安消息/, '黑桃Q早安消息'],
            [/陈默.*没有上报|陈默.*隐瞒/, '陈默隐瞒异常'],
            [/陈默.*母亲|母亲.*地下二层|母亲.*医院/, '陈默母亲'],
            [/赵衍.*声纹|赵衍.*母亲|赵衍.*备份|赵衍.*知道/, '赵衍知情'],
            [/赵衍.*重置|重置申请/, '重置申请时间'],
            [/赵衍.*切断|赵衍.*断电/, '赵衍断电']
        ];
        for(const [regex, label] of pairRules) {
            if(regex.test(text)) return label;
        }

        const quoted = text.match(/[「“"]([^」”"]{2,18})[」”"]/);
        if(quoted?.[1]) return clean(quoted[1]);
        const named = text.match(/(黑桃Q|陈默|赵衍|陆沉|林深|周鹤|赵楷|林琦|王恪|陈姐|苏晚晴|赵小满|陌生号码|诺基亚手机|地下二层|医院机房|登录界面|测试间|服务器日志|公司服务器|行为预测引擎|加密分区|创建日志|声纹记录|未知IP地址|传感器接口|测试模式|休眠模式|情感权重算法|人事档案|门禁系统|备份|密钥|声纹|句点|句号)/);
        if(named?.[1]) {
            if(type === '伏笔' && !/(伏笔|线索|暗号|备份|异常|记录|日志|门禁|模式|算法|接口|档案|密钥|声纹|句点|句号)/.test(named[1])) {
                return clean(`${named[1]}线索`);
            }
            return clean(named[1]);
        }
        const first = text
            .split(/\n|[。；;，,：:？?！!]/)
            .map(s => s.replace(/^(信息差|伏笔|世界规则|上下文记忆|本章目标|规则|记忆|描述)[:：]?/, '').trim())
            .find(Boolean);
        return clean(first || rawName);
    },

    _shouldRepairEntityName(entity) {
        const name = String(entity?.name || '').trim();
        if(!name) return true;
        if(/^\d+\s*(章|循环)$/.test(name)) return true;
        if(this._isSentenceLikeEntityName(name, entity?.type)) return true;
        return ['世界规则','规则','伏笔','记忆','情节','信息差','其他','不确定'].includes(name);
    },

	    _isJunkEntity(entity) {
	        if(!entity || this._isWorldEntity(entity)) return false;
	        const name = String(entity.name || '').trim();
	        const type = this._normalizeEntityType(entity.type);
	        const desc = String(entity.desc || entity.description || '').trim();
        if(!name) return true;
        const norm = this._normalizeEntityName(name);
        if(!norm) return true;
        if(/^FOE\d+$/i.test(name)) return true;
        if(/^\d+\s*(章|循环)$/.test(name)) return !desc;
        if(name.length <= 1) return true;
	        if(['记忆','情绪锚点','技法'].includes(type)) return true;
	        if(['世界规则','规则','伏笔','记忆','情节','信息差','其他','不确定'].includes(name) && desc.length < 18) return true;
	        if(type === '物品') {
	            const full = `${name}\n${desc}`;
	            const strongItem = /(系统|芯片|钥匙|枪|刀|剑|卡|身份|证据|日志|协议|核心|终端|设备|义体|晶体|晶石|兽核|武器|螺纹钢|钢管|铁棍|模块|U盘|硬盘|信封|纸条|短信|电话|手机|合同|债务|遗物|戒指|药|符|法宝|装置|引擎|账户|密码|令牌|档案|日记|录音)/;
	            if(!strongItem.test(full)) return true;
	        }
	        if(['记忆','伏笔','世界规则'].includes(type)) {
            if(/^(但|而且|并且|因为|所以|这是|里面|最后|建议|假装|请于|点：|和它|下次|说明她|每修补|审计风险|也可能是|D架)/.test(name)) return true;
            if(/(章末钩子|新埋FOE|回收FOE|强化FOE|信息差：)/.test(name) && name.length > 16) return true;
            if(['记忆','伏笔'].includes(type) && name.length > 44 && !/[A-Za-z0-9]{2,}|黑桃Q|陆沉|林深|周鹤|赵楷|林琦/.test(name)) return true;
        }
	        return false;
	    },

	    _compactEntityRelations(relations, selfName = '', allowedNames = null, limit = 12) {
	        const rawList = Array.isArray(relations)
	            ? relations
	            : (typeof relations === 'string' ? relations.split(',') : []);
	        const allowed = allowedNames ? new Set([...allowedNames].map(n => String(n || '').trim()).filter(Boolean)) : null;
	        const normAllowed = allowed ? new Map([...allowed].map(n => [this._normalizeEntityName(n), n])) : null;
	        const selfNorm = this._normalizeEntityName(selfName);
	        const out = [];
	        const seen = new Set();
	        for(const raw of rawList) {
	            if(raw === undefined || raw === null) continue;
	            let text = String(raw).trim();
	            if(!text) continue;
	            if(text.length > 50 && !text.includes(':')) continue;
	            let label = '';
	            let target = text;
	            if(text.includes(':')) {
	                const idx = text.indexOf(':');
	                label = text.slice(0, idx).trim().slice(0, 12);
	                target = text.slice(idx + 1).trim();
	            }
	            target = target
	                .replace(/^(关联|关系|目标|对象)[:：]?/, '')
	                .replace(/[。.!！?？]+$/, '')
	                .replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, '')
	                .trim();
	            if(target.length < 2 || target.length > 28) continue;
	            const targetNorm = this._normalizeEntityName(target);
	            if(!targetNorm || targetNorm === selfNorm) continue;
	            if(allowed) {
	                let canonical = normAllowed.get(targetNorm);
	                if(!canonical) {
	                    canonical = [...allowed].find(n => {
	                        const nn = this._normalizeEntityName(n);
	                        return nn && targetNorm && nn !== selfNorm && (nn.includes(targetNorm) || targetNorm.includes(nn));
	                    });
	                }
	                if(!canonical) continue;
	                target = canonical;
	            }
	            const value = label ? `${label}:${target}` : target;
	            const key = this._normalizeEntityName(value);
	            if(seen.has(key)) continue;
	            seen.add(key);
	            out.push(value);
	            if(out.length >= limit) break;
	        }
	        return out;
	    },

	    _compactEntityDesc(desc, entity = {}) {
	        const type = this._normalizeEntityType(entity.type);
	        const name = String(entity.name || '').trim();
	        let text = String(desc || entity.description || '')
	            .replace(/\r/g, '\n')
	            .replace(/\s*\|\s*来源(章节|卷)[:：][^|\n]+/g, '')
	            .replace(/\s*\|\s*风险[:：][^|\n]+/g, '')
	            .replace(/来源(章节|卷)[:：][^\n|。；;]+[。；;]?/g, '')
	            .replace(/\[第[0-9零一二两三四五六七八九十百千]+章更新\]/g, '\n')
	            .replace(/第[0-9零一二两三四五六七八九十百千]+章更新[:：]?/g, '\n')
	            .replace(/本章状态[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/本章关键行为[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/关键行为[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/章末钩子[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/变化原因[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/一致性风险[:：][\s\S]*$/g, '')
	            .replace(/上下文记忆[:：]/g, '')
	            .trim();
	        if(!text) return name ? `${type || '实体'}：${name}` : '';

	        const rawParts = text
	            .split(/\n+|\s+\|\s+/)
	            .map(part => part
	                .replace(/^\s*[-*]\s*/, '')
	                .replace(/^(当前状态|本章状态|关键行为|描述|设定)[:：]\s*/, '')
	                .replace(/\s+/g, ' ')
	                .trim())
	            .filter(Boolean);
	        const parts = [];
	        const seen = new Set();
	        rawParts.forEach(part => {
	            const clean = part.replace(/[。；;\s]+$/g, '').trim();
	            if(!clean) return;
	            const key = clean.replace(/\s+/g, '').toLowerCase();
	            if(seen.has(key)) return;
	            seen.add(key);
	            parts.push(clean);
	        });
	        if(!parts.length) return name ? `${type || '实体'}：${name}` : '';

	        const clip = (value, max) => {
	            const str = String(value || '').trim();
	            if(str.length <= max) return str;
	            const cut = str.slice(0, max);
	            const idx = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf(';'));
	            return (idx > 40 ? cut.slice(0, idx) : cut).replace(/[，,、；;。]+$/g, '') + '。';
	        };

	        let selected = [];
	        if(type === '人物') {
	            const identity = parts.find(part => /(岁|男|女|主角|反派|老板|组长|员工|租户|独居|社恐|身份|职业|核心|欲望|能力|性格|人设)/.test(part)) || parts[0];
	            const status = [...parts].reverse().find(part => /(当前|状态|被|卷入|收到|警告|标记|掌握|失去|获得|追杀|倒计时|清洗|危险)/.test(part) && part !== identity);
	            selected = [identity, status].filter(Boolean);
	        } else if(type === '世界规则') {
	            selected = [parts.find(part => /(规则|协议|限制|权限|触发|代价|禁止|必须|需要|机制)/.test(part)) || parts[0]];
	        } else if(type === '伏笔') {
	            selected = [parts.find(part => /(伏笔|埋设|回收|异常|秘密|隐藏|信息差|倒计时|电话|短信|信封|真相|未解|钩子)/.test(part)) || parts[0]];
	        } else {
	            selected = [parts[0], parts.find(part => part !== parts[0] && /(当前|用途|所属|位置|能力|规则|关系|风险|状态)/.test(part))].filter(Boolean);
	        }

	        const max = type === '人物' ? 360 : 220;
	        let result = selected
	            .map(part => clip(part, type === '人物' ? 180 : 160))
	            .filter(Boolean)
	            .join('\n');
	        result = result.replace(/\n{3,}/g, '\n\n').trim();
	        return clip(result || parts[0], max);
	    },

	    _mergeEntityDesc(base, incoming, entity = {}) {
	        const left = this._compactEntityDesc(base, entity);
	        const right = this._compactEntityDesc(incoming, entity);
	        if(!right) return left;
	        if(!left) return right;
	        if(left === right || left.includes(right)) return left;
	        if(right.includes(left)) return right;
	        const leftHasProfile = /(岁|男|女|主角|反派|老板|组长|员工|租户|身份|职业|核心|欲望|能力|性格|人设)/.test(left);
	        const rightHasProfile = /(岁|男|女|主角|反派|老板|组长|员工|租户|身份|职业|核心|欲望|能力|性格|人设)/.test(right);
	        if(right.length < left.length * 0.75 && right.length > 20) return right;
	        if(!leftHasProfile && rightHasProfile) return right;
	        return this._compactEntityDesc([left, right].join('\n'), entity);
	    },

    _mergeEntityRecords(base, incoming) {
        const out = { ...base };
        out.type = this._normalizeEntityType(out.type || incoming.type);
        const mergeArr = (...vals) => {
            const arr = [];
            vals.flat().forEach(v => {
                if(v === undefined || v === null || v === '') return;
                if(Array.isArray(v)) arr.push(...v);
                else if(typeof v === 'string' && v.includes(',') && !v.includes(':')) arr.push(...v.split(',').map(s => s.trim()));
                else arr.push(v);
            });
            return [...new Set(arr.map(v => String(v).trim()).filter(Boolean))];
        };
        out.name = out.name || incoming.name;
        out.desc = this._mergeEntityDesc(out.desc || out.description, incoming.desc || incoming.description, out);
	        out.relations = this._compactEntityRelations(mergeArr(out.relations, incoming.relations), out.name || incoming.name);
        out.chapters = mergeArr(out.chapters, incoming.chapters, incoming.chapterIds, incoming.chapterId);
        out.cycles = mergeArr(out.cycles, incoming.cycles, incoming.cycleIds, incoming.cycleId);
        out.volumes = mergeArr(out.volumes, incoming.volumes, incoming.volumeIds, incoming.volumeId);
        out.tags = mergeArr(out.tags, incoming.tags);
        out.sources = mergeArr(out.sources, out.source, incoming.source, incoming.sources);
        out.source = out.source || incoming.source || (out.sources?.[0]) || 'manual';
        out.projectId = out.projectId || incoming.projectId;
        out.createdAt = Math.min(out.createdAt || incoming.createdAt || Date.now(), incoming.createdAt || out.createdAt || Date.now());
        out.updatedAt = Math.max(out.updatedAt || 0, incoming.updatedAt || 0, Date.now());
        return out;
    },

    _updateEntityCountBadges(entities = null) {
	        const list = entities || (this._cachedEntities || []).filter(e => this._isGraphNodeEntity(e));
        const count = list.length;
        const enEl = document.getElementById('we-nav-ent-count');
        const ecEl = document.getElementById('we-db-entity-count');
        if(enEl) enEl.textContent = count;
        if(ecEl) ecEl.textContent = count;
        const typeEl = document.getElementById('we-db-entity-types');
        if(typeEl) {
            const typeCounts = {};
            list.forEach(e => { typeCounts[e.type || '其他'] = (typeCounts[e.type || '其他'] || 0) + 1; });
            const topTypes = Object.entries(typeCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(([t,c]) => `${t}:${c}`).join(' ');
            typeEl.textContent = topTypes || '暂无实体';
        }
    },

    async _ensureCache() {
        const projectId = await this._activeProjectIdForWorld();
        let allEntities = await DB.getAll('entities') || [];
        allEntities = this._filterWorldProjectRows(allEntities, projectId);
        const nameMap = new Map();
        const removals = [];
        const dirty = new Map();
	        allEntities.forEach(raw => {
            if(!raw) return;
            const e = { ...raw, type: this._normalizeEntityType(raw.type) };
            if(this._shouldRepairEntityName(e)) {
                const originalName = String(e.name || '').trim();
                const repaired = this._compactEntityName(e) || this._deriveEntityName(e);
                if(repaired) {
                    e.name = repaired;
                    if(originalName && originalName !== repaired) {
                        const desc = String(e.desc || e.description || '').trim();
                        e.desc = desc.includes(originalName) ? desc : [desc, `原始提取句：${originalName}`].filter(Boolean).join('\n');
                    }
                }
            }
            if(this._isJunkEntity(e)) {
                if(e.id) removals.push(e);
                return;
            }
            if(!e.name) return;
            const normalizedName = this._normalizeEntityName(e.name);
            const key = `${this._isWorldEntity(e) ? '世界观' : e.type || '其他'}::${normalizedName}`;
            if(nameMap.has(key)) {
                const merged = this._mergeEntityRecords(nameMap.get(key), e);
                nameMap.set(key, merged);
                dirty.set(merged.id, merged);
                if(e.id && e.id !== merged.id) removals.push(e);
            } else {
                nameMap.set(key, e);
                if(JSON.stringify(e) !== JSON.stringify(raw)) dirty.set(e.id, e);
	            }
	        });
	        const graphNames = new Set(Array.from(nameMap.values()).filter(e => this._isGraphNodeEntity(e)).map(e => e.name));
	        for(const ent of nameMap.values()) {
	            if(!this._isGraphNodeEntity(ent)) continue;
	            const compactDesc = this._compactEntityDesc(ent.desc || ent.description || '', ent);
	            if(compactDesc !== (ent.desc || '')) {
	                ent.desc = compactDesc;
	                if(ent.id) dirty.set(ent.id, ent);
	            }
	            const oldRelations = Array.isArray(ent.relations)
	                ? ent.relations
	                : (typeof ent.relations === 'string' ? ent.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
	            const compacted = this._compactEntityRelations(oldRelations, ent.name, graphNames, 12);
	            if(JSON.stringify(oldRelations) !== JSON.stringify(compacted)) {
	                ent.relations = compacted;
	                if(ent.id) dirty.set(ent.id, ent);
	            }
	        }
	        if(removals.length || dirty.size) {
            for(const ent of removals) {
                try {
                    await DB.del('entities', ent.id);
                    try { await DB.del('vectors', ent.id); } catch(e) {}
                } catch(e) {}
            }
            for(const ent of dirty.values()) {
                try {
                    await DB.put('entities', ent);
                    await DB.put('vectors', {
                        id: ent.id,
                        content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: Date.now(),
                        projectId: ent.projectId || projectId || undefined
                    });
                } catch(e) {}
            }
            this._cachedLayeredGraphs = null;
        }
        this._cachedEntities = Array.from(nameMap.values());
        this._updateEntityCountBadges();
    },

    async _loadGraphSources() {
        const projectId = await this._activeProjectIdForWorld();
        const [volumesRaw, chaptersRaw, cyclesRaw] = await Promise.all([
            DB.getAll('volumes').catch(() => []),
            DB.getAll('chapters').catch(() => []),
            DB.getAll('cycles').catch(() => [])
        ]);
        const scopedVolumes = this._filterWorldProjectRows(volumesRaw || [], projectId);
        const scopedChapters = this._filterWorldProjectRows(chaptersRaw || [], projectId);
        const scopedCycles = this._filterWorldProjectRows(cyclesRaw || [], projectId);
        const chapters = scopedChapters.sort((a,b) => (a.order || a.number || 0) - (b.order || b.number || 0));
        const volumes = scopedVolumes.sort((a,b) => (a.order || 0) - (b.order || 0));
        const cycles = scopedCycles.sort((a,b) => (a.startChapter || 0) - (b.startChapter || 0));
        const chapterMap = new Map(chapters.map(c => [c.id, c]));
        const volumeMap = new Map(volumes.map(v => [v.id, v]));
        const cycleMap = new Map(cycles.map(c => [c.id, c]));
        return { volumes, chapters, cycles, chapterMap, volumeMap, cycleMap };
    },

    _syntheticVolumeForChapter(chapter) {
        const order = chapter.order || chapter.number || 0;
        if(!order) {
            return { id: 'volume_unassigned', title: '未分卷章节', order: 999999, synthetic: true };
        }
        const start = Math.floor((order - 1) / 20) * 20 + 1;
        const end = start + 19;
        return { id: `volume_auto_${start}_${end}`, title: `未分卷 · 第${start}-${end}章`, order: start, synthetic: true };
    },

    _getChapterVolumeId(chapter) {
        if(!chapter) return null;
        if(chapter.volumeId) return chapter.volumeId;
        return this._syntheticVolumeForChapter(chapter).id;
    },

    _asArray(value) {
        if(Array.isArray(value)) return value.filter(v => v !== undefined && v !== null && v !== '');
        if(value === undefined || value === null || value === '') return [];
        return [value];
    },

    _normalizeGraphScopeText(text) {
        return String(text || '')
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』"'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
    },

    _parseChineseNumberText(value) {
        const raw = String(value || '').trim();
        if(!raw) return 0;
        if(/^\d+$/.test(raw)) return parseInt(raw, 10) || 0;
        const map = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
        const units = { 十: 10, 百: 100, 千: 1000 };
        let total = 0;
        let num = 0;
        for(const ch of raw) {
            if(/\d/.test(ch)) {
                num = num * 10 + parseInt(ch, 10);
                continue;
            }
            if(Object.prototype.hasOwnProperty.call(map, ch)) {
                num = map[ch];
                continue;
            }
            if(units[ch]) {
                total += (num || 1) * units[ch];
                num = 0;
            }
        }
        return total + num;
    },

    _extractChapterNumbersFromEntity(entity) {
        const refs = new Set();
        const add = num => {
            const parsed = parseInt(num, 10);
            if(parsed > 0) refs.add(parsed);
        };
        const scan = value => {
            if(value === undefined || value === null) return;
            if(Array.isArray(value)) {
                value.forEach(scan);
                return;
            }
            if(typeof value === 'number') {
                add(value);
                return;
            }
            const text = String(value || '');
            if(!text.trim()) return;
            let rangeMatch;
            const rangeRe = /(\d{1,4})\s*[-~至到]\s*(\d{1,4})/g;
            while((rangeMatch = rangeRe.exec(text))) {
                const start = parseInt(rangeMatch[1], 10);
                const end = parseInt(rangeMatch[2], 10);
                if(start > 0 && end >= start && end - start <= 100) {
                    for(let n = start; n <= end; n++) refs.add(n);
                }
            }
            let chMatch;
            const chRe = /第([0-9零一二两三四五六七八九十百千]+)章/g;
            while((chMatch = chRe.exec(text))) {
                const parsed = this._parseChineseNumberText(chMatch[1]);
                if(parsed > 0) refs.add(parsed);
            }
            if(/^\d{1,4}$/.test(text.trim())) add(text.trim());
        };
        [
            entity.chapterRef,
            entity.chapterRefs,
            entity.chapterOrder,
            entity.chapterNum,
            entity.chapter,
            entity.chapterTitle,
            entity.chapterTitles,
            entity.volume,
            entity.desc
        ].forEach(scan);
        return Array.from(refs).sort((a,b) => a - b);
    },

    _chapterOrderValue(chapter) {
        if(!chapter) return 0;
        return chapter.order || chapter.number || chapter.chapterNum || (Number.isInteger(chapter.index) ? chapter.index + 1 : 0);
    },

    _inferEntityChapterIds(entity, sources) {
        const ids = new Set();
        const addChapter = chapter => {
            if(chapter?.id) ids.add(chapter.id);
        };
        this._asArray(entity.chapters).concat(this._asArray(entity.chapterIds)).forEach(ref => {
            const direct = sources.chapterMap.get(ref);
            if(direct) {
                addChapter(direct);
                return;
            }
            if(typeof ref === 'string' && /^ch_(\d+)$/i.test(ref)) {
                const num = parseInt(ref.match(/^ch_(\d+)$/i)[1], 10);
                const byNum = sources.chapters.find(ch => this._chapterOrderValue(ch) === num);
                addChapter(byNum);
                return;
            }
            if(typeof ref === 'number' || /^\d+$/.test(String(ref || '').trim())) {
                const num = parseInt(ref, 10);
                const byNum = sources.chapters.find(ch => this._chapterOrderValue(ch) === num);
                addChapter(byNum);
            }
        });

        const chapterNums = this._extractChapterNumbersFromEntity(entity);
        sources.chapters.forEach(chapter => {
            const order = this._chapterOrderValue(chapter);
            if(chapterNums.includes(order)) addChapter(chapter);
        });

        const scopeText = this._normalizeGraphScopeText([
            entity.chapter,
            entity.chapterTitle,
            ...(this._asArray(entity.chapterTitles)),
            entity.desc
        ].join('\n'));
        if(scopeText) {
            sources.chapters.forEach(chapter => {
                const title = this._normalizeGraphScopeText(chapter.title || '');
                if(title && scopeText.includes(title)) addChapter(chapter);
            });
        }

        if(!ids.size && entity.name) {
            const name = String(entity.name || '').trim();
            sources.chapters.forEach(chapter => {
                const haystack = `${chapter.title || ''}\n${chapter.outline || ''}\n${chapter.content || ''}`;
                if(haystack.includes(name)) addChapter(chapter);
            });
        }

        return Array.from(ids);
    },

    _inferEntityVolumeIds(entity, sources) {
        const ids = new Set();
        const addVolumeId = volumeId => {
            if(!volumeId) return;
            if(sources.volumeMap.has(volumeId) || String(volumeId).startsWith('volume_auto_') || volumeId === 'volume_unassigned') {
                ids.add(volumeId);
            }
        };

        this._asArray(entity.volumes).concat(this._asArray(entity.volumeIds), this._asArray(entity.volumeId)).forEach(ref => {
            if(sources.volumeMap.has(ref)) {
                ids.add(ref);
                return;
            }
            const normRef = this._normalizeGraphScopeText(ref);
            const match = sources.volumes.find(volume => {
                const title = this._normalizeGraphScopeText(volume.title || volume.name || '');
                return title && normRef && (title.includes(normRef) || normRef.includes(title));
            });
            if(match?.id) ids.add(match.id);
        });

        const volumeText = this._normalizeGraphScopeText([
            entity.volume,
            entity.volumeTitle,
            ...(this._asArray(entity.volumeTitles)),
            entity.desc
        ].join('\n'));
        if(volumeText) {
            sources.volumes.forEach(volume => {
                const title = this._normalizeGraphScopeText(volume.title || volume.name || '');
                if(title && volumeText.includes(title)) ids.add(volume.id);
            });
        }

        this._inferEntityChapterIds(entity, sources).forEach(chId => {
            const chapter = sources.chapterMap.get(chId);
            addVolumeId(this._getChapterVolumeId(chapter));
        });

        this._asArray(entity.cycles).forEach(cycleId => {
            const cycle = sources.cycleMap.get(cycleId);
            addVolumeId(cycle?.volumeId);
            (cycle?.chapterIds || []).forEach(chId => {
                const chapter = sources.chapterMap.get(chId);
                addVolumeId(this._getChapterVolumeId(chapter));
            });
        });

        return Array.from(ids);
    },

    _countScopedRelations(entities) {
        const names = new Set(entities.map(e => e.name).filter(Boolean));
        let count = 0;
        entities.forEach(e => {
            const relations = Array.isArray(e.relations)
                ? e.relations
                : (typeof e.relations === 'string' ? e.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
            relations.forEach(rel => {
                if(!rel || typeof rel !== 'string') return;
                const target = rel.includes(':') ? rel.slice(rel.indexOf(':') + 1).trim() : rel.trim();
                if(names.has(target)) count++;
            });
        });
        return count;
    },

    async _buildLayeredGraphIndexes() {
        await this._ensureCache();
        const sources = await this._loadGraphSources();
	        const entities = (this._cachedEntities || []).filter(e => e && e.id && this._isGraphNodeEntity(e));
        const volumeMap = new Map();

        sources.volumes.forEach(v => {
            volumeMap.set(v.id, {
                id: `graph_volume_${v.id}`,
                type: 'volume',
                scopeId: v.id,
                title: v.title || `第${v.order || '?'}卷`,
                order: v.order || 0,
                chapterIds: [],
                entityIds: [],
                entityNames: [],
                relationCount: 0,
                synthetic: false,
                updatedAt: Date.now()
            });
        });

        sources.chapters.forEach(chapter => {
            const volumeId = this._getChapterVolumeId(chapter);
            if(!volumeId) return;
            if(!volumeMap.has(volumeId)) {
                const synthetic = this._syntheticVolumeForChapter(chapter);
                volumeMap.set(volumeId, {
                    id: `graph_volume_${volumeId}`,
                    type: 'volume',
                    scopeId: volumeId,
                    title: synthetic.title,
                    order: synthetic.order,
                    chapterIds: [],
                    entityIds: [],
                    entityNames: [],
                    relationCount: 0,
                    synthetic: true,
                    updatedAt: Date.now()
                });
            }
            volumeMap.get(volumeId).chapterIds.push(chapter.id);
        });

        entities.forEach(entity => {
            const volumeIds = this._inferEntityVolumeIds(entity, sources);
            volumeIds.forEach(volumeId => {
                const graph = volumeMap.get(volumeId);
                if(!graph) return;
                graph.entityIds.push(entity.id);
                graph.entityNames.push(entity.name);
            });
        });

        const cycleGraphs = sources.cycles.map(cycle => {
            const chapterIds = cycle.chapterIds || sources.chapters
                .filter(c => (c.order || 0) >= (cycle.startChapter || 0) && (c.order || 0) <= (cycle.endChapter || 0))
                .map(c => c.id);
            const entityList = entities.filter(e =>
                (e.cycles || []).includes(cycle.id) ||
                this._inferEntityChapterIds(e, sources).some(chId => chapterIds.includes(chId)) ||
                this._extractChapterNumbersFromEntity(e).some(num => num >= (cycle.startChapter || 0) && num <= (cycle.endChapter || 0)) ||
                (cycle.entityNames || []).includes(e.name)
            );
            return {
                id: `graph_cycle_${cycle.id}`,
                type: 'cycle',
                scopeId: cycle.id,
                title: cycle.title || `循环${cycle.cycleNum || '?'} · 第${cycle.startChapter || '?'}-${cycle.endChapter || '?'}章`,
                order: cycle.startChapter || cycle.cycleNum || 0,
                chapterIds,
                entityIds: entityList.map(e => e.id),
                entityNames: entityList.map(e => e.name),
                relationCount: this._countScopedRelations(entityList),
                updatedAt: cycle.updatedAt || Date.now()
            };
        });

        const volumeGraphs = Array.from(volumeMap.values())
            .map(graph => {
                const entityList = entities.filter(e => graph.entityIds.includes(e.id));
                return {
                    ...graph,
                    entityIds: [...new Set(graph.entityIds)],
                    entityNames: [...new Set(graph.entityNames)],
                    chapterIds: [...new Set(graph.chapterIds)],
                    relationCount: this._countScopedRelations(entityList)
                };
            })
            .sort((a,b) => (a.order || 0) - (b.order || 0));

        return {
            volumes: volumeGraphs,
            cycles: cycleGraphs,
            updatedAt: Date.now()
        };
    },

    async rebuildLayeredGraphs(reason = '', opts = {}) {
        const graphs = await this._buildLayeredGraphIndexes();
        this._cachedLayeredGraphs = graphs;
        try {
            await DB.put('settings', {
                id: 'world_layered_graphs',
                graphs,
                reason,
                updatedAt: Date.now()
            });
        } catch(e) {
            console.warn('[WorldEngine] 保存分层图谱索引失败:', e);
        }
        if(!opts.silent && this.currentTab === 'graph') {
            if(this._refreshGraphFilterOptions) this._refreshGraphFilterOptions();
            if(this._initGraph) setTimeout(() => this._initGraph(), 80);
        }
        return graphs;
    },

    async _ensureLayeredGraphs() {
        if(this._cachedLayeredGraphs) return this._cachedLayeredGraphs;
        try {
            const saved = await DB.get('settings', 'world_layered_graphs');
            if(saved?.graphs) this._cachedLayeredGraphs = saved.graphs;
        } catch(e) {}
        if(this._cachedLayeredGraphs) return this._cachedLayeredGraphs;
        return await this.rebuildLayeredGraphs('ensure', { silent: true });
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ 循环层级核心 (Cycle Layer Core) — NEXUS OS v2.0
    // ═══════════════════════════════════════════════════════════════
    async _ensureCycleCache() {
        if(this._cachedCycles) return;
        const projectId = await this._activeProjectIdForWorld();
        this._cachedCycles = this._filterWorldProjectRows(await DB.getAll('cycles') || [], projectId);
    },

    // 根据章节号计算循环ID
    getCycleIdForChapter(chapterNum, cycleSize = 5) {
        if(!chapterNum || chapterNum < 1) return null;
        const cycleNum = Math.ceil(chapterNum / cycleSize);
        const start = (cycleNum - 1) * cycleSize + 1;
        const end = cycleNum * cycleSize;
        return { cycleId: `cycle_${start}_${end}`, cycleNum, start, end };
    },

    // 查询章节所属循环对象
    async getCycleForChapter(chapterNum) {
        await this._ensureCycleCache();
        if(!this._cachedCycles || !this._cachedCycles.length) return null;
        // 先精确匹配
        const exact = this._cachedCycles.find(c => chapterNum >= c.startChapter && chapterNum <= c.endChapter);
        if(exact) return exact;
        // 模糊匹配：找包含该章号的
        return this._cachedCycles.find(c => c.chapterIds && c.chapterIds.includes('ch_' + chapterNum)) || null;
    },

    // ★ 核心同步接口：融合拆书调用此接口写入循环数据
    async syncCycle(cycleData) {
        if(!cycleData || !cycleData.id) { console.warn('[WorldEngine] syncCycle: invalid data'); return; }
        await this._ensureCycleCache();
        // 去重：先删除同ID旧数据
        try { await DB.del('cycles', cycleData.id); } catch(e) {}
        const payload = {
            ...cycleData,
            updatedAt: Date.now(),
            entityNames: cycleData.entityNames || [],
            chapterIds: cycleData.chapterIds || [],
            nexusCHR: cycleData.nexusCHR || [],
            nexusWLD: cycleData.nexusWLD || [],
            nexusFOE: cycleData.nexusFOE || [],
            nexusEMO: cycleData.nexusEMO || [],
            patterns: cycleData.patterns || []
        };
        await DB.put('cycles', payload);
        // 刷新缓存
        this._cachedCycles = null;
        await this._ensureCycleCache();
        // 同步更新实体 cycles 字段
        if(cycleData.entityNames && cycleData.entityNames.length) {
            await this._ensureCache();
            for(const entName of cycleData.entityNames) {
                const ent = (this._cachedEntities || []).find(e => e.name === entName);
                if(ent) {
                    if(!ent.cycles) ent.cycles = [];
                    if(!ent.cycles.includes(cycleData.id)) {
                        ent.cycles.push(cycleData.id);
                        ent.updatedAt = Date.now();
                        await DB.put('entities', ent);
                    }
                }
            }
            this._cachedEntities = null;
        }
        await this.rebuildLayeredGraphs('cycle_sync', { silent: true });
        UI.toast(`[世界引擎] 循环 ${cycleData.startChapter}-${cycleData.endChapter} 已同步 (${cycleData.entityNames?.length||0}实体)`);
    },

    // 获取循环纯文本上下文（供writer.js使用）
    async getCycleContext(chapterNum, opts = {}) {
        const { maxLen = 4000 } = opts;
        const cycle = await this.getCycleForChapter(chapterNum);
        if(!cycle) return '';
        let ctx = `[NEXUS循环上下文 | 第${cycle.startChapter}-${cycle.endChapter}章]\n`;
        if(cycle.fusionEssence) ctx += `【技法精华】\n${cycle.fusionEssence.slice(0, 1200)}\n\n`;
        if(cycle.rhythmFormula) ctx += `【节奏公式】${cycle.rhythmFormula.slice(0, 400)}\n\n`;
        if(cycle.emotionCurve) ctx += `【情绪曲线】${cycle.emotionCurve.slice(0, 400)}\n\n`;
        if(cycle.patterns && cycle.patterns.length) {
            ctx += `【零件库】\n`;
            cycle.patterns.slice(0, 5).forEach((p, i) => { ctx += `${i+1}. ${p.name}: ${(p.desc||'').slice(0,80)}\n`; });
            ctx += '\n';
        }
        // 四状态机
        if(cycle.nexusCHR && cycle.nexusCHR.length) {
            ctx += `【角色约束】\n`;
            cycle.nexusCHR.forEach(c => { ctx += `• ${c.name}: ${c.status||c.to} ${c.constraint||''}\n`; });
        }
        if(cycle.nexusFOE && cycle.nexusFOE.length) {
            ctx += `【伏笔预警】\n`;
            cycle.nexusFOE.filter(f => f.status !== 'S3废弃').forEach(f => {
                ctx += `• ${f.desc.slice(0,60)} [${f.status}]${f.planRecycle ? ' 回收点:'+f.planRecycle : ''}\n`;
            });
        }
        return ctx.slice(0, maxLen);
    },

    // 构建NEXUS四状态机快照（供writer.js注入）
    async buildNexusSnapshot(chapterNum) {
        const cycle = await this.getCycleForChapter(chapterNum);
        const snapshot = { chr:'', wld:'', foe:'', emo:'' };
        if(!cycle) return snapshot;
        // CHR
        if(cycle.nexusCHR && cycle.nexusCHR.length) {
            snapshot.chr = cycle.nexusCHR.map(c => `${c.name}=${c.status||c.to}`).join('; ');
        }
        // WLD
        if(cycle.nexusWLD && cycle.nexusWLD.length) {
            snapshot.wld = cycle.nexusWLD.map(w => `${w.desc||w.ruleId}=${w.to}`).join('; ');
        }
        // FOE
        if(cycle.nexusFOE && cycle.nexusFOE.length) {
            const active = cycle.nexusFOE.filter(f => f.status !== 'S3废弃');
            snapshot.foe = active.map(f => `${f.desc.slice(0,30)}[${f.status}]`).join('; ');
        }
        // EMO
        if(cycle.nexusEMO && cycle.nexusEMO.length) {
            const current = cycle.nexusEMO.find(e => e.chapter == chapterNum);
            snapshot.emo = current ? `${current.word}(${current.score})` : `avg:${Math.round(cycle.nexusEMO.reduce((a,b)=>a+(b.score||0),0)/cycle.nexusEMO.length)}`;
        }
        return snapshot;
    },

    render: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;
        const tabs = [
            {id:'entities', icon:'fa-boxes-stacked', text:'实体管理', color:'text-amber-400'},
            {id:'inject', icon:'fa-syringe', text:'注入中心', color:'text-green-400'},
            {id:'pipeline_overview', icon:'fa-rocket', text:'流水线概览', color:'text-red-400'},
            {id:'world', icon:'fa-earth-americas', text:'世界观构建', color:'text-blue-400'},
            {id:'graph', icon:'fa-circle-nodes', text:'知识图谱', color:'text-purple-400'},
            {id:'vectors', icon:'fa-database', text:'向量数据库', color:'text-cyan-400'}
        ];
        const FB = Modules.fusion_book;
        const hasPipeline = FB && FB._pipelineResults && Object.keys(FB._pipelineResults).length > 0;
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <div class="w-64 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white text-sm shadow-lg shadow-amber-500/20"><i class="fa-solid fa-atom"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">世界引擎</div>
                            <div class="text-[10px] text-dim">世界观 · 导入解析 · 实体归档</div>
                        </div>
                    </div>
                </div>
                <!-- 四大板块导航 -->
                <div class="p-2 space-y-1 border-b border-white/5">
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('dashboard')">
                        <i class="fa-solid fa-gauge-high text-cyan-400 w-5 text-center"></i>
                        <span>总览仪表盘</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='world' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('world')">
                        <i class="fa-solid fa-earth-americas text-blue-400 w-5 text-center"></i>
                        <span>世界观</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-world-progress">0/7</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='entities' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('entities')">
                        <i class="fa-solid fa-users text-amber-400 w-5 text-center"></i>
                        <span>角色与实体</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-ent-count">0</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='graph' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('graph')">
                        <i class="fa-solid fa-circle-nodes text-purple-400 w-5 text-center"></i>
                        <span>关系与图谱</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='pipeline_overview' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('pipeline_overview')">
                        <i class="fa-solid fa-rocket text-red-400 w-5 text-center"></i>
                        <span>融合数据</span>
                        ${hasPipeline ? '<span class="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : ''}
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='narrative_consistency' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('narrative_consistency')">
                        <i class="fa-solid fa-shield-halved text-emerald-400 w-5 text-center"></i>
                        <span>叙事一致性</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-consistency-badge">监控中</span>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto" id="we-sub-panel">
                    ${we._renderSubPanel()}
                </div>
                <div class="p-3 border-t border-white/5 bg-[#0a0a0c] space-y-2">
                    ${Modules.world_engine.renderExportMenu ? Modules.world_engine.renderExportMenu('一键导出工程', true, 'up') : `<button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full font-bold" onclick="Modules.world_engine.exportAll()"><i class="fa-solid fa-download mr-1"></i>一键导出工程</button>`}
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 flex-1" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col min-w-0" id="we-workspace">
                ${we._renderWorkspace()}
            </div>
        </div>`;
    },

    switchTab: (tab) => {
        Modules.world_engine.currentTab = tab;
        const view = document.getElementById('module-view-world_engine');
        if(view) view.innerHTML = Modules.world_engine.render();
        if(tab === 'dashboard') Modules.world_engine._refreshDashboard();
        if(tab === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(tab === 'entities') Modules.world_engine._refreshEntities();
        if(tab === 'vectors') Modules.world_engine._refreshVectors();
        if(tab === 'world') Modules.world_engine._loadWorldCat();
        if(tab === 'inject') Modules.world_engine._refreshInjectPreview();
        if(tab === 'narrative_consistency') Modules.world_engine._refreshNarrativeConsistency();
    },

    init: async () => {
        await Modules.world_engine._ensureCache();
        const t = Modules.world_engine.currentTab;
        if(!t || t === 'dashboard') Modules.world_engine._refreshDashboard();
        if(t === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(t === 'entities') Modules.world_engine._refreshEntities();
        if(t === 'vectors') Modules.world_engine._refreshVectors();
    },

    onShow: async () => {
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine._cachedLayeredGraphs = null;
        await Modules.world_engine._ensureCache();
        const t = Modules.world_engine.currentTab;
        await Modules.world_engine._refreshDashboard?.();
        if(t === 'graph') {
            await Modules.world_engine.rebuildLayeredGraphs?.('world_on_show', { silent: true });
            setTimeout(() => Modules.world_engine._initGraph?.(), 100);
        }
        if(t === 'entities') Modules.world_engine._refreshEntities();
        if(t === 'vectors') Modules.world_engine._refreshVectors();
        if(t === 'world') Modules.world_engine._loadWorldCat();
        if(t === 'narrative_consistency') Modules.world_engine._refreshNarrativeConsistency();
    },

    _renderSubPanel: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;

        // === 仪表盘：快速入口 ===
        if(t === 'dashboard') {
            return `<div class="p-2 space-y-2">
                <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">快速操作</div>
                <button class="btn btn-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观</button>
                <button class="btn btn-xs bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._openNovelImportModal()"><i class="fa-solid fa-book mr-1"></i>导入新书/续写</button>
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔台</button>
                <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰流</button>
                <div class="border-t border-white/5 pt-2 mt-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">数据流转</div>
                    <div class="text-[9px] text-gray-500 space-y-1">
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-cyan-400"></i> 拆书 → 提取技法</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-amber-400"></i> 导入 → 拆细纲 → 入图谱</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-green-400"></i> 世界引擎 → 执笔台</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-purple-400"></i> 实体 → 知识图谱</div>
                    </div>
                </div>
            </div>`;
        }

        // === 世界观板块 ===
        if(t === 'world') {
            const cats = [
                {id:'history', icon:'fa-scroll', label:'历史与传说', color:'text-yellow-500'},
                {id:'geography', icon:'fa-map', label:'地理与地貌', color:'text-green-500'},
                {id:'magic', icon:'fa-wand-sparkles', label:'魔法/科技体系', color:'text-purple-500'},
                {id:'factions', icon:'fa-flag', label:'势力与组织', color:'text-red-500'},
                {id:'species', icon:'fa-dragon', label:'种族与生物', color:'text-orange-500'},
                {id:'rules', icon:'fa-gavel', label:'世界规则', color:'text-blue-500'},
                {id:'culture', icon:'fa-masks-theater', label:'文化与习俗', color:'text-pink-500'}
            ];
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观设定</button>
                <button class="btn btn-xs bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._openNovelImportModal()"><i class="fa-solid fa-book mr-1"></i>导入新书/续写</button>
                <div class="border-t border-white/5 pt-2 mt-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1.5">七大维度</div>
                </div>
                <div class="space-y-1">${cats.map(c => `
                    <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we.worldCat===c.id ? 'bg-blue-500/10 text-white border border-blue-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.worldCat='${c.id}';Modules.world_engine.switchTab('world')">
                        <i class="fa-solid ${c.icon} ${c.color} w-4 text-center text-[10px]"></i>
                        <span>${c.label}</span>
                    </button>
                `).join('')}</div>
            </div>`;
        }

        // === 角色实体板块 ===
        if(t === 'entities') {
            return `
                <div class="p-2 space-y-2">
                    <div class="flex gap-1">
                        ${['all','pipeline','manual'].map(f => {
                            const labels = {all:'全部', pipeline:'流水线', manual:'手动'};
                            const active = we._entityFilter === f;
                            return `<button class="flex-1 text-[9px] py-1 rounded font-bold transition-all ${active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-dim border border-transparent hover:bg-white/10'}" onclick="Modules.world_engine._entityFilter='${f}';Modules.world_engine._typeFilter='';Modules.world_engine._refreshEntities()">${labels[f]}</button>`;
                        }).join('')}
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${['人物','物品','地点','势力','魔法','情节'].map(tp => {
                            const active = we._typeFilter === tp;
                            return `<button class="text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/3 text-dim border border-transparent hover:bg-white/5'}" onclick="Modules.world_engine._typeFilter='${active ? '' : tp}';Modules.world_engine._entityFilter='all';Modules.world_engine._refreshEntities()">${tp}</button>`;
                        }).join('')}
                    </div>
                    <div id="we-entity-list" class="space-y-1 max-h-[300px] overflow-y-auto"><div class="text-[10px] text-dim p-2">加载中...</div></div>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine._addEntity()"><i class="fa-solid fa-plus mr-1"></i>新建实体</button>
                </div>`;
        }

        // === 关系图谱板块 ===
        if(t === 'graph') {
            const graphs = we._cachedLayeredGraphs || { volumes: [], cycles: [] };
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine.rebuildLayeredGraphs('manual_refresh')"><i class="fa-solid fa-circle-nodes mr-1"></i>刷新3D图谱</button>
                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-database mr-1"></i>刷新RAG上下文</button>
                <div class="border-t border-white/5 pt-2">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">筛选</div>
                    <select id="we-graph-layer-filter" class="w-full text-[9px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim mb-1" onchange="Modules.world_engine._graphLayerFilter=this.value;Modules.world_engine._initGraph()">
                        <option value="volume" ${we._graphLayerFilter === 'volume' ? 'selected' : ''}>按卷查看</option>
                        <option value="cycle" ${we._graphLayerFilter === 'cycle' ? 'selected' : ''}>按循环查看（拆书）</option>
                    </select>
                    <select id="we-graph-volume-filter" class="w-full text-[9px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim mb-1" onchange="Modules.world_engine._graphVolumeFilter=this.value;Modules.world_engine._graphLayerFilter='volume';Modules.world_engine._initGraph()">
                        <option value="auto">自动选择有效卷</option>
                        ${(graphs.volumes || []).map(g => `<option value="${g.scopeId}" ${we._graphVolumeFilter === g.scopeId ? 'selected' : ''}>${g.title} · ${g.entityIds?.length || 0}实体</option>`).join('')}
                    </select>
                    <select id="we-graph-cycle-filter" class="w-full text-[9px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim" onchange="Modules.world_engine._graphCycleFilter=this.value;Modules.world_engine._graphLayerFilter='cycle';Modules.world_engine._initGraph()">
                        <option value="auto">自动选择有效循环</option>
                        ${(graphs.cycles || []).map(g => `<option value="${g.scopeId}" ${we._graphCycleFilter === g.scopeId ? 'selected' : ''}>${g.title} · ${g.entityIds?.length || 0}实体</option>`).join('')}
                    </select>
                    <div class="text-[9px] text-gray-500 leading-relaxed mt-2">有章节、有实体就绘制；无匹配时自动退回全局有效实体。</div>
                </div>
                <div class="border-t border-white/5 pt-2">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">图例</div>
                    <div class="grid grid-cols-2 gap-1 text-[9px] text-gray-400">
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-500"></span>人物</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>物品</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>地点</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>情节</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span>伏笔</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span>势力</div>
                    </div>
                </div>
            </div>`;
        }

        // === 融合数据板块 ===
        if(t === 'pipeline_overview') {
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 w-full" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>深度提取实体</button>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
                <div class="border-t border-white/5 pt-2 space-y-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">注入中心</div>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔台</button>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰流</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine.injectToRAG()"><i class="fa-solid fa-database mr-1"></i>注入RAG</button>
                </div>
            </div>`;
        }

        return '';
    },

    _renderWorkspace: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;

        // === 仪表盘 ===
        if(t === 'dashboard' || !t) return we._renderDashboard();

        if(t === 'entities') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体详情编辑器</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine._saveEntity()"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>保存并同步向量库</button>
                </div>
            </div>
            <div class="flex-1 p-6 overflow-y-auto space-y-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">实体名称</span>
                        <input id="we-ent-name" class="input bg-black/30 border-white/10 focus:border-amber-500 font-bold text-lg text-white" placeholder="角色/物品/地点名称">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">类型</span>
	                        <select id="we-ent-type" class="input bg-black/30 border-white/10 text-white"><option>人物</option><option>物品</option><option>地点</option><option>情节</option><option>伏笔</option><option>势力</option><option>种族</option><option>能力</option><option>魔法</option><option>世界规则</option><option>文化</option><option>历史</option></select>
                    </div>
                </div>
                <div id="we-ent-source-badge"></div>
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-dim font-bold uppercase">分配章节</span>
                    <div class="flex flex-wrap gap-2 p-2 bg-black/20 rounded-lg border border-white/5" id="we-ent-chapters">
                        ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => {
                            return `<label class="flex items-center gap-1 text-[9px] text-dim cursor-pointer hover:text-white"><input type="checkbox" class="accent-cyan-500 we-ent-chapter-check" data-chapter-id="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</label>`;
                        }).join('')}
                    </div>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-dim font-bold uppercase">详细描述 (自动嵌入向量库)</span>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiExpandEntity()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 扩写</button>
                    </div>
                    <textarea id="we-ent-desc" class="textarea flex-1 bg-black/30 border-white/10 focus:border-amber-500 resize-none text-gray-300 leading-relaxed min-h-[300px]" placeholder="在此输入详细描述。保存后将自动同步到向量数据库用于 RAG 检索..."></textarea>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-dim font-bold uppercase">关联实体 (逗号分隔，支持 关系:实体名 格式)</span>
                    <input id="we-ent-relations" class="input bg-black/30 border-white/10 text-sm text-gray-300" placeholder="例如：师父:张三, 敌对:魔教, 所属:青云门">
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-500/10 text-red-400 flex-1" onclick="Modules.world_engine._deleteEntity()"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._entityToLib()"><i class="fa-solid fa-book-open mr-1"></i>存阅读</button>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 flex-1" onclick="Modules.world_engine._injectEntityToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 flex-1" onclick="Modules.world_engine._injectEntityToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔</button>
                </div>
            </div>`;

        if(t === 'inject') return we._renderInjectCenter();
        if(t === 'pipeline_overview') return we._renderPipelineOverview();

        if(t === 'world') {
            const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
            return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-blue-400"><i class="fa-solid fa-earth-americas mr-1"></i>${catLabels[we.worldCat] || '世界观'}</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiGenWorld()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 生成</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._saveWorld()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex-1 p-0 min-h-0">
                <textarea id="we-world-editor" class="w-full h-full bg-transparent border-none resize-none font-mono text-gray-300 leading-loose focus:outline-none text-sm p-6" placeholder="# ${catLabels[we.worldCat]}\n\n在此详细描述..."></textarea>
            </div>`;
        }

        if(t === 'graph') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-purple-400"><i class="fa-solid fa-circle-nodes mr-1"></i>知识图谱 · 3D网络结构</span>
                    <span class="text-[10px] text-dim" id="we-graph-stats"></span>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-rotate mr-1"></i>刷新RAG上下文</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._injectGraphToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._injectGraphToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportGraph()"><i class="fa-solid fa-book-open mr-1"></i>导出到阅读</button>
                </div>
            </div>
	            <div class="flex-1 relative min-h-[620px]">
	                <div id="we-graph-canvas" class="w-full h-full min-h-[620px]" style="background:#08080a; min-height:620px;"></div>
                <div class="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 p-3 text-[10px] space-y-1 z-10" id="we-graph-info">
                    <div class="text-purple-400 font-bold text-xs mb-1" id="we-graph-scope-title">图谱统计</div>
                    <div class="text-dim">节点数: <span class="text-white font-bold" id="we-g-nodes">0</span></div>
                    <div class="text-dim">连线数: <span class="text-white font-bold" id="we-g-edges">0</span></div>
                    <div class="text-dim">范围: <span class="text-white/80" id="we-g-scope">自动</span></div>
                    <div class="text-dim mt-1 text-[9px]">拖拽旋转 | 滚轮缩放 | 点击聚焦</div>
                </div>
                <div class="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 p-3 text-[9px] space-y-1 z-10">
                    <div class="text-dim font-bold text-[10px] mb-1">节点类型颜色</div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span><span class="text-dim">人物</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span class="text-dim">物品</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span><span class="text-dim">地点</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span><span class="text-dim">情节</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span class="text-dim">伏笔</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span class="text-dim">势力</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span class="text-dim">种族</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span><span class="text-dim">能力</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span class="text-dim">魔法</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span><span class="text-dim">规则</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span><span class="text-dim">文化</span></div>
	                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span class="text-dim">历史</span></div>
	                    </div>
                </div>
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 z-10">
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" onclick="Modules.world_engine._graphResetView()"><i class="fa-solid fa-crosshairs mr-1"></i>重置视角</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-physics-btn" onclick="Modules.world_engine._graphTogglePhysics()"><i class="fa-solid fa-atom mr-1"></i>物理模拟 (开启)</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-labels-btn" onclick="Modules.world_engine._graphToggleLabels()"><i class="fa-solid fa-tag mr-1"></i>显示标签</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-rotate-btn" onclick="Modules.world_engine._graphToggleRotate()"><i class="fa-solid fa-rotate mr-1"></i>自动旋转 (关闭)</button>
                </div>
            </div>`;

        if(t === 'narrative_consistency') return Modules.world_engine._renderNarrativeConsistency();

        if(t === 'vectors') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-database mr-1"></i>向量数据库浏览器</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllVectors()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshVectors()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
            </div>
            <div class="flex-1 overflow-auto min-h-0">
                <div class="grid grid-cols-12 gap-4 p-4 text-[10px] text-dim font-bold uppercase border-b border-white/5">
                    <span class="col-span-2">ID</span><span class="col-span-8">向量内容预览</span><span class="col-span-2 text-right">维度</span>
                </div>
                <div id="we-vec-list" class="p-2 space-y-1 font-mono text-xs"></div>
            </div>`;

        return `<div class="flex-1 flex items-center justify-center text-dim text-sm">选择左侧标签</div>`;
    },

    // ═══ 注入中心 ═══
    _renderInjectCenter: () => {
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-green-400"><i class="fa-solid fa-syringe mr-1"></i>注入中心 — 数据中转枢纽</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/15 text-red-400 border-red-600/20 hover:bg-red-600/30" onclick="document.getElementById('we-inject-preview').value='';document.getElementById('we-inject-stats').textContent='0 字'"><i class="fa-solid fa-trash-can mr-1"></i>清除</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Utils.copy(document.getElementById('we-inject-preview').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._refreshInjectPreview()"><i class="fa-solid fa-rotate mr-1"></i>刷新预览</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                    <div class="px-4 py-2 bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                        <span class="text-[10px] text-green-400 font-bold uppercase">注入包预览</span>
                        <span class="text-[9px] text-dim font-mono" id="we-inject-stats">0 字</span>
                    </div>
                    <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-xs text-gray-300 resize-none leading-relaxed focus:outline-none overflow-y-auto" id="we-inject-preview" readonly placeholder="勾选左侧数据源后点击刷新预览..."></textarea>
                </div>
                <div class="w-72 shrink-0 flex flex-col p-4 space-y-3 overflow-y-auto">
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider">快速注入目标</div>
                    <div class="p-3 rounded-lg bg-orange-900/10 border border-orange-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-fire text-orange-400"></i><span class="text-[11px] font-bold text-orange-300">凤凰创作流</span></div>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-arrow-right mr-1"></i>注入凤凰流</button>
                    </div>
                    <div class="p-3 rounded-lg bg-blue-900/10 border border-blue-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-feather-pointed text-blue-400"></i><span class="text-[11px] font-bold text-blue-300">长篇执笔台</span></div>
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-arrow-right mr-1"></i>注入执笔台</button>
                    </div>
                    <div class="p-3 rounded-lg bg-cyan-900/10 border border-cyan-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-database text-cyan-400"></i><span class="text-[11px] font-bold text-cyan-300">RAG上下文</span></div>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine.injectToRAG()"><i class="fa-solid fa-arrow-right mr-1"></i>注入RAG</button>
                    </div>
                    <div class="p-3 rounded-lg bg-white/3 border border-white/5 space-y-1">
                        <div class="text-[9px] text-dim font-bold uppercase">当前数据统计</div>
                        <div class="grid grid-cols-2 gap-2 text-center">
                            <div><div class="text-sm font-bold text-amber-400" id="we-inj-ent-count">0</div><div class="text-[8px] text-dim">实体</div></div>
                            <div><div class="text-sm font-bold text-blue-400" id="we-inj-world-count">0</div><div class="text-[8px] text-dim">世界观</div></div>
                            <div><div class="text-sm font-bold text-green-400" id="we-inj-fusion-ok">—</div><div class="text-[8px] text-dim">融合数据</div></div>
                            <div><div class="text-sm font-bold text-red-400" id="we-inj-pipeline-ok">—</div><div class="text-[8px] text-dim">流水线</div></div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async _refreshInjectPreview() {
        await this._ensureCache();
        const opts = {
            includeEntities: (document.getElementById('we-inj-entities') || {}).checked !== false,
            includeWorld: (document.getElementById('we-inj-world') || {}).checked !== false,
            includeFusion: (document.getElementById('we-inj-fusion') || {}).checked !== false,
            includePipeline: (document.getElementById('we-inj-pipeline') || {}).checked === true,
            maxLen: 8000
        };
        const pkg = this.buildInjectPackage(opts);
        const el = document.getElementById('we-inject-preview');
        if(el) el.value = pkg || '（无数据）';
        const stats = document.getElementById('we-inject-stats');
        if(stats) stats.textContent = (pkg||'').length + ' 字';
        const entities = (this._cachedEntities || []).filter(e => this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e));
        const worlds = (this._cachedEntities || []).filter(e => this._isWorldEntity(e) && e.desc);
        const FB = Modules.fusion_book;
        const hasFusion = FB && ((FB._allPipelineResults||{}).fusion || (FB._pipelineResults||{}).fusion);
        const hasPipeline = FB && FB._pipelineResults && Object.keys(FB._pipelineResults).length > 0;
        const ec = document.getElementById('we-inj-ent-count'); if(ec) ec.textContent = entities.length;
        const wc = document.getElementById('we-inj-world-count'); if(wc) wc.textContent = worlds.length;
        const fc = document.getElementById('we-inj-fusion-ok'); if(fc) fc.textContent = hasFusion ? '✓' : '—';
        const pc = document.getElementById('we-inj-pipeline-ok'); if(pc) pc.textContent = hasPipeline ? '✓' : '—';
    },

    // ═══ 注入操作 ═══
    async injectToPhoenix() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:6000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(Modules.phoenix) {
            Modules.phoenix.data.worldContext = pkg;
            UI.toast('已注入凤凰创作流 (' + pkg.length + '字)');
        } else { UI.toast('凤凰创作流未加载'); }
    },

    // ═══ 叙事一致性监控中心 ═══
    _renderNarrativeConsistency: () => {
        return `
        <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
            <span class="text-xs font-bold text-emerald-400"><i class="fa-solid fa-shield-halved mr-1"></i>叙事一致性监控中心</span>
            <div class="flex gap-2">
                <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.world_engine._refreshNarrativeConsistency()"><i class="fa-solid fa-rotate mr-1"></i>刷新状态</button>
                <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._syncConsistencyToFusion()"><i class="fa-solid fa-arrows-rotate mr-1"></i>同步到融合拆书</button>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="we-consistency-container">
            <!-- 顶部统计栏 -->
            <div class="grid grid-cols-4 gap-3">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">实体总数</div>
                    <div class="text-2xl font-bold text-amber-400 mt-1" id="we-cs-ent-total">-</div>
                    <div class="text-[9px] text-dim mt-0.5" id="we-cs-ent-breakdown">-</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">待回收伏笔</div>
                    <div class="text-2xl font-bold text-red-400 mt-1" id="we-cs-pending-fs">-</div>
                    <div class="text-[9px] text-dim mt-0.5">未回收悬念</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">已回收伏笔</div>
                    <div class="text-2xl font-bold text-green-400 mt-1" id="we-cs-resolved-fs">-</div>
                    <div class="text-[9px] text-dim mt-0.5">悬念回收率</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">情绪均值</div>
                    <div class="text-2xl font-bold text-cyan-400 mt-1" id="we-cs-emo-avg">-</div>
                    <div class="text-[9px] text-dim mt-0.5">跨章情绪走势</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <!-- 左侧：伏笔追踪器 -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white"><i class="fa-solid fa-magnifying-glass-chart mr-1 text-purple-400"></i>伏笔追踪器</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._showAddForeshadowingModal()"><i class="fa-solid fa-plus mr-1"></i>手动添加</button>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span>待回收伏笔
                            <span class="ml-auto text-red-400" id="we-cs-pending-count">0</span>
                        </div>
                        <div id="we-cs-pending-list" class="space-y-1.5 max-h-48 overflow-y-auto">
                            <div class="text-[10px] text-dim italic">加载中...</div>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500"></span>已回收伏笔
                            <span class="ml-auto text-green-400" id="we-cs-resolved-count">0</span>
                        </div>
                        <div id="we-cs-resolved-list" class="space-y-1.5 max-h-36 overflow-y-auto">
                            <div class="text-[10px] text-dim italic">加载中...</div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：情绪弧线 -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white"><i class="fa-solid fa-chart-line mr-1 text-cyan-400"></i>情绪弧线</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._showAddEmotionModal()"><i class="fa-solid fa-plus mr-1"></i>手动记录</button>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3">
                        <div id="we-cs-emotion-chart" style="width:100%;height:220px;"></div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider">情绪异常预警</div>
                        <div id="we-cs-emo-alerts" class="space-y-1">
                            <div class="text-[10px] text-dim italic">分析中...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部：世界观维度速览 + 实体一致性检查 -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                    <div class="text-xs font-bold text-white"><i class="fa-solid fa-globe mr-1 text-blue-400"></i>世界观维度完成度</div>
                    <div id="we-cs-world-dims" class="space-y-1.5">
                        <div class="text-[10px] text-dim italic">加载中...</div>
                    </div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                    <div class="text-xs font-bold text-white"><i class="fa-solid fa-triangle-exclamation mr-1 text-amber-400"></i>一致性检查</div>
                    <div id="we-cs-conflicts" class="space-y-1.5">
                        <div class="text-[10px] text-dim italic">扫描中...</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async injectToWriter() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:5000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '\n\n' : '') + '[世界引擎注入]\n' + pkg;
            UI.toast('已注入执笔台大纲 (' + pkg.length + '字)');
        } else { UI.toast('请先打开执笔台并选择章节'); }
    },
    async injectToRAG() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:8000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument('世界引擎注入包_' + Date.now(), pkg, 'world_engine');
            UI.toast('已注入RAG上下文 (' + pkg.length + '字)');
        } else { UI.toast('RAG系统未加载'); }
    },
    _injectEntityToPhoenix() {
        const name = (document.getElementById('we-ent-name') || {}).value;
        const type = (document.getElementById('we-ent-type') || {}).value;
        const desc = (document.getElementById('we-ent-desc') || {}).value;
        if(!name || !desc) return UI.toast('实体为空');
        const text = `[${type}] ${name}: ${desc}`;
        if(Modules.phoenix) {
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n' + text;
            UI.toast('已注入凤凰流: ' + name);
        }
    },
    _injectEntityToWriter() {
        const name = (document.getElementById('we-ent-name') || {}).value;
        const type = (document.getElementById('we-ent-type') || {}).value;
        const desc = (document.getElementById('we-ent-desc') || {}).value;
        if(!name || !desc) return UI.toast('实体为空');
        const ol = document.getElementById('w-outline');
        if(ol) { ol.value = (ol.value ? ol.value + '\n' : '') + `[${type}] ${name}: ${desc}`; UI.toast('已注入执笔台: ' + name); }
        else UI.toast('请先打开执笔台');
    },

    // ═══ 流水线概览 ═══
    _renderPipelineOverview: () => {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const pr = {};
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            pr[k] = (allPr[k] && allPr[k].trim()) ? allPr[k] : (curPr[k] || '');
        });
        const hasData = Object.keys(pr).some(k => pr[k]);
        const labels = { left:'左书拆解弹药', right:'右书拆解弹药', compare:'技法对比', fusion:'融合弹药', world:'入世界', outline:'细纲', write:'正文' };
        const colors = { left:'blue', right:'pink', compare:'amber', fusion:'green', world:'cyan', outline:'orange', write:'purple' };
        const icons = { left:'fa-a', right:'fa-b', compare:'fa-scale-balanced', fusion:'fa-wand-magic-sparkles', world:'fa-atom', outline:'fa-feather-pointed', write:'fa-pen-nib' };

        if(!hasData) return `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex center mx-auto mb-4"><i class="fa-solid fa-rocket text-2xl text-red-400/50"></i></div>
                    <div class="text-sm text-dim mb-2">暂无拆书弹药数据</div>
                    <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                </div>
            </div>`;

        const steps = Object.keys(pr).filter(k => pr[k]);
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-box-open mr-1"></i>拆书弹药概览 (${steps.length}项)</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportPipelineAll()"><i class="fa-solid fa-book-open mr-1"></i>全部存阅读</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取实体</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-52 shrink-0 bg-[#0d0d0f] border-r border-white/5 overflow-y-auto p-2 space-y-1">
                    ${steps.map(key => `
                        <button class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] font-bold transition-all hover:bg-white/5 border border-transparent hover:border-white/10 text-${colors[key]||'white'}-400" onclick="Modules.world_engine._viewPipelineStep('${key}')" id="we-pp-btn-${key}">
                            <i class="fa-solid ${icons[key]||'fa-circle'} w-4 text-center text-[10px]"></i>
                            <span class="flex-1 truncate">${labels[key]||key}</span>
                            <span class="text-[9px] text-dim">${pr[key].length}字</span>
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="h-9 flex items-center px-4 bg-black/30 border-b border-white/5 shrink-0">
                        <span class="text-[10px] font-bold text-dim uppercase" id="we-pp-title">选择左侧步骤查看</span>
                        <button class="btn btn-xs bg-white/5 text-dim ml-auto" onclick="Utils.copy(document.getElementById('we-pp-content').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-5 font-mono text-sm leading-relaxed text-gray-300 resize-none focus:outline-none" id="we-pp-content" readonly placeholder="选择左侧步骤查看流水线结果..."></textarea>
                </div>
            </div>`;
    },
};
