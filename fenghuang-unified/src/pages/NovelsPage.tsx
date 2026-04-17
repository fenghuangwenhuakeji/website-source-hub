import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { featuredGenres, featuredNovels } from '../data/library';
import {
  countProjectChapters,
  countProjectWords,
  getWritingProjects,
} from '../utils/localWriting';

interface NovelCard {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  tags: string[];
  status: string;
  chapterCount: number;
  wordCount: number;
  updatedAt?: string;
  isDraft?: boolean;
}

const NOVEL_EDITOR_URL = '/writing?type=novel&workspace=novel';
type NovelLengthTier = 'short' | 'medium' | 'long';

const NOVEL_TIER_META: Record<
  NovelLengthTier,
  { label: string; badge: string; description: string; hint: string }
> = {
  short: {
    label: '短篇小说',
    badge: '短篇',
    description: '单刀直入，强钩子，适合把一个瞬间写成一记命中。',
    hint: '适合快节奏起稿、短周期完成和高浓度表达。',
  },
  medium: {
    label: '中篇小说',
    badge: '中篇',
    description: '人物关系更完整，转折更从容，适合做一段真正能沉浸进去的旅程。',
    hint: '适合阶段连载，也适合把人物线和故事线一起推开。',
  },
  long: {
    label: '长篇小说',
    badge: '长篇',
    description: '世界观、群像和长期连载都在这里展开，适合真正做一部作品。',
    hint: '建议先搭卷章树，再把角色、设定和主线一起铺开。',
  },
};

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value?: string) {
  if (!value) return '官方样例';
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function formatWordCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)} 万字`;
  }
  return `${value} 字`;
}

function getNovelTier(chapters: number, words: number): NovelLengthTier {
  if (words >= 80000 || chapters >= 40) return 'long';
  if (words >= 20000 || chapters >= 12) return 'medium';
  return 'short';
}

export default function NovelsPage() {
  const [activeGenre, setActiveGenre] = useState('全部');

  const cards = useMemo<NovelCard[]>(() => {
    const localDrafts = getWritingProjects()
      .filter((project) => project.type === 'novel')
      .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt))
      .map((project) => ({
        id: project.id,
        title: project.title,
        author: '我的草稿',
        genre: project.genre || '小说',
        description:
          project.description || project.summary || project.premise || '这部作品还在继续打磨。',
        tags: project.tags.length > 0 ? project.tags : ['草稿'],
        status:
          project.status === 'serializing'
            ? '连载中'
            : project.status === 'completed'
              ? '已完结'
              : project.status === 'drafting'
                ? '创作中'
                : '筹备中',
        chapterCount: countProjectChapters(project),
        wordCount: countProjectWords(project),
        updatedAt: project.updatedAt,
        isDraft: true,
      }));

    const official = featuredNovels.map((novel) => ({
      id: novel.id,
      title: novel.title,
      author: novel.author,
      genre: novel.genre,
      description: novel.description,
      tags: novel.tags,
      status: novel.status,
      chapterCount: novel.volumes.reduce((total, volume) => total + volume.chapters.length, 0),
      wordCount: novel.wordCount,
      isDraft: false,
    }));

    return [...localDrafts, ...official];
  }, []);

  const draftCards = useMemo(() => cards.filter((card) => card.isDraft), [cards]);
  const latestDraft = draftCards[0] ?? null;
  const filters = ['全部', ...featuredGenres.filter((genre) => genre !== '全部'), '草稿'];
  const visibleCards = cards.filter((card) => {
    if (activeGenre === '全部') return true;
    if (activeGenre === '草稿') return Boolean(card.isDraft);
    return card.genre === activeGenre;
  });

  const totalCount = cards.length;
  const draftCount = draftCards.length;
  const completedCount = cards.filter((card) => String(card.status).includes('完结')).length;
  const serializingCount = cards.filter((card) => String(card.status).includes('连载')).length;
  const latestDraftTier = latestDraft
    ? getNovelTier(latestDraft.chapterCount, latestDraft.wordCount)
    : 'short';
  const tierCards: Array<{
    tier: NovelLengthTier;
    title: string;
    href: string;
    count: number;
    active: boolean;
  }> = [
    {
      tier: 'short',
      title: NOVEL_TIER_META.short.label,
      href: `${NOVEL_EDITOR_URL}&tier=short`,
      count: cards.filter((card) => getNovelTier(card.chapterCount, card.wordCount) === 'short')
        .length,
      active: latestDraftTier === 'short',
    },
    {
      tier: 'medium',
      title: NOVEL_TIER_META.medium.label,
      href: `${NOVEL_EDITOR_URL}&tier=medium`,
      count: cards.filter((card) => getNovelTier(card.chapterCount, card.wordCount) === 'medium')
        .length,
      active: latestDraftTier === 'medium',
    },
    {
      tier: 'long',
      title: NOVEL_TIER_META.long.label,
      href: `${NOVEL_EDITOR_URL}&tier=long`,
      count: cards.filter((card) => getNovelTier(card.chapterCount, card.wordCount) === 'long')
        .length,
      active: latestDraftTier === 'long',
    },
  ];

  return (
    <div className="page-shell library-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-card rounded-[32px] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:items-stretch">
            <div className="space-y-6">
              <div className="section-kicker">小说工坊</div>
              <div>
                <h1 className="page-title mt-4">让故事先长出钩子，再长成一整个世界。</h1>
                <p className="page-lead mt-4">
                  这里不是枯燥的管理页，而是小说创作真正起势的入口。你可以从短篇一击命中，
                  也可以把中长篇慢慢铺开。标题、题材、卷章、正文、人物和设定，会在同一套工作台里一起发光。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={NOVEL_EDITOR_URL} className="btn btn-primary">
                  进入小说工坊
                </Link>
                <Link
                  to={latestDraft ? `${NOVEL_EDITOR_URL}&project=${latestDraft.id}` : NOVEL_EDITOR_URL}
                  className="btn btn-secondary"
                >
                  {latestDraft ? '继续最近项目' : '打开工作台'}
                </Link>
              </div>

              <div className="rounded-[24px] border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-xs leading-6 text-slate-200">
                你可以从这里直接进入小说工作台，也可以先挑选短篇、中篇、长篇的创作节奏，再一键开写。
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {tierCards.map((card) => (
                  <Link
                    key={card.tier}
                    to={card.href}
                    className={`rounded-[24px] border p-4 transition ${
                      card.active
                        ? 'border-sky-400/30 bg-sky-500/10'
                        : 'border-slate-700/60 bg-slate-900/70 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{NOVEL_TIER_META[card.tier].badge}</span>
                      <span>{card.count} 项</span>
                    </div>
                    <div className="mt-2 text-base font-bold text-slate-50">{card.title}</div>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      {NOVEL_TIER_META[card.tier].hint}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="assistant-kpi-grid mt-6 grid gap-3 sm:grid-cols-4">
                <div className="assistant-kpi rounded-2xl bg-white/70 p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    作品总数
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
                </div>
                <div className="assistant-kpi rounded-2xl bg-white/70 p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    本地草稿
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{draftCount}</div>
                </div>
                <div className="assistant-kpi rounded-2xl bg-white/70 p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    连载中
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{serializingCount}</div>
                </div>
                <div className="assistant-kpi rounded-2xl bg-white/70 p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    已完结
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                最近点亮
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900">
                {latestDraft ? latestDraft.title : '你的下一部故事，正在等你命名。'}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {latestDraft
                  ? latestDraft.description
                  : '创建第一部小说之后，草稿会自动留在这里。下次回来，不需要重新寻找入口，直接续写。'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">章节</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {latestDraft?.chapterCount ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">字数</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">
                    {formatWordCount(latestDraft?.wordCount ?? 0)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">最近更新</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDate(latestDraft?.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm leading-7 text-slate-100">
                当前节奏：{NOVEL_TIER_META[latestDraftTier].label}。{NOVEL_TIER_META[latestDraftTier].description}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={
                    latestDraft
                      ? `${NOVEL_EDITOR_URL}&project=${latestDraft.id}&tier=${latestDraftTier}`
                      : `${NOVEL_EDITOR_URL}&tier=short`
                  }
                  className="btn btn-primary"
                >
                  {latestDraft ? '继续进入小说工坊' : '创建并开写'}
                </Link>
                {latestDraft ? (
                  <Link to={`/novels/${latestDraft.id}`} className="btn btn-secondary">
                    查看作品页
                  </Link>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4 text-sm leading-7 text-white/80">
                自动保存已经开启。卷章结构、正文片段、人物卡和设定信息，都会随着你的推进持续沉淀。
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="section-kicker">作品橱窗</div>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">正在发光的小说项目</h2>
            <p className="mt-2 text-sm text-slate-600">
              当前筛选：{activeGenre}。从草稿到成品，所有故事都在这里等待被继续推进。
            </p>
          </div>

          <div className="chip-row overflow-x-auto pb-2">
            {filters.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setActiveGenre(genre)}
                className={`chip-action ${activeGenre === genre ? 'is-active' : ''}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div id="novel-gallery" className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const tier = getNovelTier(card.chapterCount, card.wordCount);
            const editorUrl = card.isDraft
              ? `${NOVEL_EDITOR_URL}&project=${card.id}&tier=${tier}`
              : `${NOVEL_EDITOR_URL}&tier=${tier}`;

            return (
              <article key={card.id} className="novel-card glass-card">
                <div className="novel-card-top">
                  <span className="chip">{card.isDraft ? '本地草稿' : card.genre}</span>
                  <span className="chip">{NOVEL_TIER_META[tier].badge}</span>
                  <span className="novel-status">{card.status}</span>
                </div>

                <h2>{card.title}</h2>
                <p className="novel-author">{card.author}</p>
                <p className="novel-description">{card.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="text-[11px] text-slate-500">章节</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {card.chapterCount}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="text-[11px] text-slate-500">字数</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatWordCount(card.wordCount)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="text-[11px] text-slate-500">更新</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(card.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="chip-row mt-4">
                  {card.tags.map((tag) => (
                    <span key={`${card.id}-${tag}`} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={`/novels/${card.id}`} className="btn btn-secondary">
                    查看详情
                  </Link>
                  <Link to={editorUrl} className="btn btn-primary">
                    {card.isDraft ? '继续写作' : '进入小说工坊'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
