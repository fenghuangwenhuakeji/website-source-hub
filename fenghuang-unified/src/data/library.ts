export interface LibraryChapter {
  id: string;
  title: string;
  summary: string;
  excerpt: string;
  wordCount: number;
}

export interface LibraryVolume {
  id: string;
  title: string;
  summary: string;
  chapters: LibraryChapter[];
}

export interface LibraryMaterial {
  title: string;
  type: string;
  summary: string;
  tags: string[];
}

export interface LibraryNovel {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: string;
  description: string;
  synopsis: string;
  worldview: string;
  outline: string;
  wordCount: number;
  viewCount: number;
  likeCount: number;
  coverLabel: string;
  tags: string[];
  volumes: LibraryVolume[];
  materials: LibraryMaterial[];
}

export const featuredNovels: LibraryNovel[] = [
  {
    id: 'novel-starlight',
    title: '星火长夜',
    author: '凤煌签约作者组',
    genre: '高概念科幻',
    status: '连载中',
    description: '濒临熄灭的人造恒星前，三名被放逐的工程师必须在七十二小时内修补一座文明。',
    synopsis:
      '主角林澈在失去主城权限后被迫加入边境修复队，却发现所谓的恒星事故其实是一场大规模记忆迁移实验。作品兼顾硬核设定与人物抉择，适合喜欢高压节奏和系统规则的读者。',
    worldview:
      '人造恒星“晨星”不仅提供能源，还承担整座城的记忆同步功能。只要恒星开始熄灭，城市里关于过去的共识也会同时崩塌。',
    outline:
      '第一卷 晨星港：主角发现事故并非意外\n第二卷 第七环：修复队深入废弃能源层\n第三卷 熄光审判：文明是否值得被保存',
    wordCount: 382000,
    viewCount: 98124,
    likeCount: 14520,
    coverLabel: '高概念科幻',
    tags: ['高概念科幻', '记忆迁移', '文明危机'],
    volumes: [
      {
        id: 'novel-starlight-v1',
        title: '第一卷 晨星港',
        summary: '建立晨星事故、边境修复队和主角的失权困境。',
        chapters: [
          {
            id: 'novel-starlight-1',
            title: '第1章 失效的晨星港',
            summary: '主角第一次看到人造恒星光谱偏移，意识到事故规模远超通报内容。',
            excerpt:
              '晨星港的玻璃穹顶仍在发光，像一枚被按住呼吸的心脏。林澈知道真正危险的不是爆炸，而是恒星开始沉默。',
            wordCount: 6200,
          },
          {
            id: 'novel-starlight-2',
            title: '第2章 被删掉的权限记录',
            summary: '后台权限树显示一名不存在的管理员提前篡改了修复流程。',
            excerpt:
              '所有通往真相的节点都亮着，却没有一条路属于他。有人在事故发生前就设计好了坠落轨迹。',
            wordCount: 7100,
          },
        ],
      },
      {
        id: 'novel-starlight-v2',
        title: '第二卷 第七环',
        summary: '主角深入能源层，发现上代工程师留下的隐秘日志。',
        chapters: [
          {
            id: 'novel-starlight-3',
            title: '第3章 第七环的回声',
            summary: '修复队在废弃能源环听见上一代工程师的录音。',
            excerpt:
              '耳机里传来的不是求救，而是一段提前写好的告别。对方像是早就知道，会有人在最危险的时刻重新听见它。',
            wordCount: 6800,
          },
        ],
      },
    ],
    materials: [
      {
        title: '晨星能源环',
        type: '世界规则',
        summary: '恒星既是能源系统，也是记忆同步系统，熄灭会带来认知失序。',
        tags: ['规则世界观', '高概念'],
      },
      {
        title: '林澈',
        type: '角色卡',
        summary: '技术冷静，但对“被抹除的个体记忆”有强烈执念。',
        tags: ['主角弧光', '人物抉择'],
      },
    ],
  },
  {
    id: 'novel-mirror-city',
    title: '镜城审判',
    author: '凤煌悬疑工坊',
    genre: '都市悬疑',
    status: '完结',
    description: '一座没有监控死角的城市里，却接连发生三起无法被任何镜头记录的命案。',
    synopsis:
      '调查顾问顾晚舟受邀进入镜城，在几乎完美的监控网络中追索真凶。故事不断追问：当每个角落都被记录，真正被删除的究竟是证据，还是一个人存在过的痕迹？',
    worldview:
      '镜城把监控系统视为城市正义的外骨骼。所有案件都以“录像为王”为原则推进，因此一旦录像消失，整个秩序就会本能地保护系统而不是追索真相。',
    outline:
      '第一卷 雨夜盲区：第一起命案与监控异象\n第二卷 证词拼图：证人叙述开始彼此矛盾\n第三卷 镜面之下：城市选择维护秩序还是承认真相',
    wordCount: 246000,
    viewCount: 72103,
    likeCount: 10188,
    coverLabel: '都市悬疑',
    tags: ['都市悬疑', '监控社会', '证词谜局'],
    volumes: [
      {
        id: 'novel-mirror-city-v1',
        title: '第一卷 雨夜盲区',
        summary: '从第一起命案切入，建立镜城规则。',
        chapters: [
          {
            id: 'novel-mirror-city-1',
            title: '第1章 雨夜的盲区',
            summary: '商业区广场出现无影命案，所有镜头只拍到一场空雨。',
            excerpt:
              '屏幕一格格切换，暴雨打亮整座广场，却没有任何一台镜头拍到死者倒下的瞬间。仿佛凶手不是躲开了监控，而是从系统外走进来。',
            wordCount: 5400,
          },
        ],
      },
      {
        id: 'novel-mirror-city-v2',
        title: '第二卷 证词拼图',
        summary: '证词互相打架，真相开始碎裂。',
        chapters: [
          {
            id: 'novel-mirror-city-2',
            title: '第2章 会说谎的证词',
            summary: '三位证人描述同一场景，却拼出三种相互矛盾的真相。',
            excerpt:
              '真正可怕的不是谎言，而是它总能借用别人记忆里的碎片，伪装成一段更完整的真实。',
            wordCount: 6100,
          },
        ],
      },
    ],
    materials: [
      {
        title: '镜城监控系统',
        type: '世界规则',
        summary: '系统几乎无死角，但过度依赖录像导致执法僵化。',
        tags: ['监控设定', '悬疑线'],
      },
      {
        title: '顾晚舟',
        type: '角色卡',
        summary: '擅长从“被默认正确”的东西里找漏洞。',
        tags: ['主角', '侦探视角'],
      },
    ],
  },
  {
    id: 'novel-red-dust',
    title: '长风入红尘',
    author: '凤煌女频编辑部',
    genre: '都市情感',
    status: '连载中',
    description: '失意编剧与天才投资人从合作交易开始，在彼此的伤口里慢慢学会重新相信。',
    synopsis:
      '沈枝意失去作品署名后陷入停笔，顾沉舟带着新文娱项目向她递来合作邀约。两人从互相试探到并肩作战，事业线与情感线并进，更适合站内展示“角色关系 + 成长弧”的连载样例。',
    worldview:
      '故事发生在竞争极强的内容行业。项目、署名、资本和创作自由彼此拉扯，所有关系都不只是感情，也关乎职业尊严和表达权。',
    outline:
      '第一卷 失约的签名会：女主跌入谷底\n第二卷 不合时宜的投资人：合作关系建立\n第三卷 风起时：事业与感情同时进入拐点',
    wordCount: 198000,
    viewCount: 56421,
    likeCount: 8921,
    coverLabel: '都市情感',
    tags: ['都市情感', '职场博弈', '双强关系'],
    volumes: [
      {
        id: 'novel-red-dust-v1',
        title: '第一卷 失约的签名会',
        summary: '从事业崩塌的瞬间进入故事。',
        chapters: [
          {
            id: 'novel-red-dust-1',
            title: '第1章 失约的签名会',
            summary: '签名会刚结束，女主就收到项目下架通知。',
            excerpt:
              '台前的尖叫和灯光还没停，后台的消息已经像一把钝刀剖开了她的呼吸。有人在庆功，也有人被悄悄从名单上抹掉。',
            wordCount: 4300,
          },
        ],
      },
      {
        id: 'novel-red-dust-v2',
        title: '第二卷 不合时宜的投资人',
        summary: '男女主从互相试探走向正式合作。',
        chapters: [
          {
            id: 'novel-red-dust-2',
            title: '第2章 不合时宜的投资人',
            summary: '男主在她最狼狈的时候递来合作邀约。',
            excerpt:
              '他像是提前排练过每一句开场白，却偏偏在她最不想被看见的时候出现。那份安静，比任何安慰都更危险。',
            wordCount: 4700,
          },
        ],
      },
    ],
    materials: [
      {
        title: '沈枝意',
        type: '角色卡',
        summary: '表面倔强，真正害怕的是作品再次被拿走。',
        tags: ['女主弧光', '情感成长'],
      },
      {
        title: '行业生态',
        type: '世界规则',
        summary: '内容行业里署名、资本和项目节点如何互相制约。',
        tags: ['职场设定', '都市现实'],
      },
    ],
  },
];

export const featuredGenres = ['全部', '高概念科幻', '都市悬疑', '都市情感'];

export function getFeaturedNovelById(id: string) {
  return featuredNovels.find((novel) => novel.id === id) ?? null;
}
