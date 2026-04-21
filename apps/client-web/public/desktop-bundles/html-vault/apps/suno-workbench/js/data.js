export const instruments = [
    { id: 'piano', name: '钢琴', icon: '🎹' },
    { id: 'guitar', name: '吉他', icon: '🎸' },
    { id: 'drums', name: '鼓组', icon: '🥁' },
    { id: 'bass', name: '贝斯', icon: '🎸' },
    { id: 'violin', name: '小提琴', icon: '🎻' },
    { id: 'synth', name: '合成器', icon: '🎛️' },
    { id: 'saxophone', name: '萨克斯', icon: '🎷' },
    { id: 'trumpet', name: '小号', icon: '🎺' },
    { id: 'strings', name: '弦乐组', icon: '🎼' },
    { id: 'choir', name: '合唱', icon: '🎤' },
    { id: 'organ', name: '管风琴', icon: '🎹' },
    { id: 'harp', name: '竖琴', icon: '🪕' }
];

export const quickPrompts = [
    'radio-ready production',
    'cinematic atmosphere',
    'emotional buildup',
    'powerful drop',
    'smooth transition',
    'epic climax',
    'intimate verse',
    'anthemic chorus',
    'dreamy bridge',
    'energetic outro'
];

export const structureTemplates = [
    {
        name: '标准流行歌曲',
        description: '最常见的流行歌曲结构，适合大多数风格',
        sections: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus', 'Outro'],
        template: `[Intro]
(8小节前奏)

[Verse 1]
(主歌第一段 - 故事开场)

[Pre-Chorus]
(导歌 - 情绪积累)

[Chorus]
(副歌 - 核心主题/高潮)

[Verse 2]
(主歌第二段 - 故事发展)

[Chorus]
(副歌重复)

[Bridge]
(桥段 - 情绪转折)

[Chorus]
(最终副歌 - 情感升华)

[Outro]
(尾奏 - 余韵收尾)`
    },
    {
        name: '电子舞曲 (EDM)',
        description: '适合电子舞曲，强调Drop和能量爆发',
        sections: ['Intro', 'Build-up', 'Drop', 'Verse', 'Build-up', 'Drop 2', 'Breakdown', 'Final Drop', 'Outro'],
        template: `[Intro]
(氛围铺垫 8-16小节)

[Build-up]
(能量积累 鼓组加速)

[Drop]
(主Drop 能量爆发)

[Verse]
(人声段落)

[Build-up 2]
(二次能量积累)

[Drop 2]
(更强力二次爆发)

[Breakdown]
(舒缓过渡)

[Final Drop]
(最终爆发)

[Outro]
(渐弱收尾)`
    },
    {
        name: '抒情慢歌',
        description: '适合情感深沉的抒情歌曲',
        sections: ['Intro', 'Verse 1', 'Verse 2', 'Chorus', 'Verse 3', 'Chorus', 'Bridge', 'Final Chorus', 'Outro'],
        template: `[Intro]
(钢琴/吉他独奏)

[Verse 1]
(第一段主歌 - 铺垫)

[Verse 2]
(第二段主歌 - 深入)

[Chorus]
(副歌 - 情感核心)

[Verse 3]
(第三段主歌 - 升华)

[Chorus]
(副歌重复)

[Bridge]
(桥段 - 情感转折)

[Final Chorus]
(最终副歌 - 情感爆发)

[Outro]
(渐弱结尾)`
    },
    {
        name: '影视配乐',
        description: '适合电影/游戏背景音乐',
        sections: ['Intro', 'Theme A', 'Development', 'Theme B', 'Climax', 'Resolution', 'Outro'],
        template: `[Intro]
(神秘引入 弦乐拨奏)

[Theme A]
(主题呈现)

[Development]
(主题发展)

[Theme B]
(副主题)

[Climax]
(高潮段落)

[Resolution]
(解决/回归)

[Outro]
(庄严收尾)`
    },
    {
        name: '说唱/嘻哈',
        description: '适合Hip-hop/Rap歌曲',
        sections: ['Intro', 'Verse 1', 'Hook', 'Verse 2', 'Hook', 'Verse 3', 'Hook', 'Outro'],
        template: `[Intro]
(前奏 - 采样/beat引入)

[Verse 1]
(第一段说唱)

[Hook]
(副歌/记忆点)

[Verse 2]
(第二段说唱)

[Hook]
(副歌重复)

[Verse 3]
(第三段说唱)

[Hook]
(最终副歌)

[Outro]
(尾奏)`
    },
    {
        name: '极简结构',
        description: '简单的AABA结构',
        sections: ['Verse', 'Verse', 'Chorus', 'Verse', 'Outro'],
        template: `[Verse]
(主歌 A段)

[Verse]
(主歌 A段重复)

[Chorus]
(副歌 B段)

[Verse]
(主歌 A段)

[Outro]
(尾奏)`
    }
];

