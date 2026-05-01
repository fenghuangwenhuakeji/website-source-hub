/**
 * NEXUS Progress Component
 * Visualizes the 7-phase workflow progress
 */

import React, { useMemo, useCallback } from 'react';
import { Check, Circle, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const NEXUS_PHASES = [
  {
    id: 'phase-0-discovery',
    name: '探索',
    description: '市场调研、用户反馈分析、竞品情报',
  },
  {
    id: 'phase-1-strategy',
    name: '策略',
    description: '架构设计、技术栈选型、路线图规划',
  },
  {
    id: 'phase-2-foundation',
    name: '基础',
    description: 'CI/CD搭建、数据库设计、核心基础设施、认证系统',
  },
  {
    id: 'phase-3-build',
    name: '构建',
    description: '功能开发与Dev↔QA迭代循环',
  },
  {
    id: 'phase-4-harden',
    name: '加固',
    description: '性能优化、安全加固、集成测试',
  },
  {
    id: 'phase-5-launch',
    name: '发布',
    description: '营销准备、部署自动化、用户文档',
  },
  {
    id: 'phase-6-operate',
    name: '运营',
    description: '监控告警、用户支持、持续改进',
  },
];
import styles from './index.module.scss';

interface NexusProgressProps {
  currentPhase?: string;
  completedPhases?: string[];
  phaseStatus?: Record<string, 'pending' | 'running' | 'passed' | 'failed'>;
  onPhaseClick?: (phaseId: string) => void;
}

const NexusProgress: React.FC<NexusProgressProps> = ({
  currentPhase,
  completedPhases = [],
  phaseStatus = {},
  onPhaseClick,
}) => {
  const { t } = useTranslation();

  const getPhaseStatus = useCallback((phaseId: string) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (currentPhase === phaseId) return phaseStatus[phaseId] || 'active';
    const currentIndex = NEXUS_PHASES.findIndex((p) => p.id === currentPhase);
    const phaseIndex = NEXUS_PHASES.findIndex((p) => p.id === phaseId);
    if (phaseIndex < currentIndex) return 'completed';
    return 'pending';
  }, [completedPhases, currentPhase, phaseStatus]);

  const renderPhase = useCallback((phase: (typeof NEXUS_PHASES)[0], index: number) => {
    const status = getPhaseStatus(phase.id);
    const isClickable = status !== 'pending';

    return (
      <React.Fragment key={phase.id}>
        <div
          className={`${styles.phase} ${styles[status]}`}
          onClick={() => isClickable && onPhaseClick?.(phase.id)}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
        >
          <div className={styles.phaseIcon}>
            {status === 'completed' ? (
              <Check size={14} />
            ) : status === 'failed' ? (
              <AlertCircle size={14} />
            ) : status === 'running' ? (
              <Circle size={14} className={styles.pulse} />
            ) : (
              <span className={styles.phaseNumber}>{index + 1}</span>
            )}
          </div>
          <div className={styles.phaseInfo}>
            <span className={styles.phaseName}>{phase.name}</span>
            <span className={styles.phaseDesc}>{phase.description}</span>
          </div>
        </div>
        {index < NEXUS_PHASES.length - 1 && (
          <div
            className={`${styles.connector} ${status === 'completed' ? styles.connectorActive : ''}`}
          >
            <ArrowRight size={12} />
          </div>
        )}
      </React.Fragment>
    );
  }, [getPhaseStatus, onPhaseClick]);

  const phaseElements = useMemo(() =>
    NEXUS_PHASES.map((phase, index) => renderPhase(phase, index)),
    [renderPhase]
  );

  return (
    <div className={styles.nexusProgress}>
      <div className={styles.header}>
        <span className={styles.title}>工作流进度</span>
        <span className={styles.phaseCount}>
          {completedPhases.length}/{NEXUS_PHASES.length} {t('nexus.phases', '阶段')}
        </span>
      </div>
      <div className={styles.phases}>
        {phaseElements}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <Check size={10} className={styles.legendCompleted} />
          <span>{t('nexus.completed', '已完成')}</span>
        </div>
        <div className={styles.legendItem}>
          <Circle size={10} className={styles.legendRunning} />
          <span>{t('nexus.current', '进行中')}</span>
        </div>
        <div className={styles.legendItem}>
          <Circle size={10} className={styles.legendPending} />
          <span>{t('nexus.pending', '待处理')}</span>
        </div>
      </div>
    </div>
  );
};

export default NexusProgress;
