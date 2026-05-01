class DungeonSpireApp {
    constructor() {
        this.selectedChar = null;
        this.selectedPortrait = null;
        this.selectedDifficulty = 'normal';
        this.gameState = null;
        this.draggingCard = null;
        this.selectedCardIndex = null;
        this.currentDevice = 'auto'; // auto, mobile, tablet, pc
        this.settings = {
            screenShake: true,
            damageNumbers: true,
            soundEnabled: true
        };
        this.sounds = {};
        this.initSounds();
        this.initDeviceSwitcher();
    }

    // 初始化设备切换器
    initDeviceSwitcher() {
        // 自动检测设备
        this.detectDevice();
        
        // 绑定切换按钮
        const switcher = document.getElementById('device-switcher');
        if (switcher) {
            switcher.querySelectorAll('.device-btn').forEach(btn => {
                btn.onclick = () => {
                    const device = btn.dataset.device;
                    this.setDevice(device);
                    
                    // 更新按钮状态
                    switcher.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // 保存设置
                    localStorage.setItem('dungeonspire_device', device);
                };
            });
            
            // 恢复保存的设置
            const savedDevice = localStorage.getItem('dungeonspire_device');
            if (savedDevice) {
                this.setDevice(savedDevice);
                switcher.querySelectorAll('.device-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.device === savedDevice);
                });
            }
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (this.currentDevice === 'auto') {
                this.detectDevice();
            }
        });
    }

    // 自动检测设备类型
    detectDevice() {
        const width = window.innerWidth;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        let device = 'pc';
        if (width <= 480 || (isTouchDevice && width <= 768)) {
            device = 'mobile';
        } else if (width <= 1024 || isTouchDevice) {
            device = 'tablet';
        }
        
        if (this.currentDevice === 'auto') {
            this.applyDeviceClass(device);
        }
    }

    // 设置设备模式
    setDevice(device) {
        this.currentDevice = device;
        this.applyDeviceClass(device);
    }

    // 应用设备样式类
    applyDeviceClass(device) {
        document.body.classList.remove('device-mobile', 'device-tablet', 'device-pc');
        document.body.classList.add('device-' + device);
        
        // 更新移动端楼层显示
        this.updateMobileFloorInfo();
    }

    // 更新移动端楼层信息
    updateMobileFloorInfo() {
        const floorMobile = document.getElementById('floor-num-mobile');
        const levelMobile = document.getElementById('player-level-mobile');
        
        if (this.gameState) {
            if (floorMobile) floorMobile.textContent = this.gameState.floor;
            if (levelMobile) levelMobile.textContent = this.gameState.level;
        }
    }

    // 初始化音效（使用Web Audio API生成简单音效）
    initSounds() {
        this.audioCtx = null;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { console.log('Audio not supported'); }
    }

    // 播放音效
    playSound(type) {
        if (!this.settings.soundEnabled || !this.audioCtx) return;
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        switch(type) {
            case 'cardPickup':
                osc.frequency.value = 400;
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.1);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
                break;
            case 'cardPlay':
                osc.frequency.value = 600;
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.15);
                break;
            case 'attack':
                osc.type = 'sawtooth';
                osc.frequency.value = 150;
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
                break;
            case 'block':
                osc.type = 'square';
                osc.frequency.value = 300;
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.15);
                break;
            case 'heal':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.3);
                break;
            case 'victory':
                osc.frequency.setValueAtTime(523, ctx.currentTime);
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
                osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.5);
                break;
            case 'damage':
                osc.type = 'sawtooth';
                osc.frequency.value = 100;
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.08);
                break;
            case 'levelUp':
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1);
                osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.5);
                break;
        }
    }

    async init() {
        console.log('[DungeonSpire] Starting init...');
        try {
            // 加载进度条动画
            for (let p of [20, 50, 80, 100]) {
                const progressEl = document.getElementById('loading-progress');
                if (progressEl) {
                    progressEl.style.width = p + '%';
                }
                await new Promise(r => setTimeout(r, 200));
            }
            
            console.log('[DungeonSpire] Binding events...');
            this.bind();
            
            console.log('[DungeonSpire] Initializing chat panel...');
            this.initChatPanel();
            
            console.log('[DungeonSpire] Showing main menu...');
            this.show('main-menu');
            
            console.log('[DungeonSpire] Init complete!');
        } catch (error) {
            console.error('[DungeonSpire] Init error:', error);
            // 即使出错也尝试显示主菜单
            try {
                this.show('main-menu');
            } catch (e) {
                console.error('[DungeonSpire] Failed to show main-menu:', e);
                // 最后的备用方案：直接操作 DOM
                const loadingScreen = document.getElementById('loading-screen');
                const mainMenu = document.getElementById('main-menu');
                if (loadingScreen) {
                    loadingScreen.classList.remove('active');
                    loadingScreen.classList.add('hidden');
                }
                if (mainMenu) {
                    mainMenu.classList.remove('hidden');
                    mainMenu.classList.add('active');
                }
            }
        }
    }

    // 初始化聊天面板
    initChatPanel() {
        try {
            if (typeof ChatPanelComponent !== 'undefined') {
                this.chatPanel = new ChatPanelComponent({
                    onSendMessage: async (npcId, message) => {
                        // 这里可以接入真实的 LLM 服务
                        // 目前使用组件内置的模拟回复
                        return null;
                    }
                });
            }
        } catch (error) {
            console.error('ChatPanel init error:', error);
        }
    }

    show(id) {
        console.log('[DungeonSpire] Showing screen:', id);
        try {
            const screens = document.querySelectorAll('.screen');
            console.log('[DungeonSpire] Found screens:', screens.length);
            
            // 先隐藏所有屏幕
            screens.forEach(s => {
                s.classList.remove('active');
                s.classList.add('hidden');
            });
            
            // 显示目标屏幕
            const el = document.getElementById(id);
            console.log('[DungeonSpire] Target element:', el);
            if (el) { 
                el.classList.remove('hidden'); 
                el.classList.add('active'); 
                console.log('[DungeonSpire] Element classes after:', el.className);
            } else {
                console.error('[DungeonSpire] Screen not found:', id);
            }
            
            // 游戏中隐藏设备切换器
            if (id === 'game-view') {
                document.body.classList.add('in-game');
            } else {
                document.body.classList.remove('in-game');
            }
        } catch (error) {
            console.error('[DungeonSpire] show() error:', error);
        }
    }

    bind() {
        const $ = id => document.getElementById(id);
        
        try {
            // 主菜单按钮
            const btnStart = $('btn-start');
            if (btnStart) btnStart.onclick = () => this.show('character-select');
            
            const btnCompendium = $('btn-compendium');
            if (btnCompendium) btnCompendium.onclick = () => { this.show('compendium'); this.loadComp(); };
            
            const btnOptions = $('btn-options');
            if (btnOptions) btnOptions.onclick = () => this.show('options-screen');
            
            const btnCredits = $('btn-credits');
            if (btnCredits) btnCredits.onclick = () => this.show('credits-screen');
            
            // 返回按钮
            const btnBackFromChar = $('btn-back-from-char');
            if (btnBackFromChar) btnBackFromChar.onclick = () => this.show('main-menu');
            
            const btnBackFromComp = $('btn-back-from-comp');
            if (btnBackFromComp) btnBackFromComp.onclick = () => this.show('main-menu');
            
            const btnBackFromOptions = $('btn-back-from-options');
            if (btnBackFromOptions) btnBackFromOptions.onclick = () => this.show('main-menu');
            
            const btnBackFromCredits = $('btn-back-from-credits');
            if (btnBackFromCredits) btnBackFromCredits.onclick = () => this.show('main-menu');
            
            const btnBackMenu = $('btn-back-menu');
            if (btnBackMenu) btnBackMenu.onclick = () => { if(confirm('放弃?')) this.show('main-menu'); };
            
            // 游戏按钮
            const btnStartRun = $('btn-start-run');
            if (btnStartRun) btnStartRun.onclick = () => this.startGame();
            
            const btnEndTurn = $('btn-end-turn');
            if (btnEndTurn) btnEndTurn.onclick = () => this.endTurn();
            
            const btnMap = $('btn-map');
            if (btnMap) btnMap.onclick = () => this.showMap();
            
            const btnDeck = $('btn-deck');
            if (btnDeck) btnDeck.onclick = () => this.showDeck();
            
            const btnCloseMap = $('btn-close-map');
            if (btnCloseMap) btnCloseMap.onclick = () => $('map-modal')?.classList.add('hidden');
            
            const btnCloseDeck = $('btn-close-deck');
            if (btnCloseDeck) btnCloseDeck.onclick = () => $('deck-modal')?.classList.add('hidden');
            
            const btnProceed = $('btn-proceed');
            if (btnProceed) btnProceed.onclick = () => this.proceed();
            
            const btnSkipCard = $('btn-skip-card');
            if (btnSkipCard) btnSkipCard.onclick = () => $('card-reward-modal')?.classList.add('hidden');
            
            const btnCloseShop = $('btn-close-shop');
            if (btnCloseShop) btnCloseShop.onclick = () => $('shop-modal')?.classList.add('hidden');
            
            const btnLeaveShop = $('btn-leave-shop');
            if (btnLeaveShop) btnLeaveShop.onclick = () => $('shop-modal')?.classList.add('hidden');
            
            const btnShop = $('btn-shop');
            if (btnShop) btnShop.onclick = () => this.openShopDirect();
            
            const btnCloseCardDetail = $('btn-close-card-detail');
            if (btnCloseCardDetail) btnCloseCardDetail.onclick = () => $('card-detail-modal')?.classList.add('hidden');
        } catch (error) {
            console.error('[DungeonSpire] bind() button error:', error);
        }

        // 角色选择
        document.querySelectorAll('.character-card:not(.locked)').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.character-card').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
                this.selectedChar = c.dataset.char;
                this.loadPortraits(c.dataset.char);
                const btnStartRun = $('btn-start-run');
                if (btnStartRun) btnStartRun.disabled = false;
            };
        });

        // 难度选择
        document.querySelectorAll('input[name="difficulty"]').forEach(r => {
            r.onchange = () => { this.selectedDifficulty = r.value; };
        });

        // 图鉴标签
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                document.querySelectorAll('.comp-tab-content').forEach(x => x.classList.remove('active'));
                document.getElementById('tab-' + b.dataset.tab).classList.add('active');
            };
        });

        // 设置
        if ($('opt-screenshake')) $('opt-screenshake').onchange = (e) => { this.settings.screenShake = e.target.checked; };
        if ($('opt-damage-numbers')) $('opt-damage-numbers').onchange = (e) => { this.settings.damageNumbers = e.target.checked; };
        
        // 设备模式选择
        const deviceSelect = $('opt-device-mode');
        if (deviceSelect) {
            // 恢复保存的设置
            const savedDevice = localStorage.getItem('dungeonspire_device');
            if (savedDevice) {
                deviceSelect.value = savedDevice;
            }
            
            deviceSelect.onchange = (e) => {
                const device = e.target.value;
                if (device === 'auto') {
                    this.currentDevice = 'auto';
                    this.detectDevice();
                } else {
                    this.setDevice(device);
                }
                localStorage.setItem('dungeonspire_device', device);
                
                // 同步更新底部切换器
                const switcher = document.getElementById('device-switcher');
                if (switcher) {
                    switcher.querySelectorAll('.device-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.device === device);
                    });
                }
            };
        }
    }

    // 加载角色头像/皮肤
    loadPortraits(charId) {
        const container = document.getElementById('portrait-grid');
        if (!container) return;
        container.innerHTML = '';
        
        // 筛选该角色的头像
        const portraits = Object.values(GAME_DATA.portraits).filter(p => p.char === charId);
        
        portraits.forEach(p => {
            const el = document.createElement('div');
            el.className = 'portrait-card' + (this.selectedPortrait === p.id ? ' selected' : '');
            el.dataset.portrait = p.id;
            el.style.borderColor = p.color;
            
            // 判断被动类型
            let passiveClass = '';
            if (p.passive) {
                if (p.passive.type === 'berserker' || p.passive.type === 'overcharge' || p.passive.type === 'vampire') {
                    passiveClass = 'mixed';  // 有利有弊
                } else if (p.passive.type === 'glitch' || p.passive.type === 'gambler') {
                    passiveClass = 'mixed';  // 随机
                } else {
                    passiveClass = 'buff';   // 纯增益
                }
            }
            
            el.innerHTML = `
                <div class="portrait-avatar">${p.avatar}</div>
                <div class="portrait-name">${p.name}</div>
                <div class="portrait-desc">${p.desc}</div>
                ${p.passive ? `<div class="portrait-passive ${passiveClass}">⚡ 被动效果</div>` : ''}
            `;
            el.onclick = () => {
                container.querySelectorAll('.portrait-card').forEach(x => x.classList.remove('selected'));
                el.classList.add('selected');
                this.selectedPortrait = p.id;
                this.msg('选择皮肤: ' + p.name);
            };
            container.appendChild(el);
        });
        
        // 默认选中第一个
        if (!this.selectedPortrait || !portraits.find(p => p.id === this.selectedPortrait)) {
            this.selectedPortrait = portraits[0]?.id || null;
            if (container.firstChild) container.firstChild.classList.add('selected');
        }
        
        // 显示头像区域
        const section = document.getElementById('portrait-section');
        if (section) section.classList.remove('hidden');
    }


    startGame() {
        if (!this.selectedChar) return;
        const ch = GAME_DATA.characters[this.selectedChar];
        const diff = GAME_DATA.difficulties[this.selectedDifficulty];
        const portrait = this.selectedPortrait ? GAME_DATA.portraits[this.selectedPortrait] : null;
        
        // 基础属性
        let maxHp = ch.hp;
        let maxEnergy = ch.energy;
        
        // 应用头像被动效果 - 初始修改
        if (portrait && portrait.passive) {
            if (portrait.passive.maxHpReduce) {
                maxHp -= portrait.passive.maxHpReduce;
            }
        }
        
        this.gameState = {
            char: this.selectedChar, 
            portrait: this.selectedPortrait,
            portraitPassive: portrait?.passive || null,
            difficulty: this.selectedDifficulty,
            diffMod: diff,
            hp: maxHp, maxHp: maxHp,
            energy: maxEnergy, maxEnergy: maxEnergy,
            gold: 99, block: 0, floor: 1, act: 1,
            deck: this.starterDeck(), hand: [], draw: [], disc: [],
            relics: [ch.relic], enemies: [],
            buffs: { str: 0, dex: 0, thorns: 0, barricade: false, weak: 0 },
            powers: [],
            potions: [],
            // 经验值系统
            level: 1,
            exp: 0,
            expToLevel: 100,
            cardDraw: 5,  // 每回合抽牌数
            // 头像相关
            firstCardPlayed: false  // 幻影舞者用
        };
        
        // 显示头像
        const portraitIcon = portrait ? portrait.avatar : ch.icon;
        document.getElementById('player-portrait').textContent = portraitIcon;
        document.getElementById('player-sprite').textContent = portraitIcon;
        document.getElementById('player-name').textContent = ch.name + (portrait && portrait.name !== ch.name ? ' - ' + portrait.name : '');
        
        this.show('game-view');
        this.combat();
    }

    starterDeck() {
        const c = this.selectedChar;
        const s = c === 'ironclad' ? 'strike_r' : c === 'silent' ? 'strike_g' : 'strike_b';
        const d = c === 'ironclad' ? 'defend_r' : c === 'silent' ? 'defend_g' : 'defend_b';
        const deck = [];
        for (let i = 0; i < 5; i++) deck.push(s);
        for (let i = 0; i < 4; i++) deck.push(d);
        if (c === 'ironclad') deck.push('bash');
        else if (c === 'silent') { deck.push('neutralize'); deck.push('survivor'); }
        else { deck.push('zap'); deck.push('dualcast'); }
        return deck;
    }

    combat() {
        this.gameState.enemies = this.genEnemies();
        this.showCombatStart();
        this.renderEnemies();
        this.gameState.draw = [...this.gameState.deck];
        this.shuffle(this.gameState.draw);
        this.gameState.disc = [];
        this.gameState.hand = [];
        this.gameState.energy = this.gameState.maxEnergy;
        this.gameState.block = 0;
        this.gameState.target = 0;
        this.gameState.firstCardPlayed = false;
        
        // 头像被动 - 超载核心额外能量
        if (this.gameState.portraitPassive?.type === 'overcharge') {
            this.gameState.energy += this.gameState.portraitPassive.energyBonus;
            this.msg('超载核心: +' + this.gameState.portraitPassive.energyBonus + ' 能量');
        }
        
        if (this.gameState.relics.includes('蛇环')) this.drawCards(2);
        if (this.gameState.relics.includes('船锚')) this.gameState.block = 10;
        setTimeout(() => this.drawCards(this.applyGamblerDraw(5)), 500);
        this.updateUI();
    }

    // 赌徒被动 - 随机抽牌数
    applyGamblerDraw(baseDraw) {
        if (this.gameState.portraitPassive?.type === 'gambler') {
            const roll = Math.random();
            if (roll < this.gameState.portraitPassive.drawChance) {
                this.msg('赌徒: 幸运! +1 抽牌');
                return baseDraw + 1;
            } else if (roll > 1 - this.gameState.portraitPassive.drawChance) {
                this.msg('赌徒: 不幸! -1 抽牌');
                return Math.max(1, baseDraw - 1);
            }
        }
        return baseDraw;
    }

    // 战斗开始动画
    showCombatStart() {
        const overlay = document.createElement('div');
        overlay.className = 'combat-start-overlay';
        overlay.innerHTML = '<div class="combat-start-text">⚔️ 战斗开始!</div>';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1500);
    }

    // 掉落动画
    showLootDrop(icon, callback) {
        const loot = document.createElement('div');
        loot.className = 'loot-drop';
        loot.textContent = icon;
        loot.style.left = (window.innerWidth / 2 - 30) + 'px';
        document.body.appendChild(loot);
        
        setTimeout(() => {
            loot.classList.add('loot-collect');
            setTimeout(() => {
                loot.remove();
                if (callback) callback();
            }, 500);
        }, 1000);
    }

    genEnemies() {
        const act = this.gameState.act;
        const floor = this.gameState.floor;
        const list = Object.entries(GAME_DATA.enemies);
        if (floor % 17 === 0) {
            const b = list.filter(([k,v]) => v.boss && v.act === act);
            const [id, d] = b[Math.floor(Math.random() * b.length)];
            return [this.mkEnemy(id, d)];
        }
        if (floor % 8 === 0) {
            const e = list.filter(([k,v]) => v.elite && v.act === act);
            const [id, d] = e[Math.floor(Math.random() * e.length)];
            return [this.mkEnemy(id, d)];
        }
        const n = list.filter(([k,v]) => v.type === 'normal' && v.act === act);
        const cnt = Math.random() < 0.3 ? 2 : 1;
        const arr = [];
        for (let i = 0; i < cnt; i++) {
            const [id, d] = n[Math.floor(Math.random() * n.length)];
            arr.push(this.mkEnemy(id, d));
        }
        return arr;
    }

    mkEnemy(id, d) {
        const diff = this.gameState.diffMod || { hpMod: 1, dmgMod: 1 };
        let hp = d.hp[0] + Math.floor(Math.random() * (d.hp[1] - d.hp[0] + 1));
        hp = Math.floor(hp * diff.hpMod);
        let dmg = d.damage[0] + Math.floor(Math.random() * (d.damage[1] - d.damage[0] + 1));
        dmg = Math.floor(dmg * diff.dmgMod);
        return { id, name: d.name, icon: d.icon, hp, maxHp: hp,
            dmg: dmg,
            buffs: { str: 0, vul: 0, weak: 0, psn: 0, ritual: d.ritual || 0 },
            boss: d.boss, elite: d.elite };
    }

    renderEnemies() {
        const c = document.getElementById('enemies-container');
        c.innerHTML = '';
        this.gameState.enemies.forEach((e, i) => {
            const el = document.createElement('div');
            const isTarget = this.gameState.target === i;
            el.className = 'enemy' + (e.boss ? ' boss' : '') + (e.elite ? ' elite' : '') + (isTarget ? ' targeted' : '');
            let bf = '';
            if (e.buffs.str > 0) bf += '<span class="buff strength">💪' + e.buffs.str + '</span>';
            if (e.buffs.vul > 0) bf += '<span class="buff vulnerable">💔' + e.buffs.vul + '</span>';
            if (e.buffs.weak > 0) bf += '<span class="buff weak">😵' + e.buffs.weak + '</span>';
            if (e.buffs.psn > 0) bf += '<span class="buff poison">☠️' + e.buffs.psn + '</span>';
            el.innerHTML = '<div class="enemy-intent">🗡️ ' + e.dmg + '</div>' +
                '<div class="enemy-sprite">' + e.icon + '</div>' +
                '<div class="enemy-name">' + e.name + '</div>' +
                '<div class="enemy-buffs">' + bf + '</div>' +
                '<div class="enemy-hp"><div class="hp-bar"><div class="hp-fill" style="width:' + (e.hp/e.maxHp*100) + '%"></div></div><span>' + e.hp + '/' + e.maxHp + '</span></div>' +
                (isTarget ? '<div class="target-indicator">🎯 目标</div>' : '');
            // 点击敌人：如果有选中的卡牌则打出，否则只选中目标
            el.onclick = (ev) => {
                ev.stopPropagation();
                if (this.selectedCardIndex !== null) {
                    // 有选中的卡牌，攻击这个敌人
                    this.gameState.target = i;
                    const cardIdx = this.selectedCardIndex;
                    this.cancelCardSelection();
                    this.playCardAtIndex(cardIdx);
                    this.playSound('cardPlay');
                } else {
                    // 没有选中卡牌时，只选中目标
                    this.gameState.target = i;
                    this.renderEnemies();
                    this.msg('选中目标: ' + e.name);
                }
            };
            // 拖拽放置支持
            el.ondragover = (ev) => {
                ev.preventDefault();
                el.classList.add('drop-target');
            };
            el.ondragleave = () => {
                el.classList.remove('drop-target');
            };
            el.ondrop = (ev) => {
                ev.preventDefault();
                el.classList.remove('drop-target');
                if (this.draggingCard !== null) {
                    this.gameState.target = i;
                    this.playCardAtIndex(this.draggingCard);
                    this.playSound('cardPlay');
                }
            };
            c.appendChild(el);
        });
    }

    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

    drawCards(n) {
        for (let i = 0; i < n; i++) {
            if (this.gameState.draw.length === 0) {
                if (this.gameState.disc.length === 0) break;
                this.gameState.draw = [...this.gameState.disc];
                this.gameState.disc = [];
                this.shuffle(this.gameState.draw);
            }
            const cardId = this.gameState.draw.pop();
            this.gameState.hand.push(cardId);
            
            // 诅咒卡抽到时效果
            const card = GAME_DATA.cards[cardId];
            if (card && card.drawDamage) {
                this.gameState.hp -= card.drawDamage;
                this.showDamageNumber('-' + card.drawDamage, 'damage');
                this.msg('诅咒! ' + card.name + ' 造成 ' + card.drawDamage + ' 伤害');
                this.screenShake();
            }
        }
        this.renderHand();
    }

    renderHand() {
        const c = document.getElementById('hand-container');
        c.innerHTML = '';
        const len = this.gameState.hand.length;
        this.gameState.hand.forEach((cid, i) => {
            const d = GAME_DATA.cards[cid];
            if (!d) return;
            const el = document.createElement('div');
            let cardClass = 'card ' + d.rarity + ' ' + d.type;
            if (d.golden) cardClass += ' golden';
            if (d.curse) cardClass += ' curse';
            el.className = cardClass;
            el.draggable = true;
            el.dataset.index = i;
            
            const ang = (i - (len-1)/2) * Math.min(5, 25/len);
            el.style.transform = 'rotate(' + ang + 'deg)';
            const ico = d.icon || (d.type === 'attack' ? '⚔️' : d.type === 'skill' ? '🛡️' : '✨');
            const ok = d.cost >= 0 && this.gameState.energy >= d.cost && !d.unplayable;
            
            // 卡牌类型边框颜色
            let borderColor = d.type === 'attack' ? '#ef4444' : d.type === 'skill' ? '#3b82f6' : '#f59e0b';
            if (d.golden) borderColor = '#fbbf24';
            if (d.curse) borderColor = '#7c3aed';
            el.style.borderColor = borderColor;
            
            let costDisplay = d.cost >= 0 ? d.cost : '✕';
            el.innerHTML = `
                <div class="card-frame ${d.type}">
                    <div class="card-cost${ok ? '' : ' no'}">${costDisplay}</div>
                    <div class="card-art">${ico}</div>
                    <div class="card-name-plate">
                        <div class="card-name">${d.name}</div>
                    </div>
                    <div class="card-desc-box">
                        <div class="card-desc">${d.desc}</div>
                    </div>
                    <div class="card-type-badge">${d.type === 'attack' ? '攻击' : d.type === 'skill' ? '技能' : '能力'}</div>
                </div>
            `;
            if (!ok) el.classList.add('unplayable');
            
            // 拖拽事件
            el.ondragstart = (e) => this.onCardDragStart(e, i);
            el.ondragend = (e) => this.onCardDragEnd(e);
            // 点击选中卡牌
            el.onclick = (e) => this.onCardClick(e, i);
            c.appendChild(el);
        });
        
        // 点击空白取消选中
        document.getElementById('scene-container').onclick = (e) => {
            if (e.target.id === 'scene-container' || e.target.classList.contains('combat-bg')) {
                this.cancelCardSelection();
            }
        };
    }

    // 卡牌点击 - 选中/取消
    onCardClick(e, idx) {
        e.stopPropagation();
        const cid = this.gameState.hand[idx];
        const d = GAME_DATA.cards[cid];
        if (!d || d.unplayable || d.curse) return;
        if (this.gameState.energy < d.cost) { this.msg("能量不足!"); return; }
        
        // 如果已选中同一张牌，取消选中
        if (this.selectedCardIndex === idx) {
            this.cancelCardSelection();
            return;
        }
        
        // 选中新卡牌
        this.selectedCardIndex = idx;
        this.playSound('cardPickup');
        
        // 更新卡牌显示
        document.querySelectorAll('.card').forEach((c, i) => {
            c.classList.remove('selected');
            if (i === idx) c.classList.add('selected');
        });
        
        // 如果是群体攻击，高亮所有敌人
        if (d.aoe) {
            document.querySelectorAll('.enemy').forEach(el => el.classList.add('aoe-target'));
        } else {
            document.querySelectorAll('.enemy').forEach(el => el.classList.remove('aoe-target'));
        }
        
        // 显示瞄准箭头
        this.showAimArrow(e.target);
    }

    // 取消卡牌选中
    cancelCardSelection() {
        this.selectedCardIndex = null;
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.enemy').forEach(el => el.classList.remove('aoe-target'));
        this.hideAimArrow();
    }

    // 显示瞄准箭头 - 曲线
    showAimArrow(cardEl) {
        const arrow = document.getElementById('aim-arrow');
        const path = document.getElementById('aim-path');
        arrow.classList.remove('hidden');
        
        const cardRect = cardEl.getBoundingClientRect();
        const startX = cardRect.left + cardRect.width / 2;
        const startY = cardRect.top;
        
        // 跟随鼠标画曲线
        const updatePath = (e) => {
            const endX = e.clientX;
            const endY = e.clientY;
            
            // 计算控制点 - 创建弧线效果
            const midX = (startX + endX) / 2;
            const midY = Math.min(startY, endY) - 100; // 控制点在上方
            
            // 二次贝塞尔曲线
            const d = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
            path.setAttribute('d', d);
        };
        
        document.onmousemove = updatePath;
        
        // 初始化一次
        updatePath({ clientX: startX, clientY: startY - 50 });
    }

    // 隐藏瞄准箭头
    hideAimArrow() {
        const arrow = document.getElementById('aim-arrow');
        if (arrow) arrow.classList.add('hidden');
        document.onmousemove = null;
    }

    // 卡牌拖拽开始
    onCardDragStart(e, idx) {
        this.draggingCard = idx;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        
        // 创建拖拽预览
        const preview = e.target.cloneNode(true);
        preview.style.transform = 'rotate(0deg) scale(0.8)';
        preview.style.opacity = '0.8';
        document.body.appendChild(preview);
        e.dataTransfer.setDragImage(preview, 70, 95);
        setTimeout(() => preview.remove(), 0);
        
        this.playSound('cardPickup');
    }

    // 卡牌拖拽结束
    onCardDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggingCard = null;
        document.querySelectorAll('.enemy').forEach(el => el.classList.remove('drop-target'));
    }

    // 打出指定索引的卡牌
    playCardAtIndex(idx) {
        if (idx === null || idx === undefined) return;
        if (idx < 0 || idx >= this.gameState.hand.length) return;
        this.play(idx);
    }


    play(idx) {
        const cid = this.gameState.hand[idx];
        const d = GAME_DATA.cards[cid];
        if (!d) return;
        
        // 诅咒卡不可打出
        if (d.unplayable || d.curse) { 
            this.msg("无法打出此卡!"); 
            return; 
        }
        
        // 幻影舞者 - 第一张牌费用减免
        let actualCost = d.cost;
        if (!this.gameState.firstCardPlayed && this.gameState.portraitPassive?.type === 'phantom') {
            actualCost = Math.max(0, d.cost - this.gameState.portraitPassive.firstCardDiscount);
            if (d.cost > actualCost) this.msg('幻影舞者: 费用 -' + this.gameState.portraitPassive.firstCardDiscount);
        }
        
        if (this.gameState.energy < actualCost) { this.msg("能量不足!"); return; }
        if (this.checkWin()) return;
        
        this.gameState.energy -= actualCost;
        this.gameState.firstCardPlayed = true;
        
        const ti = this.gameState.target || 0;
        let t = this.gameState.enemies.find((e,i) => i === ti && e.hp > 0) || this.gameState.enemies.find(e => e.hp > 0);
        
        // 攻击效果
        if (d.damage && t) {
            let dm = d.damage + this.gameState.buffs.str;
            if (this.gameState.buffs.weak > 0) dm = Math.floor(dm * 0.75);
            const hits = d.hits || 1;
            for (let h = 0; h < hits; h++) {
                if (d.aoe) {
                    this.gameState.enemies.forEach(e => { 
                        if (e.hp > 0) {
                            this.hit(e, dm);
                            this.applyOnHitPassive(e, dm);
                        }
                    });
                } else if (t.hp > 0) {
                    this.hit(t, dm);
                    this.applyOnHitPassive(t, dm);
                }
            }
        }
        
        // 防御效果
        if (d.block) {
            let blk = d.block + (this.gameState.buffs.dex || 0);
            // 护盾协议 - 护甲+20%
            if (this.gameState.portraitPassive?.type === 'shieldProtocol') {
                blk = Math.floor(blk * (1 + this.gameState.portraitPassive.blockBonus));
            }
            this.gameState.block += blk;
            this.showDamageNumber('+' + blk, 'block');
            this.showShieldEffect();
            this.playSound('block');
        }
        
        // 状态效果
        if (d.vulnerable && t) t.buffs.vul = (t.buffs.vul||0) + d.vulnerable;
        if (d.weak && t) t.buffs.weak = (t.buffs.weak||0) + d.weak;
        if (d.poison && t) t.buffs.psn = (t.buffs.psn||0) + d.poison;
        if (d.strength) this.gameState.buffs.str += d.strength;
        if (d.draw) this.drawCards(d.draw);
        if (d.gainEnergy) this.gameState.energy += d.gainEnergy;
        if (d.selfDamage) {
            this.gameState.hp -= d.selfDamage;
            this.showDamageNumber('-' + d.selfDamage, 'damage');
            this.playerHit();
        }
        if (d.heal) {
            const healAmt = Math.min(d.heal, this.gameState.maxHp - this.gameState.hp);
            this.gameState.hp += healAmt;
            this.showDamageNumber('+' + healAmt, 'heal');
            this.showHealEffect();
            this.playSound('heal');
        }
        // 百分比治疗
        if (d.healPercent) {
            const healAmt = Math.floor(this.gameState.maxHp * d.healPercent / 100);
            const actual = Math.min(healAmt, this.gameState.maxHp - this.gameState.hp);
            this.gameState.hp += actual;
            this.showDamageNumber('+' + actual, 'heal');
            this.showHealEffect();
            this.playSound('heal');
        }
        // 吸血效果
        if (d.lifesteal && d.damage && t) {
            const stolen = Math.floor(d.damage * 0.5);
            const actual = Math.min(stolen, this.gameState.maxHp - this.gameState.hp);
            this.gameState.hp += actual;
            this.showDamageNumber('+' + actual, 'heal');
            this.showHealEffect();
        }
        
        // 完全治愈
        if (d.healFull) {
            const healAmt = this.gameState.maxHp - this.gameState.hp;
            this.gameState.hp = this.gameState.maxHp;
            this.showDamageNumber('+' + healAmt, 'heal');
            this.showHealEffect();
            this.playSound('heal');
        }
        
        // 弃掉所有手牌
        if (d.discardAll) {
            this.gameState.disc.push(...this.gameState.hand.filter((c, i) => i !== idx));
            this.gameState.hand = [cid];
        }
        
        // 减少最大生命
        if (d.reduceMaxHp) {
            this.gameState.maxHp -= d.reduceMaxHp;
            this.gameState.hp = Math.min(this.gameState.hp, this.gameState.maxHp);
            this.msg('最大生命 -' + d.reduceMaxHp);
        }
        
        // 自我虚弱
        if (d.selfWeak) {
            this.gameState.buffs.weak = (this.gameState.buffs.weak || 0) + d.selfWeak;
            this.msg('获得 ' + d.selfWeak + ' 虚弱');
        }
        
        // 添加诅咒到牌组
        if (d.addCurse) {
            const curses = Object.keys(GAME_DATA.cards).filter(id => GAME_DATA.cards[id].curse);
            const curse = curses[Math.floor(Math.random() * curses.length)];
            this.gameState.deck.push(curse);
            this.msg('获得诅咒: ' + GAME_DATA.cards[curse].name);
        }
        
        // 每回合治疗能力
        if (d.healPerTurn) {
            this.gameState.powers.push({t:'heal', v: d.healPerTurn});
        }
        if (d.addShivs) for (let i = 0; i < d.addShivs; i++) this.gameState.hand.push('shiv');
        if (d.strengthPerTurn) this.gameState.powers.push({t:'str', v: d.strengthPerTurn});
        if (d.blockPerTurn) this.gameState.powers.push({t:'blk', v: d.blockPerTurn});
        if (d.barricade) this.gameState.buffs.barricade = true;
        
        // 黄金卡获得金币
        if (d.goldGain) {
            this.gameState.gold += d.goldGain;
            this.showDamageNumber('+' + d.goldGain, 'gold');
            this.msg('获得 ' + d.goldGain + ' 金币!');
        }
        
        this.gameState.hand.splice(idx, 1);
        if (!d.exhaust) this.gameState.disc.push(cid);
        
        this.renderHand();
        this.renderEnemies();
        this.updateUI();
        this.checkWin();
    }
    
    checkWin() {
        if (this.gameState.enemies.every(e => e.hp <= 0)) {
            setTimeout(() => this.win(), 500);
            return true;
        }
        return false;
    }

    // 攻击时被动效果
    applyOnHitPassive(enemy, damage) {
        if (!this.gameState.portraitPassive) return;
        
        // 血族领主 - 攻击恢复生命
        if (this.gameState.portraitPassive.type === 'vampire') {
            const heal = this.gameState.portraitPassive.lifestealFlat;
            const actual = Math.min(heal, this.gameState.maxHp - this.gameState.hp);
            if (actual > 0) {
                this.gameState.hp += actual;
                this.showDamageNumber('+' + actual, 'heal');
            }
        }
        
        // 剧毒大师 - 攻击施加中毒
        if (this.gameState.portraitPassive.type === 'poisoner' && enemy.hp > 0) {
            enemy.buffs.psn = (enemy.buffs.psn || 0) + this.gameState.portraitPassive.poisonOnHit;
        }
    }

    hit(e, dm) {
        if (e.buffs.vul > 0) dm = Math.floor(dm * 1.5);
        e.hp = Math.max(0, e.hp - dm);
        this.showDamageNumber('-' + dm, dm >= 15 ? 'crit' : 'damage');
        this.playSound('attack');
        
        // 敌人受击动画
        const enemyEls = document.querySelectorAll('.enemy');
        enemyEls.forEach(el => {
            if (el.querySelector('.enemy-name')?.textContent === e.name) {
                el.classList.add('hit');
                setTimeout(() => el.classList.remove('hit'), 300);
            }
        });
        
        this.screenShake();
    }

    // 屏幕震动效果
    screenShake() {
        if (!this.settings.screenShake) return;
        const scene = document.getElementById('scene-container');
        if (scene) {
            scene.classList.add('screen-shake');
            setTimeout(() => scene.classList.remove('screen-shake'), 500);
        }
    }

    endTurn() {
        if (this.checkWin()) return;
        
        // 诅咒卡回合结束效果
        this.gameState.hand.forEach(cid => {
            const card = GAME_DATA.cards[cid];
            if (card) {
                if (card.endTurnDamage) {
                    this.gameState.hp -= card.endTurnDamage;
                    this.showDamageNumber('-' + card.endTurnDamage, 'damage');
                    this.msg(card.name + ' 诅咒伤害!');
                }
                if (card.endTurnWeak) {
                    this.gameState.buffs.weak = (this.gameState.buffs.weak || 0) + card.endTurnWeak;
                    this.msg(card.name + ' 施加虚弱!');
                }
                if (card.regretDamage) {
                    const regretDmg = this.gameState.hand.length;
                    this.gameState.hp -= regretDmg;
                    this.showDamageNumber('-' + regretDmg, 'damage');
                    this.msg('悔恨造成 ' + regretDmg + ' 伤害!');
                }
            }
        });
        
        // 毒伤
        this.gameState.enemies.forEach(e => {
            if (e.hp > 0 && e.buffs.psn > 0) { 
                e.hp = Math.max(0, e.hp - e.buffs.psn); 
                this.showDamageNumber('-' + e.buffs.psn, 'damage');
                e.buffs.psn--; 
            }
        });
        
        if (this.checkWin()) return;
        
        // 敌人攻击
        this.gameState.enemies.forEach(e => {
            if (e.hp <= 0) return;
            if (e.buffs.ritual > 0) {
                e.buffs.str = (e.buffs.str||0) + e.buffs.ritual;
                this.msg(e.name + ' 力量+' + e.buffs.ritual);
            }
            let dm = e.dmg + (e.buffs.str || 0);
            if (e.buffs.weak > 0) dm = Math.floor(dm * 0.75);
            
            // 狂战士 - 受到伤害增加
            if (this.gameState.portraitPassive?.type === 'berserker') {
                dm = Math.floor(dm * (1 + this.gameState.portraitPassive.damageIncrease));
            }
            
            if (this.gameState.block > 0) { 
                const b = Math.min(this.gameState.block, dm); 
                dm -= b; 
                this.gameState.block -= b;
                if (b > 0) this.showDamageNumber('格挡 ' + b, 'block');
            }
            if (dm > 0) {
                this.gameState.hp = Math.max(0, this.gameState.hp - dm);
                this.showDamageNumber('-' + dm, 'damage');
                this.playerHit();
                if (this.gameState.buffs.thorns > 0) e.hp = Math.max(0, e.hp - this.gameState.buffs.thorns);
            }
        });
        
        // 减少debuff
        this.gameState.enemies.forEach(e => { 
            if (e.buffs.vul > 0) e.buffs.vul--; 
            if (e.buffs.weak > 0) e.buffs.weak--; 
        });
        if (this.gameState.buffs.weak > 0) this.gameState.buffs.weak--;
        
        // 弃牌
        this.gameState.disc.push(...this.gameState.hand);
        this.gameState.hand = [];
        
        // 护甲
        if (!this.gameState.buffs.barricade) this.gameState.block = 0;
        
        // 新回合
        this.gameState.energy = this.gameState.maxEnergy;
        this.gameState.firstCardPlayed = false;  // 重置幻影舞者
        
        // 头像被动 - 回合开始效果
        this.applyTurnStartPassive();
        
        // 能力效果
        this.gameState.powers.forEach(p => {
            if (p.t === 'str') { this.gameState.buffs.str += p.v; this.msg('力量+' + p.v); }
            if (p.t === 'blk') { 
                this.gameState.block += p.v; 
                this.showDamageNumber('+' + p.v, 'block');
            }
            if (p.t === 'heal') {
                const healAmt = Math.min(p.v, this.gameState.maxHp - this.gameState.hp);
                if (healAmt > 0) {
                    this.gameState.hp += healAmt;
                    this.showDamageNumber('+' + healAmt, 'heal');
                    this.showHealEffect();
                }
            }
        });
        
        // 更新敌人意图
        this.gameState.enemies.forEach(e => { 
            if (e.hp > 0) e.dmg = GAME_DATA.enemies[e.id].damage[0] + Math.floor(Math.random() * 5); 
        });
        
        this.drawCards(this.applyGamblerDraw(this.gameState.cardDraw || 5));
        this.renderEnemies();
        this.updateUI();
        
        // 头像被动 - 回合结束效果
        this.applyTurnEndPassive();
        
        if (this.gameState.hp <= 0) setTimeout(() => this.lose(), 500);
    }

    // 回合开始被动效果
    applyTurnStartPassive() {
        if (!this.gameState.portraitPassive) return;
        
        // 狂战士 - 每回合+1力量
        if (this.gameState.portraitPassive.type === 'berserker') {
            this.gameState.buffs.str += this.gameState.portraitPassive.strPerTurn;
            this.msg('狂战士: 力量 +' + this.gameState.portraitPassive.strPerTurn);
        }
        
        // 守护者 - 每回合+护甲
        if (this.gameState.portraitPassive.type === 'guardian') {
            this.gameState.block += this.gameState.portraitPassive.blockPerTurn;
            this.showDamageNumber('+' + this.gameState.portraitPassive.blockPerTurn, 'block');
            this.msg('守护者: 护甲 +' + this.gameState.portraitPassive.blockPerTurn);
        }
        
        // 超载核心 - 额外能量
        if (this.gameState.portraitPassive.type === 'overcharge') {
            this.gameState.energy += this.gameState.portraitPassive.energyBonus;
        }
        
        // 故障体 - 随机buff/debuff
        if (this.gameState.portraitPassive.type === 'glitch') {
            this.applyGlitchEffect();
        }
    }

    // 回合结束被动效果
    applyTurnEndPassive() {
        if (!this.gameState.portraitPassive) return;
        
        // 超载核心 - 自伤
        if (this.gameState.portraitPassive.type === 'overcharge') {
            this.gameState.hp -= this.gameState.portraitPassive.selfDamage;
            this.showDamageNumber('-' + this.gameState.portraitPassive.selfDamage, 'damage');
            this.msg('超载核心: 自伤 ' + this.gameState.portraitPassive.selfDamage);
        }
    }

    // 故障体随机效果
    applyGlitchEffect() {
        const effects = [
            { type: 'buff', name: '力量+1', apply: () => { this.gameState.buffs.str += 1; } },
            { type: 'buff', name: '护甲+5', apply: () => { this.gameState.block += 5; } },
            { type: 'buff', name: '能量+1', apply: () => { this.gameState.energy += 1; } },
            { type: 'buff', name: '抽1牌', apply: () => { this.drawCards(1); } },
            { type: 'debuff', name: '虚弱+1', apply: () => { this.gameState.buffs.weak += 1; } },
            { type: 'debuff', name: '失去3生命', apply: () => { this.gameState.hp -= 3; } },
            { type: 'debuff', name: '能量-1', apply: () => { this.gameState.energy = Math.max(0, this.gameState.energy - 1); } }
        ];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        effect.apply();
        const icon = effect.type === 'buff' ? '✨' : '💀';
        this.msg('故障体: ' + icon + ' ' + effect.name);
    }

    // 玩家受击动画
    playerHit() {
        const avatar = document.getElementById('player-avatar');
        if (avatar) {
            avatar.classList.add('hit');
            setTimeout(() => avatar.classList.remove('hit'), 400);
        }
        this.screenShake();
        this.playSound('damage');
    }

    // 护盾效果
    showShieldEffect() {
        const avatar = document.getElementById('player-avatar');
        if (!avatar) return;
        const shield = document.createElement('div');
        shield.className = 'shield-effect';
        shield.innerHTML = '🛡️';
        avatar.appendChild(shield);
        setTimeout(() => shield.remove(), 800);
    }

    // 治疗效果
    showHealEffect() {
        const avatar = document.getElementById('player-avatar');
        if (!avatar) return;
        const heal = document.createElement('div');
        heal.className = 'heal-effect';
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('span');
            particle.textContent = '✨';
            particle.style.animationDelay = (i * 0.1) + 's';
            particle.style.left = (20 + Math.random() * 60) + '%';
            heal.appendChild(particle);
        }
        avatar.appendChild(heal);
        setTimeout(() => heal.remove(), 1000);
    }

    // 攻击连线效果
    showAttackLine(fromEl, toEl) {
        const line = document.createElement('div');
        line.className = 'attack-line';
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const angle = Math.atan2(toRect.top - fromRect.top, toRect.left - fromRect.left);
        const distance = Math.sqrt(Math.pow(toRect.left - fromRect.left, 2) + Math.pow(toRect.top - fromRect.top, 2));
        line.style.width = distance + 'px';
        line.style.left = fromRect.left + fromRect.width/2 + 'px';
        line.style.top = fromRect.top + fromRect.height/2 + 'px';
        line.style.transform = 'rotate(' + angle + 'rad)';
        document.body.appendChild(line);
        setTimeout(() => line.remove(), 300);
    }

    win() {
        this.msg("🎉 胜利!");
        this.showVictoryEffect();
        this.playSound('victory');
        
        // 计算经验值
        let expGain = 0;
        this.gameState.enemies.forEach(e => {
            if (e.boss) expGain += 100;
            else if (e.elite) expGain += 50;
            else expGain += 20;
        });
        this.gainExp(expGain);
        
        if (this.gameState.relics.includes('燃烧之血')) {
            this.gameState.hp = Math.min(this.gameState.maxHp, this.gameState.hp + 6);
            this.showDamageNumber('+6', 'heal');
            this.showHealEffect();
        }
        setTimeout(() => this.rewards(), 1000);
    }

    // 获得经验值
    gainExp(amount) {
        this.gameState.exp += amount;
        this.showDamageNumber('+' + amount + ' EXP', 'exp');
        
        // 检查升级
        while (this.gameState.exp >= this.gameState.expToLevel) {
            this.gameState.exp -= this.gameState.expToLevel;
            this.gameState.level++;
            this.gameState.expToLevel = Math.floor(this.gameState.expToLevel * 1.5);
            this.levelUp();
        }
        
        this.updateUI();
    }

    // 升级
    levelUp() {
        this.playSound('levelUp');
        this.showLevelUpEffect();
        
        // 显示升级奖励选择
        setTimeout(() => this.showLevelRewards(), 1500);
    }

    // 升级特效
    showLevelUpEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        document.body.appendChild(overlay);
        
        const text = document.createElement('div');
        text.className = 'level-up-text';
        text.textContent = '⬆️ 升级! Lv.' + this.gameState.level;
        document.body.appendChild(text);
        
        setTimeout(() => {
            overlay.remove();
            text.remove();
        }, 1500);
    }

    // 显示升级奖励选择
    showLevelRewards() {
        const rewards = [
            { id: 'maxHp', icon: '❤️', name: '生命上限 +10', desc: '永久增加最大生命值' },
            { id: 'energy', icon: '⚡', name: '能量上限 +1', desc: '每回合获得更多能量' },
            { id: 'draw', icon: '🎴', name: '抽牌 +1', desc: '每回合多抽一张牌' },
            { id: 'strength', icon: '💪', name: '力量 +1', desc: '永久增加攻击力' },
            { id: 'card', icon: '✨', name: '稀有卡牌', desc: '获得一张稀有卡牌' },
            { id: 'gold', icon: '💰', name: '金币 +50', desc: '获得50金币' }
        ];
        
        // 随机选3个
        const shuffled = rewards.sort(() => Math.random() - 0.5).slice(0, 3);
        
        const modal = document.createElement('div');
        modal.className = 'level-reward-modal';
        modal.innerHTML = `
            <div class="level-reward-content">
                <div class="level-reward-title">🎉 升级奖励 - 选择一项</div>
                <div class="level-rewards">
                    ${shuffled.map(r => `
                        <div class="level-reward-option" data-reward="${r.id}">
                            <div class="level-reward-icon">${r.icon}</div>
                            <div class="level-reward-name">${r.name}</div>
                            <div class="level-reward-desc">${r.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定点击事件
        modal.querySelectorAll('.level-reward-option').forEach(opt => {
            opt.onclick = () => {
                this.applyLevelReward(opt.dataset.reward);
                modal.remove();
            };
        });
    }

    // 应用升级奖励
    applyLevelReward(rewardId) {
        switch(rewardId) {
            case 'maxHp':
                this.gameState.maxHp += 10;
                this.gameState.hp += 10;
                this.msg('最大生命 +10!');
                break;
            case 'energy':
                this.gameState.maxEnergy += 1;
                this.msg('能量上限 +1!');
                break;
            case 'draw':
                this.gameState.cardDraw += 1;
                this.msg('每回合抽牌 +1!');
                break;
            case 'strength':
                this.gameState.buffs.str += 1;
                this.msg('力量 +1!');
                break;
            case 'card':
                this.rareCardReward();
                break;
            case 'gold':
                this.gameState.gold += 50;
                this.showDamageNumber('+50', 'gold');
                this.msg('金币 +50!');
                break;
        }
        this.updateUI();
    }

    // 稀有卡牌奖励
    rareCardReward() {
        const rareCards = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            return c.rarity === 'rare' && (c.char === this.gameState.char || c.char === 'colorless');
        });
        const cid = rareCards[Math.floor(Math.random() * rareCards.length)];
        this.gameState.deck.push(cid);
        this.msg('获得稀有卡牌: ' + GAME_DATA.cards[cid].name);
    }

    // 胜利特效
    showVictoryEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1000);
    }

    lose() {
        this.msg("💀 战败");
        setTimeout(() => { alert('游戏结束! 第' + this.gameState.floor + '层'); this.show('main-menu'); }, 1500);
    }

    rewards() {
        const diff = this.gameState.diffMod || { goldMod: 1 };
        const g = Math.floor((15 + Math.floor(Math.random() * 10) + this.gameState.floor * 2) * diff.goldMod);
        
        // 掉落动画
        this.showLootDrop('💰', () => {
            this.gameState.gold += g;
            this.showDamageNumber('+' + g, 'gold');
            
            // 黄金神像遗物
            if (this.gameState.relics.includes('黄金神像')) {
                this.gameState.gold += 25;
                this.msg('黄金神像 +25 金币!');
            }
            
            let html = '<div class="reward-item"><span class="reward-icon">💰</span><span>' + g + ' 金币</span></div>' +
                '<div class="reward-item" onclick="app.cardReward()"><span class="reward-icon">🎴</span><span>选择卡牌</span></div>';
            
            // 有几率获得黄金卡
            if (Math.random() < 0.1) {
                html += '<div class="reward-item" onclick="app.goldenCardReward()"><span class="reward-icon">✨</span><span>黄金卡牌!</span></div>';
            }
            
            // 有几率获得药水
            if (Math.random() < 0.4) {
                html += '<div class="reward-item" onclick="app.potionReward()"><span class="reward-icon">🧪</span><span>药水</span></div>';
            }
            
            // 有几率进入商店
            if (Math.random() < 0.25) {
                html += '<div class="reward-item" onclick="app.openShop()"><span class="reward-icon">🏪</span><span>神秘商人出现!</span></div>';
            }
            
            // 精英/Boss额外奖励
            if (this.gameState.enemies.some(e => e.elite || e.boss)) {
                html += '<div class="reward-item" onclick="app.relicReward()"><span class="reward-icon">💎</span><span>遗物</span></div>';
            }
            
            document.getElementById('reward-list').innerHTML = html;
            document.getElementById('reward-modal').classList.remove('hidden');
            this.updateUI();
        });
    }

    // 药水奖励
    potionReward() {
        const potions = Object.entries(GAME_DATA.potions);
        const [pid, potion] = potions[Math.floor(Math.random() * potions.length)];
        this.gameState.potions = this.gameState.potions || [];
        this.gameState.potions.push(pid);
        this.msg('获得药水: ' + potion.name);
        this.showLootDrop(potion.icon);
    }

    // 黄金卡奖励
    goldenCardReward() {
        document.getElementById('reward-modal').classList.add('hidden');
        const goldenCards = Object.keys(GAME_DATA.cards).filter(id => GAME_DATA.cards[id].golden);
        const ct = document.getElementById('card-choices');
        ct.innerHTML = '';
        
        const cid = goldenCards[Math.floor(Math.random() * goldenCards.length)];
        const d = GAME_DATA.cards[cid];
        const el = document.createElement('div');
        el.className = 'card golden';
        el.innerHTML = '<div class="card-cost">' + d.cost + '</div><div class="card-icon">' + (d.icon || '✨') + '</div><div class="card-name">' + d.name + '</div><div class="card-desc">' + d.desc + '</div>';
        el.onclick = () => { 
            this.gameState.deck.push(cid); 
            this.msg('获得黄金卡: ' + d.name); 
            document.getElementById('card-reward-modal').classList.add('hidden'); 
        };
        ct.appendChild(el);
        
        document.getElementById('card-reward-modal').classList.remove('hidden');
    }

    // 遗物奖励
    relicReward() {
        const relicPool = Object.entries(GAME_DATA.relics).filter(([id, r]) => 
            !this.gameState.relics.includes(r.name) && r.rarity !== 'starter'
        );
        if (relicPool.length === 0) { this.msg('没有更多遗物了'); return; }
        
        const [rid, relic] = relicPool[Math.floor(Math.random() * relicPool.length)];
        this.gameState.relics.push(relic.name);
        this.msg('获得遗物: ' + relic.name);
        
        // 更新遗物显示
        const relicsBar = document.getElementById('relics-container');
        const relicEl = document.createElement('div');
        relicEl.className = 'relic';
        relicEl.title = relic.name + ': ' + relic.desc;
        relicEl.textContent = relic.icon;
        relicsBar.appendChild(relicEl);
    }

    openShop() {
        document.getElementById('reward-modal').classList.add('hidden');
        document.getElementById('shop-gold').textContent = this.gameState.gold;
        this.renderShop();
        document.getElementById('shop-modal').classList.remove('hidden');
    }

    // 从顶部栏直接打开商店
    openShopDirect() {
        if (!this.gameState) { this.msg('请先开始游戏!'); return; }
        document.getElementById('shop-gold').textContent = this.gameState.gold;
        this.renderShop();
        document.getElementById('shop-modal').classList.remove('hidden');
    }

    renderShop() {
        // 卡牌
        const cardsEl = document.getElementById('shop-cards');
        cardsEl.innerHTML = '';
        const cardPool = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            return (c.char === this.gameState.char || c.char === 'colorless') && 
                   c.rarity !== 'basic' && c.rarity !== 'special' && c.rarity !== 'curse';
        });
        
        for (let i = 0; i < 5; i++) {
            const cid = cardPool[Math.floor(Math.random() * cardPool.length)];
            const c = GAME_DATA.cards[cid];
            let price = c.rarity === 'common' ? 50 : c.rarity === 'uncommon' ? 75 : c.rarity === 'rare' ? 150 : c.golden ? 200 : 100;
            
            const el = document.createElement('div');
            el.className = 'shop-item' + (c.golden ? ' golden' : '');
            el.innerHTML = '<div class="item-icon">' + (c.icon || '🎴') + '</div>' +
                '<div class="item-name">' + c.name + '</div>' +
                '<div class="item-price' + (price > this.gameState.gold ? ' expensive' : '') + '">' + price + ' 💰</div>';
            el.onclick = () => this.buyCard(cid, price, el);
            cardsEl.appendChild(el);
        }
        
        // 遗物
        const relicsEl = document.getElementById('shop-relics');
        relicsEl.innerHTML = '';
        const relicPool = Object.keys(GAME_DATA.relics).filter(id => {
            const r = GAME_DATA.relics[id];
            return r.price > 0 && !this.gameState.relics.includes(r.name);
        });
        
        for (let i = 0; i < 3 && i < relicPool.length; i++) {
            const rid = relicPool[Math.floor(Math.random() * relicPool.length)];
            const r = GAME_DATA.relics[rid];
            
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.innerHTML = '<div class="item-icon">' + r.icon + '</div>' +
                '<div class="item-name">' + r.name + '</div>' +
                '<div class="item-price' + (r.price > this.gameState.gold ? ' expensive' : '') + '">' + r.price + ' 💰</div>';
            el.onclick = () => this.buyRelic(rid, r.price, el);
            relicsEl.appendChild(el);
        }
        
        // 药水
        const potionsEl = document.getElementById('shop-potions');
        potionsEl.innerHTML = '';
        Object.entries(GAME_DATA.potions).slice(0, 4).forEach(([pid, p]) => {
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.innerHTML = '<div class="item-icon">' + p.icon + '</div>' +
                '<div class="item-name">' + p.name + '</div>' +
                '<div class="item-price' + (p.price > this.gameState.gold ? ' expensive' : '') + '">' + p.price + ' 💰</div>';
            el.onclick = () => this.buyPotion(pid, p.price, el);
            potionsEl.appendChild(el);
        });
        
        // 服务
        const servicesEl = document.getElementById('shop-services');
        servicesEl.innerHTML = '';
        Object.entries(GAME_DATA.shopItems).forEach(([sid, s]) => {
            if (s.type === 'service') {
                const el = document.createElement('div');
                el.className = 'shop-item';
                el.innerHTML = '<div class="item-icon">' + s.icon + '</div>' +
                    '<div class="item-name">' + s.name + '</div>' +
                    '<div class="item-price' + (s.price > this.gameState.gold ? ' expensive' : '') + '">' + s.price + ' 💰</div>';
                el.onclick = () => this.buyService(sid, s.price, el);
                servicesEl.appendChild(el);
            }
        });
    }

    buyCard(cid, price, el) {
        if (this.gameState.gold < price) { this.msg('金币不足!'); return; }
        this.gameState.gold -= price;
        this.gameState.deck.push(cid);
        el.classList.add('sold');
        this.msg('购买成功: ' + GAME_DATA.cards[cid].name);
        document.getElementById('shop-gold').textContent = this.gameState.gold;
        this.showDamageNumber('-' + price, 'gold');
    }

    buyRelic(rid, price, el) {
        if (this.gameState.gold < price) { this.msg('金币不足!'); return; }
        this.gameState.gold -= price;
        this.gameState.relics.push(GAME_DATA.relics[rid].name);
        el.classList.add('sold');
        this.msg('购买成功: ' + GAME_DATA.relics[rid].name);
        document.getElementById('shop-gold').textContent = this.gameState.gold;
    }

    buyPotion(pid, price, el) {
        if (this.gameState.gold < price) { this.msg('金币不足!'); return; }
        this.gameState.gold -= price;
        this.gameState.potions = this.gameState.potions || [];
        this.gameState.potions.push(pid);
        el.classList.add('sold');
        this.msg('购买成功: ' + GAME_DATA.potions[pid].name);
        document.getElementById('shop-gold').textContent = this.gameState.gold;
    }

    buyService(sid, price, el) {
        if (this.gameState.gold < price) { this.msg('金币不足!'); return; }
        const s = GAME_DATA.shopItems[sid];
        
        if (sid === 'remove_card' && this.gameState.deck.length > 0) {
            const idx = Math.floor(Math.random() * this.gameState.deck.length);
            const removed = this.gameState.deck.splice(idx, 1)[0];
            this.msg('移除了: ' + GAME_DATA.cards[removed].name);
        } else if (sid === 'transform_card' && this.gameState.deck.length > 0) {
            const idx = Math.floor(Math.random() * this.gameState.deck.length);
            const cards = Object.keys(GAME_DATA.cards).filter(id => GAME_DATA.cards[id].rarity !== 'curse');
            this.gameState.deck[idx] = cards[Math.floor(Math.random() * cards.length)];
            this.msg('卡牌已转化!');
        }
        
        this.gameState.gold -= price;
        document.getElementById('shop-gold').textContent = this.gameState.gold;
    }

    showDamageNumber(text, type) {
        if (!this.settings.damageNumbers) return;
        const el = document.createElement('div');
        el.className = 'damage-number ' + (type || '');
        el.textContent = text;
        // 随机位置偏移
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 50;
        el.style.left = (window.innerWidth / 2 + offsetX) + 'px';
        el.style.top = (window.innerHeight / 2 + offsetY) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    cardReward() {
        document.getElementById('reward-modal').classList.add('hidden');
        const cards = Object.keys(GAME_DATA.cards).filter(id => {
            const c = GAME_DATA.cards[id];
            return (c.char === this.gameState.char || c.char === 'colorless') && 
                   c.rarity !== 'basic' && c.rarity !== 'special' && !c.curse && !c.golden;
        });
        const ct = document.getElementById('card-choices');
        ct.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            let cid;
            // 噩梦难度有几率出现诅咒卡
            if (this.selectedDifficulty === 'nightmare' && Math.random() < 0.15) {
                const curseCards = Object.keys(GAME_DATA.cards).filter(id => GAME_DATA.cards[id].curse);
                cid = curseCards[Math.floor(Math.random() * curseCards.length)];
            } else {
                cid = cards[Math.floor(Math.random() * cards.length)];
            }
            
            const d = GAME_DATA.cards[cid];
            const ico = d.icon || (d.type === 'attack' ? '⚔️' : '🛡️');
            const el = document.createElement('div');
            el.className = 'card ' + d.rarity + (d.curse ? ' curse' : '');
            el.innerHTML = '<div class="card-cost">' + (d.cost >= 0 ? d.cost : '✕') + '</div><div class="card-icon">' + ico + '</div><div class="card-name">' + d.name + '</div><div class="card-desc">' + d.desc + '</div>';
            el.onclick = () => { 
                this.gameState.deck.push(cid); 
                this.msg('获得 ' + d.name); 
                document.getElementById('card-reward-modal').classList.add('hidden'); 
            };
            ct.appendChild(el);
        }
        document.getElementById('card-reward-modal').classList.remove('hidden');
    }

    proceed() {
        document.getElementById('reward-modal').classList.add('hidden');
        this.gameState.floor++;
        this.gameState.powers = [];
        this.combat();
    }

    updateUI() {
        const $ = id => document.getElementById(id);
        $('hp-current').textContent = this.gameState.hp;
        $('hp-max').textContent = this.gameState.maxHp;
        $('player-hp-bar').style.width = (this.gameState.hp / this.gameState.maxHp * 100) + '%';
        $('energy-current').textContent = this.gameState.energy;
        $('energy-max').textContent = this.gameState.maxEnergy;
        $('gold-amount').textContent = this.gameState.gold;
        $('block-amount').textContent = this.gameState.block;
        $('floor-num').textContent = this.gameState.floor;
        $('draw-count').textContent = this.gameState.draw.length;
        $('discard-count').textContent = this.gameState.disc.length;
        
        // 经验值
        if ($('player-level')) $('player-level').textContent = this.gameState.level;
        if ($('exp-current')) $('exp-current').textContent = this.gameState.exp;
        if ($('exp-max')) $('exp-max').textContent = this.gameState.expToLevel;
        if ($('exp-fill')) $('exp-fill').style.width = (this.gameState.exp / this.gameState.expToLevel * 100) + '%';
        
        // 移动端楼层信息
        if ($('floor-num-mobile')) $('floor-num-mobile').textContent = this.gameState.floor;
        if ($('player-level-mobile')) $('player-level-mobile').textContent = this.gameState.level;
        
        const bd = $('player-block-display');
        if (bd) bd.style.opacity = this.gameState.block > 0 ? '1' : '0.3';
        const pb = $('player-buffs');
        if (pb) {
            let buffsHtml = '';
            if (this.gameState.buffs.str > 0) buffsHtml += '<span class="buff strength">💪' + this.gameState.buffs.str + '</span>';
            if (this.gameState.buffs.dex > 0) buffsHtml += '<span class="buff">🏃' + this.gameState.buffs.dex + '</span>';
            if (this.gameState.buffs.weak > 0) buffsHtml += '<span class="buff weak">😵' + this.gameState.buffs.weak + '</span>';
            pb.innerHTML = buffsHtml;
        }
    }

    msg(t) { const m = document.createElement('div'); m.className = 'floating-message'; m.textContent = t; document.body.appendChild(m); setTimeout(() => m.remove(), 1500); }

    showMap() {
        const c = document.getElementById('map-container');
        c.innerHTML = '';
        const ic = ['👹', '❓', '🏪', '🔥', '👺'];
        for (let r = 0; r < 5; r++) {
            const row = document.createElement('div');
            row.className = 'map-row';
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                const n = document.createElement('div');
                n.className = 'map-node';
                n.textContent = r === 4 ? '💀' : ic[Math.floor(Math.random() * ic.length)];
                row.appendChild(n);
            }
            c.appendChild(row);
        }
        document.getElementById('map-modal').classList.remove('hidden');
    }

    showDeck() {
        const c = document.getElementById('deck-cards');
        c.innerHTML = '';
        this.gameState.deck.forEach(cid => {
            const d = GAME_DATA.cards[cid];
            if (!d) return;
            const ico = d.icon || '⚔️';
            const el = document.createElement('div');
            el.className = 'card ' + d.rarity;
            el.innerHTML = '<div class="card-cost">' + d.cost + '</div><div class="card-icon">' + ico + '</div><div class="card-name">' + d.name + '</div>';
            c.appendChild(el);
        });
        document.getElementById('deck-modal').classList.remove('hidden');
    }

    loadComp() {
        const cg = document.getElementById('card-gallery');
        cg.innerHTML = '';
        Object.entries(GAME_DATA.cards).forEach(([id, c]) => {
            const el = document.createElement('div');
            el.className = 'gallery-card';
            el.innerHTML = '<div class="icon">' + (c.icon || '⚔️') + '</div><div class="name">' + c.name + '</div><div class="info">' + c.rarity + '</div>';
            cg.appendChild(el);
        });
        const rg = document.getElementById('relic-gallery');
        rg.innerHTML = '';
        Object.entries(GAME_DATA.relics).forEach(([id, r]) => {
            const el = document.createElement('div');
            el.className = 'gallery-card';
            el.innerHTML = '<div class="icon">' + r.icon + '</div><div class="name">' + r.name + '</div>';
            rg.appendChild(el);
        });
        const eg = document.getElementById('enemy-gallery');
        eg.innerHTML = '';
        Object.entries(GAME_DATA.enemies).forEach(([id, e]) => {
            const el = document.createElement('div');
            el.className = 'gallery-card';
            el.innerHTML = '<div class="icon">' + e.icon + '</div><div class="name">' + e.name + '</div>';
            eg.appendChild(el);
        });
        const evg = document.getElementById('event-gallery');
        evg.innerHTML = '';
        GAME_DATA.events.forEach(e => {
            const el = document.createElement('div');
            el.className = 'gallery-card';
            el.innerHTML = '<div class="icon">' + e.icon + '</div><div class="name">' + e.name + '</div>';
            evg.appendChild(el);
        });
    }
}

const app = new DungeonSpireApp();
document.addEventListener('DOMContentLoaded', () => app.init());
