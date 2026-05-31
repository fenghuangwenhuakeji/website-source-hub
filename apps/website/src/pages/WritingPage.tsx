import { Suspense, lazy, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { normalizeProjectType } from '../utils/writingMetadata';
import type { WritingProjectType } from '../types/writing';
import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';

const LazyWritingWorkbench = lazy(() => import('../components/writing/WritingWorkbench'));
const desktopDownloadUrl = resolveDesktopDownloadUrl();

function WritingWorkbenchFallback() {
  return (
    <div className="page-shell writing-shell min-h-screen">
      <div className="container py-10 sm:py-14">
        <div className="glass-card p-8 sm:p-10">
          <div className="space-y-4">
            <div className="h-5 w-48 animate-pulse rounded-full bg-[var(--fh-surface-raised)]" />
            <div className="h-4 w-36 animate-pulse rounded-full bg-[var(--fh-bg-elevated)]" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-[var(--fh-bg-elevated)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WritingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? '';
  const rawType = searchParams.get('type');
  const rawWorkspace = searchParams.get('workspace');
  const rawTier = searchParams.get('tier');
  const rawMode = searchParams.get('mode');
  const initialType = rawType ? normalizeProjectType(rawType) : undefined;
  const initialNovelTier = rawTier === 'short' || rawTier === 'medium' || rawTier === 'long' ? rawTier : undefined;
  const forceNovelWorkspace = rawWorkspace === 'novel' || initialType === 'novel';
  const isDisplayOnlyPage = initialType !== 'novel' && rawMode !== 'workspace';
  const showcaseTitle =
    initialType === 'storyboard' ? '分镜展示' : '剧本展示';
  const workspaceEntryHref = `/writing?type=${initialType ?? 'script'}&mode=workspace`;

  const handleProjectChange = useCallback(
    (nextProjectId: string) => {
      if (nextProjectId === projectId) {
        return;
      }

      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (nextProjectId) {
          nextParams.set('project', nextProjectId);
        } else {
          nextParams.delete('project');
        }

        return nextParams;
      }, { replace: true });
    },
    [projectId, setSearchParams],
  );

  const handleWorkspaceTypeChange = useCallback(
    (nextType: WritingProjectType) => {
      if (nextType === initialType) {
        return;
      }

      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set('type', nextType);
        nextParams.delete('tier');
        nextParams.delete('project');
        return nextParams;
      }, { replace: true });
    },
    [initialType, setSearchParams],
  );

  if (isDisplayOnlyPage) {
    return (
      <div className="page-shell writing-shell min-h-screen">
        <div className="container py-10 sm:py-14 space-y-8">
          <section className="glass-card p-6 sm:p-8">
            <div className="section-kicker">{showcaseTitle}</div>
            <h1 className="page-title mt-4">这里只是展示页，完整体验请下载客户端</h1>
            <p className="page-lead mt-4">
              {showcaseTitle} 负责展示剧本方向、场景结构、对白节奏和镜头化表达，不承担完整在线创作职责。
              需要真正继续项目，请使用桌面端客户端。
            </p>
            <div className="mt-5 rounded-[24px] border border-[var(--fh-accent)]/20 bg-[var(--fh-accent)]/10 px-4 py-4 text-sm leading-7 text-[var(--fh-text-secondary)]">
              桌面端才是真实产品，网页端仅为展示与入口分发。这里可以看展示、看资料、看方向，但不能代表完整能力。
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={desktopDownloadUrl} className="btn btn-primary">
                下载客户端
              </a>
              <Link to={workspaceEntryHref} className="btn btn-secondary">
                继续进入网页版创作
              </Link>
              <Link to="/showcase" className="btn btn-secondary">
                查看作品展示
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="glass-card p-5">
              <div className="text-sm font-semibold text-[var(--fh-text)]">页面定位</div>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                这里展示剧本方向、结构感和镜头语言，不作为真实在线工作台。
              </p>
            </article>
            <article className="glass-card p-5">
              <div className="text-sm font-semibold text-[var(--fh-text)]">适合做什么</div>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                浏览展示、理解产品方向、查看剧本相关入口和品牌能力。
              </p>
            </article>
            <article className="glass-card p-5">
              <div className="text-sm font-semibold text-[var(--fh-text)]">真正继续项目</div>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                推荐直接下载客户端；如果你必须继续原来的网页版剧本创作，也可以从当前页继续进入。
              </p>
            </article>
          </section>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<WritingWorkbenchFallback />}>
      <LazyWritingWorkbench
        initialProjectId={projectId}
        initialType={initialType}
        initialNovelTier={initialNovelTier}
        forceNovelWorkspace={forceNovelWorkspace}
        onProjectChange={handleProjectChange}
        onWorkspaceTypeChange={handleWorkspaceTypeChange}
      />
    </Suspense>
  );
}
