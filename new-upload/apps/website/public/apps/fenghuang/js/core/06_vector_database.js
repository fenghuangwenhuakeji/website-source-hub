// 文件路径: js/core/06_vector_database.js
// 描述: 为向量化核心记忆创建一个独立的 IndexedDB 数据库。

(function(window) {
    'use strict';

    const DB_NAME = 'VectorCoreDB';
    const DB_VERSION = 1;
    const STORES = {
        worldview: 'worldview_store',
        clues: 'clues_store',
        maps: 'maps_store',
        characters: 'character_status_store' // 核心人物状态池
    };

    let db;

    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) {
                return resolve();
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('VectorCoreDB 数据库打开失败:', event.target.error);
                reject('VectorCoreDB 数据库打开失败');
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('VectorCoreDB 数据库打开成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                console.log('VectorCoreDB 数据库升级中...');
                const tempDb = event.target.result;
                for (const key in STORES) {
                    if (!tempDb.objectStoreNames.contains(STORES[key])) {
                        tempDb.createObjectStore(STORES[key], { keyPath: 'id', autoIncrement: true });
                        console.log(`对象存储 '${STORES[key]}' 创建成功。`);
                    }
                }
            };
        });
    }

    function dbAction(storeName, action, data) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('VectorCoreDB 未初始化');
            
            try {
                const mode = (action.startsWith('get')) ? 'readonly' : 'readwrite';
                const transaction = db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                const request = store[action](data);

                request.onerror = (event) => reject(`VectorDB 操作 '${action}' 失败: ${event.target.error}`);
                request.onsuccess = (event) => resolve(event.target.result);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // 生成通用CRUD方法
    const dbMethods = {};
    for (const key in STORES) {
        const storeName = STORES[key];
        // 'clues' -> 'Clue', 'worldview' -> 'Worldview'
        const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
        const singularCapitalized = singularKey.charAt(0).toUpperCase() + singularKey.slice(1);
        
        // 'clues' -> 'Clues', 'worldview' -> 'Worldview'
        const pluralCapitalized = key.charAt(0).toUpperCase() + key.slice(1);

        dbMethods[`save${singularCapitalized}`] = (item) => dbAction(storeName, 'put', item);
        dbMethods[`get${singularCapitalized}`] = (id) => dbAction(storeName, 'get', id);
        dbMethods[`getAll${pluralCapitalized}`] = () => dbAction(storeName, 'getAll');
        dbMethods[`delete${singularCapitalized}`] = (id) => dbAction(storeName, 'delete', id);
    }

    window.vectorDB = {
        initDB,
        ...dbMethods
    };

})(window);