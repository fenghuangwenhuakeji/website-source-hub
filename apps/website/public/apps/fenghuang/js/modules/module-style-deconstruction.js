// 文件路径: js/modules/module-style-deconstruction.js
// 描述: 文风拆解器模块。
function initStyleDeconstructionPanel() {
    const defaultText = `“言尘，结婚三周年快乐。”
镁光灯灼烧着空气，我微笑着踮起脚尖，将一个精准计算过角度的、看起来无比轻柔的吻，印在顾言尘的侧脸。
他顺势将我揽入怀中，那是一个排练过无数次的拥抱。骨节分明的手指穿过我的发丝，他微微侧头，迎向镜头，眼里的深情浓郁到仿佛要溢出屏幕，足以溺毙千万粉丝。
“苏晚，你才是我生命里，唯一的星光。”
轰——
台下和直播间的热浪瞬间被这句话引爆。`;

    const inputArea = document.getElementById('deconstruction-source-text');
    if(inputArea) inputArea.value = defaultText;

    document.getElementById('deconstruct-novel-btn')?.addEventListener('click', handleDeconstructNovel);
}

async function handleDeconstructNovel() {
    const sourceText = document.getElementById('deconstruction-source-text').value.trim();
    if (sourceText.length < 100) { 
        showNotification("请输入至少100字以便进行有效分析。", "warning"); 
        return; 
    }
    showLoading('正在深度拆解...');
    const outputCard = document.getElementById('deconstruction-output-card');
    const outputContent = document.getElementById('deconstruction-output-content');
    if(outputCard) outputCard.style.display = 'block';
    if(outputContent) outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI文学分析师正在解构原文的骨架与血肉...</p>`;

    const prompt = `
# 角色与任务
你是一位顶级的网络文学分析师，师从于一位善于“极致拆解”的大师。你的唯一任务是，严格遵循大师融合后的拆解方法论，对以下提供的网络小说原文进行深度、系统化的分析，并生成一份“核心复刻指南”。

# 大师的核心拆解方法论 (融合版)
## 第一步：精准定义
首先，为这部作品下一个精准的定义，点出其核心类型和魅力所在。
## 第二步：拆解“文章架构（骨架）”
分析核心驱动、叙事结构、核心情节模式、人物弧光和象征物运用。
## 第三步：拆解“文风特点（血肉）”
分析叙事视角、语言风格、情感与感官、节奏控制和“金句”提炼。
## 第四步：生成“核心复刻指南”
基于以上所有分析，总结出一份简明扼要、可操作的指南。

---
**待拆解的小说原文如下：**
\`\`\`
${sourceText}
\`\`\`
---
请严格按照以上方法论，开始你的拆解工作，并直接输出完整的、使用Markdown格式排版的分析报告。`;
    
    try {
        const analysisReport = await callAI(prompt);
        if (outputContent) {
            const converter = new showdown.Converter();
            outputContent.innerHTML = converter.makeHtml(analysisReport);
        }
        showNotification("作品拆解报告已生成！", "success");
    } catch (error) { 
        if (outputContent) outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">作品拆解失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}