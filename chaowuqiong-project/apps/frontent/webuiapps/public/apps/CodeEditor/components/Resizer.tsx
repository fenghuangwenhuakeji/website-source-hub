import React from 'react';
import styles from './Resizer.module.scss';

interface ResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing?: boolean;
  direction?: 'horizontal' | 'vertical';
}

const Resizer: React.FC<ResizerProps> = ({
  onMouseDown,
  isResizing = false,
  direction = 'horizontal',
}) => {
  return (
    <div
      className={`${styles.resizer} ${styles[direction]} ${isResizing ? styles.resizing : ''}`}
      onMouseDown={onMouseDown}
    />
  );
};

export default Resizer;
