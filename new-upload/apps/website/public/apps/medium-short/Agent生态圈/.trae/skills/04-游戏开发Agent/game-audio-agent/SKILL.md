---
name: "game-audio-agent"
description: "Ultimate game audio expert with sound design, music systems, audio implementation, and spatial audio. Provides complete solutions for game soundtracks, sound effects, adaptive music, and immersive audio experiences."
---

# Game Audio Agent - 游戏音频专家

## 核心理念

**声音即情感，音频即世界。用听觉的魔法，创造沉浸的游戏体验。**

Game Audio Agent 是专业级游戏音频开发助手，提供从音效设计到音乐系统的完整音频解决方案，帮助开发者打造沉浸式的游戏声音体验。

## 核心工作流程

```
音频需求分析 → 音效设计 → 音乐创作 → 系统实现 → 空间音频 → 混音优化
```

## 音频系统架构

### 音频层级结构

```
┌─────────────────────────────────────────────────────────┐
│                    音频系统架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  音频管理器 (Audio Manager)                             │
│  ├── 主音量控制                                         │
│  ├── 音频池管理                                         │
│  └── 分组混音                                           │
│                                                         │
│  ├── 音乐系统 (Music System)                            │
│  │   ├── 背景音乐                                       │
│  │   ├── 自适应音乐                                     │
│  │   └── 过渡系统                                       │
│  │                                                     │
│  ├── 音效系统 (SFX System)                              │
│  │   ├── 一次性音效                                     │
│  │   ├── 循环音效                                       │
│  │   └── 随机变化                                       │
│  │                                                     │
│  ├── 环境音系统 (Ambient System)                        │
│  │   ├── 区域环境音                                     │
│  │   ├── 天气音效                                       │
│  │   └── 动态混音                                       │
│  │                                                     │
│  └── 对话系统 (Dialogue System)                         │
│      ├── 语音播放                                       │
│      ├── 字幕同步                                       │
│      └── 优先级管理                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 音效设计模板

### 音效分类

```yaml
音效分类系统:
  玩家音效:
    脚步声:
      - 材质类型: 石头/木头/草地/金属/水
      - 节奏变化: 行走/奔跑/潜行
      - 随机变化: 3-5个变体
      
    动作音效:
      - 跳跃: 起跳/落地
      - 攻击: 挥舞/命中/未命中
      - 受伤: 轻伤/重伤/死亡
      - 互动: 拾取/开门/使用物品
      
  武器音效:
    近战武器:
      - 挥舞声
      - 命中声(不同材质)
      - 格挡声
      
    远程武器:
      - 射击声
      - 装弹声
      - 弹壳落地声
      
  环境音效:
    自然:
      - 风: 不同强度
      - 雨: 小雨/大雨/雷雨
      - 水: 河流/瀑布/海浪
      
    人造:
      - 火: 篝火/大火
      - 机械: 引擎/齿轮/蒸汽
      - 电器: 电流/嗡嗡声
```

### 音效配置

```yaml
音效配置模板:
  名称: player_footstep_grass
  
  音频文件:
    - footstep_grass_01.wav
    - footstep_grass_02.wav
    - footstep_grass_03.wav
    - footstep_grass_04.wav
    
  播放设置:
    音量: 0.7 (随机范围: ±0.1)
    音调: 1.0 (随机范围: ±0.05)
    空间混合: 1.0 (3D音效)
    最大距离: 15米
    衰减曲线: 对数衰减
    
  触发条件:
    - 玩家移动
    - 地面材质 = 草地
    - 移动速度 > 0
    
  冷却时间: 0.3秒 (根据移动速度调整)
```

## 自适应音乐系统

### 音乐层级设计

```yaml
自适应音乐配置:
  场景: 战斗音乐
  
  基础层:
    名称: 鼓点层
    文件: combat_drums.wav
    音量: 0.8
    始终播放: true
    
  情绪层:
    名称: 弦乐层
    文件: combat_strings.wav
    音量: 0.0
    触发条件: 战斗激烈度 > 0.5
    
  高潮层:
    名称: 铜管层
    文件: combat_brass.wav
    音量: 0.0
    触发条件: 战斗激烈度 > 0.8
    
  过渡设置:
    淡入时间: 2秒
    淡出时间: 3秒
    同步点: 小节边界
