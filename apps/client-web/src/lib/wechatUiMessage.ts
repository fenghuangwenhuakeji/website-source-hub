type WechatUiMode = 'login' | 'bind';

function fallbackMessage(mode: WechatUiMode, status?: 'pending' | 'expired' | 'success') {
  if (status === 'expired') {
    return '二维码已过期，请重新生成。';
  }

  if (status === 'success') {
    return mode === 'bind' ? '微信绑定成功，请返回应用继续。' : '微信登录成功，请返回应用继续。';
  }

  return mode === 'bind' ? '请在微信中确认绑定。' : '请在微信中确认登录。';
}

export function getWechatInitialMessage(options: { isMock: boolean; mode: WechatUiMode }) {
  return options.isMock
    ? options.mode === 'bind'
      ? '本地调试模式：请在新窗口确认微信绑定。'
      : '本地调试模式：请在新窗口确认微信登录。'
    : options.mode === 'bind'
      ? '新窗口已打开，请使用微信扫码并确认绑定当前账号。'
      : '新窗口已打开，请使用微信扫码并确认登录。';
}

export function normalizeWechatUiMessage(
  message: string | null | undefined,
  options: { mode: WechatUiMode; status?: 'pending' | 'expired' | 'success' },
) {
  const raw = String(message || '').trim();
  if (!raw) {
    return fallbackMessage(options.mode, options.status);
  }

  if (/本地调试模式|微信|二维码|扫码|绑定|登录/.test(raw)) {
    return raw;
  }

  const lower = raw.toLowerCase();

  if (lower.includes('open the new window') && lower.includes('mock wechat login')) {
    return '本地调试模式：请在新窗口确认微信登录。';
  }

  if (lower.includes('open the new window') && lower.includes('wechat binding manually')) {
    return '本地调试模式：请在新窗口确认微信绑定。';
  }

  if (lower.includes('waiting for wechat qr confirmation')) {
    return '请在微信中确认登录。';
  }

  if (lower.includes('waiting for wechat bind confirmation')) {
    return '请在微信中确认绑定。';
  }

  if (lower.includes('wechat login has been confirmed') || lower.includes('wechat login confirmed')) {
    return '本地调试模式：已确认微信登录，请返回应用继续。';
  }

  if (lower.includes('wechat binding confirmed') || lower.includes('the wechat account has been bound')) {
    return '本地调试模式：已确认微信绑定，请返回应用继续。';
  }

  if (lower.includes('wechat binding successful')) {
    return '微信绑定成功，请返回应用继续。';
  }

  if (lower.includes('qr code expired')) {
    return '二维码已过期，请重新生成。';
  }

  if (lower.includes('return to the desktop page to continue')) {
    return options.mode === 'bind' ? '微信绑定成功，请返回应用继续。' : '微信登录成功，请返回应用继续。';
  }

  if (lower.includes('return to the desktop window to continue')) {
    return options.mode === 'bind' ? '本地调试模式：已确认微信绑定，请返回应用继续。' : '本地调试模式：已确认微信登录，请返回应用继续。';
  }

  if (lower.includes('wechat login failed')) {
    return '微信登录失败，请稍后重试。';
  }

  return raw;
}
