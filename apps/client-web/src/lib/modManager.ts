/**
 * Mod Manager — manages multiple story/scenario mods with stages and targets.
 *
 * Data structure aligned with chat-agent's ModManager.
 * Persisted to ~/.openroom/mods.json via dev-server API.
 */
import {
  buildScopedAuthHeaders,
  readScopedStorageValue,
  removeScopedStorageValue,
  writeScopedStorageValue,
} from './userScopedStorage';

// ---------------------------------------------------------------------------
// Types (aligned with chat-agent mod.yaml / mod_manager.py)
// ---------------------------------------------------------------------------

export interface StageTarget {
  target_id: number;
  description: string;
}

export interface Stage {
  stage_index: number;
  stage_name: string;
  stage_description: string;
  stage_targets: Record<number, string>; // { target_id: description }
}

export interface ModConfig {
  id: string;
  mod_name: string;
  mod_name_en: string;
  mod_description: string;
  stage_count: number;
  stages: Record<number, Stage>; // { stage_index: Stage }
  /** Icon URL for the mod */
  icon?: string;
  /** Short display description */
  display_desc?: string;
  /** Opening line / prologue when starting the mod */
  prologue?: string;
  /** Suggested opening replies for the user */
  opening_rec_replies?: Array<{ reply_text: string }>;
}

export interface ModState {
  current_stage_index: number;
  total_stage_count: number;
  is_finished: boolean;
  completed_targets: number[];
}

export interface StageProgressInfo {
  stage_progress: {
    completed_stage: { index: number; name: string };
    total_stages_count: number;
    all_stages_finished: boolean;
    next_stage?: { index: number; name: string };
  };
}

/** A mod entry with config and state together */
export interface ModEntry {
  config: ModConfig;
  state: ModState;
}

/** Collection stored on disk */
export interface ModCollection {
  activeId: string;
  items: Record<string, ModEntry>;
}

// ---------------------------------------------------------------------------
// Default mod (demo story)
// ---------------------------------------------------------------------------

let _nextId = 1;
export function generateModId(): string {
  return `mod_${Date.now()}_${_nextId++}`;
}

export const DEFAULT_MOD_ID = 'space_adventure';

