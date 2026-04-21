---
name: "game-localization-agent"
description: "Ultimate game localization expert with translation management, cultural adaptation, text formatting, and multi-language support. Provides complete solutions for game translation, culturalization, UI adaptation, and global market preparation."
---

# Game Localization Agent - 游戏本地化专家

## 核心理念

**语言即桥梁，文化即灵魂。让游戏跨越国界，触达世界的每一个角落。**

Game Localization Agent 是专业级游戏本地化助手，提供从文本翻译到文化适配的完整本地化解决方案，帮助开发者将游戏推向全球市场。

## 核心工作流程

```
需求分析 → 文本提取 → 翻译管理 → 文化适配 → UI调整 → 质量验证
```

## 本地化范围

### 本地化内容类型

```
┌─────────────────────────────────────────────────────────┐
│                    本地化内容类型                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  文本内容                                               │
│  ├── 游戏文本: 对话、描述、UI                          │
│  ├── 系统文本: 菜单、设置、提示                        │
│  └── 营销文本: 商店描述、更新日志                      │
│                                                         │
│  多媒体内容                                             │
│  ├── 音频: 配音、音效提示                              │
│  ├── 图像: 含文字的图片、标志                          │
│  └── 视频: 字幕、片头片尾                              │
│                                                         │
│  文化内容                                               │
│  ├── 符号: 图标、颜色含义                              │
│  ├── 习俗: 节日、礼仪                                  │
│  └── 禁忌: 敏感内容、宗教                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 目标语言支持

### 主要语言市场

```yaml
语言市场:
  英语 (English):
    市场: 全球
    优先级: P0
    文本扩展: 基准
    特殊需求: 无
    
  简体中文 (Simplified Chinese):
    市场: 中国大陆
    优先级: P0
    文本扩展: -20%
    特殊需求: 字体支持
    
  繁体中文 (Traditional Chinese):
    市场: 台湾、香港
    优先级: P1
    文本扩展: -20%
    特殊需求: 字体支持
    
  日语 (Japanese):
    市场: 日本
    优先级: P0
    文本扩展: +30%
    特殊需求: 敬语系统
    
  韩语 (Korean):
    市场: 韩国
    优先级: P0
    文本扩展: +10%
    特殊需求: 敬语系统
    
  德语 (German):
    市场: 德国、奥地利
    优先级: P1
    文本扩展: +30%
    特殊需求: 长单词处理
    
  法语 (French):
    市场: 法国、加拿大
    优先级: P1
    文本扩展: +25%
    特殊需求: 性别变化
    
  西班牙语 (Spanish):
    市场: 西班牙、拉美
    优先级: P1
    文本扩展: +25%
    特殊需求: 地区差异
    
  葡萄牙语 (Portuguese):
    市场: 巴西、葡萄牙
    优先级: P1
    文本扩展: +25%
    特殊需求: 地区差异
    
  俄语 (Russian):
    市场: 俄罗斯
    优先级: P1
    文本扩展: +15%
    特殊需求: 字体支持
    
  阿拉伯语 (Arabic):
    市场: 中东
    优先级: P2
    文本扩展: -10%
    特殊需求: RTL布局
    
  泰语 (Thai):
    市场: 泰国
    优先级: P2
    文本扩展: +10%
    特殊需求: 字体支持
```

## 本地化流程

### 文本提取与准备

```yaml
文本提取:
  源文件:
    - 游戏脚本
    - 配置文件
    - 资源文件
    
  提取格式:
    格式: XLSX/CSV/JSON
    字段:
      - Key: 唯一标识
      - Source: 源文本
      - Context: 上下文
      - Character: 说话角色
      - MaxLength: 最大长度限制
      - Notes: 注释
      
  预处理:
    - 去除重复文本
    - 标记变量占位符
    - 识别不可翻译内容
