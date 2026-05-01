(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readState(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeState(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function fillForm(form, values) {
    Array.from(form.elements).forEach((element) => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
        return;
      }
      if (!element.name || values[element.name] == null) {
        return;
      }
      element.value = values[element.name];
    });
  }

  function collectForm(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = String(value);
    });
    return data;
  }

  function renderCards(container, cards) {
    if (!cards.length) {
      container.innerHTML = '<div class="empty-block"><strong>还没有生成内容</strong><span>先填写左侧信息，再点击生成。</span></div>';
      return;
    }

    container.innerHTML = cards
      .map((card) => {
        const bullets = Array.isArray(card.bullets)
          ? `<ul>${card.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : '';

        const prose = Array.isArray(card.paragraphs)
          ? card.paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join('')
          : card.paragraph
            ? `<p>${escapeHtml(card.paragraph)}</p>`
            : '';

        return `<article class="result-card"><h4>${escapeHtml(card.title)}</h4>${card.subtitle ? `<p>${escapeHtml(card.subtitle)}</p>` : ''}${bullets}${prose}</article>`;
      })
      .join('');
  }

  function initGeneratorPage(config) {
    const form = document.getElementById('workspace-form');
    const output = document.getElementById('result-grid');
    const summary = document.getElementById('result-summary');
    const status = document.getElementById('status-text');
    const generateButton = document.getElementById('generate-button');
    const resetButton = document.getElementById('reset-button');

    if (!form || !output) {
      return;
    }

    const savedState = readState(config.storageKey, { form: config.defaults || {}, cards: [] });
    fillForm(form, savedState.form || {});
    renderCards(output, savedState.cards || []);
    if (summary) {
      summary.textContent = savedState.summary || config.summary;
    }

    const regenerate = () => {
      const formData = collectForm(form);
      const cards = config.generate(formData);
      renderCards(output, cards);
      if (summary) {
        summary.textContent = config.buildSummary ? config.buildSummary(formData) : config.summary;
      }
      if (status) {
        status.textContent = '已根据当前输入更新内容。';
      }
      writeState(config.storageKey, {
        form: formData,
        cards,
        summary: summary ? summary.textContent : config.summary,
      });
    };

    generateButton?.addEventListener('click', regenerate);
    resetButton?.addEventListener('click', () => {
      form.reset();
      renderCards(output, []);
      if (summary) {
        summary.textContent = config.summary;
      }
      if (status) {
        status.textContent = '已清空本页草稿。';
      }
      writeState(config.storageKey, { form: config.defaults || {}, cards: [], summary: config.summary });
    });
  }

  function renderMessages(container, messages) {
    if (!messages.length) {
      container.innerHTML = '<div class="empty-block"><strong>还没有聊天记录</strong><span>发第一条消息后，这里会保存你的创作上下文。</span></div>';
      return;
    }

    container.innerHTML = messages
      .map(
        (item) => `<article class="message ${item.role}"><div class="message-meta"><strong>${item.role === 'user' ? '你' : '创作助手'}</strong><span>${escapeHtml(item.time)}</span></div><p>${escapeHtml(item.content)}</p></article>`,
      )
      .join('');
  }

  function initChatPage(config) {
    const list = document.getElementById('message-list');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');

    if (!list || !input) {
      return;
    }

    const state = readState(config.storageKey, { messages: [] });

    function sync() {
      renderMessages(list, state.messages);
      writeState(config.storageKey, state);
    }

    function send() {
      const value = input.value.trim();
      if (!value) {
        return;
      }
      const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      state.messages.push({ role: 'user', content: value, time });
      state.messages.push({ role: 'assistant', content: config.respond(value, state.messages), time });
      input.value = '';
      sync();
      list.scrollTop = list.scrollHeight;
    }

    sendButton?.addEventListener('click', send);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    clearButton?.addEventListener('click', () => {
      state.messages = [];
      sync();
    });

    document.querySelectorAll('[data-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.getAttribute('data-prompt') || '';
        input.focus();
      });
    });

    sync();
  }

  window.FHExpansion = {
    initGeneratorPage,
    initChatPage,
  };
})();
