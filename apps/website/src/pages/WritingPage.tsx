import { Suspense, lazy, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { normalizeProjectType } from '../utils/writingMetadata';
import type { WritingProjectType } from '../types/writing';

const LazyWritingWorkbench = lazy(() => import('../components/writing/WritingWorkbench'));

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
  const initialType = rawType ? normalizeProjectType(rawType) : undefined;
  const initialNovelTier = rawTier === 'short' || rawTier === 'medium' || rawTier === 'long' ? rawTier : undefined;
  const forceNovelWorkspace = rawWorkspace === 'novel' || initialType === 'novel';
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
