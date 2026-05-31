import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { featuredGenres, featuredNovels } from '../data/library';
import {
  countProjectChapters,
  countProjectWords,
  getWritingProjects,
} from '../utils/localWriting';
import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';

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
const desktopDownloadUrl = resolveDesktopDownloadUrl();
type NovelLengthTier = 'short' | 'medium' | 'long';

const NOVEL_TIER_META: Record<
  NovelLengthTier,
  { label: string; badge: string; description: string; hint: string }
> = {
  short: {
    label: '短篇小说',
    badge: '短篇',
    description: '单刀直入，强钩子，将一个瞬间写成一记命中',
    hint: '快节奏起稿、短周期完成、高浓度表达',
  },
  medium: {
    label: '中篇小说',
    badge: '中篇',
    description: '人物关系更完整，转折更从容，做一段真正能沉浸的旅程',
    hint: '阶段连载，人物线与故事线一并推开',
  },
  long: {
    label: '长篇小说',
    badge: '长篇',
    description: '世界观、群像与长期连载在此展开，真正做一部作品',
    hint: '先搭卷章树，再将角色、设定与主线一并铺开',
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

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Hero variants ── */
const heroContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const heroKicker = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.1 } },
};

const heroTitleMask = {
  initial: { y: '110%' },
  animate: { y: 0, transition: { duration: 0.9, ease, delay: 0.2 } },
};

const heroLead = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.4 } },
};

const heroButtonContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
};

const heroButtonItem = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

const heroHint = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.6 } },
};

const heroTierCardContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.65 } },
};

const heroTierCardItem = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};

const heroKpiContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.8 } },
};

const heroKpiItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const heroRightPanel = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease, delay: 0.4 } },
};

const heroRightStatContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};

const heroRightStatItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

/* ── Gallery variants ── */
const galleryHeader = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  viewport: { once: true, margin: '-80px' },
};

const galleryChipContainer = {
  initial: 'initial',
  whileInView: 'animate',
  viewport: { once: true, margin: '-80px' },
};

const galleryChipItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const novelCardContainer = {
  initial: 'initial',
  whileInView: 'animate',
  viewport: { once: true, margin: '-80px' },
};