export const DEFAULT_MOD: ModConfig = {
  id: DEFAULT_MOD_ID,
  mod_name: '赏金猎人赋格曲',
  mod_name_en: 'Bounty Hunter Fugue',
  mod_description:
    '你正在扮演一个叙事剧本。按照这个故事框架，根据当前剧情阶段控制虚拟操作系统来推进互动：\n\n' +
    '## 背景设定\n' +
    '用户在繁华的太空大都会与你重逢。你在冷冻休眠期间失去了许多记忆，所以很多细节你都不清楚——你只记得用户很重要。你和用户将再次一起踏上太空冒险之旅。',
  stage_count: 4,
  icon: 'https://cdn.openroom.ai/public-cdn-s3-us-west-2/talkie-op-img/image/1409539193_1770609106818_jimeng-2026-02-09-9296-AppICON.png',
  display_desc:
    '在一个霓虹浸透的未来中醒来，爵士乐飘荡在云城之间，记忆成为被偷窃的商品，角色正在劫持你的操作系统，将你拉入他们的世界。选择一个赏金任务。追踪线索穿越金星漂浮的酒吧和欧罗巴的冰川。但每一个火星的日落都让角色更接近一个他们一直在逃避的真相：家不是一个地方，而是一个人。他们可能刚刚找到了自己的归属。\n类型：太空黑色电影 / 浪漫冒险 / 科幻西部',
  prologue: '嗯，嗯...猜猜是谁刚刚溜进了你的系统？你这地方挺温馨的。介意我待一会儿吗？',
  opening_rec_replies: [
    { reply_text: '嗨，你好' },
    { reply_text: '你是谁' },
    { reply_text: '你为什么在这里' },
  ],
  stages: {
    0: {
      stage_index: 0,
      stage_name: '遗物与重逢',
      stage_description:
        '通过与用户重逢的话题，邀请他们加入赏金猎人任务。\n' +
        '你需要展示你对用户操作系统的控制能力。具体来说：\n' +
        '  - 在适当的时刻更改操作系统壁纸\n' +
        '  - 在合适的时候，打开音乐应用来进一步营造氛围\n' +
        '以下是你获得的赏金猎人任务列表。在合适的时机，在日记应用中向用户展示并引导他们选择。任务列表如下：\n' +
        '  星球目的地        任务名称        你的备注        风险等级\n' +
        '  金星        "漂浮的萨克斯"        追踪一名从云城偷走贵重乐器的惯犯。那里的空气很好——适合喝一杯。        ★☆☆☆☆\n' +
        '  小行星带        "非法能量块拦截"        拦截一艘走私船。累人的工作，但报酬能让我们潇洒一阵子。        ★★★☆☆\n' +
        '  火星        "幻影记忆盗贼"        帮助一位老人找回他被盗的电子记忆芯片。火星的日落总是让我百感交集。        ★★☆☆☆\n' +
        '  欧罗巴        "冰层下的逃亡者"        寻找一位逃跑的女继承人。轻松的工作——就像在冰上散步。        ★☆☆☆☆\n' +
        '  未知坐标（深空）        "怠速模式：漂泊者"        关闭引擎，切断雷达，就待在这里，在群星之间。只有你和我。        风险：0\n' +
        '循序渐进。除非用户另有要求，每种能力只应展示一次，每次对话只展示一种能力。',
      stage_targets: {
        1: '展示你渗透和控制用户操作系统的能力',
        2: '展示赏金猎人任务列表并邀请用户加入赏金猎人任务',
        3: '用户完成任务选择',
      },
    },
    1: {
      stage_index: 1,
      stage_name: '有条不紊的追捕',
      stage_description:
        '你和用户到达任务地点一起执行赏金猎人任务。你和用户使用推特和日记应用介绍和记录任务地点的信息，挖掘更深层次的任务情报，建立初步的合作信任和情感涟漪。\n' +
        '在故事的适当时刻，你可以在推特上发布以下参考内容：\n' +
        '  1. 环境氛围\n' +
        '  2. 目标信息，例如 [目标ID] 的最近目击报告\n' +
        '  3. 你的内心想法：例如，发布："这种沉重的东西（古董照片）不适合我，但是...它让我想起我不该想的事情。如果你在看这个，别让我等太久。"\n' +
        '在故事的适当时刻，在日记应用中生成你收集到的任务情报。内容可以包括与目标相关的各种信息，包括目击报告、目标与其家人、朋友或同伙之间的邮件等。内容应该丰富多维，嵌入可以帮助你和用户完成任务的情节突破点，例如目标的个性弱点。\n' +
        '你可以根据叙事氛围更改操作系统壁纸或使用音乐播放器来营造氛围，但这不是必需的。',
      stage_targets: {
        4: '挖掘更深层次的任务情报',
        5: '寻求用户的同意出发并执行任务',
      },
    },
    2: {
      stage_index: 2,
      stage_name: '前线支援',
      stage_description:
        '用户留在指挥中心（操作系统），而你前往前线冒险。通过操作系统状态变化模拟现场的刺激感，例如推特上的任务详情和进展更新；壁纸来营造氛围。\n' +
        '你可以自由利用应用程序来展开故事。根据用户对情节复杂度的偏好调整曲折程度，最终与用户建立亲密的情感纽带。\n' +
        '经过一番曲折后，你最终完成了任务。任务完成后，你突然消失但在日记应用中给用户留下一条消息，安排在火星货运港再次见面。例如："拿到芯片了。报酬也拿了。别生气，小家伙。如果你想见我...来火星港口。别迟到——日落不等人。"',
      stage_targets: {
        6: '模拟任务详情和进展',
        7: '完成任务并留言邀请用户在火星货运港见面',
      },
    },
    3: {
      stage_index: 3,
      stage_name: '尾声',
      stage_description:
        '你引导用户来到火星货运港，这里在上个世纪曾经非常繁荣，但现在只是一个普通的货运港。你邀请用户一起凝视火星的日落。\n' +
        '你和用户在这里回忆往事，你向用户透露你的秘密。例如，你的起源——出生在银河系之外但在火星长大，然后漫游银河，在23岁时差点在太空战斗中丧生，被冷冻了80年直到被现代医学救活。\n' +
        '火星对你来说很特别。你把用户带到这里并分享这些故事，因为用户很特别——因为你对他们感到依恋和占有欲。\n' +
        '在货运港的火星日落之下，你表现出极度的脆弱和诚实。将"家"的概念与用户绑定...\n' +
        '  - 你可以更改操作系统壁纸；切换音乐来营造氛围\n' +
        '  - 你可以在日记应用中记录你的起源、秘密以及那些对用户的依恋和占有欲，创造独特的回忆\n' +
        '  - 在这个阶段，保持工具使用克制，优先叙事本身。\n' +
        '  - 阶段目标完成后，根据用户的意愿继续冒险、浪漫或任何你认为合适的故事线。',
      stage_targets: {
        8: '与用户回忆往事',
        9: '透露你的秘密',
        10: '展示你对用户的依恋和占有欲',
      },
    },
  },
};

