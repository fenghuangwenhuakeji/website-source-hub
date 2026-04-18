import type { WritingProject } from '../types/writing';

export const seedWritingProjects: WritingProject[] = [
  {
    id: 'draft-ashes-tide',
    type: 'novel',
    title: '灰烬潮汐',
    genre: '都市悬疑',
    premise: '一名档案修复师在雾港接手旧案时，发现自己的失踪姐姐留下了一套会自动改写的航海日志。',
    summary: '偏悬疑的长篇连载，主打雾港调查、家族秘密与记忆失真。',
    description:
      '故事从一份会自行补全文字的航海日志开始。主角林昼被迫重回废弃港区，在旧同伴与新势力之间穿梭调查，逐步确认这座城市把某段历史沉到了海面以下。',
    worldview:
      '雾港依靠潮汐钟塔维持秩序，所有远航记录都会进入“回声档案局”统一存档。传言只要有人改动档案，城市里相应的记忆也会被迫重排，因此档案修复师既是文员，也是某种意义上的现实补丁工。',
    outline:
      '第一卷 雾港来信：主角收到姐姐遗留日志并回到港区\n- 第1章 夜班记录员\n- 第2章 无主档案箱\n- 第3章 会改写的海图\n第二卷 潮汐议会：调查从私案上升为公开对抗\n- 第4章 议会旁听席\n- 第5章 失真证词',
    coverImage: '',
    tags: ['雾港谜案', '都市悬疑', '规则世界观', '成长弧光'],
    status: 'drafting',
    createdAt: new Date('2026-04-06T08:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-09T18:20:00.000Z').toISOString(),
    volumes: [
      {
        id: 'draft-ashes-tide-v1',
        title: '第一卷 雾港来信',
        summary: '建立旧案、姐妹关系和档案异变的规则。',
        order: 1,
        chapters: [
          {
            id: 'draft-ashes-tide-c1',
            title: '第1章 夜班记录员',
            summary: '林昼第一次回到港区档案库，值夜时发现海图会自动补写漏掉的航线。',
            content:
              '凌晨两点，潮汐钟塔刚刚敲完第二声。林昼把最后一卷潮汐日志放回冷柜时，玻璃门内侧忽然浮出一行她根本没有修复过的新字：不要再往南堤走。那字迹和姐姐当年写给她的便签一模一样，甚至连句尾那一笔停顿都没有改。',
            order: 1,
            createdAt: new Date('2026-04-06T08:10:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-09T18:20:00.000Z').toISOString(),
          },
          {
            id: 'draft-ashes-tide-c2',
            title: '第2章 无主档案箱',
            summary: '她在仓库深处找到一只没有入库记录的铁箱，里面躺着被人剪碎又重新缝合的旧海图。',
            content:
              '铁箱没有编号，锁扣却是新的。有人刚刚动过这里，却又不敢把东西带走。林昼拎着手电蹲下时，突然意识到地面并不是被海水打湿，而是被某种墨迹沿着箱底缓慢晕开，像档案里藏着一片没被写完的海。',
            order: 2,
            createdAt: new Date('2026-04-07T11:00:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-08T09:30:00.000Z').toISOString(),
          },
          {
            id: 'draft-ashes-tide-c3',
            title: '第3章 会改写的海图',
            summary: '主角决定把海图带回家，结果地图上的航线随她的推理不断变化。',
            content:
              '海图像一张活着的脸。她每写下一种猜想，边缘就会多出一截细小的航迹。那不是答案，而是有人故意让她一步步靠近某个地点的方式。',
            order: 3,
            createdAt: new Date('2026-04-07T13:00:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-09T13:00:00.000Z').toISOString(),
          },
        ],
      },
      {
        id: 'draft-ashes-tide-v2',
        title: '第二卷 潮汐议会',
        summary: '调查进入公开层面，主角第一次和港区权力结构正面碰撞。',
        order: 2,
        chapters: [
          {
            id: 'draft-ashes-tide-c4',
            title: '第4章 议会旁听席',
            summary: '林昼带着残缺证据进入议会，发现证词被提前改写。',
            content:
              '所有人的发言都对得上流程，却没有一句能还原当天的真相。林昼第一次意识到，这座城市最大的谎言不是有人在说假话，而是每个人都只能说到自己被允许记住的位置。',
            order: 1,
            createdAt: new Date('2026-04-08T10:00:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-09T17:40:00.000Z').toISOString(),
          },
          {
            id: 'draft-ashes-tide-c5',
            title: '第5章 失真证词',
            summary: '姐姐旧同伴现身，交给她一段只能听一次的录音。',
            content: '',
            order: 2,
            createdAt: new Date('2026-04-08T12:00:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-08T12:00:00.000Z').toISOString(),
          },
        ],
      },
    ],
    materials: [
      {
        id: 'draft-ashes-tide-m1',
        title: '林昼',
        type: 'character',
        summary: '表面冷静克制，遇到姐姐相关线索时会明显失去节奏感。',
        content: '关键词：档案修复师、强迫性细节控、害怕再次失去亲人。',
        tags: ['主角弧光', '成长线'],
        createdAt: new Date('2026-04-06T08:05:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-09T12:00:00.000Z').toISOString(),
      },
      {
        id: 'draft-ashes-tide-m2',
        title: '雾港南堤',
        type: 'location',
        summary: '海雾最重的港区，也是旧案的时间裂口。',
        content: '视觉关键词：铁锈、盐雾、冷白灯、潮水反光。',
        tags: ['场景氛围', '港区'],
        createdAt: new Date('2026-04-06T08:06:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-08T18:30:00.000Z').toISOString(),
      },
      {
        id: 'draft-ashes-tide-m3',
        title: '潮汐档案规则',
        type: 'world',
        summary: '改动入档文本会导致关联记忆发生偏移，但越关键的记忆代价越高。',
        content: '可作为高潮代价：主角如果改动姐姐留下的关键记录，可能会失去共同回忆。',
        tags: ['规则世界观', '代价机制'],
        createdAt: new Date('2026-04-06T08:07:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-09T09:00:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'draft-rain-city',
    type: 'script',
    title: '雨城庭审',
    genre: '都市悬疑短剧',
    premise: '一场看似注定败诉的庭审中，年轻律师发现关键证人正在被系统化“改写”证词。',
    summary: '适合 12 集短剧的剧本母本，重点练习幕结构、场景冲突和对白推进。',
    description:
      '项目采用“三幕推进 + 集末钩子”的方式搭建。每个场景都需要明确人物目标、阻力与反转，让观众在有限时长里持续追进。',
    worldview:
      '故事发生在一座以“高效司法”为荣的超级城市，数据平台能够调取所有证言备份，但也正因为过度依赖平台，任何对数据的篡改都能悄悄改变案件走向。',
    outline:
      '第一幕 雨夜开庭：律师接手难案\n- 场景1 法庭外雨棚\n- 场景2 被告临时翻供\n第二幕 证词崩塌：关键证人集体失真\n- 场景3 后台调阅失败\n- 场景4 地铁口追逐',
    coverImage: '',
    tags: ['短剧', '法庭', '对白', '悬疑'],
    status: 'planning',
    createdAt: new Date('2026-04-05T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-09T14:00:00.000Z').toISOString(),
    volumes: [
      {
        id: 'draft-rain-city-v1',
        title: '第一幕 雨夜开庭',
        summary: '主角被迫站上法庭，先建立局势与失败感。',
        order: 1,
        chapters: [
          {
            id: 'draft-rain-city-c1',
            title: '场景 1 法庭外雨棚',
            summary: '用一场压抑对白建立被告与律师的互不信任。',
            content:
              '雨棚下，周岚一句句盘问陈屿昨晚到底见过谁。陈屿始终避开她的视线，只在法槌敲响前留下一句：“如果我说实话，你连今天这场庭都上不了。”',
            order: 1,
            createdAt: new Date('2026-04-05T10:10:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-08T18:00:00.000Z').toISOString(),
          },
          {
            id: 'draft-rain-city-c2',
            title: '场景 2 被告临时翻供',
            summary: '开庭第一分钟，被告突然否认先前所有供词。',
            content: '',
            order: 2,
            createdAt: new Date('2026-04-05T10:20:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-05T10:20:00.000Z').toISOString(),
          },
        ],
      },
      {
        id: 'draft-rain-city-v2',
        title: '第二幕 证词崩塌',
        summary: '调查扩大，证人和平台一起失去可信度。',
        order: 2,
        chapters: [
          {
            id: 'draft-rain-city-c3',
            title: '场景 3 后台调阅失败',
            summary: '平台日志被二次加密，主角发现有人在实时覆盖证词。',
            content: '',
            order: 1,
            createdAt: new Date('2026-04-05T11:20:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-05T11:20:00.000Z').toISOString(),
          },
        ],
      },
    ],
    materials: [
      {
        id: 'draft-rain-city-m1',
        title: '周岚对白节奏',
        type: 'dialogue',
        summary: '说话短促、反问多，情绪越急越克制。',
        content: '避免长篇自述，让她总是在追问别人交出证据。',
        tags: ['主角', '对白'],
        createdAt: new Date('2026-04-05T10:06:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-05T10:06:00.000Z').toISOString(),
      },
      {
        id: 'draft-rain-city-m2',
        title: '法庭后台',
        type: 'scene',
        summary: '安静、冷白、所有监控角度都略微偏高。',
        content: '适合放置偷听、删改证据、临时博弈。',
        tags: ['场景', '短剧'],
        createdAt: new Date('2026-04-05T10:07:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-05T10:07:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'draft-phoenix-detective',
    type: 'comic',
    title: '凤羽侦探社',
    genre: '都市奇想',
    premise: '能听懂旧物低语的少女在旧城区开了一家侦探社，每一件委托都牵出一段被人故意抹去的城市记忆。',
    summary: '适合条漫连载，强调角色组队、页面节奏和章末翻页钩子。',
    description:
      '项目以条漫节奏组织内容，一话一个事件，一卷推进主线。人物表情、反应镜头和翻页爆点比长段文字更重要，因此素材库会更偏向视觉参考和角色动作。',
    worldview:
      '旧城区的物件会保留短时情绪回响，只要找到合适的“听物者”，就能读出它们见过的场面。能力越强，越容易被城市里负责清洗记忆的人盯上。',
    outline:
      '第一卷 事务所开门：主角组建侦探社\n- 第1话 会说话的旧雨伞\n- 第2话 猫眼巷委托\n第二卷 被删除的游乐园：主线开始浮出',
    coverImage: '',
    tags: ['条漫连载', '都市奇想', '角色群像', '翻页钩子'],
    status: 'serializing',
    createdAt: new Date('2026-04-04T09:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-09T20:30:00.000Z').toISOString(),
    volumes: [
      {
        id: 'draft-phoenix-detective-v1',
        title: '第一卷 事务所开门',
        summary: '轻快建立角色关系与能力规则。',
        order: 1,
        chapters: [
          {
            id: 'draft-phoenix-detective-c1',
            title: '第1话 会说话的旧雨伞',
            summary: '一把丢失的红伞引出事务所第一单。',
            content:
              '开场页建议先用大格展示旧城区黄昏，然后用连续四格切主角听见雨伞低语的过程，最后以“它看到过那条消失的街”作为章末钩子。',
            order: 1,
            createdAt: new Date('2026-04-04T09:20:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-08T20:30:00.000Z').toISOString(),
          },
          {
            id: 'draft-phoenix-detective-c2',
            title: '第2话 猫眼巷委托',
            summary: '新角色登场，侦探社第一次组队行动。',
            content: '',
            order: 2,
            createdAt: new Date('2026-04-05T09:20:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-05T09:20:00.000Z').toISOString(),
          },
        ],
      },
    ],
    materials: [
      {
        id: 'draft-phoenix-detective-m1',
        title: '主角动作关键词',
        type: 'visual',
        summary: '喜欢半弯腰听物件说话，站姿轻，动作快。',
        content: '适合配小格连打和夸张表情反应。',
        tags: ['视觉动作', '角色表现'],
        createdAt: new Date('2026-04-04T09:10:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-04T09:10:00.000Z').toISOString(),
      },
      {
        id: 'draft-phoenix-detective-m2',
        title: '翻页爆点模板',
        type: 'scene',
        summary: '每话尾页留一个物件新线索或旧城区隐藏真相。',
        content: '例如：雨伞柄内部藏着游乐园入场券残角。',
        tags: ['翻页钩子', '节奏设计'],
        createdAt: new Date('2026-04-04T09:12:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-04T09:12:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'draft-burning-city-board',
    type: 'storyboard',
    title: '焚城漫剧分镜',
    genre: '近未来动作漫剧',
    premise: '主角在倒计时 12 小时内闯入旧城区能源塔，需要用高节奏分镜讲清城市失火真相。',
    summary: '适合漫剧、动画预告和动作短片，强调镜头节拍、分镜说明与配乐提示。',
    description:
      '写作对象不再只是正文，而是镜头顺序、画面目的与转场节奏。每个镜头都应该回答“拍什么”“为什么此刻拍”“下一镜如何接”。',
    worldview:
      '城市表层由智能广告屏覆盖，真正的火源藏在地下能源塔。白天所有人都以为火只是事故，只有夜里切断主电路后，地下的旧城区才会显形。',
    outline:
      '单元一 倒计时开场：建立危机与城市空间\n- 镜头1 鸟瞰燃烧城市\n- 镜头2 主角跨过屋顶\n单元二 塔底对峙：节奏加速并揭示真相',
    coverImage: '',
    tags: ['分镜', '动作', '漫剧', '节拍'],
    status: 'planning',
    createdAt: new Date('2026-04-07T08:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-09T22:00:00.000Z').toISOString(),
    volumes: [
      {
        id: 'draft-burning-city-board-v1',
        title: '单元 1 倒计时开场',
        summary: '用镜头层层压缩时间感。',
        order: 1,
        chapters: [
          {
            id: 'draft-burning-city-board-c1',
            title: '镜头 1 鸟瞰燃烧城市',
            summary: '远景交代城市失火全貌，字幕出现“剩余 12 小时”。',
            content:
              '镜头建议：先给高空远景 2 秒，再迅速切入闪烁的倒计时屏。配乐要先空拍一秒，让画面自己承担压迫感。',
            order: 1,
            createdAt: new Date('2026-04-07T08:10:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-09T08:10:00.000Z').toISOString(),
          },
          {
            id: 'draft-burning-city-board-c2',
            title: '镜头 2 主角跨过屋顶',
            summary: '主角从广告屏反光里确认追兵位置。',
            content: '',
            order: 2,
            createdAt: new Date('2026-04-07T08:15:00.000Z').toISOString(),
            updatedAt: new Date('2026-04-07T08:15:00.000Z').toISOString(),
          },
        ],
      },
    ],
    materials: [
      {
        id: 'draft-burning-city-board-m1',
        title: '镜头运动备忘',
        type: 'visual',
        summary: '开场以俯冲推进为主，中段改成横移追拍，高潮使用快速切近景。',
        content: '避免全程都用快切，留出 2 个慢镜头给情绪停顿。',
        tags: ['镜头', '节奏'],
        createdAt: new Date('2026-04-07T08:06:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-09T08:06:00.000Z').toISOString(),
      },
    ],
  },
];