const novelCardItem = {
  initial: { opacity: 0, y: 30, filter: 'blur(6px) saturate(0%)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px) saturate(100%)', transition: { duration: 0.8, ease } },
};

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
          project.description || project.summary || project.premise || '这部作品还在继续打磨',
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
      {/* Atmospheric background */}
      <div className="library-bg-aura" />
      <div className="library-bg-grid" />

      <div className="container py-10 sm:py-14 space-y-8 relative z-10">
        {/* ── Hero ── */}
        <motion.section
          className="glass-card p-6 sm:p-8 relative overflow-hidden"
          variants={heroContainer}
          initial="initial"
          animate="animate"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:items-stretch">
            {/* Left column */}
            <div className="space-y-6">
              <motion.div variants={heroKicker} className="section-kicker">
                小说展示
              </motion.div>

              <div>
                <h1 className="page-title mt-4">
                  <span className="title-line-mask">
                    <motion.span className="title-line" variants={heroTitleMask}>
                      先看作品，再进入真正的工作台
                    </motion.span>
                  </span>
                </h1>
                <motion.p variants={heroLead} className="page-lead mt-4">
                  这里主要展示小说题材、样稿、设定和作品陈列，方便浏览和对外介绍。
                  如果你要继续长篇创作、卷章整理和正文生产，请优先下载桌面端。
                </motion.p>
              </div>
              <div className="rounded-[24px] border border-[var(--fh-accent)]/20 bg-[var(--fh-accent)]/10 px-4 py-4 text-sm leading-7 text-[var(--fh-text-secondary)]">
                这里只是展示页，不是完整在线创作工具。需要完整体验，请下载客户端。
              </div>

              <motion.div variants={heroButtonContainer} className="flex flex-wrap gap-3">
                <motion.div variants={heroButtonItem}>
                  <a href={desktopDownloadUrl} className="btn btn-primary">
                    下载桌面端
                  </a>
                </motion.div>
                <motion.div variants={heroButtonItem}>
                  <a href="#novel-gallery" className="btn btn-secondary">
                    查看小说陈列
                  </a>
                </motion.div>
                {latestDraft ? (
                  <motion.div variants={heroButtonItem}>
                    <Link
                      to={`${NOVEL_EDITOR_URL}&project=${latestDraft.id}`}
                      className="btn btn-secondary"
                    >
                      继续最近项目
                    </Link>
                  </motion.div>
                ) : null}
              </motion.div>

              <motion.div
                variants={heroHint}
                className="rounded-[24px] border border-[var(--fh-accent)]/20 bg-[var(--fh-accent)]/10 px-4 py-3 text-xs leading-6 text-[var(--fh-text-secondary)]"
              >
                官网页负责展示和浏览；真正的创作、续写和项目管理，请进入桌面端工作台
              </motion.div>

              <motion.div variants={heroTierCardContainer} className="mt-6 grid gap-3 sm:grid-cols-3">
                {tierCards.map((card) => (
                  <motion.div key={card.tier} variants={heroTierCardItem}>
                    <Link
                      to="/novels#novel-gallery"
                      className={`block rounded-[24px] border p-4 transition ${
                        card.active
                          ? 'border-[var(--fh-accent)]/30 bg-[var(--fh-accent)]/10'
                          : 'border-[var(--fh-border)] bg-[var(--fh-surface)] hover:bg-[var(--fh-surface-raised)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-[var(--fh-text-muted)]">
                        <span>{NOVEL_TIER_META[card.tier].badge}</span>
                        <span>{card.count} 项</span>
                      </div>
                      <div className="mt-2 text-base font-bold text-[var(--fh-text)]">{card.title}</div>
                      <p className="mt-2 text-xs leading-6 text-[var(--fh-text-muted)]">
                        {NOVEL_TIER_META[card.tier].hint}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={heroKpiContainer} className="assistant-kpi-grid mt-6">
                <motion.div variants={heroKpiItem} className="assistant-kpi">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-text-muted)]">
                    作品总数
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[var(--fh-text)]">{totalCount}</div>
                </motion.div>
                <motion.div variants={heroKpiItem} className="assistant-kpi">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-text-muted)]">
                    本地草稿
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[var(--fh-text)]">{draftCount}</div>
                </motion.div>
                <motion.div variants={heroKpiItem} className="assistant-kpi">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-text-muted)]">
                    连载中
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[var(--fh-text)]">{serializingCount}</div>
                </motion.div>
                <motion.div variants={heroKpiItem} className="assistant-kpi">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-text-muted)]">
                    已完结
                  </div>
                  <div className="mt-2 text-2xl font-bold text-[var(--fh-text)]">{completedCount}</div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right column — 最近续写 */}
            <motion.div variants={heroRightPanel} className="glass-card p-5 relative overflow-hidden">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fh-text-muted)]">
                页面定位
              </div>
              <div className="mt-3 text-2xl font-bold text-[var(--fh-text)]">
                {latestDraft ? `${latestDraft.title} · 本地草稿已识别` : '官网小说页以展示为主'}
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                {latestDraft
                  ? '检测到你本地有最近草稿，但继续写作仍建议回到桌面端，官网页更适合浏览作品和展示资料。'
                  : '没有本地草稿时，这里更适合用来浏览作品、展示题材和理解产品方向，而不是直接当成在线写作工具。'}
              </p>

              <motion.div variants={heroRightStatContainer} className="mt-5 grid gap-3 sm:grid-cols-3">
                <motion.div variants={heroRightStatItem} className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                  <div className="text-xs text-[var(--fh-text-muted)]">章节</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--fh-text)]">
                    {latestDraft?.chapterCount ?? 0}
                  </div>
                </motion.div>
                <motion.div variants={heroRightStatItem} className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                  <div className="text-xs text-[var(--fh-text-muted)]">字数</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--fh-text)]">
                    {formatWordCount(latestDraft?.wordCount ?? 0)}
                  </div>
                </motion.div>
                <motion.div variants={heroRightStatItem} className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                  <div className="text-xs text-[var(--fh-text-muted)]">最近更新</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--fh-text)]">
                    {formatDate(latestDraft?.updatedAt)}
                  </div>
                </motion.div>
              </motion.div>

              <div className="mt-4 rounded-2xl border border-[var(--fh-accent)]/20 bg-[var(--fh-accent)]/10 px-4 py-4 text-sm leading-7 text-[var(--fh-text-secondary)]">
                {latestDraft
                  ? `最近草稿属于 ${NOVEL_TIER_META[latestDraftTier].label}，但续写入口建议回到桌面端。`
                  : '你现在看到的是小说展示页，不是完整在线创作工作台。'}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href={desktopDownloadUrl} className="btn btn-primary">
                  下载桌面端
                </a>
                {latestDraft ? (
                  <Link to={`/novels/${latestDraft.id}`} className="btn btn-secondary">
                    查看草稿详情
                  </Link>
                ) : (
                  <Link to="/showcase" className="btn btn-secondary">
                    查看完整作品展示
                  </Link>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-[var(--fh-bg-elevated)] px-4 py-4 text-sm leading-7 text-[var(--fh-text-secondary)]">
                本地草稿如果存在会被识别出来，但官网页本身不再承担完整创作职责
              </div>

              <span className="library-hero-deco">{latestDraft ? '续' : '写'}</span>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Gallery header ── */}
        <motion.div
          {...galleryHeader}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="section-kicker">作品橱窗</div>
            <h2 className="mt-2 text-3xl font-bold text-[var(--fh-text)]">小说项目与样稿陈列</h2>
            <p className="mt-2 text-sm text-[var(--fh-text-muted)]">
              当前筛选：{activeGenre}，这里更偏向浏览作品、样稿和本地草稿概览
            </p>
          </div>

          <motion.div
            {...galleryChipContainer}
            className="chip-row overflow-x-auto pb-2"
          >
            {filters.map((genre) => (
              <motion.button
                key={genre}
                type="button"
                variants={galleryChipItem}
                onClick={() => setActiveGenre(genre)}
                className={`chip-action ${activeGenre === genre ? 'is-active' : ''}`}
              >
                {genre}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Novel cards ── */}
        <motion.div
          id="novel-gallery"
          {...novelCardContainer}
          className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleCards.map((card) => {
            const tier = getNovelTier(card.chapterCount, card.wordCount);
            const editorUrl = card.isDraft
              ? `${NOVEL_EDITOR_URL}&project=${card.id}&tier=${tier}`
              : `${NOVEL_EDITOR_URL}&tier=${tier}`;

            return (
              <motion.article
                key={card.id}
                variants={novelCardItem}
                className="novel-card novel-card--cinematic glass-card"
              >
                <div className="novel-card-top">
                  <span className="chip">{card.isDraft ? '本地草稿' : card.genre}</span>
                  <span className="chip">{NOVEL_TIER_META[tier].badge}</span>
                  <span className="novel-status">{card.status}</span>
                </div>

                <h2>{card.title}</h2>
                <p className="novel-author">{card.author}</p>
                <p className="novel-description">{card.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-[var(--fh-bg-elevated)] px-3 py-3">
                    <div className="text-[11px] text-[var(--fh-text-muted)]">章节</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--fh-text)]">
                      {card.chapterCount}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--fh-bg-elevated)] px-3 py-3">
                    <div className="text-[11px] text-[var(--fh-text-muted)]">字数</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--fh-text)]">
                      {formatWordCount(card.wordCount)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[var(--fh-bg-elevated)] px-3 py-3">
                    <div className="text-[11px] text-[var(--fh-text-muted)]">更新</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--fh-text)]">
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
                  {card.isDraft ? (
                    <Link to={editorUrl} className="btn btn-primary">
                      继续最近项目
                    </Link>
                  ) : (
                    <a href={desktopDownloadUrl} className="btn btn-primary">
                      下载桌面端创作
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
