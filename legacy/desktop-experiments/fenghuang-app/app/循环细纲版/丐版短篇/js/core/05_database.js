// 文件路径: js/core/05_database.js
// 描述: 为“丐版短篇”模块提供独立的IndexedDB数据管理。

(function(window) {
    'use strict';

    const DB_NAME = 'ShortStoryDB';
    const DB_VERSION = 1;
    const PROJECT_STORE_NAME = 'projects';
    const SETTINGS_STORE_NAME = 'settings';

    let db;

    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve();
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('数据库打开失败 (ShortStoryDB):', event.target.error);
                reject('数据库打开失败');
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('数据库打开成功 (ShortStoryDB)');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const tempDb = event.target.result;
                if (!tempDb.objectStoreNames.contains(PROJECT_STORE_NAME)) {
                    tempDb.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
                }
                if (!tempDb.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                    // 使用'key'作为键路径来存储键值对
                    tempDb.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }

    function dbAction(storeName, action, data) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('数据库未初始化');
            try {
                const mode = (action === 'get' || action === 'getAll') ? 'readonly' : 'readwrite';
                const transaction = db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                const request = (action === 'getAll') ? store[action]() : store[action](data);

                request.onerror = (event) => reject(`数据库操作 '${action}' 失败: ${event.target.error}`);
                request.onsuccess = (event) => resolve(event.target.result);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 暴露公共 API
    window.shortStoryDB = {
        initDB,
        saveProject: (project) => dbAction(PROJECT_STORE_NAME, 'put', project),
        getProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'get', projectId),
        getAllProjects: () => dbAction(PROJECT_STORE_NAME, 'getAll'),
        deleteProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'delete', projectId),
        
        // API设置相关的数据库方法
        saveSetting: (key, value) => dbAction(SETTINGS_STORE_NAME, 'put', { key, value }),
        getSetting: async (key) => {
            const result = await dbAction(SETTINGS_STORE_NAME, 'get', key);
            return result ? result.value : undefined;
        }
    };

})(window);