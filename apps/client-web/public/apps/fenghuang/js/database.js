let db;

const DB_NAME = 'AI_Novel_Generator_DB';
const DB_VERSION = 3; // 版本升级以触发 onupgradeneeded
const PROJECTS_STORE_NAME = 'projects';
const SETTINGS_STORE_NAME = 'settings';
const CHARACTERS_STORE_NAME = 'characters';
const CONFIGS_STORE_NAME = 'modelConfigs';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 创建项目对象存储空间 (类似数据库中的表)
            if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
                db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }

            // 创建设置对象存储空间
            if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
            }

            // 创建角色对象存储空间
            if (!db.objectStoreNames.contains(CHARACTERS_STORE_NAME)) {
                const characterStore = db.createObjectStore(CHARACTERS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                characterStore.createIndex('projectId', 'projectId', { unique: false });
            }

            // 创建模型配置对象存储空间
            if (!db.objectStoreNames.contains(CONFIGS_STORE_NAME)) {
                db.createObjectStore(CONFIGS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('数据库初始化成功');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('数据库初始化失败:', event.target.error);
            reject(event.target.error);
        };
    });
}

// --- Settings Functions ---
async function saveSettings(settings) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        // 'settings' 存储空间只有一个对象，id固定为1
        const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.put({ id: 1, ...settings });

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('保存设置失败: ' + event.target.error);
    });
}

async function getSettings() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.get('globalSettings'); // 使用固定键名

        request.onsuccess = (event) => resolve(event.target.result || { id: 'globalSettings' });
        request.onerror = (event) => reject('读取设置失败: ' + event.target.error);
    });
}


// --- Project Functions ---
async function saveProject(projectData) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = projectData.id ? store.put(projectData) : store.add(projectData);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('保存项目失败: ' + event.target.error);
    });
}

async function getProject(id) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('读取项目失败: ' + event.target.error);
    });
}

async function getAllProjects() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('读取所有项目失败: ' + event.target.error);
    });
}

// --- Character Functions ---
async function saveCharacter(characterData) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHARACTERS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CHARACTERS_STORE_NAME);
        // 如果 characterData.id 存在，put 会更新；如果不存在，put 会添加 (因为有 autoIncrement)
        const request = store.put(characterData);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('保存角色失败: ' + event.target.error);
    });
}

async function getAllCharactersByProjectId(projectId) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHARACTERS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(CHARACTERS_STORE_NAME);
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('按项目ID读取角色失败: ' + event.target.error);
    });
}

async function deleteCharacter(characterId) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHARACTERS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CHARACTERS_STORE_NAME);
        const request = store.delete(characterId);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('删除角色失败: ' + event.target.error);
    });
}


// 初始化数据库连接
initDB();
// --- Model Config Functions ---
async function saveModelConfig(configData) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CONFIGS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CONFIGS_STORE_NAME);
        const request = configData.id ? store.put(configData) : store.add(configData);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('保存模型配置失败: ' + event.target.error);
    });
}

async function getModelConfig(id) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CONFIGS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(CONFIGS_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('读取模型配置失败: ' + event.target.error);
    });
}

async function getAllModelConfigs() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CONFIGS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(CONFIGS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('读取所有模型配置失败: ' + event.target.error);
    });
}

async function deleteModelConfig(id) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CONFIGS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CONFIGS_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('删除模型配置失败: ' + event.target.error);
    });
}