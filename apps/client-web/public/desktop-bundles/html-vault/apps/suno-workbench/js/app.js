import { db } from './db.js';
import { apiClient, sunoPrompts } from './api.js';
import { instruments, quickPrompts, structureTemplates, moodTags, genreTags, instrumentTags, structureTags, dancePrompts, technoTags } from './data.js';

const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        const activeTab = ref('lyrics');
        const showPromptLibrary = ref(false);
        const showSettings = ref(false);
        const showApiModal = ref(false);
        const settingsTab = ref('api');
        const libraryTab = ref('moods');
        
        const settings = ref({
            genre: '',
            mood: '',
            vocals: '',
            bpm: 100,
            selectedInstruments: [],
            referenceArtist: '',
            customDescription: '',
            productionQuality: 'professional'
        });

        const lyrics = ref({ title: '', content: '' });
        const history = ref([]);
        const favorites = ref([]);
        const apiConfigs = ref([]);
        const chatMessages = ref([]);
        const chatInput = ref('');
        
        const editingApiId = ref(null);
        const apiForm = ref({
            config_name: '',
            provider: 'openai',
            api_key: '',
            base_url: '',
            model_name: ''
        });
        
        const isGenerating = ref(false);
        const isTestingApi = ref(false);
        
        const notification = ref({ show: false, type: 'info', message: '', icon: 'fa-info-circle' });

        const apiConnected = computed(() => apiConfigs.value.some(c => c.is_active));
        const activeApiName = computed(() => {
            const active = apiConfigs.value.find(c => c.is_active);
            return active ? active.config_name : '';
        });

        const generatedPrompt = computed(() => {
            let parts = [];
            if (settings.value.genre) parts.push(settings.value.genre);
            if (settings.value.mood) parts.push(settings.value.mood.toLowerCase());
            if (settings.value.vocals && settings.value.vocals !== 'Instrumental') {
                parts.push(settings.value.vocals.toLowerCase());
            } else if (settings.value.vocals === 'Instrumental') {
                parts.push('instrumental, no vocals');
            }
            parts.push(`${settings.value.bpm} BPM`);
            if (settings.value.selectedInstruments.length > 0) {
                const instNames = settings.value.selectedInstruments.map(id => {
                    const inst = instruments.find(i => i.id === id);
                    return inst ? inst.name : id;
                });
                parts.push(instNames.join(', ') + ' arrangement');
            }
            const qualityMap = {
                'demo': 'demo quality',
                'radio-ready': 'radio-ready production',
                'cinematic': 'cinematic production quality',
                'professional': 'professional production'
            };
            parts.push(qualityMap[settings.value.productionQuality]);
            if (settings.value.referenceArtist) parts.push(`inspired by ${settings.value.referenceArtist}`);
            if (settings.value.customDescription) parts.push(settings.value.customDescription);
            return parts.filter(p => p).join(', ');
        });

        const lyricsWordCount = computed(() => lyrics.value.content.replace(/\s/g, '').length);
        const lyricsLineCount = computed(() => lyrics.value.content.split('\n').filter(line => line.trim()).length);
        
        const providerPlaceholder = computed(() => {
            const defaults = apiClient.getDefaults(apiForm.value.provider);
            return defaults.base_url || '根据服务商填写';
        });
        
        const providerModels = computed(() => apiClient.getModels(apiForm.value.provider));

        const showNotification = (message, type = 'info') => {
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
            notification.value = { show: true, type, message, icon: icons[type] };
            setTimeout(() => { notification.value.show = false; }, 3000);
        };

        const loadApiConfigs = async () => {
            apiConfigs.value = await db.getAll('api_pool');
        };

        const openAddApiModal = () => {
            editingApiId.value = null;
            apiForm.value = {
                config_name: '',
                provider: 'openai',
                api_key: '',
                base_url: '',
                model_name: ''
            };
            showApiModal.value = true;
        };

        const editApiConfig = async (id) => {
            const config = await db.get('api_pool', id);
            if (config) {
                editingApiId.value = id;
                apiForm.value = {
                    config_name: config.config_name,
                    provider: config.provider,
                    api_key: config.api_key,
                    base_url: config.base_url,
                    model_name: config.model_name
                };
                showApiModal.value = true;
            }
        };

        const saveApiConfig = async () => {
            if (!apiForm.value.config_name || !apiForm.value.api_key) {
                showNotification('请填写配置名称和API Key', 'error');
                return;
            }
            
            const config = {
                ...apiForm.value,
                is_active: editingApiId.value ? (await db.get('api_pool', editingApiId.value))?.is_active || 0 : apiConfigs.value.length === 0 ? 1 : 0
            };
            
            if (editingApiId.value) config.id = editingApiId.value;
            
            await db.put('api_pool', config);
            await loadApiConfigs();
            showApiModal.value = false;
            showNotification(editingApiId.value ? '配置已更新' : '配置已添加', 'success');
        };

        const deleteApiConfig = async (id) => {
            if (!confirm('确定要删除此API配置吗？')) return;
            await db.delete('api_pool', id);
            await loadApiConfigs();
            showNotification('配置已删除', 'success');
        };

        const setActiveApi = async (id) => {
            const configs = await db.getAll('api_pool');
            for (const c of configs) {
                c.is_active = c.id === id ? 1 : 0;
                await db.put('api_pool', c);
            }
            await loadApiConfigs();
            showNotification('已激活', 'success');
        };

        const testApiConnection = async () => {
            if (!apiForm.value.api_key) {
                showNotification('请输入API Key', 'error');
                return;
            }
            isTestingApi.value = true;
            const result = await apiClient.testConnection(apiForm.value);
            isTestingApi.value = false;
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.error, 'error');
            }
        };

        const onProviderChange = () => {
            const defaults = apiClient.getDefaults(apiForm.value.provider);
            apiForm.value.base_url = defaults.base_url;
            apiForm.value.model_name = defaults.model_name;
        };

        const aiGenerateLyrics = async () => {
            if (!apiConnected.value) {
                showNotification('请先配置API', 'error');
                return;
            }
            
            const theme = prompt('请输入歌曲主题：', '爱情、梦想、青春等');
            if (!theme) return;
            
            isGenerating.value = true;
            showNotification('正在生成歌词...', 'info');
            
            try {
                const prompt = sunoPrompts.generateLyrics(theme, settings.value.genre || '流行', settings.value.mood || '温暖');
                const result = await apiClient.call(prompt);
                lyrics.value.content = result;
                if (!lyrics.value.title) lyrics.value.title = theme;
                showNotification('歌词生成完成', 'success');
            } catch (error) {
                showNotification('生成失败: ' + error.message, 'error');
            } finally {
                isGenerating.value = false;
            }
        };

        const aiImproveLyrics = async () => {
            if (!lyrics.value.content) {
                showNotification('请先输入歌词内容', 'error');
                return;
            }
            
            const suggestions = prompt('请输入改进建议：', '增强韵律感、丰富情感表达');
            if (!suggestions) return;
            
            isGenerating.value = true;
            showNotification('正在润色歌词...', 'info');
            
            try {
                const prompt = sunoPrompts.improveLyrics(lyrics.value.content, suggestions);
                const result = await apiClient.call(prompt);
                lyrics.value.content = result;
                showNotification('歌词润色完成', 'success');
            } catch (error) {
                showNotification('润色失败: ' + error.message, 'error');
            } finally {
                isGenerating.value = false;
            }
        };

        const aiGeneratePrompt = async () => {
            isGenerating.value = true;
            showNotification('正在优化提示词...', 'info');
            
            try {
                const prompt = sunoPrompts.generatePrompt({
                    genre: settings.value.genre,
                    mood: settings.value.mood,
                    vocals: settings.value.vocals,
                    bpm: settings.value.bpm,
                    instruments: settings.value.selectedInstruments.map(id => {
                        const inst = instruments.find(i => i.id === id);
                        return inst ? inst.name : id;
                    }),
                    referenceArtist: settings.value.referenceArtist,
                    customDescription: settings.value.customDescription
                });
                const result = await apiClient.call(prompt);
                settings.value.customDescription = result;
                showNotification('提示词优化完成', 'success');
            } catch (error) {
                showNotification('优化失败: ' + error.message, 'error');
            } finally {
                isGenerating.value = false;
            }
        };

        const aiAnalyzeLyrics = async () => {
            if (!lyrics.value.content) {
                showNotification('请先输入歌词内容', 'error');
                return;
            }
            
            isGenerating.value = true;
            showNotification('正在分析歌词...', 'info');
            
            try {
                const prompt = sunoPrompts.analyzeLyrics(lyrics.value.content);
                const result = await apiClient.call(prompt);
                alert('歌词分析结果：\n\n' + result);
                showNotification('分析完成', 'success');
            } catch (error) {
                showNotification('分析失败: ' + error.message, 'error');
            } finally {
                isGenerating.value = false;
            }
        };

        const sendChat = async () => {
            if (!chatInput.value || isGenerating.value) return;
            
            const userMessage = chatInput.value;
            chatMessages.value.push({ role: 'user', content: userMessage });
            chatInput.value = '';
            isGenerating.value = true;
            
            try {
                const prompt = `你是一位专业的音乐创作助手。用户问题：${userMessage}\n\n请提供专业、有帮助的回答：`;
                const result = await apiClient.call(prompt);
                chatMessages.value.push({ role: 'assistant', content: result });
            } catch (error) {
                chatMessages.value.push({ role: 'assistant', content: '抱歉，发生了错误：' + error.message });
            } finally {
                isGenerating.value = false;
            }
        };

        const updatePrompt = () => saveToHistory();
        
        const copyPrompt = async () => {
            try {
                await navigator.clipboard.writeText(generatedPrompt.value);
                showNotification('提示词已复制到剪贴板', 'success');
            } catch (err) {
                showNotification('复制失败', 'error');
            }
        };

        const insertStructureTemplate = () => {
            const template = `[Intro]
(前奏)

[Verse 1]
(主歌第一段)

[Pre-Chorus]
(导歌)

[Chorus]
(副歌)

[Verse 2]
(主歌第二段)

[Chorus]
(副歌重复)

[Bridge]
(桥段)

[Final Chorus]
(最终副歌)

[Outro]
(尾奏)`;
            lyrics.value.content = lyrics.value.content ? lyrics.value.content + '\n\n' + template : template;
        };

        const clearLyrics = () => {
            if (confirm('确定要清空歌词内容吗？')) lyrics.value.content = '';
        };

        const applyTemplate = (template) => {
            lyrics.value.content = template.template;
            activeTab.value = 'lyrics';
        };

        const appendQuickPrompt = (qp) => {
            settings.value.customDescription = settings.value.customDescription 
                ? settings.value.customDescription + ', ' + qp 
                : qp;
        };

        const addTag = (tag) => {
            settings.value.customDescription = settings.value.customDescription 
                ? settings.value.customDescription + ', ' + tag 
                : tag;
        };

        const usePrompt = (prompt) => {
            settings.value.customDescription = prompt;
            showPromptLibrary.value = false;
            activeTab.value = 'prompt';
        };

        const saveToHistory = () => {
            const item = {
                title: lyrics.value.title || '未命名',
                prompt: generatedPrompt.value,
                time: new Date().toLocaleString('zh-CN'),
                settings: JSON.parse(JSON.stringify(settings.value)),
                lyrics: lyrics.value.content
            };
            const existingIndex = history.value.findIndex(h => h.title === item.title && h.prompt === item.prompt);
            if (existingIndex === -1) {
                history.value.unshift(item);
                if (history.value.length > 20) history.value.pop();
                localStorage.setItem('suno-history', JSON.stringify(history.value));
            }
        };

        const loadHistory = (item) => {
            if (item.settings) settings.value = { ...settings.value, ...item.settings };
            if (item.lyrics) lyrics.value.content = item.lyrics;
            if (item.title) lyrics.value.title = item.title;
        };

        const saveFavorite = async () => {
            const fav = {
                genre: settings.value.genre || '未分类',
                prompt: generatedPrompt.value,
                settings: JSON.parse(JSON.stringify(settings.value))
            };
            await db.put('favorites', fav);
            favorites.value = await db.getAll('favorites');
            showNotification('已保存到收藏', 'success');
        };

        const loadFavorite = (fav) => {
            if (fav.settings) settings.value = { ...settings.value, ...fav.settings };
        };

        const exportProject = () => {
            const project = {
                settings: settings.value,
                lyrics: lyrics.value,
                prompt: generatedPrompt.value,
                exportTime: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `suno-project-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('项目已导出', 'success');
        };

        onMounted(async () => {
            await db.init();
            await loadApiConfigs();
            favorites.value = await db.getAll('favorites');
            
            const savedHistory = localStorage.getItem('suno-history');
            if (savedHistory) history.value = JSON.parse(savedHistory);
            
            const savedDraft = localStorage.getItem('suno-draft');
            if (savedDraft) {
                const draft = JSON.parse(savedDraft);
                lyrics.value = draft.lyrics || { title: '', content: '' };
                if (draft.settings) settings.value = { ...settings.value, ...draft.settings };
            }
        });

        watch([lyrics, settings], () => {
            localStorage.setItem('suno-draft', JSON.stringify({ lyrics: lyrics.value, settings: settings.value }));
        }, { deep: true });

        return {
            activeTab, showPromptLibrary, showSettings, showApiModal, settingsTab, libraryTab,
            settings, lyrics, history, favorites, apiConfigs, chatMessages, chatInput,
            editingApiId, apiForm, isGenerating, isTestingApi, notification,
            apiConnected, activeApiName, generatedPrompt, lyricsWordCount, lyricsLineCount,
            providerPlaceholder, providerModels,
            instruments, quickPrompts, structureTemplates, moodTags, genreTags, instrumentTags, structureTags, dancePrompts, technoTags,
            showNotification, loadApiConfigs, openAddApiModal, editApiConfig, saveApiConfig, deleteApiConfig, setActiveApi, testApiConnection, onProviderChange,
            aiGenerateLyrics, aiImproveLyrics, aiGeneratePrompt, aiAnalyzeLyrics, sendChat,
            updatePrompt, copyPrompt, insertStructureTemplate, clearLyrics, applyTemplate, appendQuickPrompt, addTag, usePrompt,
            loadHistory, saveFavorite, loadFavorite, exportProject
        };
    }
}).mount('#app');
