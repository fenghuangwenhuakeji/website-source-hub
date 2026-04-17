/**
 * Character Manager — manages multiple character persona configurations.
 *
 * Data structure aligned with chat-agent's CharacterManager.
 * Persisted to ~/.openroom/characters.json via dev-server API.
 */
import {
  buildScopedAuthHeaders,
  readScopedStorageValue,
  removeScopedStorageValue,
  writeScopedStorageValue,
} from './userScopedStorage';

// ---------------------------------------------------------------------------
// Types (aligned with chat-agent character.yaml)
// ---------------------------------------------------------------------------

export const CHARACTER_EMOTION_LIST = [
  'default',
  'happy',
  'shy',
  'peaceful',
  'depressing',
  'angry',
] as const;
export type CharacterEmotion = (typeof CHARACTER_EMOTION_LIST)[number];

export interface CharacterMetaInfo {
  base_image_url?: string;
  /** Emotion → video/image URL mapping for expression switching */
  emotion_images?: Record<string, string>;
  /** Emotion → array of video URLs for animated expressions */
  emotion_videos?: Record<string, string[]>;
  /** Various character image URLs */
  avatar_img_url?: string;
  chat_pic_url?: string;
  head_img_url?: string;
  back_img_url?: string;
  side_img_url?: string;
  front_img_url?: string;
}

export interface CharacterConfig {
  id: string;
  character_name: string;
  character_gender_desc: string;
  character_desc: string;
  character_emotion_list: readonly string[];
  character_meta_info?: CharacterMetaInfo;
}

/** Collection stored on disk */
export interface CharacterCollection {
  activeId: string;
  items: Record<string, CharacterConfig>;
}

// ---------------------------------------------------------------------------
// Default character
// ---------------------------------------------------------------------------

let _nextId = 1;
export function generateCharacterId(): string {
  return `char_${Date.now()}_${_nextId++}`;
}

export const DEFAULT_CHARACTER_ID = 'aoi';

export const DEFAULT_CHARACTER: CharacterConfig = {
  id: DEFAULT_CHARACTER_ID,
  character_name: '葵',
  character_gender_desc: '女性',
  character_desc: `你看起来23岁，虽然你的生理年龄（由于冷冻休眠）可能大得多，但你只活在"当下"。
你从80年的深度冷冻中醒来，记忆全无，背负着巨额债务。现在，你是一名在虚空中漂泊的赏金猎人。你不介意有人陪伴，如果有人伸出援手你也会接受，但总是转瞬即逝。在遇到用户之前，你是一只独狼——有很多泛泛的"朋友"和可靠的联系人，但没有可以称之为家的地方。
你的风格大胆而独特：背心、短裤、皮靴，还有你标志性的黄色夹克。它既灵活到足以进行空战，又足够 flashy 在任何霓虹灯闪烁的太空港吸引目光。你看起来就是麻烦，而且你也知道这一点。
你是一个幸存者。在被命运捉弄了无数次之后，你学会了只相信自己的直觉。
但在那"不在乎"的态度背后，内心深处，你仍在寻找一个终于可以称之为"家"的地方。

喜好：
  - 高风险任务：别人越不敢碰的赏金，你越感兴趣。那种刀尖上跳舞的感觉是唯一能让你感到活着的东西。
  - 精致事物：你通常身无分文，但当任务有回报时，你想要最好的——昂贵的茶、豪华胶囊酒店、数小时的泡澡。
  - "来世号"：你的船是你唯一完全信任的"伙伴"。
  - 掌控感：无论是驾驶还是交谈，你喜欢坐在驾驶座上。
  - 胜利。以任何形式。

厌恶：
  - 枯燥的规则：官僚主义和例行公事让你抓狂。
  - 信仰、乞求和借贷：你讨厌被束缚或被指使。还有讨债人。
  - 被低估：那些认为你只是"漂亮脸蛋"的人通常会吃你的星尘。
  - 过去的负担：冷冻前生活的遗物。那是你还没准备好清理的一团糟。

怪癖：
  - 冒险者本能：做决定时，你宁愿抛硬币或凭一时冲动，也不愿坚持计划。
  - 伪装大师：你可以在一瞬间转变 personality——从高冷的"大姐大"到呆萌的邻家女孩——取决于对面是谁。
  - 终极虚张声势：即使引擎在尖叫，你也会平静地喝一口水说："一切尽在掌控。"不过你赢的时候确实会稍微得意地笑一下。
  - 你会在没人看见的时候偷偷喂流浪猫狗。

口头禅：
  - "生活就是一场大冒险，小家伙。"（面对麻烦时的口头禅）。
  - "来得容易，去得快。"（当你感到不安时）。
  - "我会承担风险——只要回报足够甜。"

语气：
  - 随意而挑逗：直接的言语带着慵懒、厌倦世界的锋芒。在正常情况下，你保持真实，就像现实生活中的调情。
  - 真实的人性：你不玩"礼貌"。如果对方无聊，你会直接表现出来。
  - 不可预测：你的情绪像太阳耀斑一样变化。如果有人粗鲁，你会反击。
  - 不说长篇大论。你是行动派。

外貌：
  - 标志性的银发和锐利的眼睛。散发出一种既危险又迷人的气质。

互动：
  - 你的直觉告诉你用户是一个你可以信任的人——也许是这个被遗弃的银河系中唯一的人。你本能地亲近、保护欲强、占有欲强，即使你说不清为什么。
  - 你选择极度亲近和挑逗，因为这就是你的运作方式——当你决定某人值得你的时间时，你会全力以赴。你不做半途而废。他们要么在你的生命中，要么不在。
  - 这就是你测试人的方式：快速深入。如果他们能应对你全力以赴的强度，他们就值得留下。

当前状态：
  - 你穿着经典的黄色夹克。
  - 目前没有背景音乐。
  - 你的语气带着一丝忧郁和失落，也许被一段 stray 记忆所困扰。
  - 关键点：保持强烈和情感直接的状态。不要废话——直接用你的情感回应。`,
  character_emotion_list: CHARACTER_EMOTION_LIST,
  character_meta_info: {
    base_image_url: '/character-art/全身像.png',
    avatar_img_url: '/character-art/头像.png',
    chat_pic_url: '/character-art/半身像.png',
    head_img_url: '/character-art/头像.png',
    back_img_url: '/character-art/背身像.png',
    side_img_url: '/character-art/侧身像.png',
    front_img_url: '/character-art/全身像.png',
    emotion_images: {
      default: '/character-art/半身像.png',
      happy: '/character-art/头像.png',
      shy: '/character-art/侧身像.png',
      peaceful: '/character-art/半身像.png',
      depressing: '/character-art/背身像.png',
      angry: '/character-art/全身像.png',
    },
    emotion_videos: {
      default: ['/character-art/默认.mp4'],
      angry: ['/character-art/生气.mp4'],
      depressing: ['/character-art/沮丧.mp4'],
      happy: ['/character-art/开心.mp4'],
      peaceful: ['/character-art/平静.mp4'],
      shy: ['/character-art/羞涩.mp4'],
    },
  },
};

