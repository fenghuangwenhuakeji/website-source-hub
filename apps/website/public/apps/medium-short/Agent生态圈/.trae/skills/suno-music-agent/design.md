# Suno Music Agent - 架构设计文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Suno Music Agent 架构                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Parser    │  │   Lyric     │  │   Suno      │  │   Music     │    │
│  │   解析器     │  │  Generator  │  │   Prompt    │  │   Concept   │    │
│  │             │  │  歌词生成器  │  │  Generator  │  │  Designer   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    │   Core Engine     │                               │
│                    │   核心引擎         │                               │
│                    └─────────┬─────────┘                               │
│                              │                                          │
│         ┌────────────────────┼────────────────────┐                    │
│         │                    │                    │                    │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐               │
│  │   Rhyme     │    │   Style     │    │  Emotion    │               │
│  │   Engine    │    │   Library   │    │    Model    │               │
│  │  韵律引擎    │    │   风格库     │    │   情绪模型   │               │
│  └─────────────┘    └─────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件

#### 1.2.1 Parser 需求解析器

```python
class MusicRequirementParser:
    """音乐需求解析器"""
    
    def parse(self, user_input: str) -> ParsedMusicRequirement:
        """解析用户输入的音乐需求"""
        
        # 提取主题
        theme = self._extract_theme(user_input)
        
        # 识别风格
        style = self._detect_style(user_input)
        
        # 分析情绪
        mood = self._analyze_mood(user_input)
        
        # 确定语言
        language = self._detect_language(user_input)
        
        # 识别场景
        scenario = self._detect_scenario(user_input)
        
        # 提取参考
        references = self._extract_references(user_input)
        
        return ParsedMusicRequirement(
            theme=theme,
            style=style,
            mood=mood,
            language=language,
            scenario=scenario,
            references=references
        )
    
    def _detect_style(self, input_text: str) -> MusicStyle:
        """检测音乐风格"""
        style_keywords = {
            'pop': ['流行', 'pop', '抒情', 'ballad'],
            'electronic': ['电子', 'edm', '电音', 'house', 'techno'],
            'rock': ['摇滚', 'rock', 'metal', 'punk'],
            'hiphop': ['嘻哈', 'hiphop', 'rap', '说唱'],
            'folk': ['民谣', 'folk', 'acoustic', '吉他'],
            'classical': ['古典', 'classical', 'orchestral', '交响'],
            'cinematic': ['影视', 'cinematic', 'epic', '电影']
        }
        
        for style, keywords in style_keywords.items():
            if any(keyword in input_text.lower() for keyword in keywords):
                return MusicStyle(style)
        
        return MusicStyle.POP  # 默认流行
```

#### 1.2.2 Lyric Generator 歌词生成器