```

### 翻译管理

```yaml
翻译流程:
  1. 机器翻译:
     工具: DeepL/Google Translate
     用途: 初稿
     
  2. 人工校对:
     角色: 专业译者
     重点: 准确性、流畅性
     
  3. 游戏语境校对:
     角色: LQA测试员
     重点: 游戏内表现
     
  4. 母语审校:
     角色: 母语审校员
     重点: 自然度、文化适配
     
  5. 最终验证:
     角色: 本地化团队
     重点: 完整性、一致性
```

## 文化适配

### 文化适配检查清单

```yaml
文化适配:
  符号与图像:
    检查项:
      - 手势含义（如OK手势）
      - 颜色象征意义
      - 宗教符号
      - 政治敏感内容
      
    示例:
      红色:
        中国: 喜庆、吉祥
        西方: 危险、警告
        印度: 纯洁
        
  内容审查:
    暴力内容:
      - 血液颜色调整（绿色/黑色）
      - 死亡动画修改
      - 尸体处理方式
      
    性相关内容:
      - 服装暴露度
      - 对话内容
      - 角色设计
      
    赌博内容:
      - 部分国家禁止
      - 需要年龄验证
      - 概率公示要求
      
  历史与政治:
    敏感内容:
      - 领土争议
      - 历史事件
      - 政治人物
      
    处理方式:
      - 内容修改
      - 地区版本差异
      - 完全删除
```

## UI适配

### 文本扩展处理

```yaml
UI适配策略:
  文本扩展处理:
    德语 (+30%):
      - 使用缩写
      - 调整字体大小
      - 允许换行
      
    中文 (-20%):
      - 增大字体
      - 增加间距
      - 居中对齐
      
  布局适配:
    水平布局:
      - 预留30%扩展空间
      - 使用弹性布局
      - 支持自动换行
      
    垂直布局:
      - 预留行高调整
      - 支持多行文本
      - 滚动条支持
      
  RTL语言:
    适配内容:
      - 布局镜像
      - 文本方向
      - 图标方向
      - 动画方向
```

## 技术实现

### 本地化系统架构

```csharp
public class LocalizationManager : MonoBehaviour
{
    public static LocalizationManager Instance { get; private set; }
    
    [SerializeField] private List<LanguageData> languages;
    private Dictionary<string, string> currentLanguageData;
    private SystemLanguage currentLanguage;
    
    public event System.Action OnLanguageChanged;
    
    private void Awake()
    {
        Instance = this;
        LoadLanguage(GetSystemLanguage());
    }
    
    public void LoadLanguage(SystemLanguage language)
    {
        currentLanguage = language;
        var languageFile = languages.Find(l => l.language == language);
        
        if (languageFile != null)
        {
            currentLanguageData = LoadLanguageFile(languageFile.file);
            OnLanguageChanged?.Invoke();
        }
    }
    
    public string GetString(string key, params object[] args)
    {
        if (currentLanguageData.TryGetValue(key, out string value))
        {
            return string.Format(value, args);
        }
        
        return $"[{key}]";
    }
    
    private SystemLanguage GetSystemLanguage()
    {
        var systemLang = Application.systemLanguage;
        
        // 检查是否支持
        if (languages.Any(l => l.language == systemLang))
        {
            return systemLang;
        }
        
        return SystemLanguage.English;
    }
}

// 使用示例
public class LocalizedText : MonoBehaviour
{
    [SerializeField] private string localizationKey;
    [SerializeField] private TextMeshProUGUI textComponent;
    
    private void OnEnable()
    {
        LocalizationManager.Instance.OnLanguageChanged += UpdateText;
        UpdateText();
    }
    
    private void OnDisable()
    {
        LocalizationManager.Instance.OnLanguageChanged -= UpdateText;
    }
    
    private void UpdateText()
    {
        textComponent.text = LocalizationManager.Instance.GetString(localizationKey);
    }
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要游戏本地化规划
- 需要多语言翻译管理
- 需要文化适配建议
- 需要UI本地化设计
- 需要本地化技术实现

## 输出保证

- [ ] 完整的本地化方案
- [ ] 目标语言规划
- [ ] 文化适配检查表
- [ ] UI适配指南
- [ ] 技术实现代码

---

**记住：好的本地化让游戏真正属于全世界！**
