import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Play } from 'lucide-react';
import styles from './TaskListPanel.module.scss';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number;
  timestamp?: number;
}

interface TaskListPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStart?: (task: Task) => void;
}

const TaskListPanel: React.FC<TaskListPanelProps> = ({
  tasks,
  onTaskClick,
  onTaskStart,
}) => {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={14} className={styles.iconCompleted} />;
      case 'in_progress':
        return <Clock size={14} className={styles.iconProgress} />;
      case 'error':
        return <AlertCircle size={14} className={styles.iconError} />;
      default:
        return <Circle size={14} className={styles.iconPending} />;
    }
  };

  const getStatusClass = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return styles.completed;
      case 'in_progress':
        return styles.inProgress;
      case 'error':
        return styles.error;
      default:
        return styles.pending;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>任务</span>
        <span className={styles.count}>{tasks.length}</span>
      </div>
      <div className={styles.taskList}>
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <span>暂无任务</span>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskItem} ${getStatusClass(task.status)}`}
              onClick={() => onTaskClick?.(task)}
            >
              <div className={styles.taskHeader}>
                {getStatusIcon(task.status)}
                <span className={styles.taskTitle}>{task.title}</span>
                {task.status === 'pending' && onTaskStart && (
                  <button
                    className={styles.startBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskStart(task);
                    }}
                  >
                    <Play size={12} />
                  </button>
                )}
              </div>
              {task.description && (
                <span className={styles.taskDesc}>{task.description}</span>
              )}
              {task.status === 'in_progress' && task.progress !== undefined && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskListPanel;