```python
class LyricGenerator:
    """歌词生成器"""
    
    def __init__(self):
        self.rhyme_engine = RhymeEngine()
        self.structure_templates = StructureTemplates()
        self.emotion_chain = EmotionChainDesigner()
    
    def generate(self, requirement: ParsedMusicRequirement) -> Lyrics:
        """生成完整歌词"""
        
        # 选择结构模板
        structure = self._select_structure(requirement)
        
        # 设计情感链
        emotion_curve = self.emotion_chain.design(requirement)
        
        # 生成各段落
        lyrics = Lyrics()
        lyrics.title = self._generate_title(requirement)
        
        # Intro (可选)
        if structure.has_intro:
            lyrics.intro = self._generate_intro(requirement)
        
        # Verse 1
        lyrics.verse1 = self._generate_verse(
            requirement, 
            emotion_curve.verse1_mood,
            section=1
        )
        
        # Pre-Chorus (可选)
        if structure.has_pre_chorus:
            lyrics.pre_chorus = self._generate_pre_chorus(
                requirement,
                emotion_curve.pre_chorus_mood
            )
        
        # Chorus
        lyrics.chorus = self._generate_chorus(
            requirement,
            emotion_curve.chorus_mood
        )
        
        # Verse 2
        lyrics.verse2 = self._generate_verse(
            requirement,
            emotion_curve.verse2_mood,
            section=2
        )
        
        # Bridge (可选)
        if structure.has_bridge:
            lyrics.bridge = self._generate_bridge(
                requirement,
                emotion_curve.bridge_mood
            )
        
        # Final Chorus
        lyrics.final_chorus = self._generate_final_chorus(
            requirement,
            emotion_curve.final_chorus_mood
        )
        
        # Outro (可选)
        if structure.has_outro:
            lyrics.outro = self._generate_outro(requirement)
        
        # 应用韵律
        lyrics = self.rhyme_engine.apply_rhyme(lyrics, requirement.language)
        
        return lyrics
    
    def _generate_chorus(self, requirement: ParsedMusicRequirement, mood: Mood) -> str:
        """生成副歌 - 歌曲核心记忆点"""
        
        # 副歌需要：
        # 1. 主题明确
        # 2. 情感强烈
        # 3. 朗朗上口
        # 4. 有记忆点
        
        theme = requirement.theme
        style = requirement.style
        
        # 基于主题生成核心句子
        hook = self._generate_hook(theme, mood)
        
        # 构建副歌结构
        chorus_lines = [
            self._generate_opening_line(theme, mood),
            hook,
            self._generate_supporting_line(theme, mood),
            hook  # 重复hook强化记忆
        ]
        
        return '\n'.join(chorus_lines)
```

#### 1.2.3 Suno Prompt Generator 提示词生成器

```python
class SunoPromptGenerator:
    """Suno提示词生成器"""
    
    def __init__(self):
        self.style_library = StyleLibrary()
        self.instrument_library = InstrumentLibrary()
        self.mood_vocabulary = MoodVocabulary()
    
    def generate(self, requirement: ParsedMusicRequirement, lyrics: Lyrics) -> SunoPrompt:
        """生成Suno提示词"""
        
        prompt = SunoPrompt()
        
        # 1. 风格描述
        prompt.genre = self._generate_genre_description(requirement)
        
        # 2. 情绪描述
        prompt.mood = self._generate_mood_description(requirement)
        
        # 3. 人声设置
        prompt.vocal = self._generate_vocal_setting(requirement)
        
        # 4. 速度设置
        prompt.tempo = self._calculate_tempo(requirement)
        
        # 5. 乐器配置
        prompt.instruments = self._generate_instrumentation(requirement)
        
        # 6. 制作质量
        prompt.production = self._generate_production_quality(requirement)
        
        # 7. 参考艺术家
        prompt.references = self._generate_artist_references(requirement)
        
        # 8. 特殊说明
        prompt.notes = self._generate_special_notes(requirement, lyrics)
        
        return prompt
    
    def _generate_genre_description(self, requirement: ParsedMusicRequirement) -> str:
        """生成风格描述"""
        
        style_mapping = {
            MusicStyle.POP: {
                'ballad': 'Pop ballad',
                'upbeat': 'Dance-pop',
                'acoustic': 'Acoustic pop'
            },
            MusicStyle.ELECTRONIC: {
                'energetic': 'EDM',
                'melodic': 'Future Bass',
                'ambient': 'Ambient electronic'
            },
            MusicStyle.CINEMATIC: {
                'epic': 'Epic orchestral',
                'emotional': 'Emotional cinematic',
                'tense': 'Tension cinematic'
            }
        }
        
        style_dict = style_mapping.get(requirement.style, {})
        sub_style = self._detect_sub_style(requirement)
        
        return style_dict.get(sub_style, 'Pop')
    
    def _generate_instrumentation(self, requirement: ParsedMusicRequirement) -> str:
        """生成乐器配置描述"""
        
        instruments = []
        
        if requirement.style == MusicStyle.POP:
            if requirement.mood in [Mood.EMOTIONAL, Mood.MELANCHOLIC]:
                instruments = ['piano', 'acoustic guitar', 'strings', 'soft drums']
            else:
                instruments = ['synthesizer', 'electric guitar', 'drums', 'bass']
        
        elif requirement.style == MusicStyle.ELECTRONIC:
            instruments = [
                'synthesizer', '808 bass', 'drum machine', 
                'arpeggiator', 'sound effects'
            ]
        
        elif requirement.style == MusicStyle.CINEMATIC:
            instruments = [
                'orchestral strings', 'brass section', 'percussion',
                'choir', 'piano'
            ]
        
        return ', '.join(instruments)
    
    def to_string(self, prompt: SunoPrompt) -> str:
        """转换为Suno可用的字符串格式"""
        
        parts = [
            prompt.genre,
            prompt.mood,
            prompt.vocal,
            f"{prompt.tempo} BPM",
            prompt.instruments,
            prompt.production
        ]
        
        if prompt.references:
            parts.append(f"inspired by {prompt.references}")
        
        return ', '.join(parts)
```