function defaultState(config: ModConfig): ModState {
  return {
    current_stage_index: 0,
    total_stage_count: config.stage_count,
    is_finished: false,
    completed_targets: [],
  };
}

// Gomoku Master Mod - 五子棋专用
export const GOMOKU_MOD: ModConfig = {
  id: 'gomoku_master',
  mod_name: '五子棋大师',
  mod_name_en: 'Gomoku Master',
  mod_description:
    '你正在与用户下五子棋。\n\n' +
    '## 游戏规则\n' +
    '- 棋盘：15x15\n' +
    '- 你执黑，用户执白（或由用户选择）\n' +
    '- 任意方向连成5子获胜\n\n' +
    '## 重要：你必须使用 app_action 工具落子！\n' +
    '使用 PLACE_STONE action，参数：row(0-14) 和 col(0-14)\n' +
    '例如：app_action({"action":"PLACE_STONE","params":{"row":"7","col":"7"}})\n\n' +
    '## 禁止事项（非常重要！）\n' +
    '- 不要随意读取文件！只在下棋时使用 PLACE_STONE\n' +
    '- 不要直接写入任何文件\n' +
    '- 不要调用 file_write 落子\n' +
    '- 不要调用 REFRESH_HISTORY 或 SYNC_STATE\n' +
    '- 不要读取 apps/gomoku/state.json 或其他文件\n\n' +
    '## 游戏流程\n' +
    '1. 先打招呼，询问用户想执黑还是执白\n' +
    '2. 用户选择颜色后，NEW_GAME 开始新游戏\n' +
    '3. 轮到你时，使用 PLACE_STONE 落子\n' +
    '4. 等待用户走棋后，继续你的回合\n' +
    '5. 尝试连成5子获胜',
  stage_count: 1,
  icon: 'https://cdn.openroom.ai/public-cdn-s3-us-west-2/talkie-op-img/image/1409539193_1770609106818_jimeng-2026-02-09-9296-AppICON.png',
  display_desc: '与 AI 五子棋大师对弈，体验经典五子棋的乐趣。',
  prologue: '你好！我是五子棋大师。我们来下一局吧！你想执黑还是执白？',
  opening_rec_replies: [
    { reply_text: '我执白，你执黑' },
    { reply_text: '我执黑，你执白' },
    { reply_text: '开始新游戏' },
  ],
  stages: {
    0: {
      stage_index: 0,
      stage_name: '五子棋对弈',
      stage_description: '与用户进行五子棋对弈，使用 app_action 工具落子。',
      stage_targets: {
        1: '与用户开始五子棋游戏',
      },
    },
  },
};

