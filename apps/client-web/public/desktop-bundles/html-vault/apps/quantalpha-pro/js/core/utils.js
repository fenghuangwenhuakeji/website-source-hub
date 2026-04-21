// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - 工具函数库
// ═══════════════════════════════════════════════════════════════

const Utils = {
    // ═══ 时间处理 ═══
    formatDate: (ts, fmt = 'YYYY-MM-DD HH:mm') => {
        const d = new Date(ts);
        const o = {
            'YYYY': d.getFullYear(), 'MM': String(d.getMonth() + 1).padStart(2, '0'),
            'DD': String(d.getDate()).padStart(2, '0'), 'HH': String(d.getHours()).padStart(2, '0'),
            'mm': String(d.getMinutes()).padStart(2, '0'), 'ss': String(d.getSeconds()).padStart(2, '0')
        };
        let s = fmt;
        Object.keys(o).forEach(k => s = s.replace(k, o[k]));
        return s;
    },

    dateRange: (days = 30) => {
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    },

    tradingDays: (start, end) => {
        const days = [];
        let current = new Date(start);
        const endDate = new Date(end);
        while (current <= endDate) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) {
                days.push(current.toISOString().split('T')[0]);
            }
            current.setDate(current.getDate() + 1);
        }
        return days;
    },

    // ═══ 数字格式化 ═══
    formatNum: (n, decimals = 2) => {
        if (n === null || n === undefined || isNaN(n)) return '-';
        return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },

    formatPercent: (n, decimals = 2) => {
        if (n === null || n === undefined || isNaN(n)) return '-';
        const sign = n >= 0 ? '+' : '';
        return `${sign}${(n * 100).toFixed(decimals)}%`;
    },

    formatMoney: (n, currency = '¥') => {
        if (n === null || n === undefined || isNaN(n)) return '-';
        const abs = Math.abs(n);
        let val;
        if (abs >= 1e8) val = (n / 1e8).toFixed(2) + '亿';
        else if (abs >= 1e4) val = (n / 1e4).toFixed(2) + '万';
        else val = n.toFixed(2);
        return currency + val;
    },

    formatRatio: (n) => {
        if (n === null || n === undefined || isNaN(n)) return '-';
        return n.toFixed(4);
    },

    // ═══ ID生成 ═══
    genId: (prefix = '') => {
        const ts = Date.now().toString(36);
        const rand = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`;
    },

    genOrderId: () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `ORD${y}${m}${day}${rand}`;
    },

    // ═══ 数据处理 ═══
    calcReturns: (prices) => {
        if (!prices || prices.length < 2) return [];
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        return returns;
    },

    calcMean: (arr) => {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    },

    calcStd: (arr) => {
        if (!arr || arr.length === 0) return 0;
        const mean = Utils.calcMean(arr);
        const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
        return Math.sqrt(Utils.calcMean(squaredDiffs));
    },

    calcSharpe: (returns, riskFreeRate = 0.03) => {
        if (!returns || returns.length === 0) return 0;
        const mean = Utils.calcMean(returns) * 252; // 年化
        const std = Utils.calcStd(returns) * Math.sqrt(252); // 年化
        return std === 0 ? 0 : (mean - riskFreeRate) / std;
    },

    calcMaxDrawdown: (values) => {
        if (!values || values.length === 0) return 0;
        let maxVal = values[0];
        let maxDD = 0;
        for (const v of values) {
            if (v > maxVal) maxVal = v;
            const dd = (maxVal - v) / maxVal;
            if (dd > maxDD) maxDD = dd;
        }
        return maxDD;
    },

    calcWinRate: (trades) => {
        if (!trades || trades.length === 0) return 0;
        const wins = trades.filter(t => t.profit > 0).length;
        return wins / trades.length;
    },

    calcProfitFactor: (trades) => {
        if (!trades || trades.length === 0) return 0;
        let grossProfit = 0, grossLoss = 0;
        for (const t of trades) {
            if (t.profit > 0) grossProfit += t.profit;
            else grossLoss += Math.abs(t.profit);
        }
        return grossLoss === 0 ? Infinity : grossProfit / grossLoss;
    },

    // ═══ 技术指标 ═══
    SMA: (data, period) => {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) { result.push(null); continue; }
            let sum = 0;
            for (let j = 0; j < period; j++) sum += data[i - j];
            result.push(sum / period);
        }
        return result;
    },

    EMA: (data, period) => {
        const result = [];
        const multiplier = 2 / (period + 1);
        result[0] = data[0];
        for (let i = 1; i < data.length; i++) {
            result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
        }
        return result;
    },

    RSI: (data, period = 14) => {
        const result = [];
        let gains = 0, losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = data[i] - data[i - 1];
            if (change >= 0) gains += change;
            else losses -= change;
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        for (let i = 0; i < period; i++) result.push(null);
        result[period] = 100 - (100 / (1 + avgGain / avgLoss));
        
        for (let i = period + 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            avgGain = (avgGain * (period - 1) + (change >= 0 ? change : 0)) / period;
            avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
            result.push(100 - (100 / (1 + avgGain / avgLoss)));
        }
        return result;
    },

    MACD: (data, fast = 12, slow = 26, signal = 9) => {
        const emaFast = Utils.EMA(data, fast);
        const emaSlow = Utils.EMA(data, slow);
        const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
        const signalLine = Utils.EMA(macdLine.slice(26), signal);
        const histogram = macdLine.slice(26).map((v, i) => v - signalLine[i]);
        return { macd: macdLine, signal: signalLine, histogram };
    },

    BollingerBands: (data, period = 20, stdDev = 2) => {
        const sma = Utils.SMA(data, period);
        const upper = [], lower = [];
        
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                upper.push(null);
                lower.push(null);
                continue;
            }
            const slice = data.slice(i - period + 1, i + 1);
            const std = Utils.calcStd(slice);
            upper.push(sma[i] + stdDev * std);
            lower.push(sma[i] - stdDev * std);
        }
        return { middle: sma, upper, lower };
    },

    ATR: (high, low, close, period = 14) => {
        const tr = [high[0] - low[0]];
        for (let i = 1; i < high.length; i++) {
            const hl = high[i] - low[i];
            const hc = Math.abs(high[i] - close[i - 1]);
            const lc = Math.abs(low[i] - close[i - 1]);
            tr.push(Math.max(hl, hc, lc));
        }
        return Utils.SMA(tr, period);
    },

    // ═══ 本地存储 ═══
    saveLocal: (key, val) => {
        try { localStorage.setItem('qa_' + key, JSON.stringify(val)); return true; }
        catch (e) { console.error('saveLocal error:', e); return false; }
    },

    loadLocal: (key, def = null) => {
        try {
            const v = localStorage.getItem('qa_' + key);
            return v ? JSON.parse(v) : def;
        } catch { return def; }
    },

    removeLocal: (key) => {
        try { localStorage.removeItem('qa_' + key); } catch {}
    },

    // ═══ 文件操作 ═══
    downloadJSON: (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    downloadCSV: (data, filename) => {
        const csv = Array.isArray(data) ? data.map(row => 
            (Array.isArray(row) ? row : Object.values(row)).map(v => 
                typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',')
        ).join('\n') : data;
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    readCSV: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length === 0) { resolve([]); return; }
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const data = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = values[i]);
                    return obj;
                });
                resolve(data);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    // ═══ 颜色处理 ═══
    getProfitColor: (val) => {
        if (val > 0) return 'var(--profit)';
        if (val < 0) return 'var(--loss)';
        return 'var(--text-dim)';
    },

    getProfitClass: (val) => {
        if (val > 0) return 'profit';
        if (val < 0) return 'loss';
        return '';
    },

    // ═══ 防抖与节流 ═══
    debounce: (fn, delay = 300) => {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle: (fn, limit = 100) => {
        let inThrottle = false;
        return (...args) => {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ═══ 深拷贝 ═══
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(v => Utils.deepClone(v));
        const clone = {};
        for (const k in obj) {
            if (obj.hasOwnProperty(k)) clone[k] = Utils.deepClone(obj[k]);
        }
        return clone;
    },

    // ═══ 验证 ═══
    isValidNumber: (n) => !isNaN(parseFloat(n)) && isFinite(n),
    
    isValidDate: (d) => d instanceof Date && !isNaN(d.getTime()),

    // ═══ 随机数据生成 (测试用) ═══
    randomPrice: (base = 100, volatility = 0.02) => {
        return base * (1 + (Math.random() - 0.5) * 2 * volatility);
    },

    generateKline: (days = 100, startPrice = 100) => {
        const data = [];
        let price = startPrice;
        const now = Date.now();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const change = (Math.random() - 0.48) * 0.04; // 略微偏向上涨
            const open = price;
            const close = price * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * 0.02);
            const low = Math.min(open, close) * (1 - Math.random() * 0.02);
            const volume = Math.floor(Math.random() * 10000000 + 1000000);
            
            data.push({
                date: date.toISOString().split('T')[0],
                open: +open.toFixed(2),
                high: +high.toFixed(2),
                low: +low.toFixed(2),
                close: +close.toFixed(2),
                volume
            });
            
            price = close;
        }
        return data;
    }
};