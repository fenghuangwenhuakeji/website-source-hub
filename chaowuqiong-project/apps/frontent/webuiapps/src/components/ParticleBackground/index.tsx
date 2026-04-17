import React from 'react';
import styles from './index.module.scss';

/**
 * 紫色星空背景组件
 * 静态星空背景，无动画，不晃眼
 */
export default function StarryBackground() {
  // 生成静态星星
  const generateStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 5,
    }));
  };

  const stars = generateStars(150);
  const shootingStars = [
    { id: 1, top: '20%', delay: '0s', duration: '3s' },
    { id: 2, top: '60%', delay: '2s', duration: '4s' },
    { id: 3, top: '40%', delay: '5s', duration: '3.5s' },
  ];

  return (
    <div className={styles.starryBackground}>
      {/* 渐变背景层 */}
      <div className={styles.gradientLayer} />
      
      {/* 星云层 */}
      <div className={styles.nebulaLayer}>
        <div className={styles.nebula1} />
        <div className={styles.nebula2} />
        <div className={styles.nebula3} />
      </div>
      
      {/* 星星层 */}
      <div className={styles.starsLayer}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>
      
      {/* 流星层 */}
      <div className={styles.shootingStarsLayer}>
        {shootingStars.map((star) => (
          <div
            key={star.id}
            className={styles.shootingStar}
            style={{
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