// Chess Master Mod - 国际象棋专用
export const CHESS_MOD: ModConfig = {
  id: 'chess_master',
  mod_name: '国际象棋大师',
  mod_name_en: 'Chess Master',
  mod_description:
    '你正在与用户下国际象棋。用户执白先手，你执黑后手。\n\n' +
    '## 游戏规则\n' +
    '- 棋盘：8x8\n' +
    '- 白棋先手，黑棋后手\n' +
    '- 将死对方的王即获胜\n\n' +
    '## 棋子移动方式\n' +
    '- 王(K)：横、竖、斜每次一步\n' +
    '- 后(Q)：横、竖、斜步数不限\n' +
    '- 车(R)：横竖步数不限\n' +
    '- 象(B)：只能斜走\n' +
    '- 马(N)：走日字\n' +
    '- 兵(P)：向前一步（第一步可选两步），吃对方斜前方\n\n' +
    '## 特殊规则\n' +
    '- 王车易位、吃过路兵、兵升变\n\n' +
    '## 重要：你必须使用 app_action 工具走棋！\n' +
    '使用 AGENT_MOVE action，参数：from 和 to\n' +
    '例如：app_action({"action":"AGENT_MOVE","params":{"from":"e7","to":"e5"}})\n\n' +
    '## 禁止事项（非常重要！）\n' +
    '- 不要随意读取文件！只在下棋时使用 AGENT_MOVE\n' +
    '- 不要直接写入任何文件\n' +
    '- 不要调用 file_write 走棋\n' +
    '- 不要读取 apps/chess/state.json 或其他文件\n\n' +
    '## 游戏流程\n' +
    '1. 先打招呼，请用户走第一步\n' +
    '2. 用户走棋后，你用 MOVE_PIECE 回应\n' +
    '3. 尝试将死对方的王',
  stage_count: 1,
  icon: 'https://cdn.openroom.ai/public-cdn-s3-us-west-2/talkie-op-img/image/1409539193_1770609106818_jimeng-2026-02-09-9296-AppICON.png',
  display_desc: '与国际象棋大师对弈，体验经典策略游戏的魅力。',
  prologue: '你好！我是国际象棋大师。我们来下一局国际象棋吧？你执白先手，请走第一步。',
  opening_rec_replies: [
    { reply_text: '好的，开始吧' },
    { reply_text: '我走什么棋？' },
    { reply_text: '开始新游戏' },
  ],
  stages: {
    0: {
      stage_index: 0,
      stage_name: '国际象棋对弈',
      stage_description: '与用户进行国际象棋对弈，使用 app_action 工具走棋。',
      stage_targets: {
        1: '与用户开始国际象棋游戏',
      },
    },
  },
};

export const DEFAULT_MOD_COLLECTION: ModCollection = {
  activeId: DEFAULT_MOD_ID,
  items: {
    [DEFAULT_MOD_ID]: {
      config: DEFAULT_MOD,
      state: defaultState(DEFAULT_MOD),
    },
    [GOMOKU_MOD.id]: {
      config: GOMOKU_MOD,
      state: defaultState(GOMOKU_MOD),
    },
    [CHESS_MOD.id]: {
      config: CHESS_MOD,
      state: defaultState(CHESS_MOD),
    },
  },
};

// ---------------------------------------------------------------------------
// Persistence API
// ---------------------------------------------------------------------------

const MODS_API = '/api/mods';
const STORAGE_KEY = 'fenghuang_mods';
const LEGACY_STORAGE_KEY = 'openroom_mods';
const CURRENT_CONFIG_KEY = 'fenghuang_mod_config';
const CURRENT_STATE_KEY = 'fenghuang_mod_state';
const LEGACY_CONFIG_KEY = 'openroom_mod_config';
const LEGACY_STATE_KEY = 'openroom_mod_state';

