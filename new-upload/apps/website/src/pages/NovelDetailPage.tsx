import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFeaturedNovelById } from '../data/library';
import type { WritingProject } from '../types/writing';
import {
  countProjectChapters,
  countProjectWords,
  getWritingProjectById,
} from '../utils/localWriting';
import { buildCoverStyle } from '../utils/writingMetadata';

type DetailChapter = {
  id: string;
  title: string;
  summary: string;
  excerpt: string;
  wordCount: number;
};

type DetailVolume = {
  id: string;
  title: string;
  summary: string;
  chapters: DetailChapter[];
};

const NOVEL_EDITOR_URL = '/writing?type=novel&workspace=novel';
type NovelLengthTier = 'short' | 'medium' | 'long';

const NOVEL_TIER_META: Record<
  NovelLengthTier,
  { label: string; badge: string; description: string }
> = {
  short: { label: '短篇小说', badge: '短篇', description: '更偏向单线、紧凑与高钩子。' },
  medium: { label: '中篇小说', badge: '中篇', description: '更适合卷章推进和角色扩展。' },
  long: { label: '长篇小说', badge: '长篇', description: '更适合多卷、多线与持续连载。' },
};

function getNovelTier(chapters: number, words: number): NovelLengthTier {
  if (words >= 80000 || chapters >= 40) return 'long';
  if (words >= 20000 || chapters >= 12) return 'medium';
  return 'short';
}

