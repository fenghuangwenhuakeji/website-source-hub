// 文件路径: 网页promax/js/database.js
// 描述: 使用 IndexedDB 管理应用数据，解决 localStorage 存储限制问题。

(function(window) {
    'use strict';

    const DB_NAME = 'Promax_MojuDatabase';
    const DB_VERSION = 3; // Increment version to trigger upgrade
    const PROMPT_STORE_NAME = 'prompts';
    const PROJECT_STORE_NAME = 'projects';
    const SETTINGS_STORE_NAME = 'settings';

    let db;

    /**
     * 初始化 IndexedDB 数据库。
     * @returns {Promise<void>}
     */
    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) {
                return resolve();
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('数据库打开失败:', event.target.error);
                reject('数据库打开失败');
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('数据库打开成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                console.log('数据库升级中...');
                const tempDb = event.target.result;
                if (!tempDb.objectStoreNames.contains(PROMPT_STORE_NAME)) {
                    tempDb.createObjectStore(PROMPT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    console.log(`对象存储 '${PROMPT_STORE_NAME}' 创建成功。`);
                }
                if (!tempDb.objectStoreNames.contains(PROJECT_STORE_NAME)) {
                    tempDb.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
                    console.log(`对象存储 '${PROJECT_STORE_NAME}' 创建成功。`);
               }
               if (!tempDb.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                   tempDb.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
                   console.log(`对象存储 '${SETTINGS_STORE_NAME}' 创建成功。`);
               }
            };
        });
    }

    /**
     * 将所有提示词保存到 IndexedDB。
     * 为了简化操作，我们每次都清空旧数据，然后存入新数据。
     * @param {Array<Object>} prompts - 要保存的提示词数组。
     * @returns {Promise<void>}
     */
    function savePrompts(prompts) {
        return new Promise((resolve, reject) => {
            if (!db) {
                return reject('数据库未初始化');
            }
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            
            // 1. 清空存储
            const clearRequest = store.clear();
            clearRequest.onerror = (event) => {
                console.error('清空提示词存储失败:', event.target.error);
                reject('清空提示词存储失败');
            };

            clearRequest.onsuccess = () => {
                // 2. 逐条添加新提示词
                if (prompts.length === 0) {
                    console.log('提示词列表为空，存储已清空。');
                    return resolve();
                }
                
                let addedCount = 0;
                prompts.forEach(prompt => {
                    // IndexedDB 自动生成主键，所以不需要传入 id
                    const { id, ...promptData } = prompt;
                    const addRequest = store.add(promptData);
                    addRequest.onsuccess = () => {
                        addedCount++;
                        if (addedCount === prompts.length) {
                            console.log('所有提示词已成功保存到 IndexedDB。');
                            resolve();
                        }
                    };
                    addRequest.onerror = (event) => {
                        console.error('添加提示词失败:', event.target.error);
                        // 即使部分失败，也尝试继续
                    };
                });
            };

            transaction.oncomplete = () => {
                console.log('保存提示词事务完成。');
            };
            
            transaction.onerror = (event) => {
                console.error('保存提示词事务失败:', event.target.error);
                reject('保存提示词事务失败');
            };
        });
    }

    /**
     * 从 IndexedDB 加载所有提示词。
     * @returns {Promise<Array<Object>>}
     */
    function getPrompts() {
        return new Promise((resolve, reject) => {
            if (!db) {
                return reject('数据库未初始化');
            }
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readonly');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            const request = store.getAll();

            request.onerror = (event) => {
                console.error('获取提示词失败:', event.target.error);
                reject('获取提示词失败');
            };

            request.onsuccess = (event) => {
                console.log('从 IndexedDB 成功加载提示词。');
                // 为每个对象添加一个唯一的 id，以兼容原代码逻辑
                const promptsWithId = event.target.result.map((item, index) => ({ ...item, id: index }));
                resolve(promptsWithId);
            };
        });
    }

    // 暴露公共 API
    window.appDB = {
        initDB,
        savePrompts,
        getPrompts,

        // 项目相关的数据库方法
        saveProject: (project) => dbAction(PROJECT_STORE_NAME, 'put', project),
        getProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'get', projectId),
        getAllProjects: () => dbAction(PROJECT_STORE_NAME, 'getAll'),
        deleteProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'delete', projectId),
        clearProjects: () => dbAction(PROJECT_STORE_NAME, 'clear'),

        // API设置相关的数据库方法
        saveSetting: (key, value) => dbAction(SETTINGS_STORE_NAME, 'put', { key, value }),
        getSetting: async (key) => {
            const result = await dbAction(SETTINGS_STORE_NAME, 'get', key);
            return result ? result.value : undefined;
        },
        getAllSettings: () => dbAction(SETTINGS_STORE_NAME, 'getAll')
    };

    /**
     * 通用的数据库操作函数，简化代码。
     * @param {string} storeName - 对象存储的名称。
     * @param {string} action - 'put', 'get', 'getAll', 'delete'。
     * @param {*} [data] - 要操作的数据。
     * @returns {Promise<any>}
     */
    function dbAction(storeName, action, data) {
        return new Promise((resolve, reject) => {
            if (!db) {
                return reject('数据库未初始化');
            }
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store[action](data);

                request.onerror = (event) => {
                    console.error(`数据库操作 '${action}' 失败:`, event.target.error);
                    reject(`数据库操作 '${action}' 失败`);
                };

                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

})(window);