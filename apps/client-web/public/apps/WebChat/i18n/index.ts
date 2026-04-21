import i18next from 'i18next';
import zh from './zh';
import en from './en';

i18next.addResourceBundle('zh', 'webChat', zh, true, true);
i18next.addResourceBundle('en', 'webChat', en, true, true);

export { zh, en };
