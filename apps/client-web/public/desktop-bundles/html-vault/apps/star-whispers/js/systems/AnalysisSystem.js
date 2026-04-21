export class AnalysisSystem {
    constructor(eventBus, store) {
        this.eventBus = eventBus;
        this.store = store;
        
        this.constellations = [
            '白羊座', '金牛座', '双子座', '巨蟹座', 
            '狮子座', '处女座', '天秤座', '天蝎座', 
            '射手座', '摩羯座', '水瓶座', '双鱼座'
        ];
        
        this.eventBus.on('save-profile', this.handleProfileSave.bind(this));
    }

    getConstellations() {
        return this.constellations;
    }

    handleProfileSave(profileData) {
        // profileData: { constellation: string, personalityType: string }
        console.log('Saving profile:', profileData);
        
        this.store.updateUser({
            constellation: profileData.constellation,
            personality: profileData.personalityType || 'Unknown'
        });
        
        // 档案设置完成，进入聊天
        this.eventBus.emit('navigate', 'chat');
        
        // 触发欢迎语
        setTimeout(() => {
            const user = this.store.getState().user;
            const welcomeMsg = this.getWelcomeMessage(user);
            this.eventBus.emit('new-message', {
                sender: 'ai',
                text: welcomeMsg,
                timestamp: new Date()
            });
        }, 500);
    }

    getWelcomeMessage(user) {
        const { ageGroup, constellation } = user;
        if (ageGroup === 'kids') {
            return `你好呀！我是你的新朋友。听说你是${constellation}的小朋友，太酷了！我们要不要一起画画？`;
        } else if (ageGroup === 'teen') {
            return `Hey！很高兴认识你。${constellation}的朋友通常很有想法，最近学校里有什么有趣的事吗？`;
        } else {
            return `你好。作为${constellation}，你可能最近在思考很多关于未来的事情。我是来倾听的，随时可以开始。`;
        }
    }
}