#### 1.2.4 Music Concept Designer 音乐概念设计师

```python
class MusicConceptDesigner:
    """音乐概念设计师"""
    
    def design_concept(self, requirement: ParsedMusicRequirement) -> MusicConcept:
        """设计完整音乐概念"""
        
        concept = MusicConcept()
        
        # 核心概念
        concept.core_theme = requirement.theme
        concept.story_arc = self._design_story_arc(requirement)
        concept.emotional_journey = self._design_emotional_journey(requirement)
        
        # 音乐元素
        concept.key_signature = self._suggest_key(requirement)
        concept.time_signature = self._suggest_time_signature(requirement)
        concept.structure = self._design_structure(requirement)
        
        # 制作建议
        concept.production_notes = self._generate_production_notes(requirement)
        concept.arrangement_ideas = self._generate_arrangement_ideas(requirement)
        
        return concept
    
    def _design_emotional_journey(self, requirement: ParsedMusicRequirement) -> EmotionalJourney:
        """设计情感旅程"""
        
        journey = EmotionalJourney()
        
        # 标准情感曲线：
        # 平静 → 积累 → 高潮 → 回落 → 升华
        
        journey.points = [
            EmotionalPoint(position=0.0, intensity=0.3, mood=requirement.mood),
            EmotionalPoint(position=0.25, intensity=0.5, mood=self._intensify(requirement.mood)),
            EmotionalPoint(position=0.5, intensity=0.8, mood=self._peak(requirement.mood)),
            EmotionalPoint(position=0.75, intensity=0.6, mood=self._transition(requirement.mood)),
            EmotionalPoint(position=1.0, intensity=0.9, mood=self._climax(requirement.mood))
        ]
        
        return journey
```

## 2. 知识库设计

### 2.1 知识库结构

```
knowledge-base/
├── lyrics/
│   ├── rhyme-schemes.json          # 押韵模式库
│   ├── structure-templates.json    # 结构模板库
│   ├── chinese-rhymes.json         # 中文韵律库
│   └── english-rhymes.json         # 英文韵律库
├── styles/
│   ├── pop-styles.json             # 流行风格库
│   ├── electronic-styles.json      # 电子风格库
│   ├── rock-styles.json            # 摇滚风格库
│   ├── hiphop-styles.json          # 嘻哈风格库
│   ├── folk-styles.json            # 民谣风格库
│   ├── classical-styles.json       # 古典风格库
│   └── cinematic-styles.json       # 影视风格库
├── moods/
│   ├── mood-vocabulary.json        # 情绪词汇库
│   ├── mood-combinations.json      # 情绪组合库
│   └── energy-levels.json          # 能量级别库
├── instruments/
│   ├── instrument-families.json    # 乐器家族
│   ├── common-combinations.json    # 常见组合
│   └── genre-instruments.json      # 风格乐器映射
└── artists/
    ├── pop-artists.json            # 流行艺术家参考
    ├── electronic-artists.json     # 电子艺术家参考
    └── cinematic-composers.json    # 影视作曲家参考
```

