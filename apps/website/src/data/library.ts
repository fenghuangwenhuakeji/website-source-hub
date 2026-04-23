export interface FeaturedNovel {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  tags: string[];
  status: string;
  wordCount: number;
  synopsis: string;
  worldview: string;
  outline: string;
  volumes: Array<{
    id: string;
    title: string;
    summary: string;
    chapters: Array<{
      id: string;
      title: string;
      summary: string;
      content: string;
    }>;
  }>;
  materials: Array<{
    title: string;
    type: string;
    summary: string;
  }>;
}

export const featuredGenres = ['全部', '科幻', '悬疑', '都市', '历史', '幻想', '现实主义'];

export const featuredNovels: FeaturedNovel[] = [
  {
    id: 'sample-sci-fi',
    title: '深空信标',
    author: '凤煌样例',
    genre: '科幻',
    description: '一艘失踪七十年的深空探测船突然发回信号，地球派出的搜救队发现船上时间只过去了三年。',
    tags: ['硬科幻', '时间膨胀', '太空歌剧'],
    status: '连载中',
    wordCount: 42000,
    synopsis: '失踪七十年的深空探测船"信标七号"突然向地球发回一串加密信号。搜救队抵达后发现，船上船员的时间只流逝了三年，而他们的日志里记录着一种从未被发现的宇宙现象。',
    worldview: '近未来人类已建立太阳系内航行网络，但超光速通信仍是理论。时间膨胀效应是故事的核心科学设定。',
    outline: '第一卷 信号\n- 第1章 七十年后的回声\n- 第2章 搜救任务\n第二卷 信标\n- 第3章 船上三年\n- 第4章 异常现象',
    volumes: [
      {
        id: 'v1',
        title: '第一卷 信号',
        summary: '地球接收到失踪飞船的异常信号，搜救队启程。',
        chapters: [
          { id: 'c1', title: '第1章 七十年后的回声', summary: '天文台接收到一段来自深空的脉冲信号，经比对确认是七十年前失踪的"信标七号"。', content: '信号解码持续了四十七小时...' },
          { id: 'c2', title: '第2章 搜救任务', summary: '联合航天局组建搜救队，登上新一代探测船"启明号"。', content: '任务简报会在凌晨三点召开...' },
        ],
      },
      {
        id: 'v2',
        title: '第二卷 信标',
        summary: '搜救队抵达信标七号，发现时间异常的真相。',
        chapters: [
          { id: 'c3', title: '第3章 船上三年', summary: '信标七号的船员日志显示，他们只经历了三年时光。', content: '船上的日历停在2077年...' },
          { id: 'c4', title: '第4章 异常现象', summary: '科学家在飞船外围发现了一种扭曲空间的未知能量场。', content: '传感器读数超出了所有已知模型的预测范围...' },
        ],
      },
    ],
    materials: [
      { title: '信标七号飞船参数', type: 'reference', summary: '飞船的完整技术规格和航行数据。' },
      { title: '主角档案', type: 'character', summary: '搜救队队长的背景故事和性格特征。' },
    ],
  },
  {
    id: 'sample-mystery',
    title: '雾港档案',
    author: '凤煌样例',
    genre: '悬疑',
    description: '一座常年被海雾笼罩的港口城市，三十年间发生了十七起一模一样的失踪案。',
    tags: ['本格推理', '沿海城市', '连环失踪'],
    status: '已完结',
    wordCount: 28000,
    synopsis: '港口城市雾港三十年间发生了十七起完全相同的失踪案：受害者在雨夜独自离开家门，留下一双整齐摆放在门口的鞋子，从此人间蒸发。',
    worldview: '虚构的沿海城市雾港，以渔业和走私贸易为主要经济来源，城市地形复杂，海雾季长达半年。',
    outline: '第一卷 雨夜\n- 第1章 第十七双鞋\n- 第2章 旧档案室',
    volumes: [
      {
        id: 'v1',
        title: '第一卷 雨夜',
        summary: '新一起失踪案发生，记者开始调查三十年前的旧案。',
        chapters: [
          { id: 'c1', title: '第1章 第十七双鞋', summary: '又一个雨夜，林家小女儿失踪，门口留下整齐摆放的鞋子。', content: '雨是从午夜开始下的...' },
          { id: 'c2', title: '第2章 旧档案室', summary: '记者在市档案馆发现了前三起案件的原始记录。', content: '档案室的灯光昏暗发黄...' },
        ],
      },
    ],
    materials: [
      { title: '雾港地图', type: 'location', summary: '城市主要地点和失踪案发生位置。' },
      { title: '时间线整理', type: 'reference', summary: '十七起失踪案的详细时间线和关联分析。' },
    ],
  },
];

export function getFeaturedNovelById(id: string): FeaturedNovel | undefined {
  return featuredNovels.find((novel) => novel.id === id);
}
