// Generated from src/public/app.ts
// @ts-nocheck
const __AGENT_STUDIO_FILE_MODE__ = window.location.protocol === 'file:';
const __AGENT_STUDIO_NATIVE_FETCH__ = window.fetch.bind(window);

if (__AGENT_STUDIO_FILE_MODE__) {
  const OFFLINE_STORAGE_KEYS = {
    runs: 'agent-studio-offline-runs-v1',
    sessions: 'agent-studio-offline-sessions-v1',
  };

  const OFFLINE_DOMAIN_BUNDLES = {
    writing: {
      id: 'writing',
      label: '鍐欎綔',
      strapline: '浠庣伒鎰熴€佽瀹氬埌闀跨瘒缁啓鐨勪竴浣撳寲鍒涗綔娴?',
      description: '閫傚悎灏忚銆佷笘鐣岃銆佷汉鐗╁鐧姐€佺画鍐欍€侀噸鍐欏拰鎴愮娑﹁壊銆?',
      defaultAgent: 'narrative-engine-agent',
      coreAgents: [
        'narrative-engine-agent',
        'outline-agent',
        'worldbuilding-agent',
        'dialogue-writer-agent',
        'polish-agent',
        'debug-agent',
      ],
      workflows: {
        single: ['narrative-engine-agent'],
        compose: ['outline-agent', 'narrative-engine-agent', 'dialogue-writer-agent', 'polish-agent'],
        harness: [
          'agent-orchestrator',
          'spec-agent',
          'outline-agent',
          'worldbuilding-agent',
          'narrative-engine-agent',
          'polish-agent',
        ],
      },
      examples: [
        '鍐欎竴涓慨浠欓暱绡囩殑涓夊箷寮忓ぇ绾插拰涓荤嚎鍐茬獊',
        '鎶婂凡鏈夊皬璇寸墖娈垫墿鎴?10 涓繛璐満鏅苟淇濈暀璁板繂',
        '缁欎富瑙掑拰鍙嶆淳閲嶅仛瀵圭櫧銆佹儏缁姬绾垮拰浼忕瑪',
      ],
      recipes: [
        {
          id: 'writing-outline-chain',
          label: '澶х翰鎺ㄨ繘閾?',
          summary: '閫傚悎鍏堝畾缁撴瀯锛屽啀钀藉埌绔犺妭鍜屾鏂囥€?',
          keywords: ['澶х翰', '缁撴瀯', '绔犺妭', 'outline'],
          agentIds: ['outline-agent', 'narrative-engine-agent', 'polish-agent'],
        },
        {
          id: 'writing-continue-chain',
          label: '缁啓寤跺睍閾?',
          summary: '閫傚悎鎵挎帴宸叉湁鐗囨锛屼繚鎸佽姘斾笌璁板繂杩炵画銆?',
          keywords: ['缁啓', '鎺ョ潃鍐?', '寤剁画', '缁х画'],
          agentIds: ['worldbuilding-agent', 'narrative-engine-agent', 'dialogue-writer-agent'],
        },
        {
          id: 'writing-polish-chain',
          label: '娑﹁壊鏀跺彛閾?',
          summary: '閫傚悎鎶婅崏绋垮彉鎴愬彲鐩存帴浜や粯鐨勬垚绋裤€?',
          keywords: ['娑﹁壊', '鏀瑰啓', '浼樺寲', '浜哄懗'],
          agentIds: ['dialogue-writer-agent', 'polish-agent', 'debug-agent'],
        },
      ],
    },
    comics: {
      id: 'comics',
      label: '婕墽',
      strapline: '浠庢晠浜嬨€佽剼鏈埌鍒嗛暅鍜岀敾闈㈡彁绀鸿瘝鐨勬暣鍚堥摼璺?',
      description: '閫傚悎婕敾銆佺煭鍓с€佸垎闀溿€佽瑙夎妭濂忚璁″拰鍥惧儚鎻愮ず璇嶇敓鎴愩€?',
      defaultAgent: 'comic-creator-agent',
      coreAgents: [
        'comic-creator-agent',
        'script-creator-agent',
        'storyboard-agent',
        'character-design-agent',
        'nanobanana-grid-agent',
        'debug-agent',
      ],
      workflows: {
        single: ['comic-creator-agent'],
        compose: [
          'script-creator-agent',
          'storyboard-agent',
          'character-design-agent',
          'comic-creator-agent',
          'nanobanana-grid-agent',
        ],
        harness: [
          'agent-orchestrator',
          'spec-agent',
          'script-creator-agent',
          'storyboard-agent',
          'comic-creator-agent',
          'nanobanana-grid-agent',
        ],
      },
      examples: [
        '鎶婇兘甯傚紓鑳芥晠浜嬪仛鎴?8 鏍兼潯婕柟妗?',
        '鎶婂皬璇寸珷鑺傛敼鎴愮煭鍓ц剼鏈拰鍒嗛暅澶磋〃',
        '缁欏紑鍦轰笁骞曡璁＄敾闈㈣妭濂忓拰缁熶竴瑙嗚鎻愮ず璇?',
      ],
      recipes: [
        {
          id: 'comics-script-board-chain',
          label: '鑴氭湰鍒嗛暅閾?',
          summary: '鍏堟妸鏁呬簨鍘嬫垚鑴氭湰锛屽啀鎷嗘垚鍒嗛暅鍜岄暅澶磋妭濂忋€?',
          keywords: ['鑴氭湰', '鍒嗛暅', '闀滃ご', 'storyboard'],
          agentIds: ['script-creator-agent', 'storyboard-agent', 'comic-creator-agent'],
        },
        {
          id: 'comics-character-visual-chain',
          label: '瑙掕壊瑙嗚閾?',
          summary: '鍏堢粺涓€瑙掕壊璁惧畾锛屽啀鎵╂垚闀滃ご鐢婚潰鍜屾彁绀鸿瘝銆?',
          keywords: ['瑙掕壊', '閫犲瀷', '鏈嶈', '绔嬬粯'],
          agentIds: ['character-design-agent', 'comic-creator-agent', 'nanobanana-grid-agent'],
        },
        {
          id: 'comics-prompt-pack-chain',
          label: '鎻愮ず璇嶆暣鍚堥摼',
          summary: '閫傚悎鎶婂垎闀滅粨鏋滄暣鐞嗘垚鍥惧儚鐢熸垚鎻愮ず璇嶅寘銆?',
          keywords: ['鎻愮ず璇?', '鍥惧儚', '椋庢牸', 'grid'],
          agentIds: ['storyboard-agent', 'nanobanana-grid-agent'],
        },
      ],
    },
  };

  const OFFLINE_AGENT_LIBRARY = {
    'agent-orchestrator': {
      id: 'agent-orchestrator',
      displayName: 'Agent Orchestrator',
      role: 'orchestrator',
      summary: '璐熻矗缁熺娴佺▼銆佸畨鎺掕鑹插拰缁存寔鏁存潯宸ヤ綔娴佺殑鑺傚銆?',
      mission: '鎶婂鏉備换鍔℃媶鎴愭竻鏅伴摼璺紝骞朵繚璇佹瘡涓€姝ラ兘鏈変汉璐熻矗銆?',
      tags: ['workflow', 'planning', 'control-plane'],
      keywords: ['缂栨帓', '璋冨害', 'workflow'],
      sceneTags: ['瑙勫垝'],
      sourcePack: 'offline-studio',
    },
    'spec-agent': {
      id: 'spec-agent',
      displayName: 'Spec Agent',
      role: 'spec-specialist',
      summary: '璐熻矗鏀跺彛鐩爣銆佽竟鐣屻€佽緭鍏ヨ緭鍑哄拰楠屾敹鏍囧噯銆?',
      mission: '鍏堟妸闇€姹傝娓呮锛屽啀寮€濮嬫墽琛屻€?',
      tags: ['spec', 'requirements'],
      keywords: ['spec', '瑙勬牸', '闇€姹?'],
      sceneTags: ['瑙勫垝'],
      sourcePack: 'offline-studio',
    },
    'plan-agent': {
      id: 'plan-agent',
      displayName: 'Plan Agent',
      role: 'planning-specialist',
      summary: '璐熻矗鎶婄洰鏍囨媶鎴愬彲鎵ц椤哄簭鍜岄噷绋嬬銆?',
      mission: '缁欏鏉備换鍔′竴涓ǔ瀹氥€佽兘缁窇鐨勮鍒掋€?',
      tags: ['plan', 'milestone'],
      keywords: ['璁″垝', '閲岀▼纰?'],
      sceneTags: ['瑙勫垝'],
      sourcePack: 'offline-studio',
    },
    'narrative-engine-agent': {
      id: 'narrative-engine-agent',
      displayName: 'Narrative Engine Agent',
      role: 'story-specialist',
      summary: '璐熻矗涓诲彊浜嬫帹杩涖€佺珷鑺傝惤鍦板拰姝ｆ枃鑽夋銆?',
      mission: '鎶婃晠浜嬬洰鏍囪浆鎴愬畬鏁翠笖鍙户缁墿鍐欑殑鏂囨湰楠ㄦ灦銆?',
      tags: ['writing', 'story', 'draft'],
      keywords: ['灏忚', '鏁呬簨', '姝ｆ枃', '缁啓'],
      sceneTags: ['鍐欎綔'],
    },
    'outline-agent': {
      id: 'outline-agent',
      displayName: 'Outline Agent',
      role: 'structure-specialist',
      summary: '璐熻矗澶х翰銆佸箷娆＄粨鏋勩€佺珷鑺傚垎閰嶅拰鑺傚楠ㄦ灦銆?',
      mission: '鍏堢ǔ浣忕粨鏋勶紝鍐嶈缁嗚妭灞曞紑銆?',
      tags: ['outline', 'structure'],
      keywords: ['澶х翰', '缁撴瀯', '绔犺妭'],
      sceneTags: ['鍐欎綔'],
    },
    'worldbuilding-agent': {
      id: 'worldbuilding-agent',
      displayName: 'Worldbuilding Agent',
      role: 'world-specialist',
      summary: '璐熻矗涓栫晫瑙傘€佽鍒欍€佽儗鏅€佸娍鍔涘拰璁惧畾绾︽潫銆?',
      mission: '璁╂枃鏈垨鐢婚潰寤虹珛鍦ㄧǔ瀹氱殑涓栫晫瑙勫垯涓娿€?',
      tags: ['worldbuilding', 'setting'],
      keywords: ['涓栫晫瑙?', '璁惧畾', '瑙勫垯'],
      sceneTags: ['鍐欎綔'],
    },
    'dialogue-writer-agent': {
      id: 'dialogue-writer-agent',
      displayName: 'Dialogue Writer Agent',
      role: 'dialogue-specialist',
      summary: '璐熻矗瀵圭櫧銆佽姘斿樊寮傚拰浜虹墿璇磋瘽鏂瑰紡銆?',
      mission: '璁╀汉鐗╁紑鍙ｆ椂灏辫兘琚鑰呭垎杈ㄣ€?',
      tags: ['dialogue', 'character'],
      keywords: ['瀵圭櫧', '瀵硅瘽', '鍙拌瘝'],
      sceneTags: ['鍐欎綔'],
    },
    'polish-agent': {
      id: 'polish-agent',
      displayName: 'Polish Agent',
      role: 'polish-specialist',
      summary: '璐熻矗娑﹁壊銆佸幓 AI 鎰熴€佺粺涓€璇皵鍜屼氦浠樻敹鍙ｃ€?',
      mission: '鎶婅崏绋挎暣鐞嗘垚鏇寸ǔ鏇撮『鐨勬垚鍝佹枃鏈€?',
      tags: ['polish', 'editing'],
      keywords: ['娑﹁壊', '鏀瑰啓', '浼樺寲'],
      sceneTags: ['鍐欎綔'],
    },
    'comic-creator-agent': {
      id: 'comic-creator-agent',
      displayName: 'Comic Creator Agent',
      role: 'comic-specialist',
      summary: '璐熻矗鎶婃晠浜嬬粍缁囨垚婕敾/婕墽鍙墽琛岀殑鐢婚潰鏂规銆?',
      mission: '缁熶竴鏁呬簨鑺傚銆佺敾闈㈤噸鐐瑰拰鍙鍖栬〃杈俱€?',
      tags: ['comic', 'panel', 'visual'],
      keywords: ['婕敾', '鏉℃极', '鐢婚潰'],
      sceneTags: ['婕墽'],
    },
    'script-creator-agent': {
      id: 'script-creator-agent',
      displayName: 'Script Creator Agent',
      role: 'script-specialist',
      summary: '璐熻矗鎶婃晠浜嬪帇鎴愬垎鍦恒€佽剼鏈拰闀滃ご浜嬩欢銆?',
      mission: '璁╂极鍓ч」鐩厛鏈夋竻鏅扮殑鑴氭湰楠ㄦ灦銆?',
      tags: ['script', 'scene'],
      keywords: ['鑴氭湰', '鍒嗗満', '鍦烘櫙'],
      sceneTags: ['婕墽'],
    },
    'storyboard-agent': {
      id: 'storyboard-agent',
      displayName: 'Storyboard Agent',
      role: 'storyboard-specialist',
      summary: '璐熻矗闀滃ご璇█銆佹瀯鍥俱€佽妭濂忓拰鍒嗛暅椤哄簭銆?',
      mission: '鎶婃枃瀛楁柟妗堝彉鎴愬彲瑙嗛暅澶撮摼銆?',
      tags: ['storyboard', 'camera'],
      keywords: ['鍒嗛暅', '闀滃ご', '鏋勫浘'],
      sceneTags: ['婕墽'],
    },
    'character-design-agent': {
      id: 'character-design-agent',
      displayName: 'Character Design Agent',
      role: 'character-specialist',
      summary: '璐熻矗瑙掕壊閫犲瀷銆佺壒寰佺粺涓€鍜岃瑙夎蹇嗙偣銆?',
      mission: '纭繚瑙掕壊浠庢枃瀛楀埌鐢婚潰閮戒笉婕傜Щ銆?',
      tags: ['character', 'design'],
      keywords: ['瑙掕壊', '閫犲瀷', '绔嬬粯'],
      sceneTags: ['婕墽', '瑙掕壊璁捐'],
    },
    'nanobanana-grid-agent': {
      id: 'nanobanana-grid-agent',
      displayName: 'Nanobanana Grid Agent',
      role: 'prompt-specialist',
      summary: '璐熻矗鍥惧儚鎻愮ず璇嶇煩闃点€侀鏍肩粺涓€鍜岀礌鏉愭壒閲忓寲銆?',
      mission: '鎶婅瑙夎姹傛暣鐞嗘垚鍙壒閲忕敓鎴愮殑鎻愮ず璇嶇粨鏋勩€?',
      tags: ['prompt', 'image', 'grid'],
      keywords: ['鎻愮ず璇?', '椋庢牸', '鍥惧儚'],
      sceneTags: ['婕墽', '澶氭ā鎬?'],
    },
    'debug-agent': {
      id: 'debug-agent',
      displayName: 'Debug Agent',
      role: 'review-specialist',
      summary: '璐熻矗璇嗗埆椋庨櫓銆佽ˉ娴嬭瘯鐐广€佸皝鍙ｆ槑鏄剧己闄枫€?',
      mission: '璁╂渶缁堢粨鏋滃湪浜や粯鍓嶆洿绋充竴浜涖€?',
      tags: ['debug', 'review', 'quality'],
      keywords: ['椋庨櫓', '鏍￠獙', '闂'],
      sceneTags: ['瑙勫垝'],
      sourcePack: 'offline-studio',
    },
  };

  function offlineText(value) {
    return String(value || '').trim();
  }

  function offlineNowIso() {
    return new Date().toISOString();
  }

  function offlineUnique(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  function offlineCompact(value, maxLength = 96) {
    const text = offlineText(value).replace(/\s+/gu, ' ');
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  function offlineInferDomainId(prompt) {
    const content = offlineText(prompt).toLowerCase();
    return /(婕敾|婕墽|鍒嗛暅|鑴氭湰|闀滃ご|comic|storyboard|script|grid)/iu.test(content) ? 'comics' : 'writing';
  }

  function offlineGetDomainBundle(domainId, prompt = '') {
    if (domainId === 'comics') return OFFLINE_DOMAIN_BUNDLES.comics;
    if (domainId === 'writing') return OFFLINE_DOMAIN_BUNDLES.writing;
    return OFFLINE_DOMAIN_BUNDLES[offlineInferDomainId(prompt)] || OFFLINE_DOMAIN_BUNDLES.writing;
  }

  function offlineReadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function offlineWriteStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function offlineReadRuns() {
    return offlineReadStorage(OFFLINE_STORAGE_KEYS.runs, []);
  }

  function offlineWriteRuns(runs) {
    offlineWriteStorage(OFFLINE_STORAGE_KEYS.runs, runs);
  }

  function offlineReadSessions() {
    return offlineReadStorage(OFFLINE_STORAGE_KEYS.sessions, []);
  }

  function offlineWriteSessions(sessions) {
    offlineWriteStorage(OFFLINE_STORAGE_KEYS.sessions, sessions);
  }

  function offlineMakeId(prefix) {
    if (window.crypto?.randomUUID) {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function offlineClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function offlineDescriptor(agentId) {
    const descriptor = OFFLINE_AGENT_LIBRARY[agentId];
    return descriptor ? offlineClone(descriptor) : null;
  }

  function offlineSerializeDescriptor(agentId) {
    const descriptor = offlineDescriptor(agentId);
    if (!descriptor) return null;
    return {
      ...descriptor,
      runtime: {
        entry: 'browser-offline',
        fallbackEntry: 'browser-offline',
        sharedRuntime: 'browser-offline',
      },
      sourceRepo: '',
      sourceFile: '',
      category: 'portable-offline',
      workspaceScope: 'local-browser',
      hasSkillFile: true,
    };
  }

  function offlineListAllAgents() {
    return Object.keys(OFFLINE_AGENT_LIBRARY)
      .sort((left, right) => left.localeCompare(right, 'en'))
      .map((agentId) => offlineSerializeDescriptor(agentId))
      .filter(Boolean);
  }

  function offlineListDomainAgents(domainId, prompt = '') {
    const bundle = offlineGetDomainBundle(domainId, prompt);
    return offlineUnique(['agent-orchestrator', 'spec-agent', ...(bundle.coreAgents || [])])
      .map((agentId) => offlineSerializeDescriptor(agentId))
      .filter(Boolean);
  }

  function offlineBuildTagIndex(agents) {
    const counts = new Map();
    for (const agent of agents || []) {
      for (const tag of agent.sceneTags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))
      .map(([label, count]) => ({ id: label, label, count }));
  }

  function offlineCollectKeywordHits(prompt, keywords = []) {
    const content = offlineText(prompt).toLowerCase();
    if (!content) return [];
    return offlineUnique(
      keywords
        .map((keyword) => offlineText(keyword).toLowerCase())
        .filter(Boolean)
        .filter((keyword) => content.includes(keyword)),
    );
  }

  function offlineBuildFusion({ domainId, prompt = '', selectedAgentIds = [] } = {}) {
    const bundle = offlineGetDomainBundle(domainId, prompt);
    const sourcePacks = [
      {
        id: 'local-toolkit',
        label: '鏈湴绂荤嚎宸ヤ綔鍖?',
        summary: '娴忚鍣ㄥ唴缃殑绂荤嚎宸ヤ綔娴佷笌浼氳瘽瀛樺偍銆?',
        exists: true,
      },
      {
        id: `${bundle.id}-bundle`,
        label: `${bundle.label}棰嗗煙鍖卄`,
        summary: `褰撳墠浠诲姟鍛戒腑浜?${bundle.label} 鐨勯缃摼璺€俙`,
        exists: true,
      },
    ];

    const recipes = (bundle.recipes || []).map((recipe) => {
      const matchedKeywords = offlineCollectKeywordHits(prompt, recipe.keywords || []);
      const selected = offlineUnique(selectedAgentIds || []);
      const overlapCount = (recipe.agentIds || []).filter((agentId) => selected.includes(agentId)).length;
      const isMatched = Boolean(matchedKeywords.length || overlapCount);
      const score = matchedKeywords.length * 3 + overlapCount;
      return {
        id: recipe.id,
        label: recipe.label,
        summary: recipe.summary,
        sourcePacks: sourcePacks.map((item) => item.label),
        matchedKeywords,
        score,
        isMatched,
        selectedAgentIds: recipe.agentIds || [],
        selectedAgents: (recipe.agentIds || [])
          .map((agentId) => offlineSerializeDescriptor(agentId))
          .filter(Boolean),
      };
    });

    const matchedRecipes = recipes.filter((recipe) => recipe.isMatched);
    const selectedImportedAgentIds = offlineUnique(
      matchedRecipes.flatMap((recipe) => recipe.selectedAgentIds || []),
    );

    return {
      sourcePacks,
      recipes,
      matchedRecipes,
      selectedImportedAgentIds,
      suggestedAgentIds: selectedImportedAgentIds,
      importedAgentCount: selectedImportedAgentIds.length,
    };
  }

  function offlineBuildWorkflowIds({ domainId, mode, selectedAgentIds = [], prompt = '' } = {}) {
    const bundle = offlineGetDomainBundle(domainId, prompt);
    const selected = offlineUnique(selectedAgentIds || []).filter((agentId) => OFFLINE_AGENT_LIBRARY[agentId]);

    if (mode === 'single') {
      return selected.slice(0, 1).length ? selected.slice(0, 1) : [bundle.defaultAgent];
    }

    if (selected.length) {
      if (mode === 'compose') return selected;
      return offlineUnique(['agent-orchestrator', 'spec-agent', ...selected]);
    }

    return bundle.workflows?.[mode] || bundle.workflows?.harness || [bundle.defaultAgent];
  }

  function offlineBuildWorkflow({ domainId, mode, selectedAgentIds = [], prompt = '' } = {}) {
    return offlineBuildWorkflowIds({ domainId, mode, selectedAgentIds, prompt })
      .map((agentId) => offlineDescriptor(agentId))
      .filter(Boolean);
  }

  function offlineSerializeDomainBundle(bundle) {
    return {
      id: bundle.id,
      label: bundle.label,
      strapline: bundle.strapline,
      description: bundle.description,
      examples: bundle.examples,
      workflows: bundle.workflows,
      defaultAgent: bundle.defaultAgent,
      inferredDomainId: '',
      inferredDomainLabel: '',
    };
  }

  function offlineSerializeWorkflow(workflow) {
    return (workflow || []).map((agent) => ({
      id: agent.id,
      displayName: agent.displayName,
      role: agent.role,
      summary: agent.summary,
      mission: agent.mission,
      tags: agent.tags || [],
    }));
  }

  function offlineBuildRouting({ prompt = '', workflow = [], selectedAgentIds = [] } = {}) {
    const keywordUniverse = offlineUnique(
      workflow.flatMap((agent) => agent.keywords || []).concat(['缁х画', '缁啓', '澶х翰', '鑴氭湰', '鍒嗛暅', '娑﹁壊']),
    );
    const matchedKeywords = offlineCollectKeywordHits(prompt, keywordUniverse);
    return {
      source: selectedAgentIds.length ? 'selected' : 'default',
      matchedKeywords,
      carryContext: /(缁х画|鎺ョ潃|寤剁画|缁啓)/iu.test(prompt),
      triggeredAgents: workflow.map((agent, index) => ({
        id: agent.id,
        order: index + 1,
        reason: matchedKeywords.length ? 'keyword' : selectedAgentIds.length ? 'selected' : 'default',
      })),
      consideredAgentCount: Object.keys(OFFLINE_AGENT_LIBRARY).length,
    };
  }

  function offlineBuildRuntimeItems(agentIds, stateLabel) {
    return (agentIds || []).map((agentId) => ({
      id: agentId,
      state: stateLabel,
    }));
  }

  function offlineBuildAgentRuntime({ workflow = [], prompt = '', domainId = 'writing', mode = 'harness', sessionId = '' } = {}) {
    const workflowIds = workflow.map((agent) => agent.id);
    const activeIds = workflowIds.slice(0, Math.min(2, workflowIds.length));
    const activationPoolIds = workflowIds.slice(activeIds.length, Math.min(activeIds.length + 2, workflowIds.length));
    const coolingIds = workflowIds.slice(activeIds.length + activationPoolIds.length);
    const keywords = offlineCollectKeywordHits(
      prompt,
      offlineUnique(workflow.flatMap((agent) => agent.keywords || [])),
    );

    return {
      createdAt: offlineNowIso(),
      updatedAt: offlineNowIso(),
      sessionId,
      domainId,
      mode,
      routeMemory: {
        matchedAgents: workflowIds,
        suggestedAgentIds: workflowIds,
        keywords,
        entities: [],
        carryContext: Boolean(sessionId),
      },
      pools: {
        standby: [],
        activationPool: offlineBuildRuntimeItems(activationPoolIds, 'warm'),
        active: offlineBuildRuntimeItems(activeIds, 'active'),
        cooling: offlineBuildRuntimeItems(coolingIds, 'cooling'),
        frozen: [],
        counts: {
          standby: 0,
          activationPool: activationPoolIds.length,
          active: activeIds.length,
          cooling: coolingIds.length,
          frozen: 0,
        },
      },
      activeAgents: offlineBuildRuntimeItems(activeIds, 'active'),
      activationPool: offlineBuildRuntimeItems(activationPoolIds, 'warm'),
      capabilities: {
        tools: ['offline-storage', 'offline-spec', 'offline-runner'],
        previewModes: ['offline', 'simulation', 'browser'],
        browserPreview: true,
        terminal: false,
        sandbox: false,
        diffPreview: false,
      },
      pets: [],
      dream: {
        enabled: true,
        freezePolicy: 'active -> cooling -> frozen',
        petLifecycle: [],
        activeAgentCount: activeIds.length,
      },
      audit: null,
    };
  }

  function offlineBuildPortableHarness({ workflow = [], prompt = '' } = {}) {
    const lead = workflow.find((agent) => agent.id !== 'agent-orchestrator' && agent.id !== 'spec-agent') || workflow[0] || null;
    const required = workflow.slice(0, Math.min(2, workflow.length)).map((agent, index) => ({
      id: agent.id,
      displayName: agent.displayName,
      role: agent.role,
      level: `L${index + 1}`,
      source: 'offline-browser',
      score: 10 - index,
      backend: 'browser-offline',
    }));
    const suggested = workflow.slice(required.length).map((agent, index) => ({
      id: agent.id,
      displayName: agent.displayName,
      role: agent.role,
      level: `L${index + required.length + 1}`,
      source: 'offline-browser',
      score: Math.max(1, 7 - index),
      backend: 'browser-offline',
    }));

    return {
      version: 'offline-browser-v1',
      mode: 'portable-harness-bootstrap',
      prompt,
      startDir: 'file://local-browser',
      target: lead
        ? {
            id: lead.id,
            displayName: lead.displayName,
            role: lead.role,
            source: 'offline-browser',
            score: 10,
          }
        : null,
      matches: workflow.map((agent, index) => ({
        id: agent.id,
        displayName: agent.displayName,
        role: agent.role,
        level: index < 2 ? `L${index + 1}` : 'L3',
        source: 'offline-browser',
        score: Math.max(1, 8 - index),
        backend: 'browser-offline',
      })),
      activationPlan: {
        complexityScore: Math.min(10, Math.max(2, workflow.length * 2)),
        required,
        suggested,
        recommended: [],
        selective: [],
      },
      backendPolicy: {
        terminal: { mode: 'browser-disabled', isolated: true },
        network: { mode: 'offline-mock', isolated: true },
        multimodal: { mode: 'browser-preview', isolated: true },
        browser: { mode: 'native-file-preview', isolated: false },
        diff: { mode: 'inline-diff-preview', isolated: false },
      },
      toolPool: {
        generatedAt: offlineNowIso(),
        defaultMode: 'browser-offline',
        backendPolicyVersion: 'offline-browser-v1',
        permissionContext: {
          denyNames: ['server', 'node-service'],
          denyPrefixes: ['http://', 'https://'],
        },
        toolCount: 3,
        tools: [
          {
            name: 'offline-storage',
            family: 'storage',
            backend: 'browser',
            simulated: false,
            purpose: '淇濆瓨杩愯涓庝細璇?',
            isolation: 'same-browser-origin',
          },
          {
            name: 'offline-spec',
            family: 'planning',
            backend: 'browser',
            simulated: true,
            purpose: '鏈湴鐢熸垚 SPEC 鑽夋',
            isolation: 'same-browser-origin',
          },
          {
            name: 'offline-runner',
            family: 'generation',
            backend: 'browser',
            simulated: true,
            purpose: '鏈湴鐢熸垚绂荤嚎鑽夋缁撴灉',
            isolation: 'same-browser-origin',
          },
        ],
      },
      lifecycle: {},
      autonomy: {},
      constraints: [
        '褰撳墠澶勪簬绂荤嚎娴忚鍣ㄦā寮忥紝涓嶄細鍚姩 Node 鏈嶅姟銆?',
        '褰撳墠缁撴灉鏉ヨ嚜鏈湴鑽夋寮曟搸锛屼笉浼氳繛鎺ュ閮?LLM銆?',
      ],
      guarantees: {
        sessionPersistence: true,
        browserOnly: true,
      },
      ide: {},
      recommendedNewAgents: [],
    };
  }

  function offlineBuildDrafts(workflow, prompt) {
    const objectiveMap = {
      'agent-orchestrator': '缁熺绂荤嚎宸ヤ綔娴佸苟瀹夋帓鎵ц椤哄簭',
      'spec-agent': '鎶婄洰鏍囥€佽竟鐣屽拰杈撳嚭鏍煎紡鏀跺彛',
      'outline-agent': '鍏堢‘瀹氱粨鏋勫拰绔犺妭鎺ㄨ繘',
      'worldbuilding-agent': '琛ラ綈涓栫晫瑙傚拰鑳屾櫙绾︽潫',
      'narrative-engine-agent': '钀芥垚姝ｆ枃鎴栧墽鎯呬富绾胯崏妗?',
      'dialogue-writer-agent': '琛ュ鐧藉拰浜虹墿璇皵宸紓',
      'polish-agent': '鍋氫氦浠樺墠娑﹁壊鍜屼竴鑷存€ф敹鍙?',
      'script-creator-agent': '鎶婃晠浜嬪帇鎴愯剼鏈笌鍒嗗満',
      'storyboard-agent': '鎶婅剼鏈媶鎴愰暅澶村拰鍒嗛暅椤哄簭',
      'comic-creator-agent': '鏁村悎鎴愬彲瑙嗗寲婕墽鏂规',
      'character-design-agent': '缁熶竴瑙掕壊璁捐鍜岃鲸璇嗙偣',
      'nanobanana-grid-agent': '鏁寸悊鎴愬浘鍍忔彁绀鸿瘝鐭╅樀',
      'debug-agent': '琛ラ闄╂鏌ュ拰缂哄彛璇存槑',
    };

    return (workflow || []).map((agent, index) => ({
      step: index + 1,
      agentId: agent.id,
      agentName: agent.displayName,
      objective: objectiveMap[agent.id] || `澶勭悊銆?{offlineCompact(prompt, 28)}銆峘`,
      deliverable: `${agent.displayName} 鐨勯樁娈佃崏妗坄`,
      handoff: workflow[index + 1] ? `浜ょ粰 ${workflow[index + 1].displayName}` : '杩涘叆鏈€缁堝悎鎴?',
      summary: `${agent.displayName} 灏嗗洿缁曞綋鍓嶄换鍔¤緭鍑轰竴娈靛彲缁х画杩唬鐨勭绾胯崏妗堛€俙`,
    }));
  }

  function offlineBuildSpecPack({ prompt = '', domainBundle, workflow = [] } = {}) {
    const workflowNames = workflow.map((agent) => agent.displayName).join(' -> ');
    const rounds = [
      {
        title: 'Round 1 路 鐩爣婢勬竻',
        focus: '鍏堢‘璁よ繖杞绾夸换鍔″埌搴曡浜や粯浠€涔堛€?',
        decisions: [
          `浠诲姟涓婚锛?{prompt || '寰呰ˉ鍏呬换鍔＄洰鏍?'}`,
          `棰嗗煙褰掑睘锛?{domainBundle.label}`,
          '褰撳墠浣跨敤娴忚鍣ㄧ绾挎ā寮忥紝涓嶄緷璧栨湰鍦?Node 鏈嶅姟銆?',
        ],
      },
      {
        title: 'Round 2 路 杈撳叆杈圭晫',
        focus: '鏄庣‘褰撳墠鍙湁娴忚鍣ㄣ€佹湰鍦板瓨鍌ㄥ拰鎵嬪姩杈撳叆鍙敤銆?',
        decisions: [
          '鍙娇鐢ㄥ綋鍓嶈緭鍏ユ銆佷細璇濆巻鍙插拰鏈湴缂撳瓨鏁版嵁銆?',
          '涓嶄細璋冪敤澶栭儴鎺ュ彛锛屼篃涓嶄細璇诲彇鏈嶅姟绔繍琛屾椂銆?',
          '濡傛灉缁х画鍚屼竴浼氳瘽锛屽皢浼樺厛缁ф壙涓婁竴杞殑鐩爣涓庣粨鏋溿€?',
        ],
      },
      {
        title: 'Round 3 路 杈撳嚭缁撴瀯',
        focus: '淇濊瘉浜х墿鍦ㄧ绾跨姸鎬佷笅浠嶇劧鍙銆佸彲缁窇銆佸彲澶嶅埗銆?',
        decisions: [
          '杈撳嚭鍖呭惈浠诲姟鍒ゆ柇銆佹墽琛岃崏妗堝拰涓嬩竴姝ュ缓璁€?',
          '浼氳瘽涓庤繍琛岀粨鏋滄寔涔呭寲鍒?localStorage銆?',
          '缁撴灉鏍煎紡浼樺厛闈㈠悜缁х画缂栬緫锛岃€屼笉鏄悗绔綊妗ｃ€?',
        ],
      },
      {
        title: 'Round 4 路 宸ヤ綔娴佸垎宸?',
        focus: '瀹夋帓鍙備笌鐨勬櫤鑳戒綋瑙掕壊鍜屾帴鍔涢『搴忋€?',
        decisions: [
          workflowNames || '绛夊緟鐢熸垚宸ヤ綔娴?',
          '绯荤粺绫绘櫤鑳戒綋鍙礋璐ｇ紪鎺掍笌瑙勬牸鏀跺彛銆?',
          '棰嗗煙绫绘櫤鑳戒綋璐熻矗姝ｆ枃銆佽剼鏈垨瑙嗚鑽夋鐢熸垚銆?',
        ],
      },
      {
        title: 'Round 5 路 楠屾敹鏍囧噯',
        focus: '瀹氫箟杩欎竴杞綍鏃剁畻瀹屾垚銆?',
        decisions: [
          '椤甸潰鑳界洿鎺ュ湪 file:// 涓嬫墦寮€骞惰繘鍏ヤ富鐣岄潰銆?',
          '鏃犻渶鍚姩鏈嶅姟鍣紝涔熻兘鐢熸垚 SPEC銆佽繍琛岀粨鏋滃拰浼氳瘽鍘嗗彶銆?',
          '鍒锋柊椤甸潰鍚庯紝鍘嗗彶浼氳瘽浠嶅彲缁х画鎵撳紑鍜岀画璺戙€?',
        ],
      },
    ];

    const masterSpec = [
      '绂荤嚎杩愯 SPEC',
      '',
      `浠诲姟锛?{prompt || '寰呰ˉ鍏呬换鍔＄洰鏍?'}`,
      `棰嗗煙锛?{domainBundle.label}`,
      `宸ヤ綔娴侊細${workflowNames || '寰呯敓鎴?'}`,
      '',
      '鎵ц绾︽潫锛?',
      '1. 杩愯鐜涓烘祻瑙堝櫒 file:// 妯″紡銆?',
      '2. 涓嶅惎鍔ㄦ湰鍦?Node 鏈嶅姟銆?',
      '3. 浣跨敤鏈湴瀛樺偍淇濆瓨浼氳瘽鍜岃繍琛岀粨鏋溿€?',
      '',
      '楠屾敹鏍囧噯锛?',
      '1. 椤甸潰鍙洿鎺ュ弻鍑?index.html 鎵撳紑銆?',
      '2. 鍙互鐢熸垚 SPEC銆佽繍琛岃緭鍑哄拰浼氳瘽鍘嗗彶銆?',
      '3. 鍙互鍦ㄥ凡鏈変細璇濅笂缁х画杩藉姞鏂颁竴杞唴瀹广€?',
    ].join('\n');

    return {
      rounds,
      masterSpec,
    };
  }

  function offlineNormalizeRuntimeConfig(runtimeConfig = {}) {
    const temperature = Number(runtimeConfig.temperature);
    const safeTemperature = Number.isFinite(temperature) ? temperature : 0.7;
    const baseUrl = offlineText(runtimeConfig.baseUrl || 'https://api.openai.com/v1')
      .replace(/\/+$/u, '')
      .replace(/\/(chat\/completions|responses)$/u, '');

    return {
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      model: offlineText(runtimeConfig.model),
      apiStyle: runtimeConfig.apiStyle === 'chat-completions' ? 'chat-completions' : 'responses',
      temperature: safeTemperature,
      apiKey: offlineText(runtimeConfig.apiKey),
    };
  }

  function offlineCanUseDirectLlm(runtimeConfig = {}) {
    const config = offlineNormalizeRuntimeConfig(runtimeConfig);
    return Boolean(config.apiKey && config.model && /^https?:\/\//iu.test(config.baseUrl));
  }

  function offlineExtractLlmText(payload) {
    const directText = offlineText(payload?.output_text);
    if (directText) return directText;

    const outputItems = Array.isArray(payload?.output) ? payload.output : [];
    const outputTexts = [];
    for (const item of outputItems) {
      const contentItems = Array.isArray(item?.content) ? item.content : [];
      for (const contentItem of contentItems) {
        const textValue =
          offlineText(contentItem?.text) ||
          offlineText(contentItem?.value) ||
          offlineText(contentItem?.content);
        if (textValue) outputTexts.push(textValue);
      }
    }
    if (outputTexts.length) return outputTexts.join('\n\n');

    const messageContent = payload?.choices?.[0]?.message?.content;
    if (Array.isArray(messageContent)) {
      const messageTexts = messageContent
        .map((item) => offlineText(item?.text || item?.value || item?.content))
        .filter(Boolean);
      if (messageTexts.length) return messageTexts.join('\n\n');
    }

    const chatText =
      offlineText(typeof messageContent === 'string' ? messageContent : '') ||
      offlineText(payload?.choices?.[0]?.text);
    if (chatText) return chatText;

    return '';
  }

  function offlineBuildDirectPrompts({ prompt = '', domainBundle, workflow = [], session = null, purpose = 'run' } = {}) {
    const workflowNames = workflow.map((agent) => agent.displayName).join(' -> ');
    const previousPrompt = offlineText(session?.latestTurn?.prompt);
    const previousOutput =
      offlineText(session?.latestTurn?.resultText) ||
      offlineText(session?.latestTurn?.specText);
    const sharedContext = [
      `浠诲姟鐩爣锛?{prompt || '寰呰ˉ鍏呬换鍔＄洰鏍?'}`,
      `棰嗗煙锛?{domainBundle.label}`,
      `鎵ц妯″紡锛?{purpose === 'spec' ? 'SPEC 瑙勫垝' : '鐩存帴杩愯'}`,
      `寤鸿宸ヤ綔娴侊細${workflowNames || '寰呯敓鎴?'}`,
      previousPrompt ? `涓婁竴杞敤鎴疯緭鍏ワ細${previousPrompt}` : '',
      previousOutput ? `涓婁竴杞粨鏋滄憳瑕侊細\n${offlineCompact(previousOutput, 1200)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (purpose === 'spec') {
      return {
        systemPrompt:
          '浣犳槸 Agent Studio 鐨勬湰鍦版祻瑙堝櫒鐩磋繛瑙勫垝鍔╂墜銆傝浣跨敤涓枃杈撳嚭涓€浠芥竻鏅般€佸彲鎵ц鐨?5 杞?SPEC 鍐崇瓥鍖呫€傛瘡涓€杞兘瑕佹湁鏍囬銆佺劍鐐瑰拰 3 鏉′互鍐呯殑鍏抽敭鍐崇瓥锛屾渶鍚庤ˉ涓€娈?master spec銆?',
        userPrompt: sharedContext,
      };
    }

    if (domainBundle.id === 'comics') {
      return {
        systemPrompt:
          '浣犳槸 Agent Studio 鐨勬湰鍦版祻瑙堝櫒鐩磋繛婕墽鍔╂墜銆傝浣跨敤涓枃锛岀洿鎺ヤ骇鍑洪珮璐ㄩ噺鍙墽琛岀粨鏋溿€備紭鍏堢粰鍑烘晠浜嬮挬瀛愩€佸垎闀?鑴氭湰寤鸿銆佽鑹茶〃鐜板拰涓嬩竴姝ヨ瑙夋彁绀鸿瘝鏂瑰悜銆備笉瑕佽В閲婃湇鍔″櫒銆丼DK 鎴栧疄鐜扮粏鑺傘€?',
        userPrompt: sharedContext,
      };
    }

    return {
      systemPrompt:
        '浣犳槸 Agent Studio 鐨勬湰鍦版祻瑙堝櫒鐩磋繛鍐欎綔鍔╂墜銆傝浣跨敤涓枃锛岀洿鎺ヤ骇鍑洪珮璐ㄩ噺鍙户缁墿鍐欑殑缁撴灉銆備紭鍏堢粰鍑虹粨鏋勫垽鏂€佹鏂?绔犺妭鎺ㄨ繘寤鸿銆佷汉鐗╄〃杈惧拰涓嬩竴姝ュ彲缁啓鏂瑰悜銆備笉瑕佽В閲婃湇鍔″櫒銆丼DK 鎴栧疄鐜扮粏鑺傘€?',
      userPrompt: sharedContext,
    };
  }

  async function offlineInvokeLlm({ runtimeConfig = {}, systemPrompt = '', userPrompt = '' } = {}) {
    const config = offlineNormalizeRuntimeConfig(runtimeConfig);
    if (!offlineCanUseDirectLlm(config)) {
      throw new Error('璇峰厛濉啓鍙敤鐨?baseUrl銆乵odel 鍜?apiKey锛屾墠鑳藉湪鏈湴鐩磋繛澶фā鍨嬨€?');
    }

    const endpoint =
      config.apiStyle === 'chat-completions'
        ? `${config.baseUrl}/chat/completions`
        : `${config.baseUrl}/responses`;

    const requestBody =
      config.apiStyle === 'chat-completions'
        ? {
            model: config.model,
            temperature: config.temperature,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }
        : {
            model: config.model,
            temperature: config.temperature,
            input: [
              {
                role: 'system',
                content: [{ type: 'input_text', text: systemPrompt }],
              },
              {
                role: 'user',
                content: [{ type: 'input_text', text: userPrompt }],
              },
            ],
          };

    let response;
    try {
      response = await __AGENT_STUDIO_NATIVE_FETCH(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new Error(
        `娴忚鍣ㄧ洿杩炲ぇ妯″瀷澶辫触锛?{error.message || '璇锋眰琚嫤鎴?'}銆傚鏋滀綘鐨勬湇鍔＄涓嶅厑璁告祻瑙堝櫒璺ㄥ煙锛宖ile:// 妯″紡涓嬪氨鏃犳硶鐩磋繛銆俙`,
      );
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message || payload.error || `妯″瀷璇锋眰澶辫触锛?{response.status}`);
    }

    const text = offlineExtractLlmText(payload);
    if (!text) {
      throw new Error('妯″瀷宸茶繑鍥炲搷搴旓紝浣嗘病鏈夎В鏋愬嚭鍙樉绀虹殑鏂囨湰鍐呭銆?');
    }

    return {
      text,
      raw: payload,
      runtimeConfig: config,
    };
  }

  function offlineBuildFinalOutput({ prompt = '', domainBundle, workflow = [], session = null } = {}) {
    const previousOutput =
      offlineText(session?.latestTurn?.resultText) ||
      offlineText(session?.latestTurn?.specText) ||
      '';
    const carry = previousOutput ? '\n宸茬户鎵夸笂涓€杞細璇濆唴瀹癸紝骞朵紭鍏堟部鐫€鏃㈡湁鏂瑰悜缁х画銆?' : '';
    const workflowNames = workflow.map((agent) => agent.displayName).join(' -> ');

    if (domainBundle.id === 'comics') {
      return [
        '绂荤嚎婕墽鑽夋',
        '',
        `浠诲姟锛?{prompt || '寰呰ˉ鍏呬换鍔＄洰鏍?'}`,
        `宸ヤ綔娴侊細${workflowNames || '寰呯敓鎴?'}`,
        '',
        '1. 鏍稿績鍒ゆ柇',
        `褰撳墠鏇撮€傚悎鍏堢敤 ${workflow[0]?.displayName || 'Comic Creator Agent'} 鎵撳簳锛屽啀鎶婅剼鏈拰鍒嗛暅寰€涓嬫帹銆?{carry}`,
        '',
        '2. 鍙洿鎺ョ户缁殑鎵ц鑽夋',
        '鏁呬簨閽╁瓙锛氬厛鎶婂啿绐併€佷汉鐗╃洰鏍囧拰鍗曞満鏅崠鐐瑰帇鎴愪竴鍙ヨ瘽涓诲懡棰樸€?',
        '闀滃ご鑺傚锛氬墠 3 闀滆礋璐ｉ挬浣忚瀹氾紝涓鎺ㄨ繘鍐茬獊锛岀粨灏剧暀涓€涓敾闈㈣蹇嗙偣銆?',
        '瑙掕壊琛ㄧ幇锛氫繚鎸佷富瑙掕鲸璇嗙偣绋冲畾锛屽叧閿暅澶寸敤鍚屼竴濂楁湇瑁呭拰濮挎€佽瑷€銆?',
        '瑙嗚鎻愮ず锛氱粺涓€鍏夋劅銆佽壊鏉垮拰鏉愯川鍏抽敭璇嶏紝閬垮厤姣忔牸椋庢牸婕傜Щ銆?',
        '',
        '3. 涓嬩竴姝ュ缓璁?',
        '濡傛灉浣犺缁х画杩欎竴浼氳瘽锛屼笅涓€杞渶閫傚悎琛モ€滃垎闀滃ご琛ㄢ€濇垨鈥滃浘鍍忔彁绀鸿瘝鐭╅樀鈥濄€?',
        '',
        '绂荤嚎璇存槑锛氭湰杞粨鏋滅敱娴忚鍣ㄦ湰鍦拌崏妗堝紩鎿庣敓鎴愶紝娌℃湁缁忚繃鏈嶅姟鍣ㄦ垨澶栭儴妯″瀷銆?',
      ].join('\n');
    }

    return [
      '绂荤嚎鍐欎綔鑽夋',
      '',
      `浠诲姟锛?{prompt || '寰呰ˉ鍏呬换鍔＄洰鏍?'}`,
      `宸ヤ綔娴侊細${workflowNames || '寰呯敓鎴?'}`,
      '',
      '1. 鏍稿績鍒ゆ柇',
      `褰撳墠鏇撮€傚悎鍏堢ǔ浣忕粨鏋勶紝鍐嶆妸姝ｆ枃鍜屽鐧介€愭鍘嬪疄銆?{carry}`,
      '',
      '2. 鍙洿鎺ョ户缁殑鎵ц鑽夋',
      '涓荤嚎鎺ㄨ繘锛氬厛鏄庣‘杩欒疆鏈€鎯宠В鍐崇殑涓€涓牳蹇冨啿绐侊紝涓嶈鍚屾椂寮€澶鏀嚎銆?',
      '绔犺妭缁勭粐锛氭妸鏈疆鐩爣鎷嗘垚鈥滃紑鍦洪挬瀛?-> 鍐茬獊鍗囩骇 -> 缁撴灉钀界偣鈥濅笁涓皬娈点€?',
      '浜虹墿琛ㄨ揪锛氳涓昏鍜屽叧閿厤瑙掑湪璇皵銆佺洰鐨勫拰鍔ㄤ綔涓婃湁鏄庢樉鍖哄垎銆?',
      '鏂囬鎺у埗锛氫繚鐣欏凡鏈夎姘旓紝浼樺厛淇『鍙ュ瓙鍜屾钀借妭濂忥紝鍐嶈€冭檻鎵╁啓瀛楁暟銆?',
      '',
      '3. 涓嬩竴姝ュ缓璁?',
      '濡傛灉浣犺缁х画杩欎竴浼氳瘽锛屼笅涓€杞渶閫傚悎琛モ€滅珷鑺傛鏂団€濇垨鈥滆鑹插鐧藉己鍖栤€濄€?',
      '',
      '绂荤嚎璇存槑锛氭湰杞粨鏋滅敱娴忚鍣ㄦ湰鍦拌崏妗堝紩鎿庣敓鎴愶紝娌℃湁缁忚繃鏈嶅姟鍣ㄦ垨澶栭儴妯″瀷銆?',
    ].join('\n');
  }

  function offlineBuildSessionTranscript(session) {
    return (session?.turns || [])
      .map((turn) => offlineText(turn.resultText || turn.specText))
      .filter(Boolean)
      .join('\n\n');
  }

  function offlineSerializeSession(session) {
    if (!session) return null;
    const turns = Array.isArray(session.turns) ? session.turns : [];
    const latestTurn = turns[turns.length - 1] || null;
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      domain: session.domain,
      mode: session.mode,
      constraints: session.constraints || [],
      selectedAgentIds: session.selectedAgentIds || [],
      workflow: session.workflow || [],
      turnCount: turns.length,
      runCount: Number(session.runCount || 0),
      lastRunId: session.lastRunId || null,
      memory: null,
      agentRuntime: session.agentRuntime || null,
      portableHarness: session.portableHarness || null,
      turns: turns.slice(-16),
      hasMoreTurns: turns.length > 16,
      latestTurn,
      outputTranscript: offlineBuildSessionTranscript(session),
    };
  }

  function offlineBuildSessionSummary(session) {
    return {
      id: session.id,
      title: offlineCompact(session.title, 64),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      domain: session.domain.id,
      mode: session.mode,
      turnCount: session.turns.length,
      runCount: Number(session.runCount || 0),
      lastPromptPreview: offlineCompact(session.lastPrompt || '', 90),
      lastOutputPreview: offlineCompact(session.lastOutputPreview || '', 90),
      lastRunId: session.lastRunId || null,
      sessionId: session.id,
    };
  }

  function offlineUpsertById(items, nextItem) {
    const list = Array.isArray(items) ? items.slice() : [];
    const index = list.findIndex((item) => item.id === nextItem.id);
    if (index >= 0) {
      list[index] = nextItem;
    } else {
      list.push(nextItem);
    }
    return list;
  }

  function offlineMutateSession({ payload = {}, kind = 'run', specPack = null, finalOutput = '', warnings = [], runId = null } = {}) {
    const prompt = offlineText(payload.prompt);
    const mode = offlineText(payload.mode) || 'harness';
    const bundle = offlineGetDomainBundle(payload.domain, prompt);
    const workflow = offlineBuildWorkflow({
      domainId: bundle.id,
      mode,
      selectedAgentIds: payload.selectedAgentIds || [],
      prompt,
    });
    const selectedAgentIds = offlineBuildWorkflowIds({
      domainId: bundle.id,
      mode,
      selectedAgentIds: payload.selectedAgentIds || [],
      prompt,
    });
    const sessionId = offlineText(payload.sessionId) || offlineMakeId('session');
    const sessions = offlineReadSessions();
    const existing = sessions.find((session) => session.id === sessionId) || null;
    const agentRuntime = offlineBuildAgentRuntime({
      workflow,
      prompt,
      domainId: bundle.id,
      mode,
      sessionId,
    });
    const portableHarness = offlineBuildPortableHarness({ workflow, prompt });

    const baseSession = existing || {
      id: sessionId,
      title: offlineCompact(prompt || `${bundle.label}绂荤嚎浼氳瘽`, 64),
      createdAt: offlineNowIso(),
      updatedAt: offlineNowIso(),
      domain: offlineSerializeDomainBundle(bundle),
      mode,
      constraints: ['绂荤嚎娴忚鍣ㄦā寮?', '鏃犻渶 Node 鏈嶅姟'],
      selectedAgentIds,
      workflow: offlineSerializeWorkflow(workflow),
      turns: [],
      runCount: 0,
      lastRunId: null,
      lastPrompt: '',
      lastOutputPreview: '',
      agentRuntime,
      portableHarness,
    };

    const turn = {
      id: offlineMakeId('turn'),
      kind,
      createdAt: offlineNowIso(),
      prompt,
      warnings: warnings || [],
      specPack,
      specText: kind === 'spec' ? specPack?.masterSpec || '' : '',
      specPreview: kind === 'spec' ? offlineCompact(specPack?.masterSpec || '', 180) : '',
      resultText: kind === 'run' ? finalOutput || '' : '',
      resultPreview: kind === 'run' ? offlineCompact(finalOutput || '', 180) : '',
      runId: kind === 'run' ? runId : '',
    };

    const nextSession = {
      ...baseSession,
      updatedAt: offlineNowIso(),
      mode,
      domain: offlineSerializeDomainBundle(bundle),
      selectedAgentIds,
      workflow: offlineSerializeWorkflow(workflow),
      turns: [...(baseSession.turns || []), turn].slice(-24),
      runCount: kind === 'run' ? Number(baseSession.runCount || 0) + 1 : Number(baseSession.runCount || 0),
      lastRunId: kind === 'run' ? runId : baseSession.lastRunId || null,
      lastPrompt: prompt,
      lastOutputPreview: offlineCompact(finalOutput || specPack?.masterSpec || '', 180),
      agentRuntime,
      portableHarness,
    };

    const nextSessions = offlineUpsertById(sessions, nextSession)
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
      .slice(0, 80);
    offlineWriteSessions(nextSessions);

    return nextSession;
  }

  function offlineListSessionSummaries() {
    return offlineReadSessions()
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
      .map((session) => offlineBuildSessionSummary(session));
  }

  function offlinePreviewSpec(payload = {}) {
    const prompt = offlineText(payload.prompt);
    const mode = offlineText(payload.mode) || 'harness';
    const bundle = offlineGetDomainBundle(payload.domain, prompt);
    const workflow = offlineBuildWorkflow({
      domainId: bundle.id,
      mode,
      selectedAgentIds: payload.selectedAgentIds || [],
      prompt,
    });
    const routing = offlineBuildRouting({
      prompt,
      workflow,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const fusion = offlineBuildFusion({
      domainId: bundle.id,
      prompt,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const specPack = offlineBuildSpecPack({
      prompt,
      domainBundle: bundle,
      workflow,
    });
    const session = offlineMutateSession({
      payload: { ...payload, domain: bundle.id, mode },
      kind: 'spec',
      specPack,
      warnings: ['绂荤嚎妯″紡锛氬綋鍓?SPEC 鐢辨祻瑙堝櫒鏈湴鐢熸垚銆?'],
    });

    return {
      prompt,
      mode,
      domain: offlineSerializeDomainBundle(bundle),
      routing,
      workflow: offlineSerializeWorkflow(workflow),
      fusion,
      agentRuntime: session.agentRuntime,
      portableHarness: session.portableHarness,
      skillAudit: null,
      skillMatches: [],
      specPack,
      session: offlineSerializeSession(session),
    };
  }

  async function offlineRun(payload = {}) {
    const prompt = offlineText(payload.prompt);
    const mode = offlineText(payload.mode) || 'harness';
    const bundle = offlineGetDomainBundle(payload.domain, prompt);
    const workflow = offlineBuildWorkflow({
      domainId: bundle.id,
      mode,
      selectedAgentIds: payload.selectedAgentIds || [],
      prompt,
    });
    const routing = offlineBuildRouting({
      prompt,
      workflow,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const fusion = offlineBuildFusion({
      domainId: bundle.id,
      prompt,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const drafts = offlineBuildDrafts(workflow, prompt);
    const previousSession = offlineReadSessions().find((session) => session.id === offlineText(payload.sessionId)) || null;
    const runtimeConfig = offlineNormalizeRuntimeConfig(payload.runtimeConfig || {});
    let finalOutput = offlineBuildFinalOutput({
      prompt,
      domainBundle: bundle,
      workflow,
      session: previousSession,
    });
    const runId = offlineMakeId('run');
    const warnings = ['绂荤嚎妯″紡锛氭湭杩炴帴澶栭儴 LLM锛屽綋鍓嶇粨鏋滅敱娴忚鍣ㄦ湰鍦拌崏妗堝紩鎿庣敓鎴愩€?'];
    const session = offlineMutateSession({
      payload: { ...payload, domain: bundle.id, mode },
      kind: 'run',
      finalOutput,
      warnings,
      runId,
    });

    const run = {
      id: runId,
      createdAt: offlineNowIso(),
      prompt,
      mode,
      domain: offlineSerializeDomainBundle(bundle),
      constraints: ['绂荤嚎娴忚鍣ㄦā寮?', '鏃犻渶 Node 鏈嶅姟'],
      selectedAgentIds: session.selectedAgentIds || [],
      routing,
      fusion,
      workflow: offlineSerializeWorkflow(workflow),
      drafts,
      agentRuntime: session.agentRuntime,
      portableHarness: session.portableHarness,
      skillAudit: null,
      skillMatches: [],
      specPack: offlineBuildSpecPack({
        prompt,
        domainBundle: bundle,
        workflow,
      }),
      stageOutputs: [],
      finalOutput,
      llm: {
        configured: false,
        usedLlm: false,
        model: 'offline-draft-engine',
        baseUrl: 'file://offline-browser',
        apiStyle: 'responses',
      },
      warnings,
      sessionId: session.id,
      session: offlineSerializeSession(session),
    };

    const runs = offlineUpsertById(offlineReadRuns(), run)
      .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
      .slice(0, 60);
    offlineWriteRuns(runs);

    return run;
  }

  async function offlineRunBrowser(payload = {}) {
    const runtimeConfig = offlineNormalizeRuntimeConfig(payload.runtimeConfig || {});
    if (!offlineCanUseDirectLlm(runtimeConfig)) {
      return offlineRun(payload);
    }

    const prompt = offlineText(payload.prompt);
    const mode = offlineText(payload.mode) || 'harness';
    const bundle = offlineGetDomainBundle(payload.domain, prompt);
    const workflow = offlineBuildWorkflow({
      domainId: bundle.id,
      mode,
      selectedAgentIds: payload.selectedAgentIds || [],
      prompt,
    });
    const routing = offlineBuildRouting({
      prompt,
      workflow,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const fusion = offlineBuildFusion({
      domainId: bundle.id,
      prompt,
      selectedAgentIds: payload.selectedAgentIds || [],
    });
    const drafts = offlineBuildDrafts(workflow, prompt);
    const previousSession = offlineReadSessions().find((session) => session.id === offlineText(payload.sessionId)) || null;
    const prompts = offlineBuildDirectPrompts({
      prompt,
      domainBundle: bundle,
      workflow,
      session: previousSession,
      purpose: 'run',
    });
    const llmResult = await offlineInvokeLlm({
      runtimeConfig,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
    });
    const finalOutput = llmResult.text;
    const runId = offlineMakeId('run');
    const warnings = ['Browser direct mode: apiKey stays in this browser localStorage on this device only.'];
    const llmInfo = {
      configured: true,
      usedLlm: true,
      model: llmResult.runtimeConfig.model,
      baseUrl: llmResult.runtimeConfig.baseUrl,
      apiStyle: llmResult.runtimeConfig.apiStyle,
    };
    const session = offlineMutateSession({
      payload: { ...payload, domain: bundle.id, mode },
      kind: 'run',
      finalOutput,
      warnings,
      runId,
    });

    const run = {
      id: runId,
      createdAt: offlineNowIso(),
      prompt,
      mode,
      domain: offlineSerializeDomainBundle(bundle),
      constraints: ['Offline browser mode', 'No Node server required'],
      selectedAgentIds: session.selectedAgentIds || [],
      routing,
      fusion,
      workflow: offlineSerializeWorkflow(workflow),
      drafts,
      agentRuntime: session.agentRuntime,
      portableHarness: session.portableHarness,
      skillAudit: null,
      skillMatches: [],
      specPack: offlineBuildSpecPack({
        prompt,
        domainBundle: bundle,
        workflow,
      }),
      stageOutputs: [],
      finalOutput,
      llm: llmInfo,
      warnings,
      sessionId: session.id,
      session: offlineSerializeSession(session),
    };

    const runs = offlineUpsertById(offlineReadRuns(), run)
      .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
      .slice(0, 60);
    offlineWriteRuns(runs);

    return run;
  }

  function offlineJsonResponse(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...extraHeaders,
      },
    });
  }

  function offlineEventResponse(run) {
    const encoder = new TextEncoder();
    const output = offlineText(run?.finalOutput || '');
    const chunks = [];

    chunks.push(`event: status\ndata: ${JSON.stringify({ stage: 'running', message: '绂荤嚎妯″紡姝ｅ湪鐢熸垚鏈湴鑽夋...' })}\n\n`);

    for (let index = 0; index < output.length; index += 96) {
      chunks.push(
        `event: delta\ndata: ${JSON.stringify({ delta: output.slice(index, index + 96) })}\n\n`,
      );
    }

    chunks.push(`event: done\ndata: ${JSON.stringify({ run })}\n\n`);

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  function offlineParseBody(init = {}) {
    const raw = init?.body;
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  }

  async function offlineHandleApi(url, init = {}) {
    const method = String(init.method || 'GET').toUpperCase();

    if (method === 'GET' && url.pathname === '/api/config') {
      return offlineJsonResponse({
        runtime: {
          port: 0,
          llm: {
            configured: false,
            baseUrl: 'https://api.openai.com/v1',
            model: '',
            apiStyle: 'responses',
            temperature: 0.7,
          },
        },
        domains: Object.values(OFFLINE_DOMAIN_BUNDLES).map((bundle) => ({
          id: bundle.id,
          label: bundle.label,
          strapline: bundle.strapline,
          description: bundle.description,
          examples: bundle.examples,
        })),
      });
    }

    if (method === 'GET' && url.pathname === '/api/catalog') {
      const domainId = url.searchParams.get('domain') || 'writing';
      const bundle = offlineGetDomainBundle(domainId);
      const allAgents = offlineListAllAgents();
      return offlineJsonResponse({
        domain: offlineSerializeDomainBundle(bundle),
        agents: offlineListDomainAgents(bundle.id),
        allAgents,
        tagIndex: offlineBuildTagIndex(allAgents),
        fusion: offlineBuildFusion({ domainId: bundle.id }),
      });
    }

    if (method === 'GET' && url.pathname === '/api/fusion') {
      const domainId = url.searchParams.get('domain') || 'writing';
      const prompt = url.searchParams.get('prompt') || '';
      const selectedAgentIds = url.searchParams.getAll('agent');
      return offlineJsonResponse(
        offlineBuildFusion({ domainId, prompt, selectedAgentIds }),
      );
    }

    if (method === 'GET' && (url.pathname === '/api/sessions' || url.pathname === '/api/session-threads')) {
      return offlineJsonResponse({
        sessions: offlineListSessionSummaries(),
      });
    }

    if (method === 'GET' && url.pathname === '/api/session') {
      const sessionId = url.searchParams.get('id');
      const session = offlineReadSessions().find((item) => item.id === sessionId);
      if (!session) {
        return offlineJsonResponse({ error: 'Session not found.' }, 404);
      }
      return offlineJsonResponse(offlineSerializeSession(session));
    }

    if (method === 'GET' && url.pathname === '/api/run') {
      const runId = url.searchParams.get('id');
      const run = offlineReadRuns().find((item) => item.id === runId);
      if (!run) {
        return offlineJsonResponse({ error: 'Run not found.' }, 404);
      }
      return offlineJsonResponse(run);
    }

    if (method === 'POST' && url.pathname === '/api/spec') {
      return offlineJsonResponse(offlinePreviewSpec(offlineParseBody(init)));
    }

    if (method === 'POST' && url.pathname === '/api/run') {
      try {
        return offlineJsonResponse(await offlineRunBrowser(offlineParseBody(init)));
      } catch (error) {
        return offlineJsonResponse({ error: error.message || 'Browser direct run failed' }, 400);
      }
    }

    if (method === 'POST' && url.pathname === '/api/run-stream') {
      try {
        return offlineEventResponse(await offlineRunBrowser(offlineParseBody(init)));
      } catch (error) {
        return offlineJsonResponse({ error: error.message || 'Browser direct run failed' }, 400);
      }
    }

    if (method === 'POST' && url.pathname === '/api/llm/test') {
      const payload = offlineParseBody(init);
      const runtimeConfig = offlineNormalizeRuntimeConfig(payload?.runtimeConfig || {});
      if (!offlineCanUseDirectLlm(runtimeConfig)) {
        return offlineJsonResponse(
          {
            ok: false,
            error: 'Please fill in your own baseUrl, model, and apiKey before testing.',
          },
          400,
        );
      }

      try {
        const llmResult = await offlineInvokeLlm({
          runtimeConfig,
          systemPrompt:
            'You are a connectivity test assistant. Reply briefly and naturally in Chinese to the user greeting. Do not explain any rules.',
          userPrompt: '浣犲ソ',
        });
        return offlineJsonResponse({
          ok: true,
          usedLlm: true,
          model: llmResult.runtimeConfig.model,
          baseUrl: llmResult.runtimeConfig.baseUrl,
          apiStyle: llmResult.runtimeConfig.apiStyle,
          prompt: '浣犲ソ',
          preview: offlineCompact(llmResult.text, 160),
          response: llmResult.text,
          error: '',
        });
      } catch (error) {
        return offlineJsonResponse(
          {
            ok: false,
            error: error.message || 'LLM test failed',
          },
          400,
        );
      }
    }

    if (method === 'POST' && url.pathname === '/api/llm/test') {
      const payload = offlineParseBody(init);
      const apiStyle = payload?.runtimeConfig?.apiStyle || 'responses';
      return offlineJsonResponse({
        ok: true,
        usedLlm: false,
        model: 'offline-draft-engine',
        baseUrl: 'file://offline-browser',
        apiStyle,
        prompt: '浣犲ソ',
        preview: '绂荤嚎妯″紡宸插惎鐢細褰撳墠涓嶄細杩炴帴澶栭儴妯″瀷锛屼絾椤甸潰鍙互鐩存帴鏈湴杩愯銆?',
        response: '绂荤嚎妯″紡宸插惎鐢細褰撳墠涓嶄細杩炴帴澶栭儴妯″瀷锛屼絾椤甸潰鍙互鐩存帴鏈湴杩愯銆?',
        error: '',
      });
    }

    if (method === 'POST' && url.pathname === '/api/history/clear') {
      const clearedSessions = offlineReadSessions().length;
      const clearedRuns = offlineReadRuns().length;
      offlineWriteSessions([]);
      offlineWriteRuns([]);
      return offlineJsonResponse({
        ok: true,
        clearedSessions,
        clearedRuns,
      });
    }

    return offlineJsonResponse({ error: `Unsupported offline API: ${method} ${url.pathname}` }, 404);
  }

  window.fetch = function offlineFetch(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input?.url || '';
    const url = new URL(rawUrl, 'https://offline.agent.studio');

    if (url.pathname.startsWith('/api/')) {
      return Promise.resolve(offlineHandleApi(url, init));
    }

    return __AGENT_STUDIO_NATIVE_FETCH(input, init);
  };
}

if (__AGENT_STUDIO_FILE_MODE__ && false) {
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      const root = document.getElementById('pageShell') || document.body;
      if (!root) return;

      document.title = 'Agent Studio Launcher';
      root.innerHTML = `
        <section style="max-width: 720px; margin: 48px auto; padding: 32px; border-radius: 24px; border: 1px solid rgba(18, 46, 86, 0.12); background: rgba(255,255,255,0.96); box-shadow: 0 18px 46px rgba(18, 36, 63, 0.1); font-family: 'Segoe UI Variable Display','Microsoft YaHei UI','PingFang SC',sans-serif; color: #17212f;">
          <p style="margin: 0 0 10px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #1677ff;">Agent Studio</p>
          <h1 style="margin: 0 0 14px; font-size: 30px; line-height: 1.15;">璇烽€氳繃鏈湴鏈嶅姟璁块棶杩欎釜椤甸潰</h1>
          <p style="margin: 0 0 12px; line-height: 1.75; color: #5a6878;">
            浣犵幇鍦ㄦ墦寮€鐨勬槸 <code>file://</code> 鐗堟湰銆傝繖涓」鐩緷璧栨湰鍦?Node 鏈嶅姟鍜?<code>/api/*</code> 鎺ュ彛锛?            鐩存帴鍙屽嚮 <code>public/index.html</code> 浼氳Е鍙戞祻瑙堝櫒瀹夊叏闄愬埗锛屾墍浠ョ湅璧锋潵浼氬儚鈥滀笉鍙敤鈥濄€?          </p>
          <div style="display: grid; gap: 10px; margin: 22px 0;">
            <a href="http://127.0.0.1:3103/" style="display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 14px; background: #1677ff; color: #fff; text-decoration: none; font-weight: 700;">鎵撳紑鏈湴鏈嶅姟鐗?/a>
            <div style="padding: 14px 16px; border-radius: 16px; background: rgba(22, 119, 255, 0.06); border: 1px solid rgba(22, 119, 255, 0.12); color: #5a6878; line-height: 1.7;">
              <strong style="display: block; margin-bottom: 6px; color: #17212f;">鎺ㄨ崘鍚姩鏂瑰紡</strong>
              <code>鍙屽嚮 start-cloud-writing-lite.bat</code><br />
              鎴栬€呭湪椤圭洰鐩綍杩愯 <code>npm start</code>
            </div>
          </div>
          <p style="margin: 0; line-height: 1.65; color: #7c8897;">
            榛樿鍦板潃锛?code>http://127.0.0.1:3103/</code>
          </p>
        </section>
      `;
    },
    { once: true },
  );
} else {
const MODE_META = {
  single: { label: '鍗曚綋', description: '鍗曟櫤鑳戒綋鐩存帴杈撳嚭' },
  compose: { label: '???', description: 'Compose multiple agents in sequence' },
  harness: { label: '???', description: 'Full orchestration control pipeline' },
};

const SYSTEM_AGENT_IDS = new Set(['agent-orchestrator', 'spec-agent', 'plan-agent']);
const STORAGE_KEYS = {
  runtime: 'agent-studio-runtime-config',
  sessionId: 'agent-studio-session-id',
  layout: 'agent-studio-layout',
  agentFilter: 'agent-studio-agent-filter',
};
const TECHNICAL_COMPLETE_MARKER = '[[AGENT_STUDIO_COMPLETE]]';

const DISPLAY_NAME_MAP = {
  'Agent Orchestrator': '鏅鸿兘浣撶紪鎺掑櫒',
  'Agency Backend Architect': 'Agency 鍚庣鏋舵瀯甯?',
  'Agency Code Reviewer': 'Agency 浠ｇ爜瀹℃煡鍛?',
  'Agency DevOps Automator': 'Agency 杩愮淮鑷姩鍖栦笓瀹?',
  'Agency Frontend Developer': 'Agency 鍓嶇寮€鍙戜笓瀹?',
  'Agency Software Architect': 'Agency 杞欢鏋舵瀯甯?',
  'ECC Agent Harness Construction': 'ECC 缂栨帓鏋勫缓涓撳',
  'ECC Code Reviewer': 'ECC 浠ｇ爜瀹℃煡鍛?',
  'ECC Harness Optimizer': 'ECC 缂栨帓浼樺寲涓撳',
  'ECC Loop Operator': 'ECC 闀垮惊鐜墽琛屼笓瀹?',
  'ECC Planner': 'ECC 瑙勫垝涓撳',
  'ECC TypeScript Reviewer': 'ECC TypeScript 瀹℃煡涓撳',
  'ECC Architect': 'ECC 鏋舵瀯涓撳',
  'Plan Agent': '瑙勫垝鏅鸿兘浣?',
  'Spec Agent': '瑙勬牸鏅鸿兘浣?',
  'Agent Generator': '鏅鸿兘浣撶敓鎴愬櫒',
  'Chaowuqiong Backend Agent': '瓒呮棤绌瑰悗绔櫤鑳戒綋',
  'Chaowuqiong Frontend Agent': '瓒呮棤绌瑰墠绔櫤鑳戒綋',
  'Debug Agent': '璋冭瘯鏅鸿兘浣?',
  'Language Selector Agent': '璇█閫夋嫨鏅鸿兘浣?',
};

const ROLE_MAP = {
  'backend-architect': '鍚庣鏋舵瀯甯?',
  'review-specialist': '瀹℃煡涓撳',
  'ops-specialist': '杩愮淮涓撳',
  'frontend-specialist': '鍓嶇涓撳',
  'software-architect': '杞欢鏋舵瀯甯?',
  'harness-specialist': '缂栨帓涓撳',
  'loop-operator': '闀垮惊鐜墽琛屼笓瀹?',
  'planning-specialist': '瑙勫垝涓撳',
  'typescript-specialist': 'TypeScript 涓撳',
  'architecture-specialist': '鏋舵瀯涓撳',
  'agent-designer': '鏅鸿兘浣撹璁″笀',
  'engineering-specialist': '宸ョ▼涓撳',
  debugger: '璋冭瘯涓撳',
  specialist: '涓撻」涓撳',
};

const TOKEN_MAP = {
  selected: '宸查€?',
  local: '鏈湴',
  fusion: '铻嶅悎',
  imported: '宸插鍏?',
  skill: '鎶€鑳?',
  specialist: '涓撻」',
  review: '澶嶆牳',
  clean: '姝ｅ父',
  run: '杩愯',
  preview: '棰勮',
  harness: '缂栨帓',
  coding: '缂栫▼',
  design: '璁捐',
  systemization: '绯荤粺鍖?',
  engineering: '宸ョ▼',
  service: '鏈嶅姟',
  frontend: '鍓嶇',
  backend: '鍚庣',
  ux: '浣撻獙',
  debug: '璋冭瘯',
  quality: '璐ㄩ噺',
  construction: '鏋勫缓',
  planning: '瑙勫垝',
  typescript: 'TypeScript',
  workflow: '閾捐矾',
  session: '浼氳瘽',
  audit: '瀹℃煡',
  soak: '闀胯窇',
  'agent-factory': '鏅鸿兘浣撳伐鍘?',
  'agent-blueprint': '鏅鸿兘浣撹摑鍥?',
};

const RECIPE_LABEL_MAP = {
  'Harness Fusion': '缂栨帓铻嶅悎',
  'Review Fusion': '瀹℃煡铻嶅悎',
  'Loop Fusion': '闀胯窇铻嶅悎',
};

const EXACT_TEXT_MAP = new Map([
  [
    'Imported into D:\\HTML\\.agent-kit as part of the shared harness runtime.',
    '宸插鍏ュ埌 D:\\HTML\\.agent-kit锛屽苟绾冲叆鍏变韩缂栨帓杩愯鏃躲€?',
  ],
  ['Use this skill when the user wants to:', '閫傜敤鍦烘櫙锛?'],
  [
    'Use imported harness, planning, frontend, backend, and TypeScript specialists for Agent Studio and control-plane work.',
    '璋冪敤宸插鍏ョ殑缂栨帓銆佽鍒掋€佸墠绔€佸悗绔拰 TypeScript 涓撳锛岃ˉ寮烘櫤鑳戒綋宸ヤ綔鍙颁笌鎺у埗骞抽潰銆?',
  ],
  [
    'Layer two external review packs on top of the local harness for audits, refactors, regression checks, and architecture review.',
    '鍦ㄦ湰鍦扮紪鎺掍箣涓婂彔鍔犱袱缁勫閮ㄥ鏌ュ寘锛岀敤浜庡璁°€侀噸鏋勩€佸洖褰掓鏌ュ拰鏋舵瀯澶嶆牳銆?',
  ],
  [
    'Bring in long-running loop, soak, and automation specialists for extended harness execution.',
    '寮曞叆闀垮惊鐜€侀暱璺戦獙璇佸拰鑷姩鍖栦笓瀹讹紝鏀拺鏇撮暱鏃堕棿鐨勭紪鎺掓墽琛屻€?',
  ],
]);

const DISPLAY_NAME_TEXT_MAP = new Map([
  ...Object.entries(DISPLAY_NAME_MAP),
  ['Fusion Ecc Agent Harness Construction', '铻嶅悎 ECC 缂栨帓鏋勫缓涓撳'],
  ['Fusion Ecc Planner', '铻嶅悎 ECC 瑙勫垝涓撳'],
  ['Fusion Ecc Harness Optimizer', '铻嶅悎 ECC 缂栨帓浼樺寲涓撳'],
  ['Fusion Agency Frontend Developer', '铻嶅悎 Agency 鍓嶇寮€鍙戜笓瀹?'],
  ['Fusion Agency Backend Architect', '铻嶅悎 Agency 鍚庣鏋舵瀯甯?'],
  ['Fusion Ecc Typescript Reviewer', '铻嶅悎 ECC TypeScript 瀹℃煡涓撳'],
  ['Fusion Ecc TypeScript Reviewer', '铻嶅悎 ECC TypeScript 瀹℃煡涓撳'],
  ['Fusion Ecc Code Reviewer', '铻嶅悎 ECC 浠ｇ爜瀹℃煡鍛?'],
  ['Fusion Agency Code Reviewer', '铻嶅悎 Agency 浠ｇ爜瀹℃煡鍛?'],
  ['Fusion Agency Software Architect', '铻嶅悎 Agency 杞欢鏋舵瀯甯?'],
  ['Fusion Ecc Loop Operator', '铻嶅悎 ECC 闀垮惊鐜墽琛屼笓瀹?'],
  ['Fusion Agency Devops Automator', '铻嶅悎 Agency 杩愮淮鑷姩鍖栦笓瀹?'],
  ['Fusion Agency DevOps Automator', '铻嶅悎 Agency 杩愮淮鑷姩鍖栦笓瀹?'],
]);

const DYNAMIC_TEXT_REPLACEMENTS = [
  ['LLM not configured.', '鏈厤缃ぇ妯″瀷銆?'],
  ['Continue this harness session and complete the import layer, TypeScript migration, and soak validation.', '缁х画杩欎釜缂栨帓浼氳瘽锛屽苟瀹屾垚瀵煎叆灞傘€乀ypeScript 杩佺Щ鍜岄暱璺戦獙璇併€?'],
  ['Continue the harness audit with emphasis on reliability, resumability, log retention, and control-plane convergence.', '缁х画瀹℃煡缂栨帓绯荤粺锛岄噸鐐瑰叧娉ㄥ彲闈犳€с€佸彲缁窇鎬с€佹棩蹇椾繚鐣欏拰鎺у埗骞抽潰鏀舵暃銆?'],
  ['Continue improving the TypeScript harness project and inspect the contracts across imported catalog, CLI, browser workbench, and shared sessions.', '缁х画鏀硅繘 TypeScript 缂栨帓椤圭洰锛屽苟妫€鏌ュ凡瀵煎叆鐩綍銆佸懡浠よ銆佹祻瑙堝櫒宸ヤ綔鍙板拰鍏变韩浼氳瘽涔嬮棿鐨勫绾︺€?'],
  ['Continue improving the .agent-kit harness fusion layer and inspect how session, workflow, imported agents, and prompt building fit together.', '缁х画鏀硅繘 .agent-kit 缂栨帓铻嶅悎灞傦紝骞舵鏌ヤ細璇濄€佸伐浣滄祦銆佸凡瀵煎叆鏅鸿兘浣撳拰鎻愮ず璇嶆瀯寤哄浣曞崗鍚屻€?'],
  ['Continue the soak validation and confirm workflow, run archives, session threads, and imported specialists stay stable across repeated runs.', '缁х画杩涜闀胯窇楠岃瘉锛屽苟纭宸ヤ綔娴併€佽繍琛屽綊妗ｃ€佷細璇濈嚎绋嬪拰宸插鍏ヤ笓瀹跺湪閲嶅杩愯涓繚鎸佺ǔ瀹氥€?'],
  ['Fuse agency-agents and everything-claude-code into .agent-kit and produce a shared-session TypeScript harness project.', '鎶?agency-agents 鍜?everything-claude-code 铻嶅悎杩?.agent-kit锛屽苟浜у嚭鏀寔鍏变韩浼氳瘽鐨?TypeScript 缂栨帓椤圭洰銆?'],
  ['shared-session', '鍏变韩浼氳瘽'],
  ['control-plane', '鎺у埗骞抽潰'],
  ['soak validation', '闀胯窇楠岃瘉'],
  ['import layer', '瀵煎叆灞?'],
  ['log retention', '鏃ュ織淇濈暀'],
  ['reliability', '鍙潬鎬?'],
  ['resumability', '鍙画璺戞€?'],
  ['TypeScript migration', 'TypeScript 杩佺Щ'],
  ['Responses', '鍝嶅簲鎺ュ彛'],
  ['Chat Completions', '瀵硅瘽琛ュ叏鎺ュ彛'],
];

const state = {
  catalog: null,
  config: null,
  fusionAnalysis: null,
  fusionTimer: null,
  fusionRequestId: 0,
  pendingChatPrompt: '',
  sessions: [],
  selectedAgents: new Set(),
  activeRun: null,
  preview: null,
  isRunning: false,
  agentQuery: '',
  agentFilter: 'all',
  workbenchView: 'task',
  currentSessionId: '',
  activeSession: null,
  streamController: null,
  streamStopReason: '',
  ui: {
    leftCollapsed: false,
    rightCollapsed: false,
    zen: false,
  },
  streamDebug: null,
};

const elements = {
  pageShell: document.getElementById('pageShell'),
  promptInput: document.getElementById('promptInput'),
  promptMeta: document.getElementById('promptMeta'),
  domainSelect: document.getElementById('domainSelect'),
  modeSelect: document.getElementById('modeSelect'),
  modePills: document.getElementById('modePills'),
  agentFilterPills: document.getElementById('agentFilterPills'),
  fusionMeta: document.getElementById('fusionMeta'),
  fusionSources: document.getElementById('fusionSources'),
  fusionRecipes: document.getElementById('fusionRecipes'),
  agentSearchInput: document.getElementById('agentSearchInput'),
  agentDeck: document.getElementById('agentDeck'),
  runtimeStatus: document.getElementById('runtimeStatus'),
  domainHint: document.getElementById('domainHint'),
  selectionSummary: document.getElementById('selectionSummary'),
  workspacePulse: document.getElementById('workspacePulse'),
  workflowPreview: document.getElementById('workflowPreview'),
  exampleList: document.getElementById('exampleList'),
  runButton: document.getElementById('runButton'),
  specButton: document.getElementById('specButton'),
  stopRunButton: document.getElementById('stopRunButton'),
  copyOutputButton: document.getElementById('copyOutputButton'),
  workbenchTabs: document.getElementById('workbenchTabs'),
  runMeta: document.getElementById('runMeta'),
  specRounds: document.getElementById('specRounds'),
  workflowTimeline: document.getElementById('workflowTimeline'),
  insightPanel: document.getElementById('insightPanel'),
  terminalSurface: document.getElementById('terminalSurface'),
  finalOutput: document.getElementById('finalOutput'),
  streamDebugPanel: document.getElementById('streamDebugPanel'),
  streamDebugMeta: document.getElementById('streamDebugMeta'),
  streamDebugOutput: document.getElementById('streamDebugOutput'),
  recentRuns: document.getElementById('recentRuns'),
  toggleLeftRailButton: document.getElementById('toggleLeftRailButton'),
  toggleRightRailButton: document.getElementById('toggleRightRailButton'),
  toggleZenButton: document.getElementById('toggleZenButton'),
  chatSessionCard: document.getElementById('chatSessionCard'),
  chatSuggestions: document.getElementById('chatSuggestions'),
  chatStream: document.getElementById('chatStream'),
  chatInput: document.getElementById('chatInput'),
  chatSendButton: document.getElementById('chatSendButton'),
  chatRunButton: document.getElementById('chatRunButton'),
  baseUrlInput: document.getElementById('baseUrlInput'),
  modelInput: document.getElementById('modelInput'),
  apiStyleInput: document.getElementById('apiStyleInput'),
  temperatureInput: document.getElementById('temperatureInput'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  sessionIdInput: document.getElementById('sessionIdInput'),
  sessionStatus: document.getElementById('sessionStatus'),
  loadSessionButton: document.getElementById('loadSessionButton'),
  copySessionButton: document.getElementById('copySessionButton'),
  newSessionButton: document.getElementById('newSessionButton'),
  clearHistoryButton: document.getElementById('clearHistoryButton'),
};

elements.copyOutputButton.disabled = true;
if (elements.stopRunButton) {
  elements.stopRunButton.disabled = true;
}

function text(value) {
  return String(value || '');
}

function activePromptText(options = {}) {
  const overridePrompt = text(options.promptOverride).trim();
  if (overridePrompt) return overridePrompt;

  if (options.includePending !== false) {
    const pendingPrompt = text(state.pendingChatPrompt).trim();
    if (pendingPrompt) return pendingPrompt;
  }

  return text(elements.promptInput?.value).trim();
}

function localizeDisplayName(value) {
  const source = text(value).trim();
  if (DISPLAY_NAME_MAP[source]) return DISPLAY_NAME_MAP[source];

  const tokenMap = {
    agent: '鏅鸿兘浣?',
    narrative: '鍙欎簨',
    engine: '寮曟搸',
    outline: '澶х翰',
    worldbuilding: '涓栫晫瑙?',
    dialogue: '瀵圭櫧',
    writer: '鍐欎綔',
    polish: '娑﹁壊',
    comic: '婕敾',
    creator: '鐢熸垚',
    script: '鑴氭湰',
    storyboard: '鍒嗛暅',
    character: '瑙掕壊',
    design: '璁捐',
    recovery: '鎭㈠',
    session: '浼氳瘽',
    sandbox: '娌欑洅',
    terminal: '缁堢',
    diff: '宸紓',
    preview: '棰勮',
    spec: '瑙勬牸',
    plan: '瑙勫垝',
    planner: '瑙勫垝',
    orchestrator: '缂栨帓鍣?',
    backend: '鍚庣',
    frontend: '鍓嶇',
    debug: '璋冭瘯',
    memory: '璁板繂',
    knowledge: '鐭ヨ瘑',
    graph: '鍥捐氨',
    generator: '鐢熸垚鍣?',
    language: '璇█',
    selector: '閫夋嫨',
    typescript: 'TypeScript',
    review: '瀹℃煡',
    architect: '鏋舵瀯',
    software: '杞欢',
    harness: '缂栨帓',
    construction: '鏋勫缓',
    optimizer: '浼樺寲',
    loop: '闀垮惊鐜?',
    operator: '鎵ц',
    devops: '杩愮淮',
    agency: 'Agency',
    ecc: 'ECC',
    data: '鏁版嵁',
    acquisition: '閲囬泦',
    processing: '澶勭悊',
    strategy: '绛栫暐',
    backtesting: '鍥炴祴',
    risk: '椋庢帶',
    management: '绠＄悊',
    multimodal: '澶氭ā鎬?',
    perception: '鎰熺煡',
  };

  const tokens = source
    .replace(/([a-z])([A-Z])/gu, '$1-$2')
    .split(/[\s_-]+/gu)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const localized = tokens.map((token) => tokenMap[token] || token.toUpperCase()).join('');
  return localized || source;
}

function localizeRole(value) {
  const source = text(value).trim();
  return ROLE_MAP[source] || source;
}

function localizeToken(value) {
  const source = text(value).trim();
  return TOKEN_MAP[source] || source;
}

function localizeRecipeLabel(value) {
  const source = text(value).trim();
  return RECIPE_LABEL_MAP[source] || source;
}

function localizeCatalogText(value) {
  const source = text(value).trim();
  if (!source) return '';
  if (source.startsWith('Imported into ') && source.includes('shared harness runtime')) {
    return '宸插鍏ュ埌褰撳墠鍏变韩缂栨帓杩愯鏃躲€?';
  }
  return EXACT_TEXT_MAP.get(source) || source;
}

function localizeTurnKind(value) {
  return localizeToken(value) || text(value).trim();
}

function localizeDynamicText(value) {
  let result = text(value);
  if (!result.trim()) return '';

  for (const [from, to] of DYNAMIC_TEXT_REPLACEMENTS) {
    result = result.replaceAll(from, to);
  }

  const displayEntries = Array.from(DISPLAY_NAME_TEXT_MAP.entries()).sort((left, right) => right[0].length - left[0].length);
  for (const [from, to] of displayEntries) {
    result = result.replaceAll(from, to);
  }

  result = result
    .replace(/\bSession:\s*/gu, '浼氳瘽锛?')
    .replace(/\bTurn (\d+) \[(.+?)\]/gu, (_, index, kind) => `Round ${index} [${localizeTurnKind(kind)}]`)
    .replace(/\bStep (\d+):/gu, '姝ラ $1锛?')
    .replace(/\bMode:\s*harness\b/gu, '妯″紡: 缂栨帓')
    .replace(/\bMode:\s*single\b/gu, '妯″紡: 鍗曚綋')
    .replace(/\bMode:\s*compose\b/gu, '妯″紡: 缁勫悎')
    .replace(/\bmode:\s*harness\b/gu, '妯″紡: 缂栨帓')
    .replace(/\bmode:\s*single\b/gu, '妯″紡: 鍗曚綋')
    .replace(/\bmode:\s*compose\b/gu, '妯″紡: 缁勫悎')
    .replace(/\bFusion\b/gu, '铻嶅悎');

  return result;
}

function escapeHtml(value) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function plainText(value) {
  return text(value)
    .replace(/\*\*/gu, '')
    .replace(/`/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function sanitizeVisibleOutput(value) {
  return text(value)
    .replaceAll(TECHNICAL_COMPLETE_MARKER, '')
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/giu, '')
    .replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/giu, '')
    .trim();
}

const USER_FACING_SCAFFOLD_PATTERNS = [
  /^?????/u,
  /^[????/u,
  /^??????[:?]/u,
  /^????[:?]/u,
  /^???[:?]?$/u,
  /^?????[:?]?$/u,
  /^??????[:?]?$/u,
  /^??????[:?]?$/u,
  /^????????/u,
  /^???[:?]/u,
  /^???[:?]/u,
  /^????[:?]/u,
  /^????[:?]/u,
  /^????[:?]/u,
  /^????[:?]?$/u,
  /^????[:?]?$/u,
  /^????[:?]?$/u,
  /^??????[:?]?$/u,
  /^?????????/u,
  /^??????/u,
  /^(???|??).+Agent/u,
  /^?????/u,
];

function looksLikeUserFacingScaffoldLine(line) {
  const value = text(line).trim();
  if (!value) return false;

  if (USER_FACING_SCAFFOLD_PATTERNS.some((pattern) => pattern.test(value))) {
    return true;
  }

  return /^-\s*(鐩爣|浜や粯鐗﹟浜ゆ帴|浠诲姟|棰嗗煙|妯″紡|涓讳氦浠榺宸ヤ綔娴亅Session)[:锛歖/u.test(value);
}

function stripUserFacingScaffold(value) {
  const source = text(value).trim();
  if (!source) return '';

  const paragraphs = source
    .split(/\n{2,}/gu)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const cleaned = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph
      .split(/\r?\n/gu)
      .map((line) => line.trimEnd());
    const metaCount = lines.filter((line) => looksLikeUserFacingScaffoldLine(line)).length;

    if (lines[0] && looksLikeUserFacingScaffoldLine(lines[0])) continue;
    if (metaCount >= Math.max(2, Math.ceil(lines.length / 2))) continue;

    const nextParagraph = lines.filter((line) => !looksLikeUserFacingScaffoldLine(line)).join('\n').trim();
    if (nextParagraph) {
      cleaned.push(nextParagraph);
    }
  }

  return cleaned.join('\n\n').replace(/\n{3,}/gu, '\n\n').trim();
}

function stripLeadingDisplayMetaPreface(value) {
  const source = text(value).trim();
  if (!source) return '';

  const startMatchers = [
    /(?:^|\n)\s*#\s+[^\n]+/u,
    /(?:^|\n)\s*##\s*绗琜涓€浜屼袱涓夊洓浜斿叚涓冨叓涔濆崄鐧惧崈闆躲€嘰d]+\s*绔?u,
    /(?:^|\n)\s*绗琜涓€浜屼袱涓夊洓浜斿叚涓冨叓涔濆崄鐧惧崈闆躲€嘰d]+\s*绔?u,
  ];

  let startIndex = -1;
  for (const matcher of startMatchers) {
    const match = source.match(matcher);
    if (!match || typeof match.index !== 'number') continue;
    const currentIndex = match[0].startsWith('\n') ? match.index + 1 : match.index;
    if (startIndex === -1 || currentIndex < startIndex) {
      startIndex = currentIndex;
    }
  }

  if (startIndex <= 0) return source;

  const leading = source.slice(0, startIndex).trim();
  const metaPatterns = [
    /^\u8fd9\u662f\u4e00\u4e2a/u,
    /^\u8fd9\u662f\u4e00\u7bc7/u,
    /^\u4f46\u662f[,\uff0c]/u,
    /^\u4e0d\u8fc7[,\uff0c]/u,
    /^\u7b49\u7b49[,\uff0c]?/u,
    /^\u8ba9\u6211/u,
    /^\u6240\u4ee5\u8fd9\u91cc\u6709\u4e2a\u95ee\u9898/u,
    /^\u6211\u9700\u8981/u,
    /^\u73b0\u5728\u5f00\u59cb\u5199/u,
    /^(?:-+\s*)?(?:\u7528\u6237\u8981\u6c42|\u5f53\u524d\u9636\u6bb5|\u9636\u6bb5\u76ee\u6807|\u9636\u6bb5\u4ea4\u4ed8)[:\uff1a]/u,
    /^(?:\u6211\u4f5c\u4e3a|\u4f5c\u4e3a).+Agent/iu,
  ];
  const lines = leading
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter(Boolean);
  const metaHits = lines.filter((line) => metaPatterns.some((pattern) => pattern.test(line))).length;

  if (metaHits >= Math.max(1, Math.floor(lines.length / 3))) {
    return source.slice(startIndex).trim();
  }

  return source;
}

function stripCenterStatusNoise(value) {
  return text(value)
    .replace(/(?:^|\n)杩愯鐘舵€乕^\n]*/gu, '\n')
    .replace(/(?:^|\n)鎬濊€冧腑[^\n]*/gu, '\n')
    .replace(/(?:^|\n)浠诲姟杩涘害[^\n]*(?:\n宸蹭粠[^\n]*)?/gu, '\n')
    .replace(/(?:^|\n)璋冪敤宸ュ叿[^\n]*(?:\n(?!杩愯鐘舵€亅鎬濊€冧腑|浠诲姟杩涘害|褰撳墠浣跨敤|璋冪敤 Agent|pool\b)[^\n]*)?/gu, '\n')
    .replace(/(?:^|\n)褰撳墠浣跨敤[^\n]*/gu, '\n')
    .replace(/(?:^|\n)璋冪敤 Agent[^\n]*(?:\n(?!杩愯鐘舵€亅鎬濊€冧腑|浠诲姟杩涘害|褰撳墠浣跨敤|璋冪敤宸ュ叿|pool\b)[^\n]*)?/gu, '\n')
    .replace(/(?:^|\n)pool[^\n]*/giu, '\n')
    .replace(/(?:^|\n)LLM 璇锋眰寮傚父[:锛歖[^\n]*/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function extractDisplayOutput(value) {
  const content = stripLeadingDisplayMetaPreface(stripUserFacingScaffold(
    stripCenterStatusNoise(sanitizeVisibleOutput(localizeDynamicText(value))),
  ));
  if (!content) return '';

  const sectionTitles = ['鏈€缁堢粨鏋?', '鏈€缁堝洖绛?', '姝ｆ枃', '鎴愮', '杈撳嚭姝ｆ枃', '浜や粯鍐呭', '鏈€缁堟柟妗?'];
  for (const title of sectionTitles) {
    const pattern = new RegExp(`${title}[\\s\\S]*?(?=\\n[A-Z涓€-榫[^\\n]{0,20}\\n|\\n[A-Z涓€-榫[^\\n]{0,20}:|$)`, 'u');
    const match = content.match(pattern);
    if (match?.[0]) {
      const candidate = match[0].trim();
      if (!/宸ヤ綔娴亅绯荤粺缂栨帓灞倈鍏抽敭璇嶈Е鍙戝眰|棰嗗煙鎵ц灞倈Agent 鐢熷懡鍛ㄦ湡|浠诲姟鎬昏/u.test(candidate)) {
        return candidate;
      }
    }
  }

  if (/浠诲姟鎬昏/u.test(content) && /缂栨帓鍒嗗眰/u.test(content) && /Agent 鐢熷懡鍛ㄦ湡/u.test(content)) {
    return '';
  }

  return content;
}

function extractResultPanelOutput(value) {
  const content = stripLeadingDisplayMetaPreface(stripUserFacingScaffold(
    stripCenterStatusNoise(sanitizeVisibleOutput(localizeDynamicText(value))),
  )).trim();
  if (!content) return '';

  if (/浠诲姟鎬昏/u.test(content) && /缂栨帓鍒嗗眰/u.test(content)) {
    return '';
  }

  if (/宸ヤ綔娴佹媶瑙?u.test(content) && /Agent 鐢熷懡鍛ㄦ湡/u.test(content)) {
    return '';
  }

  return content;
}

function countVisibleChapters(value) {
  return Array.from(text(value).matchAll(/绗琝s*[涓€浜屼袱涓夊洓浜斿叚涓冨叓涔濆崄鐧惧崈闆躲€嘰d]+\s*绔?gu)).length;
}

function choosePreferredVisibleOutput(primary, secondary) {
  const left = extractResultPanelOutput(primary);
  const right = extractResultPanelOutput(secondary);
  if (!left) return right;
  if (!right) return left;

  const leftChapters = countVisibleChapters(left);
  const rightChapters = countVisibleChapters(right);
  if (leftChapters !== rightChapters) {
    return leftChapters > rightChapters ? left : right;
  }

  return left.length >= right.length ? left : right;
}

function compactText(value, maxLength = 120) {
  const content = plainText(value);
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return `${content.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function safePreviewText(value, maxLength = 60) {
  const content = compactText(value, maxLength);
  if (!content) return '绌虹櫧浠诲姟';

  const questionMarkCount = (content.match(/\?/gu) || []).length;
  if (questionMarkCount >= Math.max(4, Math.floor(content.length / 3))) {
    return '鍘嗗彶鏂囨湰缂栫爜寮傚父';
  }

  return content;
}

function latestPromptChunk(value) {
  const content = text(value).trim();
  if (!content) return '';

  const lines = content
    .split(/\r?\n/gu)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines[lines.length - 1] || content;
}

function normalizeLineBreaks(value) {
  return text(value).replace(/\r\n/gu, '\n');
}

function derivePromptDelta(currentValue, previousValue = '') {
  const current = normalizeLineBreaks(currentValue).trim();
  const previous = normalizeLineBreaks(previousValue).trim();
  if (!current) return '';
  if (!previous) return current;
  if (current === previous) return current;

  if (current.startsWith(previous)) {
    const tail = current.slice(previous.length).replace(/^\s+/u, '').trim();
    return tail || current;
  }

  return current;
}

function splitInstructionBlocks(value) {
  const content = normalizeLineBreaks(value).trim();
  if (!content) return [];

  return content
    .split(/\n{2,}/gu)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectUserInstructionEntries() {
  const entries = [];
  const sessionTurns = Array.isArray(state.activeSession?.turns) ? state.activeSession.turns : [];
  let previousPrompt = '';

  for (const turn of sessionTurns) {
    const prompt = text(turn?.prompt).trim();
    if (!prompt) continue;

    const delta = derivePromptDelta(prompt, previousPrompt);
    const blocks = splitInstructionBlocks(delta);
    if (blocks.length) {
      for (const block of blocks) {
        entries.push({
          kind: 'user',
          text: sanitizeVisibleOutput(localizeDynamicText(block)),
          meta: turn?.createdAt ? formatDateTime(turn.createdAt) : '',
        });
      }
    }

    previousPrompt = prompt;
  }

  const draftPrompt = text(elements.promptInput?.value).trim();
  const latestSessionPrompt = text(sessionTurns[sessionTurns.length - 1]?.prompt).trim();
  const pendingDelta = derivePromptDelta(draftPrompt, latestSessionPrompt);
  if (pendingDelta && pendingDelta !== latestSessionPrompt) {
    for (const block of splitInstructionBlocks(pendingDelta)) {
      const normalized = sanitizeVisibleOutput(localizeDynamicText(block));
      if (!normalized) continue;
      if (entries[entries.length - 1]?.text === normalized) continue;
      entries.push({
        kind: 'user',
        text: normalized,
        meta: '寰呭彂閫?',
      });
    }
  } else if (!entries.length && draftPrompt) {
    for (const block of splitInstructionBlocks(draftPrompt)) {
      entries.push({
        kind: 'user',
        text: sanitizeVisibleOutput(localizeDynamicText(block)),
        meta: '寰呭彂閫?',
      });
    }
  }

  return entries;
}

function unique(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function formatDateTime(iso) {
  if (!iso) return '鍒氬垰';

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return text(iso);
  }
}

function shortSessionId(sessionId) {
  const value = text(sessionId).trim();
  if (!value) return '鏈粦瀹?';
  if (value.length <= 20) return value;
  return `${value.slice(0, 16)}...`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || `璇锋眰澶辫触锛?{response.status}`);
  }

  return payload;
}

function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.runtime);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadStoredSessionId() {
  try {
    return text(localStorage.getItem(STORAGE_KEYS.sessionId)).trim();
  } catch {
    return '';
  }
}

function loadStoredLayout() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.layout) || '{}');
  } catch {
    return {};
  }
}

function loadStoredAgentFilter() {
  try {
    const value = text(localStorage.getItem(STORAGE_KEYS.agentFilter)).trim();
    return value || 'all';
  } catch {
    return 'all';
  }
}

function saveStoredSessionId(sessionId) {
  if (!sessionId) return;
  localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
}

function clearStoredSessionId() {
  localStorage.removeItem(STORAGE_KEYS.sessionId);
}

function saveStoredLayout() {
  localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify(state.ui));
}

function saveStoredAgentFilter() {
  localStorage.setItem(STORAGE_KEYS.agentFilter, state.agentFilter);
}

function collectRuntimeConfig() {
  return {
    baseUrl: elements.baseUrlInput.value.trim(),
    model: elements.modelInput.value.trim(),
    apiStyle: elements.apiStyleInput.value,
    temperature: Number(elements.temperatureInput.value || 0.4),
    apiKey: elements.apiKeyInput.value.trim(),
  };
}

function saveStoredConfig() {
  localStorage.setItem(STORAGE_KEYS.runtime, JSON.stringify(collectRuntimeConfig()));
}

function currentMode() {
  return elements.modeSelect.value || 'harness';
}

function currentDomain() {
  return elements.domainSelect.value || 'coding';
}

function currentSelectedAgentIds() {
  return Array.from(state.selectedAgents);
}

function currentSessionId() {
  return state.currentSessionId || elements.sessionIdInput.value.trim();
}

function getDomainLabel(domainId) {
  return state.config?.domains?.find((domain) => domain.id === domainId)?.label || domainId;
}

function agentMap() {
  return new Map((state.catalog?.allAgents || state.catalog?.agents || []).map((agent) => [agent.id, agent]));
}

function getAgent(agentId) {
  return agentMap().get(agentId) || null;
}

function isImportedAgent(agentId) {
  return Boolean(getAgent(agentId)?.sourcePack);
}

function selectedImportedAgentIds() {
  return currentSelectedAgentIds().filter((agentId) => isImportedAgent(agentId));
}

function resolveWorkflowIds() {
  if (!state.catalog) return [];

  const domain = state.catalog.domain;
  const template = domain.workflows?.[currentMode()] || [];

  if (currentMode() === 'single') {
    return [currentSelectedAgentIds()[0] || domain.defaultAgent].filter(Boolean);
  }

  const systemAgents = template.filter((agentId) => SYSTEM_AGENT_IDS.has(agentId));
  const templateDomainAgents = template.filter((agentId) => !SYSTEM_AGENT_IDS.has(agentId));
  const preferredDomainAgents = currentSelectedAgentIds().filter((agentId) => !SYSTEM_AGENT_IDS.has(agentId));

  return unique([...systemAgents, ...preferredDomainAgents, ...templateDomainAgents]);
}

function activeWorkflowDescriptors() {
  if (state.activeRun?.workflow?.length) return state.activeRun.workflow;
  if (state.preview?.workflow?.length) return state.preview.workflow;

  return resolveWorkflowIds()
    .map((agentId) => getAgent(agentId))
    .filter(Boolean);
}

function currentLeadAgent() {
  const workflow = activeWorkflowDescriptors();
  return workflow.find((agent) => !SYSTEM_AGENT_IDS.has(agent.id)) || workflow[0] || null;
}

function currentAgentRuntime() {
  return state.activeRun?.agentRuntime || state.preview?.agentRuntime || state.activeSession?.agentRuntime || null;
}

function runtimePoolCounts() {
  return currentAgentRuntime()?.pools?.counts || {
    standby: 0,
    activationPool: 0,
    active: 0,
    cooling: 0,
    frozen: 0,
  };
}

function agentRuntimeStateFor(agentId) {
  const runtime = currentAgentRuntime();
  if (!runtime || !agentId) return '';

  const matchIn = (items) => (items || []).find((item) => item.id === agentId)?.state || '';
  return (
    matchIn(runtime.activeAgents) ||
    matchIn(runtime.activationPool) ||
    matchIn(runtime.pools?.active) ||
    matchIn(runtime.pools?.activationPool) ||
    matchIn(runtime.pools?.cooling) ||
    matchIn(runtime.pools?.frozen) ||
    matchIn(runtime.pools?.standby) ||
    ''
  );
}

function runtimeCapabilityTags() {
  const runtime = currentAgentRuntime();
  if (!runtime) return [];

  return unique([...(runtime.capabilities?.previewModes || []), ...(runtime.capabilities?.tools || [])]).slice(0, 6);
}

function currentPortableHarness() {
  return state.activeRun?.portableHarness || state.preview?.portableHarness || state.activeSession?.portableHarness || null;
}

function portableActivationPlan() {
  return (
    currentPortableHarness()?.activationPlan || {
      complexityScore: 0,
      required: [],
      suggested: [],
      recommended: [],
      selective: [],
    }
  );
}

function portableActivationCounts() {
  const plan = portableActivationPlan();
  return {
    l1: plan.required?.length || 0,
    l2: plan.suggested?.length || 0,
    l3: plan.recommended?.length || 0,
    l4: plan.selective?.length || 0,
    complexity: Number(plan.complexityScore || 0),
  };
}

function portableToolNames(limit = 6) {
  return unique((currentPortableHarness()?.toolPool?.tools || []).map((tool) => tool.name).filter(Boolean)).slice(0, limit);
}

function portableBackendEntries() {
  const backendPolicy = currentPortableHarness()?.backendPolicy || {};
  return ['terminal', 'network', 'multimodal', 'browser', 'diff']
    .map((id) => ({ id, ...(backendPolicy[id] || {}) }))
    .filter((entry) => entry.mode || entry.id);
}

function portableTargetLabel() {
  const target = currentPortableHarness()?.target;
  return localizeDisplayName(target?.displayName || target?.id) || localizeDisplayName(currentLeadAgent()?.displayName || '鏈懡涓?');
}

function displayLlmLabel() {
  if (state.activeRun?.llm?.usedLlm) {
    return state.activeRun.llm.model || '鐪熷疄 LLM';
  }

  if (collectRuntimeConfig().apiKey && collectRuntimeConfig().model) {
    return collectRuntimeConfig().model || '鏈湴鐩磋繛';
  }

  if (state.config?.runtime?.llm?.configured) {
    return state.config.runtime.llm.model || '鐜鐩磋繛';
  }

  return '妯℃嫙妯″紡';
}

function displayStageLabel() {
  if (state.isRunning) return '杩愯涓?';
  if (state.activeRun) return '宸插畬鎴?';
  if (state.preview) return 'SPEC 棰勮';
  return '寰呭懡';
}

function clipMessageText(value, maxLength = 320) {
  return compactText(text(value).trim(), maxLength);
}

function currentLlmLabel() {
  if (state.activeRun?.llm?.usedLlm) {
    return state.activeRun.llm.model || '鐪熷疄 LLM';
  }

  if (collectRuntimeConfig().apiKey && collectRuntimeConfig().model) {
    return collectRuntimeConfig().model || '鏈湴鐩磋繛';
  }

  if (state.config?.runtime?.llm?.configured) {
    return state.config.runtime.llm.model || '鐜鐩磋繛';
  }

  return '妯℃嫙妯″紡';
}

function currentStageLabel() {
  if (state.isRunning) return '杩愯涓?';
  if (state.activeRun) return '宸茶繍琛?';
  if (state.preview) return 'SPEC 棰勮';
  return '寰呰繍琛?';
}

function renderRuntimeStatus() {
  const envConfigured = Boolean(state.config?.runtime?.llm?.configured);
  const localConfigured = Boolean(collectRuntimeConfig().apiKey && collectRuntimeConfig().model);

  if (localConfigured) {
    elements.runtimeStatus.textContent = '宸茬洿杩?';
    elements.runtimeStatus.dataset.status = 'configured';
    return;
  }

  if (envConfigured) {
    elements.runtimeStatus.textContent = '鐜';
    elements.runtimeStatus.dataset.status = 'configured';
    return;
  }

  elements.runtimeStatus.textContent = '妯℃嫙';
  elements.runtimeStatus.dataset.status = 'simulation';
}

function renderDomainOptions() {
  const domains = state.config?.domains || [];
  elements.domainSelect.innerHTML = domains
    .map((domain) => `<option value="${escapeHtml(domain.id)}">${escapeHtml(domain.label)}</option>`)
    .join('');
}

function renderModePills() {
  const activeMode = currentMode();
  elements.modePills.innerHTML = Object.entries(MODE_META)
    .map(
      ([mode, meta]) => `
        <button
          type="button"
          class="mode-pill ${mode === activeMode ? 'is-active' : ''}"
          data-mode="${escapeHtml(mode)}"
          title="${escapeHtml(meta.description)}"
        >
          ${escapeHtml(meta.label)}
        </button>
      `,
    )
    .join('');

  for (const button of elements.modePills.querySelectorAll('[data-mode]')) {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode);
    });
  }
}

function setWorkbenchView(viewId) {
  state.workbenchView = ['task', 'spec', 'workflow', 'output'].includes(viewId) ? viewId : 'task';
  renderWorkbenchTabs();
}

function renderWorkbenchTabs() {
  const buttons = elements.workbenchTabs?.querySelectorAll('[data-workbench-view]') || [];
  for (const button of buttons) {
    const active = button.dataset.workbenchView === state.workbenchView;
    button.classList.toggle('is-active', active);
  }

  for (const panel of document.querySelectorAll('[data-editor-view]')) {
    panel.classList.toggle('is-active', panel.dataset.editorView === state.workbenchView);
  }
}

function applyLayoutState() {
  const leftCollapsed = state.ui.zen ? true : Boolean(state.ui.leftCollapsed);
  const rightCollapsed = state.ui.zen ? true : Boolean(state.ui.rightCollapsed);

  elements.pageShell.dataset.leftCollapsed = String(leftCollapsed);
  elements.pageShell.dataset.rightCollapsed = String(rightCollapsed);
  elements.pageShell.dataset.zen = String(Boolean(state.ui.zen));

  const controls = [
    { element: elements.toggleLeftRailButton, active: !leftCollapsed, label: '宸︽爮' },
    { element: elements.toggleRightRailButton, active: !rightCollapsed, label: '鍙虫爮' },
    { element: elements.toggleZenButton, active: Boolean(state.ui.zen), label: '鑱氱劍' },
  ];

  for (const control of controls) {
    if (!control.element) continue;
    control.element.classList.toggle('is-active', control.active);
    control.element.setAttribute('aria-pressed', control.active ? 'true' : 'false');
    control.element.textContent = control.label;
  }

  saveStoredLayout();
}

function setAgentFilter(filterId) {
  state.agentFilter = ['all', 'selected', 'system', 'domain', 'fusion'].includes(filterId)
    ? filterId
    : 'all';
  saveStoredAgentFilter();
  renderAgentFilterPills();
  renderAgentDeck();
}

function syncPromptMeta() {
  const length = activePromptText().length;
  const workflowSize = resolveWorkflowIds().length;
  elements.promptMeta.textContent = `${length} 瀛?/ ${workflowSize} 涓櫤鑳戒綋`;
}

function renderAgentFilterPills() {
  const agents = state.catalog?.agents || [];
  const counts = {
    all: agents.length,
    selected: agents.filter((agent) => state.selectedAgents.has(agent.id)).length,
    system: agents.filter((agent) => SYSTEM_AGENT_IDS.has(agent.id)).length,
    domain: agents.filter((agent) => !SYSTEM_AGENT_IDS.has(agent.id) && !agent.sourcePack).length,
    fusion: agents.filter((agent) => agent.sourcePack).length,
  };

  const filters = [
    { id: 'all', label: '鍏ㄩ儴' },
    { id: 'selected', label: '宸查€? }',
    { id: 'system', label: '绯荤粺' },
    { id: 'domain', label: '棰嗗煙' },
    { id: 'fusion', label: '铻嶅悎' },
  ];

  elements.agentFilterPills.innerHTML = filters
    .map(
      (filter) => `
        <button
          type="button"
          class="filter-pill ${state.agentFilter === filter.id ? 'is-active' : ''}"
          data-agent-filter="${escapeHtml(filter.id)}"
        >
          ${escapeHtml(filter.label)}
          <small>${escapeHtml(String(counts[filter.id] || 0))}</small>
        </button>
      `,
    )
    .join('');

  for (const button of elements.agentFilterPills.querySelectorAll('[data-agent-filter]')) {
    button.addEventListener('click', () => {
      setAgentFilter(button.dataset.agentFilter);
    });
  }
}

function renderExampleList() {
  const examples = state.catalog?.domain?.examples || [];
  elements.exampleList.innerHTML = examples
    .map(
      (example) => `
        <button class="example-button" data-example="${escapeHtml(example)}" type="button">
          ${escapeHtml(compactText(example, 28))}
        </button>
      `,
    )
    .join('');

  for (const button of elements.exampleList.querySelectorAll('[data-example]')) {
    button.addEventListener('click', () => {
      elements.promptInput.value = button.dataset.example || '';
      syncPromptMeta();
      scheduleFusionRefresh();
      renderChatStream();
      elements.promptInput.focus();
    });
  }
}

function renderSelectionSummary() {
  if (!state.catalog) {
    elements.selectionSummary.innerHTML = '<div class="empty-state">绛夊緟杞藉叆</div>';
    return;
  }

  const workflowIds = resolveWorkflowIds();
  const domain = state.catalog.domain;
  const leadId =
    workflowIds.find((agentId) => !SYSTEM_AGENT_IDS.has(agentId)) ||
    workflowIds[0] ||
    domain.defaultAgent;
  const fusionCount = Math.max(
    state.fusionAnalysis?.selectedImportedAgentIds?.length || 0,
    selectedImportedAgentIds().length,
  );

  const chips = [
    { label: '棰嗗煙', value: domain.label },
    { label: '妯″紡', value: MODE_META[currentMode()].label },
    { label: '涓绘帶', value: compactText(localizeDisplayName(getAgent(leadId)?.displayName || leadId), 20) },
    { label: '閾捐矾', value: `${workflowIds.length} 姝?/ ${fusionCount} 铻嶅悎` },
    { label: '浼氳瘽', value: shortSessionId(currentSessionId()) },
  ];

  elements.selectionSummary.innerHTML = chips
    .map(
      (chip) => `
        <article class="summary-chip">
          <span>${escapeHtml(chip.label)}</span>
          <strong>${escapeHtml(chip.value)}</strong>
        </article>
      `,
    )
    .join('');
}

function renderWorkspacePulse() {
  if (!state.catalog) {
    elements.workspacePulse.innerHTML = '<div class="empty-state">绛夊緟杞藉叆鐘舵€佽剦鍐?/div>';
    return;
  }

  const workflow = activeWorkflowDescriptors();
  const fusionRecipes = state.fusionAnalysis?.matchedRecipes?.length || 0;
  const selectedImported = Math.max(
    state.fusionAnalysis?.selectedImportedAgentIds?.length || 0,
    selectedImportedAgentIds().length,
  );
  const warnings = state.activeRun?.warnings?.length || 0;
  const sessionLabel = state.activeSession?.id ? shortSessionId(state.activeSession.id) : '鏂颁細璇?';

  const cards = [
    {
      label: '褰撳墠鐘舵€?',
      value: currentStageLabel(),
      copy: state.isRunning ? '缂栨帓姝ｅ湪璇锋眰鎵ц缁撴灉' : warnings ? `${warnings} 鏉¤鍛婄瓑寰呭鐞哷 : '鍙互缁х画鎺ㄨ繘'`,
      tone: warnings ? 'danger' : state.activeRun ? 'accent' : state.preview ? 'blue' : 'neutral',
    },
    {
      label: '鎵ц鏍?',
      value: `${workflow.length} 涓楠`,
      copy: `${currentSelectedAgentIds().length} 涓凡閫?/ ${MODE_META[currentMode()].label}`,
      tone: 'teal',
    },
    {
      label: '铻嶅悎',
      value: fusionRecipes ? `${fusionRecipes} 缁勯厤鏂筦 : '鏈懡涓?'`,
      copy: `${selectedImported} 涓凡瀵煎叆鏅鸿兘浣揱`,
      tone: fusionRecipes ? 'accent' : 'neutral',
    },
    {
      label: '浼氳瘽',
      value: sessionLabel,
      copy: state.activeSession?.id
        ? `${state.activeSession.turnCount || 0} 杞璇?/ ${state.activeSession.runCount || 0} 娆¤繍琛宍
        : '杩樻病缁戝畾鍏变韩浼氳瘽',
      tone: 'blue',
    },
    {
      label: '鎵ц婧?',
      value: currentLlmLabel(),
      copy: state.activeRun?.llm?.usedLlm ? '鐪熷疄妯″瀷鎵ц' : '鍙垏鎹㈡湰鍦扮洿杩炴垨鐜鐩磋繛',
      tone: state.activeRun?.llm?.usedLlm ? 'gold' : 'neutral',
    },
  ];

  elements.workspacePulse.innerHTML = cards
    .map(
      (card) => `
        <article class="pulse-card">
          <span class="pulse-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="pulse-copy">${escapeHtml(card.copy)}</p>
          <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
        </article>
      `,
    )
    .join('');
}

function renderWorkflowPreview() {
  const workflowIds = resolveWorkflowIds();
  if (!workflowIds.length) {
    elements.workflowPreview.textContent = '绛夊緟杞藉叆';
    return;
  }

  const previewIds = workflowIds.slice(0, 6);
  const hiddenCount = Math.max(0, workflowIds.length - previewIds.length);

  elements.workflowPreview.innerHTML = previewIds
    .map((agentId) => {
      const descriptor = getAgent(agentId);
      return `<span class="workflow-chip">${escapeHtml(localizeDisplayName(descriptor?.displayName || agentId))}</span>`;
    })
    .join('')
    .concat(hiddenCount ? `<span class="workflow-chip">+${escapeHtml(String(hiddenCount))}</span>` : '');
}

function renderFusionPanel() {
  const fusion = state.fusionAnalysis || state.catalog?.fusion;

  if (!fusion) {
    elements.fusionMeta.textContent = '绛夊緟鍒嗘瀽';
    elements.fusionSources.innerHTML = '<div class="empty-state">绛夊緟杞藉叆铻嶅悎鍖?/div>';
    elements.fusionRecipes.innerHTML = '<div class="empty-state">绛夊緟鍖归厤铻嶅悎閰嶆柟</div>';
    return;
  }

  const sourcePacks = fusion.sourcePacks || [];
  const recipes = fusion.recipes || [];
  const matchedRecipes = fusion.matchedRecipes || [];
  const selectedImported = fusion.selectedImportedAgentIds || [];
  const cards = matchedRecipes.length
    ? [...matchedRecipes, ...recipes.filter((recipe) => !matchedRecipes.some((item) => item.id === recipe.id)).slice(0, 2)]
    : recipes.slice(0, 3);

  elements.fusionMeta.textContent = `${sourcePacks.length} 涓寘 / ${selectedImported.length} 涓凡閫塦`;

  elements.fusionSources.innerHTML = sourcePacks.length
    ? sourcePacks
        .map(
          (item) => `
            <article class="fusion-pack ${item.exists ? '' : 'is-missing'}">
              <div class="fusion-pack-head">
                <strong>${escapeHtml(item.id)}</strong>
                <span class="micro-note">${escapeHtml(`${item.agentCount} 涓櫤鑳戒綋 / ${item.recipeCount} 缁勯厤鏂筦)}</span>
              </div>
              <p>${escapeHtml(compactText(item.root, 58))}</p>
            </article>
          `,
        )
        .join('')
    : '<div class="empty-state">娌℃湁鍙敤铻嶅悎鍖?/div>';

  elements.fusionRecipes.innerHTML = cards.length
    ? cards
        .map(
          (recipe) => `
            <article class="fusion-recipe ${recipe.isMatched ? 'is-matched' : ''}">
              <div class="fusion-recipe-head">
                <strong>${escapeHtml(localizeRecipeLabel(recipe.label || recipe.id))}</strong>
                <span class="micro-note">${escapeHtml((recipe.sourcePacks || []).join(' / ') || '鏈湴')}</span>
              </div>
              <p>${escapeHtml(compactText(localizeCatalogText(recipe.summary || recipe.id), 92))}</p>
              <div class="fusion-recipe-meta">
                <span class="agent-badge">${escapeHtml(`${(recipe.selectedAgentIds || []).length} 涓櫤鑳戒綋`)}</span>
                ${
                  recipe.matchedKeywords?.length
                    ? `<span class="agent-badge" data-pack="matched">${escapeHtml(recipe.matchedKeywords.map((keyword) => localizeToken(keyword)).join(', '))}</span>`
                    : ''
                }
              </div>
            </article>
          `,
        )
        .join('')
    : '<div class="empty-state">娌℃湁鍖归厤鍒拌瀺鍚堥厤鏂?/div>';
}

function buildFusionUrl() {
  const params = new URLSearchParams({
    domain: currentDomain(),
    mode: currentMode(),
    prompt: activePromptText(),
  });

  for (const agentId of currentSelectedAgentIds()) {
    params.append('agent', agentId);
  }

  return `/api/fusion?${params.toString()}`;
}

async function refreshFusionAnalysis() {
  const requestId = ++state.fusionRequestId;

  try {
    const payload = await fetchJson(buildFusionUrl());
    if (requestId !== state.fusionRequestId) return;

    state.fusionAnalysis = payload;
    renderFusionPanel();
    renderSurfaceChrome();
  } catch {
    if (requestId !== state.fusionRequestId) return;

    state.fusionAnalysis = null;
    renderFusionPanel();
    renderSurfaceChrome();
  }
}

function scheduleFusionRefresh() {
  if (state.fusionTimer) {
    clearTimeout(state.fusionTimer);
  }

  state.fusionTimer = setTimeout(() => {
    refreshFusionAnalysis();
  }, 140);
}

function filteredAgents() {
  const domainAgentIds = new Set((state.catalog?.agents || []).map((agent) => agent.id));
  const agents = (state.catalog?.allAgents || state.catalog?.agents || []).filter((agent) => {
    switch (state.agentFilter) {
      case 'selected':
        return state.selectedAgents.has(agent.id);
      case 'system':
        return SYSTEM_AGENT_IDS.has(agent.id);
      case 'domain':
        return domainAgentIds.has(agent.id) && !SYSTEM_AGENT_IDS.has(agent.id) && !agent.sourcePack;
      case 'fusion':
        return Boolean(agent.sourcePack);
      default:
        return true;
    }
  });
  const query = state.agentQuery.trim().toLowerCase();
  const filtered = !query
    ? agents
    : agents.filter((agent) => {
        const haystack = [
          agent.id,
          agent.displayName,
          localizeDisplayName(agent.displayName),
          agent.role,
          localizeRole(agent.role),
          agent.summary,
          localizeCatalogText(agent.summary),
          agent.mission,
          localizeCatalogText(agent.mission),
          ...(agent.sceneTags || []),
          ...(agent.tags || []),
          ...(agent.tags || []).map((tag) => localizeToken(tag)),
          ...(agent.keywords || []),
        ]
          .join(' ')
          .toLowerCase();

        return query.split(/\s+/u).every((token) => haystack.includes(token));
      });

  return filtered.slice().sort((left, right) => {
    const leftScore =
      (state.selectedAgents.has(left.id) ? 4 : 0) +
      (SYSTEM_AGENT_IDS.has(left.id) ? 1 : 0) +
      (left.sourcePack ? 2 : 0);
    const rightScore =
      (state.selectedAgents.has(right.id) ? 4 : 0) +
      (SYSTEM_AGENT_IDS.has(right.id) ? 1 : 0) +
      (right.sourcePack ? 2 : 0);

    if (rightScore !== leftScore) return rightScore - leftScore;
    return text(left.displayName).localeCompare(text(right.displayName), 'zh-CN');
  });
}

function renderAgentDeck() {
  const agents = filteredAgents();

  if (!agents.length) {
    elements.agentDeck.innerHTML = '<div class="empty-state">娌℃湁鍖归厤缁撴灉</div>';
    return;
  }

  elements.agentDeck.innerHTML = agents
    .map((agent) => {
      const selected = state.selectedAgents.has(agent.id);
      const badges = unique([
        agent.sourcePack || '',
        ...(agent.tags || []).slice(0, 2),
      ]).filter(Boolean);
      return `
        <article class="agent-card ${selected ? 'is-selected' : ''}" data-agent-id="${escapeHtml(agent.id)}">
          <div class="agent-head">
            <span class="agent-name">${escapeHtml(localizeDisplayName(agent.displayName))}</span>
            <span class="agent-role">${escapeHtml(localizeRole(agent.role))}</span>
          </div>
          <p class="agent-summary">${escapeHtml(compactText(localizeCatalogText(agent.summary || agent.mission || ''), 90))}</p>
          <div class="agent-meta">
            ${
              badges.length
                ? badges
                    .map((badge) => {
                      const pack = badge === agent.sourcePack ? agent.sourcePack : 'matched';
                      return `<span class="agent-badge" data-pack="${escapeHtml(pack || 'matched')}">${escapeHtml(localizeToken(badge))}</span>`;
                    })
                    .join('')
                : `<span class="agent-badge" data-pack="matched">${escapeHtml(selected ? '宸查€?' : '鏈湴')}</span>`
            }
          </div>
        </article>
      `;
    })
    .join('');

  for (const card of elements.agentDeck.querySelectorAll('[data-agent-id]')) {
    card.addEventListener('click', () => {
      toggleSelectedAgent(card.dataset.agentId);
    });
  }
}

function renderRecentRuns() {
  const conversations = [];
  const seen = new Set();

  for (const item of state.sessions || []) {
    const sessionId = item.sessionId || item.id;
    if (!sessionId || seen.has(sessionId)) continue;
    seen.add(sessionId);
    conversations.push({ ...item, conversationId: sessionId });
    if (conversations.length >= 18) break;
  }

  if (!conversations.length) {
    elements.recentRuns.textContent = '杩樻病鏈変細璇?';
    return;
  }

  elements.recentRuns.innerHTML = conversations
    .map((session) => {
      const active =
        state.activeSession?.id === session.conversationId ||
        state.activeRun?.session?.id === session.conversationId ||
        (!session.sessionId && state.activeRun?.id === session.id);
      const localizedPreview = localizeDynamicText(session.promptPreview || '');
      return `
        <button
          type="button"
          class="recent-run-button ${active ? 'is-active' : ''}"
          data-session-id="${escapeHtml(session.conversationId)}"
          data-run-id="${escapeHtml(session.id)}"
        >
          <div class="recent-run-head">
            <strong class="recent-run-title">${escapeHtml(safePreviewText(localizedPreview, 28) || '鏈懡鍚嶄細璇?')}</strong>
            <span class="recent-run-time">${escapeHtml(formatDateTime(session.createdAt))}</span>
          </div>
          <p>${escapeHtml(`浼氳瘽锛?{shortSessionId(session.conversationId)}`)}</p>
        </button>
      `;
    })
    .join('');

  for (const button of elements.recentRuns.querySelectorAll('[data-session-id]')) {
    button.addEventListener('click', async () => {
      const sessionId = button.dataset.sessionId || '';
      if (sessionId.startsWith('session-')) {
        await hydrateSession(sessionId);
        return;
      }
      await hydrateRun(button.dataset.runId);
    });
  }
}

function renderSpecRounds(specPack) {
  if (!specPack?.rounds?.length) {
    elements.specRounds.textContent = '杩樻病鏈夌敓鎴?SPEC';
    return;
  }

  elements.specRounds.innerHTML = specPack.rounds
    .map(
      (round) => `
        <article class="spec-card">
          <h4>${escapeHtml(round.title)}</h4>
          <p class="spec-focus">${escapeHtml(compactText(round.focus, 60))}</p>
          <ul class="spec-list">
            ${round.decisions
              .slice(0, 3)
              .map((item) => `<li>${escapeHtml(compactText(item, 72))}</li>`)
              .join('')}
          </ul>
        </article>
      `,
    )
    .join('');
}

function renderWorkflow(workflow, drafts) {
  if (!workflow?.length) {
    elements.workflowTimeline.textContent = '杩樻病鏈夌敓鎴愬伐浣滄祦';
    return;
  }

  elements.workflowTimeline.innerHTML = workflow
    .map((agent, index) => {
      const draft = drafts?.[index];
      const kind = SYSTEM_AGENT_IDS.has(agent.id) ? 'system' : agent.sourcePack ? 'fusion' : 'domain';
      const kindLabel = kind === 'system' ? '绯荤粺' : kind === 'fusion' ? '铻嶅悎' : '棰嗗煙';
      const runtimeState = agentRuntimeStateFor(agent.id);
      const body = draft?.summary || draft?.objective || localizeCatalogText(agent.summary) || localizeRole(agent.role) || '';

      return `
        <article class="flow-node" data-kind="${escapeHtml(kind)}">
          <div class="flow-node-head">
            <div>
              <span class="node-pill">姝ラ ${index + 1}</span>
              <strong>${escapeHtml(localizeDisplayName(agent.displayName))}</strong>
            </div>
            <div>
              <span class="node-pill">${escapeHtml(kindLabel)}</span>
              ${runtimeState ? `<span class="node-pill">${escapeHtml(runtimeState)}</span>` : ''}
            </div>
          </div>
          <p>${escapeHtml(compactText(body, 92))}</p>
        </article>
      `;
    })
    .join('');
}

function renderInsightPanel() {
  if (!state.catalog) {
    elements.insightPanel.innerHTML = '<div class="empty-state">绛夊緟杞藉叆璇婃柇闈㈡澘</div>';
    return;
  }

  const leadAgent = currentLeadAgent();
  const fusionLabels = (state.fusionAnalysis?.matchedRecipes || []).map((item) => localizeRecipeLabel(item.label || item.id));
  const warnings = state.activeRun?.warnings || [];
  const workflow = activeWorkflowDescriptors();
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const capabilityTags = runtimeCapabilityTags();
  const nextStep = (() => {
    if (!elements.promptInput.value.trim()) return '鍏堝啓浠诲姟锛屽啀鐢熸垚 SPEC銆?';
    if (!state.preview && !state.activeRun) return '鍏堣窇涓€杞?SPEC锛屾妸浜や粯杈圭晫閿佸畾銆?';
    if (state.preview && !state.activeRun) return '閾捐矾宸茬粡棰勮锛屼笅涓€姝ョ洿鎺ヨ繍琛屾嬁鐪熷疄杈撳嚭銆?';
    if (warnings.length) return '浼樺厛澶勭悊璀﹀憡锛屽啀缁х画缁窇褰撳墠浼氳瘽銆?';
    if (state.activeRun?.session?.id || state.activeSession?.id) return '缁х画褰撳墠浼氳瘽锛屽洿缁曠粨鏋滃仛涓嬩竴杞簿淇€?';
    return '鍙互鍒囧埌鑱氱劍妯″紡锛屼笓闂ㄧ洴浣忚緭鍑哄拰璇婃柇銆?';
  })();

  const cards = [
    {
      label: '涓绘帶鏅鸿兘浣?',
      value: localizeDisplayName(leadAgent?.displayName) || '寰呴€?',
      copy: compactText(localizeRole(leadAgent?.role) || localizeCatalogText(leadAgent?.summary) || '杩樻病閫夊嚭涓诲鑺傜偣', 92),
      tone: 'teal',
      tags: leadAgent?.sourcePack ? [leadAgent.sourcePack] : [],
    },
    {
      label: '鎵ц褰㈡€?',
      value: `${MODE_META[currentMode()].label} / ${currentStageLabel()}`,
      copy: `${workflow.length} 涓妭鐐癸紝${currentLlmLabel()}`,
      tone: state.activeRun ? 'accent' : 'blue',
      tags: currentSelectedAgentIds().slice(0, 3).map((agentId) => localizeDisplayName(getAgent(agentId)?.displayName || agentId)),
    },
    {
      label: '铻嶅悎鍛戒腑',
      value: fusionLabels.length ? fusionLabels.join(' / ') : '鏈懡涓厤鏂?',
      copy: `${selectedImportedAgentIds().length} 涓凡瀵煎叆鏅鸿兘浣撳凡鍏ユ爤`,
      tone: fusionLabels.length ? 'gold' : 'neutral',
      tags: fusionLabels.slice(0, 3),
    },
    {
      label: '鍏变韩浼氳瘽',
      value: state.activeSession?.id ? shortSessionId(state.activeSession.id) : '鏈粦瀹?',
      copy: state.activeSession?.id
        ? `${state.activeSession.turnCount || 0} 杞璇?/ ${state.activeSession.runCount || 0} 娆¤繍琛宍
        : '褰撳墠杈撳嚭杩樻病鏈夌粦瀹氬彲缁窇绾跨▼',
      tone: 'blue',
      tags: state.activeSession?.latestTurn?.kind ? [localizeTurnKind(state.activeSession.latestTurn.kind)] : [],
    },
    {
      label: 'Agent Runtime',
      value: runtime
        ? `${poolCounts.active || 0} active / ${poolCounts.activationPool || 0} warm / ${poolCounts.frozen || 0} frozen`
        : '鏈縺娲?',
      copy: runtime
        ? `${(runtime.pets || []).length} pets / ${(runtime.capabilities?.tools || []).length} tools / dream ${runtime.dream?.enabled ? 'on' : 'off'}`
        : '褰撳墠杩樻病鏈?agent 鐢熷懡鍛ㄦ湡蹇収',
      tone: runtime ? 'gold' : 'neutral',
      tags: capabilityTags,
    },
    {
      label: '椋庨櫓涓庢彁閱?',
      value: warnings.length ? `${warnings.length} 鏉¤鍛奰 : '鏆傛棤璀﹀憡'`,
      copy: warnings.length ? compactText(warnings.join(' / '), 120) : '褰撳墠閾捐矾娌℃湁鏄惧紡璀﹀憡锛屽彲浠ョ户缁帇杈撳嚭璐ㄩ噺銆?',
      tone: warnings.length ? 'danger' : 'teal',
      tags: warnings.length ? ['澶嶆牳'] : ['姝ｅ父'],
    },
    {
      label: '涓嬩竴姝?',
      value: compactText(nextStep, 44),
      copy: '杩欓噷鏄粰浣犲拰鍙充晶瀵硅瘽绯荤粺鐪嬬殑涓嬩竴璺炽€?',
      tone: 'accent',
      tags: [MODE_META[currentMode()].label, getDomainLabel(currentDomain())],
    },
  ];

  elements.insightPanel.innerHTML = cards
    .map(
      (card) => `
        <article class="insight-card">
          <div class="insight-head">
            <span class="insight-label">${escapeHtml(card.label)}</span>
            <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
          </div>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="insight-copy">${escapeHtml(card.copy)}</p>
          ${
            card.tags?.length
              ? `<div class="insight-tags">${card.tags
                  .map((tag) => `<span class="agent-badge" data-pack="matched">${escapeHtml(tag)}</span>`)
                  .join('')}</div>`
              : ''
          }
        </article>
      `,
    )
    .join('');
}

function renderTerminalSurface() {
  const workflow = activeWorkflowDescriptors();
  const leadAgent = currentLeadAgent();
  const warnings = state.activeRun?.warnings || [];
  const matchedRecipes = (state.fusionAnalysis?.matchedRecipes || []).map((item) => item.label || item.id);
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const lines = [
    `> 鐘舵€?       ${currentStageLabel()}`,
    `> 棰嗗煙        ${state.catalog?.domain?.label || currentDomain()}`,
    `> 妯″紡        ${MODE_META[currentMode()].label}`,
    `> 妯″瀷        ${currentLlmLabel()}`,
    `> 浼氳瘽        ${state.activeSession?.id || currentSessionId() || '鏈粦瀹?'}`,
    `> 閾捐矾        ${workflow.length} 涓楠`,
    `> 涓绘帶        ${localizeDisplayName(leadAgent?.displayName) || '寰呭畾'}`,
    `> 宸查€?       ${currentSelectedAgentIds().length} 涓櫤鑳戒綋`,
    `> 铻嶅悎        ${matchedRecipes.length ? matchedRecipes.map((item) => localizeRecipeLabel(item)).join(' / ') : '鏆傛棤鍖归厤閰嶆柟'}`,
  ];

  lines.push(`> runtime     active=${poolCounts.active || 0} warm=${poolCounts.activationPool || 0} frozen=${poolCounts.frozen || 0}`);

  if (runtime) {
    lines.push(`> tools       ${(runtime.capabilities?.tools || []).join(', ') || 'none'}`);
    lines.push(`> preview     ${(runtime.capabilities?.previewModes || []).join(', ') || 'none'}`);
    lines.push(`> pets        ${(runtime.pets || []).map((pet) => `${pet.parentAgentId}:${pet.focus}`).join(' / ') || 'none'}`);
    if (runtime.dream?.retainedKeywords?.length) {
      lines.push(`> dream       ${runtime.dream.retainedKeywords.join(', ')}`);
    }
  }

  if (warnings.length) {
    warnings.forEach((warning, index) => {
      lines.push(`> 璀﹀憡.${index + 1}    ${warning}`);
    });
  } else {
    lines.push('> 璀﹀憡        姝ｅ父');
  }

  if (state.activeSession?.latestTurn) {
    lines.push(
      `> 鏈€鏂?       ${localizeTurnKind(state.activeSession.latestTurn.kind)} @ ${formatDateTime(state.activeSession.latestTurn.createdAt)}`,
    );
  }

  const visibleOutput =
    state.activeRun?.finalOutput ||
    state.preview?.specPack?.masterSpec ||
    state.activeSession?.latestTurn?.resultText ||
    state.activeSession?.latestTurn?.specText ||
    '';

  if (visibleOutput) {
    lines.push('> 杈撳嚭');
    lines.push(sanitizeVisibleOutput(localizeDynamicText(visibleOutput)));
  } else {
    lines.push('> 鎻愮ず        鍏堢敓鎴?SPEC 鎴栫洿鎺ヨ繍琛岀紪鎺掞紝缁堢杩欓噷鎵嶄細鍑虹幇鍐呭');
  }

  elements.terminalSurface.textContent = lines.join('\n');
}

function syncResultPanelState(content, emptyValues = []) {
  const panel = elements.finalOutput?.closest('.result-panel');
  if (!panel) return;
  const normalized = text(content).trim();
  const hasContent = Boolean(normalized) && !emptyValues.includes(content);
  panel.dataset.hasContent = hasContent ? 'true' : 'false';
}

function ensureStreamDebugState() {
  if (!state.streamDebug) {
    state.streamDebug = {
      startedAt: '',
      lastEvent: '',
      lastStatus: '',
      lastError: '',
      deltaCount: 0,
      deltaChars: 0,
      renderCount: 0,
      renderChars: 0,
      events: [],
    };
  }

  return state.streamDebug;
}

function renderStreamDebug() {
  if (!elements.streamDebugMeta || !elements.streamDebugOutput) return;

  const debugState = ensureStreamDebugState();
  const summary = [
    debugState.lastEvent ? `event ${debugState.lastEvent}` : '绛夊緟浜嬩欢',
    `delta ${debugState.deltaCount}`,
    `chars ${debugState.deltaChars}`,
    `render ${debugState.renderCount}`,
    `view ${debugState.renderChars}`,
  ].join(' / ');

  elements.streamDebugMeta.textContent = summary;
  elements.streamDebugOutput.textContent = (debugState.events || []).join('\n') || '绛夊緟娴佸紡浜嬩欢鈥?';
}

function resetStreamDebug(reason = '') {
  state.streamDebug = {
    startedAt: new Date().toISOString(),
    lastEvent: reason || '',
    lastStatus: '',
    lastError: '',
    deltaCount: 0,
    deltaChars: 0,
    renderCount: 0,
    renderChars: 0,
    events: reason ? [`[reset] ${reason}`] : [],
  };
  renderStreamDebug();
}

function pushStreamDebug(eventName, detail = '') {
  const debugState = ensureStreamDebugState();
  const stamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const entry = `[${stamp}] ${eventName}${detail ? ` | ${detail}` : ''}`;
  debugState.lastEvent = eventName;

  if (eventName === 'status' || eventName === 'pulse') {
    debugState.lastStatus = detail;
  }

  if (eventName === 'error') {
    debugState.lastError = detail;
  }

  if (eventName === 'delta') {
    debugState.deltaCount += 1;
    debugState.deltaChars += text(detail).length;
  }

  debugState.events = [...(debugState.events || []), entry].slice(-80);
  renderStreamDebug();
}

function markStreamRender(content, source) {
  const debugState = ensureStreamDebugState();
  debugState.renderCount += 1;
  debugState.renderChars = text(content).length;
  debugState.lastSourceChars = text(source).length;
  renderStreamDebug();
}

function buildPersistentOutput(session, latestOutput = '') {
  const transcript = extractResultPanelOutput(session?.outputTranscript || '');
  if (transcript) return transcript;

  const blocks = [];
  const turns = Array.isArray(session?.turns) ? session.turns : [];
  for (const turn of turns) {
    const output = extractResultPanelOutput(turn?.resultText || turn?.specText || '');
    if (!output) continue;
    const normalized = output.trim();
    if (blocks[blocks.length - 1] !== normalized) {
      blocks.push(normalized);
    }
  }

  const latest = extractResultPanelOutput(latestOutput);
  if (latest) {
    const normalized = latest.trim();
    if (blocks[blocks.length - 1] !== normalized) {
      blocks.push(normalized);
    }
  }

  return blocks.join('\n\n');
}

function stickFinalOutputToBottom() {
  if (!elements.finalOutput) return;
  requestAnimationFrame(() => {
    elements.finalOutput.scrollTop = elements.finalOutput.scrollHeight;
  });
}

function renderFinalOutput(textValue) {
  const content = sanitizeVisibleOutput(localizeDynamicText(textValue)) || '绛夊緟杩愯';
  elements.finalOutput.textContent = content;
  markStreamRender(content, textValue);
  syncResultPanelState(content, ['缁涘绶熸潻鎰攽']);
  elements.copyOutputButton.disabled = !text(content).trim() || content === '绛夊緟杩愯';
}

function renderRunMeta(runLike) {
  if (!runLike) {
    elements.runMeta.textContent = '绛夊緟杩愯';
    return;
  }

  const domainLabel =
    typeof runLike.domain === 'string'
      ? getDomainLabel(runLike.domain)
      : runLike.domain?.label || getDomainLabel(runLike.domain?.id);
  const modeLabel = MODE_META[runLike.mode]?.label || runLike.mode || '缂栨帓';
  const llmLabel = runLike.llm?.usedLlm ? runLike.llm.model || '妯″瀷' : '妯℃嫙';
  const time = runLike.createdAt ? formatDateTime(runLike.createdAt) : '';
  const sessionLabel = runLike.sessionId || runLike.session?.id;
  const runtimeLabel = runLike.agentRuntime?.activeAgents?.length
    ? `${runLike.agentRuntime.activeAgents.length} agent runtime`
    : '';

  elements.runMeta.textContent = [domainLabel, modeLabel, llmLabel, runtimeLabel, sessionLabel ? shortSessionId(sessionLabel) : '', time]
    .filter(Boolean)
    .join(' 路 ');
}

function applySession(session) {
  state.activeSession = session || null;
  state.currentSessionId = session?.id || '';
  state.pendingChatPrompt = '';
  elements.sessionIdInput.value = state.currentSessionId;

  if (state.currentSessionId) {
    saveStoredSessionId(state.currentSessionId);
  } else {
    clearStoredSessionId();
  }

  renderSessionState();
}

function renderSessionState() {
  if (!state.activeSession?.id) {
    elements.sessionStatus.textContent = '鏈粦瀹氬叡浜細璇?';
    elements.copySessionButton.disabled = true;
    elements.chatSessionCard.innerHTML = `
      <strong>褰撳墠浼氳瘽</strong>
      <p>杩樻病鏈夌粦瀹氬巻鍙蹭細璇濄€傜洿鎺ュ彂閫佷竴鏉℃秷鎭紝鎴栦粠宸︿晶杞藉叆宸叉湁浼氳瘽銆?/p>
    `;
    return;
  }

  const latestTurn = state.activeSession.latestTurn;
  const latestLabel = latestTurn ? `鏈€杩?${localizeTurnKind(latestTurn.kind)} 路 ${formatDateTime(latestTurn.createdAt)}` : '鍒氬垱寤?';

  elements.sessionStatus.textContent = `${shortSessionId(state.activeSession.id)} 路 ${state.activeSession.turnCount || 0} 杞璇?路 ${state.activeSession.runCount || 0} 娆¤繍琛?路 ${latestLabel}`;
  elements.copySessionButton.disabled = false;
  elements.chatSessionCard.innerHTML = `
    <strong>${escapeHtml(shortSessionId(state.activeSession.id))}</strong>
    <p>${escapeHtml(`${state.activeSession.turnCount || 0} 杞璇?/ ${state.activeSession.runCount || 0} 娆¤繍琛宍)}</p>
    <p>${escapeHtml(latestLabel)}</p>
  `;
}

function buildChatSuggestions() {
  const suggestions = [];
  const prompt = elements.promptInput.value.trim();
  const matchedRecipes = state.fusionAnalysis?.matchedRecipes || [];

  if (!prompt) {
    suggestions.push('鍏堟妸杩欎釜浠诲姟鍘嬫垚涓€鍙ユ竻鏅扮洰鏍囷紝鍐嶇敓鎴?5 杞?SPEC銆?');
    suggestions.push(...(state.catalog?.domain?.examples || []).slice(0, 2));
  }

  if (!state.preview && !state.activeRun) {
    suggestions.push('鍏堢敓鎴?5 杞?SPEC锛屾妸杈圭晫銆佽緭鍏ャ€佽緭鍑哄拰楠岃瘉鏍囧噯鏀剁揣銆?');
  }

  if (currentMode() !== 'harness') {
    suggestions.push('鍒囧洖缂栨帓妯″紡锛屼繚鐣欑郴缁熸櫤鑳戒綋鍜岄鍩熸櫤鑳戒綋鐨勫畬鏁村崗浣溿€?');
  }

  if (matchedRecipes.length) {
    suggestions.push(
      `浼樺厛璧?${matchedRecipes
        .map((recipe) => localizeRecipeLabel(recipe.label || recipe.id))
        .slice(0, 2)
        .join(' / ')} 杩欑粍铻嶅悎閰嶆柟锛屽苟浜や唬姣忎釜宸插鍏ユ櫤鑳戒綋鐨勮亴璐ｃ€俙,
    );
  }

  if (currentDomain() === 'coding') {
    suggestions.push('椤烘墜琛ヤ竴杞?build銆乼ypecheck銆乻moke 鍜屽洖褰掓鏌ャ€?');
  }

  if (state.activeRun) {
    suggestions.push('缁х画杩欎釜浼氳瘽锛屼笉寮€鏂扮嚎绋嬶紝鍩轰簬褰撳墠杈撳嚭鍋氫笅涓€杞繁鍖栥€?');
    suggestions.push('鎶婃渶缁堣緭鍑哄啀鍘嬫垚鍙氦浠樻竻鍗曘€侀闄╂竻鍗曞拰涓嬩竴姝ャ€?');
  }

  if (state.activeRun?.warnings?.length) {
    suggestions.push(`浼樺厛澶勭悊璀﹀憡锛?{state.activeRun.warnings.slice(0, 2).join(' / ')}`);
  }

  return unique(suggestions).slice(0, 3);
}

function renderChatSuggestions() {
  const suggestions = buildChatSuggestions();

  if (!suggestions.length) {
    elements.chatSuggestions.innerHTML = '<div class="empty-state">绛夊緟寤鸿</div>';
    return;
  }

  elements.chatSuggestions.innerHTML = suggestions
    .map(
      (suggestion) => `
        <button type="button" class="suggestion-button" data-suggestion="${escapeHtml(suggestion)}">
          ${escapeHtml(compactText(suggestion, 72))}
          <small>鐐逛竴涓嬪～鍏ュ彸渚х画璺戣緭鍏ユ</small>
        </button>
      `,
    )
    .join('');

  for (const button of elements.chatSuggestions.querySelectorAll('[data-suggestion]')) {
    button.addEventListener('click', () => {
      elements.chatInput.value = button.dataset.suggestion || '';
      elements.chatInput.focus();
    });
  }
}

function buildChatMessages() {
  const messages = [];
  const prompt = elements.promptInput.value.trim();
  const latestTurn = state.activeSession?.latestTurn;
  const userPrompt = latestPromptChunk(latestTurn?.prompt || prompt);

  if (userPrompt) {
    messages.push({
      kind: 'user',
      text: sanitizeVisibleOutput(localizeDynamicText(userPrompt)),
    });
  }

  if (state.activeRun?.warnings?.length) {
    messages.push({
      kind: 'system',
      text: sanitizeVisibleOutput(localizeDynamicText(state.activeRun.warnings.join(' / '))),
    });
  } else if (latestTurn?.warnings?.length) {
    messages.push({
      kind: 'system',
      text: sanitizeVisibleOutput(localizeDynamicText(latestTurn.warnings.join(' / '))),
    });
  }

  const assistantText =
    state.activeRun?.finalOutput ||
    state.preview?.specPack?.masterSpec ||
    latestTurn?.resultText ||
    latestTurn?.specText ||
    latestTurn?.resultPreview ||
    latestTurn?.specPreview ||
    '';

  if (assistantText) {
    messages.push({
      kind: 'assistant',
      text: sanitizeVisibleOutput(localizeDynamicText(assistantText)),
    });
  }

  return messages;
}

function renderChatStream() {
  const messages = buildChatMessages().slice(-3);
  if (!messages.length) {
    elements.chatStream.textContent = '閫夋嫨涓€涓細璇濓紝鎴栬€呯洿鎺ヨ緭鍏ユ秷鎭?';
    return;
  }

  elements.chatStream.innerHTML = messages
    .map(
      (message) => `
        <article class="chat-message" data-kind="${escapeHtml(message.kind)}">
          <div class="chat-message-body">${escapeHtml(message.text || '')}</div>
        </article>
      `,
    )
    .join('');
}

function renderSurfaceChrome() {
  renderWorkbenchTabs();
  renderSelectionSummary();
  renderWorkflowPreview();
  renderWorkspacePulse();
  renderInsightPanel();
  renderTerminalSurface();
  renderSessionState();
  renderChatSuggestions();
  renderChatStream();
}

function toggleSelectedAgent(agentId) {
  if (!agentId) return;

  if (currentMode() === 'single') {
    state.selectedAgents = new Set([agentId]);
  } else if (state.selectedAgents.has(agentId)) {
    state.selectedAgents.delete(agentId);
  } else {
    state.selectedAgents.add(agentId);
  }

  state.activeRun = null;
  state.preview = null;
  renderAgentDeck();
  syncPromptMeta();
  scheduleFusionRefresh();
  renderAgentFilterPills();
  renderSurfaceChrome();
}

async function loadCatalog(domainId, options = {}) {
  const { selectedAgentIds = null, preserveSelection = true } = options;
  state.catalog = await fetchJson(`/api/catalog?domain=${encodeURIComponent(domainId)}`);
  state.fusionAnalysis = state.catalog?.fusion || null;
  renderModePills();

  const validIds = new Set((state.catalog.allAgents || state.catalog.agents || []).map((agent) => agent.id));
  const incoming = selectedAgentIds || (preserveSelection ? currentSelectedAgentIds() : []);
  const filtered = incoming.filter((agentId) => validIds.has(agentId));

  if (currentMode() === 'single') {
    state.selectedAgents = new Set(filtered.slice(0, 1));
    if (!state.selectedAgents.size) {
      state.selectedAgents = new Set([state.catalog.domain.defaultAgent]);
    }
  } else {
    state.selectedAgents = new Set(filtered);
  }

  elements.domainHint.textContent = state.catalog.domain.label;
  renderExampleList();
  renderAgentFilterPills();
  renderAgentDeck();
  syncPromptMeta();
  renderFusionPanel();
  renderSurfaceChrome();
  scheduleFusionRefresh();
}

function setBusy(isBusy) {
  state.isRunning = isBusy;
  elements.runButton.disabled = isBusy;
  elements.specButton.disabled = isBusy;
  elements.chatSendButton.disabled = isBusy;
  elements.chatRunButton.disabled = isBusy;
  elements.loadSessionButton.disabled = isBusy;
  elements.newSessionButton.disabled = isBusy;
  elements.runButton.textContent = isBusy ? '杩愯涓?..' : '鐩存帴杩愯';
  elements.specButton.textContent = isBusy ? '澶勭悊涓?..' : '鐢熸垚 SPEC';
  elements.chatSendButton.textContent = isBusy ? '鍙戦€佷腑...' : '鍙戦€?';
  renderWorkspacePulse();
  renderInsightPanel();
}

function buildPayload(options = {}) {
  const draftPrompt = activePromptText(options);
  const latestSessionPrompt = text(state.activeSession?.latestTurn?.prompt || state.activeRun?.session?.latestTurn?.prompt).trim();
  const prompt = currentSessionId() ? derivePromptDelta(draftPrompt, latestSessionPrompt) : draftPrompt;

  return {
    prompt,
    domain: currentDomain(),
    mode: currentMode(),
    selectedAgentIds: currentSelectedAgentIds(),
    sessionId: currentSessionId(),
    runtimeConfig: collectRuntimeConfig(),
  };
}

function resetSurface() {
  state.activeRun = null;
  state.preview = null;
  state.fusionAnalysis = state.catalog?.fusion || state.fusionAnalysis;
  state.workbenchView = 'task';
  renderRunMeta(null);
  renderSpecRounds(null);
  renderWorkflow([], []);
  renderFinalOutput('绛夊緟杩愯');
  renderFusionPanel();
  renderSurfaceChrome();
}

function applyPreviewToSurface(result) {
  state.activeRun = null;
  state.preview = result;
  state.fusionAnalysis = result.fusion || state.fusionAnalysis;
  state.workbenchView = 'spec';
  applySession(result.session || null);

  renderRunMeta({
    domain: result.domain,
    mode: result.mode,
    llm: { usedLlm: false },
    createdAt: new Date().toISOString(),
    session: result.session,
  });
  renderSpecRounds(result.specPack);
  renderWorkflow(result.workflow, []);
  renderFinalOutput(result.specPack.masterSpec);
  renderFusionPanel();
  renderSurfaceChrome();
}

function applyRunToSurface(run) {
  state.preview = null;
  state.activeRun = run;
  state.pendingChatPrompt = '';
  state.fusionAnalysis = run.fusion || state.fusionAnalysis;
  state.workbenchView = 'output';
  elements.chatInput.value = '';
  elements.promptInput.value = text(run?.prompt || '');
  applySession(run.session || null);

  renderRunMeta(run);
  renderSpecRounds(null);
  renderWorkflow([], []);
  renderFinalOutput(run.finalOutput || '');
  renderFusionPanel();
  renderRecentRuns();
  renderSurfaceChrome();
}

async function fetchRun(runId) {
  return fetchJson(`/api/run?id=${encodeURIComponent(runId)}`);
}

async function hydrateRun(runId) {
  if (!runId) return;

  try {
    const run = await fetchRun(runId);
    elements.domainSelect.value = run.domain?.id || currentDomain();
    setMode(run.mode || 'harness', { skipRender: true });
    elements.promptInput.value = run.prompt || '';
    state.agentQuery = '';
    elements.agentSearchInput.value = '';

    await loadCatalog(run.domain?.id || currentDomain(), {
      preserveSelection: false,
      selectedAgentIds: run.selectedAgentIds || [],
    });

    applyRunToSurface(run);
    syncPromptMeta();
  } catch (error) {
    renderFinalOutput(error.message);
  }
}

async function hydrateSession(sessionId) {
  const normalized = text(sessionId).trim();
  if (!normalized) return;

  try {
    const session = await fetchJson(`/api/session?id=${encodeURIComponent(normalized)}`);
    elements.domainSelect.value = session.domain?.id || currentDomain();
    setMode(session.mode || 'harness', { skipRender: true });
    state.agentQuery = '';
    elements.agentSearchInput.value = '';

    await loadCatalog(session.domain?.id || currentDomain(), {
      preserveSelection: false,
      selectedAgentIds: session.selectedAgentIds || [],
    });

    applySession(session);
    elements.promptInput.value = session.latestTurn?.prompt || '';

    if (session.lastRunId) {
      const run = await fetchRun(session.lastRunId);
      applyRunToSurface(run);
      elements.promptInput.value = session.latestTurn?.prompt || run.prompt || '';
    } else {
      state.activeRun = null;
      state.preview = null;
      state.workbenchView = 'workflow';
      renderRunMeta({
        domain: session.domain,
        mode: session.mode,
        llm: { usedLlm: false },
        createdAt: session.updatedAt,
        session,
      });
      renderSpecRounds(null);
      renderWorkflow(session.workflow || [], []);
      renderFinalOutput(
        session.latestTurn?.resultText ||
          session.latestTurn?.specText ||
          session.latestTurn?.resultPreview ||
          session.latestTurn?.specPreview ||
          '浼氳瘽宸茶浇鍏ワ紝绛夊緟缁窇',
      );
      renderSurfaceChrome();
    }

    syncPromptMeta();
    scheduleFusionRefresh();
  } catch (error) {
    renderFinalOutput(error.message);
  }
}

async function submitSpecOnly() {
  try {
    setBusy(true);
    const result = await fetchJson('/api/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload()),
    });
    applyPreviewToSurface(result);
  } catch (error) {
    renderFinalOutput(error.message);
  } finally {
    setBusy(false);
  }
}

async function submitRun() {
  try {
    setBusy(true);
    const result = await fetchJson('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload()),
    });

    applyRunToSurface(result);

    const sessionList = await fetchJson('/api/sessions');
    state.sessions = sessionList.sessions || [];
    renderRecentRuns();
  } catch (error) {
    renderFinalOutput(error.message);
  } finally {
    setBusy(false);
  }
}

async function flashButton(button, successText, fallbackText, task) {
  const original = button.textContent;

  try {
    await task();
    button.textContent = successText;
  } catch {
    button.textContent = fallbackText;
  }

  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

async function copyOutput() {
  const content = elements.finalOutput.textContent || '';
  if (!content.trim()) return;

  await flashButton(elements.copyOutputButton, '宸插鍒?', '澶嶅埗澶辫触', async () => {
    await navigator.clipboard.writeText(content);
  });
}

async function copySessionId() {
  const sessionId = currentSessionId();
  if (!sessionId) return;

  await flashButton(elements.copySessionButton, '宸插鍒?', '澶嶅埗澶辫触', async () => {
    await navigator.clipboard.writeText(sessionId);
  });
}

function appendChatToPrompt(runAfter = false) {
  const content = elements.chatInput.value.trim();
  if (!content) return;

  const current = elements.promptInput.value.trim();
  elements.promptInput.value = current ? `${current}\n${content}` : content;
  elements.chatInput.value = '';
  syncPromptMeta();
  scheduleFusionRefresh();
  renderSurfaceChrome();

  if (runAfter) {
    submitRun();
  }
}

function startNewSession() {
  applySession(null);
  resetSurface();
  syncPromptMeta();
  scheduleFusionRefresh();
  renderSurfaceChrome();
}

function setMode(mode, options = {}) {
  const nextMode = MODE_META[mode] ? mode : 'harness';
  elements.modeSelect.value = nextMode;

  if (nextMode === 'single' && state.selectedAgents.size > 1) {
    state.selectedAgents = new Set([currentSelectedAgentIds()[0]]);
  }

  if (nextMode === 'single' && !state.selectedAgents.size && state.catalog?.domain?.defaultAgent) {
    state.selectedAgents = new Set([state.catalog.domain.defaultAgent]);
  }

  if (options.skipRender) return;

  state.activeRun = null;
  state.preview = null;
  renderModePills();
  renderAgentDeck();
  syncPromptMeta();
  renderFusionPanel();
  scheduleFusionRefresh();
  renderAgentFilterPills();
  renderSurfaceChrome();
}

async function refreshSessionList() {
  try {
    const payload = await fetchJson('/api/session-threads');
    state.sessions = payload.sessions || [];
  } catch {
    const payload = await fetchJson('/api/sessions');
    state.sessions = payload.sessions || [];
  }

  renderRecentRuns();
  return state.sessions;
}

MODE_META.single = { label: '鍗曚綋', description: '鍗曚釜 agent 鐩存帴杈撳嚭' };
MODE_META.compose = { label: '缁勫悎', description: '澶?agent 缁勫悎鍗忓悓' };
MODE_META.harness = { label: '缂栨帓', description: '瀹屾暣鍚庣缂栨帓涓庣画璺? '};

currentLlmLabel = function currentLlmLabelOverride() {
  return displayLlmLabel();
};

currentStageLabel = function currentStageLabelOverride() {
  return displayStageLabel();
};

renderRuntimeStatus = function renderRuntimeStatusOverride() {
  const envConfigured = Boolean(state.config?.runtime?.llm?.configured);
  const localConfigured = Boolean(collectRuntimeConfig().apiKey && collectRuntimeConfig().model);

  if (localConfigured) {
    elements.runtimeStatus.textContent = '鐩磋繛';
    elements.runtimeStatus.dataset.status = 'configured';
    return;
  }

  if (envConfigured) {
    elements.runtimeStatus.textContent = '鐜';
    elements.runtimeStatus.dataset.status = 'configured';
    return;
  }

  elements.runtimeStatus.textContent = '妯℃嫙';
  elements.runtimeStatus.dataset.status = 'simulation';
};

syncPromptMeta = function syncPromptMetaOverride() {
  const length = activePromptText().length;
  const workflowSize = resolveWorkflowIds().length;
  const selectedCount = currentSelectedAgentIds().length;
  const sessionLabel = state.activeSession?.id ? shortSessionId(state.activeSession.id) : 'new';
  elements.promptMeta.textContent = `${length} 瀛?/ ${workflowSize} agent / ${selectedCount} selected / ${sessionLabel}`;
};

renderSelectionSummary = function renderSelectionSummaryOverride() {
  if (!state.catalog) {
    elements.selectionSummary.innerHTML = '<div class="empty-state">绛夊緟鍔犺浇</div>';
    return;
  }

  const workflowIds = resolveWorkflowIds();
  const domain = state.catalog.domain;
  const leadId =
    workflowIds.find((agentId) => !SYSTEM_AGENT_IDS.has(agentId)) ||
    workflowIds[0] ||
    domain.defaultAgent;
  const activation = portableActivationCounts();

  const chips = [
    { label: '棰嗗煙', value: domain.label },
    { label: '妯″紡', value: MODE_META[currentMode()].label },
    { label: '涓绘帶', value: compactText(localizeDisplayName(getAgent(leadId)?.displayName || leadId), 20) },
    { label: '婵€娲?', value: `L1 ${activation.l1} / L2 ${activation.l2} / L3 ${activation.l3} / L4 ${activation.l4}` },
    { label: '浼氳瘽', value: shortSessionId(state.activeSession?.id || currentSessionId()) || 'new' },
  ];

  elements.selectionSummary.innerHTML = chips
    .map(
      (chip) => `
        <article class="summary-chip">
          <span>${escapeHtml(chip.label)}</span>
          <strong>${escapeHtml(chip.value)}</strong>
        </article>
      `,
    )
    .join('');
};

renderWorkspacePulse = function renderWorkspacePulseOverride() {
  if (!state.catalog) {
    elements.workspacePulse.innerHTML = '<div class="empty-state">绛夊緟宸ヤ綔鍖鸿剦鍐?/div>';
    return;
  }

  const activation = portableActivationCounts();
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const portableHarness = currentPortableHarness();
  const toolNames = portableToolNames(4);
  const backends = portableBackendEntries();
  const warnings = state.activeRun?.warnings?.length || state.activeSession?.latestTurn?.warnings?.length || 0;
  const session = state.activeSession;

  const cards = [
    {
      label: 'Mission',
      value: displayStageLabel(),
      copy: `${state.catalog.domain.label} / ${MODE_META[currentMode()].label} / ${portableTargetLabel()}`,
      tone: warnings ? 'danger' : state.activeRun ? 'accent' : 'blue',
    },
    {
      label: 'Continuity',
      value: session?.id ? shortSessionId(session.id) : 'new session',
      copy: session?.id
        ? `${session.turnCount || 0} turns / ${session.runCount || 0} runs`
        : '鍙戦€佸悗鑷姩杩涘叆鍏变韩浼氳瘽锛屽苟缁х画鍐欏洖鐙珛 agent 璁板繂銆?',
      tone: 'blue',
    },
    {
      label: 'Activation',
      value: `L1 ${activation.l1} / L2 ${activation.l2}`,
      copy: `L3 ${activation.l3} / L4 ${activation.l4} / complexity ${activation.complexity}`,
      tone: 'teal',
    },
    {
      label: 'Sandbox',
      value: backends.length ? `${backends.length} backends isolated` : 'pending',
      copy: backends.slice(0, 3).map((item) => `${item.id}:${item.mode || 'simulated'}`).join(' / ') || 'terminal / network / browser',
      tone: 'gold',
    },
    {
      label: 'Tool Pool',
      value: `${portableHarness?.toolPool?.toolCount || 0} tools`,
      copy: toolNames.length ? toolNames.join(', ') : '鎸変换鍔¤嚜鍔ㄦ嫾瑁呭伐鍏烽摼',
      tone: 'accent',
    },
    {
      label: 'Runtime',
      value: runtime ? `${poolCounts.active || 0} active / ${poolCounts.activationPool || 0} warm / ${poolCounts.frozen || 0} frozen` : 'pending',
      copy: runtime ? `${(runtime.pets || []).length} pets / dream ${runtime.dream?.enabled ? 'on' : 'off'}` : '婵€娲诲悗浼氳繘鍏ョ嫭绔嬬敓鍛藉懆鏈?',
      tone: runtime ? 'neutral' : 'blue',
    },
  ];

  elements.workspacePulse.innerHTML = cards
    .map(
      (card) => `
        <article class="pulse-card">
          <span class="pulse-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="pulse-copy">${escapeHtml(card.copy)}</p>
          <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
        </article>
      `,
    )
    .join('');
};

renderWorkflowPreview = function renderWorkflowPreviewOverride() {
  const workflowIds = resolveWorkflowIds();
  const activation = portableActivationCounts();

  if (!workflowIds.length) {
    elements.workflowPreview.textContent = '绛夊緟瑁呴厤';
    return;
  }

  const previewIds = workflowIds.slice(0, 5);
  const hiddenCount = Math.max(0, workflowIds.length - previewIds.length);
  const levelChips = [
    `Target ${portableTargetLabel()}`,
    `L1 ${activation.l1}`,
    `L2 ${activation.l2}`,
    `L3 ${activation.l3}`,
    `L4 ${activation.l4}`,
  ];

  elements.workflowPreview.innerHTML = levelChips
    .map((label) => `<span class="workflow-chip">${escapeHtml(label)}</span>`)
    .join('')
    .concat(
      previewIds
        .map((agentId) => {
          const descriptor = getAgent(agentId);
          return `<span class="workflow-chip">${escapeHtml(localizeDisplayName(descriptor?.displayName || agentId))}</span>`;
        })
        .join(''),
    )
    .concat(hiddenCount ? `<span class="workflow-chip">+${escapeHtml(String(hiddenCount))}</span>` : '');
};

renderRecentRuns = function renderRecentRunsOverride() {
  const conversations = [];
  const seen = new Set();

  for (const item of state.sessions || []) {
    const sessionId = item.sessionId || item.id;
    if (!sessionId || seen.has(sessionId)) continue;
    seen.add(sessionId);
    conversations.push({ ...item, conversationId: sessionId });
    if (conversations.length >= 18) break;
  }

  if (!conversations.length) {
    elements.recentRuns.textContent = '杩樻病鏈変細璇?';
    return;
  }

  elements.recentRuns.innerHTML = conversations
    .map((session) => {
      const active =
        state.activeSession?.id === session.conversationId ||
        state.currentSessionId === session.conversationId ||
        state.activeRun?.session?.id === session.conversationId;
      const titleText = localizeDynamicText(
        session.title || session.lastPromptPreview || session.promptPreview || session.lastOutputPreview || '',
      );
      const previewText = localizeDynamicText(session.lastOutputPreview || session.lastPromptPreview || '');
      const domainLabel =
        typeof session.domain === 'string'
          ? getDomainLabel(session.domain)
          : session.domain?.label || getDomainLabel(session.domain?.id);
      const modeLabel = MODE_META[session.mode]?.label || session.mode || '缂栨帓';
      const stats = [`${domainLabel}`, `${modeLabel}`, `${shortSessionId(session.conversationId)}`].filter(Boolean).join(' / ');

      return `
        <button
          type="button"
          class="recent-run-button ${active ? 'is-active' : ''}"
          data-session-id="${escapeHtml(session.conversationId)}"
          data-run-id="${escapeHtml(session.lastRunId || session.id)}"
        >
          <div class="recent-run-head">
            <strong class="recent-run-title">${escapeHtml(safePreviewText(titleText, 28) || '鏈懡鍚嶄細璇?')}</strong>
            <span class="recent-run-time">${escapeHtml(formatDateTime(session.updatedAt || session.createdAt))}</span>
          </div>
          <p>${escapeHtml(stats)}</p>
          ${
            previewText
              ? `<small>${escapeHtml(clipMessageText(previewText, 84))}</small>`
              : `<small>${escapeHtml(`${session.turnCount || 0} turns / ${session.runCount || 0} runs`)}</small>`
          }
        </button>
      `;
    })
    .join('');

  for (const button of elements.recentRuns.querySelectorAll('[data-session-id]')) {
    button.addEventListener('click', async () => {
      const sessionId = button.dataset.sessionId || '';
      if (sessionId.startsWith('session-')) {
        await hydrateSession(sessionId);
        return;
      }

      const runId = button.dataset.runId || '';
      if (runId) {
        await hydrateRun(runId);
      }
    });
  }
};

renderInsightPanel = function renderInsightPanelOverride() {
  if (!state.catalog) {
    elements.insightPanel.innerHTML = '<div class="empty-state">绛夊緟璇婃柇闈㈡澘</div>';
    return;
  }

  const leadAgent = currentLeadAgent();
  const workflow = activeWorkflowDescriptors();
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const portableHarness = currentPortableHarness();
  const activation = portableActivationCounts();
  const warnings = state.activeRun?.warnings || state.activeSession?.latestTurn?.warnings || [];
  const backends = portableBackendEntries();
  const retainedKeywords = runtime?.dream?.retainedKeywords || [];
  const recommendedAgents = (portableHarness?.recommendedNewAgents || []).slice(0, 3).map((item) => localizeDisplayName(item.displayName || item.id));
  const nextStep = (() => {
    if (!elements.promptInput.value.trim()) return '鍏堣緭鍏ョ洰鏍囷紝鍐嶈绯荤粺瑁呴厤 agent 鍜屽伐鍏烽摼銆?';
    if (!state.preview && !state.activeRun) return '鍏堣窇涓€杞?SPEC锛屾妸杈圭晫銆佸伐浣滄祦鍜岃蹇嗛敋鐐归攣瀹氥€?';
    if (state.preview && !state.activeRun) return 'SPEC 宸插氨浣嶏紝涓嬩竴姝ョ洿鎺ヨ繍琛屾嬁鐪熷疄缁撴灉銆?';
    if (warnings.length) return '浼樺厛澶勭悊璀﹀憡锛屽啀缁х画闀跨嚎缁窇銆?';
    if (state.activeSession?.id) return '缁х画褰撳墠鍏变韩浼氳瘽锛屾妸缁撴灉鍘嬭繘涓嬩竴杞€?';
    return '鍙互鍒囧埌鑱氱劍妯″紡锛屽彧鐪嬬粨鏋溿€佽瘖鏂拰缁堢鎽樿銆?';
  })();

  const cards = [
    {
      label: 'Lead Agent',
      value: portableTargetLabel(),
      copy: compactText(localizeRole(leadAgent?.role) || localizeCatalogText(leadAgent?.summary) || '褰撳墠鐢卞悗绔矾鐢卞喅瀹氫富鎺?agent銆?', 96),
      tone: 'teal',
      tags: leadAgent?.sourcePack ? [leadAgent.sourcePack] : [],
    },
    {
      label: 'Execution',
      value: `${MODE_META[currentMode()].label} / ${displayStageLabel()}`,
      copy: `${displayLlmLabel()} / ${workflow.length} workflow nodes`,
      tone: state.activeRun ? 'accent' : 'blue',
      tags: [state.catalog.domain.label],
    },
    {
      label: 'Shared Session',
      value: state.activeSession?.id ? shortSessionId(state.activeSession.id) : 'unbound',
      copy: state.activeSession?.id
        ? `${state.activeSession.turnCount || 0} turns / ${state.activeSession.runCount || 0} runs`
        : '鍙戦€佸悗浼氳嚜鍔ㄧ粦瀹氬叡浜細璇濓紝骞朵繚鐣欒法杞涓婁笅鏂囥€?',
      tone: 'blue',
      tags: state.activeSession?.hasMoreTurns ? ['history window'] : [],
    },
    {
      label: 'Agent Runtime',
      value: runtime ? `${poolCounts.active || 0} active / ${poolCounts.activationPool || 0} warm / ${poolCounts.frozen || 0} frozen` : 'pending',
      copy: runtime
        ? `${(runtime.pets || []).length} pets / ${(runtime.capabilities?.tools || []).length} tools / dream ${runtime.dream?.enabled ? 'on' : 'off'}`
        : '褰撳墠杩樻病鏈夋縺娲诲揩鐓с€?',
      tone: runtime ? 'gold' : 'neutral',
      tags: runtimeCapabilityTags(),
    },
    {
      label: 'Portable Harness',
      value: portableHarness ? `${activation.l1 + activation.l2 + activation.l3 + activation.l4} routed agents` : 'pending',
      copy: portableHarness
        ? `L1 ${activation.l1} / L2 ${activation.l2} / L3 ${activation.l3} / L4 ${activation.l4} / complexity ${activation.complexity}`
        : '绛夊緟鍚庣鏍规嵁鍏抽敭璇嶅拰浠诲姟澶嶆潅搴﹁閰嶃€?',
      tone: portableHarness ? 'accent' : 'neutral',
      tags: recommendedAgents,
    },
    {
      label: 'Sandbox Backends',
      value: backends.length ? `${backends.length} isolated services` : 'pending',
      copy: backends.map((item) => `${item.id}:${item.mode || 'simulated'}`).join(' / ') || '鍏ㄩ儴鑳藉姏閮借蛋娌欑洅鎴栧鍣ㄥ悗绔?',
      tone: 'gold',
      tags: backends.map((item) => item.id),
    },
    {
      label: 'Memory & Dream',
      value: retainedKeywords.length ? retainedKeywords.slice(0, 4).join(', ') : 'clean memory pass ready',
      copy: runtime
        ? `${runtime.routeMemory?.keywords?.length || 0} route keywords / carry ${runtime.routeMemory?.carryContext ? 'on' : 'off'}`
        : '瀵硅瘽缁撴潫鍚庝細娓呮礂璁板繂銆佸己鍖栬鑹茬姸鎬佸苟淇濈暀缁啓閿氱偣銆?',
      tone: 'teal',
      tags: retainedKeywords.slice(0, 3),
    },
    {
      label: 'Risks',
      value: warnings.length ? `${warnings.length} warnings` : 'clear',
      copy: warnings.length ? compactText(warnings.join(' / '), 120) : compactText((portableHarness?.constraints || []).join(' / ') || '褰撳墠娌℃湁鏄惧紡椋庨櫓鎻愮ず銆?', 120),
      tone: warnings.length ? 'danger' : 'neutral',
      tags: warnings.length ? ['review'] : ['stable'],
    },
    {
      label: 'Next Step',
      value: compactText(nextStep, 42),
      copy: '鍓嶇鍙睍绀烘垬鍐碉紝鐪熸鐨勭紪鎺掋€佽蹇嗗拰宸ュ叿璋冪敤缁х画鍦ㄥ悗绔帹杩涖€?',
      tone: 'accent',
      tags: [MODE_META[currentMode()].label],
    },
  ];

  elements.insightPanel.innerHTML = cards
    .map(
      (card) => `
        <article class="insight-card">
          <div class="insight-head">
            <span class="insight-label">${escapeHtml(card.label)}</span>
            <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
          </div>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="insight-copy">${escapeHtml(card.copy)}</p>
          ${
            card.tags?.length
              ? `<div class="insight-tags">${card.tags
                  .map((tag) => `<span class="agent-badge" data-pack="matched">${escapeHtml(tag)}</span>`)
                  .join('')}</div>`
              : ''
          }
        </article>
      `,
    )
    .join('');
};

renderTerminalSurface = function renderTerminalSurfaceOverride() {
  const workflow = activeWorkflowDescriptors();
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const portableHarness = currentPortableHarness();
  const activation = portableActivationCounts();
  const backends = portableBackendEntries();
  const warnings = state.activeRun?.warnings || state.activeSession?.latestTurn?.warnings || [];
  const output =
    state.activeRun?.finalOutput ||
    state.preview?.specPack?.masterSpec ||
    state.activeSession?.latestTurn?.resultText ||
    state.activeSession?.latestTurn?.specText ||
    '';

  const lines = [
    `> stage       ${displayStageLabel()}`,
    `> domain      ${state.catalog?.domain?.label || currentDomain()}`,
    `> mode        ${MODE_META[currentMode()].label}`,
    `> model       ${displayLlmLabel()}`,
    `> session     ${state.activeSession?.id || currentSessionId() || 'unbound'}`,
    `> target      ${portableTargetLabel()}`,
    `> workflow    ${workflow.length} nodes`,
    `> activation  L1=${activation.l1} L2=${activation.l2} L3=${activation.l3} L4=${activation.l4} complexity=${activation.complexity}`,
    `> runtime     active=${poolCounts.active || 0} warm=${poolCounts.activationPool || 0} frozen=${poolCounts.frozen || 0}`,
    `> tools       ${portableHarness?.toolPool?.toolCount || 0} / ${portableToolNames(8).join(', ') || 'pending'}`,
    `> backends    ${backends.map((item) => `${item.id}=${item.mode || 'simulated'}`).join(' | ') || 'pending'}`,
  ];

  if (runtime?.pets?.length) {
    lines.push(`> pets        ${(runtime.pets || []).map((pet) => `${pet.parentAgentId}:${pet.focus}`).join(' / ')}`);
  }

  if (runtime?.dream?.retainedKeywords?.length) {
    lines.push(`> dream       ${runtime.dream.retainedKeywords.join(', ')}`);
  }

  if (portableHarness?.recommendedNewAgents?.length) {
    lines.push(`> grow        ${(portableHarness.recommendedNewAgents || []).slice(0, 4).map((item) => item.id).join(', ')}`);
  }

  if (warnings.length) {
    warnings.forEach((warning, index) => {
      lines.push(`> warning.${index + 1}  ${warning}`);
    });
  } else {
    lines.push('> warnings    clear');
  }

  if (output) {
    lines.push('> output');
    lines.push(clipMessageText(sanitizeVisibleOutput(localizeDynamicText(output)), 1200));
  } else {
    lines.push('> output      鍏堢敓鎴?SPEC 鎴栫洿鎺ヨ繍琛岋紝缁堢杩欓噷浼氭樉绀哄悗绔憳瑕併€?');
  }

  elements.terminalSurface.textContent = lines.join('\n');
};

renderRunMeta = function renderRunMetaOverride(runLike) {
  if (!runLike) {
    elements.runMeta.textContent = '绛夊緟杩愯';
    return;
  }

  const domainLabel =
    typeof runLike.domain === 'string'
      ? getDomainLabel(runLike.domain)
      : runLike.domain?.label || getDomainLabel(runLike.domain?.id);
  const modeLabel = MODE_META[runLike.mode]?.label || runLike.mode || '缂栨帓';
  const llmLabel = runLike.llm?.usedLlm ? runLike.llm.model || '鐪熷疄 LLM' : '妯℃嫙';
  const runtimeLabel = runLike.agentRuntime?.activeAgents?.length ? `${runLike.agentRuntime.activeAgents.length} active` : '';
  const toolLabel = runLike.portableHarness?.toolPool?.toolCount ? `${runLike.portableHarness.toolPool.toolCount} tools` : '';
  const time = runLike.createdAt ? formatDateTime(runLike.createdAt) : '';
  const sessionLabel = runLike.sessionId || runLike.session?.id;

  elements.runMeta.textContent = [domainLabel, modeLabel, llmLabel, runtimeLabel, toolLabel, sessionLabel ? shortSessionId(sessionLabel) : '', time]
    .filter(Boolean)
    .join(' / ');
};

renderSessionState = function renderSessionStateOverride() {
  const runtime = currentAgentRuntime();
  const poolCounts = runtimePoolCounts();
  const activation = portableActivationCounts();

  if (!state.activeSession?.id) {
    elements.sessionStatus.textContent = '鏈粦瀹氬叡浜細璇?';
    elements.copySessionButton.disabled = true;
    elements.chatSessionCard.innerHTML = `
      <strong>褰撳墠浼氳瘽</strong>
      <p>鍙戦€佹秷鎭悗浼氳嚜鍔ㄧ粦瀹氬叡浜細璇濄€?/p>
      <p>鐙珛 agent 璁板繂銆乨ream 娓呮礂鍜岀画鍐欓敋鐐归兘鍦ㄥ悗绔畬鎴愩€?/p>
    `;
    return;
  }

  const latestTurn = state.activeSession.latestTurn;
  const latestLabel = latestTurn ? `${localizeTurnKind(latestTurn.kind)} / ${formatDateTime(latestTurn.createdAt)}` : '鍒氬垱寤?';

  elements.sessionStatus.textContent = `${shortSessionId(state.activeSession.id)} / ${state.activeSession.turnCount || 0} turns / ${state.activeSession.runCount || 0} runs / ${latestLabel}`;
  elements.copySessionButton.disabled = false;
  elements.chatSessionCard.innerHTML = `
    <strong>${escapeHtml(shortSessionId(state.activeSession.id))}</strong>
    <p>${escapeHtml(`${state.activeSession.turnCount || 0} turns / ${state.activeSession.runCount || 0} runs / ${portableTargetLabel()}`)}</p>
    <p>${escapeHtml(`L1 ${activation.l1} / L2 ${activation.l2} / active ${poolCounts.active || 0} / frozen ${poolCounts.frozen || 0}`)}</p>
    <p>${escapeHtml(latestLabel)}</p>
  `;
};

buildChatMessages = function buildChatMessagesOverride() {
  const turns = Array.isArray(state.activeSession?.turns) ? state.activeSession.turns.slice(-6) : [];
  if (turns.length) {
    const messages = [];

    for (const turn of turns) {
      const timeLabel = turn.createdAt ? formatDateTime(turn.createdAt) : '';
      const turnLabel = localizeTurnKind(turn.kind || 'run') || '杩愯';
      const promptText = sanitizeVisibleOutput(localizeDynamicText(latestPromptChunk(turn.prompt || turn.promptPreview || '')));
      const assistantText = sanitizeVisibleOutput(
        localizeDynamicText(turn.resultText || turn.specText || turn.resultPreview || turn.specPreview || ''),
      );

      if (promptText) {
        messages.push({
          kind: 'user',
          meta: [turnLabel, timeLabel].filter(Boolean).join(' / '),
          text: promptText,
        });
      }

      if (Array.isArray(turn.warnings) && turn.warnings.length) {
        messages.push({
          kind: 'system',
          meta: ['warning', timeLabel].filter(Boolean).join(' / '),
          text: sanitizeVisibleOutput(localizeDynamicText(turn.warnings.join(' / '))),
        });
      }

      if (assistantText) {
        messages.push({
          kind: 'assistant',
          meta: [turnLabel, timeLabel].filter(Boolean).join(' / '),
          text: assistantText,
          expanded: true,
        });
      }
    }

    return messages.slice(-12);
  }

  const messages = [];
  const prompt = elements.promptInput.value.trim();
  const latestTurn = state.activeSession?.latestTurn;
  const userPrompt = latestPromptChunk(latestTurn?.prompt || prompt);

  if (userPrompt) {
    messages.push({
      kind: 'user',
      meta: state.activeSession?.id ? shortSessionId(state.activeSession.id) : 'draft',
      text: sanitizeVisibleOutput(localizeDynamicText(userPrompt)),
    });
  }

  if (state.activeRun?.warnings?.length) {
    messages.push({
      kind: 'system',
      meta: 'warning',
      text: sanitizeVisibleOutput(localizeDynamicText(state.activeRun.warnings.join(' / '))),
    });
  }

  const assistantText =
    state.activeRun?.finalOutput ||
    state.preview?.specPack?.masterSpec ||
    latestTurn?.resultText ||
    latestTurn?.specText ||
    latestTurn?.resultPreview ||
    latestTurn?.specPreview ||
    '';

  if (assistantText) {
    messages.push({
      kind: 'assistant',
      meta: state.activeRun ? 'run result' : state.preview ? 'spec preview' : 'assistant',
      text: sanitizeVisibleOutput(localizeDynamicText(assistantText)),
      expanded: true,
    });
  }

  return messages;
};

renderChatStream = function renderChatStreamOverride() {
  const messages = buildChatMessages().slice(-12);
  if (!messages.length) {
    elements.chatStream.textContent = '閫夋嫨涓€涓細璇濓紝鎴栬€呯洿鎺ヨ緭鍏ョ洰鏍囥€?';
    return;
  }

  const roleLabelMap = {
    user: '浣?',
    system: '绯荤粺',
    assistant: 'Agent',
  };

  elements.chatStream.innerHTML = messages
    .map((message, index) => {
      const isLatest = index === messages.length - 1;
      const visibleText = message.expanded || isLatest
        ? message.text
        : clipMessageText(message.text, message.kind === 'user' ? 220 : 380);

      return `
        <article class="chat-message" data-kind="${escapeHtml(message.kind)}">
          <div class="chat-message-head">
            <strong class="chat-role">${escapeHtml(roleLabelMap[message.kind] || message.kind)}</strong>
            <span class="chat-meta">${escapeHtml(message.meta || '')}</span>
          </div>
          <div class="chat-message-body">${escapeHtml(visibleText || '')}</div>
        </article>
      `;
    })
    .join('');
};

renderSurfaceChrome = function renderSurfaceChromeOverride() {
  syncPromptMeta();
  renderRuntimeStatus();
  renderWorkbenchTabs();
  renderSelectionSummary();
  renderWorkflowPreview();
  renderWorkspacePulse();
  renderInsightPanel();
  renderTerminalSurface();
  renderSessionState();
  renderChatSuggestions();
  renderChatStream();
};

setBusy = function setBusyOverride(isBusy) {
  state.isRunning = isBusy;
  elements.runButton.disabled = isBusy;
  elements.specButton.disabled = isBusy;
  elements.chatSendButton.disabled = isBusy;
  elements.chatRunButton.disabled = isBusy;
  elements.loadSessionButton.disabled = isBusy;
  elements.newSessionButton.disabled = isBusy;
  elements.runButton.textContent = isBusy ? '杩愯涓?..' : '鐩存帴杩愯';
  elements.specButton.textContent = isBusy ? '澶勭悊涓?..' : '鐢熸垚 SPEC';
  elements.chatSendButton.textContent = isBusy ? '鍔犲叆涓?..' : '鍔犲叆浠诲姟';
  elements.chatRunButton.textContent = isBusy ? '杩愯涓?..' : '鍔犲叆骞惰繍琛?';
  elements.newSessionButton.textContent = isBusy ? '澶勭悊涓?..' : '鏂颁細璇?';
  renderSurfaceChrome();
};

applyPreviewToSurface = function applyPreviewToSurfaceOverride(result) {
  state.activeRun = null;
  state.preview = result;
  state.fusionAnalysis = result.fusion || state.fusionAnalysis;
  state.workbenchView = 'spec';
  applySession(result.session || null);

  renderRunMeta({
    domain: result.domain,
    mode: result.mode,
    llm: { usedLlm: false },
    createdAt: new Date().toISOString(),
    session: result.session,
    agentRuntime: result.agentRuntime,
    portableHarness: result.portableHarness,
  });
  renderSpecRounds(result.specPack);
  renderWorkflow(result.workflow, []);
  renderFinalOutput(result.specPack.masterSpec);
  renderFusionPanel();
  renderSurfaceChrome();
};

hydrateSession = async function hydrateSessionOverride(sessionId) {
  const normalized = text(sessionId).trim();
  if (!normalized) return;

  try {
    const session = await fetchJson(`/api/session?id=${encodeURIComponent(normalized)}`);
    elements.domainSelect.value = session.domain?.id || currentDomain();
    setMode(session.mode || 'harness', { skipRender: true });
    state.agentQuery = '';
    elements.agentSearchInput.value = '';

    await loadCatalog(session.domain?.id || currentDomain(), {
      preserveSelection: false,
      selectedAgentIds: session.selectedAgentIds || [],
    });

    applySession(session);
    elements.promptInput.value = session.latestTurn?.prompt || '';

    if (session.lastRunId) {
      const run = await fetchRun(session.lastRunId);
      applyRunToSurface(run);
      elements.promptInput.value = session.latestTurn?.prompt || run.prompt || '';
    } else {
      state.activeRun = null;
      state.preview = null;
      state.workbenchView = 'workflow';
      renderRunMeta({
        domain: session.domain,
        mode: session.mode,
        llm: { usedLlm: false },
        createdAt: session.updatedAt,
        session,
        agentRuntime: session.agentRuntime,
        portableHarness: session.portableHarness,
      });
      renderSpecRounds(null);
      renderWorkflow(session.workflow || [], []);
      renderFinalOutput(
        session.latestTurn?.resultText ||
          session.latestTurn?.specText ||
          session.latestTurn?.resultPreview ||
          session.latestTurn?.specPreview ||
          '浼氳瘽宸茶浇鍏ワ紝绛夊緟缁窇',
      );
      renderSurfaceChrome();
    }

    syncPromptMeta();
    scheduleFusionRefresh();
  } catch (error) {
    renderFinalOutput(error.message);
  }
};

submitSpecOnly = async function submitSpecOnlyOverride() {
  try {
    setBusy(true);
    const result = await fetchJson('/api/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload()),
    });
    applyPreviewToSurface(result);
    await refreshSessionList();
  } catch (error) {
    renderFinalOutput(error.message);
  } finally {
    setBusy(false);
  }
};

submitRun = async function submitRunOverride() {
  try {
    setBusy(true);
    const result = await fetchJson('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload()),
    });

    applyRunToSurface(result);
    await refreshSessionList();
  } catch (error) {
    renderFinalOutput(error.message);
  } finally {
    setBusy(false);
  }
};

appendChatToPrompt = function appendChatToPromptOverride(runAfter = false) {
  const content = elements.chatInput.value.trim();
  if (!content) return;

  const current = elements.promptInput.value.trim();
  const hasSession = Boolean(currentSessionId() || state.activeSession?.id || state.activeRun?.session?.id);
  elements.promptInput.value = hasSession ? content : current ? `${current}\n\n${content}` : content;
  elements.chatInput.value = '';
  syncPromptMeta();
  scheduleFusionRefresh();
  renderSurfaceChrome();

  if (runAfter) {
    return submitRun();
  }
};

startNewSession = function startNewSessionOverride() {
  applySession(null);
  elements.promptInput.value = '';
  elements.chatInput.value = '';
  resetSurface();
  syncPromptMeta();
  scheduleFusionRefresh();
  renderSurfaceChrome();
};

boot = async function bootOverride() {
  const storedConfig = loadStoredConfig();
  const storedSessionId = loadStoredSessionId();
  const storedLayout = loadStoredLayout();
  const storedAgentFilter = loadStoredAgentFilter();
  const configPayload = await fetchJson('/api/config');

  state.config = configPayload;
  state.agentFilter = storedAgentFilter;
  state.ui.leftCollapsed = Boolean(storedLayout.leftCollapsed);
  state.ui.rightCollapsed = Boolean(storedLayout.rightCollapsed);
  state.ui.zen = Boolean(storedLayout.zen);

  renderDomainOptions();
  elements.baseUrlInput.value = storedConfig.baseUrl || state.config.runtime.llm.baseUrl || '';
  elements.modelInput.value = storedConfig.model || state.config.runtime.llm.model || '';
  elements.apiStyleInput.value = storedConfig.apiStyle || state.config.runtime.llm.apiStyle || 'responses';
  elements.temperatureInput.value = String(
    storedConfig.temperature ?? state.config.runtime.llm.temperature ?? 0.4,
  );
  elements.apiKeyInput.value = storedConfig.apiKey || '';

  await refreshSessionList();
  renderRuntimeStatus();
  applyLayoutState();
  await loadCatalog(currentDomain(), { preserveSelection: false });
  applySession(null);
  renderSurfaceChrome();

  if (storedSessionId) {
    await hydrateSession(storedSessionId);
  }
};

function hasStoredLayoutFlag(layout, key) {
  return Object.prototype.hasOwnProperty.call(layout || {}, key);
}

function summarizeAssistantText(value, maxLength = 420) {
  const normalized = stripCenterStatusNoise(sanitizeVisibleOutput(localizeDynamicText(value || '')));
  return clipMessageText(normalized, maxLength);
}

MODE_META.single = { label: '鍗曚綋', description: '鍗曚釜 agent 鐩存帴瀹屾垚' };
MODE_META.compose = { label: '缁勫悎', description: '澶氫釜 agent 鍗忓悓瀹屾垚' };
MODE_META.harness = { label: '缂栨帓', description: '瀹屾暣鍚庣缂栨帓涓庣画璺? '};

applyLayoutState = function applyLayoutStateOverride() {
  const leftCollapsed = state.ui.zen ? true : Boolean(state.ui.leftCollapsed);
  const rightCollapsed = state.ui.zen ? true : Boolean(state.ui.rightCollapsed);

  elements.pageShell.dataset.leftCollapsed = String(leftCollapsed);
  elements.pageShell.dataset.rightCollapsed = String(rightCollapsed);
  elements.pageShell.dataset.zen = String(Boolean(state.ui.zen));

  const controls = [
    { element: elements.toggleLeftRailButton, active: !leftCollapsed, label: '浼氳瘽' },
    { element: elements.toggleRightRailButton, active: !rightCollapsed, label: '缁嗚妭' },
    { element: elements.toggleZenButton, active: Boolean(state.ui.zen), label: '涓撴敞' },
  ];

  for (const control of controls) {
    if (!control.element) continue;
    control.element.classList.toggle('is-active', control.active);
    control.element.setAttribute('aria-pressed', control.active ? 'true' : 'false');
    control.element.textContent = control.label;
  }

  localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify({ ...state.ui, version: 'simple-v2' }));
};

renderRecentRuns = function renderRecentRunsSimpleOverride() {
  const conversations = [];
  const seen = new Set();

  for (const item of state.sessions || []) {
    const sessionId = item.sessionId || item.id;
    if (!sessionId || seen.has(sessionId)) continue;
    seen.add(sessionId);
    conversations.push({ ...item, conversationId: sessionId });
    if (conversations.length >= 12) break;
  }

  if (!conversations.length) {
    elements.recentRuns.textContent = '杩樻病鏈変細璇?';
    return;
  }

  elements.recentRuns.innerHTML = conversations
    .map((session) => {
      const active =
        state.activeSession?.id === session.conversationId ||
        state.currentSessionId === session.conversationId ||
        state.activeRun?.session?.id === session.conversationId;
      const titleText = localizeDynamicText(
        session.title || session.lastPromptPreview || session.promptPreview || session.lastOutputPreview || '',
      );
      const previewText = localizeDynamicText(session.lastPromptPreview || session.lastOutputPreview || '');
      const timeText = formatDateTime(session.updatedAt || session.createdAt);

      return `
        <button
          type="button"
          class="recent-run-button ${active ? 'is-active' : ''}"
          data-session-id="${escapeHtml(session.conversationId)}"
          data-run-id="${escapeHtml(session.lastRunId || session.id)}"
        >
          <div class="recent-run-head">
            <strong class="recent-run-title">${escapeHtml(safePreviewText(titleText, 24) || '鏈懡鍚嶄細璇?')}</strong>
            <span class="recent-run-time">${escapeHtml(timeText)}</span>
          </div>
          <p>${escapeHtml(shortSessionId(session.conversationId))}</p>
          <small>${escapeHtml(clipMessageText(previewText || `${session.turnCount || 0} 杞璇?/ ${session.runCount || 0} 娆¤繍琛宍, 60))}</small>
        </button>
      `;
    })
    .join('');

  for (const button of elements.recentRuns.querySelectorAll('[data-session-id]')) {
    button.addEventListener('click', async () => {
      const sessionId = button.dataset.sessionId || '';
      if (sessionId.startsWith('session-')) {
        await hydrateSession(sessionId);
        return;
      }

      const runId = button.dataset.runId || '';
      if (runId) {
        await hydrateRun(runId);
      }
    });
  }
};

syncPromptMeta = function syncPromptMetaSimpleOverride() {
  const length = activePromptText().length;
  const sessionLabel = state.activeSession?.id ? shortSessionId(state.activeSession.id) : 'new';
  elements.promptMeta.textContent = `${length} 瀛?/ ${sessionLabel}`;
};

renderRunMeta = function renderRunMetaSimpleOverride(runLike) {
  if (!runLike) {
    elements.runMeta.textContent = '绛夊緟杩愯';
    return;
  }

  const domainLabel =
    typeof runLike.domain === 'string'
      ? getDomainLabel(runLike.domain)
      : runLike.domain?.label || getDomainLabel(runLike.domain?.id);
  const modeLabel = MODE_META[runLike.mode]?.label || runLike.mode || '缂栨帓';
  const llmLabel = runLike.llm?.usedLlm ? runLike.llm.model || '鐪熷疄 LLM' : displayLlmLabel();
  elements.runMeta.textContent = [domainLabel, modeLabel, llmLabel].filter(Boolean).join(' / ');
};

renderSessionState = function renderSessionStateSimpleOverride() {
  if (!state.activeSession?.id) {
    elements.sessionStatus.textContent = '鏈粦瀹?';
    elements.copySessionButton.disabled = true;
    elements.chatSessionCard.textContent = '褰撳墠杩樻病鏈夊叡浜細璇濓紝鍙戦€佷竴鏉℃秷鎭悗浼氳嚜鍔ㄥ缓绔嬨€?';
    return;
  }

  const latestTurn = state.activeSession.latestTurn;
  const latestLabel = latestTurn ? `${localizeTurnKind(latestTurn.kind)} / ${formatDateTime(latestTurn.createdAt)}` : '鍒氬垱寤?';
  elements.sessionStatus.textContent = `${shortSessionId(state.activeSession.id)} / ${state.activeSession.turnCount || 0} 杞甡`;
  elements.copySessionButton.disabled = false;
  elements.chatSessionCard.textContent = `${shortSessionId(state.activeSession.id)} / ${state.activeSession.turnCount || 0} 杞璇?/ ${state.activeSession.runCount || 0} 娆¤繍琛?/ ${latestLabel}`;
};

renderSelectionSummary = function renderSelectionSummarySimpleOverride() {
  if (!state.catalog) {
    elements.selectionSummary.innerHTML = '<div class="empty-state">绛夊緟鍔犺浇</div>';
    return;
  }

  const activation = portableActivationCounts();
  const leadAgent = currentLeadAgent();
  const chips = [
    { label: '棰嗗煙', value: state.catalog.domain.label },
    { label: '妯″紡', value: MODE_META[currentMode()].label },
    { label: '涓绘帶', value: compactText(localizeDisplayName(leadAgent?.displayName || portableTargetLabel()), 20) },
    { label: '婵€娲?', value: `L1 ${activation.l1} / L4 ${activation.l4}` },
  ];

  elements.selectionSummary.innerHTML = chips
    .map(
      (chip) => `
        <article class="summary-chip">
          <span>${escapeHtml(chip.label)}</span>
          <strong>${escapeHtml(chip.value)}</strong>
        </article>
      `,
    )
    .join('');
};

renderWorkspacePulse = function renderWorkspacePulseSimpleOverride() {
  if (!state.catalog) {
    elements.workspacePulse.innerHTML = '<div class="empty-state">绛夊緟鐘舵€?/div>';
    return;
  }

  const runtime = currentAgentRuntime();
  const activation = portableActivationCounts();
  const cards = [
    {
      label: '鐘舵€?',
      value: displayStageLabel(),
      copy: displayLlmLabel(),
      tone: state.activeRun ? 'accent' : 'teal',
    },
    {
      label: '鐩爣 Agent',
      value: portableTargetLabel(),
      copy: `${state.catalog.domain.label} / ${MODE_META[currentMode()].label}`,
      tone: 'teal',
    },
    {
      label: '婵€娲绘搴?',
      value: `L1 ${activation.l1} / L2 ${activation.l2}`,
      copy: `L3 ${activation.l3} / L4 ${activation.l4}`,
      tone: 'gold',
    },
    {
      label: '杩愯鏃?',
      value: runtime ? `${runtimePoolCounts().active || 0} active / ${runtimePoolCounts().frozen || 0} frozen` : 'pending',
      copy: runtime ? `${(runtime.pets || []).length} pets / dream ${runtime.dream?.enabled ? 'on' : 'off'}` : '绛夊緟婵€娲?',
      tone: 'accent',
    },
  ];

  elements.workspacePulse.innerHTML = cards
    .map(
      (card) => `
        <article class="pulse-card">
          <span class="pulse-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="pulse-copy">${escapeHtml(card.copy)}</p>
          <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
        </article>
      `,
    )
    .join('');
};

renderWorkflowPreview = function renderWorkflowPreviewSimpleOverride() {
  const workflowIds = resolveWorkflowIds();
  if (!workflowIds.length) {
    elements.workflowPreview.textContent = '绛夊緟瑁呴厤';
    return;
  }

  const previewIds = workflowIds.slice(0, 6);
  const hiddenCount = Math.max(0, workflowIds.length - previewIds.length);
  elements.workflowPreview.innerHTML = previewIds
    .map((agentId) => {
      const descriptor = getAgent(agentId);
      return `<span class="workflow-chip">${escapeHtml(localizeDisplayName(descriptor?.displayName || agentId))}</span>`;
    })
    .join('')
    .concat(hiddenCount ? `<span class="workflow-chip">+${escapeHtml(String(hiddenCount))}</span>` : '');
};

renderInsightPanel = function renderInsightPanelSimpleOverride() {
  if (!state.catalog) {
    elements.insightPanel.innerHTML = '<div class="empty-state">绛夊緟璇婃柇</div>';
    return;
  }

  const runtime = currentAgentRuntime();
  const warnings = state.activeRun?.warnings || state.activeSession?.latestTurn?.warnings || [];
  const backends = portableBackendEntries();
  const cards = [
    {
      label: '浼氳瘽',
      value: state.activeSession?.id ? shortSessionId(state.activeSession.id) : '鏈粦瀹?',
      copy: state.activeSession?.id ? `${state.activeSession.turnCount || 0} 杞?/ ${state.activeSession.runCount || 0} 娆 : '鍙戦€佸悗鑷姩寤虹珛'`,
      tone: 'teal',
      tags: [],
    },
    {
      label: '娌欑洅',
      value: `${backends.length || 0} 涓悗绔痐`,
      copy: backends.map((item) => item.id).join(' / ') || 'terminal / network / browser',
      tone: 'gold',
      tags: backends.map((item) => item.id),
    },
    {
      label: '璁板繂',
      value: runtime?.dream?.retainedKeywords?.slice(0, 3).join(', ') || 'ready',
      copy: runtime ? `${runtime.routeMemory?.keywords?.length || 0} 涓叧閿瘝 / carry ${runtime.routeMemory?.carryContext ? 'on' : 'off'}` : '绛夊緟鍐欏叆',
      tone: 'accent',
      tags: [],
    },
    {
      label: '椋庨櫓',
      value: warnings.length ? `${warnings.length} 鏉 : '鏃?'`,
      copy: warnings.length ? compactText(warnings.join(' / '), 90) : '褰撳墠娌℃湁鏄惧紡璀﹀憡銆?',
      tone: warnings.length ? 'danger' : 'teal',
      tags: warnings.length ? ['warning'] : [],
    },
  ];

  elements.insightPanel.innerHTML = cards
    .map(
      (card) => `
        <article class="insight-card">
          <div class="insight-head">
            <span class="insight-label">${escapeHtml(card.label)}</span>
            <span class="pulse-tone" data-tone="${escapeHtml(card.tone)}">${escapeHtml(card.label)}</span>
          </div>
          <strong>${escapeHtml(card.value)}</strong>
          <p class="insight-copy">${escapeHtml(card.copy)}</p>
          ${
            card.tags?.length
              ? `<div class="insight-tags">${card.tags
                  .map((tag) => `<span class="agent-badge" data-pack="matched">${escapeHtml(tag)}</span>`)
                  .join('')}</div>`
              : ''
          }
        </article>
      `,
    )
    .join('');
};

renderTerminalSurface = function renderTerminalSurfaceSimpleOverride() {
  const runtime = currentAgentRuntime();
  const backends = portableBackendEntries();
  const activation = portableActivationCounts();
  const lines = [
    `stage: ${displayStageLabel()}`,
    `target: ${portableTargetLabel()}`,
    `activation: L1=${activation.l1} L2=${activation.l2} L3=${activation.l3} L4=${activation.l4}`,
    `runtime: active=${runtimePoolCounts().active || 0} warm=${runtimePoolCounts().activationPool || 0} frozen=${runtimePoolCounts().frozen || 0}`,
    `tools: ${portableToolNames(6).join(', ') || 'pending'}`,
    `backends: ${backends.map((item) => `${item.id}:${item.mode || 'simulated'}`).join(' | ') || 'pending'}`,
  ];

  if (runtime?.dream?.retainedKeywords?.length) {
    lines.push(`memory: ${runtime.dream.retainedKeywords.slice(0, 8).join(', ')}`);
  }

  elements.terminalSurface.textContent = lines.join('\n');
};

renderChatSuggestions = function renderChatSuggestionsSimpleOverride() {
  const prompt = elements.promptInput.value.trim();
  const suggestions = prompt
    ? [
        '缁х画杩欎釜浼氳瘽锛屼絾鍙粰鎴戞渶缁堢粨璁恒€?',
        '缁х画杩欎釜浼氳瘽锛屽苟琛ヤ竴杞獙璇併€?',
        '鍩轰簬褰撳墠缁撴灉锛屽啀绮剧畝鎴愬彲鎵ц姝ラ銆?',
      ]
    : (state.catalog?.domain?.examples || []).slice(0, 3);

  if (!suggestions.length) {
    elements.chatSuggestions.innerHTML = '';
    return;
  }

  elements.chatSuggestions.innerHTML = suggestions
    .map(
      (suggestion) => `
        <button type="button" class="suggestion-button" data-suggestion="${escapeHtml(suggestion)}">
          ${escapeHtml(compactText(suggestion, 52))}
          <small>鐐逛竴涓嬪～鍏ヨ緭鍏ユ</small>
        </button>
      `,
    )
    .join('');

  for (const button of elements.chatSuggestions.querySelectorAll('[data-suggestion]')) {
    button.addEventListener('click', () => {
      elements.chatInput.value = button.dataset.suggestion || '';
      elements.chatInput.focus();
    });
  }
};

renderChatStream = function renderChatStreamSimpleOverride() {
  const messages = buildChatMessages().slice(-8);
  if (!messages.length) {
    elements.chatStream.textContent = '閫夋嫨涓€涓細璇濓紝鎴栬€呯洿鎺ヨ緭鍏ョ洰鏍囥€?';
    return;
  }

  const roleLabelMap = {
    user: '浣?',
    system: '绯荤粺',
    assistant: '缁撴灉',
  };

  elements.chatStream.innerHTML = messages
    .map((message) => {
      const limit = message.kind === 'assistant' ? 420 : message.kind === 'user' ? 180 : 140;
      const visibleText = summarizeAssistantText(message.text, limit);

      return `
        <article class="chat-message" data-kind="${escapeHtml(message.kind)}">
          <div class="chat-message-head">
            <strong class="chat-role">${escapeHtml(roleLabelMap[message.kind] || message.kind)}</strong>
            <span class="chat-meta">${escapeHtml(message.meta || '')}</span>
          </div>
          <div class="chat-message-body">${escapeHtml(visibleText || '')}</div>
        </article>
      `;
    })
    .join('');
};

setBusy = function setBusySimpleOverride(isBusy) {
  state.isRunning = isBusy;
  elements.runButton.disabled = isBusy;
  elements.specButton.disabled = isBusy;
  elements.chatSendButton.disabled = isBusy;
  elements.chatRunButton.disabled = isBusy;
  if (elements.stopRunButton) elements.stopRunButton.disabled = !isBusy;
  elements.loadSessionButton.disabled = isBusy;
  elements.newSessionButton.disabled = isBusy;
  elements.runButton.textContent = isBusy ? '杩愯涓?..' : '鐩存帴杩愯';
  elements.specButton.textContent = isBusy ? '澶勭悊涓?..' : '鐢熸垚 SPEC';
  elements.chatSendButton.textContent = isBusy ? '鍔犲叆涓?..' : '鍔犲叆浠诲姟';
  elements.chatRunButton.textContent = isBusy ? '杩愯涓?..' : '鍔犲叆骞惰繍琛?';
  elements.newSessionButton.textContent = isBusy ? '澶勭悊涓?..' : '鏂颁細璇?';
  renderSurfaceChrome();
};

boot = async function bootSimpleOverride() {
  const storedConfig = loadStoredConfig();
  const storedSessionId = loadStoredSessionId();
  const storedLayout = loadStoredLayout();
  const storedAgentFilter = loadStoredAgentFilter();
  const configPayload = await fetchJson('/api/config');

  state.config = configPayload;
  state.agentFilter = storedAgentFilter;
  const useStoredLayout = storedLayout.version === 'simple-v2';
  state.ui.leftCollapsed = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'leftCollapsed') ? Boolean(storedLayout.leftCollapsed) : true;
  state.ui.rightCollapsed = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'rightCollapsed') ? Boolean(storedLayout.rightCollapsed) : true;
  state.ui.zen = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'zen') ? Boolean(storedLayout.zen) : false;

  renderDomainOptions();
  elements.baseUrlInput.value = storedConfig.baseUrl || state.config.runtime.llm.baseUrl || '';
  elements.modelInput.value = storedConfig.model || state.config.runtime.llm.model || '';
  elements.apiStyleInput.value = storedConfig.apiStyle || state.config.runtime.llm.apiStyle || 'responses';
  elements.temperatureInput.value = String(
    storedConfig.temperature ?? state.config.runtime.llm.temperature ?? 0.4,
  );
  elements.apiKeyInput.value = storedConfig.apiKey || '';

  await refreshSessionList();
  renderRuntimeStatus();
  applyLayoutState();
  await loadCatalog(currentDomain(), { preserveSelection: false });
  applySession(null);
  renderSurfaceChrome();

  if (storedSessionId) {
    await hydrateSession(storedSessionId);
  }
};

applyLayoutState = function applyLayoutStatePanelOverride() {
  const leftCollapsed = state.ui.zen ? true : Boolean(state.ui.leftCollapsed);
  const rightCollapsed = state.ui.zen ? true : Boolean(state.ui.rightCollapsed);

  elements.pageShell.dataset.leftCollapsed = String(leftCollapsed);
  elements.pageShell.dataset.rightCollapsed = String(rightCollapsed);
  elements.pageShell.dataset.zen = String(Boolean(state.ui.zen));

  const controls = [
    { element: elements.toggleLeftRailButton, active: !leftCollapsed, label: '浼氳瘽' },
    { element: elements.toggleRightRailButton, active: !rightCollapsed, label: '鎺у埗' },
    { element: elements.toggleZenButton, active: Boolean(state.ui.zen), label: '涓撴敞' },
  ];

  for (const control of controls) {
    if (!control.element) continue;
    control.element.classList.toggle('is-active', control.active);
    control.element.setAttribute('aria-pressed', control.active ? 'true' : 'false');
    control.element.textContent = control.label;
  }

  localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify({ ...state.ui, version: 'panel-v4' }));
};

renderWorkflow = function renderWorkflowPanelOverride(workflow, drafts) {
  if (!workflow?.length) {
    elements.workflowTimeline.textContent = '绛夊緟璋冨害';
    return;
  }

  elements.workflowTimeline.innerHTML = workflow
    .map((agent, index) => {
      const draft = drafts?.[index];
      const runtimeState = agentRuntimeStateFor(agent.id) || 'standby';
      const goal =
        draft?.objective ||
        draft?.summary ||
        localizeCatalogText(agent.summary || '') ||
        localizeRole(agent.role) ||
        '绛夊緟鎵ц';

      return `
        <article class="flow-node">
          <div class="flow-node-head">
            <div>
              <span class="node-pill">姝ラ ${index + 1}</span>
              <strong>${escapeHtml(localizeDisplayName(agent.displayName || agent.id))}</strong>
            </div>
            <span class="node-pill">${escapeHtml(runtimeState)}</span>
          </div>
          <p>${escapeHtml(compactText(goal, 60))}</p>
        </article>
      `;
    })
    .join('');
};

renderChatSuggestions = function renderChatSuggestionsPanelOverride() {
  const prompt = elements.promptInput.value.trim();
  const suggestions = prompt
    ? ['缁х画杩欎釜浼氳瘽锛屽彧缁欑粨璁恒€?', '缁х画杩欎釜浼氳瘽锛屽啀琛ヤ竴杞獙璇併€?']
    : ['缁х画褰撳墠浼氳瘽骞堕獙璇?', '鎶婄粨鏋滄暣鐞嗘垚鎵ц姝ラ'];

  elements.chatSuggestions.innerHTML = suggestions
    .map(
      (suggestion) => `
        <button type="button" class="suggestion-button" data-suggestion="${escapeHtml(suggestion)}">
          ${escapeHtml(suggestion)}
          <small>鐐逛竴涓嬪～鍏ヨ緭鍏ユ</small>
        </button>
      `,
    )
    .join('');

  for (const button of elements.chatSuggestions.querySelectorAll('[data-suggestion]')) {
    button.addEventListener('click', () => {
      elements.chatInput.value = button.dataset.suggestion || '';
      elements.chatInput.focus();
    });
  }
};

renderChatStream = function renderChatStreamPanelOverride() {
  const messages = buildChatMessages().slice(-6);
  if (!messages.length) {
    elements.chatStream.textContent = '閫夋嫨涓€涓細璇濓紝鎴栬€呯洿鎺ヨ緭鍏ョ洰鏍囥€?';
    return;
  }

  const roleLabelMap = {
    user: '浣?',
    system: '绯荤粺',
    assistant: '鎵ц',
  };

  elements.chatStream.innerHTML = messages
    .map((message) => {
      const limit = message.kind === 'assistant' ? 220 : message.kind === 'user' ? 140 : 100;
      const visibleText = summarizeAssistantText(message.text, limit);

      return `
        <article class="chat-message" data-kind="${escapeHtml(message.kind)}">
          <div class="chat-message-head">
            <strong class="chat-role">${escapeHtml(roleLabelMap[message.kind] || message.kind)}</strong>
            <span class="chat-meta">${escapeHtml(message.meta || '')}</span>
          </div>
          <div class="chat-message-body">${escapeHtml(visibleText || '')}</div>
        </article>
      `;
    })
    .join('');
};

renderFinalOutput = function renderFinalOutputPanelOverride(textValue) {
  const content = sanitizeVisibleOutput(localizeDynamicText(textValue)) || '绛夊緟缁撴灉';
  elements.finalOutput.textContent = content;
  elements.copyOutputButton.disabled = !text(content).trim() || content === '绛夊緟缁撴灉';
};

boot = async function bootPanelOverride() {
  const storedConfig = loadStoredConfig();
  const storedSessionId = loadStoredSessionId();
  const storedLayout = loadStoredLayout();
  const storedAgentFilter = loadStoredAgentFilter();
  const configPayload = await fetchJson('/api/config');

  state.config = configPayload;
  state.agentFilter = storedAgentFilter;

  const useStoredLayout = storedLayout.version === 'panel-v4';
  state.ui.leftCollapsed = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'leftCollapsed') ? Boolean(storedLayout.leftCollapsed) : false;
  state.ui.rightCollapsed = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'rightCollapsed') ? Boolean(storedLayout.rightCollapsed) : false;
  state.ui.zen = useStoredLayout && hasStoredLayoutFlag(storedLayout, 'zen') ? Boolean(storedLayout.zen) : false;

  renderDomainOptions();
  elements.baseUrlInput.value = storedConfig.baseUrl || state.config.runtime.llm.baseUrl || '';
  elements.modelInput.value = storedConfig.model || state.config.runtime.llm.model || '';
  elements.apiStyleInput.value = storedConfig.apiStyle || state.config.runtime.llm.apiStyle || 'responses';
  elements.temperatureInput.value = String(
    storedConfig.temperature ?? state.config.runtime.llm.temperature ?? 0.4,
  );
  elements.apiKeyInput.value = storedConfig.apiKey || '';

  await refreshSessionList();
  renderRuntimeStatus();
  applyLayoutState();
  await loadCatalog(currentDomain(), { preserveSelection: false });
  applySession(null);
  renderSurfaceChrome();

  if (storedSessionId) {
    await hydrateSession(storedSessionId);
  }
};

state.stream = null;
elements.saveRuntimeButton = document.getElementById('saveRuntimeButton');
elements.testLlmButton = document.getElementById('testLlmButton');
elements.testLlmResult = document.getElementById('testLlmResult');
elements.visibleAgentSearchInput = document.getElementById('visibleAgentSearchInput');
elements.visibleAgentSearchField = document.getElementById('visibleAgentSearchField');
elements.visibleAgentDeck = document.getElementById('visibleAgentDeck');
elements.agentSelectorHint = document.getElementById('agentSelectorHint');
elements.domainAutoHint = document.getElementById('domainAutoHint');
elements.taskProcessPanel = document.getElementById('taskProcessPanel');

function setInlineStatus(element, message, tone = 'neutral') {
  if (!element) return;
  element.textContent = message;
  if (tone === 'neutral') {
    delete element.dataset.tone;
    return;
  }
  element.dataset.tone = tone;
}

function renderDomainAutoHint() {
  if (!elements.domainAutoHint) return;

  const inferredLabel = state.catalog?.domain?.inferredDomainLabel || state.catalog?.domain?.label || getDomainLabel(currentDomain());

  if (currentDomain() === 'custom') {
    elements.domainAutoHint.textContent =
      currentMode() === 'harness'
        ? `鑷畾涔夋ā寮忎細鏍规嵁褰撳墠鎻愮ず璇嶈嚜鍔ㄦ绱紝褰撳墠鍊惧悜棰嗗煙锛?{inferredLabel}銆俙
        : `鑷畾涔夋ā寮忓凡寮€鍚紝浣犲彲浠ュ彸渚ф墜閫夋櫤鑳戒綋锛屼篃鍙互鍙傝€冪郴缁熸寜鍏抽敭璇嶇粰鍑虹殑鍊惧悜棰嗗煙锛?{inferredLabel}銆俙`;
    return;
  }

  elements.domainAutoHint.textContent =
    currentMode() === 'harness'
      ? 'Harness mode auto-completes the execution chain from the prompt, session context, and current domain.'
      : 'Single and compose modes let you manually pick participating agents from the right panel.';
}

function renderTaskProcessPanel() {
  if (!elements.taskProcessPanel) return;

  const leadAgent = currentLeadAgent();
  const warnings = state.activeRun?.warnings || state.activeSession?.latestTurn?.warnings || [];
  const latestPrompt = latestPromptChunk(state.activeSession?.latestTurn?.prompt || elements.promptInput.value.trim());
  const cards = [
    {
      label: '褰撳墠浠诲姟',
      value: latestPrompt || '绛夊緟杈撳叆浠诲姟',
    },
    {
      label: '褰撳墠妯″紡',
      value: `${getDomainLabel(currentDomain())} / ${MODE_META[currentMode()].label}`,
    },
    {
      label: '涓绘帶鏅鸿兘浣?',
      value: localizeDisplayName(leadAgent?.displayName || portableTargetLabel()),
    },
  ];

  if (warnings.length) {
    cards.push({
      label: '璀﹀憡',
      value: warnings.join(' / '),
    });
  }

  elements.taskProcessPanel.innerHTML = cards
    .map(
      (card) => `
        <article class="task-process-card">
          <strong>${escapeHtml(card.label)}</strong>
          <p>${escapeHtml(compactText(card.value, 120))}</p>
        </article>
      `,
    )
    .join('');
}

function renderVisibleAgentDeck() {
  if (!elements.visibleAgentDeck || !elements.agentSelectorHint || !elements.visibleAgentSearchField) return;

  const mode = currentMode();
  const agents = filteredAgents().slice(0, 36);
  const selectedCount = currentSelectedAgentIds().length;

  elements.visibleAgentSearchField.hidden = mode === 'harness';

  if (mode === 'harness') {
    elements.agentSelectorHint.textContent = '鑷姩妫€绱?';
    elements.visibleAgentDeck.innerHTML = `
      <div class="empty-state">
        缂栨帓妯″紡涓嶉渶瑕佹墜鍔ㄧ偣閫夈€傜郴缁熶細鏍规嵁褰撳墠鎻愮ず璇嶃€佷笂涓嬫枃鍜岄鍩熻嚜鍔ㄦ绱㈠苟缂栨帓鏅鸿兘浣撱€?      </div>
    `;
    return;
  }

  elements.agentSelectorHint.textContent = mode === 'single' ? `鍗曢€?/ 宸查€?${selectedCount}` : `澶氶€?/ 宸查€?${selectedCount}`;

  if (!agents.length) {
    elements.visibleAgentDeck.innerHTML = '<div class="empty-state">娌℃湁鍖归厤鍒板彲閫夋櫤鑳戒綋</div>';
    return;
  }

  elements.visibleAgentDeck.innerHTML = agents
    .map((agent) => {
      const selected = state.selectedAgents.has(agent.id);
      const badges = unique([agent.sourcePack || '', ...(agent.tags || []).slice(0, 2)]).filter(Boolean);

      return `
        <article class="selector-card ${selected ? 'is-selected' : ''}" data-visible-agent-id="${escapeHtml(agent.id)}">
          <div class="selector-head">
            <span class="selector-name">${escapeHtml(localizeDisplayName(agent.displayName || agent.id))}</span>
            <span class="selector-role">${escapeHtml(localizeRole(agent.role))}</span>
          </div>
          <p class="selector-summary">${escapeHtml(compactText(localizeCatalogText(agent.summary || agent.mission || ''), 90))}</p>
          <div class="selector-tags">
            ${
              badges.length
                ? badges
                    .map((badge) => `<span class="agent-badge" data-pack="matched">${escapeHtml(localizeToken(badge))}</span>`)
                    .join('')
                : `<span class="agent-badge" data-pack="matched">${selected ? '宸查€?' : '鏈湴'}</span>`
            }
          </div>
        </article>
      `;
    })
    .join('');

  for (const card of elements.visibleAgentDeck.querySelectorAll('[data-visible-agent-id]')) {
    card.addEventListener('click', () => {
      toggleSelectedAgent(card.dataset.visibleAgentId);
    });
  }
}

const renderAgentDeckBase = renderAgentDeck;
renderAgentDeck = function renderAgentDeckLiveOverride() {
  renderAgentDeckBase();
  renderVisibleAgentDeck();
};

const renderSurfaceChromeBase = renderSurfaceChrome;
renderSurfaceChrome = function renderSurfaceChromeLiveOverride() {
  renderSurfaceChromeBase();
  renderVisibleAgentDeck();
  renderDomainAutoHint();
  renderTaskProcessPanel();
};

renderTaskProcessPanel = function renderTaskProcessPanelLiveOverride() {
  if (!elements.taskProcessPanel) return;

  const leadAgent = currentLeadAgent();
  const workflow = activeWorkflowDescriptors();
  const runtime = currentAgentRuntime();
  const routing = state.activeRun?.routing || state.preview?.routing || null;
  const warnings = state.activeRun?.warnings || state.activeSession?.latestTurn?.warnings || [];
  const latestPrompt = latestPromptChunk(state.activeSession?.latestTurn?.prompt || elements.promptInput.value.trim());
  const poolCounts = runtimePoolCounts();
  const portableHarness = currentPortableHarness();
  const activation = portableActivationCounts();
  const apiStyle =
    state.activeRun?.llm?.apiStyle ||
    collectRuntimeConfig().apiStyle ||
    state.config?.runtime?.llm?.apiStyle ||
    'responses';
  const toolNames = portableToolNames(5);
  const toolLabel = apiStyle === 'chat-completions' ? 'Chat Completions' : 'Responses';
  const statusLabel = [
    displayStageLabel(),
    state.stream?.active ? '\u6d41\u5f0f\u8f93\u51fa\u4e2d' : '',
    warnings.length ? '\u6709\u8b66\u544a' : '',
  ]
    .filter(Boolean)
    .join(' \u00b7 ');
  const triggeredCount = routing?.triggeredAgents?.length || workflow.length || 0;
  const consideredCount = routing?.consideredAgentCount || workflow.length || 0;
  const backendLabel = portableBackendEntries()
    .map((item) => `${item.id}-${item.mode || 'simulated'}`)
    .join(' ');
  const sessionLabel = state.activeSession?.id
    ? `${shortSessionId(state.activeSession.id)} / ${state.activeSession.turnCount || 0} turns / ${state.activeSession.runCount || 0} runs`
    : '\u53d1\u9001\u540e\u81ea\u52a8\u7ed1\u5b9a\u4f1a\u8bdd';
  const progressValue = consideredCount ? `${triggeredCount || 0}/${Math.max(triggeredCount || 0, consideredCount)} \u6b65` : '\u7b49\u5f85\u8def\u7531';
  const routeDetail = consideredCount
    ? `\u5df2\u4ece ${consideredCount} \u4e2a\u5019\u9009 Agent \u4e2d\u5b8c\u6210\u8def\u7531`
    : '\u6682\u672a\u751f\u6210\u5019\u9009 Agent';
  const toolValue = toolLabel;
  const toolDetail = [toolLabel, displayLlmLabel(), backendLabel || portableToolNames(5).join(' ')].filter(Boolean).join(' / ');
  const currentUseValue = `${toolLabel} \u8c03\u7528 ${displayLlmLabel()}`;
  const currentUseDetail = runtime
    ? `runtime ${poolCounts.active || 0}-${poolCounts.activationPool || 0}-${poolCounts.frozen || 0} / pets ${(runtime.pets || []).length}`
    : '\u6682\u65e0 runtime \u5feb\u7167';
  const agentCountValue = `${triggeredCount || (leadAgent ? 1 : 0)} / ${Math.max(triggeredCount || 1, workflow.length || 1)}`;
  const agentCountDetail = localizeDisplayName(leadAgent?.displayName || portableTargetLabel());
  const poolValue = runtime
    ? `active=${poolCounts.active || 0} warm=${poolCounts.activationPool || 0}`
    : 'active=0 warm=0';
  const poolDetail = runtime
    ? `cooling=${poolCounts.cooling || 0} frozen=${poolCounts.frozen || 0}`
    : 'cooling=0 frozen=0';
  const cards = [
    {
      label: '\u5f53\u524d\u4efb\u52a1',
      value: latestPrompt || '\u7b49\u5f85\u8f93\u5165\u4efb\u52a1',
      detail: `${getDomainLabel(currentDomain())} / ${MODE_META[currentMode()].label}`,
    },
    {
      label: '\u8fd0\u884c\u72b6\u6001',
      value: statusLabel || '\u5f85\u547d',
      detail: sessionLabel,
    },
    {
      label: '\u4efb\u52a1\u8fdb\u5ea6',
      value: progressValue,
      detail: routeDetail,
    },
    {
      label: '\u601d\u8003\u4e2d',
      value: statusLabel || '\u5f85\u547d',
      detail: warnings.length ? warnings.join(' / ') : '\u6682\u65e0\u663e\u5f0f\u8b66\u544a',
    },
    {
      label: '\u8c03\u7528\u5de5\u5177',
      value: toolValue,
      detail: toolDetail || 'pending',
    },
    {
      label: '\u5f53\u524d\u4f7f\u7528',
      value: currentUseValue,
      detail: currentUseDetail,
    },
    {
      label: '\u8c03\u7528 Agent',
      value: agentCountValue,
      detail: agentCountDetail,
    },
    {
      label: 'pool',
      value: poolValue,
      detail: poolDetail,
    },
    {
      label: '\u5f53\u524d\u6a21\u5f0f',
      value: `${getDomainLabel(currentDomain())} / ${MODE_META[currentMode()].label}`,
      detail:
        currentDomain() === 'custom'
          ? `auto ${state.catalog?.domain?.inferredDomainLabel || getDomainLabel(currentDomain())}`
          : '\u4e2d\u95f4\u533a\u53ea\u4fdd\u7559\u8f93\u5165\u548c\u6700\u7ec8\u8f93\u51fa',
    },
  ];

  if (warnings.length) {
    cards.push({
      label: '\u8b66\u544a',
      value: compactText(warnings.join(' / '), 72),
      detail: '\u72b6\u6001\u8bf4\u660e\u5df2\u79fb\u5230\u5de6\u4fa7\u4efb\u52a1\u9762\u677f',
    });
  }

  elements.taskProcessPanel.innerHTML = cards
    .map(
      (card) => `
        <article class="task-process-card">
          <strong>${escapeHtml(card.label)}</strong>
          <p>${escapeHtml(compactText(card.value, 120))}</p>
          ${card.detail ? `<small>${escapeHtml(compactText(card.detail, 140))}</small>` : ''}
        </article>
      `,
    )
    .join('');
};

renderChatStream = function renderChatStreamCompactOverride() {
  const items = collectUserInstructionEntries();

  if (!items.length) {
    elements.chatStream.textContent = '\u9009\u62e9\u4e00\u4e2a\u4f1a\u8bdd\uff0c\u6216\u8005\u76f4\u63a5\u8f93\u5165\u76ee\u6807\u3002';
    return;
  }

  elements.chatStream.innerHTML = items
    .map(
      (item, index) => `
        <article class="chat-message" data-kind="${escapeHtml(item.kind)}">
          <strong class="chat-role">${escapeHtml(`褰撳墠杈撳叆 ${index + 1}`)}</strong>
          ${item.meta ? `<span class="chat-meta">${escapeHtml(item.meta)}</span>` : ''}
          <div class="chat-message-body">${escapeHtml(item.text || '')}</div>
        </article>
      `,
    )
    .join('');
};

renderVisibleAgentDeck = function renderVisibleAgentDeckGlobalOverride() {
  if (!elements.visibleAgentDeck || !elements.agentSelectorHint || !elements.visibleAgentSearchField) return;

  const mode = currentMode();
  const agents = filteredAgents();
  const selectedCount = currentSelectedAgentIds().length;
  const indexedCount = (state.catalog?.allAgents || state.catalog?.agents || []).length;

  elements.visibleAgentSearchField.hidden = mode === 'harness';

  if (mode === 'harness') {
    elements.agentSelectorHint.textContent = '\u81ea\u52a8\u68c0\u7d22';
    elements.visibleAgentDeck.innerHTML = `
      <div class="empty-state">
        \u7f16\u6392\u6a21\u5f0f\u4e0d\u9700\u8981\u624b\u52a8\u70b9\u9009\u3002\u7cfb\u7edf\u4f1a\u6839\u636e\u63d0\u793a\u8bcd\u3001\u4e0a\u4e0b\u6587\u548c\u5f53\u524d\u9886\u57df\u81ea\u52a8\u68c0\u7d22\u5e76\u7f16\u6392\u667a\u80fd\u4f53\u3002
      </div>
    `;
    return;
  }

  elements.agentSelectorHint.textContent =
    mode === 'single'
      ? `\u5355\u9009 / \u5df2\u9009 ${selectedCount} / \u5df2\u7d22\u5f15 ${indexedCount}`
      : `\u591a\u9009 / \u5df2\u9009 ${selectedCount} / \u5df2\u7d22\u5f15 ${indexedCount}`;

  if (!agents.length) {
    elements.visibleAgentDeck.innerHTML = '<div class="empty-state">\u6ca1\u6709\u5339\u914d\u5230\u53ef\u9009\u667a\u80fd\u4f53</div>';
    return;
  }

  elements.visibleAgentDeck.innerHTML = agents
    .map((agent) => {
      const selected = state.selectedAgents.has(agent.id);
      const badges = unique([...(agent.sceneTags || []).slice(0, 4), agent.sourcePack || '', ...(agent.tags || []).slice(0, 2)]).filter(Boolean);

      return `
        <article class="selector-card ${selected ? 'is-selected' : ''}" data-visible-agent-id="${escapeHtml(agent.id)}">
          <div class="selector-head">
            <span class="selector-name">${escapeHtml(localizeDisplayName(agent.displayName || agent.id))}</span>
            <span class="selector-role">${escapeHtml(localizeRole(agent.role))}</span>
          </div>
          <p class="selector-summary">${escapeHtml(compactText(localizeCatalogText(agent.summary || agent.mission || ''), 90))}</p>
          <div class="selector-tags">
            ${
              badges.length
                ? badges
                    .map((badge) => `<span class="agent-badge" data-pack="matched">${escapeHtml(localizeToken(badge))}</span>`)
                    .join('')
                : `<span class="agent-badge" data-pack="matched">${selected ? '\u5df2\u9009' : '\u672c\u5730'}</span>`
            }
          </div>
        </article>
      `;
    })
    .join('');

  for (const card of elements.visibleAgentDeck.querySelectorAll('[data-visible-agent-id]')) {
    card.addEventListener('click', () => {
      toggleSelectedAgent(card.dataset.visibleAgentId);
    });
  }
};

const renderRunMetaBase = renderRunMeta;
renderRunMeta = function renderRunMetaLiveOverride(runLike) {
  if (!runLike && state.stream?.active) {
    const plan = state.stream.plan || state.preview;
    const domainLabel = plan?.domain?.label || getDomainLabel(currentDomain());
    const modeLabel = MODE_META[plan?.mode || currentMode()]?.label || MODE_META[currentMode()].label;
    elements.runMeta.textContent = [domainLabel, modeLabel, displayLlmLabel(), '娴佸紡涓?'].filter(Boolean).join(' / ');
    return;
  }

  renderRunMetaBase(runLike);
};

buildChatMessages = function buildChatMessagesStreamingOverride() {
  const messages = [];
  const prompt = elements.promptInput.value.trim();
  const latestTurn = state.activeSession?.latestTurn;
  const userPrompt = latestPromptChunk(latestTurn?.prompt || prompt);

  if (userPrompt) {
    messages.push({
      kind: 'user',
      text: sanitizeVisibleOutput(localizeDynamicText(userPrompt)),
      meta: state.activeSession?.id ? shortSessionId(state.activeSession.id) : '',
    });
  }

  const assistantText = extractDisplayOutput(
    state.stream?.output ||
      state.activeRun?.finalOutput ||
      latestTurn?.resultText ||
      latestTurn?.specText ||
      latestTurn?.resultPreview ||
      latestTurn?.specPreview ||
      '',
  );

  if (assistantText || state.stream?.active) {
    messages.push({
      kind: 'assistant',
      text: assistantText || '姝ｅ湪鐢熸垚鏈€缁堢粨鏋?..',
      meta: state.stream?.active ? '娴佸紡杈撳嚭' : '鏈€缁堢粨鏋?',
    });
  }

  return messages;
};

renderFinalOutput = function renderFinalOutputStreamingOverride(textValue) {
  const liveText = state.stream?.active
    ? `${state.stream.output || ''}${state.stream.pending || ''}`
    : state.stream?.output;
  const fallback = state.stream?.active ? '姝ｅ湪鐢熸垚鏈€缁堢粨鏋?..' : '绛夊緟缁撴灉';
  const source = liveText || textValue;
  const normalizedSource = stripCenterStatusNoise(sanitizeVisibleOutput(localizeDynamicText(source))).trim();
  const hasVisibleStageProcess = /銆愰樁娈电粨鏋?u.test(source || '');
  const content =
    state.stream?.active || hasVisibleStageProcess
      ? normalizedSource || fallback
      : extractResultPanelOutput(source) || fallback;
  elements.finalOutput.textContent = content;
  markStreamRender(content, source);
  syncResultPanelState(content, [fallback]);
  if (state.stream?.active) {
    stickFinalOutputToBottom();
  }
  elements.copyOutputButton.disabled = !text(content).trim() || content === fallback;
};

function stripTechnicalCompletionMarkers(value) {
  return text(value).replaceAll(TECHNICAL_COMPLETE_MARKER, '').trim();
}

function looksLikeTerminalCompletion(value) {
  const content = stripTechnicalCompletionMarkers(value);
  if (!content) return false;
  const tail = content.slice(-120);
  if (text(value).includes(TECHNICAL_COMPLETE_MARKER)) return true;
  return /(?:鍏ㄦ枃瀹寍鍏ㄤ功瀹寍瀹岀粨|宸插畬鎴恷浠诲姟瀹屾垚|澶勭悊瀹屾垚|鎵ц瀹屾瘯|杈撳嚭瀹屾瘯|END|DONE|THE END)\s*[锛?\]]*$/iu.test(tail);
}

function buildStoppedRun(reasonLabel = '') {
  const partialOutput = stripTechnicalCompletionMarkers(
    flushRemainingStreamOutput() || extractResultPanelOutput(elements.finalOutput?.textContent || ''),
  );
  return {
    id: `local-stop-${Date.now()}`,
    prompt: activePromptText(),
    mode: currentMode(),
    finalOutput: partialOutput,
    warnings: reasonLabel ? [reasonLabel] : [],
    session: state.activeSession || null,
  };
}

function requestStopActiveRun(reason = 'manual-stop') {
  state.streamStopReason = reason;
  const controller = state.streamController;
  if (controller && !controller.signal.aborted) {
    controller.abort(reason);
  }
}

function appendStreamOutput(delta) {
  if (!state.stream) return '';

  const nextDelta = text(delta);
  if (!nextDelta) {
    return state.stream.output || '';
  }

  state.stream.output = `${state.stream.output || ''}${nextDelta}`;
  state.stream.pending = '';
  renderFinalOutput(stripTechnicalCompletionMarkers(state.stream.output));
  renderChatStream();
  if (looksLikeTerminalCompletion(state.stream.output || '')) {
    pushStreamDebug('auto-stop', 'detected completion marker');
    requestStopActiveRun('auto-complete');
  }
  return state.stream.output || '';
}

function scheduleStreamTyping() {
  if (!state.stream) return;
  state.stream.typing = false;
  if (state.stream.typeTimer) {
    clearTimeout(state.stream.typeTimer);
    state.stream.typeTimer = 0;
  }
  appendStreamOutput(state.stream.pending || '');
}

function flushRemainingStreamOutput() {
  if (!state.stream) return '';

  if (state.stream.typeTimer) {
    clearTimeout(state.stream.typeTimer);
  }

  const pending = text(state.stream.pending);
  if (pending) {
    appendStreamOutput(pending);
  }

  state.stream.typing = false;
  state.stream.typeTimer = 0;
  return state.stream.output || '';
}

function parseSseEventChunk(chunk, onEvent) {
  const lines = chunk.split(/\r?\n/gu);
  let eventName = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) return;
  const payload = JSON.parse(dataLines.join('\n'));
  onEvent(eventName, payload);
}

async function consumeEventStream(response, onEvent) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('褰撳墠娴忚鍣ㄤ笉鏀寔娴佸紡璇诲彇銆?');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      parseSseEventChunk(chunk, onEvent);
      boundary = buffer.indexOf('\n\n');
    }

    if (done) break;
  }

  if (buffer.trim()) {
    parseSseEventChunk(buffer, onEvent);
  }
}

function applyStreamPlan(plan) {
  state.stream = state.stream || {};
  state.stream.plan = plan;
  state.preview = {
    prompt: plan.prompt,
    mode: plan.mode,
    domain: plan.domain,
    routing: plan.routing,
    fusion: plan.fusion,
    workflow: plan.workflow,
    drafts: plan.drafts,
    agentRuntime: plan.agentRuntime,
    portableHarness: plan.portableHarness,
    skillAudit: plan.skillAudit,
    skillMatches: plan.skillMatches || [],
    specPack: plan.specPack || null,
  };
  state.fusionAnalysis = plan.fusion || state.fusionAnalysis;
  renderRunMeta(null);
  renderSurfaceChrome();
}

async function testRuntimeConnection() {
  try {
    saveStoredConfig();
    setInlineStatus(elements.testLlmResult, '姝ｅ湪鍙戦€佲€滀綘濂解€濇祴璇曞綋鍓嶆帴鍙?..', 'neutral');
    const result = await fetchJson('/api/llm/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ runtimeConfig: collectRuntimeConfig() }),
    });

    const reply = compactText(result.response || result.preview || '宸叉敹鍒拌繑鍥烇紝浣嗘病鏈夊彲鏄剧ず鍐呭銆?', 160);
    setInlineStatus(
      elements.testLlmResult,
      result.ok ? `宸叉敹鍒拌繑鍥烇細${reply}` : `杩炴帴澶辫触锛?{reply}`,
      result.ok ? 'success' : 'danger',
    );
  } catch (error) {
    setInlineStatus(elements.testLlmResult, error.message || '娴嬭瘯鎺ュ彛澶辫触', 'danger');
  }
}

submitRun = async function submitRunStreamingOverride() {
  if (__AGENT_STUDIO_FILE_MODE__) {
    try {
      setBusy(true);
      state.stream = null;
      state.streamController = null;
      state.streamStopReason = '';
      const result = await fetchJson('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(buildPayload()),
      });
      applyRunToSurface(result);
      await refreshSessionList();
    } catch (error) {
      renderFinalOutput(error.message || '绂荤嚎杩愯澶辫触');
    } finally {
      setBusy(false);
      renderSurfaceChrome();
    }
    return;
  }

  try {
    setBusy(true);
    resetStreamDebug('start stream run');
    state.streamStopReason = '';
    state.streamController = new AbortController();
    state.stream = {
      active: true,
      output: '',
      pending: '',
      typing: false,
      typeTimer: 0,
      status: '姝ｅ湪鍑嗗娴佸紡鎵ц...',
      plan: null,
    };
    state.activeRun = null;
    state.preview = null;
    renderRunMeta(null);
    renderFinalOutput(state.stream.output || '');
    renderSurfaceChrome();

    const response = await fetch('/api/run-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(buildPayload()),
      signal: state.streamController.signal,
    });
    pushStreamDebug('fetch', `${response.status} ${response.ok ? 'ok' : 'fail'}`);

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      pushStreamDebug('fetch-error', errorText || String(response.status));
      throw new Error(errorText || `娴佸紡璇锋眰澶辫触锛?{response.status}`);
    }

    await consumeEventStream(response, (eventName, payload) => {
      if (eventName === 'status' || eventName === 'pulse') {
        state.stream = state.stream || {};
        state.stream.active = true;
        state.stream.status = payload.message || '浠诲姟鎵ц涓?';
        pushStreamDebug(eventName, state.stream.status || '');
        renderRunMeta(null);
        renderSurfaceChrome();
        return;
      }

      if (eventName === 'plan') {
        pushStreamDebug('plan', `workflow ${(payload?.workflow || []).length || 0}`);
        return;
      }

      if (eventName === 'delta') {
        state.stream = state.stream || {};
        state.stream.active = true;
        pushStreamDebug('delta', `chars ${text(payload.delta || '').length} | ${compactText(payload.delta || '', 48)}`);
        appendStreamOutput(payload.delta || '');
        return;
      }

      if (eventName === 'done') {
        const run = payload.run || null;
        const streamedOutput = flushRemainingStreamOutput();
        pushStreamDebug('done', `stream ${text(streamedOutput).length} | final ${text(run?.finalOutput || '').length}`);
        state.stream = null;
        if (run) {
          const serverFinalOutput = text(run.finalOutput || '').trim();
          const preferredOutput = choosePreferredVisibleOutput(streamedOutput, serverFinalOutput);
          if (preferredOutput) {
            run.finalOutput = preferredOutput;
          } else if (String(streamedOutput || '').trim() && !serverFinalOutput) {
            run.finalOutput = streamedOutput.trim();
          } else if (!serverFinalOutput) {
            run.finalOutput = streamedOutput;
          }
          applyRunToSurface(run);
        }
        return;
      }

      if (eventName === 'error') {
        pushStreamDebug('error', payload.error || 'stream error');
        throw new Error(payload.error || '娴佸紡鎵ц澶辫触');
      }
    });
  } catch (error) {
    const stopReason = state.streamStopReason;
    const aborted = error?.name === 'AbortError' || /aborted|abort/iu.test(text(error?.message || ''));
    if (aborted && stopReason) {
      const reasonLabel =
        stopReason === 'auto-complete' ? '妫€娴嬪埌瀹屾垚鏍囧織锛屽凡鑷姩鍋滄绛夊緟銆?' : '浠诲姟宸叉墜鍔ㄥ仠姝€?';
      pushStreamDebug('abort', reasonLabel);
      state.stream = null;
      applyRunToSurface(buildStoppedRun(reasonLabel));
    } else {
      const partialOutput = flushRemainingStreamOutput() || extractResultPanelOutput(elements.finalOutput?.textContent || '');
      state.stream = null;
      pushStreamDebug('catch', error.message || 'unknown error');
      renderFinalOutput([partialOutput, error.message].filter(Boolean).join('\n\n'));
    }
  } finally {
    state.streamController = null;
    state.streamStopReason = '';
    setBusy(false);
    pushStreamDebug('finally', 'renderSurfaceChrome');
    renderSurfaceChrome();
  }
};

function attachKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editable =
      target?.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');

    if (event.key === '/' && !editable && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      elements.chatInput.focus();
      elements.chatInput.select();
      return;
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (!state.isRunning) {
        if (target === elements.chatInput) {
          appendChatToPrompt(true);
        } else {
          submitRun();
        }
      }
    }
  });
}

async function boot() {
  const storedConfig = loadStoredConfig();
  const storedSessionId = loadStoredSessionId();
  const storedLayout = loadStoredLayout();
  const storedAgentFilter = loadStoredAgentFilter();
  const [configPayload, sessionsPayload] = await Promise.all([
    fetchJson('/api/config'),
    fetchJson('/api/sessions'),
  ]);

  state.config = configPayload;
  state.sessions = sessionsPayload.sessions || [];
  state.agentFilter = storedAgentFilter;
  state.ui.leftCollapsed = Boolean(storedLayout.leftCollapsed);
  state.ui.rightCollapsed = Boolean(storedLayout.rightCollapsed);
  state.ui.zen = Boolean(storedLayout.zen);

  renderDomainOptions();
  elements.baseUrlInput.value = storedConfig.baseUrl || state.config.runtime.llm.baseUrl || '';
  elements.modelInput.value = storedConfig.model || state.config.runtime.llm.model || '';
  elements.apiStyleInput.value = storedConfig.apiStyle || state.config.runtime.llm.apiStyle || 'responses';
  elements.temperatureInput.value = String(
    storedConfig.temperature ?? state.config.runtime.llm.temperature ?? 0.4,
  );
  elements.apiKeyInput.value = storedConfig.apiKey || '';

  renderRuntimeStatus();
  renderRecentRuns();
  applyLayoutState();
  await loadCatalog(currentDomain(), { preserveSelection: false });
  applySession(null);
  renderSurfaceChrome();

  if (storedSessionId) {
    await hydrateSession(storedSessionId);
  }
}

elements.promptInput.addEventListener('input', () => {
  state.activeRun = null;
  state.preview = null;
  state.workbenchView = 'task';
  syncPromptMeta();
  scheduleFusionRefresh();
  renderSurfaceChrome();
});

elements.domainSelect.addEventListener('change', async () => {
  state.activeRun = null;
  state.preview = null;
  state.workbenchView = 'task';
  await loadCatalog(currentDomain(), { preserveSelection: false });
  renderRecentRuns();
});

elements.agentSearchInput.addEventListener('input', () => {
  state.agentQuery = elements.agentSearchInput.value.trim();
  renderAgentDeck();
});

elements.sessionIdInput.addEventListener('change', () => {
  state.currentSessionId = elements.sessionIdInput.value.trim();
  if (!state.currentSessionId) {
    state.activeSession = null;
  }
  renderSurfaceChrome();
});

for (const element of [
  elements.baseUrlInput,
  elements.modelInput,
  elements.apiStyleInput,
  elements.temperatureInput,
  elements.apiKeyInput,
]) {
  element.addEventListener('change', () => {
    saveStoredConfig();
    renderRuntimeStatus();
  });
}

if (elements.saveRuntimeButton) {
  elements.saveRuntimeButton.addEventListener('click', () => {
    saveStoredConfig();
    renderRuntimeStatus();
    setInlineStatus(elements.testLlmResult, '褰撳墠杩炴帴璁剧疆宸蹭繚瀛樺埌鏈湴銆?', 'success');
  });
}

if (elements.testLlmButton) {
  elements.testLlmButton.addEventListener('click', testRuntimeConnection);
}

if (elements.visibleAgentSearchInput) {
  elements.visibleAgentSearchInput.addEventListener('input', () => {
    state.agentQuery = elements.visibleAgentSearchInput.value.trim();
    if (elements.agentSearchInput) {
      elements.agentSearchInput.value = state.agentQuery;
    }
    renderAgentDeck();
  });
}

elements.specButton.addEventListener('click', submitSpecOnly);
elements.runButton.addEventListener('click', submitRun);
elements.copyOutputButton.addEventListener('click', copyOutput);
elements.copySessionButton.addEventListener('click', copySessionId);
elements.loadSessionButton.addEventListener('click', () => hydrateSession(elements.sessionIdInput.value.trim()));
elements.newSessionButton.addEventListener('click', startNewSession);
elements.chatSendButton.addEventListener('click', () => appendChatToPrompt(false));
elements.chatRunButton.addEventListener('click', () => appendChatToPrompt(true));
if (elements.stopRunButton) {
  elements.stopRunButton.addEventListener('click', () => requestStopActiveRun('manual-stop'));
}
elements.chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (!state.isRunning) {
      appendChatToPrompt(true);
    }
  }
});

for (const button of elements.workbenchTabs?.querySelectorAll('[data-workbench-view]') || []) {
  button.addEventListener('click', () => {
    setWorkbenchView(button.dataset.workbenchView);
  });
}

if (elements.toggleLeftRailButton) {
  elements.toggleLeftRailButton.addEventListener('click', () => {
    state.ui.zen = false;
    state.ui.leftCollapsed = !state.ui.leftCollapsed;
    applyLayoutState();
  });
}

if (elements.toggleRightRailButton) {
  elements.toggleRightRailButton.addEventListener('click', () => {
    state.ui.zen = false;
    state.ui.rightCollapsed = !state.ui.rightCollapsed;
    applyLayoutState();
  });
}

if (elements.toggleZenButton) {
  elements.toggleZenButton.addEventListener('click', () => {
    state.ui.zen = !state.ui.zen;
    applyLayoutState();
  });
}

attachKeyboardShortcuts();

boot().catch((error) => {
  renderFinalOutput(error.message);
});
}