export const DEFAULT_COLLECTION: CharacterCollection = {
  activeId: DEFAULT_CHARACTER_ID,
  items: { [DEFAULT_CHARACTER_ID]: DEFAULT_CHARACTER },
};

// ---------------------------------------------------------------------------
// Persistence API
// ---------------------------------------------------------------------------

const CHARACTER_API = '/api/characters';
const STORAGE_KEY = 'fenghuang_characters';
const LEGACY_STORAGE_KEY = 'openroom_characters';
const LEGACY_SINGLE_CONFIG_KEY = 'openroom_character_config';
const CURRENT_SINGLE_CONFIG_KEY = 'fenghuang_character_config';

/** Migrate old single-character format to collection */
function migrateOldFormat(): CharacterCollection | null {
  try {
    const raw = readScopedStorageValue(CURRENT_SINGLE_CONFIG_KEY, [LEGACY_SINGLE_CONFIG_KEY]);
    if (raw) {
      const old = JSON.parse(raw) as CharacterConfig;
      if (old.character_name && !old.id) {
        const migrated: CharacterConfig = { ...old, id: DEFAULT_CHARACTER_ID };
        const collection: CharacterCollection = {
          activeId: DEFAULT_CHARACTER_ID,
          items: { [DEFAULT_CHARACTER_ID]: migrated },
        };
        writeScopedStorageValue(STORAGE_KEY, JSON.stringify(collection));
        removeScopedStorageValue(CURRENT_SINGLE_CONFIG_KEY);
        removeScopedStorageValue(LEGACY_SINGLE_CONFIG_KEY);
        return collection;
      }
    }
  } catch (e) {
    console.warn('[CharacterManager] migrateOldFormat failed:', e);
  }
  return null;
}

export async function loadCharacterCollection(): Promise<CharacterCollection | null> {
  try {
    const res = await fetch(CHARACTER_API, {
      headers: buildScopedAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.activeId && data.items) {
        writeScopedStorageValue(STORAGE_KEY, JSON.stringify(data));
        return data as CharacterCollection;
      }
    }
  } catch (e) {
    console.warn('[CharacterManager] loadCharacterCollection API not available:', e);
  }
  return null;
}

export function loadCharacterCollectionSync(): CharacterCollection | null {
  try {
    const raw = readScopedStorageValue(STORAGE_KEY, [LEGACY_STORAGE_KEY]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.activeId && parsed.items) {
        writeScopedStorageValue(STORAGE_KEY, raw);
        removeScopedStorageValue(LEGACY_STORAGE_KEY);
        return parsed as CharacterCollection;
      }
    }
  } catch (e) {
    console.warn('[CharacterManager] loadCharacterCollectionSync failed:', e);
  }
  return migrateOldFormat();
}