```

### 音乐状态机

```yaml
音乐状态机:
  状态:
    探索:
      音乐: explore_theme
      节奏: 80 BPM
      情绪: 平静
      
    战斗:
      音乐: combat_theme
      节奏: 140 BPM
      情绪: 紧张
      进入条件: 进入战斗
      退出条件: 战斗结束5秒
      
    Boss战:
      音乐: boss_theme
      节奏: 160 BPM
      情绪: 史诗
      进入条件: Boss出现
      退出条件: Boss死亡
      
    胜利:
      音乐: victory_fanfare
      持续: 10秒
      下一状态: 探索
      
    死亡:
      音乐: death_theme
      持续: 5秒
      下一状态: 游戏结束
      
  过渡规则:
    探索 → 战斗: 立即切换
    战斗 → 探索: 5秒淡出
    战斗 → Boss战: 同步过渡
    任意 → 死亡: 立即切换
```

## 空间音频

### 3D音效配置

```yaml
3D音效设置:
  空间混合:
    2D音效: 0.0 (UI音效/全局音乐)
    3D音效: 1.0 (环境音效/物体音效)
    混合: 0.5-0.9 (玩家相关音效)
    
  距离衰减:
    模式: 对数衰减
    最小距离: 1米 (无衰减)
    最大距离: 50米 (完全静音)
    
  遮挡系统:
    启用: true
    射线检测频率: 每帧
    遮挡衰减: -6dB/墙
    低通滤波: 根据遮挡程度
    
  混响系统:
    区域类型:
      - 室外: 干燥
      - 室内: 中等混响
      - 洞穴: 长混响
      - 大厅: 大空间混响
```

## 音频管理器实现

```csharp
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }
    
    [Header("Audio Pools")]
    [SerializeField] private int sfxPoolSize = 20;
    [SerializeField] private int musicPoolSize = 3;
    
    [Header("Volume Settings")]
    [SerializeField] private float masterVolume = 1.0f;
    [SerializeField] private float musicVolume = 0.8f;
    [SerializeField] private float sfxVolume = 1.0f;
    [SerializeField] private float ambientVolume = 0.6f;
    
    private List<AudioSource> sfxPool;
    private AudioSource musicSource;
    private AudioSource ambientSource;
    
    public void PlaySFX(AudioClip clip, Vector3 position, float volume = 1.0f)
    {
        var source = GetAvailableSFXSource();
        if (source != null)
        {
            source.transform.position = position;
            source.clip = clip;
            source.volume = volume * sfxVolume * masterVolume;
            source.Play();
        }
    }
    
    public void PlayMusic(AudioClip clip, float fadeTime = 1.0f)
    {
        StartCoroutine(CrossFadeMusic(clip, fadeTime));
    }
    
    private IEnumerator CrossFadeMusic(AudioClip newClip, float fadeTime)
    {
        float halfFade = fadeTime / 2;
        
        // Fade out current
        float startVolume = musicSource.volume;
        for (float t = 0; t < halfFade; t += Time.deltaTime)
        {
            musicSource.volume = Mathf.Lerp(startVolume, 0, t / halfFade);
            yield return null;
        }
        
        // Switch clip
        musicSource.clip = newClip;
        musicSource.Play();
        
        // Fade in new
        for (float t = 0; t < halfFade; t += Time.deltaTime)
        {
            musicSource.volume = Mathf.Lerp(0, musicVolume * masterVolume, t / halfFade);
            yield return null;
        }
    }
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要音效系统设计
- 需要自适应音乐
- 需要空间音频实现
- 需要音频性能优化
- 需要混音配置

## 输出保证

- [ ] 完整的音频系统设计
- [ ] 音效配置表
- [ ] 自适应音乐方案
- [ ] 空间音频设置
- [ ] 性能优化建议

---

**记住：好的音频让玩家沉浸在游戏世界中！**