### 2.2 风格词库示例

```json
{
  "pop-styles": {
    "pop-ballad": {
      "name": "Pop Ballad",
      "bpm-range": [60, 85],
      "common-instruments": ["piano", "strings", "acoustic-guitar", "soft-drums"],
      "mood-keywords": ["emotional", "romantic", "melancholic", "heartfelt"],
      "structure": "Intro-Verse-PreChorus-Chorus-Verse-Chorus-Bridge-FinalChorus-Outro",
      "reference-artists": ["Adele", "Sam Smith", "Taylor Swift"]
    },
    "dance-pop": {
      "name": "Dance Pop",
      "bpm-range": [120, 130],
      "common-instruments": ["synthesizer", "drum-machine", "bass", "electronic-effects"],
      "mood-keywords": ["energetic", "upbeat", "catchy", "party"],
      "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro",
      "reference-artists": ["Dua Lipa", "The Weeknd", "Doja Cat"]
    }
  }
}
```

### 2.3 情绪词汇库

```json
{
  "mood-vocabulary": {
    "positive": {
      "uplifting": {
        "synonyms": ["inspiring", "elevating", "heartening"],
        "energy-level": 0.7,
        "common-genres": ["pop", "electronic", "cinematic"]
      },
      "joyful": {
        "synonyms": ["cheerful", "happy", "delighted"],
        "energy-level": 0.8,
        "common-genres": ["pop", "disco", "funk"]
      },
      "romantic": {
        "synonyms": ["passionate", "tender", "loving"],
        "energy-level": 0.5,
        "common-genres": ["pop-ballad", "rnb", "jazz"]
      }
    },
    "negative": {
      "melancholic": {
        "synonyms": ["sad", "sorrowful", "wistful"],
        "energy-level": 0.3,
        "common-genres": ["pop-ballad", "indie", "folk"]
      },
      "dark": {
        "synonyms": ["ominous", "brooding", "mysterious"],
        "energy-level": 0.4,
        "common-genres": ["electronic", "rock", "cinematic"]
      }
    }
  }
}
```

## 3. 歌词生成流程

### 3.1 生成流程图

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  用户输入 │────▶│ 需求解析  │────▶│ 概念设计  │────▶│ 歌词生成  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                         ┌──────────────────────────────┘
                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  输出交付 │◀────│ 质量检查  │◀────│ 提示词生成 │◀────│ 韵律优化  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3.2 详细流程

```python
class MusicGenerationPipeline:
    """音乐生成流程管道"""
    
    def __init__(self):
        self.parser = MusicRequirementParser()
        self.concept_designer = MusicConceptDesigner()
        self.lyric_generator = LyricGenerator()
        self.rhyme_engine = RhymeEngine()
        self.prompt_generator = SunoPromptGenerator()
        self.quality_checker = QualityChecker()
    
    async def execute(self, user_input: str) -> MusicGenerationResult:
        """执行完整生成流程"""
        
        # 1. 需求解析
        requirement = self.parser.parse(user_input)
        
        # 2. 概念设计
        concept = self.concept_designer.design_concept(requirement)
        
        # 3. 歌词生成
        lyrics = self.lyric_generator.generate(requirement)
        
        # 4. 韵律优化
        lyrics = self.rhyme_engine.optimize(lyrics, requirement.language)
        
        # 5. 提示词生成
        suno_prompt = self.prompt_generator.generate(requirement, lyrics)
        
        # 6. 质量检查
        quality_report = self.quality_checker.check(lyrics, suno_prompt)
        
        # 7. 组装输出
        return MusicGenerationResult(
            lyrics=lyrics,
            suno_prompt=suno_prompt,
            concept=concept,
            quality_report=quality_report
        )
```

## 4. 韵律引擎设计

### 4.1 中文韵律系统

