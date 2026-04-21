import i18n from '@/i18';
import zh from './zh';
import en from './en';

if (!i18n.hasResourceBundle('zh', 'webChat')) {
  i18n.addResourceBundle('zh', 'webChat', zh, true, true);
}

if (!i18n.hasResourceBundle('en', 'webChat')) {
  i18n.addResourceBundle('en', 'webChat', en, true, true);
}

export { zh, en };