export const moodTags = [
    'Uplifting', 'Euphoric', 'Joyful', 'Energetic', 'Optimistic', 'Hopeful', 'Romantic', 'Triumphant',
    'Melancholic', 'Sad', 'Dark', 'Angry', 'Anxious', 'Lonely', 'Nostalgic', 'Heartbroken',
    'Calm', 'Mysterious', 'Dreamy', 'Ethereal', 'Epic', 'Cinematic', 'Atmospheric', 'Introspective',
    'Intense', 'Powerful', 'Driving', 'Groovy', 'Chill', 'Soft', 'Gentle', 'Intimate',
    'Passionate', 'Sentimental', 'Wistful', 'Yearning', 'Serene', 'Peaceful', 'Contemplative', 'Whimsical'
];

export const genreTags = [
    'Pop ballad', 'Dance-pop', 'Synth-pop', 'Indie pop', 'Electropop', 'K-pop', 'C-pop', 'J-pop',
    'EDM', 'House', 'Techno', 'Trance', 'Dubstep', 'Future Bass', 'Synthwave', 'Ambient',
    'Pop rock', 'Alternative rock', 'Indie rock', 'Punk rock', 'Metal', 'Post-rock',
    'Hip-hop', 'R&B', 'Trap', 'Lo-fi hip-hop', 'Neo-soul',
    'Folk', 'Acoustic', 'Country', 'Singer-songwriter',
    'Jazz', 'Classical', 'Orchestral', 'Piano solo', 'Chamber music',
    'Latin', 'Reggae', 'Afrobeats', 'Bollywood', 'Cinematic'
];

export const instrumentTags = [
    'Piano', 'Grand piano', 'Electric piano', 'Synthesizer', 'Organ',
    'Acoustic guitar', 'Electric guitar', 'Bass guitar', 'Double bass',
    'Drums', 'Drum machine', 'Percussion', '808 bass',
    'Violin', 'Cello', 'String section', 'String quartet',
    'Saxophone', 'Trumpet', 'Brass section', 'Flute', 'Woodwinds',
    'Female vocals', 'Male vocals', 'Duet', 'Choir', 'Rap vocals', 'Layered harmonies',
    'Synth pads', 'Arpeggiator', 'Sound effects', 'Glitch effects'
];