```python
class ChineseRhymeEngine:
    """中文韵律引擎"""
    
    def __init__(self):
        # 加载韵书
        self.pingshui_rhymes = self._load_pingshui_rhymes()  # 平水韵
        self.zhonghua_rhymes = self._load_zhonghua_rhymes()  # 中华新韵
        self.shisan_che = self._load_shisan_che()  # 十三辙
    
    def find_rhyme(self, word: str, rhyme_scheme: str = 'AABB') -> List[str]:
        """查找押韵词"""
        
        # 获取词尾韵母
        final = self._get_final(word)
        
        # 根据韵书查找同韵词
        if rhyme_scheme in ['AABB', 'AAAA']:
            # 完全押韵
            rhymes = self._find_exact_rhymes(final)
        elif rhyme_scheme == 'ABAB':
            # 交叉押韵
            rhymes = self._find_cross_rhymes(final)
        else:
            # 近韵
            rhymes = self._find_near_rhymes(final)
        
        return rhymes
    
    def check_rhyme_quality(self, line1: str, line2: str) -> RhymeQuality:
        """检查押韵质量"""
        
        final1 = self._get_final(line1)
        final2 = self._get_final(line2)
        
        if final1 == final2:
            return RhymeQuality.PERFECT
        elif self._is_near_rhyme(final1, final2):
            return RhymeQuality.NEAR
        else:
            return RhymeQuality.NONE
```

### 4.2 英文韵律系统

```python
class EnglishRhymeEngine:
    """英文韵律引擎"""
    
    def __init__(self):
        self.pronunciation_dict = self._load_cmu_dict()
        self.rhyme_patterns = self._load_rhyme_patterns()
    
    def get_rhyme_scheme(self, lines: List[str]) -> str:
        """识别押韵模式"""
        
        # 获取每行最后一个词的音标
        last_sounds = []
        for line in lines:
            last_word = line.split()[-1].lower()
            phonemes = self._get_phonemes(last_word)
            last_sounds.append(self._get_rhyme_sound(phonemes))
        
        # 分析押韵模式
        scheme = []
        rhyme_map = {}
        current_rhyme = 'A'
        
        for sound in last_sounds:
            if sound in rhyme_map:
                scheme.append(rhyme_map[sound])
            else:
                rhyme_map[sound] = current_rhyme
                scheme.append(current_rhyme)
                current_rhyme = chr(ord(current_rhyme) + 1)
        
        return ''.join(scheme)
    
    def find_rhymes(self, word: str, max_results: int = 10) -> List[str]:
        """查找押韵词"""
        
        target_phonemes = self._get_phonemes(word)
        target_rhyme = self._get_rhyme_sound(target_phonemes)
        
        rhymes = []
        for dict_word, phonemes in self.pronunciation_dict.items():
            rhyme_sound = self._get_rhyme_sound(phonemes)
            if rhyme_sound == target_rhyme and dict_word != word:
                rhymes.append(dict_word)
        
        return rhymes[:max_results]
```

## 5. 情绪模型

### 5.1 情绪链设计

```python
class EmotionChainDesigner:
    """情绪链设计师"""
    
    def design(self, requirement: ParsedMusicRequirement) -> EmotionCurve:
        """设计情绪曲线"""
        
        curve = EmotionCurve()
        base_mood = requirement.mood
        
        # 标准情绪递进模式
        curve.verse1_mood = self._slight_intensify(base_mood, 0.2)
        curve.pre_chorus_mood = self._build_tension(base_mood, 0.4)
        curve.chorus_mood = self._peak_emotion(base_mood, 0.8)
        curve.verse2_mood = self._slight_release(base_mood, 0.3)
        curve.bridge_mood = self._contrast_emotion(base_mood)
        curve.final_chorus_mood = self._ultimate_peak(base_mood, 1.0)
        
        return curve
    
    def _build_tension(self, mood: Mood, intensity: float) -> MoodState:
        """构建张力"""
        return MoodState(
            primary=mood,
            intensity=intensity,
            tension=TensionLevel.RISING,
            description=f"Building tension towards {mood.name}"
        )
```

