import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type WeChatGroupPromoProps = {
  variant?: 'home' | 'register';
  autoOpen?: boolean;
  sessionKey?: string;
};

const groupQrSrc = `${import.meta.env.BASE_URL}images/wechat-group-qr.png`;

const variantContent = {
  home: {
    badge: '官方社群入口',
    titleLines: ['加入凤煌官方微信群', '第一时间获取最新动态'],
    description:
      '欢迎加入凤煌官方微信群，获取产品更新、活动通知、使用答疑与社群交流。无论你是创作者、体验用户还是合作伙伴，都可以在这里保持连接。',
    bullets: ['产品更新与版本动态优先通知', '使用答疑、意见反馈与社群交流', '活动福利、内测名额与合作信息同步'],
    note: '申请入群时可备注“官网来访”或你的关注方向，便于我们更快处理。',
    primaryLabel: '查看入群二维码',
    secondaryLabel: '注册官网账号',
    secondaryHref: '/register',
    modalTitle: '欢迎加入凤煌官方微信群',
    modalDescription:
      '如果你希望及时了解凤煌的产品更新、活动信息与创作动态，欢迎扫码申请加入官方群，我们会在群内同步通知并提供交流支持。',
  },
  register: {
    badge: '注册后保持联系',
    titleLines: ['注册账号后', '欢迎加入凤煌官方社群'],
    description:
      '完成注册后，你可以继续通过官方微信群获取产品更新、活动通知、使用答疑与社群交流，方便第一时间掌握后续动态。',
    bullets: [],
    note: '移动端可长按保存二维码，再到微信中识别加入。',
    primaryLabel: '查看官方群二维码',
    secondaryLabel: '打开二维码大图',
    secondaryHref: groupQrSrc,
    modalTitle: '欢迎加入凤煌官方微信群',
    modalDescription:
      '注册完成后，建议同步加入官方群，便于接收产品动态、活动通知与使用支持，也能更方便地参与后续交流。',
  },
} as const;

export function WeChatGroupPromo({
  variant = 'home',
  autoOpen = false,
  sessionKey = 'fh-wechat-group-register-modal-shown',
}: WeChatGroupPromoProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const content = variantContent[variant];

  useEffect(() => {
    if (!autoOpen || typeof window === 'undefined') {
      return;
    }

    if (sessionKey && window.sessionStorage.getItem(sessionKey) === '1') {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsModalOpen(true);
      if (sessionKey) {
        window.sessionStorage.setItem(sessionKey, '1');
      }
    }, 480);

    return () => window.clearTimeout(timer);
  }, [autoOpen, sessionKey]);

  useEffect(() => {
    if (!isModalOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <>
      <section className={`community-promo community-promo--${variant}`}>
        <div className="community-promo-copy">
          <div className="community-promo-badge">{content.badge}</div>
          <h2>
            {content.titleLines.map((line) => (
              <span key={line} className="community-promo-title-line">
                {line}
              </span>
            ))}
          </h2>
          <p>{content.description}</p>
          {content.bullets.length ? (
            <div className="community-promo-benefits">
              {content.bullets.map((item) => (
                <div key={item} className="community-promo-benefit">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
          <p className="community-promo-note">{content.note}</p>
          <div className="community-promo-actions">
            <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              {content.primaryLabel}
            </button>
            {variant === 'home' ? (
              <Link to={content.secondaryHref} className="btn btn-secondary">
                {content.secondaryLabel}
              </Link>
            ) : (
              <a href={content.secondaryHref} target="_blank" rel="noreferrer" className="btn btn-secondary">
                {content.secondaryLabel}
              </a>
            )}
          </div>
        </div>

        <div className="community-promo-visual">
          <div className="community-promo-card">
            <div className="community-promo-label">凤煌官方微信群</div>
            <div className="community-promo-qr">
              <img src={groupQrSrc} alt="凤煌官方微信群二维码" />
            </div>
            <div className="community-promo-caption">
              <strong>扫码申请加入官方群</strong>
              <span>获取产品更新、活动通知、使用答疑与社群交流。</span>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="community-modal-overlay" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div
            className="community-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`community-modal-title-${variant}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="community-modal-close"
              aria-label="关闭官方群二维码弹窗"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>

            <div className="community-modal-copy">
              <div className="community-promo-badge">{content.badge}</div>
              <h3 id={`community-modal-title-${variant}`}>{content.modalTitle}</h3>
              <p>{content.modalDescription}</p>
              <div className="community-modal-tip">
                <span>加入社群后可获得</span>
                <strong>产品更新通知、活动信息与使用支持，重要动态不会错过。</strong>
              </div>
              <div className="community-promo-actions">
                <a href={groupQrSrc} target="_blank" rel="noreferrer" className="btn btn-primary">
                  打开二维码大图
                </a>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  我知道了
                </button>
              </div>
            </div>

            <div className="community-modal-qr">
              <img src={groupQrSrc} alt="凤煌官方微信群二维码大图" />
              <span>微信扫码申请加入官方群</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