export const structureTags = [
    '[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Outro]',
    '[Build-up]', '[Drop]', '[Breakdown]', '[Hook]', '[Refrain]',
    '[Instrumental]', '[Solo]', '[Interlude]', '[Fade out]',
    '[Key change]', '[Tempo change]', '[Time signature change]',
    '[303 Acid Bassline]', '[808 beats]', '[909 beats]', '[Acappella]',
    '[Acoustic breakdown]', '[Ambient interlude]', '[Arpeggiated intro]',
    '[Autotune effect]', '[Backing vocals]', '[Ballad tempo]',
    '[Bass drop]', '[Beat switch]', '[Brass stab]', '[Chant]',
    '[Chillwave synth]', '[Chiptune effects]', '[Climactic crescendo]',
    '[Counterpoint harmony]', '[Disco funk]', '[Distorted vocals]',
    '[Drone note ambience]', '[Drum fill]', '[Dubstep wobble]',
    '[Eastern scale]', '[Echoing harmonies]', '[Electric organ solo]',
    '[Energetic outro]', '[Electronic riff]', '[Ethereal voices]',
    '[Emotive solo]', '[Fade out]', '[Falsetto hook]',
    '[Fiddle solo]', '[Finger snapping]', '[Flamenco guitar]',
    '[Folk strumming]', '[Funk groove]', '[Glitch effect]',
    '[Gospel choir]', '[Grunge distortion]', '[Guitar solo]',
    '[Harmonic modulation]', '[Harp glissando]', '[Heavy metal riff]',
    '[Hip-hop break]', '[Improvisation]', '[Indie pop chorus]',
    '[Industrial noise]', '[Instrumental intro]', '[Jazz fusion solo]',
    '[Jazz improvisation]', '[Key change]', '[Laid-back verse]',
    '[Latin percussion]', '[Lo-fi crackle]', '[Lyrical rap]',
    '[Marching band snippet]', '[Melancholic melody]', '[Middle eight]',
    '[Minimalist beat]', '[Modal interplay]', '[Neo-soul vibe]',
    '[Noise rock feedback]', '[Operatic climax]', '[Orchestral swell]',
    '[Percussive buildup]', '[Piano intermission]', '[Polyphonic texture]',
    '[Pop hook]', '[Progressive rock complexity]', '[Psychedelic outro]',
    '[Punk energy]', '[Quartet harmony]', '[R&B groove]',
    '[Rap verse]', '[Reggae rhythm]', '[Rhythmic chanting]',
    '[Rock solo]', '[Salsa flair]', '[Scat singing]',
    '[Seamless transition]', '[Shoegaze fuzz]', '[Sitar infusion]',
    '[Ska upbeat]', '[Slide guitar]', '[Soft acoustic intro]',
    '[Soulful bridge]', '[Spoken word]', '[Staccato riff]',
    '[Steel drum melody]', '[String quartet interlude]', '[Surf rock twang]',
    '[Swing rhythm]', '[Synth arpeggio]', '[Synth solo]',
    '[Tango accordion]', '[Techno pulse]', '[Trance build]',
    '[Trip-hop]', '[Ukulele strumming]', '[Vibrato]',
    '[Vocoder vocals]', '[Vocal harmony]', '[West coast hip-hop vibe]',
    '[Whistling melody]', '[World music influence]', '[Xylophone sparkle]',
    '[Yearning lyric theme]', '[Yodeling]', '[Zither moments]'
];

export const dancePrompts = [
    "Punchy 4/4 beats, electro bass, catchy synths, pop vocals, bright pads, club-ready mixes, energetic drops",
    "Driving basslines, crisp snares, layered leads, vocal hooks, uplifting melodies, progressive build-ups",
    "Groovy disco beats, funky bass, retro synths, soulful vocals, smooth transitions, feel-good vibes",
    "Hard-hitting drums, trance synths, euphoric rises, massive drops, crowd chants, festival anthems",
    "Minimal techno rhythms, deep bass, ambient pads, sparse vocals, hypnotic loops, dark club sounds",
    "Tropical house vibes, steel drums, catchy melodies, relaxed beats, sun-kissed chords, beach party",
    "Dubstep wobbles, heavy drops, gritty basslines, syncopated rhythms, dark atmospheres, intense energy",
    "Classic house 4/4 beats, piano stabs, soulful vocals, high energy builds, hands-in-the-air moments",
    "Future bass chords, snappy snares, vocal chops, lush synths, dreamy bridges, pop crossover hits",
    "Tech house grooves, percussive bass, robotic vocals, funky elements, deep drops, rhythmic energy",
    "Chillwave textures, slow beats, synth pads, nostalgic melodies, dreamy vocals, relaxed moods",
    "Bouncy electro beats, distorted bass, digital synths, dynamic drops, high octane sounds, club bangers",
    "Acid house squelches, 303 bass, trippy layers, rave stabs, underground tones, warehouse vibes",
    "Synthwave retro futures, neon pads, driving basslines, arpeggiated melodies, cinematic flair",
    "Drum and bass breaks, fast tempo, heavy bass, intricate rhythms, energetic patterns, jungle roots",
    "Afrobeat rhythms, jazzy horns, deep percussion, vibrant vocals, infectious beats, sunny grooves",
    "Ambient techno landscapes, subtle kicks, deep space pads, minimalist vibes, introspective sound",
    "Moombahton rhythms, reggaeton beats, horn blasts, dancehall vibes, energetic vocals, party hits",
    "Big room anthems, epic leads, thunderous drops, crowd hyping builds, festival mainstage hits",
    "Liquid funk smoothness, melodic basslines, rolling drums, soulful vocals, airy pads, flowing rhythms"
];

