// 文件路径: js/core/05_database.js
// 描述: 使用 IndexedDB 管理应用数据，解决 localStorage 存储限制问题。

(function(window) {
    'use strict';

    const DB_NAME = 'GenesisEngineDB'; // 修改了数据库名称以避免冲突
    const DB_VERSION = 1;
    const PROJECT_STORE_NAME = 'projects';
    const CHARACTER_STORE_NAME = 'characters'; // 为角色卡组预留

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
                if (!tempDb.objectStoreNames.contains(PROJECT_STORE_NAME)) {
                    tempDb.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
                    console.log(`对象存储 '${PROJECT_STORE_NAME}' 创建成功。`);
                }
                if (!tempDb.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
                    tempDb.createObjectStore(CHARACTER_STORE_NAME, { keyPath: 'id' });
                     console.log(`对象存储 '${CHARACTER_STORE_NAME}' 创建成功。`);
                }
            };
        });
    }

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
                // 确保事务模式正确
                const mode = (action === 'get' || action === 'getAll') ? 'readonly' : 'readwrite';
                const transaction = db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                
                // getAll不需要参数
                const request = (action === 'getAll') ? store[action]() : store[action](data);

                request.onerror = (event) => {
                    console.error(`数据库操作 '${action}' 失败:`, event.target.error);
                    reject(`数据库操作 '${action}' 失败`);
                };

                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
            } catch (error) {
                console.error(`执行数据库操作 '${action}' 时发生异常:`, error);
                reject(error);
            }
        });
    }

    // 暴露公共 API
    window.appDB = {
        initDB,
        // 项目相关的数据库方法
        saveProject: (project) => dbAction(PROJECT_STORE_NAME, 'put', project),
        getProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'get', projectId),
        getAllProjects: () => dbAction(PROJECT_STORE_NAME, 'getAll'),
        deleteProject: (projectId) => dbAction(PROJECT_STORE_NAME, 'delete', projectId),
        
        // 角色相关的数据库方法 (预留)
        saveCharacter: (character) => dbAction(CHARACTER_STORE_NAME, 'put', character),
        getCharacter: (characterId) => dbAction(CHARACTER_STORE_NAME, 'get', characterId),
        getAllCharacters: () => dbAction(CHARACTER_STORE_NAME, 'getAll'),
        deleteCharacter: (characterId) => dbAction(CHARACTER_STORE_NAME, 'delete', characterId)
    };

})(window);