function formatWordCount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)} 万字`;
  }
  return `${value} 字`;
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

type DetailTab = 'overview' | 'volumes' | 'materials' | 'outline';

const TAB_META: Record<DetailTab, { label: string; count?: number }> = {
  overview: { label: '概览' },
  volumes: { label: '卷章' },
  materials: { label: '素材' },
  outline: { label: '大纲' },
};

/* ── Sidebar variants ── */
const sidebarContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const sidebarItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

/* ── Content variants ── */
const contentReveal = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export default function NovelDetailPage() {
  const { id = '' } = useParams();
  const [draftProject, setDraftProject] = useState<WritingProject | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDraftProject(id.startsWith('draft-') ? getWritingProjectById(id) : null);
  }, [id]);

  const officialNovel = getFeaturedNovelById(id);

  const detail = useMemo(() => {
    if (draftProject) {
      const volumes: DetailVolume[] = draftProject.volumes.map((volume) => ({
        id: volume.id,
        title: volume.title,
        summary: volume.summary || '本卷简介待补充。',
        chapters: volume.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          summary: chapter.summary || '本章摘要待补充。',
          excerpt: chapter.content.slice(0, 120) || '正文仍在创作中。',
          wordCount: chapter.content.replace(/\s/g, '').length,
        })),
      }));

      return {
        title: draftProject.title,
        genre: draftProject.genre || '小说',
        author: '我的草稿',
        status:
          draftProject.status === 'serializing'
            ? '连载中'
            : draftProject.status === 'completed'
              ? '已完结'
              : draftProject.status === 'drafting'
                ? '创作中'
                : '筹备中',
        description: draftProject.description || draftProject.summary || draftProject.premise || '暂无简介。',
        synopsis: draftProject.summary || draftProject.premise || '暂无项目简介。',
        worldview: draftProject.worldview,
        outline: draftProject.outline,
        tags: draftProject.tags,
        volumes,
        materials: draftProject.materials,
        chapterCount: countProjectChapters(draftProject),
        wordCount: countProjectWords(draftProject),
        isDraft: true,
      };
    }

    if (officialNovel) {
      const volumes: DetailVolume[] = officialNovel.volumes.map((volume) => ({
        id: volume.id,
        title: volume.title,
        summary: volume.summary,
        chapters: volume.chapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          summary: chapter.summary,
          excerpt: chapter.content.slice(0, 120) || '正文仍在创作中。',
          wordCount: chapter.content.replace(/\s/g, '').length,
        })),
      }));

      return {
        ...officialNovel,
        volumes,
        chapterCount: volumes.reduce((total, volume) => total + volume.chapters.length, 0),
        isDraft: false,
      };
    }

    return null;
  }, [draftProject, officialNovel]);

  const volumeCount = detail ? detail.volumes.length : 0;
  const materialCount = detail ? detail.materials.length : 0;
  const novelTier = detail ? getNovelTier(detail.chapterCount, detail.wordCount) : 'short';
  const editorUrl = detail?.isDraft ? `${NOVEL_EDITOR_URL}&project=${id}&tier=${novelTier}` : `${NOVEL_EDITOR_URL}&tier=${novelTier}`;

  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
      }
      return next;
    });
  };

  const tabs: DetailTab[] = ['overview', 'volumes', 'materials', 'outline'];
  const tabCounts: Record<DetailTab, number> = {
    overview: 0,
    volumes: detail?.chapterCount ?? 0,
    materials: materialCount,
    outline: detail?.outline ? detail.outline.split('\n').filter(Boolean).length : 0,
  };

  if (!detail) {
    return (
      <div className="page-shell detail-shell">
        <div className="container py-14 relative z-10">
          <div className="glass-card p-10 text-center">
            <h1 className="text-3xl font-bold text-[var(--fh-text)]">没有找到对应小说</h1>
            <p className="mt-4 text-[var(--fh-text-muted)]">这本作品可能还没有创建，或者暂时还没有同步到当前站点。</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/novels" className="btn btn-primary">
                返回小说助手选择页
              </Link>
              <Link to={NOVEL_EDITOR_URL} className="btn btn-secondary">
                进入小说工坊
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell detail-shell">
      <div className="detail-bg-aura" />
      <div className="detail-bg-grid" />

      <div className="container py-10 sm:py-14 relative z-10">
        <div className="detail-grid">
          {/* ── Sidebar ── */}
          <motion.aside
            className="detail-aside glass-card"
            variants={sidebarContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              className="detail-cover relative overflow-hidden"
              style={buildCoverStyle(detail.title, 'novel')}
              variants={sidebarItem}
            >
              <div className="detail-cover-texture" />
              <div className="detail-cover-inner">
                <div className="section-kicker text-white/80">作品概览</div>
                <h1>{detail.title}</h1>
                <p className="detail-meta">作者 · {detail.author}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span>{detail.genre}</span>
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  <span>{detail.status}</span>
                  <span className="rounded-full border border-white/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {NOVEL_TIER_META[novelTier].badge}
                  </span>
                  {detail.isDraft ? (
                    <span className="rounded-full border border-white/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/70">
                      本地草稿
                    </span>
                  ) : null}
                </div>
                <p className="detail-copy">{detail.description}</p>
              </div>
            </motion.div>

            <motion.div variants={sidebarItem} className="mt-5 flex flex-wrap gap-2">
              {detail.tags.length > 0 ? (
                detail.tags.map((tag) => (
                  <span key={`${detail.title}-${tag}`} className="chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="chip">暂无标签</span>
              )}
            </motion.div>

            <motion.div variants={sidebarItem} className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fh-text-muted)]">状态</span>
                <span className="font-semibold text-[var(--fh-text)]">{detail.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fh-text-muted)]">章节</span>
                <span className="font-semibold text-[var(--fh-text)]">{detail.chapterCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fh-text-muted)]">字数</span>
                <span className="font-semibold text-[var(--fh-text)]">{formatWordCount(detail.wordCount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--fh-text-muted)]">层级</span>
                <span className="font-semibold text-[var(--fh-text)]">{NOVEL_TIER_META[novelTier].label}</span>
              </div>
            </motion.div>

            <motion.div variants={sidebarItem} className="detail-actions mt-5">
              <Link to="/novels" className="btn btn-secondary">
                返回
              </Link>
              <Link to={editorUrl} className="btn btn-primary">
                {detail.isDraft ? '继续写作' : '进入工坊'}
              </Link>
            </motion.div>
          </motion.aside>

          {/* ── Content ── */}
          <div className="detail-content">
            {/* Tab bar */}
            <div className="glass-card p-2">
              <div className="detail-tab-bar">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`detail-tab ${activeTab === tab ? 'is-active' : ''}`}
                  >
                    <span>{TAB_META[tab].label}</span>
                    {tabCounts[tab] > 0 ? (
                      <span className="detail-tab-count">{tabCounts[tab]}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={contentReveal}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  className="glass-card p-6 sm:p-8"
                >
                  <div className="section-kicker">简介</div>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]" style={{ fontFamily: 'var(--fh-font-serif)' }}>
                    作品信息
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[var(--fh-text-secondary)]">{detail.synopsis}</p>

                  {detail.worldview ? (
                    <div className="mt-8">
                      <div className="section-kicker">世界观</div>
                      <h3 className="mt-3 text-xl font-bold text-[var(--fh-text)]" style={{ fontFamily: 'var(--fh-font-serif)' }}>
                        设定与规则
                      </h3>
                      <p className="mt-3 text-base leading-8 text-[var(--fh-text-secondary)]">{detail.worldview}</p>
                    </div>
                  ) : null}

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: '类型', value: detail.genre },
                      { label: '状态', value: detail.status },
                      { label: '分卷', value: `${volumeCount} 卷` },
                      { label: '素材', value: `${materialCount} 条` },
                    ].map((stat, index) => (
                      <div key={stat.label} className="detail-stat-card">
                        <span className="detail-stat-index">{String(index + 1).padStart(2, '0')}</span>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-text-muted)]">{stat.label}</div>
                        <div className="mt-2 text-lg font-semibold text-[var(--fh-text)]">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'volumes' && (
                <motion.div
                  key="volumes"
                  variants={contentReveal}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  className="glass-card p-6 sm:p-8"
                >
                  <div className="section-kicker">分卷</div>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]" style={{ fontFamily: 'var(--fh-font-serif)' }}>
                    卷章详情
                  </h2>
                  <div className="detail-volumes">
                    {detail.volumes.length > 0 ? (
                      detail.volumes.map((volume, volumeIndex) => {
                        const isExpanded = expandedVolumes.has(volume.id);
                        return (
                          <div key={volume.id} className="detail-volume detail-volume--cinematic">
                            <button
                              type="button"
                              onClick={() => toggleVolume(volume.id)}
                              className="detail-volume-head w-full text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="detail-volume-deco">{String(volumeIndex + 1).padStart(2, '0')}</span>
                                <div>
                                  <h3>{volume.title}</h3>
                                  <p>{volume.summary || '本卷简介待补充。'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--fh-text-muted)]">
                                  {volume.chapters.length} 章
                                </span>
                                <span className={`text-xs text-[var(--fh-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                              </div>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease }}
                                  className="overflow-hidden"
                                >
                                  <div className="detail-chapter-list pt-2">
                                    {volume.chapters.map((chapter, chapterIndex) => (
                                      <div key={chapter.id} className="detail-chapter">
                                        <div className="detail-chapter-head">
                                          <div className="flex items-center gap-2">
                                            <span className="detail-chapter-deco">{String(chapterIndex + 1).padStart(2, '0')}</span>
                                            <h4 className="text-base font-semibold text-[var(--fh-text)]">{chapter.title}</h4>
                                          </div>
                                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--fh-text-muted)]">
                                            {formatWordCount(chapter.wordCount)}
                                          </span>
                                        </div>
                                        <p className="text-sm leading-7 text-[var(--fh-text-secondary)]">{chapter.summary}</p>
                                        <div className="detail-chapter-excerpt">{chapter.excerpt}</div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl bg-[var(--fh-bg-elevated)] p-6 text-sm text-[var(--fh-text-muted)]">暂无章节。</div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'materials' && (
                <motion.div
                  key="materials"
                  variants={contentReveal}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  className="glass-card p-6 sm:p-8"
                >
                  <div className="section-kicker">素材</div>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]" style={{ fontFamily: 'var(--fh-font-serif)' }}>
                    创作素材
                  </h2>
                  {detail.materials.length > 0 ? (
                    <div className="detail-material-grid">
                      {detail.materials.map((material) => (
                        <article key={`${detail.title}-${material.title}`} className="detail-material detail-material--cinematic">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fh-error)]">{material.type}</div>
                          <h3 className="mt-3 text-lg font-bold text-[var(--fh-text)]">{material.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">{material.summary}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--fh-bg-elevated)] p-6 text-sm text-[var(--fh-text-muted)]">暂无素材。</div>
                  )}
                </motion.div>
              )}

              {activeTab === 'outline' && (
                <motion.div
                  key="outline"
                  variants={contentReveal}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  className="glass-card p-6 sm:p-8"
                >
                  <div className="section-kicker">大纲</div>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]" style={{ fontFamily: 'var(--fh-font-serif)' }}>
                    章节结构
                  </h2>
                  <div className="detail-outline">
                    {(detail.outline || '暂无大纲。').split('\n').map((line, index) => (
                      <div key={index} className="detail-outline-line">
                        <span className="detail-outline-number">{String(index + 1).padStart(2, '0')}</span>
                        <span className="detail-outline-text">{line}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