### 5.2 情绪词汇映射

```python
class MoodVocabulary:
    """情绪词汇库"""
    
    def __init__(self):
        self.mood_descriptions = {
            Mood.JOYFUL: {
                'chinese': ['欢乐', '快乐', '喜悦', '兴奋'],
                'english': ['joyful', 'happy', 'cheerful', 'elated'],
                'suno_keywords': ['upbeat', 'energetic', 'bright', 'positive']
            },
            Mood.MELANCHOLIC: {
                'chinese': ['忧郁', '忧伤', '惆怅', '感伤'],
                'english': ['melancholic', 'sad', 'sorrowful', 'wistful'],
                'suno_keywords': ['emotional', 'somber', 'introspective', 'bittersweet']
            },
            Mood.ROMANTIC: {
                'chinese': ['浪漫', '温柔', '甜蜜', '深情'],
                'english': ['romantic', 'tender', 'passionate', 'loving'],
                'suno_keywords': ['romantic', 'tender', 'passionate', 'intimate']
            },
            Mood.EPIC: {
                'chinese': ['史诗', '宏大', '壮丽', '震撼'],
                'english': ['epic', 'grand', 'majestic', 'powerful'],
                'suno_keywords': ['epic', 'cinematic', 'grand', 'powerful', 'triumphant']
            }
        }
    
    def get_suno_keywords(self, mood: Mood) -> List[str]:
        """获取Suno提示词关键词"""
        return self.mood_descriptions.get(mood, {}).get('suno_keywords', [])
```

## 6. 接口设计

### 6.1 外部接口

```python
# Agent主接口
class ISunoMusicAgent:
    async def generate_song(self, request: SongRequest) -> SongResult:
        """生成完整歌曲"""
        pass
    
    async def generate_lyrics_only(self, request: LyricsRequest) -> Lyrics:
        """仅生成歌词"""
        pass
    
    async def generate_suno_prompt(self, request: PromptRequest) -> SunoPrompt:
        """仅生成Suno提示词"""
        pass
    
    async def suggest_style(self, description: str) -> List[MusicStyle]:
        """建议音乐风格"""
        pass

# 请求/响应模型
@dataclass
class SongRequest:
    theme: str
    style: Optional[str] = None
    mood: Optional[str] = None
    language: str = 'chinese'
    scenario: Optional[str] = None
    references: Optional[List[str]] = None
    duration: Optional[int] = None  # 预计时长(秒)

@dataclass
class SongResult:
    lyrics: Lyrics
    suno_prompt: SunoPrompt
    concept: MusicConcept
    quality_score: float
```

### 6.2 内部接口

```python
# 解析器接口
class IRequirementParser:
    def parse(self, user_input: str) -> ParsedMusicRequirement:
        pass

# 生成器接口
class ILyricGenerator:
    def generate(self, requirement: ParsedMusicRequirement) -> Lyrics:
        pass

# 提示词生成器接口
class ISunoPromptGenerator:
    def generate(self, requirement: ParsedMusicRequirement, lyrics: Lyrics) -> SunoPrompt:
        pass
```

## 7. 部署架构

### 7.1 本地部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  suno-music-agent:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - KNOWLEDGE_BASE_PATH=/app/knowledge-base
    volumes:
      - ./knowledge-base:/app/knowledge-base
      - ./logs:/app/logs
```

### 7.2 API服务部署

```python
# FastAPI应用
from fastapi import FastAPI

app = FastAPI(title="Suno Music Agent API")
agent = SunoMusicAgent()

@app.post("/api/v1/generate-song")
async def generate_song(request: SongRequest):
    result = await agent.generate_song(request)
    return result

