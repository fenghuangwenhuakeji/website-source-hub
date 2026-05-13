import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';

export interface ShowcaseApp {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  features: string[];
  featured: boolean;
  featuredReason: string;
  pageUrl: string;
}

const desktopDownloadUrl = resolveDesktopDownloadUrl();

export const showcaseApps: ShowcaseApp[] = [
  {
    id: 'edit-code',
    title: 'Edit Code · 凤凰早期合集',
    description:
      '从第一个字符开始，将想法编译为可用产品，代码编辑、项目管理、快速原型，一条线完成',
    category: '开发工具',
    status: '已上线',
    features: ['代码高亮', '项目管理', '快速原型'],
    featured: true,
    featuredReason:
      '凤煌最早立住技术根基的工具集，亦是所有产品的起点',
    pageUrl: desktopDownloadUrl,
  },
  {
    id: 'chuangshi',
    title: '凤煌创世合集',
    description:
      '小说、剧本、分镜，三条内容线共用一套创作中台，从一句话梗概到完整作品，皆可承载',
    category: '内容创作',
    status: '持续迭代',
    features: ['小说工坊', '剧本写作', '分镜规划'],
    featured: true,
    featuredReason:
      "品牌主推的创作中枢，最能代表凤煌'工具即内容'的核心能力",
    pageUrl: desktopDownloadUrl,
  },
  {
    id: 'medium-short',
    title: '中短篇创作',
    description:
      '以强钩子和紧凑节奏写中短篇，每一章皆为完读率的赌注',
    category: '小说创作',
    status: '已上线',
    features: ['节奏控制', '完读优化', '一键发布'],
    featured: true,
    featuredReason:
      '凤煌内容矩阵中传播力最强的品类，新读者最先接触我们的入口',
    pageUrl: '/novels',
  },
  {
    id: 'short-deconstruct',
    title: '短篇拆书版',
    description:
      '将经典短篇拆解为结构、节奏与钩子，再以自身方式重写',
    category: '学习工具',
    status: '已上线',
    features: ['结构拆解', '技法标注', '模仿练习'],
    featured: false,
    featuredReason:
      '创作者的训练场，叙事技巧从阅读迁移至写作',
    pageUrl: '/novels',
  },
  {
    id: 'novel-assistant',
    title: '小说展示',
    description:
      '官网用于展示小说题材、样稿、设定和作品资料，不再承担完整在线创作职责',
    category: '官网展示',
    status: '展示中',
    features: ['题材样稿', '作品设定', '小说资料页'],
    featured: false,
    featuredReason:
      '对外展示小说能力与作品气质的入口，真正创作请进入桌面端',
    pageUrl: '/novels',
  },
  {
    id: 'script-workshop',
    title: '剧本展示',
    description:
      '官网用于展示剧本方向、场景结构、对白节奏和镜头表达，不再承担完整在线创作职责',
    category: '官网展示',
    status: '展示中',
    features: ['幕结构', '场景目标', '对白节奏'],
    featured: false,
    featuredReason:
      '对外展示剧本能力与镜头表达的入口，真正创作请进入桌面端',
    pageUrl: '/writing?type=script',
  },
];