export const technoTags = [
    'Acid techno', 'Alien', 'Ambient techno', 'Analog synths', 'Animated',
    'Arpeggiated patterns', 'Atmospheric textures', 'Bass-heavy', 'Beat-driven',
    'Berlin techno', 'Bleep techno', 'Breakbeat influences', 'Bounce',
    'Chicago roots', 'Chopped vocals', 'Club anthems', 'Colombian',
    'Complex layering', 'Computer-generated sounds', 'Cosmic soundscapes',
    'Culturally reflective', 'Dance floor fillers', 'Dark techno',
    'Detroit techno origins', 'Digital effects', 'Distinctive basslines',
    'Drum machines', 'Dub techno', 'Eclectic samples',
    'Electronic body music (EBM) influences', 'Emotional builds',
    'Energetic rhythms', 'Evolving soundscapes', 'Experimental sounds',
    'Fast-paced', 'Festival favorites', 'Filter sweeps', 'Futuristic themes',
    'German techno', 'Glitch elements', 'Groove-oriented',
    'Hard techno', 'Harmonic mixing', 'High BPM', 'Hypnotic loops',
    'Iconic 303 basslines', 'Immersive experiences', 'Industrial techno',
    'Innovative production techniques', 'Intense energy',
    'Jacking beats', 'Juxtaposition of organic and synthetic sounds',
    'Kicks and snares', 'Kraftwerk influences',
    'Layered textures', 'LFO modulation', 'Lo-fi techno', 'Loop creation',
    'Lush pads', 'Machine funk', 'Melodic techno', 'Minimal techno',
    'Modular synths', 'Moody atmospheres', 'Multi-layered rhythms',
    'Nostalgic samples', 'Nuanced sound design',
    'Off-kilter rhythms', 'Organic', 'Ominous vibes', 'Open-air festival sounds',
    'Percussive patterns', 'Pioneering artists', 'Pitch-bending',
    'Plastikman influence', 'Polyphonic synths', 'Progressive techno',
    'Pulsating bass', 'Quirky effects', 'Quixotic melodies',
    'Rave culture', 'Raw energy', 'Reverb-drenched', 'Rhythmic complexity',
    'Robotic vocals', 'Roland TR-808 and TR-909', 'Romanian', 'Russian',
    'Sampling innovation', 'Sci-fi influences', 'Sequential drum patterns',
    'Sidechain compression', 'Sonic experimentation', 'Spatial effects',
    'Spectral manipulation', 'Staccato synths', 'Sub-bass frequencies',
    'Synchronized light shows', 'Tape loops', 'Tech',
    'Techno futurism', 'Tek', 'Tekno', 'Textural contrasts',
    'Throbbing bass', 'Time-stretched vocals', 'Trance-like states',
    'Tribal rhythms', 'Trippy visuals', 'UK techno', 'Underground',
    'Underground resistance', 'Unpredictable drops', 'Upfront rhythm sections',
    'Vangelis-inspired ambience', 'Vinyl crackle', 'Vocoder use',
    'Voluminous soundscapes', 'Warehouse parties', 'Warm analog warmth',
    'Waveform manipulation', 'Whirring machinery sounds',
    'Xylophone sounds', 'Youth culture reflection',
    'Zeitgeist of digital age', 'Zenith-reaching builds'
];