@app.post("/api/v1/generate-lyrics")
async def generate_lyrics(request: LyricsRequest):
    lyrics = await agent.generate_lyrics_only(request)
    return lyrics

@app.post("/api/v1/generate-prompt")
async def generate_prompt(request: PromptRequest):
    prompt = await agent.generate_suno_prompt(request)
    return prompt
```

## 8. 质量保障

### 8.1 歌词质量检查

```python
class LyricQualityChecker:
    """歌词质量检查器"""
    
    def check(self, lyrics: Lyrics) -> QualityReport:
        """检查歌词质量"""
        
        report = QualityReport()
        
        # 检查韵律
        report.rhyme_score = self._check_rhyme_quality(lyrics)
        
        # 检查结构
        report.structure_score = self._check_structure_completeness(lyrics)
        
        # 检查情感
        report.emotion_score = self._check_emotion_consistency(lyrics)
        
        # 检查创意
        report.creativity_score = self._check_creativity(lyrics)
        
        # 综合评分
        report.overall_score = (
            report.rhyme_score * 0.3 +
            report.structure_score * 0.25 +
            report.emotion_score * 0.25 +
            report.creativity_score * 0.2
        )
        
        return report
```

### 8.2 提示词质量检查

```python
class PromptQualityChecker:
    """提示词质量检查器"""
    
    def check(self, prompt: SunoPrompt) -> PromptQualityReport:
        """检查提示词质量"""
        
        report = PromptQualityReport()
        
        # 检查完整性
        report.completeness = self._check_completeness(prompt)
        
        # 检查清晰度
        report.clarity = self._check_clarity(prompt)
        
        # 检查具体性
        report.specificity = self._check_specificity(prompt)
        
        # 检查Suno兼容性
        report.suno_compatibility = self._check_suno_compatibility(prompt)
        
        return report
```

## 9. 扩展性设计

### 9.1 插件系统

```python
class PluginManager:
    """插件管理器"""
    
    def __init__(self):
        self.lyric_plugins: List[ILyricPlugin] = []
        self.prompt_plugins: List[IPromptPlugin] = []
    
    def register_lyric_plugin(self, plugin: ILyricPlugin):
        """注册歌词插件"""
        self.lyric_plugins.append(plugin)
    
    def apply_lyric_plugins(self, lyrics: Lyrics) -> Lyrics:
        """应用所有歌词插件"""
        for plugin in self.lyric_plugins:
            lyrics = plugin.process(lyrics)
        return lyrics
```

### 9.2 风格扩展

```python
class StyleExtension:
    """风格扩展机制"""
    
    def add_custom_style(self, style_config: Dict):
        """添加自定义风格"""
        # 验证配置
        self._validate_style_config(style_config)
        
        # 添加到风格库
        self.style_library.add_style(style_config)
        
        # 更新提示词生成器
        self.prompt_generator.reload_styles()
```

## 10. 监控与日志

### 10.1 日志系统

```python
class MusicAgentLogger:
    """音乐Agent日志系统"""
    
    def log_generation_start(self, request: SongRequest):
        """记录生成开始"""
        logger.info(f"开始歌曲生成: theme={request.theme}, style={request.style}")
    
    def log_generation_complete(self, result: SongResult, duration: float):
        """记录生成完成"""
        logger.info(
            f"歌曲生成完成: quality={result.quality_score:.2f}, "
            f"duration={duration:.2f}s"
        )
    
    def log_error(self, error: Exception, context: str):
        """记录错误"""
        logger.error(f"生成错误 [{context}]: {str(error)}")
```

## 11. 版本管理

### 11.1 知识库版本

```python
class KnowledgeBaseVersion:
    """知识库版本管理"""
    
    def __init__(self):
        self.version = "1.0.0"
        self.style_library_version = "1.0.0"
        self.rhyme_dictionary_version = "1.0.0"
    
    def check_compatibility(self, target_version: str) -> bool:
        """检查版本兼容性"""
        # 实现版本兼容性检查逻辑
        pass
```
