import styles from './index.module.scss';

type AccessLoadingProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  steps?: string[];
  compact?: boolean;
};

const DEFAULT_STEPS = ['连接账号状态', '同步应用权限', '准备凤煌桌面'];

export default function AccessLoading({
  eyebrow = '凤煌 Access',
  title = '正在进入凤煌工作台',
  description = '我们正在为你同步账号、权限和应用入口，很快就好。',
  steps = DEFAULT_STEPS,
  compact = false,
}: AccessLoadingProps) {
  return (
    <div className={`${styles.shell} ${compact ? styles.compact : ''}`}>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
      <section className={styles.card} aria-live="polite" aria-busy="true">
        <div className={styles.brandMark}>
          <img src="/access/favicon.png" alt="" />
          <span />
        </div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.progressBar}>
          <span />
        </div>
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div key={step} className={styles.step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
