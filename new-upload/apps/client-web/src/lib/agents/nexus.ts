/**
 * NEXUS Workflow Engine
 * Inspired by Agency Agents NEXUS Framework
 * Seven-phase pipeline: Discovery → Strategy → Foundation → Build → Harden → Launch → Operate
 */

import { type WorkflowDefinition, type NexusPhase, type PhaseGate, generateId } from './types';
import { logger } from '../logger';

export interface WorkflowSession {
  id: string;
  workflowId: string;
  currentPhase: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  phaseResults: Map<string, PhaseResult>;
  createdAt: number;
  updatedAt: number;
}

export interface PhaseResult {
  phaseId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  artifacts: Record<string, unknown>;
  duration?: number;
  errors?: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  phase: string;
  attempts: number;
  maxAttempts: number;
  feedback?: string;
}

export const NEXUS_PHASES: NexusPhase[] = [
  {
    id: 'phase-0-discovery',
    name: 'Discovery',
    description: 'Market research, user feedback analysis, competitive intelligence',
    agents: ['researcher', 'feedback-synthesizer'],
    gate: { type: 'automatic', criteria: ['research_completed', 'user_needs_identified'] },
    nextPhase: 'phase-1-strategy',
  },
  {
    id: 'phase-1-strategy',
    name: 'Strategy',
    description: 'Architecture design, technology stack decisions, roadmap planning',
    agents: ['architect', 'planner'],
    gate: {
      type: 'quality',
      criteria: ['architecture_approved', 'risks_identified'],
      checker: 'qa-reviewer',
    },
    nextPhase: 'phase-2-foundation',
  },
  {
    id: 'phase-2-foundation',
    name: 'Foundation',
    description: 'CI/CD setup, database schema, core infrastructure, authentication',
    agents: ['devops-automator', 'backend-architect'],
    gate: { type: 'automatic', criteria: ['cicd_operational', 'db_schema_finalized'] },
    nextPhase: 'phase-3-build',
  },
  {
    id: 'phase-3-build',
    name: 'Build',
    description: 'Feature implementation with Dev ↔ QA iteration loop',
    agents: ['frontend-developer', 'backend-developer', 'qa-reviewer'],
    gate: { type: 'quality', criteria: ['all_tests_pass', 'qa_signoff'], checker: 'qa-reviewer' },
    nextPhase: 'phase-4-harden',
  },
  {
    id: 'phase-4-harden',
    name: 'Hardening',
    description: 'Performance optimization, security hardening, integration testing',
    agents: ['security-reviewer', 'performance-benchmarker'],
    gate: {
      type: 'quality',
      criteria: ['security_audit_pass', 'performance_met'],
      checker: 'reality-checker',
    },
    nextPhase: 'phase-5-launch',
  },
  {
    id: 'phase-5-launch',
    name: 'Launch',
    description: 'Marketing prep, deployment automation, user documentation',
    agents: ['growth-hacker', 'content-creator', 'devops-automator'],
    gate: { type: 'approval', criteria: ['deployment_ready', 'marketing_complete'] },
    nextPhase: 'phase-6-operate',
  },
  {
    id: 'phase-6-operate',
    name: 'Operate',
    description: 'Monitoring, user support, continuous improvement',
    agents: ['support-agent', 'monitoring-specialist'],
  },
];

export const NEXUS_WORKFLOW: WorkflowDefinition = {
  id: 'nexus-full',
  name: 'NEXUS Full Pipeline',
  description: 'Complete product lifecycle from discovery to operation',
  phases: NEXUS_PHASES,
  initialPhase: 'phase-0-discovery',
};

export class NexusEngine {
  private sessions: Map<string, WorkflowSession> = new Map();
  private taskQueue: Map<string, TaskItem[]> = new Map();

  createWorkflowSession(workflowId: string = 'nexus-full'): WorkflowSession {
    const session: WorkflowSession = {
      id: generateId(),
      workflowId,
      currentPhase: NEXUS_WORKFLOW.initialPhase,
      status: 'pending',
      phaseResults: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    logger.info('NexusEngine', `Created workflow session: ${session.id}`);

    return session;
  }

  async executePhase(
    sessionId: string,
    phaseId: string,
    executor: (phase: NexusPhase, tasks: TaskItem[]) => Promise<PhaseResult>,
  ): Promise<PhaseResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Workflow session not found: ${sessionId}`);
    }

    const phase = NEXUS_PHASES.find((p) => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }

    session.currentPhase = phaseId;
    session.status = 'running';
    session.updatedAt = Date.now();

    const phaseResult: PhaseResult = {
      phaseId,
      status: 'running',
      artifacts: {},
    };

    const tasks = this.getTasksForPhase(sessionId, phaseId);
    const startTime = Date.now();

    try {
      const result = await executor(phase, tasks);
      phaseResult.status = result.status;
      phaseResult.artifacts = result.artifacts;
      phaseResult.duration = Date.now() - startTime;
      phaseResult.errors = result.errors;

      session.phaseResults.set(phaseId, phaseResult);
      session.updatedAt = Date.now();

      logger.info('NexusEngine', `Phase ${phaseId} completed with status: ${result.status}`);

      return phaseResult;
    } catch (error) {
      phaseResult.status = 'failed';
      phaseResult.duration = Date.now() - startTime;
      phaseResult.errors = [error instanceof Error ? error.message : String(error)];

      session.phaseResults.set(phaseId, phaseResult);
      session.updatedAt = Date.now();

      logger.error('NexusEngine', `Phase ${phaseId} failed:`, error);

      return phaseResult;
    }
  }

  private getTasksForPhase(sessionId: string, _phaseId: string): TaskItem[] {
    return this.taskQueue.get(sessionId) || [];
  }

  addTask(sessionId: string, task: Omit<TaskItem, 'id' | 'attempts' | 'maxAttempts'>): TaskItem {
    const fullTask: TaskItem = {
      ...task,
      id: generateId(),
      attempts: 0,
      maxAttempts: 3,
    };

    const tasks = this.taskQueue.get(sessionId) || [];
    tasks.push(fullTask);
    this.taskQueue.set(sessionId, tasks);

    logger.info('NexusEngine', `Added task: ${fullTask.title} to session: ${sessionId}`);

    return fullTask;
  }

  updateTaskStatus(
    sessionId: string,
    taskId: string,
    status: TaskItem['status'],
    feedback?: string,
  ): void {
    const tasks = this.taskQueue.get(sessionId);
    if (!tasks) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      if (feedback) task.feedback = feedback;
      if (status === 'in_progress') task.attempts++;
    }
  }

  async evaluateGate(gate: PhaseGate, results: Map<string, unknown>): Promise<boolean> {
    if (gate.type === 'automatic') {
      return gate.criteria.every((c) => results.has(c));
    }

    if (gate.type === 'quality' && gate.checker) {
      logger.info('NexusEngine', `Quality gate evaluation with checker: ${gate.checker}`);
      return true;
    }

    return true;
  }

  getNextPhase(currentPhaseId: string): string | null {
    const phase = NEXUS_PHASES.find((p) => p.id === currentPhaseId);
    return phase?.nextPhase || null;
  }

  getWorkflowSession(sessionId: string): WorkflowSession | undefined {
    return this.sessions.get(sessionId);
  }

  pauseWorkflow(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.updatedAt = Date.now();
    }
  }

  resumeWorkflow(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'running';
      session.updatedAt = Date.now();
    }
  }
}

export const nexusEngine = new NexusEngine();
