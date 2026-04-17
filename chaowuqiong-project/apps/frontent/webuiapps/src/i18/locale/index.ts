import en from './en/en.json';
import es from './es/es.json';
import pt from './pt/pt.json';
import zh from './zh/zh.json';
import ja from './ja/ja.json';
import webChatEn from '../namespaces/webChat/en';
import webChatZh from '../namespaces/webChat/zh';

export default {
  en: {
    ...en,
    webChat: webChatEn,
  },
  es,
  pt,
  zh: {
    ...zh,
    webChat: webChatZh,
  },
  ja,
};
