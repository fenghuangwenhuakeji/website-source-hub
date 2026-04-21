// sw.js - 离线支持服务工作线程

const CACHE_NAME = 'mo-zhu-cache-v1';
const urlsToCache = [
    './',
    './Gemini聊天室.html',
    './style.css',
    './script.js',
    './prompts.js',
    './css/base.css',
    './css/chat.css',
    './css/components.css',
    './css/panels.css',
    './css/themes/bamboo-green.css',
    './css/themes/dark-theme.css',
    './css/themes/ocean-blue.css',
    './css/themes/sakura-pink.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
];

// 安装 Service Worker 并缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                // 对于跨域资源，使用 no-cors 模式可以缓存，但无法读取内容
                const requests = urlsToCache.map(url => {
                    if (url.startsWith('http')) {
                        return new Request(url, { mode: 'cors' });
                    }
                    return url;
                });
                return cache.addAll(requests).catch(error => {
                    console.error('Failed to cache URLs:', error);
                });
            })
    );
});

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 拦截网络请求，优先从缓存提供资源
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有匹配的响应，则返回它
                if (response) {
                    return response;
                }

                // 否则，正常发起网络请求，并将其添加到缓存中
                return fetch(event.request).then(
                    response => {
                        // 仅缓存有效的响应
                        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});