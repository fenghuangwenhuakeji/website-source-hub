var db = {
    dbName: 'StoryDB',
    version: 4,
    _db: null,
    _mode: null,
    _prefix: 'SDB_',
    _initPromise: null,

    init: function() {
        var self = this;
        if (self._db) return Promise.resolve(self._db);
        if (self._initPromise) return self._initPromise;

        self._initPromise = new Promise(function(resolve) {
            // 尝试 IndexedDB，2秒超时降级
            var done = false;
            var timer = setTimeout(function() {
                if (done) return;
                done = true;
                console.warn('IndexedDB 不可用，使用 localStorage');
                self._initLS();
                resolve(self._db);
            }, 2000);

            try {
                var req = indexedDB.open(self.dbName, self.version);
                req.onsuccess = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    self._db = req.result;
                    self._mode = 'idb';
                    console.log('IndexedDB ready');
                    resolve(self._db);
                };
                req.onerror = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    self._initLS();
                    resolve(self._db);
                };
                req.onblocked = function() {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    self._initLS();
                    resolve(self._db);
                };
                req.onupgradeneeded = function(e) {
                    var d = e.target.result;
                    ['books','prompts','api_pool','memory_persistent','fusion_results','deconstruction_cache','marketReports'].forEach(function(n) {
                        var opt = n === 'prompts' ? {keyPath:'key'} : {keyPath:'id',autoIncrement:true};
                        if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, opt);
                    });
                };
            } catch(e) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                self._initLS();
                resolve(self._db);
            }
        });
        return self._initPromise;
    },

    _initLS: function() {
        this._mode = 'ls';
        this._db = true;
        this._ensureLSSpace();
    },

    _ensureLSSpace: function() {
        try {
            // 先测试能否写入
            var testKey = '__sdb_test__';
            localStorage.setItem(testKey, 'x');
            localStorage.removeItem(testKey);
        } catch(e) {
            // 写不进去，说明满了，执行清理
            console.warn('localStorage 已满，开始自动清理...');
            this._lsFullClean();
        }
    },

    _lsFullClean: function() {
        // 第1步: 清理所有非 SDB_ 前缀的数据（旧版残留）
        var toRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf(this._prefix) !== 0 && k !== 'storyforge_draft') {
                toRemove.push(k);
            }
        }
        for (var j = 0; j < toRemove.length; j++) {
            try { localStorage.removeItem(toRemove[j]); } catch(e) {}
        }
        if (toRemove.length > 0) console.log('已清理 ' + toRemove.length + ' 个非SDB旧数据项');

        // 第2步: 清理 SDB_ 中的缓存类数据（保留 books/prompts/api_pool）
        var cacheStores = ['fusion_results', 'deconstruction_cache', 'memory_persistent'];
        for (var c = 0; c < cacheStores.length; c++) {
            try { localStorage.removeItem(this._lsKey(cacheStores[c])); } catch(e) {}
        }

        // 第3步: 再测试一次
        try {
            localStorage.setItem('__sdb_test__', 'x');
            localStorage.removeItem('__sdb_test__');
            console.log('清理成功，空间已释放');
        } catch(e) {
            // 还是满的，最后手段：清空所有 SDB_ 数据
            console.warn('空间仍不足，清空所有 SDB_ 数据');
            var sdbKeys = [];
            for (var s = 0; s < localStorage.length; s++) {
                var sk = localStorage.key(s);
                if (sk && sk.indexOf(this._prefix) === 0) sdbKeys.push(sk);
            }
            for (var r = 0; r < sdbKeys.length; r++) {
                try { localStorage.removeItem(sdbKeys[r]); } catch(e2) {}
            }
        }
    },

    _lsKey: function(store) { return this._prefix + store; },
    _kp: function(store) { return store === 'prompts' ? 'key' : 'id'; },

    _lsRead: function(store) {
        try { return JSON.parse(localStorage.getItem(this._lsKey(store)) || '[]'); }
        catch(e) { return []; }
    },

    _lsWrite: function(store, arr) {
        try {
            localStorage.setItem(this._lsKey(store), JSON.stringify(arr));
        } catch(e) {
            if (e.name === 'QuotaExceededError') {
                // 尝试清理非关键数据后重试
                this._lsEmergencyClean(store);
                try {
                    localStorage.setItem(this._lsKey(store), JSON.stringify(arr));
                    return;
                } catch(e2) {
                    throw new Error('存储空间已满，请删除一些书籍或在控制台执行 localStorage.clear()');
                }
            }
            throw e;
        }
    },

    _lsEmergencyClean: function(keepStore) {
        // 第1步: 清理 SDB_ 缓存数据
        var cleanable = ['fusion_results', 'deconstruction_cache', 'memory_persistent'];
        for (var i = 0; i < cleanable.length; i++) {
            if (cleanable[i] !== keepStore) {
                try { localStorage.removeItem(this._lsKey(cleanable[i])); } catch(e) {}
            }
        }
        // 第2步: 清理所有非 SDB_ 前缀的数据
        var toRemove = [];
        for (var j = 0; j < localStorage.length; j++) {
            var k = localStorage.key(j);
            if (k && k.indexOf(this._prefix) !== 0 && k !== 'storyforge_draft') {
                toRemove.push(k);
            }
        }
        for (var r = 0; r < toRemove.length; r++) {
            try { localStorage.removeItem(toRemove[r]); } catch(e) {}
        }
        console.warn('已清理缓存数据释放空间 (清理了 ' + toRemove.length + ' 个非SDB项)');
    },

    getAll: function(store) {
        var self = this;
        return self.init().then(function() {
            if (self._mode === 'ls') return self._lsRead(store);
            return new Promise(function(resolve) {
                try {
                    var tx = self._db.transaction([store], 'readonly');
                    var r = tx.objectStore(store).getAll();
                    r.onsuccess = function() { resolve(r.result); };
                    r.onerror = function() { resolve([]); };
                } catch(e) { resolve([]); }
            });
        });
    },

    put: function(store, data) {
        var self = this;
        return self.init().then(function() {
            if (self._mode === 'ls') {
                var arr = self._lsRead(store);
                var kp = self._kp(store);
                var auto = (store === 'books' || store === 'api_pool');
                if (auto && !data[kp]) {
                    var max = 0;
                    arr.forEach(function(x) { if (x[kp] > max) max = x[kp]; });
                    data[kp] = max + 1;
                }
                var idx = -1;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][kp] === data[kp]) { idx = i; break; }
                }
                if (idx >= 0) arr[idx] = data; else arr.push(data);
                self._lsWrite(store, arr);
                return data[kp];
            }
            return new Promise(function(resolve, reject) {
                try {
                    var tx = self._db.transaction([store], 'readwrite');
                    var r = tx.objectStore(store).put(data);
                    r.onsuccess = function() { resolve(r.result); };
                    r.onerror = function() { reject(r.error); };
                } catch(e) { reject(e); }
            });
        });
    },

    delete: function(store, key) {
        var self = this;
        return self.init().then(function() {
            if (self._mode === 'ls') {
                var arr = self._lsRead(store);
                var kp = self._kp(store);
                self._lsWrite(store, arr.filter(function(x) { return x[kp] !== key; }));
                return;
            }
            return new Promise(function(resolve, reject) {
                try {
                    var tx = self._db.transaction([store], 'readwrite');
                    var r = tx.objectStore(store).delete(key);
                    r.onsuccess = function() { resolve(); };
                    r.onerror = function() { reject(r.error); };
                } catch(e) { reject(e); }
            });
        });
    }
};
