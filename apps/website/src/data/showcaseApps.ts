import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

export interface ShowcaseApp {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  features: string[];
  pageUrl: string;
  featured?: boolean;
  featuredReason?: string;
}

const desktopLoginUrl = resolveDesktopLoginUrl();

export const showcaseApps: ShowcaseApp[] = [
  {
    id: 'edit-code-legacy',
    title: 'Edit Code · 凤凰早期合集',
    description:
      '凤凰体系最早被记住的一套桌面作品，把代码编辑、桌面质感和产品审美第一次真正做成了可以被展示的成品。',
    category: '头牌代表作',
    status: 'No.01',
    features: ['代码编辑', '桌面应用', '凤凰早期合集'],
    pageUrl: desktopLoginUrl,
    featured: true,
    featuredReason:
      '如果只能先看一个应用，就先看它。它代表了凤凰体系最早期、也最鲜明的一次产品表达。',
  },
  {
    id: 'fenghuang-suite',
    title: '凤煌创世合集',
    description:
      '超无穹桌面系的重要合集产品，承接桌面端的完整登录、导入和更深度的本地工作流，是官方唯一桌面入口的代表形态。',
    category: '桌面旗舰',
    status: '桌面入口',
    features: ['桌面客户端', '本地联动', '完整工作流'],
    pageUrl: desktopLoginUrl,
    featured: true,
    featuredReason:
      '它不是网页壳，而是真正承载深度工作流的桌面产品，适合放在展示序列的核心位置。',
  },
  {
    id: 'medium-short-studio',
    title: '中短篇创作',
    description:
      '从旧版写作中心重构而来，强调组件化、清晰结构和多端切换，是写作能力产品化之后更成熟的一次呈现。',
    category: '创作工作台',
    status: '写作系统',
    features: ['中短篇写作', '组件化架构', '多端适配'],
    pageUrl: '/novels',
    featured: true,
    featuredReason:
      '这套产品把写作中心真正做成了工作台，既能写，也能管，也能沉淀内容资产。',
  },
  {
    id: 'short-story-lab',
    title: '短篇拆书版',
    description:
      '面向短篇结构观察、节奏拆解和创作训练的独立产品，把内容分析和写作训练拆成了更明确的一条线。',
    category: '创作工作台',
    status: '结构训练',
    features: ['短篇拆解', '结构分析', '创作训练'],
    pageUrl: '/novels',
    featured: true,
    featuredReason:
      '它更像一台内容分析机器，能把阅读、拆解和创作训练合并到同一个产品逻辑里。',
  },
  {
    id: 'novel-workshop',
    title: '小说助手',
    description:
      '官网在线小说工坊，承接长篇内容、章节管理和作品沉淀，让创作可以直接在站内持续发生。',
    category: '官网工坊',
    status: '站内可用',
    features: ['长篇写作', '章节管理', '站内沉淀'],
    pageUrl: '/novels',
    featured: true,
    featuredReason:
      '这是官网最清晰的在线创作入口之一，适合把长期写作能力直观展示给外部访客。',
  },
  {
    id: 'script-workshop',
    title: '剧本工坊',
    description:
      '剧本、漫剧表达、分镜和视频化思路在这里被放进同一条创作链路，是内容工业化的一段关键能力。',
    category: '官网工坊',
    status: '站内可用',
    features: ['漫剧剧本', '分镜制作', '视频化表达'],
    pageUrl: '/writing?type=script',
    featured: true,
    featuredReason:
      '它把小说之后的视觉表达继续往前推了一步，让内容从文字自然走向镜头语言。',
  },
];
