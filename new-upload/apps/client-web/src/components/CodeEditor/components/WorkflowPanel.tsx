import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { workflowService } from '../services';
import type {
  Workflow,
  WorkflowStep,
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowTemplateCategoryInfo,
  WorkflowStatus,
} from '../types/workflow';
import styles from './WorkflowPanel.module.scss';

interface WorkflowPanelProps {
  onWorkflowStart?: (workflow: Workflow, execution: WorkflowExecution) => void;
  onWorkflowComplete?: (workflow: Workflow, execution: WorkflowExecution) => void;
  onStepExecute?: (step: WorkflowStep, result: unknown) => void;
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  onWorkflowStart,
  onStepExecute,
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [categories, setCategories] = useState<WorkflowTemplateCategoryInfo[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'templates' | 'detail'>('list');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedWorkflows, loadedTemplates, loadedCategories] = await Promise.all([
        workflowService.listWorkflows(),
        Promise.resolve(workflowService.getTemplates()),
        Promise.resolve(workflowService.getTemplateCategories()),
      ]);
      setWorkflows(loadedWorkflows);
      setTemplates(loadedTemplates);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowToggle = (workflowId: string) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
      } else {
        next.add(workflowId);
      }
      return next;
    });
  };

  const handleStartWorkflow = useCallback(async (workflow: Workflow) => {
    setIsLoading(true);
    try {
      const execution = await workflowService.startWorkflow(workflow.id);
      setCurrentExecution(execution);
      setSelectedWorkflow(workflow);
      onWorkflowStart?.(workflow, execution);
      setViewMode('detail');
    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onWorkflowStart]);

  const handleStopWorkflow = useCallback(async () => {
    if (!currentExecution) return;
    setIsLoading(true);
    try {
      await workflowService.stopExecution(currentExecution.id);
      setCurrentExecution(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      console.error('Failed to stop workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentExecution]);

  const handlePauseWorkflow = useCallback(async () => {
    if (!currentExecution) return;
    setIsLoading(true);
    try {
      await workflowService.pauseExecution(currentExecution.id);
      setCurrentExecution(prev => prev ? { ...prev, status: 'paused' } : null);
    } catch (error) {
      console.error('Failed to pause workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentExecution]);

  const handleResumeWorkflow = useCallback(async () => {
    if (!currentExecution) return;
    setIsLoading(true);
    try {
      await workflowService.resumeExecution(currentExecution.id);
      setCurrentExecution(prev => prev ? { ...prev, status: 'running' } : null);
    } catch (error) {
      console.error('Failed to resume workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentExecution]);

  const handleCreateFromTemplate = async (template: WorkflowTemplate) => {
    setIsLoading(true);
    try {
      const workflow = await workflowService.createFromTemplate(
        template.id,
        `${template.name} - ${new Date().toLocaleDateString()}`
      );
      setWorkflows(prev => [...prev, workflow]);
      setSelectedWorkflow(workflow);
      setViewMode('detail');
    } catch (error) {
      console.error('Failed to create from template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个工作流吗？')) return;
    try {
      await workflowService.deleteWorkflow(workflowId);
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 size={14} className={styles.spinning} />;
      case 'completed':
        return <CheckCircle size={14} className={styles.success} />;
      case 'error':
        return <XCircle size={14} className={styles.error} />;
      case 'paused':
        return <Pause size={14} className={styles.warning} />;
      case 'cancelled':
        return <Square size={14} className={styles.muted} />;
      default:
        return <Clock size={14} className={styles.muted} />;
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'running':
        return styles.statusRunning;
      case 'completed':
        return styles.statusCompleted;
      case 'error':
        return styles.statusError;
      case 'paused':
        return styles.statusPaused;
      default:
        return styles.statusPending;
    }
  };

  const renderStepCard = (step: WorkflowStep, index: number) => {
    const isActive = currentExecution?.currentStepIndex === index;
    const stepStatus = step.status;

    return (
      <div
        key={step.id}
        className={`${styles.stepCard} ${getStatusColor(stepStatus)} ${isActive ? styles.active : ''}`}
      >
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>{index + 1}</div>
          <div className={styles.stepInfo}>
            <div className={styles.stepName}>{step.name}</div>
            <div className={styles.stepType}>{step.type}</div>
          </div>
          <div className={styles.stepStatus}>
            {getStatusIcon(stepStatus)}
          </div>
        </div>
        {step.agentName && (
          <div className={styles.stepMeta}>
            <span className={styles.metaLabel}>智能体：</span>
            <span className={styles.metaValue}>{step.agentName}</span>
          </div>
        )}
        {step.skillName && (
          <div className={styles.stepMeta}>
            <span className={styles.metaLabel}>技能：</span>
            <span className={styles.metaValue}>{step.skillName}</span>
          </div>
        )}
        {step.error && (
          <div className={styles.stepError}>
            <AlertCircle size={12} />
            <span>{step.error}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.workflowPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <GitBranch size={16} />
          <span>工作流</span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerBtn}
            onClick={() => setViewMode('templates')}
            title="从模板创建"
          >
            <Plus size={14} />
          </button>
          <button
            className={styles.headerBtn}
            onClick={() => setViewMode('list')}
            title="工作流列表"
          >
            <Layers size={14} />
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {currentExecution && (
            <div className={styles.executionStatus}>
              <div className={styles.executionHeader}>
                <span>当前执行</span>
                <div className={styles.executionActions}>
                  {currentExecution.status === 'running' && (
                    <>
                      <button onClick={handlePauseWorkflow} title="暂停">
                        <Pause size={12} />
                      </button>
                      <button onClick={handleStopWorkflow} title="停止">
                        <Square size={12} />
                      </button>
                    </>
                  )}
                  {currentExecution.status === 'paused' && (
                    <>
                      <button onClick={handleResumeWorkflow} title="继续">
                        <Play size={12} />
                      </button>
                      <button onClick={handleStopWorkflow} title="停止">
                        <Square size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${currentExecution.progress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                步骤 {currentExecution.currentStepIndex + 1} / {currentExecution.totalSteps}
              </div>
            </div>
          )}

          <div className={styles.workflowList}>
            {isLoading && workflows.length === 0 ? (
              <div className={styles.loading}>
                <Loader2 size={24} className={styles.spinning} />
                <span>加载中...</span>
              </div>
            ) : workflows.length === 0 ? (
              <div className={styles.empty}>
                <GitBranch size={32} />
                <span>暂无工作流</span>
                <button onClick={() => setViewMode('templates')}>
                  从模板创建
                </button>
              </div>
            ) : (
              workflows.map(workflow => {
                const isExpanded = expandedWorkflows.has(workflow.id);
                return (
                  <div key={workflow.id} className={styles.workflowGroup}>
                    <div
                      className={styles.workflowHeader}
                      onClick={() => handleWorkflowToggle(workflow.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <div className={styles.workflowInfo}>
                        <span className={styles.workflowName}>{workflow.name}</span>
                        <span className={styles.workflowSteps}>{workflow.steps.length} 步骤</span>
                      </div>
                      <div className={styles.workflowActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWorkflow(workflow);
                          }}
                          title="运行"
                        >
                          <Play size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className={styles.stepsList}>
                        {workflow.steps.map((step, index) => renderStepCard(step, index))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {viewMode === 'templates' && (
        <div className={styles.templatesView}>
          <div className={styles.templatesHeader}>
            <span>选择模板</span>
          </div>
          <div className={styles.templateCategories}>
            {categories.map(cat => (
              <div key={cat.id} className={styles.templateCategory}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span className={styles.categoryName}>{cat.name}</span>
                </div>
                <div className={styles.templatesList}>
                  {templates
                    .filter(t => t.category === cat.id)
                    .map(template => (
                      <div
                        key={template.id}
                        className={styles.templateCard}
                        onClick={() => handleCreateFromTemplate(template)}
                      >
                        <div className={styles.templateName}>{template.name}</div>
                        <div className={styles.templateDesc}>{template.description}</div>
                        <div className={styles.templateSteps}>
                          {template.steps.length} 步骤
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'detail' && selectedWorkflow && (
        <div className={styles.detailView}>
          <div className={styles.detailHeader}>
            <button onClick={() => setViewMode('list')}>
              ← 返回
            </button>
            <span>{selectedWorkflow.name}</span>
          </div>
          <div className={styles.detailContent}>
            {currentExecution && (
              <div className={styles.executionProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${currentExecution.progress}%` }}
                  />
                </div>
                <div className={styles.progressInfo}>
                  <span>进度: {currentExecution.progress}%</span>
                  <span>步骤 {currentExecution.currentStepIndex + 1}/{currentExecution.totalSteps}</span>
                </div>
              </div>
            )}
            <div className={styles.stepsList}>
              {selectedWorkflow.steps.map((step, index) => renderStepCard(step, index))}
            </div>
          </div>
          <div className={styles.detailActions}>
            {currentExecution?.status === 'running' ? (
              <>
                <button onClick={handlePauseWorkflow}>
                  <Pause size={14} /> 暂停
                </button>
                <button onClick={handleStopWorkflow}>
                  <Square size={14} /> 停止
                </button>
              </>
            ) : currentExecution?.status === 'paused' ? (
              <>
                <button onClick={handleResumeWorkflow}>
                  <Play size={14} /> 继续
                </button>
                <button onClick={handleStopWorkflow}>
                  <Square size={14} /> 停止
                </button>
              </>
            ) : (
              <button onClick={() => handleStartWorkflow(selectedWorkflow)}>
                <Play size={14} /> 运行
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowPanel;