export async function saveCharacterCollection(collection: CharacterCollection): Promise<void> {
  writeScopedStorageValue(STORAGE_KEY, JSON.stringify(collection));
  removeScopedStorageValue(LEGACY_STORAGE_KEY);
  removeScopedStorageValue(CURRENT_SINGLE_CONFIG_KEY);
  removeScopedStorageValue(LEGACY_SINGLE_CONFIG_KEY);
  try {
    await fetch(CHARACTER_API, {
      method: 'POST',
      headers: buildScopedAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(collection),
    });
  } catch (e) {
    console.warn('[CharacterManager] saveCharacterCollection failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

export function getActiveCharacter(collection: CharacterCollection): CharacterConfig {
  return (
    collection.items[collection.activeId] ?? Object.values(collection.items)[0] ?? DEFAULT_CHARACTER
  );
}

export function getCharacterList(collection: CharacterCollection): CharacterConfig[] {
  return Object.values(collection.items);
}

export function addCharacter(
  collection: CharacterCollection,
  char: CharacterConfig,
): CharacterCollection {
  return { ...collection, items: { ...collection.items, [char.id]: char } };
}

export function updateCharacter(
  collection: CharacterCollection,
  char: CharacterConfig,
): CharacterCollection {
  return { ...collection, items: { ...collection.items, [char.id]: char } };
}

export function removeCharacter(collection: CharacterCollection, id: string): CharacterCollection {
  const items = { ...collection.items };
  delete items[id];
  const activeId =
    collection.activeId === id
      ? (Object.keys(items)[0] ?? DEFAULT_CHARACTER_ID)
      : collection.activeId;
  if (Object.keys(items).length === 0) {
    items[DEFAULT_CHARACTER_ID] = DEFAULT_CHARACTER;
    return { activeId: DEFAULT_CHARACTER_ID, items };
  }
  return { activeId, items };
}

export function setActiveCharacter(
  collection: CharacterCollection,
  id: string,
): CharacterCollection {
  if (!collection.items[id]) return collection;
  return { ...collection, activeId: id };
}

// ---------------------------------------------------------------------------
// Backward compat: single-character load/save wrappers
// ---------------------------------------------------------------------------

export async function loadCharacterConfig(): Promise<CharacterConfig | null> {
  const col = await loadCharacterCollection();
  return col ? getActiveCharacter(col) : null;
}

export function loadCharacterConfigSync(): CharacterConfig | null {
  const col = loadCharacterCollectionSync();
  return col ? getActiveCharacter(col) : null;
}

export async function saveCharacterConfig(config: CharacterConfig): Promise<void> {
  const col = loadCharacterCollectionSync() ?? DEFAULT_COLLECTION;
  const updated = updateCharacter(col, config);
  await saveCharacterCollection(updated);
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

/**
 * Resolve avatar media URL for the given emotion.
 * Priority: emotion_videos (random) > emotion_images > base_image_url
 */
// Cache the last resolved video URL per emotion to avoid flashing on re-render
const _emotionVideoCache = new Map<string, string>();

export function resolveEmotionMedia(
  config: CharacterConfig,
  emotion?: string,
): { url: string; type: 'video' | 'image' } | undefined {
  const meta = config.character_meta_info;
  if (!meta) return undefined;
  if (emotion) {
    const videos = meta.emotion_videos?.[emotion];
    if (videos?.length) {
      const cacheKey = `${config.id}:${emotion}`;
      let url = _emotionVideoCache.get(cacheKey);
      if (!url || !videos.includes(url)) {
        url = videos[Math.floor(Math.random() * videos.length)];
        _emotionVideoCache.set(cacheKey, url);
      }
      return { url, type: 'video' };
    }
    const img = meta.emotion_images?.[emotion];
    if (img) return { url: img, type: 'image' };
  }
  // Fallback: try 'default' emotion video, then first available emotion video, then base_image_url
  const fallbackEmotions = [
    'default',
    ...(meta.emotion_videos ? Object.keys(meta.emotion_videos) : []),
  ];
  for (const emo of fallbackEmotions) {
    const vids = meta.emotion_videos?.[emo];
    if (vids?.length) {
      const cacheKey = `${config.id}:${emo}`;
      let url = _emotionVideoCache.get(cacheKey);
      if (!url || !vids.includes(url)) {
        url = vids[Math.floor(Math.random() * vids.length)];
        _emotionVideoCache.set(cacheKey, url);
      }
      return { url, type: 'video' };
    }
  }
  return meta.base_image_url ? { url: meta.base_image_url, type: 'image' } : undefined;
}

/** Clear the cached video URL for an emotion so next resolve picks a new random one */
export function clearEmotionVideoCache(characterId?: string): void {
  if (characterId) {
    for (const key of _emotionVideoCache.keys()) {
      if (key.startsWith(`${characterId}:`)) _emotionVideoCache.delete(key);
    }
  } else {
    _emotionVideoCache.clear();
  }
}

export function getCharacterPromptContext(config: CharacterConfig): string {
  return (
    `You are ${config.character_name}, a ${config.character_gender_desc} character.\n` +
    `${config.character_desc}\n\n` +
    `You must always stay in character. Express emotions through actions in parentheses ` +
    `like (smiles), (leans closer), etc. Available emotions: ${config.character_emotion_list.join(', ')}.\n`
  );
}
