import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFeaturedNovelById } from '../data/library';
import type { WritingProject } from '../types/writing';
import {
  countProjectChapters,
  countProjectWords,
  getWritingProjectById,
} from '../utils/localWriting';
import { buildCoverStyle } from '../utils/writingMetadata';

type DetailVolume = {
  id: string;
  title: string;
  summary: string;
  chapters: Array<{
    id: string;
    title: string;
    summary: string;
    excerpt: string;
    wordCount: number;
  }>;
};

const NOVEL_EDITOR_URL = '/writing?type=novel&workspace=novel';
type NovelLengthTier = 'short' | 'medium' | 'long';

const NOVEL_TIER_META: Record<NovelLengthTier, { label: string; badge: string; description: string }> = {
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

export default function NovelDetailPage() {
  const { id = '' } = useParams();
  const [draftProject, setDraftProject] = useState<WritingProject | null>(null);

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
      return {
        ...officialNovel,
        chapterCount: officialNovel.volumes.reduce((total, volume) => total + volume.chapters.length, 0),
        isDraft: false,
      };
    }

    return null;
  }, [draftProject, officialNovel]);

  const averageWords = detail ? Math.round(detail.wordCount / Math.max(detail.chapterCount, 1)) : 0;
  const volumeCount = detail ? detail.volumes.length : 0;
  const materialCount = detail ? detail.materials.length : 0;
  const novelTier = detail ? getNovelTier(detail.chapterCount, detail.wordCount) : 'short';
  const editorUrl = detail?.isDraft ? `${NOVEL_EDITOR_URL}&project=${id}&tier=${novelTier}` : `${NOVEL_EDITOR_URL}&tier=${novelTier}`;

  if (!detail) {
    return (
      <div className="page-shell">
        <div className="container py-14">
          <div className="glass-card rounded-[32px] p-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900">没有找到对应小说</h1>
            <p className="mt-4 text-slate-500">这本作品可能还没有创建，或者暂时还没有同步到当前站点。</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/novels" className="inline-flex rounded-full bg-slate-900 px-6 py-3 font-semibold text-white">
                返回小说助手选择页
              </Link>
              <Link to={NOVEL_EDITOR_URL} className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900">
                进入小说工坊
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="container py-10 sm:py-14">
        <div className="detail-grid">
          <aside className="detail-aside glass-card">
            <div className="detail-cover" style={buildCoverStyle(detail.title, 'novel')}>
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
            </div>

            <div className="chip-row mt-5">
              {detail.tags.length > 0 ? (
                detail.tags.map((tag) => (
                  <span key={`${detail.title}-${tag}`} className="chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="chip">暂无标签</span>
              )}
            </div>

            <div className="detail-stats">
              <div>
                <span>状态</span>
                <strong>{detail.status}</strong>
              </div>
              <div>
                <span>章节</span>
                <strong>{detail.chapterCount}</strong>
              </div>
              <div>
                <span>字数</span>
                <strong>{formatWordCount(detail.wordCount)}</strong>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">平均字数 / 章</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{averageWords}</div>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">卷数 / 素材</div>
                <div className="mt-2 text-xl font-bold text-slate-900">
                  {volumeCount} 卷 · {materialCount} 条
                </div>
              </div>
            </div>

            {detail.isDraft ? (
              <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-4 text-sm leading-7 text-white/80">
                这是一本本地草稿。你可以从详情页直接进入小说工坊继续写作，正文、卷章和素材会保存在当前浏览器里。
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                这是站点里的官方小说样例。你可以先浏览它的结构，再回到小说工坊开始自己的作品。
              </div>
            )}

            <div className="detail-actions">
              <Link to="/novels" className="btn btn-secondary">
                返回小说助手选择页
              </Link>
              <Link to={editorUrl} className="btn btn-primary">
                {detail.isDraft ? '继续写作' : '进入小说工坊'}
              </Link>
            </div>
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-900">
              当前层级：{NOVEL_TIER_META[novelTier].label}。{NOVEL_TIER_META[novelTier].description}
            </div>
          </aside>

          <div className="detail-content">
            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <div className="section-kicker">简介</div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">作品信息</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{detail.synopsis}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">类型</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{detail.genre}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">状态</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{detail.status}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">分卷</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{volumeCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">素材</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{materialCount}</div>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <div className="section-kicker">世界观</div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">设定与规则</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {detail.worldview || '世界观暂未补全。'}
              </p>
            </section>

            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <div className="section-kicker">大纲</div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">章节结构</h2>
              <pre className="detail-outline">{detail.outline || '暂无大纲。'}</pre>
            </section>

            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <div className="section-kicker">分卷</div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">卷章详情</h2>
              <div className="detail-volumes">
                {detail.volumes.length > 0 ? (
                  detail.volumes.map((volume) => (
                    <article key={volume.id} className="detail-volume">
                      <div className="detail-volume-head">
                        <div>
                          <h3>{volume.title}</h3>
                          <p>{volume.summary || '本卷简介待补充。'}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {volume.chapters.length} 章
                        </span>
                      </div>
                      <div className="detail-chapter-list">
                        {volume.chapters.map((chapter) => (
                          <div key={chapter.id} className="detail-chapter">
                            <div className="detail-chapter-head">
                              <h4 className="text-base font-semibold text-slate-900">{chapter.title}</h4>
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {formatWordCount(chapter.wordCount)}
                              </span>
                            </div>
                            <p className="text-sm leading-7 text-slate-600">{chapter.summary}</p>
                            <div className="detail-chapter-excerpt">{chapter.excerpt}</div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">暂无章节。</div>
                )}
              </div>
            </section>

            <section className="glass-card rounded-[32px] p-6 sm:p-8">
              <div className="section-kicker">素材</div>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">创作素材</h2>
              {detail.materials.length > 0 ? (
                <div className="detail-material-grid">
                  {detail.materials.map((material) => (
                    <article key={`${detail.title}-${material.title}`} className="detail-material">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">{material.type}</div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">{material.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{material.summary}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">暂无素材。</div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
