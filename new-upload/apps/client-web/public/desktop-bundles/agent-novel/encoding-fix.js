(function attachEncodingFix() {
  const replacements = [
    ['閫夋嫨涓€涓細璇濓紝鎴栬€呯洿鎺ヨ緭鍏ョ洰鏍囥€?', '选择一个会话，或者直接输入目标。'],
    ['姝ｅ湪鍙戦€佲€滀綘濂解€濇祴璇曞綋鍓嶆帴鍙?..', '正在发送“你好”测试当前接口...'],
    ['宸叉敹鍒拌繑鍥烇細', '已收到返回：'],
    ['娴嬭瘯鎺ュ彛澶辫触', '测试接口失败'],
    ['姝ｅ湪鍑嗗娴佸紡鎵ц...', '正在准备流式执行...'],
    ['妫€娴嬪埌瀹屾垚鏍囧織锛屽凡鑷姩鍋滄绛夊緟銆?', '检测到完成标志，已自动停止等待。'],
    ['浠诲姟宸叉墜鍔ㄥ仠姝€?', '任务已手动停止。'],
    ['浠诲姟鎵ц涓?', '任务执行中'],
    ['娴佸紡鎵ц澶辫触', '流式执行失败'],
    ['杩愯涓?..', '运行中...'],
    ['澶勭悊涓?..', '处理中...'],
    ['鍔犲叆涓?..', '加入中...'],
    ['鐩存帴杩愯', '直接运行'],
    ['鍔犲叆浠诲姟', '加入任务'],
    ['鍔犲叆骞惰繍琛?', '加入并运行'],
    ['鐢熸垚 SPEC', '生成 SPEC'],
    ['绛夊緟杩愯', '等待运行'],
    ['绛夊緟鍒嗘瀽', '等待分析'],
    ['鏀惰捣', '收起'],
    ['灞曞紑', '展开'],
    ['鎶樺彔', '折叠'],
    ['宸︽爮', '左栏'],
    ['鍙虫爮', '右栏'],
    ['鑱氱劍', '聚焦'],
    ['鏈粦瀹?', '未绑定'],
    ['鍒氬垱寤?', '刚创建'],
    ['寰呭懡', '待命'],
    ['棰嗗煙', '领域'],
    ['妯″紡', '模式'],
    ['涓绘帶', '主控'],
    ['鎺у埗', '控制'],
    ['璋冨害闈㈡澘', '调度面板'],
    ['鏅鸿兘浣撻€夋嫨', '智能体选择'],
    ['鍏抽敭璇嶆绱?', '关键词检索'],
    ['褰撳墠璋冨害', '当前调度'],
    ['鎵ц娴佺▼', '执行流程'],
    ['宸ュ叿涓庡懡浠?', '工具与命令'],
    ['瀵硅瘽鍒楄〃', '对话列表'],
    ['鏈€杩戜細璇?', '最近会话'],
    ['杩樻病鏈変細璇?', '还没有会话'],
    ['杩炴帴涓庤缃?', '连接与设置'],
    ['绛夊緟鍏变韩浼氳瘽', '等待共享会话'],
    ['鏈€缁堣緭鍑?', '最终输出'],
    ['鎵ц缁撴灉', '执行结果'],
    ['澶嶅埗缁撴灉', '复制结果'],
    ['娴佸紡璋冭瘯', '流式调试'],
    ['鍋滄浠诲姟', '停止任务'],
    ['缂栨帓', '编排'],
    ['鍐欎綔', '写作'],
    ['婕墽', '漫剧'],
    ['涓栫晫瑙?', '世界观'],
    ['瑙掕壊', '角色'],
    ['瀵圭櫧', '对白'],
    ['鍒嗛暅', '分镜'],
    ['鎻愮ず璇?', '提示词'],
  ].sort((left, right) => right[0].length - left[0].length);

  const textAttributes = ['title', 'placeholder', 'aria-label'];
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

  function normalizeText(value) {
    let next = String(value || '');
    for (const [bad, good] of replacements) {
      if (next.includes(bad)) {
        next = next.split(bad).join(good);
      }
    }
    return next;
  }

  function normalizeAttributes(element) {
    for (const attribute of textAttributes) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const normalized = normalizeText(current);
      if (normalized !== current) {
        element.setAttribute(attribute, normalized);
      }
    }
  }

  function normalizeTextNode(node) {
    const current = node.nodeValue;
    if (!current || !current.trim()) return;
    const normalized = normalizeText(current);
    if (normalized !== current) {
      node.nodeValue = normalized;
    }
  }

  function normalizeTree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    if (skipTags.has(root.tagName)) {
      return;
    }

    normalizeAttributes(root);

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || skipTags.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let current = walker.nextNode();
    while (current) {
      normalizeTextNode(current);
      current = walker.nextNode();
    }

    for (const element of root.querySelectorAll('*')) {
      if (!skipTags.has(element.tagName)) {
        normalizeAttributes(element);
      }
    }
  }

  let scheduled = false;

  function scheduleNormalize(root) {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      normalizeTree(root || document.body || document.documentElement);
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        normalizeTextNode(mutation.target);
        continue;
      }

      if (mutation.type === 'attributes') {
        normalizeAttributes(mutation.target);
        continue;
      }

      for (const node of mutation.addedNodes) {
        scheduleNormalize(node);
      }
    }
  });

  function start() {
    normalizeTree(document.body || document.documentElement);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: textAttributes,
    });
    window.setTimeout(() => normalizeTree(document.body || document.documentElement), 120);
    window.setTimeout(() => normalizeTree(document.body || document.documentElement), 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