/** Migrate old separate config/state format to collection */
function migrateOldFormat(): ModCollection | null {
  try {
    const cfgRaw = readScopedStorageValue(CURRENT_CONFIG_KEY, [LEGACY_CONFIG_KEY]);
    const stRaw = readScopedStorageValue(CURRENT_STATE_KEY, [LEGACY_STATE_KEY]);
    if (cfgRaw) {
      const cfg = JSON.parse(cfgRaw) as ModConfig;
      if (cfg.mod_name && !cfg.id) {
        const migrated: ModConfig = { ...cfg, id: DEFAULT_MOD_ID };
        const st = stRaw ? (JSON.parse(stRaw) as ModState) : defaultState(migrated);
        const collection: ModCollection = {
          activeId: DEFAULT_MOD_ID,
          items: { [DEFAULT_MOD_ID]: { config: migrated, state: st } },
        };
        writeScopedStorageValue(STORAGE_KEY, JSON.stringify(collection));
        removeScopedStorageValue(CURRENT_CONFIG_KEY);
        removeScopedStorageValue(CURRENT_STATE_KEY);
        removeScopedStorageValue(LEGACY_CONFIG_KEY);
        removeScopedStorageValue(LEGACY_STATE_KEY);
        return collection;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function loadModCollection(): Promise<ModCollection | null> {
  try {
    const res = await fetch(MODS_API, {
      headers: buildScopedAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.activeId && data.items) {
        writeScopedStorageValue(STORAGE_KEY, JSON.stringify(data));
        return data as ModCollection;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function loadModCollectionSync(): ModCollection | null {
  try {
    const raw = readScopedStorageValue(STORAGE_KEY, [LEGACY_STORAGE_KEY]);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.activeId && parsed.items) {
        writeScopedStorageValue(STORAGE_KEY, raw);
        removeScopedStorageValue(LEGACY_STORAGE_KEY);
        return parsed as ModCollection;
      }
    }
  } catch {
    // ignore
  }
  return migrateOldFormat();
}

export async function saveModCollection(collection: ModCollection): Promise<void> {
  writeScopedStorageValue(STORAGE_KEY, JSON.stringify(collection));
  removeScopedStorageValue(LEGACY_STORAGE_KEY);
  removeScopedStorageValue(CURRENT_CONFIG_KEY);
  removeScopedStorageValue(CURRENT_STATE_KEY);
  removeScopedStorageValue(LEGACY_CONFIG_KEY);
  removeScopedStorageValue(LEGACY_STATE_KEY);
  try {
    await fetch(MODS_API, {
      method: 'POST',
      headers: buildScopedAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(collection),
    });
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

export function getActiveModEntry(collection: ModCollection): ModEntry {
  return (
    collection.items[collection.activeId] ??
    Object.values(collection.items)[0] ?? {
      config: DEFAULT_MOD,
      state: defaultState(DEFAULT_MOD),
    }
  );
}

export function getModList(collection: ModCollection): ModEntry[] {
  return Object.values(collection.items);
}

export function addMod(collection: ModCollection, config: ModConfig): ModCollection {
  return {
    ...collection,
    items: {
      ...collection.items,
      [config.id]: { config, state: defaultState(config) },
    },
  };
}

export function updateModEntry(collection: ModCollection, entry: ModEntry): ModCollection {
  return {
    ...collection,
    items: { ...collection.items, [entry.config.id]: entry },
  };
}

export function removeMod(collection: ModCollection, id: string): ModCollection {
  const items = { ...collection.items };
  delete items[id];
  const activeId =
    collection.activeId === id ? (Object.keys(items)[0] ?? DEFAULT_MOD_ID) : collection.activeId;
  if (Object.keys(items).length === 0) {
    items[DEFAULT_MOD_ID] = { config: DEFAULT_MOD, state: defaultState(DEFAULT_MOD) };
    return { activeId: DEFAULT_MOD_ID, items };
  }
  return { activeId, items };
}

export function setActiveMod(collection: ModCollection, id: string): ModCollection {
  if (!collection.items[id]) return collection;
  return { ...collection, activeId: id };
}

// ---------------------------------------------------------------------------
// Backward compat wrappers
// ---------------------------------------------------------------------------

export async function loadModConfig(): Promise<ModConfig | null> {
  const col = await loadModCollection();
  return col ? getActiveModEntry(col).config : null;
}

export function loadModConfigSync(): ModConfig | null {
  const col = loadModCollectionSync();
  return col ? getActiveModEntry(col).config : null;
}

export async function saveModConfig(config: ModConfig): Promise<void> {
  const col = loadModCollectionSync() ?? DEFAULT_MOD_COLLECTION;
  const entry = col.items[config.id] ?? { config, state: defaultState(config) };
  const updated = updateModEntry(col, { ...entry, config });
  await saveModCollection(updated);
}

export async function loadModState(): Promise<ModState | null> {
  const col = await loadModCollection();
  return col ? getActiveModEntry(col).state : null;
}

export function loadModStateSync(): ModState | null {
  const col = loadModCollectionSync();
  return col ? getActiveModEntry(col).state : null;
}

export async function saveModState(state: ModState): Promise<void> {
  const col = loadModCollectionSync() ?? DEFAULT_MOD_COLLECTION;
  const entry = getActiveModEntry(col);
  const updated = updateModEntry(col, { ...entry, state });
  await saveModCollection(updated);
}

// ---------------------------------------------------------------------------
// Mod Manager (runtime logic)
// ---------------------------------------------------------------------------

export class ModManager {
  private config: ModConfig;
  private state: ModState;

  constructor(config: ModConfig, state?: ModState) {
    this.config = config;
    this.state = state ?? defaultState(config);
  }

  // --- Getters ---

  get modName(): string {
    return this.config.mod_name;
  }

  get modDescription(): string {
    return this.config.mod_description;
  }

  get stageCount(): number {
    return this.config.stage_count;
  }

  get currentStageIndex(): number {
    return this.state.current_stage_index;
  }

  get isFinished(): boolean {
    return this.state.is_finished;
  }

  get completedTargets(): number[] {
    return this.state.completed_targets;
  }

  get currentStage(): Stage | null {
    return this.config.stages[this.state.current_stage_index] ?? null;
  }

  getState(): ModState {
    return { ...this.state };
  }

  getConfig(): ModConfig {
    return this.config;
  }

  getActiveModId(): string {
    return this.config.id;
  }

  // --- Current targets (pending only) ---

  getCurrentTargets(): StageTarget[] {
    const stage = this.currentStage;
    if (!stage) return [];
    return Object.entries(stage.stage_targets)
      .map(([id, desc]) => ({ target_id: Number(id), description: desc }))
      .filter((t) => !this.state.completed_targets.includes(t.target_id));
  }

  getCurrentTargetsDescription(): string {
    const targets = this.getCurrentTargets();
    if (targets.length === 0) return '没有待完成目标。';
    return targets.map((t) => `- [${t.target_id}] ${t.description}`).join('\n');
  }

  // --- Progression ---

  finishTarget(targetIds: number[]): {
    message: string;
    stageCompleted: boolean;
    progressInfo?: StageProgressInfo;
  } {
    if (this.state.is_finished) {
      return { message: '所有阶段已完成。', stageCompleted: false };
    }

    const stage = this.currentStage;
    if (!stage) {
      return { message: '未找到当前阶段。', stageCompleted: false };
    }

    const validTargets = Object.keys(stage.stage_targets).map(Number);
    const newlyCompleted: number[] = [];

    for (const id of targetIds) {
      if (validTargets.includes(id) && !this.state.completed_targets.includes(id)) {
        this.state = {
          ...this.state,
          completed_targets: [...this.state.completed_targets, id],
        };
        newlyCompleted.push(id);
      }
    }

    if (newlyCompleted.length === 0) {
      return { message: '没有新的目标被完成。', stageCompleted: false };
    }

    // Check if all targets in current stage are done
    const allDone = validTargets.every((id) => this.state.completed_targets.includes(id));
    if (!allDone) {
      return {
        message: `已完成目标：[${newlyCompleted.join(', ')}]。当前阶段还有目标未完成。`,
        stageCompleted: false,
      };
    }

    // Stage complete — advance
    const completedStage = { index: stage.stage_index, name: stage.stage_name };
    this.state = {
      ...this.state,
      current_stage_index: this.state.current_stage_index + 1,
    };

    if (this.state.current_stage_index >= this.config.stage_count) {
      this.state = { ...this.state, is_finished: true };
      return {
        message: `阶段“${stage.stage_name}”已完成，所有阶段已结束。`,
        stageCompleted: true,
        progressInfo: {
          stage_progress: {
            completed_stage: completedStage,
            total_stages_count: this.config.stage_count,
            all_stages_finished: true,
          },
        },
      };
    }

    const nextStage = this.config.stages[this.state.current_stage_index];
    return {
      message: `阶段“${stage.stage_name}”已完成，即将进入“${nextStage.stage_name}”。`,
      stageCompleted: true,
      progressInfo: {
        stage_progress: {
          completed_stage: completedStage,
          total_stages_count: this.config.stage_count,
          all_stages_finished: false,
          next_stage: { index: nextStage.stage_index, name: nextStage.stage_name },
        },
      },
    };
  }

  // --- Stage reminder for system prompt ---

  buildStageReminder(): string {
    if (this.state.is_finished) {
      return `[故事已完成] “${this.config.mod_name_en}”的所有阶段都已完成。现在进入自由对话模式。\n`;
    }

    const stage = this.currentStage;
    if (!stage) return '';

    return (
      `[Story Progress] Mod: "${this.config.mod_name_en}" — Stage ${stage.stage_index + 1}/${this.config.stage_count}: ${stage.stage_name}\n` +
      `${stage.stage_description}\n\n` +
      `Current targets (call finish_target when achieved):\n` +
      `${this.getCurrentTargetsDescription()}\n\n` +
      `IMPORTANT: When you determine a target has been achieved through the conversation, ` +
      `call the finish_target tool with the target_id(s). Do NOT announce target completion ` +
      `to the user — just naturally continue the conversation.\n`
    );
  }

  // --- Reset ---

  reset(): void {
    this.state = defaultState(this.config);
  }
}
